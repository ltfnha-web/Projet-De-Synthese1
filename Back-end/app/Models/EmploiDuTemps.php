<?php
// app/Models/EmploiDuTemps.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\EmploiSeance;

class EmploiDuTemps extends Model
{
    protected $table = 'emplois_du_temps';

    protected $fillable = [
        'groupe_id',
        'created_by',
        'periode_debut',
        'semestre',
        'grille',
        'valide',
        'formateur_parrain',
        'signataire_nom',
    ];
    protected $casts = [
        'grille'        => 'array',
        'periode_debut' => 'date',
        'valide'        => 'boolean',
    ];

    public function groupe()   { return $this->belongsTo(Groupe::class); }
    public function createur() { return $this->belongsTo(User::class, 'created_by'); }
    public function seances()  { return $this->hasMany(EmploiSeance::class, 'emploi_id'); }
}