<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('planning_semaines', function (Blueprint $table) {
            $table->string('statut')->nullable()->after('mh_prevue'); // 'absent' when blocked
        });
    }

    public function down(): void
    {
        Schema::table('planning_semaines', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
