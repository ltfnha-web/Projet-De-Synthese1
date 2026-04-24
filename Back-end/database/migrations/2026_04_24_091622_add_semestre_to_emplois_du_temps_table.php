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
        Schema::table('emplois_du_temps', function (Blueprint $table) {
            $table->string('semestre')->nullable(); // or use other column types
            // Or if you want to specify position:
            // $table->string('semestre')->after('existing_column_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('emplois_du_temps', function (Blueprint $table) {
            $table->dropColumn('semestre');
        });
    }
};