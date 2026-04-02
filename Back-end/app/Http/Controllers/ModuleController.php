<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function index(Request $request)
    {
        $query = Module::with(['groupe', 'formateur'])
            ->when($request->search, fn($q) =>
                $q->where('intitule', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%")
            )
            ->when($request->filiere_id, fn($q) =>
                $q->whereHas('groupe', fn($g) =>
                    $g->where('filiere_id', $request->filiere_id)
                )
            )
            ->when($request->eg_et, fn($q) =>
                $q->where('eg_et', $request->eg_et)
            )
            ->when($request->semestre, fn($q) =>
                $q->where('semestre', $request->semestre)
            )
            ->latest();

        return response()->json($query->paginate(15));
    }
}