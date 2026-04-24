<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Secteur extends Model
{
    protected $fillable = ['nom'];


    public function poleSecteur() { return $this->hasOne(PoleSecteur::class, 'secteur_id'); }
    public function filieres() { return $this->hasMany(Filiere::class, 'secteur_id'); }
    public function users()
{
    return $this->hasMany(\App\Models\User::class, 'secteur_id');
}
}