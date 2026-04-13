<?php
// ============================================================
// app/Http/Controllers/EmploiController.php  — VERSION CORRIGÉE
// ============================================================

namespace App\Http\Controllers;

use App\Models\Planning;
use App\Models\EmploiDuTemps;
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
                'groupe'      => optional($e->groupe)->code ?? '—',
                'periodeDebut'=> optional($e->periode_debut)?->format('d/m/Y'),
                'valide'      => $e->valide,
            ]);

        return response()->json(['data' => $emplois]);
    }

    /**
     * POST /api/emplois
     * Body: { groupe: 'Dev 201', date_debut: '2026-04-10', semestre: 2 }
     */
    public function store(Request $request)
    {
        $request->validate([
            'groupe'     => 'required|string',
            'date_debut' => 'required|date',
        ]);

        // Cherche le groupe par code
        $groupe = \App\Models\Groupe::where('code', $request->groupe)->first();

        if (!$groupe) {
            return response()->json([
                'message' => "Groupe '{$request->groupe}' introuvable."
            ], 404);
        }

        // Récupère les plannings du groupe avec un jour/séance assigné
        $planningsQuery = Planning::with(['module', 'formateur'])
            ->where('groupe_id', $groupe->id)
            ->whereNotNull('jour');

        if ($request->filled('semestre')) {
            $planningsQuery->where('semestre', $request->semestre);
        }

        $plannings = $planningsQuery->get();

        // Construit la grille
        $jours  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        $grille = [];
        foreach ($jours as $jour) {
            $grille[$jour] = [null, null, null, null];
        }

        foreach ($plannings as $p) {
            $idx = ($p->seance_numero ?? 1) - 1;
            if ($idx >= 0 && $idx < 4 && isset($grille[$p->jour])) {
                $grille[$p->jour][$idx] = [
                    'module'    => optional($p->module)->intitule
                                ?? optional($p->module)->nom
                                ?? optional($p->module)->libelle ?? '—',
                    'formateur' => optional($p->formateur)->name ?? '—',
                    'salle'     => $p->salle ?? 'TBD',
                    'mode'      => $p->mode ?? 'PRESENTIEL',
                ];
            }
        }

        $response = [
            'groupe'      => $groupe->code,
            'filiere'     => $groupe->filiere ?? $groupe->nom ?? '—',
            'efp'         => 'ISTA HAY SALAM SALE',
            'periodeDebut'=> \Carbon\Carbon::parse($request->date_debut)->format('d/m/Y'),
            'jours'       => $grille,
        ];

        return response()->json(['data' => $response], 201);
    }

    public function show($id)
    {
        $emploi = EmploiDuTemps::with('groupe')->findOrFail($id);
        return response()->json(['data' => $emploi]);
    }

    public function update(Request $request, $id)
    {
        $emploi = EmploiDuTemps::findOrFail($id);
        $emploi->update($request->only(['grille', 'valide', 'periode_debut']));
        return response()->json(['data' => $emploi]);
    }

    public function destroy($id)
    {
        EmploiDuTemps::findOrFail($id)->delete();
        return response()->json(['message' => 'Supprimé.']);
    }
}