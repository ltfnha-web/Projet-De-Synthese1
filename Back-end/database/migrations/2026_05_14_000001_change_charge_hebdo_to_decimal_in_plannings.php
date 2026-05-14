<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Change plannings.charge_hebdo from INTEGER to DECIMAL(4,1)
 * so that values like 2.5 h/week are stored and read correctly.
 *
 * Run: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plannings', function (Blueprint $table) {
            $table->decimal('charge_hebdo', 4, 1)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('plannings', function (Blueprint $table) {
            $table->integer('charge_hebdo')->default(0)->change();
        });
    }
};
