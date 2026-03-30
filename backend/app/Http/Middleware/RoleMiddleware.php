<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Vérifie si l'utilisateur a le rôle requis.
     *
     * Usage dans routes: ->middleware('role:directeur')
     *                ou: ->middleware('role:directeur,surveillant')
     */
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Accès refusé. Vous n\'avez pas les droits nécessaires.',
                'your_role'     => $user->role,
                'required_roles' => $roles,
            ], 403);
        }

        return $next($request);
    }
}