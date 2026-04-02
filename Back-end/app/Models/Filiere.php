<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Filiere extends Model {
    protected $fillable = ['code', 'intitule', 'secteur_id'];
    public function secteur()  { return $this->belongsTo(Secteur::class); }
    public function groupes()  { return $this->hasMany(Groupe::class); }
}