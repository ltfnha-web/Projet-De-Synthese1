<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    |
    | Ce fichier configure les en-têtes CORS pour permettre au frontend React
    | (localhost:5173) de communiquer avec l'API Laravel (localhost:8000).
    |
    */

    // Routes concernées par CORS (toutes les routes API)
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Méthodes HTTP autorisées
    'allowed_methods' => ['*'],

    // Origines autorisées (adresse du frontend React)
    'allowed_origins' => [
        'http://localhost:5173',   // Vite dev server (React)
        'http://localhost:3000',   // Si vous utilisez Create React App
        'http://127.0.0.1:5173',   // Alias localhost
    ],

    // Patterns d'origines (laisser vide si vous utilisez allowed_origins)
    'allowed_origins_patterns' => [],

    // En-têtes autorisés dans les requêtes
    'allowed_headers' => ['*'],

    // En-têtes exposés dans la réponse
    'exposed_headers' => [],

    // Durée du cache preflight en secondes (0 = pas de cache)
    'max_age' => 0,

    // Cookies/credentials : mettre false pour Sanctum avec tokens Bearer
    // (true uniquement si vous utilisez les cookies de session)
    'supports_credentials' => false,

];