<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string $permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $permissionList = array_filter(array_map('trim', preg_split('/[|,]/', $permissions) ?: []));

        if ($permissionList === [] || $user->hasPermission($permissionList)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Anda tidak memiliki izin untuk mengakses resource ini.',
        ], 403);
    }
}