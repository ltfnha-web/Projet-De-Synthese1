<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {

        Schema::create('modules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('code');
            $table->string('intitule');

            $table->bigInteger('groupe_id')->unsigned();
            $table->bigInteger('formateur_id')->unsigned()->nullable();

            // MH DRIF
            $table->double('mh_drif')->default(0);
            $table->double('mh_drif_presentiel')->default(0);
            $table->double('mh_drif_distanciel')->default(0);

            // MH Réalisée
            $table->double('mh_realisee_presentiel')->default(0);
            $table->double('mh_realisee_sync')->default(0);
            $table->double('mh_realisee_globale')->default(0);

            // MH Restante + Taux
            $table->double('mh_restante')->default(0);
            $table->double('taux_realisation')->default(0);
            $table->double('tx_avc_mod')->default(0);

            // Infos pédagogiques
            $table->string('eg_et')->nullable();
            $table->string('semestre')->nullable();
            $table->string('validation_efm')->nullable();
            $table->string('seance_efm')->nullable();

            // Colonnes filtre — issues du fichier Excel
            $table->boolean('is_regional')->default(false);   // col [18] Régional O/N
            $table->string('creneau', 10)->nullable();         // col [7]  CDJ / CDS
            $table->string('type_formation', 60)->nullable();  // col [6]  Diplômante / Qualifiante

            $table->timestamps();
        });

        // FK séparées après création
        Schema::table('modules', function (Blueprint $table) {
            $table->foreign('groupe_id')
                  ->references('id')->on('groupes')
                  ->onDelete('cascade');

            $table->foreign('formateur_id')
                  ->references('id')->on('formateurs')
                  ->onDelete('set null');
        });
    }

    public function down(): void {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropForeign(['groupe_id']);
            $table->dropForeign(['formateur_id']);
        });
        Schema::dropIfExists('modules');
    }
};