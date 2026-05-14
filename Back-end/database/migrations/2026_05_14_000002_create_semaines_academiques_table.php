<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semaines_academiques', function (Blueprint $table) {
            $table->id();

            // "2025-2026", "2026-2027", …
            $table->string('annee_scolaire', 9);

            // Sequential week number within the academic year (1 = first Monday of September)
            $table->unsignedSmallInteger('semaine_num');

            // Monday that opens this week
            $table->date('date_debut');

            // Sunday that closes this week (date_debut + 6 days)
            $table->date('date_fin');

            // 1 = S1 (Sep→Jan), 2 = S2 (Feb→Jun)
            $table->unsignedTinyInteger('semestre');

            // Human-readable label, e.g. "S1", "S2", …
            $table->string('label', 10)->nullable();

            $table->timestamps();

            // One row per (year, week) — prevents duplicates on re-generation
            $table->unique(['annee_scolaire', 'semaine_num']);

            $table->index('annee_scolaire');
            $table->index(['annee_scolaire', 'semestre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semaines_academiques');
    }
};
