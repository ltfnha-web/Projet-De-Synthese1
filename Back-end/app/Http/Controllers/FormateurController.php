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

        if (!$user->formateur_id) {
            return response()->json(['data' => []]);
        }

        $sort = $request->query('sort', 'desc'); // desc = récent, asc = ancien

        $list = FormateurEmploi::where('formateur_id', $user->formateur_id)
            ->orderBy('created_at', $sort === 'asc' ? 'asc' : 'desc')
            ->get()
            ->map(fn($e) => [
                'id'         => $e->id,
                'semestre'   => $e->semestre,
                'grille'     => $e->grille,
                'created_at' => $e->created_at?->format('d/m/Y'),
            ]);

        return response()->json(['data' => $list]);
    }

    public function planning(Request $request)
    {
        return response()->json(['data' => []]);
    }
}