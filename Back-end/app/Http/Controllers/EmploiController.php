<?php
// ============================================================
// app/Http/Controllers/EmploiController.php
// ============================================================

namespace App\Http\Controllers;

use App\Models\Groupe;
use App\Models\Planning;
use App\Models\EmploiDuTemps;
use Illuminate\Http\Request;

class EmploiController extends Controller
{
    // ─────────────────────────────────────────────────────────
    // Séances disponibles (même config que le frontend)
    // ─────────────────────────────────────────────────────────
    const SEANCES_COUNT = 4;
    const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

    /**
     * GET /api/emplois
     */
    public function index(Request $request)
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

    /**
     * POST /api/emplois
     * Créer un emploi du temps (depuis le frontend — grille fournie)
     */
    public function store(Request $request)
    {
        $request->validate([
            'groupe_id'  => 'required|exists:groupes,id',
            'date_debut' => 'required|date',
            'semestre'   => 'nullable|string',
            'grille'     => 'required|array',
        ]);

        $emploi = EmploiDuTemps::create([
            'groupe_id'     => $request->groupe_id,
            'created_by'    => $request->user()->id,
            'periode_debut' => $request->date_debut,
            'semestre'      => $request->semestre,
            'grille'        => $request->grille,   // cast 'array' => auto json_encode
            'valide'        => false,
        ]);

        return response()->json(['data' => $emploi->load('groupe')], 201);
    }

    /**
     * POST /api/emplois/generate-from-plannings
     * Génère automatiquement la grille depuis les plannings d'un groupe
     * Body: { groupe_id, semestre, date_debut }
     *
     * Algorithme :
     *  - Récupère tous les plannings du groupe pour le semestre donné
     *  - Pour chaque module, calcule le nb de séances/semaine
     *    (charge_hebdo / 2.5h par séance, min 1)
     *  - Remplit les créneaux dans l'ordre Lundi→Samedi, Séance 1→4
     *  - Crée l'emploi du temps et retourne la grille
     */
    public function generateFromPlannings(Request $request)
    {
        $request->validate([
            'groupe_id'  => 'required|exists:groupes,id',
            'semestre'   => 'required|in:S1,S2',
            'date_debut' => 'required|date',
        ]);

        $semestreNum = $request->semestre === 'S2' ? 2 : 1;

        // Récupérer les plannings du groupe + semestre
        $plannings = Planning::with(['module', 'formateur'])
            ->where('groupe_id', $request->groupe_id)
            ->where('semestre', $request->semestre)
            ->get();

        if ($plannings->isEmpty()) {
            return response()->json([
                'message' => "Aucun planning trouvé pour ce groupe en {$request->semestre}."
            ], 422);
        }

        // Construire la grille vide
        $grille = [];
        foreach (self::JOURS as $jour) {
            $grille[$jour] = array_fill(0, self::SEANCES_COUNT, null);
        }

        // File de créneaux libres
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
                // Trouver le prochain créneau libre
                while ($idx < count($creneaux) && $grille[$creneaux[$idx]['jour']][$creneaux[$idx]['si']] !== null) {
                    $idx++;
                }
                if ($idx >= count($creneaux)) break;

                ['jour' => $jour, 'si' => $si] = $creneaux[$idx];

                $grille[$jour][$si] = [
                    'module'     => $p->module?->intitule ?? $p->module?->code ?? "Module {$p->module_id}",
                    'formateur'  => $p->formateur?->nom ?? "—",
                    'salle'      => '',
                    'mode'       => 'PRESENTIEL',
                ];
                $idx++;
            }
        }

        // Créer l'emploi du temps en base
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

    /**
     * GET /api/emplois/{id}
     */
    public function show($id)
    {
        $emploi = EmploiDuTemps::with('groupe')->findOrFail($id);

        return response()->json([
            'data' => [
                'id'           => $emploi->id,
                'groupe'       => $emploi->groupe?->nom ?? $emploi->groupe?->code ?? '—',
                'groupe_id'    => $emploi->groupe_id,
                'filiere'      => $emploi->groupe?->filiere ?? null,
                'semestre'     => $emploi->semestre,
                'periodeDebut' => $emploi->periode_debut?->format('d/m/Y'),
                'valide'       => $emploi->valide,
                'jours'        => $emploi->grille, // la grille indexée par jour
            ]
        ]);
    }

    /**
     * PUT /api/emplois/{id}
     */
    public function update(Request $request, $id)
    {
        $emploi = EmploiDuTemps::findOrFail($id);
        $emploi->update($request->only(['grille', 'valide', 'periode_debut']));
        return response()->json(['data' => $emploi]);
    }

    /**
     * DELETE /api/emplois/{id}
     */
    public function destroy($id)
    {
        EmploiDuTemps::findOrFail($id)->delete();
        return response()->json(['message' => 'Emploi du temps supprimé.']);
    }
}