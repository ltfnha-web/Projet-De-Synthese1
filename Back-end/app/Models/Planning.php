<?php
// app/Models/Planning.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Planning extends Model
{
    protected $fillable = [
        'pole_id', 'groupe_id', 'module_id', 'formateur_id',
        'semestre', 'type', 'mh_drif', 'mh_realisee',
        'date_debut', 'nb_semaines', 'semaines_faites',
        'charge_hebdo', 'statut',
        'jour', 'seance_numero', 'salle', 'mode',
    ];

    protected $casts = [
        'date_debut'  => 'date',
        'mh_drif'     => 'integer',
        'mh_realisee' => 'integer',
    ];

    public function groupe()    { return $this->belongsTo(Groupe::class); }
    public function module()    { return $this->belongsTo(Module::class); }
    public function formateur() { return $this->belongsTo(User::class, 'formateur_id'); }
    public function pole()      { return $this->belongsTo(User::class, 'pole_id'); }

    // Accessor
    public function getMhRestantAttribute()   { return $this->mh_drif - $this->mh_realisee; }
    public function getAvancementAttribute()  {
        return $this->mh_drif > 0 ? round(($this->mh_realisee / $this->mh_drif) * 100) : 0;
    }
}