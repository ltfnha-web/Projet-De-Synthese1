<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {

        // Désactiver les FK checks le temps de la création
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        Schema::create('modules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('code');
            $table->string('intitule');
            $table->bigInteger('groupe_id')->unsigned();
            $table->bigInteger('formateur_id')->unsigned()->nullable();
            $table->double('mh_drif')->default(0);
            $table->double('mh_drif_presentiel')->default(0);
            $table->double('mh_drif_distanciel')->default(0);
            $table->double('mh_realisee_presentiel')->default(0);
            $table->double('mh_realisee_sync')->default(0);
            $table->double('mh_realisee_globale')->default(0);
            $table->double('mh_restante')->default(0);
            $table->double('taux_realisation')->default(0);
            $table->double('tx_avc_mod')->default(0);
            $table->string('eg_et')->nullable();
            $table->string('semestre')->nullable();
            $table->string('validation_efm')->nullable();
            $table->string('seance_efm')->nullable();
            $table->timestamps();
        });

        // Réactiver les FK checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Ajouter les FK manuellement après
        DB::statement('ALTER TABLE modules ADD CONSTRAINT modules_groupe_id_foreign FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE;');
        DB::statement('ALTER TABLE modules ADD CONSTRAINT modules_formateur_id_foreign FOREIGN KEY (formateur_id) REFERENCES formateurs(id) ON DELETE SET NULL;');
    }

    public function down(): void {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Schema::dropIfExists('modules');
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
};