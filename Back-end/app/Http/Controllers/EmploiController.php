<?php
// ============================================================
// app/Http/Controllers/EmploiController.php
// NOUVEAU FICHIER — déjà importé dans ton api.php
// Route::apiResource('emplois', EmploiController::class)
// ============================================================

namespace App\Http\Controllers;

use App\Models\Planning;
use App\Models\EmploiDuTemps;
use App\Models\Groupe;
use Illuminate\Http\Request;

class EmploiController extends Controller
{
    /**
     * GET /api/emplois
     */
    public function index(Request $request)
    {
        $emplois = EmploiDuTemps::with('groupe')
            ->where('created_by', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($e) => [
                'id'          => $e->id,
                'groupe'      => $e->groupe->code ?? '—',
                'periodeDebut'=> $e->periode_debut?->format('d/m/Y'),
                'valide'      => $e->valide,
            ]);

        return response()->json(['data' => $emplois]);
    }

    /**
     * POST /api/emplois
     * Body: { groupe: 'Dev 201', date_debut: '2026-03-30', semestre: 2 }
     *
     * Génère la grille jours/séances depuis les plannings existants
     */
    public function store(Request $request)
    {
        $request->validate([
            'groupe'     => 'required|string',
            'date_debut' => 'required|date',
        ]);

        // Trouve le groupe
        $groupe = Groupe::where('code', $request->groupe)->firstOrFail();

        // Récupère les plannings du groupe qui ont un jour/séance assigné
        $plannings = Planning::with(['module', 'formateur'])
            ->where('groupe_id', $groupe->id)
            ->whereNotNull('jour')
            ->when($request->semestre, fn($q) => $q->where('semestre', $request->semestre))
            ->get();

        // Construit la grille
        $jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        $grille = [];
        foreach ($jours as $jour) {
            $grille[$jour] = [null, null, null, null];
        }

        foreach ($plannings as $p) {
            $idx = ($p->seance_numero ?? 1) - 1;
            if (isset($grille[$p->jour][$idx])) {
                $grille[$p->jour][$idx] = [
                    'module'    => $p->module->intitule ?? $p->module->nom ?? '—',
                    'formateur' => $p->formateur->nom_complet ?? $p->formateur->name ?? '—',
                    'salle'     => $p->salle ?? 'TBD',
                    'mode'      => $p->mode ?? 'PRESENTIEL',
                ];
            }
        }

        // Optionnel: sauvegarde en base
        // $emploi = EmploiDuTemps::create([
        //     'groupe_id'    => $groupe->id,
        //     'periode_debut'=> $request->date_debut,
        //     'grille'       => $grille,
        //     'created_by'   => $request->user()->id,
        // ]);

        $response = [
            'groupe'      => $groupe->code,
            'filiere'     => $groupe->filiere ?? '—',
            'efp'         => 'ISTA HAY SALAM SALE',
            'periodeDebut'=> \Carbon\Carbon::parse($request->date_debut)->format('d/m/Y'),
            'jours'       => $grille,
        ];

        return response()->json(['data' => $response], 201);
    }

    /**
     * GET /api/emplois/{id}
     */
    public function show($id)
    {
        $emploi = EmploiDuTemps::with('groupe')->findOrFail($id);
        return response()->json(['data' => $emploi]);
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
        return response()->json(['message' => 'Supprimé.']);
    }
}