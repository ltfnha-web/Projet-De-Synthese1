<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmploiSeance extends Model
{
    protected $table = 'emploi_seances';

    protected $fillable = [
        'emploi_id', 'salle_id', 'module_id', 'formateur_id',
        'jour', 'numero_seance', 'semestre', 'mode',
    ];

    public function emploi()    { return $this->belongsTo(EmploiDuTemps::class); }
    public function salle()     { return $this->belongsTo(Salle::class); }
    public function module()    { return $this->belongsTo(Module::class); }
    public function formateur() { return $this->belongsTo(Formateur::class); }
}
