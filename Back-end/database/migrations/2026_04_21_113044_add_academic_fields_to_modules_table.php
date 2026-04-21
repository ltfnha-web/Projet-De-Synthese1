<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->string('exam_type')->nullable()->after('validation_efm');   // EFF | Qualifiante | Passage | 1A | 2A | EFM | Aucun
            $table->string('passage')->nullable()->after('exam_type');          // Admis | Redoublant | En cours
            $table->string('annee')->nullable()->after('passage');              // 1A | 2A
            $table->string('type_formation')->nullable()->after('annee');       // Diplômante | Qualifiante
            $table->string('statut')->nullable()->after('type_formation');      // Terminé | En cours | Non commencé
            $table->float('note')->nullable()->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn(['exam_type', 'passage', 'annee', 'type_formation', 'statut', 'note']);
        });
    }
};