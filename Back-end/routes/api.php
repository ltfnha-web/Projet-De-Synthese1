<?php
// routes/api.php — VERSION FINALE

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
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── DIRECTEUR ──
    Route::middleware('role:directeur')->group(function () {
        Route::get('/stats',                     [UserController::class, 'stats']);
        Route::apiResource('users',              UserController::class);
        Route::get('/formateurs',                [FormateurController::class, 'index']);
        Route::post('/formateurs',               [FormateurController::class, 'store']);
        Route::put('/formateurs/{formateur}',    [FormateurController::class, 'update']);
        Route::delete('/formateurs/{formateur}', [FormateurController::class, 'destroy']);
        Route::get('/groupes',                   [GroupeController::class, 'index']);
        Route::get('/filieres-list',             [GroupeController::class, 'filieresList']);
        Route::get('/modules-list',              [ModuleController::class, 'index']);
        Route::post('/import/base-plate',        [ImportController::class, 'import']);
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

        Route::apiResource('plannings', PlanningController::class);
        Route::apiResource('emplois',   EmploiController::class);

        // Groupes pour le modal planning
        Route::get('/pole-groupes', function () {
            $groupes = DB::table('groupes')
                ->select(
                    'groupes.id',
                    'groupes.nom as code',
                    DB::raw("COALESCE(filieres.intitule, filieres.code, '') as filiere")
                )
                ->leftJoin('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                ->orderBy('groupes.nom')
                ->get();
            return response()->json(['data' => $groupes]);
        });

        // Formateurs pour le modal planning — depuis la table `formateurs` (pas users)
        Route::get('/pole-formateurs', function () {
            $formateurs = DB::table('formateurs')
                ->select('id', 'nom as name')
                ->orderBy('nom')
                ->get();
            return response()->json(['data' => $formateurs]);
        });

        // Modules filtrés par groupe_id pour le modal planning
        Route::get('/pole-modules', function (\Illuminate\Http\Request $request) {
            $query = DB::table('modules')
                ->select('id', 'intitule', 'code', 'semestre');

            if ($request->filled('groupe_id')) {
                $query->where('groupe_id', $request->groupe_id);
            }

            return response()->json(['data' => $query->orderBy('intitule')->get()]);
        });
    });

    Route::get('/emploi-temps/view', fn() => response()->json(['page' => 'Voir EDT']));
});