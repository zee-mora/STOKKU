<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MenuController extends Controller
{
    public function index(): JsonResponse
    {
        $menus = MenuItem::query()
            ->with(['parent:id,label', 'permissions:id,name,slug'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $menus]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'integer', 'exists:menu_items,id'],
            'label' => ['required', 'string', 'max:255'],
            'route' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $menu = MenuItem::query()->create([
            'parent_id' => $validated['parent_id'] ?? null,
            'label' => $validated['label'],
            'route' => $validated['route'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'permission_slug' => null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->createCrudPermissionsForMenu($menu);

        return response()->json([
            'message' => 'Menu berhasil ditambahkan.',
            'data' => $menu->load(['parent:id,label', 'permissions:id,name,slug']),
        ], 201);
    }

    public function update(Request $request, MenuItem $menu): JsonResponse
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'integer', 'exists:menu_items,id', Rule::notIn([$menu->id])],
            'label' => ['required', 'string', 'max:255'],
            'route' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $menu->update([
            'parent_id' => $validated['parent_id'] ?? null,
            'label' => $validated['label'],
            'route' => $validated['route'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'permission_slug' => null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Menu berhasil diperbarui.',
            'data' => $menu->fresh()->load(['parent:id,label', 'permissions:id,name,slug']),
        ]);
    }

    public function destroy(MenuItem $menu): JsonResponse
    {
        if ($menu->children()->exists()) {
            return response()->json([
                'message' => 'Menu parent yang masih memiliki child tidak bisa dihapus.',
            ], 422);
        }

        $menu->delete();

        return response()->json(['message' => 'Menu berhasil dihapus.']);
    }

    private function createCrudPermissionsForMenu(MenuItem $menu): void
    {
        if ($menu->parent_id == null) {
            return;
        }
        
        $slug = Str::slug($menu->label);
        $actions = ['view', 'create', 'update', 'delete'];

        foreach ($actions as $action) {
            $permission = Permission::query()->firstOrCreate(
                ['slug' => "{$slug}.{$action}"],
                [
                    'name' => ucfirst($action) . ' ' . $menu->label,
                    'description' => "{$action} {$menu->label}",
                ]
            );

            $menu->permissions()->attach($permission->id, ['enabled' => true]);
        }
    }
}