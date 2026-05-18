<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::query()
            ->with(['permissions:id,name,slug'])
            ->withCount('permissions')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $roles]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:roles,slug'],
            'description' => ['nullable', 'string'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role = Role::query()->create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        $role->permissions()->sync($validated['permission_ids'] ?? []);

        return response()->json([
            'message' => 'Role berhasil ditambahkan.',
            'data' => $role->load('permissions:id,name,slug'),
        ], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role->id)],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('roles', 'slug')->ignore($role->id)],
            'description' => ['nullable', 'string'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $payload = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ];

        if ($role->slug !== 'super-admin') {
            $payload['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        }

        $role->update($payload);
        $role->permissions()->sync($validated['permission_ids'] ?? []);

        return response()->json([
            'message' => 'Role berhasil diperbarui.',
            'data' => $role->fresh()->load('permissions:id,name,slug'),
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->slug === 'super-admin') {
            return response()->json([
                'message' => 'Role super admin tidak bisa dihapus.',
            ], 422);
        }

        if (User::query()->where('role_id', $role->id)->exists()) {
            return response()->json([
                'message' => 'Role masih digunakan oleh user.',
            ], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role berhasil dihapus.']);
    }
}