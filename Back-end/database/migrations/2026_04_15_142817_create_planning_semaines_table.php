<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planning_semaines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('planning_id')
                ->constrained('plannings')
                ->onDelete('cascade');

            // Numéro de semaine dans l'année scolaire (1 = 1er lundi de septembre)
            $table->unsignedTinyInteger('semaine_num'); // 1 à 42

            // Semestre automatique (1 = sept→janv, 2 = fév→juin)
            $table->unsignedTinyInteger('semestre'); // 1 ou 2

            // MH prévues pour cette semaine (modifiable par le coordinateur)
            $table->decimal('mh_prevue', 5, 1)->default(0);

            $table->timestamps();

            // Une ligne par planning + semaine (unique)
            $table->unique(['planning_id', 'semaine_num']);
            $table->index(['planning_id']);
            $table->index(['semaine_num']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('planning_semaines');
    }
};