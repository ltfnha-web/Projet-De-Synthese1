<?php

namespace App\Http\Controllers;

use App\Models\EmploiDuTemps;
use App\Models\Formateur;
use App\Models\FormateurEmploi;
use Illuminate\Http\Request;

class FormateurEmploiController extends Controller
{
    const JOURS         = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const SEANCES_COUNT = 4;

    public function index()
    {
        $list = FormateurEmploi::with('formateur')->orderByDesc('created_at')->get()
            ->map(fn($e) => [
                'id'           => $e->id,
                'formateur_id' => $e->formateur_id,
                'formateur'    => $e->formateur?->nom ?? '—',
                'semestre'     => $e->semestre,
                'created_at'   => $e->created_at?->format('d/m/Y'),
            ]);

        return response()->json(['data' => $list]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'formateur_id' => 'required|exists:formateurs,id',
            'semestre'     => 'required|in:S1,S2',
        ]);

        $formateur = Formateur::findOrFail($request->formateur_id);

        $grille = [];
        foreach (self::JOURS as $jour) {
            $grille[$jour] = array_fill(0, self::SEANCES_COUNT, null);
        }

        EmploiDuTemps::with('groupe')->get()->each(function ($emploi) use (&$grille, $formateur) {
            if (!is_array($emploi->grille)) return;
            foreach (self::JOURS as $jour) {
                foreach (($emploi->grille[$jour] ?? []) as $si => $cell) {
                    if (!$cell) continue;
                    $byId   = !empty($cell['formateur_id']) && (int)$cell['formateur_id'] === (int)$formateur->id;
                    $byName = !$byId && !empty($cell['formateur'])
                              && mb_strtolower(trim($cell['formateur'])) === mb_strtolower(trim($formateur->nom));
                    if (!$byId && !$byName) continue;
                    if ($grille[$jour][$si] !== null) continue;
                    $grille[$jour][$si] = [
                        'module' => $cell['module'] ?? '—',
                        'groupe' => $emploi->groupe?->nom ?? '?',
                        'salle'  => $cell['salle']  ?? '',
                        'mode'   => $cell['mode']   ?? 'PRESENTIEL',
                    ];
                }
            }
        });

        $record = FormateurEmploi::create([
            'formateur_id'  => $formateur->id,
            'created_by'    => $request->user()->id,
            'semestre'      => $request->semestre,
            'grille'        => $grille,
            'signataire_nom'=> $request->signataire_nom,
        ]);

        return response()->json(['message' => "Emploi de {$formateur->nom} sauvegardé."], 201);
    }

    public function show($id)
    {
        $record = FormateurEmploi::with('formateur')->findOrFail($id);
        return response()->json(['data' => [
            'id'            => $record->id,
            'formateur_id'  => $record->formateur_id,
            'formateur'     => $record->formateur?->nom ?? '—',
            'semestre'      => $record->semestre,
            'grille'        => $record->grille,
            'signataire_nom'=> $record->signataire_nom,
            'created_at'    => $record->created_at?->format('d/m/Y'),
        ]]);
    }

    public function destroy($id)
    {
        FormateurEmploi::findOrFail($id)->delete();
        return response()->json(['message' => 'Supprimé.']);
    }

    public function destroyAll()
    {
        $count = FormateurEmploi::count();
        FormateurEmploi::query()->delete();
        return response()->json(['message' => "{$count} emploi(s) de formateur(s) supprimé(s)."]);
    }
}
