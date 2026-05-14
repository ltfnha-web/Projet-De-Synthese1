<?php

namespace App\Http\Controllers;

use App\Models\Planning;
use App\Models\PlanningSemaine;
use App\Services\PlanningDistributionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PlanningController extends Controller
{
    public function __construct(private PlanningDistributionService $svc) {}

    public static function getSemainesAnnee(?int $annee = null): array
    {
        return PlanningDistributionService::getSemainesAnnee($annee);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GET /plannings
    // ═══════════════════════════════════════════════════════════════════════
    public function index(Request $request)
    {
        $annee    = (int) ($request->annee ?? 0) ?: null;
        $semaines = self::getSemainesAnnee($annee);

        $plannings = Planning::with(['groupe', 'module', 'formateur', 'semaines'])
            ->when($request->filled('groupe_id'), fn($q) => $q->where('groupe_id', $request->groupe_id))
            ->when($request->filled('semestre'),  fn($q) => $q->where('semestre',  $request->semestre))
            ->get()
            ->map(fn($p) => $this->formatPlanning($p, $semaines));

        $today           = Carbon::today();
        $semaineCourante = collect($semaines)->first(function ($s) use ($today) {
            $lundi  = Carbon::parse($s['date_lundi']);
            $samedi = $lundi->copy()->addDays(6);
            return $today->between($lundi, $samedi);
        });

        $anneeVal = $annee ?? $this->getAnneeCourante();

        return response()->json([
            'plannings'        => $plannings,
            'semaines_annee'   => $semaines,
            'annee_scolaire'   => $anneeVal . '-' . ($anneeVal + 1),
            'is_active'        => $semaineCourante !== null,
            'semaine_courante' => $semaineCourante,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /plannings
    // ═══════════════════════════════════════════════════════════════════════
    public function store(Request $request)
    {
        $validated = $request->validate([
            'groupe_id'    => 'required|integer|exists:groupes,id',
            'module_id'    => 'required|integer|exists:modules,id',
            'formateur_id' => 'required|integer|exists:formateurs,id',
            'semestre'     => 'required|in:S1,S2',
            'mh_drif'      => 'required|integer|min:1|max:9999',
            'type'         => 'nullable|in:Régionale,Locale',
            'mode'         => 'nullable|string|in:PRESENTIEL,DISTANCIEL',
            'charge_hebdo' => 'nullable|numeric|min:0.5|max:50',
        ], [
            'groupe_id.required'    => 'Le groupe est obligatoire.',
            'groupe_id.exists'      => 'Groupe introuvable.',
            'module_id.required'    => 'Le module est obligatoire.',
            'module_id.exists'      => 'Module introuvable.',
            'formateur_id.required' => 'Le formateur est obligatoire.',
            'formateur_id.exists'   => 'Formateur introuvable.',
            'semestre.required'     => 'Le semestre est obligatoire.',
            'mh_drif.required'      => 'La masse horaire DRIF est obligatoire.',
            'mh_drif.integer'       => 'La masse horaire doit être un entier.',
            'mh_drif.min'           => 'La masse horaire doit être supérieure à 0.',
            'charge_hebdo.min'      => 'La charge hebdomadaire doit être d\'au moins 0.5h.',
        ]);

        try {
            $planning = DB::transaction(function () use ($validated) {
                $planning = Planning::create([
                    'groupe_id'       => $validated['groupe_id'],
                    'module_id'       => $validated['module_id'],
                    'formateur_id'    => $validated['formateur_id'],
                    'semestre'        => $validated['semestre'],
                    'mh_drif'         => $validated['mh_drif'],
                    'type'            => $validated['type']     ?? 'Régionale',
                    'mode'            => $validated['mode']     ?? 'PRESENTIEL',
                    'charge_hebdo'    => $validated['charge_hebdo'] ?? 0,
                    'mh_realisee'     => 0,
                    'semaines_faites' => 0,
                    'statut'          => 'En cours',
                ]);

                if (!empty($validated['charge_hebdo'])) {
                    $this->svc->autoFill($planning, (float) $validated['charge_hebdo']);
                } else {
                    $this->svc->distribuerRestant($planning);
                }

                return $planning;
            });

            return response()->json([
                'data' => $planning->fresh()->load(['groupe', 'module', 'formateur', 'semaines']),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Données invalides.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('PlanningController::store failed', [
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
                'payload' => $validated ?? $request->all(),
            ]);
            return response()->json([
                'message' => 'Erreur lors de la création du planning : ' . $e->getMessage(),
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUT /plannings/{id}
    // ═══════════════════════════════════════════════════════════════════════
    public function update(Request $request, $id)
    {
        $planning = Planning::with('semaines')->findOrFail($id);

        $validated = $request->validate([
            'formateur_id' => 'sometimes|integer|exists:formateurs,id',
            'semestre'     => 'sometimes|in:S1,S2',
            'mh_drif'      => 'sometimes|integer|min:1|max:9999',
            'charge_hebdo' => 'nullable|numeric|min:0|max:50',
            'type'         => 'nullable|in:Régionale,Locale',
            'mode'         => 'nullable|string|in:PRESENTIEL,DISTANCIEL',
        ]);

        try {
            DB::transaction(function () use ($planning, $validated) {
                $oldSemestre = $planning->semestre;
                $newSemestre = $validated['semestre'] ?? $oldSemestre;
                $oldMhDrif   = (int) $planning->mh_drif;
                $newMhDrif   = isset($validated['mh_drif']) ? (int) $validated['mh_drif'] : $oldMhDrif;

                $planning->update([
                    'formateur_id' => $validated['formateur_id'] ?? $planning->formateur_id,
                    'semestre'     => $newSemestre,
                    'mh_drif'      => $newMhDrif,
                    'charge_hebdo' => array_key_exists('charge_hebdo', $validated)
                                        ? ($validated['charge_hebdo'] ?? $planning->charge_hebdo)
                                        : $planning->charge_hebdo,
                    'type'         => $validated['type'] ?? $planning->type,
                    'mode'         => $validated['mode'] ?? $planning->mode,
                ]);

                if ($oldSemestre !== $newSemestre) {
                    $this->shiftSemaineNums($planning, $oldSemestre, $newSemestre);
                }

                // Re-distribute if mh_drif changed
                if ($newMhDrif !== $oldMhDrif) {
                    $planning->load('semaines');
                    $charge = (float) ($validated['charge_hebdo'] ?? $planning->charge_hebdo ?? 0);
                    if ($charge > 0) {
                        $this->svc->autoFill($planning->fresh(), $charge);
                    } else {
                        $this->svc->distribuerRestant($planning->fresh());
                    }
                }
            });

            $fresh    = $planning->fresh()->load(['groupe', 'module', 'formateur', 'semaines']);
            $semaines = self::getSemainesAnnee();
            return response()->json([
                'planning' => $this->formatPlanning($fresh, $semaines),
            ]);

        } catch (\Throwable $e) {
            Log::error('PlanningController::update failed', [
                'id'    => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage(),
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /plannings/{id}/redistribuer   — manual cell edit
    // ═══════════════════════════════════════════════════════════════════════
    public function redistribuer(Request $request, Planning $planning)
    {
        $data = $request->validate([
            'semaine_num' => 'required|integer|min:1|max:50',
            'mh_prevue'   => 'required|numeric|min:0|max:' . max(50, (int) $planning->mh_drif),
        ]);

        try {
            $result = $this->svc->redistribuer(
                $planning,
                (int)   $data['semaine_num'],
                (float) $data['mh_prevue']
            );
            return response()->json(array_merge(['ok' => true], $result));
        } catch (\Throwable $e) {
            Log::error('PlanningController::redistribuer failed', [
                'planning_id' => $planning->id,
                'error'       => $e->getMessage(),
            ]);
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /plannings/{id}/distribuer-restant
    // ═══════════════════════════════════════════════════════════════════════
    public function distribuerRestant(Planning $planning)
    {
        try {
            $result = $this->svc->distribuerRestant($planning);
            return response()->json(array_merge(['ok' => true], $result));
        } catch (\Throwable $e) {
            Log::error('PlanningController::distribuerRestant failed', [
                'planning_id' => $planning->id,
                'error'       => $e->getMessage(),
            ]);
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /plannings/{id}/auto-distribuer
    // ═══════════════════════════════════════════════════════════════════════
    public function autoDistribuerRoute(Request $request, Planning $planning)
    {
        $data = $request->validate([
            'charge_hebdo' => 'required|numeric|min:0.5|max:50',
        ]);

        try {
            $result = $this->svc->autoFill($planning, (float) $data['charge_hebdo']);
            return response()->json(array_merge(['ok' => true], $result));
        } catch (\Throwable $e) {
            Log::error('PlanningController::autoDistribuerRoute failed', [
                'planning_id' => $planning->id,
                'error'       => $e->getMessage(),
            ]);
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUT /plannings/{id}/semaine   — legacy alias
    // ═══════════════════════════════════════════════════════════════════════
    public function updateSemaine(Request $request, Planning $planning)
    {
        $data = $request->validate([
            'semaine_num' => 'required|integer|min:1|max:50',
            'mh_prevue'   => 'required|numeric|min:0|max:' . max(50, (int) $planning->mh_drif),
        ]);

        try {
            $result = $this->svc->redistribuer(
                $planning,
                (int)   $data['semaine_num'],
                (float) $data['mh_prevue']
            );
            return response()->json(array_merge(['ok' => true], $result));
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETE /plannings/{id}
    // ═══════════════════════════════════════════════════════════════════════
    public function destroy(Planning $planning)
    {
        $planning->delete();
        return response()->json(['message' => 'Supprimé avec succès']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETE /plannings/all
    // ═══════════════════════════════════════════════════════════════════════
    public function destroyAll(Request $request)
    {
        $groupeId = $request->query('groupe_id');

        if ($groupeId) {
            $ids = Planning::where('groupe_id', $groupeId)->pluck('id');
            PlanningSemaine::whereIn('planning_id', $ids)->delete();
            Planning::where('groupe_id', $groupeId)->delete();
            return response()->json(['message' => 'Plannings du groupe supprimés avec succès']);
        }

        PlanningSemaine::query()->delete();
        Planning::query()->delete();
        return response()->json(['message' => 'Tous les plannings supprimés avec succès']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private function formatPlanning(Planning $p, array $semaines): array
    {
        $mhDrif         = (float) ($p->mh_drif ?? 0);
        $absentNums     = $p->semaines->where('statut', 'absent')->pluck('semaine_num')->toArray();
        $activeSemaines = $p->semaines->filter(fn($s) => $s->statut !== 'absent');
        $totalPrevu     = round((float) $activeSemaines->sum('mh_prevue'), 2);
        $mhRestante     = max(0.0, $mhDrif - $totalPrevu);

        $mhRealiseeModule = (float) ($p->module?->mh_realisee_globale ?? 0);
        $avce             = $mhDrif > 0 ? round(($mhRealiseeModule / $mhDrif) * 100, 1) : 0;

        $semestreNum    = $p->semestre === 'S2' ? 2 : 1;
        $plannedNums    = $activeSemaines->pluck('semaine_num')->toArray();
        $remainingWeeks = collect($semaines)
            ->where('semestre', $semestreNum)
            ->filter(fn($s) => !in_array($s['num'], $plannedNums) && !in_array($s['num'], $absentNums))
            ->count();

        return [
            'id'                 => $p->id,
            'groupe_id'          => $p->groupe_id,
            'groupe_nom'         => $p->groupe?->nom ?? $p->groupe?->code ?? '—',
            'module_id'          => $p->module_id,
            'module_nom'         => $p->module?->intitule ?? '—',
            'formateur_id'       => $p->formateur_id,
            'formateur_nom'      => $p->formateur?->nom ?? '—',
            'semestre'           => $p->semestre,
            'mh_drif'            => $mhDrif,
            'mh_realisee'        => $p->mh_realisee ?? 0,
            'mh_realisee_module' => $mhRealiseeModule,
            'avce'               => $avce,
            'avc_reel'           => $avce,
            'mh_restante'        => $mhRestante,
            'mh_restante_reelle' => max(0.0, $mhDrif - $mhRealiseeModule),
            'masse_par_semaine'  => $remainingWeeks > 0 ? round($mhRestante / $remainingWeeks, 2) : 0,
            'remaining_weeks'    => $remainingWeeks,
            'total_prevu'        => $totalPrevu,
            'type'               => $p->type  ?? 'Régionale',
            'mode'               => $p->mode  ?? 'PRESENTIEL',
            'charge_hebdo'       => (float) ($p->charge_hebdo ?? 0),
            'semaines'           => $p->semaines->pluck('mh_prevue', 'semaine_num'),
            'semaines_absentes'  => $p->semaines->where('statut', 'absent')
                                        ->pluck('semaine_num')->values()->toArray(),
        ];
    }

    private function shiftSemaineNums(Planning $planning, string $from, string $to): void
    {
        foreach ($planning->semaines as $s) {
            $s->update(['semaine_num' => $s->semaine_num + 100]);
        }

        $shift     = ($from === 'S1' && $to === 'S2') ? 22 : -22;
        $newSemNum = $to === 'S2' ? 2 : 1;

        foreach ($planning->fresh()->semaines as $s) {
            $s->update([
                'semaine_num' => max(1, min(50, $s->semaine_num - 100 + $shift)),
                'semestre'    => $newSemNum,
            ]);
        }
    }

    private function getAnneeCourante(): int
    {
        $now = Carbon::now();
        return $now->month >= 9 ? $now->year : $now->year - 1;
    }
}
