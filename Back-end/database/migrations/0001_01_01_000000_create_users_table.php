<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['directeur', 'pole', 'formateur'])->default('formateur');
            $table->boolean('is_active')->default(true);
            $table->string('specialite')->nullable();
            $table->string('telephone')->nullable();
            $table->enum('statut', ['actif', 'inactif'])->default('actif');
            $table->rememberToken();
            $table->timestamps();

            // Ces 2 colonnes sont ajoutées APRÈS les tables formateurs/secteurs
            // donc elles sont dans une migration séparée — voir add_links_to_users_table
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};