<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StagiaireController extends Controller
{
    public function filieres()
    {
        $filieres = DB::table('filieres')
            ->select('id', 'code', 'intitule')
            ->orderBy('intitule')
            ->get();
        return response()->json(['data' => $filieres]);
    }

    public function annees(Request $request)
    {
        $request->validate(['filiere_id' => 'required|integer']);
        $annees = DB::table('groupes')
            ->where('filiere_id', $request->filiere_id)
            ->distinct()
            ->orderBy('annee_formation')
            ->pluck('annee_formation');
        return response()->json(['data' => $annees]);
    }

    public function groupes(Request $request)
    {
        $request->validate(['filiere_id' => 'required|integer', 'annee' => 'required']);
        $groupes = DB::table('groupes')
            ->where('filiere_id', $request->filiere_id)
            ->where('annee_formation', $request->annee)
            ->select('id', 'nom')
            ->orderBy('nom')
            ->get();
        return response()->json(['data' => $groupes]);
    }

    public function emploi(Request $request)
    {
        $request->validate(['groupe_id' => 'required|integer']);
        $emploi = DB::table('emplois_du_temps')
            ->where('groupe_id', $request->groupe_id)
            ->select('id', 'semestre', 'periode_debut', 'grille')
            ->orderByDesc('id')
            ->first();

        if (!$emploi) {
            return response()->json(['data' => null]);
        }

        $emploi->grille = json_decode($emploi->grille, true);
        return response()->json(['data' => $emploi]);
    }

    public function modules(Request $request)
    {
        $request->validate(['filiere_id' => 'required|integer', 'annee' => 'required']);

        $modules = DB::table('modules')
            ->join('groupes', 'modules.groupe_id', '=', 'groupes.id')
            ->leftJoin('formateurs', 'modules.formateur_id', '=', 'formateurs.id')
            ->where('groupes.filiere_id', $request->filiere_id)
            ->where('groupes.annee_formation', $request->annee)
            ->select(
                DB::raw('MIN(modules.id) as id'),
                'modules.code',
                'modules.intitule',
                'modules.semestre',
                DB::raw('MAX(modules.mh_drif) as mh_drif'),
                DB::raw('MAX(modules.eg_et) as eg_et'),
                DB::raw('MAX(formateurs.nom) as formateur')
            )
            ->groupBy('modules.code', 'modules.intitule', 'modules.semestre')
            ->orderBy('modules.semestre')
            ->orderBy('modules.intitule')
            ->get();

        return response()->json(['data' => $modules]);
    }
}
