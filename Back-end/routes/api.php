<?php
// ============================================================
// routes/api.php
// FICHIER COMPLET — zbid ghir les lignes marquées ← AJOUT
// ============================================================

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FormateurController;
use App\Http\Controllers\GroupeController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\PoleController;
use App\Http\Controllers\AlerteController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\EmploiController;

// ── Public ──
Route::post('/login', [AuthController::class, 'login']);

// ── Protégées ──
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── DIRECTEUR ──
    Route::middleware('role:directeur')->group(function () {
        Route::get('/stats',              [UserController::class, 'stats']);
        Route::apiResource('users',       UserController::class);
        Route::get('/formateurs',         [FormateurController::class, 'index']);
        Route::post('/formateurs',        [FormateurController::class, 'store']);
        Route::put('/formateurs/{formateur}',    [FormateurController::class, 'update']);
        Route::delete('/formateurs/{formateur}', [FormateurController::class, 'destroy']);
        Route::get('/groupes',            [GroupeController::class, 'index']);
        Route::get('/filieres-list',      [GroupeController::class, 'filieresList']);
        Route::get('/modules-list',       [ModuleController::class, 'index']);
        Route::post('/import/base-plate', [ImportController::class, 'import']);
        Route::get('/pole',                   [PoleController::class, 'index']);
        Route::get('/pole/{secteur}/groupes', [PoleController::class, 'groupesSecteur']);
        Route::post('/pole/assign',           [PoleController::class, 'assign']);
        Route::delete('/pole/{secteur}',      [PoleController::class, 'remove']);
        Route::get('/alertes',            [AlerteController::class, 'index']);
    });

    // ── SURVEILLANT ──
    Route::middleware('role:surveillant')->prefix('surveillant')->group(function () {
        Route::get('/planning',     fn() => response()->json(['page' => 'Planning']));
        Route::get('/emploi-temps', fn() => response()->json(['page' => 'Emploi du Temps']));
    });

    // ── FORMATEUR ──
    Route::middleware('role:formateur')->prefix('formateur')->group(function () {
        Route::get('/seances',          fn() => response()->json(['page' => 'Séances']));
        Route::get('/planning',         [FormateurController::class, 'planning']);   // ← AJOUT
        Route::get('/emploi-du-temps',  [FormateurController::class, 'emploi']);     // ← AJOUT
    });

    Route::get('/emploi-temps/view', fn() => response()->json(['page' => 'Voir EDT']));

    // ── PÔLE ──
    Route::middleware('role:pole')->group(function () {
        Route::apiResource('plannings', PlanningController::class);  // déjà dans ton fichier
        Route::apiResource('emplois',   EmploiController::class);    // déjà dans ton fichier
    });
});