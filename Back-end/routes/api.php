<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FormateurController;
use App\Http\Controllers\GroupeController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\PoleController;
use App\Http\Controllers\AlerteController;
use Illuminate\Support\Facades\Route;

// ── Public ──
Route::post('/login', [AuthController::class, 'login']);

// ── Protégées ──
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── DIRECTEUR ──
    Route::middleware('role:directeur')->group(function () {

        // Stats dashboard
        Route::get('/stats', [UserController::class, 'stats']);

        // CRUD users système (surveillants)
        Route::apiResource('users', UserController::class);

        // CRUD formateurs (table formateurs)
        Route::get('/formateurs',        [FormateurController::class, 'index']);
        Route::post('/formateurs',       [FormateurController::class, 'store']);
        Route::put('/formateurs/{formateur}',    [FormateurController::class, 'update']);
        Route::delete('/formateurs/{formateur}', [FormateurController::class, 'destroy']);

        // Groupes (lecture + filtre)
        Route::get('/groupes',      [GroupeController::class, 'index']);
        Route::get('/filieres-list',[GroupeController::class, 'filieresList']);

        // Modules (lecture + filtre)
        Route::get('/modules-list', [ModuleController::class, 'index']);

        // Import Excel BASE PLATE
        Route::post('/import/base-plate', [ImportController::class, 'import']);

        // ── POLE (Responsables de secteurs) ──
        Route::get('/pole',                   [PoleController::class, 'index']);
        Route::get('/pole/{secteur}/groupes', [PoleController::class, 'groupesSecteur']);
        Route::post('/pole/assign',           [PoleController::class, 'assign']);
        Route::delete('/pole/{secteur}',      [PoleController::class, 'remove']);

        // ── ALERTES pédagogiques ──
        Route::get('/alertes', [AlerteController::class, 'index']);
    });

    // ── SURVEILLANT ──
    Route::middleware('role:surveillant')->prefix('surveillant')->group(function () {
        Route::get('/planning',     fn() => response()->json(['page' => 'Planning']));
        Route::get('/emploi-temps', fn() => response()->json(['page' => 'Emploi du Temps']));
    });

    // ── FORMATEUR ──
    Route::middleware('role:formateur')->prefix('formateur')->group(function () {
        Route::get('/seances', fn() => response()->json(['page' => 'Séances']));
    });

    Route::get('/emploi-temps/view', fn() => response()->json(['page' => 'Voir EDT']));
});