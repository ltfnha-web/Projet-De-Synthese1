<?php

namespace App\Services;

use App\Models\EmploiSeance;
use App\Models\Salle;
use Illuminate\Support\Collection;

class ClassroomConflictService
{
    /**
     * Check if any salle in the provided seances is already used by ANOTHER group
     * on the same day (any séance). Same group = no conflict.
     *
     * $seances: [ ['salle_id'=>int, 'jour'=>str, 'semestre'=>str, ...], ... ]
     */
    public function checkConflicts(array $seances, ?int $excludeEmploiId = null): array
    {
        $conflicts = [];
        $checked   = []; // deduplicate by "salle_id:jour:semestre"

        foreach ($seances as $s) {
            if (empty($s['salle_id'])) continue;

            $key = "{$s['salle_id']}:{$s['jour']}:{$s['semestre']}";
            if (isset($checked[$key])) continue;
            $checked[$key] = true;

            // Conflict = another emploi (different group) uses this room on this day
            $q = EmploiSeance::where('salle_id', $s['salle_id'])
                             ->where('jour',     $s['jour'])
                             ->where('semestre', $s['semestre']);

            if ($excludeEmploiId) {
                $q->where('emploi_id', '!=', $excludeEmploiId);
            }

            $existing = $q->with(['salle', 'emploi.groupe'])->first();

            if ($existing) {
                $salle  = $existing->salle?->nom ?? "Salle #{$s['salle_id']}";
                $groupe = $existing->emploi?->groupe?->nom ?? '?';
                $conflicts[] = [
                    'salle_id' => $s['salle_id'],
                    'salle'    => $salle,
                    'jour'     => $s['jour'],
                    'semestre' => $s['semestre'],
                    'message'  => "La salle {$salle} est déjà utilisée le {$s['jour']} ({$s['semestre']}) par le groupe {$groupe}.",
                ];
            }
        }

        return $conflicts;
    }

    /**
     * Return salles not used by any OTHER group on the given day.
     * A room used every day by the same group is still available for that group.
     */
    public function getAvailableSalles(string $jour, string $semestre, ?int $excludeEmploiId = null): Collection
    {
        $busy = EmploiSeance::where('jour', $jour)
                            ->where('semestre', $semestre);

        if ($excludeEmploiId) {
            $busy->where('emploi_id', '!=', $excludeEmploiId);
        }

        $busyIds = $busy->pluck('salle_id')->unique();

        return Salle::actif()
            ->whereNotIn('id', $busyIds)
            ->orderBy('nom')
            ->get(['id', 'nom', 'type', 'capacite']);
    }
}
