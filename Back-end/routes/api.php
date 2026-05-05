<?php
// routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FormateurController;
use App\Http\Controllers\GroupeController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\PoleController;
use App\Http\Controllers\AlerteController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\EmploiController;
use App\Http\Controllers\FormateurEmploiController;
use App\Http\Controllers\SalleController;
use App\Http\Controllers\StageController;
use App\Http\Controllers\FormateurAbsenceController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::post('/login', [AuthController::class, 'login']);

// Route publique : liste des groupes (pour l'espace stagiaire)
Route::get('/public-groupes', function () {
    $groupes = DB::table('groupes')
        ->select('groupes.id', 'groupes.nom',
            DB::raw("COALESCE(filieres.intitule, filieres.code, '') as filiere"))
        ->leftJoin('filieres', 'groupes.filiere_id', '=', 'filieres.id')
        ->orderBy('groupes.nom')
        ->get();
    return response()->json(['data' => $groupes]);
});

// Route publique : emploi du temps par groupe (pour l'espace stagiaire)
Route::get('/public-emploi', function (\Illuminate\Http\Request $request) {
    if (!$request->filled('groupe_id')) {
        return response()->json(['data' => null]);
    }
    $emploi = \App\Models\EmploiDuTemps::with('groupe')
        ->where('groupe_id', $request->groupe_id)
        ->orderByDesc('created_at')
        ->first();
    if (!$emploi) {
        return response()->json(['data' => null, 'message' => 'Aucun emploi trouvé pour ce groupe.']);
    }
    return response()->json(['data' => [
        'id'               => $emploi->id,
        'groupe'           => $emploi->groupe?->nom ?? '—',
        'semestre'         => $emploi->semestre,
        'periodeDebut'     => $emploi->periode_debut?->format('d/m/Y'),
        'formateur_parrain'=> $emploi->formateur_parrain,
        'grille'           => $emploi->grille,
    ]]);
});

