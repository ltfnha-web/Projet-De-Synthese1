<?php

namespace App\Http\Controllers;

use App\Services\AcademicWeekService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SemaineAcademiqueController extends Controller
{
    public function __construct(private AcademicWeekService $svc) {}

    // ═══════════════════════════════════════════════════════════════════════
    // GET /semaines-academiques?annee=2025
    // Returns all weeks for the requested (or current) academic year.
    // Auto-generates and persists them if they don't exist yet.
    // ═══════════════════════════════════════════════════════════════════════
    public function index(Request $request): JsonResponse
    {
        $annee = (int) ($request->input('annee') ?? AcademicWeekService::currentYear());

        $models   = $this->svc->getOrGenerate($annee);
        $semaines = $this->svc->toCalendarArray($models);

        return response()->json([
            'annee_scolaire'  => AcademicWeekService::label($annee),
            'total'           => count($semaines),
            'semestres'       => [
                'S1' => collect($semaines)->where('semestre', 1)->count(),
                'S2' => collect($semaines)->where('semestre', 2)->count(),
            ],
            'semaines'        => $semaines,
            'annees_existantes' => $this->svc->listPersistedYears(),
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /semaines-academiques/generate
    // Body: { annee?: int, years?: int, force?: bool }
    //
    // Generates and persists weeks for one or more academic years.
    // Restricted to directeur role (see routes/api.php).
    // ═══════════════════════════════════════════════════════════════════════
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'annee' => 'nullable|integer|min:2000|max:2100',
            'years' => 'nullable|integer|min:1|max:10',
            'force' => 'nullable|boolean',
        ]);

        $annee = (int) ($validated['annee'] ?? AcademicWeekService::currentYear());
        $years = (int) ($validated['years'] ?? 1);
        $force = (bool) ($validated['force'] ?? false);

        $results = $this->svc->persistRange($annee, $years, $force);

        $totalInserted = array_sum($results);
        $details       = [];

        foreach ($results as $label => $count) {
            $details[] = [
                'annee_scolaire' => $label,
                'inserted'       => $count,
                'status'         => $count > 0 ? 'created' : 'already_exists',
            ];
        }

        return response()->json([
            'message'        => $totalInserted > 0
                ? "{$totalInserted} semaine(s) générée(s) avec succès."
                : "Toutes les années demandées existent déjà. Utilisez force=true pour régénérer.",
            'total_inserted' => $totalInserted,
            'details'        => $details,
        ], $totalInserted > 0 ? 201 : 200);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETE /semaines-academiques/{annee_scolaire}
    // e.g. DELETE /semaines-academiques/2025-2026
    // Removes all weeks for that academic year (directeur only).
    // ═══════════════════════════════════════════════════════════════════════
    public function destroy(string $anneeScolaire): JsonResponse
    {
        if (!preg_match('/^\d{4}-\d{4}$/', $anneeScolaire)) {
            return response()->json(['message' => 'Format invalide. Attendu: YYYY-YYYY'], 422);
        }

        [$y1, $y2] = array_map('intval', explode('-', $anneeScolaire));
        if ($y2 !== $y1 + 1) {
            return response()->json(['message' => "L'année scolaire doit être consécutive (ex: 2025-2026)."], 422);
        }

        $deleted = \App\Models\SemaineAcademique::where('annee_scolaire', $anneeScolaire)->delete();

        return response()->json([
            'message' => "{$deleted} semaine(s) supprimée(s) pour {$anneeScolaire}.",
            'deleted' => $deleted,
        ]);
    }
}
