<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Groupe extends Model {
    protected $fillable = ['nom', 'filiere_id', 'annee_formation', 'effectif', 'statut', 'mode', 'creneau'];
    public function filiere()  { return $this->belongsTo(Filiere::class); }
    public function modules()  { return $this->hasMany(Module::class); }
}