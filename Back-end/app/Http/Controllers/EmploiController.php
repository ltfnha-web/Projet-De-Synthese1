<?php

namespace App\Http\Controllers;

use App\Models\EmploiDuTemps;
use App\Models\EmploiSeance;
use App\Models\Formateur;
use App\Models\Planning;
use App\Models\Salle;
use App\Services\ClassroomConflictService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmploiController extends Controller
{
    const SEANCES_COUNT = 4;
    const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    public function __construct(private ClassroomConflictService $conflictService) {}

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/emplois
    // ─────────────────────────────────────────────────────────────────────────
    public function index()
    {
        $emplois = EmploiDuTemps::with('groupe')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($e) => [
                'id'           => $e->id,
                'groupe'       => $e->groupe?->nom ?? $e->groupe?->code ?? '—',
                'groupe_id'    => $e->groupe_id,
                'periodeDebut' => $e->periode_debut?->format('d/m/Y'),
                'semestre'     => $e->semestre,
                'valide'       => $e->valide,
            ]);

        return response()->json(['data' => $emplois]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/emplois
    // ─────────────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'groupe_id'  => 'required|exists:groupes,id',
            'date_debut' => 'required|date',
            'semestre'   => 'required|in:S1,S2',
            'grille'     => 'required|array',
        ]);

        $seances = $this->parseGrille($request->grille, $request->semestre);

        // Pre-flight conflict check (application layer)
        $conflicts = $this->conflictService->checkConflicts($seances);
        if (!empty($conflicts)) {
            return response()->json([
                'message'   => 'Conflits de salles détectés.',
                'conflicts' => array_column($conflicts, 'message'),
            ], 422);
        }

        try {
            $emploi = DB::transaction(function () use ($request, $seances) {
                $emploi = EmploiDuTemps::create([
                    'groupe_id'     => $request->groupe_id,
                    'created_by'    => $request->user()->id,
                    'periode_debut' => $request->date_debut,
                    'semestre'      => $request->semestre,
                    'grille'        => $request->grille,
                    'valide'        => false,
                ]);

                foreach ($seances as $s) {
                    EmploiSeance::create(['emploi_id' => $emploi->id] + $s);
                }

                return $emploi;
            });
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json([
                    'message' => 'Conflit de salle détecté au niveau base de données. Veuillez vérifier votre emploi du temps.',
                ], 409);
            }
            throw $e;
        }

        return response()->json(['data' => $emploi->load('groupe')], 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/emplois/generate-from-plannings
    // ─────────────────────────────────────────────────────────────────────────
    public function generateFromPlannings(Request $request)
    {
        $request->validate([
            'groupe_id'  => 'required|exists:groupes,id',
            'semestre'   => 'required|in:S1,S2',
            'date_debut' => 'required|date',
        ]);

        $plannings = Planning::with(['module', 'formateur'])
            ->where('groupe_id', $request->groupe_id)
            ->where('semestre', $request->semestre)
            ->get();

        if ($plannings->isEmpty()) {
            return response()->json([
                'message' => "Aucun planning trouvé pour ce groupe en {$request->semestre}."
            ], 422);
        }

        $grille = [];
        foreach (self::JOURS as $jour) {
            $grille[$jour] = array_fill(0, self::SEANCES_COUNT, null);
        }

        $creneaux = [];
        foreach (self::JOURS as $jour) {
            for ($si = 0; $si < self::SEANCES_COUNT; $si++) {
                $creneaux[] = ['jour' => $jour, 'si' => $si];
            }
        }

        $idx = 0;

        foreach ($plannings as $p) {
            $chargeHebdo = floatval($p->charge_hebdo) ?: (floatval($p->mh_drif) / 23);
            $nbSeances   = max(1, (int) round($chargeHebdo / 2.5));

            for ($s = 0; $s < $nbSeances; $s++) {
                while ($idx < count($creneaux) && $grille[$creneaux[$idx]['jour']][$creneaux[$idx]['si']] !== null) {
                    $idx++;
                }
                if ($idx >= count($creneaux)) break;

                ['jour' => $jour, 'si' => $si] = $creneaux[$idx];

                $grille[$jour][$si] = [
                    'module'    => $p->module?->intitule ?? $p->module?->code ?? "Module {$p->module_id}",
                    'formateur' => $p->formateur?->nom ?? '—',
                    'salle'     => '',
                    'salle_id'  => null,
                    'mode'      => 'PRESENTIEL',
                ];
                $idx++;
            }
        }

        $emploi = EmploiDuTemps::create([
            'groupe_id'     => $request->groupe_id,
            'created_by'    => $request->user()->id,
            'periode_debut' => $request->date_debut,
            'semestre'      => $request->semestre,
            'grille'        => $grille,
            'valide'        => false,
        ]);

        return response()->json([
            'data'    => $emploi->load('groupe'),
            'grille'  => $grille,
            'message' => 'Emploi du temps généré avec succès.',
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/emplois/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function show($id)
    {
        $emploi = EmploiDuTemps::with('groupe')->findOrFail($id);

        return response()->json([
            'data' => [
                'id'           => $emploi->id,
                'groupe'       => $emploi->groupe?->nom ?? $emploi->groupe?->code ?? '—',
                'groupe_id'    => $emploi->groupe_id,
                'filiere'      => $emploi->groupe?->filiere ?? null,
                'annee'        => $emploi->groupe?->annee ?? null,
                'semestre'     => $emploi->semestre,
                'periodeDebut' => $emploi->periode_debut?->format('d/m/Y'),
                'valide'       => $emploi->valide,
                'jours'        => $emploi->grille,
                'nb_heures'    => $emploi->nb_heures ?? null,
                'formateur_parrain' => $emploi->formateur_parrain ?? null,
            ]
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/emplois/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $emploi = EmploiDuTemps::findOrFail($id);

        // If grille is being updated, re-validate and re-sync seances
        if ($request->has('grille')) {
            $semestre = $request->semestre ?? $emploi->semestre;
            $seances  = $this->parseGrille($request->grille, $semestre);

            $conflicts = $this->conflictService->checkConflicts($seances, $emploi->id);
            if (!empty($conflicts)) {
                return response()->json([
                    'message'   => 'Conflits de salles détectés.',
                    'conflicts' => array_column($conflicts, 'message'),
                ], 422);
            }

            try {
                DB::transaction(function () use ($emploi, $request, $seances, $semestre) {
                    $emploi->seances()->delete();
                    $emploi->update([
                        'grille'   => $request->grille,
                        'semestre' => $semestre,
                        'valide'   => $request->valide ?? $emploi->valide,
                    ]);
                    foreach ($seances as $s) {
                        EmploiSeance::create(['emploi_id' => $emploi->id] + $s);
                    }
                });
            } catch (QueryException $e) {
                if ($e->getCode() === '23000') {
                    return response()->json([
                        'message' => 'Conflit de salle détecté au niveau base de données.',
                    ], 409);
                }
                throw $e;
            }
        } else {
            $emploi->update($request->only(['valide', 'periode_debut']));
        }

        return response()->json(['data' => $emploi->fresh()]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/emplois/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function destroy($id)
    {
        EmploiDuTemps::findOrFail($id)->delete(); // seances cascade-deleted
        return response()->json(['message' => 'Emploi du temps supprimé.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/emplois/formateur/{formateurId}
    // ─────────────────────────────────────────────────────────────────────────
    public function formateurTimetable($formateurId)
    {
        $formateur = Formateur::findOrFail($formateurId);

        $grille = [];
        foreach (self::JOURS as $jour) {
            $grille[$jour] = array_fill(0, self::SEANCES_COUNT, null);
        }

        EmploiDuTemps::with('groupe')->get()->each(function ($emploi) use (&$grille, $formateur, $formateurId) {
            if (!is_array($emploi->grille)) return;
            foreach (self::JOURS as $jour) {
                foreach (($emploi->grille[$jour] ?? []) as $si => $cell) {
                    if (!$cell) continue;
                    $byId   = !empty($cell['formateur_id']) && (int)$cell['formateur_id'] === (int)$formateurId;
                    $byName = !$byId && !empty($cell['formateur'])
                              && mb_strtolower(trim($cell['formateur'])) === mb_strtolower(trim($formateur->nom));
                    if (!$byId && !$byName) continue;
                    if ($grille[$jour][$si] !== null) continue;
                    $grille[$jour][$si] = [
                        'module' => $cell['module'] ?? '—',
                        'groupe' => $emploi->groupe?->nom ?? '?',
                        'salle'  => $cell['salle']  ?? '',
                        'mode'   => $cell['mode']   ?? 'PRESENTIEL',
                    ];
                }
            }
        });

        return response()->json([
            'data' => [
                'formateur' => ['id' => $formateur->id, 'nom' => $formateur->nom],
                'grille'    => $grille,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE: Parse grille JSON → flat seances array
    // ─────────────────────────────────────────────────────────────────────────
    private function parseGrille(array $grille, string $semestre): array
    {
        $seances = [];

        foreach (self::JOURS as $jour) {
            $cells = $grille[$jour] ?? [];
            foreach ($cells as $si => $cell) {
                if (empty($cell) || ($cell['mode'] ?? '') === 'DISTANCIEL' || empty($cell['salle_id'])) continue;

                $salle = Salle::find($cell['salle_id']);
                if (!$salle) continue;

                $seances[] = [
                    'salle_id'      => $salle->id,
                    'module_id'     => $cell['module_id']    ?? null,
                    'formateur_id'  => $cell['formateur_id'] ?? null,
                    'jour'          => $jour,
                    'numero_seance' => (int) $si,
                    'semestre'      => $semestre,
                    'mode'          => $cell['mode'] ?? 'PRESENTIEL',
                ];
            }
        }

        return $seances;
    }
}