<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupeController extends Controller
{
    public function index(Request $request)
    {
        $query = Groupe::with(['filiere.secteur'])
            ->when($request->search, fn($q) =>
                $q->where('nom', 'like', "%{$request->search}%")
            )
            ->when($request->filiere_id, fn($q) =>
                $q->where('filiere_id', $request->filiere_id)
            )
            ->when($request->annee_formation, fn($q) =>
                $q->where('annee_formation', $request->annee_formation)
            )
            ->when($request->mode, fn($q) =>
                $q->where('mode', $request->mode)
            )
            ->latest();

        $paginated = $query->paginate(15);

        // Ajouter AVC calculé pour chaque groupe
        $groupeIds = $paginated->pluck('id');
        $avcs = DB::table('modules')
            ->whereIn('groupe_id', $groupeIds)
            ->select(
                'groupe_id',
                DB::raw('CASE WHEN SUM(mh_drif) > 0 THEN SUM(mh_realisee_globale) / SUM(mh_drif) ELSE NULL END as avc_moyen')
            )
            ->groupBy('groupe_id')
            ->pluck('avc_moyen', 'groupe_id');

        $paginated->getCollection()->transform(function ($groupe) use ($avcs) {
            $groupe->avc_moyen = isset($avcs[$groupe->id]) ? (float)$avcs[$groupe->id] : null;
            return $groupe;
        });

        return response()->json($paginated);
    }

    // Liste filières pour les selects
    public function filieresList()
    {
        return response()->json(
            \App\Models\Filiere::orderBy('intitule')->get(['id', 'intitule', 'code'])
        );
    }
}