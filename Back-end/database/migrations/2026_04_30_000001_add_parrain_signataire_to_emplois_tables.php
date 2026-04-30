<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emplois_du_temps', function (Blueprint $table) {
            $table->string('formateur_parrain')->nullable()->after('semestre');
            $table->string('signataire_nom')->nullable()->after('formateur_parrain');
        });

        Schema::table('formateur_emplois', function (Blueprint $table) {
            $table->string('signataire_nom')->nullable()->after('semestre');
        });
    }

    public function down(): void
    {
        Schema::table('emplois_du_temps', function (Blueprint $table) {
            $table->dropColumn(['formateur_parrain', 'signataire_nom']);
        });
        Schema::table('formateur_emplois', function (Blueprint $table) {
            $table->dropColumn('signataire_nom');
        });
    }
};
