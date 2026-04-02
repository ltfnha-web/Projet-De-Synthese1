<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Directeur
        User::create([
            'name'      => 'Mohammed Directeur',
            'email'     => 'directeur@ofppt.ma',
            'password'  => Hash::make('password123'),
            'role'      => 'directeur',
            'is_active' => true,
            'statut'    => 'actif',
        ]);

        // Surveillant
        User::create([
            'name'      => 'Ahmed Surveillant',
            'email'     => 'surveillant@ofppt.ma',
            'password'  => Hash::make('password123'),
            'role'      => 'surveillant',
            'is_active' => true,
            'telephone' => '0698765432',
            'statut'    => 'actif',
        ]);

        // Formateur
        User::create([
            'name'       => 'Fatima Formatrice',
            'email'      => 'formateur@ofppt.ma',
            'password'   => Hash::make('password123'),
            'role'       => 'formateur',
            'is_active'  => true,
            'specialite' => 'Développement Web',
            'telephone'  => '0612345678',
            'statut'     => 'actif',
        ]);
    }
}