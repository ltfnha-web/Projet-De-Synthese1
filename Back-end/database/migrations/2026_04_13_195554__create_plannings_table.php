<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plannings', function (Blueprint $table) {
            $table->id();

            /*
            |-------------------------
            | RELATIONS
            |-------------------------
            */

            $table->foreignId('groupe_id')
                ->constrained('groupes')
                ->onDelete('cascade');

            $table->foreignId('module_id')
                ->constrained('modules')
                ->onDelete('cascade');

            // ✅ FIXED: formateur comes from formateurs table (NOT users)
            $table->foreignId('formateur_id')
                ->constrained('formateurs')
                ->onDelete('restrict');

            /*
            |-------------------------
            | INFORMATIONS PLANNING
            |-------------------------
            */

            $table->string('semestre', 10)->default('S1'); // S1, S2...
            $table->string('type', 50)->default('Régionale'); // Régionale / Locale

            $table->integer('mh_drif')->default(0);       // masse horaire demandée
            $table->integer('mh_realisee')->default(0);   // masse horaire réalisée

            $table->date('date_debut')->nullable();

            $table->integer('nb_semaines')->default(0);
            $table->integer('semaines_faites')->default(0);
            $table->integer('charge_hebdo')->default(0);

            $table->string('statut', 30)->default('En cours');

            /*
            |-------------------------
            | SÉANCE DETAILS
            |-------------------------
            */

            $table->string('jour', 20)->nullable();
            $table->tinyInteger('seance_numero')->nullable();
            $table->string('salle', 20)->nullable();
            $table->string('mode', 20)->default('PRESENTIEL');

            $table->timestamps();

            /*
            |-------------------------
            | INDEXES
            |-------------------------
            */

            $table->index(['semestre']);
            $table->index(['formateur_id']);
            $table->index(['groupe_id', 'semestre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plannings');
    }
};