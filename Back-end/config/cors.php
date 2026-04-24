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
        'http://localhost:3000',   // Create React App
        'http://127.0.0.1:5173',   // Alias localhost
        'http://127.0.0.1:3000',
    ],

    // Allows any ngrok tunnel URL (free & paid plans)
    'allowed_origins_patterns' => [
        '#^https://[a-z0-9\-]+\.ngrok-free\.app$#',
        '#^https://[a-z0-9\-]+\.ngrok\.io$#',
        '#^https://[a-z0-9\-]+\.ngrok\.app$#',
    ],

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