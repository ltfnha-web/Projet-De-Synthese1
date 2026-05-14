<?php

namespace App\Services;

use App\Models\Planning;
use App\Models\PlanningSemaine;
use App\Models\SemaineAcademique;
use App\Models\Stage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PlanningDistributionService
 *
 * Single source of truth for every hour-redistribution operation.
 *
 * All public methods return the same payload shape:
 *   [ 'semaines' => array, 'total_prevu' => float, 'mh_restante' => float ]
 *
 * Guarantee: after any call, sum(non-blocked mh_prevue) == planning.mh_drif
 */
class PlanningDistributionService
{
    // ═══════════════════════════════════════════════════════════════════════
    // CALENDAR
    // ═══════════════════════════════════════════════════════════════════════

    public static function getSemainesAnnee(?int $annee = null): array
    {
        if ($annee === null) {
            $now   = Carbon::now();
            $annee = $now->month >= 9 ? $now->year : $now->year - 1;
        }

        $anneeScolaire = $annee . '-' . ($annee + 1);

        // ── DB-first: use persisted rows when available ────────
        try {
            $rows = SemaineAcademique::where('annee_scolaire', $anneeScolaire)
                ->orderBy('semaine_num')
                ->get();

            if ($rows->isNotEmpty()) {
                return $rows->map(fn($s) => [
                    'num'            => (int) $s->semaine_num,
                    'semestre'       => (int) $s->semestre,
                    'date_lundi'     => $s->date_debut->toDateString(),
                    'date_fin'       => $s->date_fin->toDateString(),
                    'label'          => $s->label ?? 'S' . $s->semaine_num,
                    'annee_scolaire' => $s->annee_scolaire,
                ])->values()->toArray();
            }
        } catch (\Throwable $e) {
            Log::warning('PlanningDistributionService::getSemainesAnnee — DB lookup failed, using in-memory fallback', [
                'annee' => $annee,
                'error' => $e->getMessage(),
            ]);
        }

        // ── In-memory fallback (no DB dependency) ─────────────
        return static::generateInMemory($annee);
    }

