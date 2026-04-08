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
     * Stats complètes issues du fichier Excel importé
     */
    public function stats()
    {
        // ── Compteurs de base ──
        $totalFormateurs  = Formateur::count();
        $totalGroupes     = Groupe::count();
        $totalModules     = Module::count();
        $totalFilieres    = Filiere::count();
        $totalSecteurs    = Secteur::count();

        // ── Users système ──
        $totalSurveillants = User::where('role', 'surveillant')->count();

        // ── MH globales ──
        $mhRealisee = Module::sum('mh_realisee_globale');
        $mhDrif     = Module::sum('mh_drif');
        $mhRestante = Module::sum('mh_restante');

        // ── AVC moyen global ──
        $avcMoyen = $mhDrif > 0 ? $mhRealisee / $mhDrif : 0;

        // ── Effectif total ──
        $effectifTotal = Groupe::sum('effectif');

        // ── AVC par secteur ──
        $avcParSecteur = DB::table('modules')
            ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->join('secteurs', 'filieres.secteur_id','=', 'secteurs.id')
            ->select(
                'secteurs.nom as secteur',
                DB::raw('SUM(modules.mh_realisee_globale) as mh_realisee'),
                DB::raw('SUM(modules.mh_drif) as mh_drif'),
                DB::raw('CASE WHEN SUM(modules.mh_drif) > 0 THEN SUM(modules.mh_realisee_globale) / SUM(modules.mh_drif) ELSE 0 END as avc_moyen')
            )
            ->groupBy('secteurs.nom')
            ->orderByDesc('avc_moyen')
            ->get();

        // ── Distribution groupes par tranche AVC ──
        $groupesAvc = DB::table('modules')
            ->join('groupes', 'modules.groupe_id', '=', 'groupes.id')
            ->select(
                'groupes.id',
                DB::raw('CASE WHEN SUM(modules.mh_drif) > 0 THEN SUM(modules.mh_realisee_globale) / SUM(modules.mh_drif) ELSE 0 END as avc')
            )
            ->groupBy('groupes.id')
            ->get();

        $distribution = ['critique' => 0, 'faible' => 0, 'moyen' => 0, 'bon' => 0, 'depasse' => 0];
        foreach ($groupesAvc as $g) {
            $v = $g->avc * 100;
            if ($v >= 100)     $distribution['depasse']++;
            elseif ($v >= 70)  $distribution['bon']++;
            elseif ($v >= 50)  $distribution['moyen']++;
            elseif ($v >= 30)  $distribution['faible']++;
            else               $distribution['critique']++;
        }

        // ── MH DRIF vs Réalisée par filière (top 10) ──
        $mhParFiliere = DB::table('modules')
            ->join('groupes',  'modules.groupe_id',  '=', 'groupes.id')
            ->join('filieres', 'groupes.filiere_id', '=', 'filieres.id')
            ->select(
                'filieres.intitule as filiere',
                DB::raw('SUM(modules.mh_drif) as mh_drif'),
                DB::raw('SUM(modules.mh_realisee_globale) as mh_realisee')
            )
            ->groupBy('filieres.intitule')
            ->orderByDesc('mh_drif')
            ->limit(10)
            ->get();

        // ── Groupes par année de formation ──
        $groupesParNiveau = Groupe::select('annee_formation as annee', DB::raw('count(*) as total'))
            ->whereNotNull('annee_formation')
            ->groupBy('annee_formation')
            ->orderBy('annee_formation')
            ->get();

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
    // 1. AVC CRITIQUE < 30%
    if ($g->avc < 0.30) {
        $alertesCount++;
    }
    // 2. EFM prévu + AVC entre 30% et 50%
    if ($g->has_efm > 0 && $g->avc >= 0.30 && $g->avc < 0.50) {
        $alertesCount++;
    }
    // 3. AVC FAIBLE 30–50% sans EFM
    if ($g->avc >= 0.30 && $g->avc < 0.50 && $g->has_efm == 0) {
        $alertesCount++;
    }
    // 4. Modules non démarrés > 20%
    if ($g->total_modules > 0 && ($g->modules_non_demarres / $g->total_modules) > 0.20) {
        $alertesCount++;
    }
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
    'alertes_count'       => $alertesCount,   // ← AJOUTER
        ]);
    }
}