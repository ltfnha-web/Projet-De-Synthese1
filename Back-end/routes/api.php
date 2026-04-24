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
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::post('/login', [AuthController::class, 'login']);

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

        // Groupes pour le modal planning
        Route::get('/pole-groupes', function () {
            $groupes = DB::table('groupes')
                ->select('groupes.id', 'groupes.nom',
                    DB::raw("COALESCE(filieres.intitule, filieres.code, '') as filiere"))
                ->leftJoin('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                ->orderBy('groupes.nom')
                ->get();
            return response()->json(['data' => $groupes]);
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

       
    });

    Route::put('/plannings/{planning}', [PlanningController::class, 'update']);
    Route::get('/emploi-temps/view', fn() => response()->json(['page' => 'Voir EDT']));


    
});