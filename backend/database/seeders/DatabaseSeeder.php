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
        $superAdminRole = Role::query()->updateOrCreate(
            ['slug' => 'super-admin'],
            [
                'name' => 'Super Admin',
                'description' => 'Full access to all menus and permissions.',
            ],
        );

        $adminRole = Role::query()->updateOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Admin',
                'description' => 'Admin access to barang and dashboard admin.',
            ],
        );

        $staffRole = Role::query()->updateOrCreate(
            ['slug' => 'staff'],
            [
                'name' => 'Staff',
                'description' => 'Staff access to dashboard staff and request barang.',
            ],
        );

        $master = MenuItem::query()->updateOrCreate(
            ['label' => 'Master', 'parent_id' => null],
            [
                'route' => null,
                'icon' => 'Shield',
                'permission_slug' => null,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        $adminParent = MenuItem::query()->updateOrCreate(
            ['label' => 'Admin', 'parent_id' => null],
            [
                'route' => null,
                'icon' => 'LayoutDashboard',
                'permission_slug' => null,
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        $staffParent = MenuItem::query()->updateOrCreate(
            ['label' => 'Staff', 'parent_id' => null],
            [
                'route' => null,
                'icon' => 'Users',
                'permission_slug' => null,
                'sort_order' => 3,
                'is_active' => true,
            ],
        );

        $usersMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'Users', 'parent_id' => $master->id],
            [
                'route' => '/admin/users',
                'icon' => 'Users',
                'permission_slug' => null,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        $rbacMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'RBAC', 'parent_id' => $master->id],
            [
                'route' => '/admin/rbac',
                'icon' => 'Shield',
                'permission_slug' => null,
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        $dashboardAdminMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'Dashboard Admin', 'parent_id' => $adminParent->id],
            [
                'route' => '/admin/dashboard',
                'icon' => 'LayoutDashboard',
                'permission_slug' => null,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        $barangMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'Barang', 'parent_id' => $adminParent->id],
            [
                'route' => '/admin/barang',
                'icon' => 'Package',
                'permission_slug' => null,
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        $dashboardStaffMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'Dashboard Staff', 'parent_id' => $staffParent->id],
            [
                'route' => '/staff/dashboard',
                'icon' => 'LayoutDashboard',
                'permission_slug' => null,
                'sort_order' => 1,
                'is_active' => true,
            ],
        );

        $requestBarangMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'Request Barang', 'parent_id' => $staffParent->id],
            [
                'route' => '/staff/request-barang',
                'icon' => 'ShoppingCart',
                'permission_slug' => null,
                'sort_order' => 2,
                'is_active' => true,
            ],
        );

        $approvalMenu = MenuItem::query()->updateOrCreate(
            ['label' => 'Approval', 'parent_id' => $adminParent->id],
            [
                'route' => '/admin/approval',
                'icon' => 'Receipt',
                'permission_slug' => null,
                'sort_order' => 3,
                'is_active' => true,
            ],
        );

        $this->createCrudPermissionsForMenu($usersMenu);
        $this->createCrudPermissionsForMenu($rbacMenu);
        $this->createCrudPermissionsForMenu($dashboardAdminMenu);
        $this->createCrudPermissionsForMenu($dashboardStaffMenu);
        $this->createCrudPermissionsForMenu($barangMenu);
        $this->createCrudPermissionsForMenu($requestBarangMenu);
        $this->createCrudPermissionsForMenu($approvalMenu);
        $superAdminRole->permissions()->sync(Permission::query()->pluck('id')->all());

        $adminPermissions = Permission::query()
            ->whereIn('slug', [
                'dashboard-admin.view', 'dashboard-admin.create', 'dashboard-admin.update', 'dashboard-admin.delete',
                'barang.view', 'barang.create', 'barang.update', 'barang.delete',
            ])
            ->pluck('id');
        $adminRole->permissions()->sync($adminPermissions);

        $staffPermissions = Permission::query()
            ->whereIn('slug', [
                'dashboard-staff.view', 'dashboard-staff.create', 'dashboard-staff.update', 'dashboard-staff.delete',
                'request-barang.view', 'request-barang.create', 'request-barang.update', 'request-barang.delete',
            ])
            ->pluck('id');
        $staffRole->permissions()->sync($staffPermissions);

        $this->call(UserSeeder::class);
    }

    private function createCrudPermissionsForMenu(MenuItem $menu): void
    {
        $slug = Str::slug($menu->label);
        $actions = ['view', 'create', 'update', 'delete'];

        foreach ($actions as $action) {
            Permission::query()->firstOrCreate(
                ['slug' => "{$slug}.{$action}"],
                [
                    'name' => ucfirst($action) . ' ' . $menu->label,
                    'description' => "{$action} {$menu->label}",
                ]
            );

            $permission = Permission::query()->where('slug', "{$slug}.{$action}")->first();
            $menu->permissions()->syncWithoutDetaching([$permission->id => ['enabled' => true]]);
        }
    }
}
