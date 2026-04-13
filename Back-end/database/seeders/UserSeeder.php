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
        User::updateOrCreate(
            ['email' => 'directeur@ofppt.ma'],
            [
                'name'      => 'Mohammed Directeur',
                'password'  => Hash::make('password123'),
                'role'      => 'directeur',
                'is_active' => true,
                'statut'    => 'actif',
            ]
        );

        // Pôle
        User::updateOrCreate(
            ['email' => 'pole@ofppt.ma'],
            [
                'name'      => 'Pôle Pédagogique',
                'password'  => Hash::make('pole1234'),
                'role'      => 'pole',
                'is_active' => true,
                'statut'    => 'actif',
            ]
        );

        // Formateur
        User::updateOrCreate(
            ['email' => 'formateur@ofppt.ma'],
            [
                'name'       => 'Fatima Formatrice',
                'password'   => Hash::make('password123'),
                'role'       => 'formateur',
                'is_active'  => true,
                'specialite' => 'Développement Web',
                'telephone'  => '0612345678',
                'statut'     => 'actif',
            ]
        );

        $this->command->info('Users créés avec succès ✅');
    }
}