<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('groupes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->foreignId('filiere_id')->constrained('filieres')->onDelete('cascade');
            $table->string('annee_formation')->nullable(); // 1, 2, 3
            $table->integer('effectif')->default(0);
            $table->string('statut')->nullable();          // Actif, Inactif
            $table->string('mode')->nullable();            // Résidentiel, Alterné
            $table->string('creneau')->nullable();         // CDJ, CDS, etc.
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('groupes'); }
};