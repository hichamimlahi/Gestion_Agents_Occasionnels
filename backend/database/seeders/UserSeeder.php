<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $users = [
            [
                'first_name' => 'Admin',
                'last_name' => 'RH',
                'cin' => 'RH000001',
                'birth_date' => '1985-02-14',
                'gender' => 'male',
                'phone' => '0600000001',
                'email' => 'rh@larache.ma',
                'role' => 'rh',
            ],
            [
                'first_name' => 'Naib',
                'last_name' => 'RH',
                'cin' => 'NRH00001',
                'birth_date' => '1988-05-20',
                'gender' => 'female',
                'phone' => '0600000002',
                'email' => 'naib.rh@larache.ma',
                'role' => 'naib_rh',
            ],
            [
                'first_name' => 'Président',
                'last_name' => 'Commune',
                'cin' => 'PR000001',
                'birth_date' => '1975-11-11',
                'gender' => 'male',
                'phone' => '0600000003',
                'email' => 'president@larache.ma',
                'role' => 'president',
            ],
            [
                'first_name' => 'Yassine',
                'last_name' => 'Occasionnel',
                'cin' => 'OC000001',
                'birth_date' => '1998-03-18',
                'gender' => 'male',
                'phone' => '0600000004',
                'email' => 'occasionnel@larache.ma',
                'role' => 'occasionnel',
            ],
        ];

        foreach ($users as $userData) {
            $role = Role::query()->where('slug', $userData['role'])->firstOrFail();

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'role_id' => $role->id,
                    'first_name' => $userData['first_name'],
                    'last_name' => $userData['last_name'],
                    'cin' => $userData['cin'],
                    'birth_date' => $userData['birth_date'],
                    'gender' => $userData['gender'],
                    'phone' => $userData['phone'],
                    'password' => Hash::make('Password@123'),
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'locale' => 'fr',
                ]
            );

            if ($userData['role'] === 'occasionnel') {
                Candidate::updateOrCreate(['user_id' => $user->id], []);
            }
        }
    }
}
