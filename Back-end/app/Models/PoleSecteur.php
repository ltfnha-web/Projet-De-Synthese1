<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PoleSecteur extends Model
{
    protected $table    = 'pole_secteur';
    protected $fillable = ['secteur_id', 'formateur_id', 'notes'];

    public function secteur()   { return $this->belongsTo(Secteur::class); }
    public function formateur() { return $this->belongsTo(Formateur::class); }
}