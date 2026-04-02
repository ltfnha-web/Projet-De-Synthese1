<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('formateurs', function (Blueprint $table) {
            $table->id();
            $table->string('mle')->unique();        // matricule
            $table->string('nom');
            $table->enum('statut', ['actif', 'inactif'])->default('actif');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('formateurs'); }
};