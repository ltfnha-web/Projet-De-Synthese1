<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emploi_seances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('emploi_id')
                  ->constrained('emplois_du_temps')
                  ->onDelete('cascade');

            $table->foreignId('salle_id')
                  ->constrained('salles')
                  ->onDelete('restrict');

            $table->foreignId('module_id')
                  ->nullable()
                  ->constrained('modules')
                  ->nullOnDelete();

            $table->foreignId('formateur_id')
                  ->nullable()
                  ->constrained('formateurs')
                  ->nullOnDelete();

            $table->string('jour');           // Lundi … Samedi
            $table->unsignedTinyInteger('numero_seance'); // 0-3
            $table->string('semestre', 5);    // S1 | S2
            $table->string('mode')->default('PRESENTIEL');

            $table->timestamps();

            // DB-level guarantee: same room cannot appear twice at (jour, séance, semestre)
            $table->unique(['salle_id', 'jour', 'numero_seance', 'semestre'], 'uniq_salle_creneau');

            $table->index('emploi_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emploi_seances');
    }
};
