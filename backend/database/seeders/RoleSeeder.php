<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $roles = [
            ['name' => 'Guest', 'slug' => 'guest', 'description' => 'Public visitor'],
            ['name' => 'Occasionnel', 'slug' => 'occasionnel', 'description' => 'Temporary worker candidate'],
            ['name' => 'RH', 'slug' => 'rh', 'description' => 'Human resources'],
            ['name' => 'Naib RH', 'slug' => 'naib_rh', 'description' => 'Assistant RH'],
            ['name' => 'Président', 'slug' => 'president', 'description' => 'President validator'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
