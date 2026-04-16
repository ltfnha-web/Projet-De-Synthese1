<?php

namespace App\Http\Controllers;

use App\Models\Planning;
use App\Models\PlanningSemaine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PlanningController extends Controller
{
    // ────────────────────────────────────────────────────────────
    // HELPER — Génère les 42 semaines de l'année scolaire
    // S1 = premier lundi de septembre
    // S2 débute le 01/02 (premier lundi de février)
    // Fin = dernier lundi avant le 01/07
    // ────────────────────────────────────────────────────────────
    public static function getSemainesAnnee(int $annee = null): array
    {
        // Année scolaire courante : si on est avant septembre, c'est l'année précédente
        if (!$annee) {
            $now = Carbon::now();
            $annee = $now->month >= 9 ? $now->year : $now->year - 1;
        }

        // 1er lundi de septembre
        $debut = Carbon::create($annee, 9, 1);
        while ($debut->dayOfWeek !== Carbon::MONDAY) {
            $debut->addDay();
        }

        // Fin = dernier lundi avant le 1er juillet de l'année suivante
        $fin = Carbon::create($annee + 1, 7, 1);
        while ($fin->dayOfWeek !== Carbon::MONDAY) {
            $fin->subDay();
        }

        $semaines = [];
        $current  = $debut->copy();
        $num      = 1;

        while ($current->lte($fin)) {
            // Semestre : S2 commence le 1er février
            $semestreDebut = Carbon::create($annee + 1, 2, 1);
            $semestre = $current->lt($semestreDebut) ? 1 : 2;

            $semaines[] = [
                'num'       => $num,
                'semestre'  => $semestre,
                'date_lundi'=> $current->toDateString(),
                'label'     => 'S' . $num, // ex: S1, S12, S27...
            ];

            $current->addWeek();
            $num++;

            if ($num > 50) break; // sécurité
        }

        return $semaines;
    }

    // ────────────────────────────────────────────────────────────
    // GET /api/plannings
    // Retourne tous les plannings avec leurs semaines
    // Filtres : groupe_id, semestre, annee
    // ────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $annee    = (int)($request->annee ?? 0) ?: null;
        $semaines = self::getSemainesAnnee($annee);

        $query = Planning::with(['groupe', 'module', 'formateur', 'semaines'])
            ->when($request->filled('groupe_id'), fn($q) =>
                $q->where('groupe_id', $request->groupe_id)
            )
            ->when($request->filled('semestre'), fn($q) =>
                $q->where('semestre', $request->semestre)
            );

        $plannings = $query->get()->map(function ($p) use ($semaines) {
            // Index des MH par semaine_num pour accès rapide
            $mhBySemaine = $p->semaines->pluck('mh_prevue', 'semaine_num');

            $totalPrevu   = $p->semaines->sum('mh_prevue');
            $mhRestante   = max(0, ($p->mh_drif ?? 0) - $totalPrevu);

            return [
                'id'          => $p->id,
                'groupe_id'   => $p->groupe_id,
                'groupe_nom'  => $p->groupe?->nom ?? $p->groupe?->code ?? '—',
                'module_id'   => $p->module_id,
                'module_nom'  => $p->module?->intitule ?? '—',
                'formateur_id'=> $p->formateur_id,
                'formateur_nom'=> $p->formateur?->nom ?? '—',
                'semestre'    => $p->semestre,
                'mh_drif'     => $p->mh_drif ?? 0,
                'mh_realisee' => $p->mh_realisee ?? 0,
                'mh_restante' => $mhRestante,
                'total_prevu' => $totalPrevu,
                // Cases semaines : { "1": 3.5, "7": 2, ... }
                'semaines'    => $mhBySemaine,
            ];
        });

        return response()->json([
            'plannings'       => $plannings,
            'semaines_annee'  => $semaines,
            'annee_scolaire'  => ($annee ?? $this->getAnneeCourante()) . '-' . (($annee ?? $this->getAnneeCourante()) + 1),
        ]);
    }

    // ────────────────────────────────────────────────────────────
    // POST /api/plannings
    // Créer un planning + auto-distribuer les MH sur les semaines
    // ────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'groupe_id'     => 'required|exists:groupes,id',
            'module_id'     => 'required|exists:modules,id',
            'formateur_id'  => 'required|exists:formateurs,id',
            'semestre'      => 'required|in:S1,S2',
            'mh_drif'       => 'required|integer|min:1',
            'type'          => 'nullable|string',
            'mode'          => 'nullable|string',
            'charge_hebdo'  => 'nullable|numeric|min:0',
        ]);

        $planning = Planning::create([
            ...$validated,
            'mh_realisee'     => 0,
            'semaines_faites' => 0,
            'statut'          => 'En cours',
        ]);

        // ── Auto-distribution si charge_hebdo fournie ──
        if (!empty($validated['charge_hebdo']) && $validated['charge_hebdo'] > 0) {
            $this->autoDistribuer($planning, (float)$validated['charge_hebdo']);
        }

        return response()->json([
            'data' => $planning->load(['groupe', 'module', 'formateur', 'semaines'])
        ], 201);
    }

    // ────────────────────────────────────────────────────────────
    // PUT /api/plannings/{id}/semaine
    // Modifier la MH d'UNE semaine spécifique
    // Body: { semaine_num: 5, mh_prevue: 3.5 }
    // ────────────────────────────────────────────────────────────
    public function updateSemaine(Request $request, Planning $planning)
    {
        $request->validate([
            'semaine_num' => 'required|integer|min:1|max:50',
            'mh_prevue'   => 'required|numeric|min:0',
        ]);

        $semaines = self::getSemainesAnnee();
        $semaineInfo = collect($semaines)->firstWhere('num', $request->semaine_num);

        PlanningSemaine::updateOrCreate(
            [
                'planning_id' => $planning->id,
                'semaine_num' => $request->semaine_num,
            ],
            [
                'semestre'  => $semaineInfo['semestre'] ?? 1,
                'mh_prevue' => $request->mh_prevue,
            ]
        );

        // Recalculer mh_realisee global (= somme toutes semaines)
        $totalPrevu = PlanningSemaine::where('planning_id', $planning->id)->sum('mh_prevue');
        $planning->update(['mh_realisee' => $totalPrevu]);

        return response()->json([
            'ok'          => true,
            'total_prevu' => $totalPrevu,
            'mh_restante' => max(0, $planning->mh_drif - $totalPrevu),
        ]);
    }

    // ────────────────────────────────────────────────────────────
    // POST /api/plannings/{id}/auto-distribuer
    // Répartir automatiquement les MH sur les semaines du semestre
    // Body: { charge_hebdo: 3 }
    // ────────────────────────────────────────────────────────────
    public function autoDistribuerRoute(Request $request, Planning $planning)
    {
        $request->validate([
            'charge_hebdo' => 'required|numeric|min:0.5',
        ]);

        $this->autoDistribuer($planning, (float)$request->charge_hebdo);

        $planning->load('semaines');
        $totalPrevu = $planning->semaines->sum('mh_prevue');

        return response()->json([
            'ok'          => true,
            'total_prevu' => $totalPrevu,
            'mh_restante' => max(0, $planning->mh_drif - $totalPrevu),
            'semaines'    => $planning->semaines->pluck('mh_prevue', 'semaine_num'),
        ]);
    }

    // ────────────────────────────────────────────────────────────
    // DELETE /api/plannings/{id}
    // ────────────────────────────────────────────────────────────
    public function destroy(Planning $planning)
    {
        $planning->delete(); // cascade supprime les semaines
        return response()->json(['message' => 'Supprimé avec succès']);
    }

    // ────────────────────────────────────────────────────────────
    // PRIVATE — Auto-distribuer les MH sur les semaines
    // ────────────────────────────────────────────────────────────
    private function autoDistribuer(Planning $planning, float $chargeHebdo): void
    {
        $semestres    = self::getSemainesAnnee();
        $semestreCode = $planning->semestre; // 'S1' ou 'S2'
        $semestreNum  = $semestreCode === 'S2' ? 2 : 1;

        $semainesDuSemestre = collect($semestres)
            ->where('semestre', $semestreNum)
            ->values();

        $mhRestante = (float)$planning->mh_drif;
        $rows = [];

        foreach ($semainesDuSemestre as $sem) {
            if ($mhRestante <= 0) break;

            $mh = min($chargeHebdo, $mhRestante);
            $rows[] = [
                'planning_id' => $planning->id,
                'semaine_num' => $sem['num'],
                'semestre'    => $semestreNum,
                'mh_prevue'   => $mh,
                'created_at'  => now(),
                'updated_at'  => now(),
            ];
            $mhRestante -= $mh;
        }

        // Supprimer les anciennes et réinsérer
        PlanningSemaine::where('planning_id', $planning->id)->delete();
        if (!empty($rows)) {
            PlanningSemaine::insert($rows);
        }

        // Update charge_hebdo + mh_realisee
        $totalPrevu = collect($rows)->sum('mh_prevue');
        $planning->update([
            'charge_hebdo' => $chargeHebdo,
            'mh_realisee'  => $totalPrevu,
        ]);
    }

    private function getAnneeCourante(): int
    {
        $now = Carbon::now();
        return $now->month >= 9 ? $now->year : $now->year - 1;
    }

