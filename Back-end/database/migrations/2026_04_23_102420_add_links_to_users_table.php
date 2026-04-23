<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ⚠️  Ce fichier doit avoir un timestamp APRÈS les migrations
//     create_formateurs_table et create_secteurs_table
//     Ex : 2025_01_02_000000_add_links_to_users_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Lien vers le formateur existant (role = formateur)
            $table->foreignId('formateur_id')
                  ->nullable()
                  ->after('statut')
                  ->constrained('formateurs')
                  ->nullOnDelete();

            // Lien vers le secteur dont il est responsable (role = pole)
            $table->foreignId('secteur_id')
                  ->nullable()
                  ->after('formateur_id')
                  ->constrained('secteurs')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['formateur_id']);
            $table->dropForeign(['secteur_id']);
            $table->dropColumn(['formateur_id', 'secteur_id']);
        });
    }
};