<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $permissions = [
            ['name' => 'Manage RBAC', 'slug' => 'rbac.manage'],
        ];

        foreach ($permissions as $permissionData) {
            Permission::query()->updateOrCreate(
                ['slug' => $permissionData['slug']],
                $permissionData,
            );
        }

        $adminRole = Role::query()->updateOrCreate(
            ['slug' => 'super-admin'],
            [
                'name' => 'Super Admin',
                'description' => 'Full access to all menus and permissions.',
            ],
        );

        $userRole = Role::query()->updateOrCreate(
            ['slug' => 'user'],
            [
                'name' => 'User',
                'description' => 'Default role for standard users.',
            ],
        );

        $adminRole->permissions()->sync(Permission::query()->pluck('id')->all());
        $userRole->permissions()->sync([]);

        $administration = MenuItem::query()->updateOrCreate(
            ['label' => 'Administrasi', 'parent_id' => null],
            [
                'route' => null,
                'icon' => 'Shield',
                'permission_slug' => null,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        $usersMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'Users', 'parent_id' => $administration->id],
            [
                'route' => '/admin/users',
                'icon' => 'Users',
                'permission_slug' => null,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        $rbacMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'RBAC', 'parent_id' => $administration->id],
            [
                'route' => '/admin/rbac',
                'icon' => 'Shield',
                'permission_slug' => null,
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        $this->createCrudPermissionsForMenu($usersMenu);
        $this->createCrudPermissionsForMenu($rbacMenu);
        $this->call(UserSeeder::class);
    }

    private function createCrudPermissionsForMenu(MenuItem $menu): void
    {
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
