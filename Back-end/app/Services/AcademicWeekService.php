<?php

namespace App\Services;

use App\Models\SemaineAcademique;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * AcademicWeekService
 *
 * Single source of truth for generating and persisting academic weeks.
 *
 * An academic year runs from the first Monday on-or-after September 1
 * through the last Monday on-or-before June 30 of the following calendar year.
 *
 * Semester split:
 *   S1 → weeks whose Monday falls before February 1 (annee+1)
 *   S2 → weeks whose Monday falls on or after February 1 (annee+1)
 */
class AcademicWeekService
{
    // ── Static helpers ────────────────────────────────────────

    /**
     * Return the starting calendar year of the current academic year.
     * e.g. called in October 2025 → 2025; called in March 2026 → 2025
     */
    public static function currentYear(): int
    {
        $now = Carbon::now();
        return $now->month >= 9 ? $now->year : $now->year - 1;
    }

    /**
     * Return the "YYYY-YYYY+1" label for the given starting year.
     */
    public static function label(int $annee): string
    {
        return $annee . '-' . ($annee + 1);
    }

    // ── Generation ────────────────────────────────────────────

    /**
     * Generate academic-week data for one school year without touching the DB.
     *
     * The algorithm mirrors PlanningDistributionService::getSemainesAnnee()
     * so that persisted rows and in-memory rows are always identical.
     *
     * @return array<int, array{
     *   annee_scolaire: string,
     *   semaine_num: int,
     *   date_debut: string,
     *   date_fin: string,
     *   semestre: int,
     *   label: string
     * }>
     */
    public function generate(int $annee): array
    {
        // First Monday on-or-after September 1
        $debut = Carbon::create($annee, 9, 1);
        while ($debut->dayOfWeek !== Carbon::MONDAY) {
            $debut->addDay();
        }

        // Last Monday on-or-before June 30 of annee+1
        // (mirrors the existing getSemainesAnnee logic which subtracts days from July 1)
        $fin = Carbon::create($annee + 1, 7, 1);
        while ($fin->dayOfWeek !== Carbon::MONDAY) {
            $fin->subDay();
        }

        $s2Start       = Carbon::create($annee + 1, 2, 1);
        $current       = $debut->copy();
        $anneeScolaire = self::label($annee);
        $semaines      = [];
        $num           = 1;

        while ($current->lte($fin) && $num <= 50) {
            $semaines[] = [
                'annee_scolaire' => $anneeScolaire,
                'semaine_num'    => $num,
                'date_debut'     => $current->toDateString(),
                'date_fin'       => $current->copy()->addDays(6)->toDateString(),
                'semestre'       => $current->lt($s2Start) ? 1 : 2,
                'label'          => 'S' . $num,
            ];

            $current->addWeek();
            $num++;
        }

        return $semaines;
    }

    // ── Persistence ───────────────────────────────────────────

    /**
     * Persist academic weeks for one school year.
     *
     * @param  int  $annee  Starting calendar year (e.g. 2025 for 2025-2026)
     * @param  bool $force  Delete existing rows before re-inserting
     * @return int          Number of rows inserted (0 if already existed and $force=false)
     */
    public function persist(int $annee, bool $force = false): int
    {
        $label = self::label($annee);

        if (!$force && SemaineAcademique::where('annee_scolaire', $label)->exists()) {
            return 0;
        }

        $weeks = $this->generate($annee);
        if (empty($weeks)) {
            return 0;
        }

        if ($force) {
            SemaineAcademique::where('annee_scolaire', $label)->delete();
        }

        $now  = now();
        $rows = array_map(fn($w) => array_merge($w, [
            'created_at' => $now,
            'updated_at' => $now,
        ]), $weeks);

        // insertOrIgnore handles any race-condition duplicates gracefully
        foreach (array_chunk($rows, 50) as $chunk) {
            SemaineAcademique::insertOrIgnore($chunk);
        }

        return count($rows);
    }

    /**
     * Persist weeks for multiple consecutive academic years.
     *
     * @param  int  $startAnnee  First starting year
     * @param  int  $count       Number of years to generate
     * @param  bool $force
     * @return array<string, int> Map of annee_scolaire → rows inserted
     */
    public function persistRange(int $startAnnee, int $count = 1, bool $force = false): array
    {
        $results = [];
        for ($i = 0; $i < $count; $i++) {
            $annee           = $startAnnee + $i;
            $results[self::label($annee)] = $this->persist($annee, $force);
        }
        return $results;
    }

    /**
     * Ensure weeks exist in the DB for the given year, auto-generating if missing.
     * Silently skips on DB errors so callers can fall back to in-memory generation.
     */
    public function ensure(int $annee): void
    {
        try {
            if (!SemaineAcademique::where('annee_scolaire', self::label($annee))->exists()) {
                $this->persist($annee);
            }
        } catch (\Throwable $e) {
            Log::warning('AcademicWeekService::ensure failed', [
                'annee' => $annee,
                'error' => $e->getMessage(),
            ]);
        }
    }

    // ── Retrieval ─────────────────────────────────────────────

    /**
     * Get all weeks for a year from the DB, auto-persisting if not yet stored.
     * Returns a sorted Collection of SemaineAcademique models.
     */
    public function getOrGenerate(int $annee): Collection
    {
        $this->ensure($annee);

        return SemaineAcademique::where('annee_scolaire', self::label($annee))
            ->orderBy('semaine_num')
            ->get();
    }

    /**
     * Convert a Collection of SemaineAcademique models to the legacy calendar-array
     * format expected by PlanningDistributionService and PlanningController.
     *
     * Legacy keys: num, semestre, date_lundi, label
     * Extra keys added: date_fin, annee_scolaire  (backwards-compatible)
     *
     * @param  Collection<SemaineAcademique> $models
     * @return array<int, array{num: int, semestre: int, date_lundi: string, date_fin: string, label: string, annee_scolaire: string}>
     */
    public function toCalendarArray(Collection $models): array
    {
        return $models->map(fn(SemaineAcademique $s) => [
            'num'            => $s->semaine_num,
            'semestre'       => $s->semestre,
            'date_lundi'     => $s->date_debut->toDateString(),
            'date_fin'       => $s->date_fin->toDateString(),
            'label'          => $s->label ?? 'S' . $s->semaine_num,
            'annee_scolaire' => $s->annee_scolaire,
        ])->values()->toArray();
    }

    /**
     * List all distinct academic years that have been persisted.
     *
     * @return string[]  e.g. ["2024-2025", "2025-2026"]
     */
    public function listPersistedYears(): array
    {
        return SemaineAcademique::select('annee_scolaire')
            ->distinct()
            ->orderBy('annee_scolaire')
            ->pluck('annee_scolaire')
            ->toArray();
    }
}
