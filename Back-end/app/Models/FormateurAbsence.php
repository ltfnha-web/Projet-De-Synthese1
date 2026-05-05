<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class FormateurAbsence extends Model
{
    protected $table    = 'formateur_absences';
    protected $fillable = ['formateur_id', 'date_debut', 'date_fin', 'cause', 'nb_heures'];
    protected $casts    = ['date_debut' => 'date', 'date_fin' => 'date'];

    public function formateur() { return $this->belongsTo(Formateur::class); }

    public function getNbSemainesAttribute(): int
    {
        return (int) ceil($this->date_debut->diffInDays($this->date_fin) / 7) + 1;
    }
}
