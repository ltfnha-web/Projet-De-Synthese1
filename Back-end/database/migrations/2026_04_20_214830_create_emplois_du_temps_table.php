<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emplois_du_temps', function (Blueprint $table) {
            $table->id();  // bigIncrements — unsignedBigInteger en FK

            $table->unsignedBigInteger('groupe_id');
            $table->foreign('groupe_id')
                  ->references('id')->on('groupes')
                  ->onDelete('cascade');

            $table->date('periode_debut');
            $table->json('grille');
            $table->boolean('valide')->default(false);

            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')
                  ->references('id')->on('users')
                  ->onDelete('set null');

            $table->timestamps();

            $table->index('groupe_id');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emplois_du_temps');
    }
};