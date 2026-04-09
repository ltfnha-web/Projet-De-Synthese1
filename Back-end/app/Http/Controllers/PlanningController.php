<?php
// ============================================================
// app/Http/Controllers/PlanningController.php
// NOUVEAU FICHIER — déjà importé dans ton api.php
// Route::apiResource('plannings', PlanningController::class)
// ============================================================

namespace App\Http\Controllers;

use App\Models\Planning;
use Illuminate\Http\Request;

class PlanningController extends Controller
{
    /**
     * GET /api/plannings
     * Paramètres optionnels: ?groupe=Dev201 &semestre=2 &vue=formateurs
     */
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Planning::with(['groupe', 'module', 'formateur'])
            ->where('pole_id', $user->id); // adapte selon ta relation

        // Filtre groupe
        if ($request->filled('groupe')) {
            $query->whereHas('groupe', fn($q) => $q->where('code', $request->groupe));
        }

        // Filtre semestre
        if ($request->filled('semestre')) {
            $query->where('semestre', $request->semestre);
        }

        $rows = $query->get();

        // Vue formateurs (groupé par formateur)
        if ($request->vue === 'formateurs') {
            $data = $rows->map(fn($p) => [
                'id'          => $p->id,
                'formateur'   => $p->formateur->nom_complet ?? $p->formateur->name ?? '—',
                'specialite'  => $p->formateur->specialite ?? '—',
                'module'      => $p->module->intitule ?? $p->module->nom ?? '—',
                'groupe'      => $p->groupe->code ?? '—',
                'mhTotal'     => $p->mh_drif,
                'mhRealise'   => $p->mh_realisee,
                'mhRestant'   => $p->mh_drif - $p->mh_realisee,
                'chargeHebdo' => $p->charge_hebdo ?? 0,
                'statut'      => $p->statut,
            ]);
            return response()->json(['data' => $data]);
        }

        // Vue groupes (défaut)
        $data = $rows->map(fn($p) => [
            'id'          => $p->id,
            'groupe'      => $p->groupe->code ?? '—',
            'module'      => $p->module->intitule ?? $p->module->nom ?? '—',
            'type'        => $p->type,
            'mh'          => $p->mh_drif,
            'formateur'   => $p->formateur->nom_complet ?? $p->formateur->name ?? '—',
            'mhRestant'   => $p->mh_drif - $p->mh_realisee,
            'dateDebut'   => $p->date_debut?->format('d/m/Y'),
            'semestres'   => $p->nb_semaines ?? 0,
            'semFaites'   => $p->semaines_faites ?? 0,
            'statut'      => $p->statut,
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * POST /api/plannings
     */
    public function store(Request $request)
    {
        $request->validate([
            'groupe_id'    => 'required|exists:groupes,id',
            'module_id'    => 'required|exists:modules,id',
            'formateur_id' => 'required|exists:users,id',
            'semestre'     => 'required|integer|min:1|max:4',
            'type'         => 'required|in:Régionale,Locale',
            'mh_drif'      => 'required|integer|min:1',
        ]);

        $planning = Planning::create([
            ...$request->only([
                'groupe_id', 'module_id', 'formateur_id',
                'semestre', 'type', 'mh_drif',
                'date_debut', 'nb_semaines', 'salle', 'mode',
            ]),
            'pole_id'     => $request->user()->id,
            'mh_realisee' => 0,
            'statut'      => 'En cours',
        ]);

        return response()->json(['data' => $planning], 201);
    }

    /**
     * GET /api/plannings/{id}
     */
    public function show(Planning $planning)
    {
        return response()->json(['data' => $planning->load(['groupe','module','formateur'])]);
    }

    /**
     * PUT /api/plannings/{id}
     */
    public function update(Request $request, Planning $planning)
    {
        $planning->update($request->only([
            'mh_realisee', 'semaines_faites', 'statut',
            'salle', 'mode', 'charge_hebdo', 'jour', 'seance_numero',
        ]));

        return response()->json(['data' => $planning]);
    }

    /**
     * DELETE /api/plannings/{id}
     */
    public function destroy(Planning $planning)
    {
        $planning->delete();
        return response()->json(['message' => 'Supprimé.']);
    }
}