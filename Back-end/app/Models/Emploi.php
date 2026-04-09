<?php
// app/Models/EmploiDuTemps.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmploiDuTemps extends Model
{
    protected $table = 'emplois_du_temps';

    protected $fillable = [
        'groupe_id', 'periode_debut', 'grille', 'valide', 'created_by',
    ];

    protected $casts = [
        'grille'        => 'array',
        'periode_debut' => 'date',
        'valide'        => 'boolean',
    ];

    public function groupe()   { return $this->belongsTo(Groupe::class); }
    public function createur() { return $this->belongsTo(User::class, 'created_by'); }
}