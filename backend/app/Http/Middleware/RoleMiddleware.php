<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (!$user || !$user->role) {
            return response()->json([
                'message' => 'Unauthorized role.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (!in_array($user->role->slug, $roles, true)) {
            return response()->json([
                'message' => 'Access denied for this role.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
