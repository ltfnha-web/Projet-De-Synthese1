<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('directeur','pole','formateur','surveillant','stagiaire') NOT NULL DEFAULT 'formateur'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('directeur','pole','formateur') NOT NULL DEFAULT 'formateur'");
    }
};
