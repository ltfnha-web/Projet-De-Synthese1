<?php

namespace App\Http\Controllers;

use App\Models\FormateurAbsence;
use App\Models\Planning;
use App\Models\PlanningSemaine;
use App\Models\Formateur;
use Illuminate\Http\Request;
use Carbon\Carbon;

class FormateurAbsenceController extends Controller
{
    /* ── Helpers ────────────────────────────────────────────────── */

    private function getWeekNums(Carbon $debut, Carbon $fin): array
    {
        $semaines = \App\Http\Controllers\PlanningController::getSemainesAnnee();
        $nums     = [];
        foreach ($semaines as $s) {
            $lundi  = Carbon::parse($s['date_lundi']);
            $samedi = $lundi->copy()->addDays(6);
            if ($lundi->lte($fin) && $samedi->gte($debut)) {
                $nums[] = $s['num'];
            }
        }
        return $nums;
    }

    private function markWeeks(int $formateurId, array $weekNums, string $statut): void
    {
        $planningIds = Planning::where('formateur_id', $formateurId)->pluck('id');
        if ($planningIds->isEmpty() || empty($weekNums)) return;

        PlanningSemaine::whereIn('planning_id', $planningIds)
            ->whereIn('semaine_num', $weekNums)
            ->update(['statut' => $statut]);
    }

    private function reapplyAll(int $formateurId): void
    {
        // Reset all absent weeks for this formateur, then re-apply all absences
        $planningIds = Planning::where('formateur_id', $formateurId)->pluck('id');
        if ($planningIds->isNotEmpty()) {
            PlanningSemaine::whereIn('planning_id', $planningIds)->update(['statut' => null]);
        }

        FormateurAbsence::where('formateur_id', $formateurId)->get()->each(function ($abs) use ($formateurId) {
            $wns = $this->getWeekNums(Carbon::parse($abs->date_debut), Carbon::parse($abs->date_fin));
            $this->markWeeks($formateurId, $wns, 'absent');
        });
    }

    /* ── INDEX ──────────────────────────────────────────────────── */

    public function index(Request $request)
    {
        $query = FormateurAbsence::with('formateur')
            ->when($request->filled('formateur_id'), fn($q) => $q->where('formateur_id', $request->formateur_id))
            ->orderByDesc('date_debut');

        return response()->json($query->get()->map(fn($a) => [
            'id'           => $a->id,
            'formateur_id' => $a->formateur_id,
            'formateur'    => $a->formateur?->nom ?? '—',
            'date_debut'   => $a->date_debut->format('Y-m-d'),
            'date_fin'     => $a->date_fin->format('Y-m-d'),
            'cause'        => $a->cause,
            'nb_heures'    => $a->nb_heures,
            'nb_semaines'  => $a->nb_semaines,
        ]));
    }

    /* ── STORE ──────────────────────────────────────────────────── */

    public function store(Request $request)
    {
        $data = $request->validate([
            'formateur_id' => 'required|exists:formateurs,id',
            'date_debut'   => 'required|date',
            'date_fin'     => 'required|date|after_or_equal:date_debut',
            'cause'        => 'nullable|string|max:255',
            'nb_heures'    => 'nullable|numeric|min:0',
        ]);

        $weekNums    = $this->getWeekNums(Carbon::parse($data['date_debut']), Carbon::parse($data['date_fin']));
        $planningIds = Planning::where('formateur_id', $data['formateur_id'])->pluck('id');

        // Auto-calculate nb_heures: sum the formateur's planned hours for the absent weeks
        // (queried BEFORE marking as absent so we read the actual mh_prevue values)
        $nbHeures = isset($data['nb_heures']) && $data['nb_heures'] !== null
            ? (float) $data['nb_heures']
            : ($planningIds->isEmpty() || empty($weekNums) ? 0.0
                : (float) PlanningSemaine::whereIn('planning_id', $planningIds)
                    ->whereIn('semaine_num', $weekNums)
                    ->sum('mh_prevue'));

        $this->markWeeks($data['formateur_id'], $weekNums, 'absent');

        $absence = FormateurAbsence::create(array_merge($data, [
            'nb_heures' => $nbHeures,
        ]));

        return response()->json([
            'id'           => $absence->id,
            'formateur_id' => $absence->formateur_id,
            'formateur'    => $absence->formateur?->nom ?? '—',
            'date_debut'   => $absence->date_debut->format('Y-m-d'),
            'date_fin'     => $absence->date_fin->format('Y-m-d'),
            'cause'        => $absence->cause,
            'nb_heures'    => $absence->nb_heures,
            'nb_semaines'  => $absence->nb_semaines,
        ], 201);
    }

    /* ── UPDATE ─────────────────────────────────────────────────── */

    public function update(Request $request, FormateurAbsence $absence)
    {
        $data = $request->validate([
            'date_debut' => 'required|date',
            'date_fin'   => 'required|date|after_or_equal:date_debut',
            'cause'      => 'nullable|string|max:255',
            'nb_heures'  => 'nullable|numeric|min:0',
        ]);

        $formateurId = $absence->formateur_id;
        $weekNums    = $this->getWeekNums(Carbon::parse($data['date_debut']), Carbon::parse($data['date_fin']));
        $planningIds = Planning::where('formateur_id', $formateurId)->pluck('id');

        // Auto-calculate nb_heures from raw planned hours for new date range
        $data['nb_heures'] = isset($data['nb_heures']) && $data['nb_heures'] !== null
            ? (float) $data['nb_heures']
            : ($planningIds->isEmpty() || empty($weekNums) ? 0.0
                : (float) PlanningSemaine::whereIn('planning_id', $planningIds)
                    ->whereIn('semaine_num', $weekNums)
                    ->sum('mh_prevue'));

        $absence->update($data);
        $this->reapplyAll($formateurId);

        return response()->json([
            'id'           => $absence->id,
            'formateur_id' => $absence->formateur_id,
            'formateur'    => $absence->formateur?->nom ?? '—',
            'date_debut'   => $absence->date_debut->format('Y-m-d'),
            'date_fin'     => $absence->date_fin->format('Y-m-d'),
            'cause'        => $absence->cause,
            'nb_heures'    => $absence->nb_heures,
            'nb_semaines'  => $absence->nb_semaines,
        ]);
    }

    /* ── DESTROY ────────────────────────────────────────────────── */

    public function destroy(FormateurAbsence $absence)
    {
        $formateurId = $absence->formateur_id;
        $absence->delete();
        $this->reapplyAll($formateurId);
        return response()->json(['message' => 'Absence supprimée.']);
    }
}
