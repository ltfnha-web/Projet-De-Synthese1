<?php
// ============================================================
// app/Models/User.php
// MODIFICATION : zbid "pole" f fillable + helper isPole()
// ============================================================

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
        'role',        // directeur | surveillant | formateur | stagiaire | pole ← AJOUT
        'is_active',
        'specialite',
        'telephone',
        'statut',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password'  => 'hashed',
        'is_active' => 'boolean',
    ];

    // ── Helpers rôle ──
    public function isDirecteur():   bool { return $this->role === 'directeur'; }
    public function isFormateur():   bool { return $this->role === 'formateur'; }
    public function isPole():        bool { return $this->role === 'pole'; }        // ← AJOUT
}