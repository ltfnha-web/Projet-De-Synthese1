<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormateurEmploi extends Model
{
    protected $table = 'formateur_emplois';

    protected $fillable = ['formateur_id', 'created_by', 'semestre', 'grille', 'signataire_nom'];

    protected $casts = ['grille' => 'array'];

    public function formateur() { return $this->belongsTo(Formateur::class); }
}
