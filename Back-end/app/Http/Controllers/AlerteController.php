<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlerteController extends Controller
{
    /**
     * GET /api/alertes
     * Génère les alertes pédagogiques depuis les données importées
     */
    public function index(Request $request)
    {
        // ── Base query : AVC + EFM par groupe ──
        $query = DB::table('modules')
            ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->join('secteurs', 'filieres.secteur_id','=', 'secteurs.id')
            ->select(
                'groupes.id as groupe_id',
                'groupes.nom as groupe',
                'groupes.effectif',
                'groupes.creneau',
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
                'filieres.intitule','secteurs.id','secteurs.nom'
            );

        // Filtre secteur
        if ($request->filled('secteur_id')) {
            $query->where('secteurs.id', $request->secteur_id);
        }

        $groupes = $query->get();

        // ── Génération des alertes ──
        $alertes = collect();

        foreach ($groupes as $g) {
            $avcPct = round($g->avc * 100, 1);

            // 1. AVC CRITIQUE < 30%
            if ($g->avc < 0.30) {
                $alertes->push([
                    'code'        => 'AVC_CRITIQUE',
                    'type'        => 'critique',
                    'titre'       => "AVC critique — {$g->groupe}",
                    'message'     => "Le groupe {$g->groupe} a un AVC de {$avcPct}%, très en dessous du seuil acceptable. Une intervention immédiate est nécessaire.",
                    'groupe'      => $g->groupe,
                    'filiere'     => $g->filiere,
                    'secteur'     => $g->secteur,
                    'secteur_id'  => $g->secteur_id,
                    'avc'         => $avcPct,
                    'mh_drif'     => round($g->mh_drif),
                    'mh_restante' => round($g->mh_restante),
                    'effectif'    => $g->effectif,
                    'creneau'     => $g->creneau,
                ]);
            }

            // 2. EFM prévu + AVC < 50% → retard critique
            if ($g->has_efm > 0 && $g->avc < 0.50 && $g->avc >= 0.30) {
                $alertes->push([
                    'code'        => 'EFM_RETARD',
                    'type'        => 'critique',
                    'titre'       => "EFM imminent — retard critique — {$g->groupe}",
                    'message'     => "Des modules avec EFM prévu ont un AVC de seulement {$avcPct}%. Le groupe risque d'entrer en EFM sans avoir achevé la matière.",
                    'groupe'      => $g->groupe,
                    'filiere'     => $g->filiere,
                    'secteur'     => $g->secteur,
                    'secteur_id'  => $g->secteur_id,
                    'avc'         => $avcPct,
                    'mh_drif'     => round($g->mh_drif),
                    'mh_restante' => round($g->mh_restante),
                    'effectif'    => $g->effectif,
                    'creneau'     => $g->creneau,
                ]);
            }

            // 3. AVC FAIBLE 30–50%
            if ($g->avc >= 0.30 && $g->avc < 0.50 && $g->has_efm == 0) {
                $alertes->push([
                    'code'        => 'AVC_FAIBLE',
                    'type'        => 'warning',
                    'titre'       => "AVC faible — {$g->groupe}",
                    'message'     => "L'AVC du groupe {$g->groupe} est de {$avcPct}%. Un suivi rapproché est recommandé pour éviter de basculer en zone critique.",
                    'groupe'      => $g->groupe,
                    'filiere'     => $g->filiere,
                    'secteur'     => $g->secteur,
                    'secteur_id'  => $g->secteur_id,
                    'avc'         => $avcPct,
                    'mh_drif'     => round($g->mh_drif),
                    'mh_restante' => round($g->mh_restante),
                    'effectif'    => $g->effectif,
                    'creneau'     => $g->creneau,
                ]);
            }

            // 4. Modules non démarrés (> 20% des modules du groupe)
            if ($g->total_modules > 0 && ($g->modules_non_demarres / $g->total_modules) > 0.20) {
                $alertes->push([
                    'code'        => 'MODULE_NON_DEMARRE',
                    'type'        => 'info',
                    'titre'       => "Modules non démarrés — {$g->groupe}",
                    'message'     => "{$g->modules_non_demarres} module(s) sur {$g->total_modules} n'ont pas encore démarré dans le groupe {$g->groupe}.",
                    'groupe'      => $g->groupe,
                    'filiere'     => $g->filiere,
                    'secteur'     => $g->secteur,
                    'secteur_id'  => $g->secteur_id,
                    'avc'         => $avcPct,
                    'mh_drif'     => round($g->mh_drif),
                    'mh_restante' => round($g->mh_restante),
                    'effectif'    => $g->effectif,
                    'creneau'     => $g->creneau,
                ]);
            }
        }

        // Filtre type (critique / warning / info)
        if ($request->filled('type')) {
            $alertes = $alertes->filter(fn($a) => $a['type'] === $request->type)->values();
        }

        // Tri : critiques en premier
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