<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PoleSecteur;
use App\Models\Secteur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PoleController extends Controller
{
    /**
     * GET /api/pole
     * Tous les secteurs avec responsable + stats AVC
     */
    public function index(Request $request)
    {
        $secteurs = Secteur::with(['filieres', 'poleSecteur.formateur'])
            ->when($request->search, fn($q) =>
                $q->where('nom', 'like', "%{$request->search}%")
            )
            ->get()
            ->map(function ($secteur) {

                // AVC + MH du secteur
                $avc = DB::table('modules')
                    ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
                    ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                    ->where('filieres.secteur_id', $secteur->id)
                    ->selectRaw('
                        CASE WHEN SUM(mh_drif) > 0
                             THEN SUM(mh_realisee_globale) / SUM(mh_drif)
                             ELSE 0 END as avc_moyen,
                        SUM(mh_drif)             as mh_drif,
                        SUM(mh_realisee_globale) as mh_realisee,
                        SUM(mh_restante)         as mh_restante
                    ')
                    ->first();

                // Nombre de groupes
                $nbGroupes = DB::table('groupes')
                    ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                    ->where('filieres.secteur_id', $secteur->id)
                    ->count();

                // Groupes critiques AVC < 30%
                $groupeIds = DB::table('groupes')
                    ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                    ->where('filieres.secteur_id', $secteur->id)
                    ->pluck('groupes.id');

                $critiques = 0;
                if ($groupeIds->isNotEmpty()) {
                    $critiques = DB::table('modules')
                        ->whereIn('groupe_id', $groupeIds)
                        ->select('groupe_id', DB::raw('
                            CASE WHEN SUM(mh_drif) > 0
                            THEN SUM(mh_realisee_globale) / SUM(mh_drif)
                            ELSE 0 END as avc
                        '))
                        ->groupBy('groupe_id')
                        ->havingRaw('avc < 0.3')
                        ->count();
                }

                return [
                    'id'                => $secteur->id,
                    'nom'               => $secteur->nom,
                    'nb_filieres'       => $secteur->filieres->count(),
                    'nb_groupes'        => $nbGroupes,
                    'groupes_critiques' => $critiques,
                    'avc_moyen'         => round((float)($avc->avc_moyen ?? 0), 4),
                    'mh_drif'           => round((float)($avc->mh_drif ?? 0)),
                    'mh_realisee'       => round((float)($avc->mh_realisee ?? 0)),
                    'mh_restante'       => round((float)($avc->mh_restante ?? 0)),
                    'responsable'       => $secteur->poleSecteur ? [
                        'id'      => $secteur->poleSecteur->formateur_id,
                        'nom'     => $secteur->poleSecteur->formateur?->nom,
                        'pole_id' => $secteur->poleSecteur->id,
                        'notes'   => $secteur->poleSecteur->notes,
                    ] : null,
                ];
            });

        // Filtre formateur_id côté PHP
        if ($request->filled('formateur_id')) {
            $fid = $request->formateur_id;
            $secteurs = $secteurs->filter(fn($s) =>
                $fid === '__none__'
                    ? $s['responsable'] === null
                    : $s['responsable'] !== null && $s['responsable']['id'] == $fid
            )->values();
        }

        return response()->json($secteurs);
    }

    /**
     * GET /api/pole/{secteur}/groupes
     * Groupes d'un secteur avec AVC
     */
    public function groupesSecteur(Request $request, $secteurId)
    {
        $groupes = DB::table('groupes')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->where('filieres.secteur_id', $secteurId)
            ->select('groupes.*', 'filieres.intitule as filiere_nom')
            ->when($request->search, fn($q) =>
                $q->where('groupes.nom', 'like', "%{$request->search}%")
            )
            ->when($request->annee, fn($q) =>
                $q->where('groupes.annee_formation', $request->annee)
            )
            ->orderBy('groupes.nom')
            ->get();

        $groupeIds = $groupes->pluck('id');

        $avcs = DB::table('modules')
            ->whereIn('groupe_id', $groupeIds)
            ->select('groupe_id', DB::raw('
                CASE WHEN SUM(mh_drif) > 0
                THEN SUM(mh_realisee_globale) / SUM(mh_drif)
                ELSE NULL END as avc_moyen,
                SUM(mh_drif)             as mh_drif,
                SUM(mh_realisee_globale) as mh_realisee,
                SUM(mh_restante)         as mh_restante
            '))
            ->groupBy('groupe_id')
            ->get()
            ->keyBy('groupe_id');

        $result = $groupes->map(fn($g) => array_merge(
            (array)$g,
            [
                'avc_moyen'   => isset($avcs[$g->id]) ? round((float)$avcs[$g->id]->avc_moyen, 4) : null,
                'mh_drif'     => round((float)($avcs[$g->id]?->mh_drif     ?? 0)),
                'mh_realisee' => round((float)($avcs[$g->id]?->mh_realisee ?? 0)),
                'mh_restante' => round((float)($avcs[$g->id]?->mh_restante ?? 0)),
            ]
        ));

        return response()->json($result);
    }

    /**
     * POST /api/pole/assign
     * Assigner ou modifier un responsable
     */
    public function assign(Request $request)
    {
        $request->validate([
            'secteur_id'   => 'required|exists:secteurs,id',
            'formateur_id' => 'nullable|exists:formateurs,id',
            'notes'        => 'nullable|string|max:500',
        ]);

        $pole = PoleSecteur::updateOrCreate(
            ['secteur_id'  => $request->secteur_id],
            [
                'formateur_id' => $request->formateur_id ?: null,
                'notes'        => $request->notes,
            ]
        );

        return response()->json([
            'message' => $request->formateur_id
                ? 'Responsable assigné avec succès.'
                : 'Responsable retiré.',
            'pole'    => $pole->load('formateur', 'secteur'),
        ]);
    }

    /**
     * DELETE /api/pole/{secteur}
     */
    public function remove($secteurId)
    {
        PoleSecteur::where('secteur_id', $secteurId)->delete();
        return response()->json(['message' => 'Responsable retiré.']);
    }
}