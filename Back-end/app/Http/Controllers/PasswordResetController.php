<?php

namespace App\Http\Controllers;

use App\Mail\MotDePasseOublieMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function sendLink(Request $request)
    {
        $request->validate([
            'login_email'    => 'required|email',
            'personal_email' => 'required|email',
        ], [
            'login_email.required'    => "L'email de connexion est obligatoire.",
            'login_email.email'       => "L'email de connexion n'est pas valide.",
            'personal_email.required' => "L'email personnel est obligatoire.",
            'personal_email.email'    => "L'email personnel n'est pas valide.",
        ]);

        $user = User::whereRaw('LOWER(email) = LOWER(?)', [trim($request->login_email)])->first();

        if (!$user) {
            return response()->json([
                'errors' => ['login_email' => ["Aucun compte associé à cet email de connexion."]],
            ], 422);
        }

        $personalEmail = trim($request->personal_email);

        DB::table('forgot_password_tokens')
            ->where('email', $user->email)
            ->delete();

        $token = Str::random(64);
        DB::table('forgot_password_tokens')->insert([
            'email'      => $user->email,
            'token'      => $token,
            'created_at' => now(),
        ]);

        $resetUrl = config('app.frontend_url')
            . '/reinitialisation-mot-de-passe'
            . '?token=' . $token
            . '&email=' . urlencode($user->email);

        Mail::to($personalEmail)->send(new MotDePasseOublieMail($user, $resetUrl));

        return response()->json(['message' => 'Un email a été envoyé avec les instructions.']);
    }

    public function getInfo(Request $request)
    {
        $record = DB::table('forgot_password_tokens')
            ->where('token', $request->token)
            ->where('email', $request->email)
            ->where('created_at', '>', now()->subHour())
            ->first();

        if (!$record) {
            return response()->json(['error' => 'Lien invalide ou expiré.'], 422);
        }

        $user = User::where('email', $request->email)->first();

        return response()->json([
            'old_password' => $user->plain_password ?? '',
            'name'         => $user->name,
        ]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token'                 => 'required',
            'email'                 => 'required|email',
            'password'              => 'required|min:6|confirmed',
        ], [
            'password.required'   => 'Le nouveau mot de passe est obligatoire.',
            'password.min'        => 'Le mot de passe doit contenir au moins 6 caractères.',
            'password.confirmed'  => 'Les mots de passe ne correspondent pas.',
        ]);

        $record = DB::table('forgot_password_tokens')
            ->where('token', $request->token)
            ->where('email', $request->email)
            ->where('created_at', '>', now()->subHour())
            ->first();

        if (!$record) {
            return response()->json(['error' => 'Lien invalide ou expiré.'], 422);
        }

        $user = User::where('email', $request->email)->first();

        $user->update([
            'password'       => Hash::make($request->password),
            'plain_password' => $request->password,
        ]);

        DB::table('forgot_password_tokens')
            ->where('token', $request->token)
            ->delete();

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }
}
