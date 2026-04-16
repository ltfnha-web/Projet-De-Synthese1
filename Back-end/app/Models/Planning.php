<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Planning extends Model
{
    protected $fillable = [
        'groupe_id',
        'module_id',
        'formateur_id',
        'semestre',
        'type',
        'mh_drif',
        'mh_realisee',
        'date_debut',
        'nb_semaines',
        'semaines_faites',
        'charge_hebdo',
        'statut',
        'jour',
        'seance_numero',
        'salle',
        'mode',
    ];

    protected $casts = [
        'date_debut'      => 'date',
        'mh_drif'         => 'integer',
        'mh_realisee'     => 'integer',
        'nb_semaines'     => 'integer',
        'semaines_faites' => 'integer',
        'charge_hebdo'    => 'integer',
        'seance_numero'   => 'integer',
    ];

    // ── Relations ──────────────────────────────────────────

    public function groupe()
    {
        return $this->belongsTo(Groupe::class);
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function formateur()
    {
        return $this->belongsTo(Formateur::class, 'formateur_id');
    }

    public function semaines()
    {
        return $this->hasMany(PlanningSemaine::class)->orderBy('semaine_num');
    }

    // ── Accessors ──────────────────────────────────────────

    /**
     * MH totale prévue = somme des cases semaines
     * (Si aucune semaine, fallback sur mh_drif)
     */
    public function getMhPrevueTotaleAttribute(): float
    {
        return $this->semaines->sum('mh_prevue');
    }

    /**
     * MH restante = mh_drif - total prévu dans les semaines
     */
    public function getMhRestanteAttribute(): float
    {
        $totalPrevu = $this->semaines->sum('mh_prevue');
        return max(0, ($this->mh_drif ?? 0) - $totalPrevu);
    }

    /**
     * Avancement % basé sur mh_realisee / mh_drif
     */
    public function getAvancementAttribute(): int
    {
        if (!$this->mh_drif || $this->mh_drif == 0) return 0;
        return (int) round(($this->mh_realisee / $this->mh_drif) * 100);
    }
}