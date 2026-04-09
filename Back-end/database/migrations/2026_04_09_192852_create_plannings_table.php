<?php
// ============================================================
// database/migrations/xxxx_create_plannings_table.php
// Commande: php artisan make:migration create_plannings_table
// ============================================================

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plannings', function (Blueprint $table) {
            $table->id();

            // pole_id = id du user avec role 'pole'
            $table->foreignId('pole_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // groupe_id → table 'groupes' (déjà dans ton projet)
            $table->foreignId('groupe_id')
                  ->constrained('groupes')
                  ->onDelete('cascade');

            // module_id → table 'modules' (déjà dans ton projet)
            $table->foreignId('module_id')
                  ->constrained('modules')
                  ->onDelete('cascade');

            // formateur_id → table 'users' (rôle formateur)
            $table->foreignId('formateur_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // Données pédagogiques
            $table->tinyInteger('semestre')->default(1);
            $table->enum('type', ['Régionale', 'Locale'])->default('Régionale');
            $table->integer('mh_drif')->default(0);
            $table->integer('mh_realisee')->default(0);
            $table->date('date_debut')->nullable();
            $table->tinyInteger('nb_semaines')->default(0);
            $table->tinyInteger('semaines_faites')->default(0);
            $table->tinyInteger('charge_hebdo')->default(0);
            $table->enum('statut', ['En cours', 'En retard', 'Terminé'])->default('En cours');

            // Placement emploi du temps
            $table->enum('jour', ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'])->nullable();
            $table->tinyInteger('seance_numero')->nullable();
            $table->string('salle', 20)->nullable();
            $table->enum('mode', ['PRESENTIEL', 'DISTANCIEL'])->default('PRESENTIEL');

            $table->timestamps();

            $table->index(['pole_id', 'semestre']);
            $table->index(['formateur_id']);
            $table->index(['groupe_id', 'semestre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plannings');
    }
};