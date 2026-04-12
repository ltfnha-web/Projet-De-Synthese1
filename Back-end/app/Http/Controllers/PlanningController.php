<?php
// app/Http/Controllers/PlanningController.php — VERSION FINALE

namespace App\Http\Controllers;

use App\Models\Planning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanningController extends Controller
{
    /**
     * GET /api/plannings
     * ?groupe=  &semestre=  &vue=formateurs
     */
    public function index(Request $request)
    {
        $query = Planning::with(['groupe', 'module', 'formateur']);

        if ($request->filled('groupe')) {
            $query->whereHas('groupe', fn($q) => $q->where('code', $request->groupe));
        }
        if ($request->filled('semestre')) {
            $query->where('semestre', $request->semestre);
        }

        $rows = $query->get();

        if ($request->get('vue') === 'formateurs') {
            return response()->json(['data' => $rows->map(fn($p) => [
                'id'          => $p->id,
                'formateur'   => optional($p->formateur)->nom ?? '—',
                'specialite'  => '—',
                'module'      => optional($p->module)->intitule ?? optional($p->module)->nom ?? optional($p->module)->libelle ?? '—',
                'groupe'      => optional($p->groupe)->code ?? optional($p->groupe)->nom ?? '—',
                'mhTotal'     => $p->mh_drif     ?? 0,
                'mhRealise'   => $p->mh_realisee  ?? 0,
                'mhRestant'   => ($p->mh_drif ?? 0) - ($p->mh_realisee ?? 0),
                'chargeHebdo' => $p->charge_hebdo ?? 0,
                'statut'      => $p->statut ?? 'En cours',
            ])]);
        }

        return response()->json(['data' => $rows->map(fn($p) => [
            'id'        => $p->id,
            'groupe'    => optional($p->groupe)->code ?? optional($p->groupe)->nom ?? '—',
            'module'    => optional($p->module)->intitule ?? optional($p->module)->nom ?? optional($p->module)->libelle ?? '—',
            'type'      => $p->type ?? '—',
            'mh'        => $p->mh_drif ?? 0,
            'formateur' => optional($p->formateur)->nom ?? '—',
            'mhRestant' => ($p->mh_drif ?? 0) - ($p->mh_realisee ?? 0),
            'dateDebut' => optional($p->date_debut)?->format('d/m/Y'),
            'semestres' => $p->nb_semaines     ?? 0,
            'semFaites' => $p->semaines_faites ?? 0,
            'statut'    => $p->statut ?? 'En cours',
        ])]);
    }

    /**
     * POST /api/plannings
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'groupe_id'     => 'required|integer',
            'module_id'     => 'required|integer',
            'formateur_id'  => 'required|integer',
            'semestre'      => 'required|integer|min:1|max:6',
            'type'          => 'nullable|string',
            'mh_drif'       => 'required|integer|min:1',
            'date_debut'    => 'nullable|date',
            'nb_semaines'   => 'nullable|integer',
            'salle'         => 'nullable|string|max:20',
            'mode'          => 'nullable|string|max:20',
            'jour'          => 'nullable|string|max:20',
            'seance_numero' => 'nullable|integer|min:1|max:4',
        ]);

        $planning = Planning::create([
            ...$validated,
            'pole_id'        => auth()->id(),
            'mh_realisee'    => 0,
            'semaines_faites'=> 0,
            'statut'         => 'En cours',
        ]);

        return response()->json([
            'data'    => $planning->load(['groupe', 'module', 'formateur']),
            'message' => 'Planning créé avec succès.',
        ], 201);
    }

    public function show(Planning $planning)
    {
        return response()->json(['data' => $planning->load(['groupe', 'module', 'formateur'])]);
    }

    public function update(Request $request, Planning $planning)
    {
        $planning->update($request->only([
            'mh_realisee', 'semaines_faites', 'statut',
            'salle', 'mode', 'charge_hebdo', 'jour', 'seance_numero',
            'type', 'mh_drif', 'date_debut', 'nb_semaines',
        ]));
        return response()->json(['data' => $planning]);
    }

    public function destroy(Planning $planning)
    {
        $planning->delete();
        return response()->json(['message' => 'Supprimé.']);
    }
}