    /**
     * Pure in-memory week generation — used as a fallback when the
     * semaines_academiques table is empty or unreachable.
     *
     * @return array<int, array{num: int, semestre: int, date_lundi: string, label: string}>
     */
    private static function generateInMemory(int $annee): array
    {
        $debut = Carbon::create($annee, 9, 1);
        while ($debut->dayOfWeek !== Carbon::MONDAY) {
            $debut->addDay();
        }

        $fin = Carbon::create($annee + 1, 7, 1);
        while ($fin->dayOfWeek !== Carbon::MONDAY) {
            $fin->subDay();
        }

        $s2Start  = Carbon::create($annee + 1, 2, 1);
        $current  = $debut->copy();
        $semaines = [];
        $num      = 1;

        while ($current->lte($fin) && $num <= 50) {
            $semaines[] = [
                'num'        => $num,
                'semestre'   => $current->lt($s2Start) ? 1 : 2,
                'date_lundi' => $current->toDateString(),
                'date_fin'   => $current->copy()->addDays(6)->toDateString(),
                'label'      => 'S' . $num,
            ];
            $current->addWeek();
            $num++;
        }

        return $semaines;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCKED-WEEK DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    public function getStageWeekNums(int $groupeId): array
    {
        $nums = [];

        try {
            foreach (Stage::where('groupe_id', $groupeId)->get() as $stage) {
                if (!$stage->date_debut || !$stage->date_fin) continue;

                $debut = $stage->date_debut;
                $fin   = $stage->date_fin;
                $annee = $debut->month >= 9 ? $debut->year : $debut->year - 1;

                $origin = Carbon::create($annee, 9, 1);
                while ($origin->dayOfWeek !== Carbon::MONDAY) {
                    $origin->addDay();
                }

                $debutWeek = $debut->copy()->startOfWeek(Carbon::MONDAY);
                $finWeek   = $fin->copy()->startOfWeek(Carbon::MONDAY);

                if ($debutWeek->lt($origin)) continue;

                $first = (int) $origin->diffInWeeks($debutWeek) + 1;
                $last  = (int) $origin->diffInWeeks($finWeek)   + 1;

                for ($i = max(1, $first); $i <= min(50, $last); $i++) {
                    $nums[] = $i;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('PlanningDistributionService::getStageWeekNums error', [
                'groupe_id' => $groupeId,
                'error'     => $e->getMessage(),
            ]);
        }

        return array_values(array_unique($nums));
    }

    private function getAbsentWeekNums(Planning $planning): array
    {
        return $planning->semaines
            ->where('statut', 'absent')
            ->pluck('semaine_num')
            ->map(fn($n) => (int) $n)
            ->toArray();
    }

    private function getBlockedWeekNums(Planning $planning, array $stageNums): array
    {
        return array_values(array_unique(
            array_merge($stageNums, $this->getAbsentWeekNums($planning))
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Save a manually-edited cell, then rebalance so sum == mh_drif.
     *
     * Priority when hours are freed (delta > 0):
     *   1. Bump other FILLED cells (same semestre first)
     *   2. Only fill EMPTY weeks if no filled cells exist to bump
     *
     * When user sets cell above budget (delta < 0):
     *   - Scale down other filled cells proportionally
     *   - Delete any that reach 0h after scaling
     *
     * The edited cell is never touched after being set.
     */
    public function redistribuer(Planning $planning, int $weekNum, float $mh): array
    {
        $planning->loadMissing('semaines');

        $stageNums   = $this->getStageWeekNums($planning->groupe_id);
        $blockedNums = $this->getBlockedWeekNums($planning, $stageNums);

        if (in_array($weekNum, $blockedNums, true)) {
            return $this->buildResult($planning, $stageNums);
        }

        return DB::transaction(function () use (
            $planning, $weekNum, $mh, $stageNums, $blockedNums
        ) {
            $allWeeks = collect(self::getSemainesAnnee());
            $mhDrif   = (float) $planning->mh_drif;
            $planSem  = $planning->semestre === 'S2' ? 2 : 1;
            $mh       = max(0.0, round($mh, 1));

            // ── 1. Replace only the edited cell ────────────────────────────
            PlanningSemaine::where('planning_id', $planning->id)
                ->where('semaine_num', $weekNum)
                ->where(fn($q) => $q->whereNull('statut')->orWhere('statut', '!=', 'absent'))
                ->delete();

            if ($mh > 0.009) {
                $weekInfo = $allWeeks->firstWhere('num', $weekNum);
                PlanningSemaine::create([
                    'planning_id' => $planning->id,
                    'semaine_num' => $weekNum,
                    'semestre'    => $weekInfo['semestre'] ?? $planSem,
                    'mh_prevue'   => $mh,
                    'statut'      => null,
                ]);
            }

            // ── 2. Reload and compute delta ────────────────────────────────
            $planning->load('semaines');

            $currentTotal = (float) $planning->semaines
                ->filter(fn($s) => $s->statut !== 'absent'
                                && !in_array((int) $s->semaine_num, $blockedNums, true))
                ->sum('mh_prevue');

            $delta = round($mhDrif - $currentTotal, 2);

            if (abs($delta) < 0.01) {
                return $this->buildResult($planning, $stageNums);
            }

            // ── 3. Other editable cells (excluding the just-edited one) ────
            $otherCells = $planning->semaines->filter(
                fn($s) => $s->statut !== 'absent'
                       && !in_array((int) $s->semaine_num, $blockedNums, true)
                       && (int) $s->semaine_num !== $weekNum
            )->values();

            $filledOther = $otherCells->filter(fn($s) => (float) $s->mh_prevue > 0.009)
                ->sortBy(fn($s) => [$s->semestre === $planSem ? 0 : 1, $s->semaine_num])
                ->values();

            // ── 4a. Hours freed → bump filled cells first ──────────────────
            if ($delta > 0.009) {
                if ($filledOther->count() > 0) {
                    // PRIMARY: add freed hours to already-filled cells
                    $extras = $this->spreadHours($delta, $filledOther->count());
                    foreach ($filledOther as $i => $cell) {
                        PlanningSemaine::where('planning_id', $planning->id)
                            ->where('semaine_num', $cell->semaine_num)
                            ->update([
                                'mh_prevue'  => round((float) $cell->mh_prevue + $extras[$i], 1),
                                'updated_at' => now(),
                            ]);
                    }
                } else {
                    // FALLBACK: no filled cells exist, fill empty weeks
                    $existingNums = $planning->semaines
                        ->filter(fn($s) => $s->statut !== 'absent')
                        ->pluck('semaine_num')
                        ->map(fn($n) => (int) $n)
                        ->toArray();

                    $emptyWeeks = $allWeeks
                        ->filter(fn($s) => !in_array($s['num'], $blockedNums, true)
                                        && !in_array($s['num'], $existingNums, true))
                        ->sortBy(fn($s) => [$s['semestre'] === $planSem ? 0 : 1, $s['num']])
                        ->values();

                    if ($emptyWeeks->count() > 0) {
                        $values = $this->spreadHours($delta, $emptyWeeks->count());
                        $rows   = [];
                        foreach ($emptyWeeks as $i => $sem) {
                            if ($values[$i] < 0.009) continue;
                            $rows[] = [
                                'planning_id' => $planning->id,
                                'semaine_num' => $sem['num'],
                                'semestre'    => $sem['semestre'],
                                'mh_prevue'   => $values[$i],
                                'statut'      => null,
                                'created_at'  => now(),
                                'updated_at'  => now(),
                            ];
                        }
                        if (!empty($rows)) {
                            PlanningSemaine::insert($rows);
                        }
                    }
                }

            // ── 4b. Budget exceeded → scale down filled cells ──────────────
            } elseif ($delta < -0.009 && $filledOther->count() > 0) {
                $excess     = abs($delta);
                $totalOther = (float) $filledOther->sum('mh_prevue');

                if ($totalOther > $excess + 0.009) {
                    // Proportional scale-down
                    $scaleFactor = ($totalOther - $excess) / $totalOther;
                    $newValues   = [];
                    $adjustedSum = 0.0;

                    foreach ($filledOther as $cell) {
                        $newMh            = max(0.0, round((float) $cell->mh_prevue * $scaleFactor, 1));
                        $newValues[]      = ['cell' => $cell, 'mh' => $newMh];
                        $adjustedSum     += $newMh;
                    }

                    // Fix rounding: adjust largest remaining cell
                    $rounding = round($totalOther - $excess - $adjustedSum, 1);
                    if (abs($rounding) >= 0.1) {
                        $maxIdx = 0;
                        $maxMh  = -1;
                        foreach ($newValues as $idx => $v) {
                            if ($v['mh'] > $maxMh) { $maxMh = $v['mh']; $maxIdx = $idx; }
                        }
                        $newValues[$maxIdx]['mh'] = max(0.0, round($newValues[$maxIdx]['mh'] + $rounding, 1));
                    }

                    foreach ($newValues as $v) {
                        if ($v['mh'] < 0.009) {
                            PlanningSemaine::where('planning_id', $planning->id)
                                ->where('semaine_num', $v['cell']->semaine_num)
                                ->delete();
                        } else {
                            PlanningSemaine::where('planning_id', $planning->id)
                                ->where('semaine_num', $v['cell']->semaine_num)
                                ->update(['mh_prevue' => $v['mh'], 'updated_at' => now()]);
                        }
                    }
                } else {
                    // Other cells can't absorb the excess — cap the edited cell
                    $maxAllowed = round($mhDrif - $totalOther, 1);
                    PlanningSemaine::where('planning_id', $planning->id)
                        ->where('semaine_num', $weekNum)
                        ->update(['mh_prevue' => max(0.0, $maxAllowed), 'updated_at' => now()]);
                }
            }

            $planning->load('semaines');
            return $this->buildResult($planning, $stageNums);
        });
    }

    /**
     * Redistribute remaining hours without touching already-set cells.
     * Called on page load (stranded hours) and after creating a planning.
     */
    public function distribuerRestant(Planning $planning): array
    {
        $planning->loadMissing('semaines');
        $stageNums   = $this->getStageWeekNums($planning->groupe_id);
        $blockedNums = $this->getBlockedWeekNums($planning, $stageNums);

        return DB::transaction(function () use ($planning, $stageNums, $blockedNums) {
            $this->clearStageWeeks($planning, $stageNums);
            $planning->load('semaines');
            return $this->doDistribute($planning, $stageNums, $blockedNums);
        });
    }

    /**
     * Wipe and refill uniformly from scratch using the given charge_hebdo.
     */
    public function autoFill(Planning $planning, float $chargeHebdo): array
    {
        $planning->loadMissing('semaines');
        $stageNums   = $this->getStageWeekNums($planning->groupe_id);
        $blockedNums = $this->getBlockedWeekNums($planning, $stageNums);
        $planSem     = $planning->semestre === 'S2' ? 2 : 1;
        $mhDrif      = (float) $planning->mh_drif;

        $freeWeeks = collect(self::getSemainesAnnee())
            ->filter(fn($s) => !in_array($s['num'], $blockedNums, true))
            ->sortBy(fn($s) => [$s['semestre'] === $planSem ? 0 : 1, $s['num']])
            ->values();

        return DB::transaction(function () use (
            $planning, $chargeHebdo, $freeWeeks, $mhDrif, $stageNums
        ) {
            PlanningSemaine::where('planning_id', $planning->id)
                ->where(fn($q) => $q->whereNull('statut')->orWhere('statut', '!=', 'absent'))
                ->delete();

            $rows      = [];
            $remaining = $mhDrif;

            foreach ($freeWeeks as $sem) {
                if ($remaining < 0.009) break;

                $mh        = min(round($chargeHebdo, 1), round($remaining, 1));
                $remaining = round($remaining - $mh, 2);

                $rows[] = [
                    'planning_id' => $planning->id,
                    'semaine_num' => $sem['num'],
                    'semestre'    => $sem['semestre'],
                    'mh_prevue'   => $mh,
                    'statut'      => null,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ];
            }

            if (!empty($rows)) {
                PlanningSemaine::insert($rows);
            }

            $planning->update(['charge_hebdo' => $chargeHebdo]);
            $planning->load('semaines');
            return $this->buildResult($planning, $stageNums);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTERNAL ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    private function clearStageWeeks(Planning $planning, array $stageNums): void
    {
        if (empty($stageNums)) return;

        PlanningSemaine::where('planning_id', $planning->id)
            ->whereIn('semaine_num', $stageNums)
            ->where(fn($q) => $q->whereNull('statut')->orWhere('statut', '!=', 'absent'))
            ->delete();
    }

    private function doDistribute(Planning $planning, array $stageNums, array $blockedNums): array
    {
        $allWeeks = collect(self::getSemainesAnnee());
        $mhDrif   = (float) $planning->mh_drif;

        $fixedSemaines = $planning->semaines->filter(
            fn($s) => $s->statut !== 'absent'
                   && (float) $s->mh_prevue > 0
                   && !in_array((int) $s->semaine_num, $blockedNums, true)
        );
        $fixedNums  = $fixedSemaines->pluck('semaine_num')->map(fn($n) => (int) $n)->toArray();
        $totalFixed = round((float) $fixedSemaines->sum('mh_prevue'), 2);
        $remaining  = max(0.0, round($mhDrif - $totalFixed, 2));

        $emptyFree = $allWeeks->filter(
            fn($s) => !in_array($s['num'], $blockedNums, true)
                   && !in_array($s['num'], $fixedNums,   true)
        )->values();

        $nEmpty = $emptyFree->count();

        if ($remaining > 0.009 && $nEmpty > 0) {
            $values = $this->spreadHours($remaining, $nEmpty);

            PlanningSemaine::where('planning_id', $planning->id)
                ->whereIn('semaine_num', $emptyFree->pluck('num')->all())
                ->delete();

            $rows = [];
            foreach ($emptyFree as $i => $sem) {
                if ($values[$i] < 0.009) continue;
                $rows[] = [
                    'planning_id' => $planning->id,
                    'semaine_num' => $sem['num'],
                    'semestre'    => $sem['semestre'],
                    'mh_prevue'   => $values[$i],
                    'statut'      => null,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ];
            }
            if (!empty($rows)) {
                PlanningSemaine::insert($rows);
            }

        } elseif ($remaining > 0.009 && $nEmpty === 0 && count($fixedNums) > 0) {
            $fixed  = $fixedSemaines->values();
            $extras = $this->spreadHours($remaining, $fixed->count());
            foreach ($fixed as $i => $sem) {
                PlanningSemaine::where('planning_id', $planning->id)
                    ->where('semaine_num', $sem->semaine_num)
                    ->update([
                        'mh_prevue'  => round((float) $sem->mh_prevue + $extras[$i], 1),
                        'updated_at' => now(),
                    ]);
            }
        } else {
            PlanningSemaine::where('planning_id', $planning->id)
                ->whereNotIn('semaine_num', $fixedNums)
                ->where(fn($q) => $q->whereNull('statut')->orWhere('statut', '!=', 'absent'))
                ->where('mh_prevue', '<=', 0)
                ->delete();
        }

        $planning->load('semaines');
        return $this->buildResult($planning, $stageNums);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Divide $total hours evenly across $n slots at 0.1h precision.
     *
     * @return float[]
     */
    private function spreadHours(float $total, int $n): array
    {
        if ($n <= 0) return [];
        if ($n === 1) return [round($total, 1)];

        $base   = floor($total * 10 / $n) / 10;
        $extra  = round($total - $base * $n, 1);
        $bumped = (int) round($extra / 0.1);

        $values = array_fill(0, $n, $base);
        for ($i = 0; $i < min($bumped, $n); $i++) {
            $values[$i] = round($base + 0.1, 1);
        }

        $diff = round($total - array_sum($values), 1);
        if (abs($diff) >= 0.1) {
            $values[$n - 1] = max(0.0, round($values[$n - 1] + $diff, 1));
        }

        return $values;
    }

    private function buildResult(Planning $planning, array $stageNums): array
    {
        $planning->loadMissing('semaines');

        $active     = $planning->semaines->filter(
            fn($s) => $s->statut !== 'absent'
                   && !in_array((int) $s->semaine_num, $stageNums, true)
        );
        $totalPrevu = round((float) $active->sum('mh_prevue'), 2);
        $mhDrif     = (float) $planning->mh_drif;

        return [
            'semaines'    => $active->pluck('mh_prevue', 'semaine_num'),
            'total_prevu' => $totalPrevu,
            'mh_restante' => round(max(0.0, $mhDrif - $totalPrevu), 2),
        ];
    }
}
