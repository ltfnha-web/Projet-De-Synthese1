<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Formateur extends Model {
    protected $fillable = ['mle', 'nom', 'statut'];
    public function modules() { return $this->hasMany(Module::class); }
}