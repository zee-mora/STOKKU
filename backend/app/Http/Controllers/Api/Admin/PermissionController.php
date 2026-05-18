<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::query()
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $permissions]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:permissions,slug'],
            'description' => ['nullable', 'string'],
        ]);

        $permission = Permission::query()->create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'message' => 'Permission berhasil ditambahkan.',
            'data' => $permission,
        ], 201);
    }

    public function update(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('permissions', 'name')->ignore($permission->id)],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('permissions', 'slug')->ignore($permission->id)],
            'description' => ['nullable', 'string'],
        ]);

        $permission->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'message' => 'Permission berhasil diperbarui.',
            'data' => $permission->fresh(),
        ]);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $permission->delete();

        return response()->json(['message' => 'Permission berhasil dihapus.']);
    }
}