public function update(Request $request, $id)
{
    $planning = Planning::with('semaines')->findOrFail($id);

    $oldSemestre = $planning->semestre;
    $newSemestre = $request->semestre;

    // update planning
    $planning->update([
        'formateur_id' => $request->formateur_id,
        'semestre'     => $newSemestre,
        'mh_drif'      => $request->mh_drif,
        'charge_hebdo' => $request->charge_hebdo ?? 0,
    ]);

    if ($oldSemestre !== $newSemestre) {

        // ⚠️ step 1: نحيدو collision (temporary shift)
        foreach ($planning->semaines as $semaine) {
            $semaine->update([
                'semaine_num' => $semaine->semaine_num + 100
            ]);
        }

        // ⚠️ step 2: نطبقو التحويل الصحيح
        foreach ($planning->fresh()->semaines as $semaine) {

            // S1 → S2
            if ($oldSemestre === 'S1' && $newSemestre === 'S2') {
                $semaine->update([
                    'semaine_num' => $semaine->semaine_num - 100 + 22,
                    'semestre'    => 2,
                ]);
            }

            // S2 → S1
            elseif ($oldSemestre === 'S2' && $newSemestre === 'S1') {
                $semaine->update([
                    'semaine_num' => $semaine->semaine_num - 100 - 22,
                    'semestre'    => 1,
                ]);
            }
        }
    }

    return response()->json([
        'planning' => $planning->fresh()->load('semaines')
    ]);
}
}