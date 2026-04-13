<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;

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

    /*
    |---------------------------------------
    | RELATIONS
    |---------------------------------------
    */

    // Planning belongs to Groupe
    public function groupe()
    {
        return $this->belongsTo(Groupe::class);
    }

    // Planning belongs to Module
    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    // 🔥 IMPORTANT: formateur comes from FORMATEURS table (NOT users)
    public function formateur()
    {
        return $this->belongsTo(Formateur::class, 'formateur_id');
    }

    /*
    |---------------------------------------
    | ACCESSORS (HELPERS)
    |---------------------------------------
    */

    // Remaining hours
    public function getMhRestantAttribute(): int
    {
        return ($this->mh_drif ?? 0) - ($this->mh_realisee ?? 0);
    }

    // Progress %
    public function getAvancementAttribute(): int
    {
        if (!$this->mh_drif || $this->mh_drif == 0) {
            return 0;
        }

        return (int) round(
            ($this->mh_realisee / $this->mh_drif) * 100
        );
    }
}