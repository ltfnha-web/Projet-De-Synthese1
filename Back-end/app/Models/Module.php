<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Module extends Model {
    protected $fillable = [
        'code', 'intitule', 'groupe_id', 'formateur_id',
        'mh_drif', 'mh_drif_presentiel', 'mh_drif_distanciel',
        'mh_realisee_presentiel', 'mh_realisee_sync', 'mh_realisee_globale',
        'mh_restante', 'taux_realisation', 'tx_avc_mod',
        'eg_et', 'semestre', 'validation_efm', 'seance_efm',
    ];
    public function groupe()    { return $this->belongsTo(Groupe::class); }
    public function formateur() { return $this->belongsTo(Formateur::class); }
}