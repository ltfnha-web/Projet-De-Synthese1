<?php
namespace App\Http\Controllers;
use App\Models\Stage;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StageController extends Controller {

    // GET /api/stages
    public function index(Request $request) {
        $q = Stage::with(['groupe.filiere']);
        if ($request->filled('groupe_id'))  $q->where('groupe_id', $request->groupe_id);
        if ($request->filled('secteur_id')) $q->whereHas('groupe.filiere', fn($f) => $f->where('secteur_id', $request->secteur_id));
        return response()->json([
            'data' => $q->orderBy('date_debut')->get()->map(fn($s) => $this->fmt($s)),
        ]);
    }

    // POST /api/stages
    public function store(Request $request) {
        $data = $request->validate([
            'groupe_id'  => 'required|exists:groupes,id',
            'date_debut' => 'required|date',
            'date_fin'   => 'required|date|after:date_debut',
            'statut'     => 'in:planifie,en_cours,termine',
        ]);
        if (Stage::where('groupe_id', $data['groupe_id'])
                 ->where('date_debut', '<=', $data['date_fin'])
                 ->where('date_fin',   '>=', $data['date_debut'])
                 ->exists()) {
            return response()->json(['message' => 'Ce groupe a déjà un stage sur cette période.'], 422);
        }
        $stage = Stage::create($data);
        return response()->json($this->fmt($stage->load('groupe.filiere')), 201);
    }

    // PUT /api/stages/{stage}
    public function update(Request $request, Stage $stage) {
        $data = $request->validate([
            'date_debut' => 'sometimes|date',
            'date_fin'   => 'sometimes|date|after:date_debut',
            'statut'     => 'in:planifie,en_cours,termine',
        ]);
        if (isset($data['date_debut']) || isset($data['date_fin'])) {
            $debut = $data['date_debut'] ?? $stage->date_debut->format('Y-m-d');
            $fin   = $data['date_fin']   ?? $stage->date_fin->format('Y-m-d');
            if (Stage::where('groupe_id', $stage->groupe_id)->where('id', '!=', $stage->id)
                     ->where('date_debut', '<=', $fin)->where('date_fin', '>=', $debut)->exists()) {
                return response()->json(['message' => 'Conflit avec un stage existant.'], 422);
            }
        }
        $stage->update($data);
        return response()->json($this->fmt($stage->load('groupe.filiere')));
    }

    // DELETE /api/stages/{stage}
    public function destroy(Stage $stage) {
        $stage->delete();
        return response()->json(['ok' => true]);
    }

    // GET /api/stages/semaines-bloquees
    public function semainesBloquees(Request $request) {
        $q = Stage::with('groupe')
            ->whereNotNull('id'); // tous les statuts bloquent les semaines
        if ($request->filled('secteur_id'))
            $q->whereHas('groupe.filiere', fn($f) => $f->where('secteur_id', $request->secteur_id));

        $result = [];
        foreach ($q->get() as $stage) {
            $gid      = (string) $stage->groupe_id;
            $semaines = $this->calcSemaines($stage);
            $result[$gid] = array_values(array_unique(
                array_merge($result[$gid] ?? [], $semaines)
            ));
        }
        return response()->json($result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Calcule les numéros de semaines selon le MÊME système que PlanningController:
     * num = 1, 2, 3... en partant du premier lundi de septembre de l'année scolaire.
     */
    private function calcSemaines(Stage $stage): array
    {
        $dateDebut = $stage->date_debut;
        $dateFin   = $stage->date_fin;

        // Année scolaire : si avant septembre → année précédente
        $annee = $dateDebut->month >= 9 ? $dateDebut->year : $dateDebut->year - 1;

        // Premier lundi de septembre (même logique que PlanningController)
        $debutAnnee = Carbon::create($annee, 9, 1);
        while ($debutAnnee->dayOfWeek !== Carbon::MONDAY) {
            $debutAnnee->addDay();
        }

        // Lundi de la semaine de début du stage
        $stageDebut = $dateDebut->copy()->startOfWeek(Carbon::MONDAY);

        // Numéro de la première semaine (1-based, comme PlanningController)
        $firstNum = (int) $debutAnnee->diffInWeeks($stageDebut) + 1;

        // Nombre de semaines couvertes
        $stageFin   = $dateFin->copy()->startOfWeek(Carbon::MONDAY);
        $nbSemaines = (int) $stageDebut->diffInWeeks($stageFin) + 1;

        $semaines = [];
        for ($i = 0; $i < $nbSemaines; $i++) {
            $semaines[] = $firstNum + $i;
        }

        return $semaines;
    }

    private function fmt(Stage $s): array
    {
        return [
            'id'                => $s->id,
            'groupe_id'         => $s->groupe_id,
            'groupe_nom'        => $s->groupe->nom ?? '—',
            'filiere_nom'       => $s->groupe->filiere->intitule ?? '—',
            'date_debut'        => $s->date_debut->format('Y-m-d'),
            'date_fin'          => $s->date_fin->format('Y-m-d'),
            'duree_semaines'    => (int) ceil($s->date_debut->diffInDays($s->date_fin) / 7),
            'statut'            => $s->statut,
            'semaines_bloquees' => $this->calcSemaines($s),
        ];
    }
}