// Route publique : statistiques générales pour la page d'accueil (sans authentification)
Route::get('/public-stats', function () {
    return response()->json([
        'total_secteurs'  => DB::table('secteurs')->count(),
        'total_groupes'   => DB::table('groupes')->count(),
        'total_filieres'  => DB::table('filieres')->count(),
        'total_formateurs'=> DB::table('formateurs')->count(),
        'total_modules'   => DB::table('modules')->count(),
    ]);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── DIRECTEUR ──
    Route::middleware('role:directeur')->group(function () {
        Route::get('/stats', [UserController::class, 'stats']);

        // ⚠️  /users/options DOIT être AVANT apiResource (sinon Laravel
        //     interprète "options" comme un {user} et retourne 404)
        Route::get('/users/options',         [UserController::class, 'options']);
        Route::apiResource('users',          UserController::class);

        Route::get('/formateurs/all',            [FormateurController::class, 'all']);
        Route::get('/formateurs',                [FormateurController::class, 'index']);
        Route::post('/formateurs',               [FormateurController::class, 'store']);
        Route::put('/formateurs/{formateur}',    [FormateurController::class, 'update']);
        Route::delete('/formateurs/{formateur}', [FormateurController::class, 'destroy']);

        Route::get('/groupes',                   [GroupeController::class, 'index']);
        Route::get('/filieres-list',             [GroupeController::class, 'filieresList']);
        Route::get('/modules-list',              [ModuleController::class, 'index']);
        Route::post('/import/base-plate',        [ImportController::class, 'import']);
        Route::post('/import/salles',            [SalleController::class, 'import']);
        Route::get('/pole',                      [PoleController::class, 'index']);
        Route::get('/pole/{secteur}/groupes',    [PoleController::class, 'groupesSecteur']);
        Route::post('/pole/assign',              [PoleController::class, 'assign']);
        Route::delete('/pole/{secteur}',         [PoleController::class, 'remove']);
        Route::get('/alertes',                   [AlerteController::class, 'index']);

        Route::get('/suivi-journalier', function () {
            $jours    = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            $horaires = ['08:30–11:00', '11:00–13:30', '13:30–16:00', '16:00–18:30'];

            $emplois = \App\Models\EmploiDuTemps::with('groupe')
                ->orderByDesc('created_at')
                ->get()
                ->unique('groupe_id');

            $result = [];
            foreach ($jours as $jour) {
                $rows = [];
                for ($si = 0; $si < 4; $si++) {
                    foreach ($emplois as $emploi) {
                        $grille = $emploi->grille;
                        if (!is_array($grille)) continue;
                        $cell = $grille[$jour][$si] ?? null;
                        if (!$cell || empty($cell['module'])) continue;
                        $mod = $cell['module'];
                        $rows[] = [
                            'horaire'   => $horaires[$si],
                            'formateur' => $cell['formateur'] ?? '—',
                            'groupe'    => $emploi->groupe?->nom ?? '—',
                            'salle'     => ($cell['mode'] ?? '') === 'DISTANCIEL' ? 'En ligne' : ($cell['salle'] ?? '—'),
                            'module'    => is_array($mod) ? ($mod['intitule'] ?? $mod['code'] ?? '—') : (string)$mod,
                            'mode'      => $cell['mode'] ?? 'PRESENTIEL',
                        ];
                    }
                }
                usort($rows, fn($a, $b) => $a['horaire'] !== $b['horaire']
                    ? strcmp($a['horaire'], $b['horaire'])
                    : strcmp($a['groupe'], $b['groupe']));
                $result[$jour] = $rows;
            }

            return response()->json(['data' => $result]);
        });
    });

    // ── SURVEILLANT ──
    Route::middleware('role:surveillant')->prefix('surveillant')->group(function () {
        Route::get('/planning',     fn() => response()->json(['page' => 'Planning']));
        Route::get('/emploi-temps', fn() => response()->json(['page' => 'Emploi du Temps']));
    });

    // ── FORMATEUR ──
    Route::middleware('role:formateur')->prefix('formateur')->group(function () {
        Route::get('/seances',         fn() => response()->json(['page' => 'Séances']));
        Route::get('/planning',        [FormateurController::class, 'planning']);
        Route::get('/emploi-du-temps', [FormateurController::class, 'emploi']);
    });

    // ── PÔLE ──
    Route::middleware('role:pole')->group(function () {

         // Stages
          Route::get('/stages/semaines-bloquees', [StageController::class, 'semainesBloquees']);
          Route::apiResource('stages', StageController::class);

        // Absences formateurs
        Route::apiResource('absences', FormateurAbsenceController::class);

        Route::put('/plannings/{planning}/semaine',          [PlanningController::class, 'updateSemaine']);
        Route::post('/plannings/{planning}/auto-distribuer', [PlanningController::class, 'autoDistribuerRoute']);

        // Emplois du temps (formateurs)
        Route::post('/formateur-emplois',       [FormateurEmploiController::class, 'store']);
        Route::get('/formateur-emplois',        [FormateurEmploiController::class, 'index']);
        Route::get('/formateur-emplois/{id}',   [FormateurEmploiController::class, 'show']);
        Route::delete('/formateur-emplois/{id}',[FormateurEmploiController::class, 'destroy']);

        // Emplois du temps
        Route::prefix('emplois')->group(function () {
            Route::get('/',                         [EmploiController::class, 'index']);
            Route::post('/',                        [EmploiController::class, 'store']);
            Route::post('/generate-from-plannings', [EmploiController::class, 'generateFromPlannings']);
            Route::get('/formateur/{formateurId}',  [EmploiController::class, 'formateurTimetable']);
            Route::get('/{id}',                     [EmploiController::class, 'show']);
            Route::put('/{id}',                     [EmploiController::class, 'update']);
            Route::delete('/{id}',                  [EmploiController::class, 'destroy']);
        });

        // Plannings
        Route::prefix('plannings')->group(function () {
            Route::get('/',                            [PlanningController::class, 'index']);
            Route::post('/',                           [PlanningController::class, 'store']);
            Route::put('/{planning}',                  [PlanningController::class, 'update']);
            Route::delete('/{planning}',               [PlanningController::class, 'destroy']);
            Route::put('/{planning}/semaine',          [PlanningController::class, 'updateSemaine']);
            Route::post('/{planning}/auto-distribuer', [PlanningController::class, 'autoDistribuerRoute']);
        });

        // Salles — disponibles MUST come before /{id}
        Route::get('/salles/disponibles', [SalleController::class, 'disponibles']);
        Route::get('/salles',             [SalleController::class, 'index']);
        Route::post('/salles',            [SalleController::class, 'store']);

        // Groupes pour le modal planning — filtrés par le secteur du pôle connecté
        Route::get('/pole-groupes', function (\Illuminate\Http\Request $request) {
            $user      = $request->user();
            $secteurId = $user->secteur_id; // Le pôle a toujours un secteur_id

            $query = DB::table('groupes')
                ->select('groupes.id', 'groupes.nom',
                    DB::raw("COALESCE(filieres.intitule, filieres.code, '') as filiere"),
                    'filieres.secteur_id')
                ->leftJoin('filieres', 'groupes.filiere_id', '=', 'filieres.id');

            // Filtrer par secteur si l'utilisateur en a un
            if ($secteurId) {
                $query->where('filieres.secteur_id', $secteurId);
            }

            return response()->json(['data' => $query->orderBy('groupes.nom')->get()]);
        });

        // Formateurs pour le modal
        Route::get('/pole-formateurs', function () {
            $formateurs = DB::table('formateurs')
                ->select('id', 'nom')
                ->orderBy('nom')
                ->get();
            return response()->json(['data' => $formateurs]);
        });

        // Modules filtrés par groupe_id
        Route::get('/pole-modules', function (\Illuminate\Http\Request $request) {
            $query = DB::table('modules')
                ->select('id', 'intitule', 'code', 'semestre', 'mh_drif', 'formateur_id', 'eg_et');

            if ($request->filled('groupe_id')) {
                $query->where('groupe_id', $request->groupe_id);
            }

            return response()->json([
                'data' => $query->orderBy('semestre')->orderBy('intitule')->get(),
            ]);
        });

        // Générer tous les emplois des formateurs depuis les emplois du temps existants
        Route::post('/generer-emplois-formateurs', function (\Illuminate\Http\Request $request) {
            $emplois    = \App\Models\EmploiDuTemps::all();
            $jours      = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            $nbSeances  = 4;

            // Regrouper les séances par formateur_id
            $parFormateur = [];
            foreach ($emplois as $emploi) {
                if (!is_array($emploi->grille)) continue;
                foreach ($jours as $jour) {
                    foreach (($emploi->grille[$jour] ?? []) as $si => $cell) {
                        if (empty($cell) || empty($cell['formateur_id'])) continue;
                        $fid = (int)$cell['formateur_id'];
                        if (!isset($parFormateur[$fid])) {
                            $parFormateur[$fid] = [];
                            foreach ($jours as $j) $parFormateur[$fid][$j] = array_fill(0, $nbSeances, null);
                        }
                        // Ne pas écraser une séance déjà placée pour ce formateur
                        if ($parFormateur[$fid][$jour][$si] === null) {
                            $parFormateur[$fid][$jour][$si] = [
                                'module'  => $cell['module']  ?? '—',
                                'groupe'  => $emploi->groupe?->nom ?? '?',
                                'salle'   => $cell['salle']   ?? '',
                                'mode'    => $cell['mode']    ?? 'PRESENTIEL',
                            ];
                        }
                    }
                }
            }

            $created = 0;
            $semestre = $request->semestre ?? 'S1';

            foreach ($parFormateur as $fid => $grille) {
                // Créer ou mettre à jour l'emploi du formateur
                \App\Models\FormateurEmploi::updateOrCreate(
                    ['formateur_id' => $fid, 'semestre' => $semestre],
                    ['grille' => $grille]
                );
                $created++;
            }

            return response()->json([
                'message' => "{$created} emploi(s) de formateur(s) générés avec succès.",
                'count'   => $created,
            ]);
        });
    });

    Route::put('/plannings/{planning}', [PlanningController::class, 'update']);
    Route::get('/emploi-temps/view', fn() => response()->json(['page' => 'Voir EDT']));

    // ── STAGIAIRE ──
    Route::middleware('role:stagiaire')->prefix('stagiaire')->group(function () {

        // Liste des groupes (pour le sélecteur)
        Route::get('/groupes', function () {
            $groupes = DB::table('groupes')
                ->select('groupes.id', 'groupes.nom',
                    DB::raw("COALESCE(filieres.intitule, filieres.code, '') as filiere"),
                    'groupes.filiere_id')
                ->leftJoin('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                ->orderBy('groupes.nom')
                ->get();
            return response()->json(['data' => $groupes]);
        });

        // Emploi du temps du groupe sélectionné
        Route::get('/emploi', function (\Illuminate\Http\Request $request) {
            if (!$request->filled('groupe_id')) {
                return response()->json(['data' => null]);
            }
            $emploi = \App\Models\EmploiDuTemps::with('groupe')
                ->where('groupe_id', $request->groupe_id)
                ->orderByDesc('created_at')
                ->first();
            if (!$emploi) {
                return response()->json(['data' => null]);
            }
            return response()->json(['data' => [
                'id'               => $emploi->id,
                'groupe'           => $emploi->groupe?->nom ?? '—',
                'semestre'         => $emploi->semestre,
                'periodeDebut'     => $emploi->periode_debut?->format('d/m/Y'),
                'formateur_parrain'=> $emploi->formateur_parrain,
                'grille'           => $emploi->grille,
            ]]);
        });

        // Modules du groupe sélectionné
        Route::get('/modules', function (\Illuminate\Http\Request $request) {
            if (!$request->filled('groupe_id')) {
                return response()->json(['data' => []]);
            }
            $query = DB::table('modules')
                ->select('modules.id', 'modules.intitule', 'modules.code',
                    'modules.semestre', 'modules.mh_drif', 'modules.eg_et',
                    DB::raw("COALESCE(formateurs.nom, '') as formateur"))
                ->leftJoin('formateurs', 'modules.formateur_id', '=', 'formateurs.id')
                ->where('modules.groupe_id', $request->groupe_id);
            if ($request->filled('semestre')) {
                $query->where('modules.semestre', $request->semestre);
            }
            return response()->json([
                'data' => $query->orderBy('modules.semestre')->orderBy('modules.intitule')->get(),
            ]);
        });

        // Planning de stage du groupe sélectionné
        Route::get('/stages', function (\Illuminate\Http\Request $request) {
            if (!$request->filled('groupe_id')) {
                return response()->json(['data' => []]);
            }
            $stages = \App\Models\Stage::with(['groupe.filiere'])
                ->where('groupe_id', $request->groupe_id)
                ->orderBy('date_debut')
                ->get()
                ->map(fn($s) => [
                    'id'         => $s->id,
                    'date_debut' => $s->date_debut->format('d/m/Y'),
                    'date_fin'   => $s->date_fin->format('d/m/Y'),
                    'statut'     => $s->statut,
                    'filiere'    => $s->groupe->filiere->intitule ?? '—',
                    'duree_semaines' => (int) ceil($s->date_debut->diffInDays($s->date_fin) / 7),
                ]);
            return response()->json(['data' => $stages]);
        });
    });

});