<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Filiere;
use App\Models\Secteur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', '!=', 'directeur')
            ->when($request->role,   fn($q) => $q->where('role', $request->role))
            ->when($request->search, fn($q) =>
                $q->where(fn($q2) =>
                    $q2->where('name',        'like', "%{$request->search}%")
                       ->orWhere('email',      'like', "%{$request->search}%")
                       ->orWhere('specialite', 'like', "%{$request->search}%")
                )
            )
            ->when($request->statut, fn($q) => $q->where('statut', $request->statut))
            ->latest();

        return response()->json($query->paginate(10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:6',
            'role'       => 'required|in:formateur,surveillant',
            'specialite' => 'nullable|string|max:150',
            'telephone'  => 'nullable|string|max:20',
            'statut'     => 'in:actif,inactif',
        ]);

        $user = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role'       => $request->role,
            'is_active'  => true,
            'specialite' => $request->specialite,
            'telephone'  => $request->telephone,
            'statut'     => $request->statut ?? 'actif',
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'       => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email,' . $user->id,
            'role'       => 'required|in:formateur,surveillant',
            'specialite' => 'nullable|string|max:150',
            'telephone'  => 'nullable|string|max:20',
            'statut'     => 'in:actif,inactif',
        ]);

        $user->update($request->only(['name', 'email', 'role', 'specialite', 'telephone', 'statut']));

        if ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        return response()->json($user);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Impossible de supprimer votre propre compte.'], 403);
        }
        if ($user->role === 'directeur') {
            return response()->json(['message' => 'Impossible de supprimer un directeur.'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé.']);
    }

    /**
     * GET /api/stats
     * Params optionnels :
     *   ?secteur_id=1
     *   ?creneau=CDJ|CDS
     *   ?annee=1|2|3
     *   ?seuil=critique|risque   (critique = AVC<30%, risque = AVC<50%)
     */
    public function stats(Request $request)
    {
        // ══════════════════════════════════════════
        //  HELPERS — scope commun appliqué partout
        // ══════════════════════════════════════════
        $secteurId = $request->secteur_id;
        $creneau   = $request->creneau;        // CDJ | CDS | null
        $annee     = $request->annee;           // 1 | 2 | 3 | null
        $seuil     = $request->seuil;           // critique | risque | null

        // Closure réutilisable pour appliquer les filtres sur modules+groupes
        $applyFilters = function ($query) use ($secteurId, $creneau, $annee) {
            if ($secteurId) {
                $query->where('filieres.secteur_id', $secteurId);
            }
            if ($creneau) {
                $query->where('groupes.creneau', $creneau);
            }
            if ($annee) {
                $query->where('groupes.annee_formation', $annee);
            }
            return $query;
        };

        // Base query modules → groupes → filieres → secteurs
        $baseQuery = fn() => DB::table('modules')
            ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->join('secteurs', 'filieres.secteur_id','=', 'secteurs.id');

        // ══════════════════════════════════════════
        //  COMPTEURS (filtrés)
        // ══════════════════════════════════════════
        $groupeScope = Groupe::join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->when($secteurId, fn($q) => $q->where('filieres.secteur_id', $secteurId))
            ->when($creneau,   fn($q) => $q->where('groupes.creneau', $creneau))
            ->when($annee,     fn($q) => $q->where('groupes.annee_formation', $annee));

        $moduleScope = Module::join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->when($secteurId, fn($q) => $q->where('filieres.secteur_id', $secteurId))
            ->when($creneau,   fn($q) => $q->where('groupes.creneau', $creneau))
            ->when($annee,     fn($q) => $q->where('groupes.annee_formation', $annee));

        // Si pas de filtre → compteurs globaux rapides
        $totalFormateurs   = Formateur::count();
        $totalSurveillants = User::where('role', 'surveillant')->count();
        $totalFilieres     = $secteurId
            ? Filiere::where('secteur_id', $secteurId)->count()
            : Filiere::count();
        $totalSecteurs     = Secteur::count();

        $totalGroupes  = (clone $groupeScope)->count('groupes.id');
        $totalModules  = (clone $moduleScope)->count('modules.id');
        $effectifTotal = (clone $groupeScope)->sum('groupes.effectif');

        // ── MH globales (filtrées) ──
        $mhRealisee = (clone $moduleScope)->sum('modules.mh_realisee_globale');
        $mhDrif     = (clone $moduleScope)->sum('modules.mh_drif');
        $mhRestante = (clone $moduleScope)->sum('modules.mh_restante');
        $avcMoyen   = $mhDrif > 0 ? $mhRealisee / $mhDrif : 0;

        // ══════════════════════════════════════════
        //  AVC PAR SECTEUR (filtré)
        // ══════════════════════════════════════════
        $avcParSecteurQ = $applyFilters($baseQuery()
            ->select(
                'secteurs.id as secteur_id',
                'secteurs.nom as secteur',
                DB::raw('SUM(modules.mh_realisee_globale) as mh_realisee'),
                DB::raw('SUM(modules.mh_drif) as mh_drif'),
                DB::raw('CASE WHEN SUM(modules.mh_drif) > 0
                         THEN SUM(modules.mh_realisee_globale) / SUM(modules.mh_drif)
                         ELSE 0 END as avc_moyen')
            )
            ->groupBy('secteurs.id', 'secteurs.nom')
        );

        // Filtre seuil AVC sur les secteurs
        if ($seuil === 'critique') {
            $avcParSecteurQ->havingRaw('avc_moyen < 0.30');
        } elseif ($seuil === 'risque') {
            $avcParSecteurQ->havingRaw('avc_moyen < 0.50');
        }

        $avcParSecteur = $avcParSecteurQ->orderByDesc('avc_moyen')->get();

        // ══════════════════════════════════════════
        //  DISTRIBUTION GROUPES (filtrée)
        // ══════════════════════════════════════════
        $groupesAvc = $applyFilters($baseQuery()
            ->select(
                'groupes.id',
                DB::raw('CASE WHEN SUM(modules.mh_drif) > 0
                         THEN SUM(modules.mh_realisee_globale) / SUM(modules.mh_drif)
                         ELSE 0 END as avc')
            )
            ->groupBy('groupes.id')
        )->get();

        $distribution = ['critique' => 0, 'faible' => 0, 'moyen' => 0, 'bon' => 0, 'depasse' => 0];
        foreach ($groupesAvc as $g) {
            $v = $g->avc * 100;
            if ($seuil === 'critique' && $v >= 30) continue;
            if ($seuil === 'risque'   && $v >= 50) continue;
            if ($v >= 100)    $distribution['depasse']++;
            elseif ($v >= 70) $distribution['bon']++;
            elseif ($v >= 50) $distribution['moyen']++;
            elseif ($v >= 30) $distribution['faible']++;
            else              $distribution['critique']++;
        }

        // ══════════════════════════════════════════
        //  MH PAR FILIÈRE (filtrée, top 10)
        // ══════════════════════════════════════════
        $mhParFiliereQ = $applyFilters($baseQuery()
            ->select(
                'filieres.intitule as filiere',
                DB::raw('SUM(modules.mh_drif) as mh_drif'),
                DB::raw('SUM(modules.mh_realisee_globale) as mh_realisee'),
                DB::raw('CASE WHEN SUM(modules.mh_drif) > 0
                         THEN SUM(modules.mh_realisee_globale) / SUM(modules.mh_drif)
                         ELSE 0 END as avc_filiere')
            )
            ->groupBy('filieres.intitule')
        );

        if ($seuil === 'critique') {
            $mhParFiliereQ->havingRaw('avc_filiere < 0.30');
        } elseif ($seuil === 'risque') {
            $mhParFiliereQ->havingRaw('avc_filiere < 0.50');
        }

        $mhParFiliere = $mhParFiliereQ->orderByDesc('mh_drif')->limit(10)->get();

        // ══════════════════════════════════════════
        //  GROUPES PAR NIVEAU (filtré)
        // ══════════════════════════════════════════
        $groupesParNiveau = Groupe::select(
                'groupes.annee_formation as annee',
                DB::raw('count(*) as total')
            )
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->whereNotNull('groupes.annee_formation')
            ->when($secteurId, fn($q) => $q->where('filieres.secteur_id', $secteurId))
            ->when($creneau,   fn($q) => $q->where('groupes.creneau', $creneau))
            ->when($annee,     fn($q) => $q->where('groupes.annee_formation', $annee))
            ->groupBy('groupes.annee_formation')
            ->orderBy('groupes.annee_formation')
            ->get();

        // ══════════════════════════════════════════
        //  ALERTES COUNT (toujours global pour navbar)
        // ══════════════════════════════════════════
        $groupesData = DB::table('modules')
            ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->join('secteurs', 'filieres.secteur_id','=', 'secteurs.id')
            ->select(
                'groupes.id as groupe_id',
                DB::raw('CASE WHEN SUM(modules.mh_drif) > 0
                         THEN SUM(modules.mh_realisee_globale) / SUM(modules.mh_drif)
                         ELSE 0 END as avc'),
                DB::raw('SUM(CASE WHEN modules.seance_efm = "Oui" THEN 1 ELSE 0 END) as has_efm'),
                DB::raw('SUM(CASE WHEN modules.mh_realisee_globale = 0 THEN 1 ELSE 0 END) as modules_non_demarres'),
                DB::raw('COUNT(modules.id) as total_modules')
            )
            ->groupBy('groupes.id')
            ->get();

        $alertesCount = 0;
        foreach ($groupesData as $g) {
            if ($g->avc < 0.30) $alertesCount++;
            if ($g->has_efm > 0 && $g->avc >= 0.30 && $g->avc < 0.50) $alertesCount++;
            if ($g->avc >= 0.30 && $g->avc < 0.50 && $g->has_efm == 0) $alertesCount++;
            if ($g->total_modules > 0 && ($g->modules_non_demarres / $g->total_modules) > 0.20) $alertesCount++;
        }

        // ══════════════════════════════════════════
        //  LISTE SECTEURS (pour les dropdowns frontend)
        // ══════════════════════════════════════════
        $secteursList = Secteur::select('id', 'nom')->orderBy('nom')->get();

        // Groupes list - seulement si secteur_id fourni
        $groupesList = [];
        if ($secteurId) {
            $groupesList = Groupe::select('groupes.id', 'groupes.nom', 'groupes.creneau', 'groupes.annee_formation')
                ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                ->where('filieres.secteur_id', $secteurId)
                ->when($creneau, fn($q) => $q->where('groupes.creneau', $creneau))
                ->when($annee,   fn($q) => $q->where('groupes.annee_formation', $annee))
                ->orderBy('groupes.nom')
                ->get();
        }

        // Modules list - seulement si secteur_id fourni
        $modulesList = [];
        $groupeId    = $request->groupe_id;

        if ($secteurId) {
            $modulesList = DB::table('modules')
                ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
                ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                ->select(
                    'modules.id',
                    'modules.code',
                    'modules.intitule',
                    'modules.mh_drif',
                    'modules.mh_realisee_globale',
                    'modules.mh_restante',
                    'modules.taux_realisation',
                    'modules.seance_efm',
                    'groupes.nom as groupe_nom'
                )
                ->where('filieres.secteur_id', $secteurId)
                ->when($creneau,  fn($q) => $q->where('groupes.creneau', $creneau))
                ->when($annee,    fn($q) => $q->where('groupes.annee_formation', $annee))
                ->when($groupeId, fn($q) => $q->where('modules.groupe_id', $groupeId))
                ->orderBy('groupes.nom')
                ->orderBy('modules.code')
                ->limit(200)
                ->get();
        }

        return response()->json([
            'total_formateurs'    => $totalFormateurs,
            'total_groupes'       => $totalGroupes,
            'total_modules'       => $totalModules,
            'total_filieres'      => $totalFilieres,
            'total_secteurs'      => $totalSecteurs,
            'total_surveillants'  => $totalSurveillants,
            'mh_realisee_totale'  => round($mhRealisee),
            'mh_restante_totale'  => round($mhRestante),
            'mh_drif_totale'      => round($mhDrif),
            'avc_moyen_global'    => round($avcMoyen, 4),
            'effectif_total'      => $effectifTotal,
            'avc_par_secteur'     => $avcParSecteur,
            'distribution_groupes'=> $distribution,
            'mh_par_filiere'      => $mhParFiliere,
            'groupes_par_niveau'  => $groupesParNiveau,
            'formateurs_actifs'   => Formateur::where('statut', 'actif')->count(),
            'formateurs_inactifs' => Formateur::where('statut', 'inactif')->count(),
            'par_specialite'      => [],
            'alertes_count'       => $alertesCount,
            'secteurs_list'       => $secteursList,
            'groupes_list'        => $groupesList,
            'modules_list'        => $modulesList,
            // Filtres actifs renvoyés (utile pour debug frontend)
            'filtres_actifs'      => array_filter([
                'secteur_id' => $secteurId,
                'creneau'    => $creneau,
                'annee'      => $annee,
                'seuil'      => $seuil,
            ]),
        ]);
    }
}