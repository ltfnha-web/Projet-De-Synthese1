<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanningSemaine extends Model
{
    protected $table = 'planning_semaines';

    protected $fillable = [
        'planning_id',
        'semaine_num',
        'semestre',
        'mh_prevue',
    ];

    protected $casts = [
        'semaine_num' => 'integer',
        'semestre'    => 'integer',
        'mh_prevue'   => 'float',
    ];

    public function planning()
    {
        return $this->belongsTo(Planning::class);
    }
}