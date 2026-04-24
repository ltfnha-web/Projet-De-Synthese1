<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Stage extends Model {
    protected $fillable = ['groupe_id', 'date_debut', 'date_fin', 'statut'];
    protected $casts    = ['date_debut' => 'date', 'date_fin' => 'date'];

    public function groupe() {
        return $this->belongsTo(Groupe::class);
    }
}