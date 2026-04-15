<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PoleUserSeeder extends Seeder
{
    public function run()
    {
        User::updateOrCreate(
            ['email' => 'pole@ofppt.ma'],
            [
                'name' => 'Pôle Pédagogique',
                'password' => Hash::make('pole1234'),
                'role' => 'pole',
            ]
        );

        $this->command->info('Compte Pôle créé : pole@ofppt.ma / pole1234');
    }
}