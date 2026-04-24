<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'plain_password',
        'role',           // directeur | surveillant | formateur | pole
        'is_active',
        'specialite',
        'telephone',
        'statut',
        'formateur_id',   // lien vers formateurs.id (role formateur)
        'secteur_id',     // lien vers secteurs.id   (role pole)
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password'  => 'hashed',
        'is_active' => 'boolean',
    ];

    // ── Relations ──
    public function formateur()
    {
        return $this->belongsTo(Formateur::class, 'formateur_id');
    }

    public function secteur()
    {
        return $this->belongsTo(Secteur::class, 'secteur_id');
    }

    // ── Helpers rôle ──
    public function isDirecteur(): bool { return $this->role === 'directeur'; }
    public function isFormateur(): bool { return $this->role === 'formateur'; }
    public function isPole():      bool { return $this->role === 'pole'; }
}