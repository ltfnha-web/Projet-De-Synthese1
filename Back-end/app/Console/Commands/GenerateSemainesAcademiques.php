<?php

namespace App\Console\Commands;

use App\Services\AcademicWeekService;
use Illuminate\Console\Command;

/**
 * php artisan semaines:generate              → current academic year
 * php artisan semaines:generate 2024         → year 2024-2025
 * php artisan semaines:generate --years=3    → current + next 2 years
 * php artisan semaines:generate --all        → current + next 2 years (alias)
 * php artisan semaines:generate --force      → delete and recreate
 * php artisan semaines:generate --list       → show persisted years only
 */
class GenerateSemainesAcademiques extends Command
{
    protected $signature = 'semaines:generate
        {annee?         : Starting calendar year, e.g. 2025 for 2025-2026 (default: current academic year)}
        {--years=1      : Number of consecutive years to generate}
        {--all          : Shortcut for --years=3 (current + next 2)}
        {--force        : Delete existing rows before regenerating}
        {--list         : List already-persisted academic years and exit}';

    protected $description = 'Generate and persist academic weeks (Sep → Jun) for one or more school years';

    public function handle(AcademicWeekService $svc): int
    {
        // ── --list mode ───────────────────────────────────────
        if ($this->option('list')) {
            $years = $svc->listPersistedYears();
            if (empty($years)) {
                $this->warn('No academic weeks have been persisted yet.');
            } else {
                $this->info('Persisted academic years:');
                foreach ($years as $y) {
                    $count = \App\Models\SemaineAcademique::where('annee_scolaire', $y)->count();
                    $this->line("  {$y} → {$count} weeks");
                }
            }
            return self::SUCCESS;
        }

        // ── Generation mode ───────────────────────────────────
        $annee = (int) ($this->argument('annee') ?? AcademicWeekService::currentYear());
        $force = (bool) $this->option('force');
        $all   = (bool) $this->option('all');
        $years = $all ? 3 : max(1, (int) $this->option('years'));

        if ($annee < 2000 || $annee > 2100) {
            $this->error("Invalid year: {$annee}. Must be between 2000 and 2100.");
            return self::FAILURE;
        }

        $this->info("Generating academic weeks" . ($force ? ' (force mode)' : '') . '...');
        $this->newLine();

        $totalInserted = 0;

        for ($i = 0; $i < $years; $i++) {
            $y     = $annee + $i;
            $label = AcademicWeekService::label($y);

            $count = $svc->persist($y, $force);

            if ($count > 0) {
                $this->line("  <fg=green>✓</> <options=bold>{$label}</> → {$count} weeks created");
                $totalInserted += $count;
            } else {
                $this->line("  <fg=yellow>-</> <options=bold>{$label}</> → already exists (use --force to regenerate)");
            }
        }

        $this->newLine();

        if ($totalInserted > 0) {
            $this->info("Done — {$totalInserted} week(s) inserted total.");
        } else {
            $this->comment('Nothing to do — all requested years already exist.');
        }

        return self::SUCCESS;
    }
}
