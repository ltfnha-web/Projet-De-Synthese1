<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pole_secteur', function (Blueprint $table) {
            $table->bigIncrements('id');

            // Un secteur = un seul responsable
            $table->bigInteger('secteur_id')->unsigned()->unique();
            $table->bigInteger('formateur_id')->unsigned()->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });

        Schema::table('pole_secteur', function (Blueprint $table) {
            $table->foreign('secteur_id')
                  ->references('id')->on('secteurs')
                  ->onDelete('cascade');

            $table->foreign('formateur_id')
                  ->references('id')->on('formateurs')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('pole_secteur', function (Blueprint $table) {
            $table->dropForeign(['secteur_id']);
            $table->dropForeign(['formateur_id']);
        });
        Schema::dropIfExists('pole_secteur');
    }
};