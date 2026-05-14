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
    /* ════════════════════════════════════════
       INDEX — liste paginée + counts par rôle
    ════════════════════════════════════════ */

    public function index(Request $request)
    {
        $query = User::with(['formateur', 'secteur'])
            ->when($request->role,   fn($q) => $q->where('role', $request->role))
            ->when($request->search, fn($q) =>
                $q->where(fn($q2) =>
                    $q2->where('name',  'like', "%{$request->search}%")
                       ->orWhere('email', 'like', "%{$request->search}%")
                )
            )
            ->latest();

        $paginated = $query->paginate(15);

        $countsRaw = User::selectRaw('role, count(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');

        $counts = [
            'directeur' => $countsRaw['directeur'] ?? 0,
            'formateur' => $countsRaw['formateur'] ?? 0,
            'pole'      => $countsRaw['pole']      ?? 0,
        ];

        return response()->json(array_merge(
            $paginated->toArray(),
            ['counts' => $counts]
        ));
    }

    /* ════════════════════════════════════════
       STORE
    ════════════════════════════════════════ */

    public function store(Request $request)
    {
        $request->validate([
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6|confirmed',
            'role'         => 'required|in:directeur,formateur,pole',
            'name'         => 'required_if:role,directeur|nullable|string|max:100',
            'formateur_id' => 'nullable|exists:formateurs,id|required_if:role,formateur|required_if:role,pole',
            'secteur_id'   => 'nullable|exists:secteurs,id|required_if:role,pole',
        ]);

        $name = $request->name;
        if (in_array($request->role, ['formateur', 'pole']) && $request->formateur_id) {
            $formateur = Formateur::find($request->formateur_id);
            $name = $formateur ? $formateur->nom : $request->name;
        }

        $user = User::create([
            'name'           => $name,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'plain_password' => $request->password,
            'role'           => $request->role,
            'is_active'      => true,
            'statut'         => 'actif',
            'formateur_id'   => in_array($request->role, ['formateur', 'pole']) ? $request->formateur_id : null,
            'secteur_id'     => $request->role === 'pole' ? $request->secteur_id : null,
        ]);

        return response()->json($user->load(['formateur', 'secteur']), 201);
    }

    /* ════════════════════════════════════════
       SHOW
    ════════════════════════════════════════ */

    public function show(User $user)
    {
        return response()->json($user->load(['formateur', 'secteur']));
    }

    /* ════════════════════════════════════════
       UPDATE
    ════════════════════════════════════════ */

    public function update(Request $request, User $user)
    {
        $request->validate([
            'email'        => 'required|email|unique:users,email,' . $user->id,
            'password'     => 'nullable|string|min:6|confirmed',
            'role'         => 'required|in:directeur,formateur,pole',
            'name'         => 'required_if:role,directeur|nullable|string|max:100',
            'formateur_id' => 'nullable|exists:formateurs,id|required_if:role,formateur|required_if:role,pole',
            'secteur_id'   => 'nullable|exists:secteurs,id|required_if:role,pole',
        ]);

        $name = $request->name;
        if (in_array($request->role, ['formateur', 'pole']) && $request->formateur_id) {
            $formateur = Formateur::find($request->formateur_id);
            $name = $formateur ? $formateur->nom : $request->name;
        }

        $user->update([
            'name'         => $name,
            'email'        => $request->email,
            'role'         => $request->role,
            'formateur_id' => in_array($request->role, ['formateur', 'pole']) ? $request->formateur_id : null,
            'secteur_id'   => $request->role === 'pole' ? $request->secteur_id : null,
        ]);

        if ($request->filled('password')) {
            $user->update([
                'password'       => Hash::make($request->password),
                'plain_password' => $request->password,
            ]);
        }

        return response()->json($user->load(['formateur', 'secteur']));
    }

    /* ════════════════════════════════════════
       DESTROY
    ════════════════════════════════════════ */

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

    /* ════════════════════════════════════════
       OPTIONS — dropdowns modal
       GET /users/options?editing_user_id=X

       ✅ FIX CRITIQUE : ->pluck() retourne une Collection.
       ->whereNotIn() sur une Collection Laravel ne filtre PAS
       comme un whereNotIn() SQL. Il faut :
         1. ->toArray() sur le pluck pour avoir un vrai array PHP
         2. Utiliser une query Eloquent directe avec whereNotIn()
            au lieu de filtrer la Collection en PHP.
    ════════════════════════════════════════ */

    public function options(Request $request)
    {
        $editingUserId = $request->query('editing_user_id');

        /* TOUS les formateurs actifs — pour le rôle pole */
        $formateursTous = Formateur::where('statut', 'actif')
            ->select('id', 'nom', 'mle')
            ->orderBy('nom')
            ->get();

        /* Formateurs disponibles : aucun compte utilisateur "formateur" lié (par id OU par nom) */
        $formateursDisponibles = Formateur::where('statut', 'actif')
            ->whereNotExists(function ($sub) use ($editingUserId) {
                $sub->select(DB::raw(1))
                    ->from('users')
                    ->where('users.role', 'formateur')
                    ->where(function ($q) {
                        $q->whereColumn('users.formateur_id', 'formateurs.id')
                          ->orWhereColumn('users.name', 'formateurs.nom');
                    })
                    ->when($editingUserId, fn($q) => $q->where('users.id', '!=', $editingUserId));
            })
            ->select('id', 'nom', 'mle')
            ->orderBy('nom')
            ->get();

        /* IDs (array PHP) des secteurs avec responsable pole existant */
        $secteursAvecPole = User::where('role', 'pole')
            ->whereNotNull('secteur_id')
            ->when($editingUserId, fn($q) => $q->where('id', '!=', $editingUserId))
            ->pluck('secteur_id')
            ->toArray();  // ← FIX : toArray() obligatoire

        $secteurs = Secteur::whereNotIn('id', $secteursAvecPole)
            ->select('id', 'nom')
            ->with(['poleSecteur' => fn($q) => $q->with(['formateur' => fn($fq) => $fq->select('id', 'nom')])])
            ->orderBy('nom')
            ->get()
            ->map(fn($s) => [
                'id'          => $s->id,
                'nom'         => $s->nom,
                'responsable' => $s->poleSecteur ? [
                    'id'  => $s->poleSecteur->formateur_id,
                    'nom' => $s->poleSecteur->formateur?->nom,
                ] : null,
            ]);

        return response()->json([
            'formateurs_disponibles' => $formateursDisponibles,
            'formateurs_tous'        => $formateursTous,
            'secteurs'               => $secteurs,
        ]);
    }

    /* ════════════════════════════════════════
       STATS — dashboard
    ════════════════════════════════════════ */

    public function stats(Request $request)
    {
        $secteurId = $request->secteur_id;
        $creneau   = $request->creneau;
        $annee     = $request->annee;
        $seuil     = $request->seuil;
        $examType  = $request->exam_type;
        $groupeId  = $request->groupe_id;
        $moduleId  = $request->module_id;

        $applyFilters = function ($query) use ($secteurId, $creneau, $annee, $examType, $groupeId, $moduleId) {
            if ($secteurId) $query->where('filieres.secteur_id', $secteurId);
            if ($creneau)   $query->where('groupes.creneau', $creneau);
            if ($annee)     $query->where('groupes.annee_formation', $annee);
            if ($examType) {
                $query->where(function ($q) use ($examType) {
                    $q->where('modules.eg_et', $examType)
                      ->orWhere('modules.type_formation', $examType);
                });
            }
            if ($groupeId)  $query->where('groupes.id', $groupeId);
            if ($moduleId)  $query->where('modules.id', $moduleId);
            return $query;
        };

        $baseQuery = fn() => DB::table('modules')
            ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->join('secteurs', 'filieres.secteur_id','=', 'secteurs.id');

        $examValues = $examType ? [$examType] : null;

        $groupeScope = Groupe::join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->when($secteurId,  fn($q) => $q->where('filieres.secteur_id', $secteurId))
            ->when($creneau,    fn($q) => $q->where('groupes.creneau', $creneau))
            ->when($annee,      fn($q) => $q->where('groupes.annee_formation', $annee))
            ->when($examValues, fn($q) => $q->whereExists(
                fn($sub) => $sub->select(DB::raw(1))
                    ->from('modules')
                    ->whereColumn('modules.groupe_id', 'groupes.id')
                    ->where(fn($sq) => $sq->whereIn('modules.type_formation', $examValues)
                                         ->orWhereIn('modules.eg_et', $examValues))
            ))
            ->when($groupeId,   fn($q) => $q->where('groupes.id', $groupeId))
            ->when($moduleId,   fn($q) => $q->whereExists(
                fn($sub) => $sub->select(DB::raw(1))
                    ->from('modules')
                    ->whereColumn('modules.groupe_id', 'groupes.id')
                    ->where('modules.id', $moduleId)
            ));

        $moduleScope = Module::join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->when($secteurId,  fn($q) => $q->where('filieres.secteur_id', $secteurId))
            ->when($creneau,    fn($q) => $q->where('groupes.creneau', $creneau))
            ->when($annee,      fn($q) => $q->where('groupes.annee_formation', $annee))
            ->when($examValues, fn($q) => $q->where(fn($sq) => $sq->whereIn('modules.type_formation', $examValues)
                                                                    ->orWhereIn('modules.eg_et', $examValues)))
            ->when($groupeId,   fn($q) => $q->where('modules.groupe_id', $groupeId))
            ->when($moduleId,   fn($q) => $q->where('modules.id', $moduleId));

        $totalFormateurs   = Formateur::count();
        $totalFilieres     = $secteurId ? Filiere::where('secteur_id', $secteurId)->count() : Filiere::count();
        $totalSecteurs     = Secteur::count();
        $totalGroupes      = (clone $groupeScope)->count('groupes.id');
        $totalModules      = (clone $moduleScope)->count('modules.id');
        $effectifTotal     = (clone $groupeScope)->sum('groupes.effectif');

        $mhRealisee = (clone $moduleScope)->sum('modules.mh_realisee_globale');
        $mhDrif     = (clone $moduleScope)->sum('modules.mh_drif');
        $mhRestante = (clone $moduleScope)->sum('modules.mh_restante');
        $avcMoyen   = $mhDrif > 0 ? $mhRealisee / $mhDrif : 0;

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

        if ($seuil === 'critique')   $avcParSecteurQ->havingRaw('avc_moyen < 0.30');
        elseif ($seuil === 'risque') $avcParSecteurQ->havingRaw('avc_moyen < 0.50');

        $avcParSecteur = $avcParSecteurQ->orderByDesc('avc_moyen')->get();

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

        if ($seuil === 'critique')   $mhParFiliereQ->havingRaw('avc_filiere < 0.30');
        elseif ($seuil === 'risque') $mhParFiliereQ->havingRaw('avc_filiere < 0.50');

        $mhParFiliere = $mhParFiliereQ->orderByDesc('mh_drif')->limit(10)->get();

        $groupesParNiveau = Groupe::select('groupes.annee_formation as annee', DB::raw('count(*) as total'))
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->whereNotNull('groupes.annee_formation')
            ->when($secteurId, fn($q) => $q->where('filieres.secteur_id', $secteurId))
            ->when($creneau,   fn($q) => $q->where('groupes.creneau', $creneau))
            ->when($annee,      fn($q) => $q->where('groupes.annee_formation', $annee))
            ->when($examValues, fn($q) => $q->whereExists(
                fn($sub) => $sub->select(DB::raw(1))
                    ->from('modules')
                    ->whereColumn('modules.groupe_id', 'groupes.id')
                    ->where(fn($sq) => $sq->whereIn('modules.type_formation', $examValues)
                                         ->orWhereIn('modules.eg_et', $examValues))
            ))
            ->when($groupeId,   fn($q) => $q->where('groupes.id', $groupeId))
            ->groupBy('groupes.annee_formation')
            ->orderBy('groupes.annee_formation')
            ->get();

        $groupesData = DB::table('modules')
            ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->join('secteurs', 'filieres.secteur_id','=', 'secteurs.id')
            ->when($secteurId, fn($q) => $q->where('filieres.secteur_id', $secteurId))
            ->when($creneau,    fn($q) => $q->where('groupes.creneau', $creneau))
            ->when($annee,      fn($q) => $q->where('groupes.annee_formation', $annee))
            ->when($examValues, fn($q) => $q->where(fn($sq) => $sq->whereIn('modules.type_formation', $examValues)
                                                                    ->orWhereIn('modules.eg_et', $examValues)))
            ->when($groupeId,   fn($q) => $q->where('groupes.id', $groupeId))
            ->when($moduleId,   fn($q) => $q->where('modules.id', $moduleId))
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

        $secteursList = Secteur::select('id', 'nom')->orderBy('nom')->get();

        // Exclude known garbage values that come from accidental header-row imports
        $excludeValues = ['Type de formation'];

        $examTypesList = collect()
            ->merge(
                DB::table('modules')->whereNotNull('eg_et')
                    ->where('eg_et', '!=', '')->whereNotIn('eg_et', $excludeValues)
                    ->distinct()->pluck('eg_et')
            )
            ->merge(
                DB::table('modules')->whereNotNull('type_formation')
                    ->where('type_formation', '!=', '')->whereNotIn('type_formation', $excludeValues)
                    ->distinct()->pluck('type_formation')
            )
            ->unique()
            ->sort()
            ->values();

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

        $modulesList = [];

        if ($secteurId) {
            $modulesList = DB::table('modules')
                ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
                ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                ->select(
                    'modules.id', 'modules.code', 'modules.intitule',
                    'modules.mh_drif', 'modules.mh_realisee_globale',
                    'modules.mh_restante', 'modules.taux_realisation',
                    'modules.seance_efm', 'groupes.nom as groupe_nom'
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
            'total_formateurs'     => $totalFormateurs,
            'total_groupes'        => $totalGroupes,
            'total_modules'        => $totalModules,
            'total_filieres'       => $totalFilieres,
            'total_secteurs'       => $totalSecteurs,
            'mh_realisee_totale'   => round($mhRealisee),
            'mh_restante_totale'   => round($mhRestante),
            'mh_drif_totale'       => round($mhDrif),
            'avc_moyen_global'     => round($avcMoyen, 4),
            'effectif_total'       => $effectifTotal,
            'avc_par_secteur'      => $avcParSecteur,
            'distribution_groupes' => $distribution,
            'mh_par_filiere'       => $mhParFiliere,
            'groupes_par_niveau'   => $groupesParNiveau,
            'formateurs_actifs'    => Formateur::where('statut', 'actif')->count(),
            'formateurs_inactifs'  => Formateur::where('statut', 'inactif')->count(),
            'par_specialite'       => [],
            'alertes_count'        => $alertesCount,
            'secteurs_list'        => $secteursList,
            'exam_types_list'      => $examTypesList,
            'groupes_list'         => $groupesList,
            'modules_list'         => $modulesList,
            'filtres_actifs'       => array_filter([
                'secteur_id' => $secteurId,
                'creneau'    => $creneau,
                'annee'      => $annee,
                'seuil'      => $seuil,
                'exam_type'  => $examType,
                'groupe_id'  => $groupeId,
                'module_id'  => $moduleId,
            ]),
        ]);
    }
}