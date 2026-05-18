<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $req)
    {
        $validated = $req->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $defaultRole = Role::query()->where('slug', 'user')->first()
            ?? Role::query()->orderBy('id')->first();

        $user = User::create([
            'role_id' => $defaultRole?->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = JWTAuth::fromUser($user);

        return $this->respondWithToken($token, 'Registrasi berhasil.', $user);
    }

    public function login(Request $req)
    {
        $validator = Validator::make($req->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return $this->res->json($validator->errors(), 422);
        }

        $credentials = $req->only(['email', 'password']);

        if (!$token = JWTAuth::attempt($credentials)) {
            return $this->res->json([
                'message' => 'Email atau password salah.'
            ], 401);
        }

        $user = JWTAuth::setToken($token)->authenticate() ?? User::query()->where('email', $credentials['email'])->first();

        return $this->respondWithToken($token, 'Login berhasil.', $user);
    }

    public function createToken(Request $req)
    {
        $validator = Validator::make($req->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return $this->res->json($validator->errors(), 422);
        }

        $credentials = $req->only(['email', 'password']);

        if (!$token = JWTAuth::attempt($credentials)) {
            return $this->res->json([
                'message' => 'Email atau password salah.'
            ], 401);
        }

        $user = JWTAuth::setToken($token)->authenticate() ?? User::query()->where('email', $credentials['email'])->first();

        return $this->respondWithToken($token, 'Token created successfully.', $user);
    }

    public function me(Request $req)
    {
        $user = $req->user();

        if (!$user) {
            throw ValidationException::withMessages([
                'auth' => 'User not authenticated.',
            ]);
        }

        return $this->res->json([
            'status' => 'success',
            'user' => $this->buildUserPayload($user),
        ]);
    }

    public function navigation(Request $req)
    {
        $user = $req->user();

        if (!$user) {
            throw ValidationException::withMessages([
                'auth' => 'User not authenticated.',
            ]);
        }

        return $this->res->json([
            'status' => 'success',
            'data' => $this->buildNavigation($user),
        ]);
    }

    public function logout(Request $req)
    {
        if (JWTAuth::getToken()) {
            JWTAuth::invalidate(true);
        }

        return $this->res->json([
            'status' => 'success',
            'message' => 'Logout berhasil.',
        ]);
    }

    protected function respondWithToken(string $token, string $message, ?User $user = null)
    {
        $user ??= auth('api')->user();

        return $this->res->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'user' => $this->buildUserPayload($user),
            'status' => 'success',
            'message' => $message,
        ]);
    }

    protected function buildUserPayload(?User $user): array
    {
        if (!$user) {
            return [];
        }

        return $user->profilePayload($this->buildNavigation($user));
    }

    protected function buildNavigation(User $user): array
    {
        $menus = MenuItem::query()
            ->where('is_active', true)
            ->with('permissions:id,slug')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $this->buildMenuTree($menus, null, $user);
    }

    protected function buildMenuTree(Collection $menus, ?int $parentId, User $user): array
    {
        return $menus
            ->where('parent_id', $parentId)
            ->values()
            ->map(function ($item) use ($menus, $user) {
                $children = $this->buildMenuTree($menus, $item->id, $user);

                $canAccess = $this->canUserAccessMenu($item, $user);
                $isGroup = $item->route === null && $children !== [];

                if (!$canAccess && !$isGroup) {
                    return null;
                }

                return [
                    'id' => $item->id,
                    'label' => $item->label,
                    'route' => $item->route,
                    'icon' => $item->icon,
                    'permission_slug' => $item->permission_slug,
                    'permissions' => $item->permissions?->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'slug' => $p->slug])->values()->all() ?? [],
                    'children' => $children,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    protected function canUserAccessMenu($menu, User $user): bool
    {
        if ($user->role?->slug === 'super-admin') {
            return true;
        }

        $menuPermissions = $menu->permissions ?? [];

        if ($menuPermissions->isEmpty()) {
            return true;
        }

        $userPermissions = $user->role?->permissions ?? [];

        foreach ($menuPermissions as $menuPerm) {
            foreach ($userPermissions as $userPerm) {
                if ($userPerm->id === $menuPerm->id) {
                    return true;
                }
            }
        }

        return false;
    }
}
