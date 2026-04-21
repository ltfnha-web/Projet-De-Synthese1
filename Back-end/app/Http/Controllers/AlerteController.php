<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlerteController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('modules')
            ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->join('secteurs', 'filieres.secteur_id','=', 'secteurs.id')
            ->select(
                'groupes.id as groupe_id',
                'groupes.nom as groupe',
                'groupes.effectif',
                'groupes.creneau',
                'filieres.id as filiere_id',
                'filieres.intitule as filiere',
                'secteurs.id as secteur_id',
                'secteurs.nom as secteur',
                DB::raw('CASE WHEN SUM(modules.mh_drif) > 0
                         THEN SUM(modules.mh_realisee_globale) / SUM(modules.mh_drif)
                         ELSE 0 END as avc'),
                DB::raw('SUM(modules.mh_drif) as mh_drif'),
                DB::raw('SUM(modules.mh_realisee_globale) as mh_realisee'),
                DB::raw('SUM(modules.mh_restante) as mh_restante'),
                DB::raw('SUM(CASE WHEN modules.seance_efm = "Oui" THEN 1 ELSE 0 END) as has_efm'),
                DB::raw('SUM(CASE WHEN modules.mh_realisee_globale = 0 THEN 1 ELSE 0 END) as modules_non_demarres'),
                DB::raw('COUNT(modules.id) as total_modules')
            )
            ->groupBy(
                'groupes.id','groupes.nom','groupes.effectif','groupes.creneau',
                'filieres.id','filieres.intitule','secteurs.id','secteurs.nom'
            );

        if ($request->filled('secteur_id')) {
            $query->where('secteurs.id', $request->secteur_id);
        }

        if ($request->filled('filiere_id')) {
            $query->where('filieres.id', $request->filiere_id);
        }

        $groupes = $query->get();

        // Batch-fetch modules for all affected groups in one query
        $allGroupeIds = $groupes->pluck('groupe_id')->unique()->filter()->values()->toArray();
        $modulesMap = collect();
        if (!empty($allGroupeIds)) {
            $modulesMap = DB::table('modules')
                ->whereIn('groupe_id', $allGroupeIds)
                ->select('groupe_id', 'code', 'intitule', 'eg_et', 'seance_efm',
                         'mh_realisee_globale', 'mh_drif')
                ->get()
                ->groupBy('groupe_id');
        }

        $alertes = collect();

        foreach ($groupes as $g) {
            $avcPct = round($g->avc * 100, 1);
            $groupeModules = $modulesMap->get($g->groupe_id, collect());

            // 1. AVC CRITIQUE < 30%
            if ($g->avc < 0.30) {
                $relevantModules = $groupeModules
                    ->filter(fn($m) => $m->mh_drif > 0)
                    ->sortBy(fn($m) => $m->mh_drif > 0 ? $m->mh_realisee_globale / $m->mh_drif : 1)
                    ->take(4)
                    ->values()
                    ->map(fn($m) => ['code' => $m->code, 'intitule' => $m->intitule, 'eg_et' => $m->eg_et])
                    ->toArray();

                $alertes->push([
                    'code'             => 'AVC_CRITIQUE',
                    'type'             => 'critique',
                    'titre'            => "AVC critique — {$g->groupe}",
                    'message'          => "Le groupe {$g->groupe} a un AVC de {$avcPct}%, très en dessous du seuil acceptable. Une intervention immédiate est nécessaire.",
                    'groupe'           => $g->groupe,
                    'groupe_id'        => $g->groupe_id,
                    'filiere'          => $g->filiere,
                    'filiere_id'       => $g->filiere_id,
                    'secteur'          => $g->secteur,
                    'secteur_id'       => $g->secteur_id,
                    'avc'              => $avcPct,
                    'mh_drif'          => round($g->mh_drif),
                    'mh_restante'      => round($g->mh_restante),
                    'effectif'         => $g->effectif,
                    'creneau'          => $g->creneau,
                    'modules'          => $relevantModules,
                ]);
            }

            // 2. EFM prévu + AVC < 50% → retard critique
            if ($g->has_efm > 0 && $g->avc < 0.50 && $g->avc >= 0.30) {
                $relevantModules = $groupeModules
                    ->filter(fn($m) => $m->seance_efm === 'Oui')
                    ->take(4)
                    ->values()
                    ->map(fn($m) => ['code' => $m->code, 'intitule' => $m->intitule, 'eg_et' => $m->eg_et])
                    ->toArray();

                $alertes->push([
                    'code'             => 'EFM_RETARD',
                    'type'             => 'critique',
                    'titre'            => "EFM imminent — retard critique — {$g->groupe}",
                    'message'          => "Des modules avec EFM prévu ont un AVC de seulement {$avcPct}%. Le groupe risque d'entrer en EFM sans avoir achevé la matière.",
                    'groupe'           => $g->groupe,
                    'groupe_id'        => $g->groupe_id,
                    'filiere'          => $g->filiere,
                    'filiere_id'       => $g->filiere_id,
                    'secteur'          => $g->secteur,
                    'secteur_id'       => $g->secteur_id,
                    'avc'              => $avcPct,
                    'mh_drif'          => round($g->mh_drif),
                    'mh_restante'      => round($g->mh_restante),
                    'effectif'         => $g->effectif,
                    'creneau'          => $g->creneau,
                    'modules'          => $relevantModules,
                ]);
            }

            // 3. AVC FAIBLE 30–50%
            if ($g->avc >= 0.30 && $g->avc < 0.50 && $g->has_efm == 0) {
                $relevantModules = $groupeModules
                    ->filter(fn($m) => $m->mh_drif > 0)
                    ->sortBy(fn($m) => $m->mh_drif > 0 ? $m->mh_realisee_globale / $m->mh_drif : 1)
                    ->take(4)
                    ->values()
                    ->map(fn($m) => ['code' => $m->code, 'intitule' => $m->intitule, 'eg_et' => $m->eg_et])
                    ->toArray();

                $alertes->push([
                    'code'             => 'AVC_FAIBLE',
                    'type'             => 'warning',
                    'titre'            => "AVC faible — {$g->groupe}",
                    'message'          => "L'AVC du groupe {$g->groupe} est de {$avcPct}%. Un suivi rapproché est recommandé pour éviter de basculer en zone critique.",
                    'groupe'           => $g->groupe,
                    'groupe_id'        => $g->groupe_id,
                    'filiere'          => $g->filiere,
                    'filiere_id'       => $g->filiere_id,
                    'secteur'          => $g->secteur,
                    'secteur_id'       => $g->secteur_id,
                    'avc'              => $avcPct,
                    'mh_drif'          => round($g->mh_drif),
                    'mh_restante'      => round($g->mh_restante),
                    'effectif'         => $g->effectif,
                    'creneau'          => $g->creneau,
                    'modules'          => $relevantModules,
                ]);
            }

            // 4. Modules non démarrés (> 20% des modules du groupe)
            if ($g->total_modules > 0 && ($g->modules_non_demarres / $g->total_modules) > 0.20) {
                $relevantModules = $groupeModules
                    ->filter(fn($m) => $m->mh_realisee_globale == 0)
                    ->take(4)
                    ->values()
                    ->map(fn($m) => ['code' => $m->code, 'intitule' => $m->intitule, 'eg_et' => $m->eg_et])
                    ->toArray();

                $alertes->push([
                    'code'             => 'MODULE_NON_DEMARRE',
                    'type'             => 'info',
                    'titre'            => "Modules non démarrés — {$g->groupe}",
                    'message'          => "{$g->modules_non_demarres} module(s) sur {$g->total_modules} n'ont pas encore démarré dans le groupe {$g->groupe}.",
                    'groupe'           => $g->groupe,
                    'groupe_id'        => $g->groupe_id,
                    'filiere'          => $g->filiere,
                    'filiere_id'       => $g->filiere_id,
                    'secteur'          => $g->secteur,
                    'secteur_id'       => $g->secteur_id,
                    'avc'              => $avcPct,
                    'mh_drif'          => round($g->mh_drif),
                    'mh_restante'      => round($g->mh_restante),
                    'effectif'         => $g->effectif,
                    'creneau'          => $g->creneau,
                    'modules'          => $relevantModules,
                ]);
            }
        }

        if ($request->filled('type')) {
            $alertes = $alertes->filter(fn($a) => $a['type'] === $request->type)->values();
        }

        $ordre = ['critique' => 0, 'warning' => 1, 'info' => 2];
        $alertes = $alertes->sortBy(fn($a) => $ordre[$a['type']] ?? 9)->values();

        return response()->json([
            'total'    => $alertes->count(),
            'critique' => $alertes->where('type', 'critique')->count(),
            'warning'  => $alertes->where('type', 'warning')->count(),
            'info'     => $alertes->where('type', 'info')->count(),
            'alertes'  => $alertes,
        ]);
    }
}
