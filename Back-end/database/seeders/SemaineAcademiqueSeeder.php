<?php

namespace Database\Seeders;

use App\Services\AcademicWeekService;
use Illuminate\Database\Seeder;

/**
 * Seeds academic weeks for the current year and the next one.
 *
 * Run standalone:  php artisan db:seed --class=SemaineAcademiqueSeeder
 * Or via migrate:  php artisan migrate --seed  (if called from DatabaseSeeder)
 */
class SemaineAcademiqueSeeder extends Seeder
{
    public function run(AcademicWeekService $svc): void
    {
        $current = AcademicWeekService::currentYear();

        foreach ([$current, $current + 1] as $annee) {
            $label = AcademicWeekService::label($annee);
            $count = $svc->persist($annee);

            if ($count > 0) {
                $this->command->info("  Seeded {$count} weeks for {$label}");
            } else {
                $this->command->line("  <fg=yellow>{$label} already exists — skipped</>");
            }
        }
    }
}
