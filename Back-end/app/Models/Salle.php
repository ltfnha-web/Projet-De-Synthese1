<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Salle extends Model
{
    protected $fillable = ['nom', 'secteur', 'capacite', 'type', 'actif'];

    protected $casts = ['actif' => 'boolean', 'capacite' => 'integer'];

    public function seances()
    {
        return $this->hasMany(EmploiSeance::class);
    }

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    /**
     * Check whether this room is free at a given slot.
     * $semestre = 'S1' | 'S2'
     */
    public function isDisponible(string $jour, int $numeroSeance, string $semestre, ?int $excludeEmploiId = null): bool
    {
        $q = $this->seances()
            ->where('jour', $jour)
            ->where('numero_seance', $numeroSeance)
            ->where('semestre', $semestre);

        if ($excludeEmploiId) {
            $q->where('emploi_id', '!=', $excludeEmploiId);
        }

        return $q->doesntExist();
    }
}
