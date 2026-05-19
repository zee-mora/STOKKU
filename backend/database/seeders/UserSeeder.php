<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

use App\Models\Role;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdminRoleId = Role::query()->where('slug', 'super-admin')->value('id');
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $staffRoleId = Role::query()->where('slug', 'staff')->value('id');

        User::query()->updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'role_id' => $superAdminRoleId,
                'password' => Hash::make('password'),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'role_id' => $adminRoleId,
                'password' => Hash::make('password'),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name' => 'Staff',
                'role_id' => $staffRoleId,
                'password' => Hash::make('password'),
            ],
        );
    }
}

