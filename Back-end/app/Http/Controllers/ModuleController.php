<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function index(Request $request)
    {
        $query = Module::with(['groupe.filiere.secteur', 'formateur'])
            ->when($request->search, fn($q) =>
                $q->where(fn($sq) =>
                    $sq->where('intitule', 'like', "%{$request->search}%")
                       ->orWhere('code', 'like', "%{$request->search}%")
                )
            )
            ->when($request->filiere_id, fn($q) =>
                $q->whereHas('groupe', fn($g) =>
                    $g->where('filiere_id', $request->filiere_id)
                )
            )
            ->when($request->secteur_id, fn($q) =>
                $q->whereHas('groupe.filiere', fn($g) =>
                    $g->where('secteur_id', $request->secteur_id)
                )
            )
            ->when($request->formateur_id, fn($q) =>
                $q->where('formateur_id', $request->formateur_id)
            )
            ->when($request->eg_et, fn($q) =>
                $q->where('eg_et', $request->eg_et)
            )
            ->when($request->semestre, fn($q) =>
                $q->where('semestre', $request->semestre)
            )
            ->when($request->filled('creneau'), fn($q) =>
                $q->whereHas('groupe', fn($g) =>
                    $g->where('creneau', $request->creneau)
                )
            )
            ->when($request->filled('is_regional') && $request->is_regional !== '', fn($q) =>
                $q->where('is_regional', (int)$request->is_regional)
            )
            ->when($request->filled('seance_efm') && $request->seance_efm !== '', fn($q) =>
                $q->where('seance_efm', $request->seance_efm)
            )
            ->when($request->filled('validation_efm') && $request->validation_efm !== '', fn($q) =>
                $q->where('validation_efm', $request->validation_efm)
            )
            ->when($request->filled('demarre') && $request->demarre !== '', fn($q) =>
                $request->demarre == '1'
                    ? $q->where('mh_realisee_globale', '>', 0)
                    : $q->where('mh_realisee_globale', 0)
            )
            ->when(!$request->filled('exam_type') && $request->type_formation, fn($q) =>
                $q->where('type_formation', $request->type_formation)
            )
            ->when($request->filled('exam_type') && $request->exam_type !== '', function ($q) use ($request) {
                // Canonical → DB synonym map
                $synonyms = [
                    'Fin de Formation' => ['Fin de Formation', 'EFF', 'Fin Formation'],
                    'Passage'          => ['Passage', 'EFP'],
                    'Qualifiante'      => ['Qualifiante'],
                    'Diplômante'       => ['Diplômante', 'Diplomante'],
                ];
                $values = $synonyms[$request->exam_type] ?? [$request->exam_type];
                $q->whereIn('type_formation', $values);
            })
            ->latest();

        return response()->json($query->paginate(15));
    }
}
