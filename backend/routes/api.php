<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Publiques (sans authentification)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Routes Protégées (authentification requise - Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    /*
    |----------------------------------------------------------------------
    | DIRECTEUR (Administrateur) - Accès complet
    |----------------------------------------------------------------------
    */
    Route::middleware('role:directeur')->prefix('directeur')->group(function () {
        // Dashboard stats
        Route::get('/dashboard', fn() => response()->json(['page' => 'Dashboard Directeur']));

        // Gestion utilisateurs
        Route::get('/utilisateurs', fn() => response()->json(['page' => 'Gestion Utilisateurs']));
        Route::post('/utilisateurs', fn() => response()->json(['page' => 'Ajouter Utilisateur']));
        Route::put('/utilisateurs/{id}', fn() => response()->json(['page' => 'Modifier Utilisateur']));
        Route::delete('/utilisateurs/{id}', fn() => response()->json(['page' => 'Supprimer Utilisateur']));

        // Gestion formateurs
        Route::get('/formateurs', fn() => response()->json(['page' => 'Gestion Formateurs']));

        // Gestion groupes
        Route::get('/groupes', fn() => response()->json(['page' => 'Gestion Groupes']));

        // Gestion salles
        Route::get('/salles', fn() => response()->json(['page' => 'Gestion Salles']));

        // Gestion modules
        Route::get('/modules', fn() => response()->json(['page' => 'Gestion Modules']));

        // Planification annuelle
        Route::get('/planification', fn() => response()->json(['page' => 'Planification Annuelle']));

        // Emploi du temps
        Route::get('/emploi-temps', fn() => response()->json(['page' => 'Emploi du Temps']));

        // Suivi pédagogique
        Route::get('/suivi', fn() => response()->json(['page' => 'Suivi Pédagogique']));

        // Import Excel
        Route::post('/import', fn() => response()->json(['page' => 'Import Excel']));
    });

    /*
    |----------------------------------------------------------------------
    | SURVEILLANT GÉNÉRAL
    |----------------------------------------------------------------------
    */
    Route::middleware('role:surveillant')->prefix('surveillant')->group(function () {
        // Planning formateurs / groupes / salles
        Route::get('/planning', fn() => response()->json(['page' => 'Planning Surveillant']));

        // Emploi du temps
        Route::get('/emploi-temps', fn() => response()->json(['page' => 'Emploi du Temps']));

        // Suivi pédagogique
        Route::get('/suivi', fn() => response()->json(['page' => 'Suivi']));
    });

    /*
    |----------------------------------------------------------------------
    | FORMATEUR
    |----------------------------------------------------------------------
    */
    Route::middleware('role:formateur')->prefix('formateur')->group(function () {
        // Consultation des séances
        Route::get('/seances', fn() => response()->json(['page' => 'Mes Séances']));

        // Validation des séances
        Route::put('/seances/{id}/valider', fn($id) => response()->json(['page' => "Valider Séance $id"]));
    });

    /*
    |----------------------------------------------------------------------
    | Routes accessibles à TOUS les rôles
    |----------------------------------------------------------------------
    */
    Route::get('/emploi-temps/view', fn() => response()->json(['page' => 'Voir Emploi du Temps']));
});