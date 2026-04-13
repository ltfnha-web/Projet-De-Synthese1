<?php

namespace App\Http\Controllers;

use App\Models\Planning;
use Illuminate\Http\Request;

class PlanningController extends Controller
{
    /**
     * GET /api/plannings
     */
    public function index(Request $request)
    {
        $query = Planning::with(['groupe', 'module', 'formateur']);

        if ($request->filled('groupe')) {
            $query->whereHas('groupe', function ($q) use ($request) {
                $q->where('code', $request->groupe);
            });
        }

        if ($request->filled('semestre')) {
            $query->where('semestre', $request->semestre);
        }

        $rows = $query->get();

        // ── Vue formateurs ──
        if ($request->get('vue') === 'formateurs') {
            $data = $rows->map(function ($p) {
                return [
                    'id' => $p->id,
                    'formateur'  => optional($p->formateur)->name ?? '—',
                    'specialite' => optional($p->formateur)->specialite ?? '—',
                    'module'     => optional($p->module)->intitule ?? '—',
                    'groupe'     => optional($p->groupe)->code ?? '—',
                    'mhTotal'    => $p->mh_drif ?? 0,
                    'mhRealise'  => $p->mh_realisee ?? 0,
                    'mhRestant'  => ($p->mh_drif ?? 0) - ($p->mh_realisee ?? 0),
                    'chargeHebdo'=> $p->charge_hebdo ?? 0,
                    'statut'     => $p->statut ?? 'En cours',
                ];
            });

            return response()->json(['data' => $data]);
        }

        // ── Vue groupes ──
        $data = $rows->map(function ($p) {
            return [
                'id'        => $p->id,
                'groupe'    => optional($p->groupe)->code ?? '—',
                'module'    => optional($p->module)->intitule ?? '—',
                'type'      => $p->type ?? '—',
                'mh'        => $p->mh_drif ?? 0,
                'formateur' => optional($p->formateur)->name ?? '—',
                'mhRestant' => ($p->mh_drif ?? 0) - ($p->mh_realisee ?? 0),
                'dateDebut' => $p->date_debut,
                'semestres' => $p->nb_semaines ?? 0,
                'semFaites' => $p->semaines_faites ?? 0,
                'statut'    => $p->statut ?? 'En cours',
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * POST /api/plannings
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'groupe_id'    => 'required|integer',
            'module_id'    => 'required|integer',
            'formateur_id' => 'required|integer',

            // 🔥 FIX IMPORTANT
            'semestre'     => 'required|string',

            'type'         => 'nullable|string',
            'mh_drif'      => 'required|integer|min:1',
            'date_debut'   => 'nullable|date',
            'nb_semaines'  => 'nullable|integer',
            'salle'        => 'nullable|string',
            'mode'         => 'nullable|string',
            'jour'         => 'nullable|string',
            'seance_numero'=> 'nullable|integer',
        ]);

        $planning = Planning::create([
            ...$validated,
            'mh_realisee'     => 0,
            'semaines_faites' => 0,
            'statut'          => 'En cours',
        ]);

        return response()->json([
            'data' => $planning->load(['groupe', 'module', 'formateur'])
        ], 201);
    }

    /**
     * GET /api/plannings/{id}
     */
    public function show(Planning $planning)
    {
        return response()->json([
            'data' => $planning->load(['groupe', 'module', 'formateur'])
        ]);
    }

    /**
     * PUT /api/plannings/{id}
     */
    public function update(Request $request, Planning $planning)
    {
        $planning->update($request->only([
            'mh_realisee',
            'semaines_faites',
            'statut',
            'salle',
            'mode',
            'charge_hebdo',
            'jour',
            'seance_numero',
            'type',
            'mh_drif',
            'date_debut',
            'nb_semaines',
        ]));

        return response()->json(['data' => $planning]);
    }

    /**
     * DELETE /api/plannings/{id}
     */
    public function destroy(Planning $planning)
    {
        $planning->delete();

        return response()->json([
            'message' => 'Supprimé avec succès'
        ]);
    }
}