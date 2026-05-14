<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemaineAcademique extends Model
{
    protected $table = 'semaines_academiques';

    protected $fillable = [
        'annee_scolaire',
        'semaine_num',
        'date_debut',
        'date_fin',
        'semestre',
        'label',
    ];

    protected $casts = [
        'date_debut'  => 'date',
        'date_fin'    => 'date',
        'semaine_num' => 'integer',
        'semestre'    => 'integer',
    ];

    // ── Scopes ────────────────────────────────────────────────

    public function scopeForYear($query, int $annee)
    {
        return $query->where('annee_scolaire', $annee . '-' . ($annee + 1));
    }

    public function scopeForAnneeScolaire($query, string $anneeScolaire)
    {
        return $query->where('annee_scolaire', $anneeScolaire);
    }

    public function scopeSemestre($query, int $semestre)
    {
        return $query->where('semestre', $semestre);
    }

    // ── Accessors ─────────────────────────────────────────────

    /** Return the date_debut formatted as "YYYY-MM-DD" string. */
    public function getDateLundiAttribute(): string
    {
        return $this->date_debut->toDateString();
    }

    /** Return the date_fin formatted as "YYYY-MM-DD" string. */
    public function getDateDimancheAttribute(): string
    {
        return $this->date_fin->toDateString();
    }
}
