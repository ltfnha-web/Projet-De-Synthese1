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
        'role',
        'is_active',
        'specialite',   // formateur uniquement
        'telephone',
        'statut',       // actif | inactif
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password'  => 'hashed',
        'is_active' => 'boolean',
    ];

    // Helpers rôle
    public function isDirecteur():   bool { return $this->role === 'directeur'; }
    public function isSurveillant(): bool { return $this->role === 'surveillant'; }
    public function isFormateur():   bool { return $this->role === 'formateur'; }
}