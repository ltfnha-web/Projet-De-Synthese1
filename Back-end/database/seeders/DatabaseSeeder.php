<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // N'utilise PAS UserFactory — elle requiert email_verified_at
        $this->call([
            UserSeeder::class,
        ]);
    }
}