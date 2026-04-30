<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Formateur;
use App\Models\FormateurEmploi;
use Illuminate\Http\Request;

class FormateurController extends Controller
{
    // ✅ TOUS les formateurs sans pagination — pour alimenter les selects
    public function all()
    {
        return response()->json(
            Formateur::select('id', 'nom')
                ->orderBy('nom')
                ->get()
        );
    }

    public function index(Request $request)
    {
        $query = Formateur::query()
            ->when($request->search, fn($q) =>
                $q->where('nom', 'like', "%{$request->search}%")
                  ->orWhere('mle', 'like', "%{$request->search}%")
            )
            ->when($request->statut, fn($q) => $q->where('statut', $request->statut))
            ->latest();

        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom'    => 'required|string|max:150',
            'mle'    => 'required|string|max:50|unique:formateurs,mle',
            'statut' => 'in:actif,inactif',
        ]);

        $formateur = Formateur::create($request->only(['nom', 'mle', 'statut']));
        return response()->json($formateur, 201);
    }

    public function update(Request $request, Formateur $formateur)
    {
        $request->validate([
            'nom'    => 'required|string|max:150',
            'mle'    => 'required|string|max:50|unique:formateurs,mle,' . $formateur->id,
            'statut' => 'in:actif,inactif',
        ]);

        $formateur->update($request->only(['nom', 'mle', 'statut']));
        return response()->json($formateur);
    }

    public function destroy(Formateur $formateur)
    {
        $formateur->delete();
        return response()->json(['message' => 'Formateur supprimé.']);
    }

    public function emploi(Request $request)
    {
        $user = $request->user();

        // Resolve formateur — by formateur_id or by name fallback
        $formateur = null;
        if ($user->formateur_id) {
            $formateur = Formateur::find($user->formateur_id);
        }
        if (!$formateur) {
            $formateur = Formateur::where('nom', $user->name)->first();
        }

        if (!$formateur) {
            return response()->json(['data' => []]);
        }

        $sort  = $request->query('sort', 'desc');
        $saved = FormateurEmploi::where('formateur_id', $formateur->id)
            ->orderBy('created_at', $sort === 'asc' ? 'asc' : 'desc')
            ->get();

        if ($saved->isNotEmpty()) {
            return response()->json(['data' => $saved->map(fn($e) => [
                'id'            => $e->id,
                'semestre'      => $e->semestre,
                'grille'        => $e->grille,
                'signataire_nom'=> $e->signataire_nom,
                'created_at'    => $e->created_at?->format('d/m/Y'),
                'source'        => 'saved',
            ])]);
        }

        // Fallback: derive live from groupe timetables
        $jours  = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
        $grille = [];
        foreach ($jours as $j) { $grille[$j] = array_fill(0, 4, null); }

        \App\Models\EmploiDuTemps::with('groupe')->get()
            ->each(function ($emploi) use (&$grille, $formateur, $jours) {
                if (!is_array($emploi->grille)) return;
                foreach ($jours as $jour) {
                    foreach (($emploi->grille[$jour] ?? []) as $si => $cell) {
                        if (!$cell) continue;
                        $byId   = !empty($cell['formateur_id']) && (int)$cell['formateur_id'] === $formateur->id;
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

        $hasAny = collect($jours)->some(fn($j) => collect($grille[$j])->some(fn($c) => $c !== null));
        if (!$hasAny) {
            return response()->json(['data' => []]);
        }

        return response()->json(['data' => [[
            'id'            => null,
            'semestre'      => null,
            'grille'        => $grille,
            'signataire_nom'=> null,
            'created_at'    => now()->format('d/m/Y'),
            'source'        => 'live',
        ]]]);
    }

    public function planning(Request $request)
    {
        return response()->json(['data' => []]);
    }
}