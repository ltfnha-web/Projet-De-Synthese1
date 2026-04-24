<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formateur_emplois', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formateur_id')->constrained('formateurs')->onDelete('cascade');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('semestre', 5);
            $table->json('grille');
            $table->timestamps();
            $table->index('formateur_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('formateur_emplois');
    }
};
