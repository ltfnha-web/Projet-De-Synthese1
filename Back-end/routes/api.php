<?php
// routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FormateurController;
use App\Http\Controllers\GroupeController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\PoleController;
use App\Http\Controllers\AlerteController;
use App\Http\Controllers\PlanningController;
use App\Http\Controllers\EmploiController;
use App\Http\Controllers\FormateurEmploiController;
use App\Http\Controllers\SalleController;
use App\Http\Controllers\StageController;
use App\Http\Controllers\FormateurAbsenceController;
use App\Http\Controllers\SemaineAcademiqueController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::post('/login', [AuthController::class, 'login']);

// Route publique : liste des groupes (pour l'espace stagiaire)
Route::get('/public-groupes', function () {
    $groupes = DB::table('groupes')
        ->select('groupes.id', 'groupes.nom',
            DB::raw("COALESCE(filieres.intitule, filieres.code, '') as filiere"))
        ->leftJoin('filieres', 'groupes.filiere_id', '=', 'filieres.id')
        ->orderBy('groupes.nom')
        ->get();
    return response()->json(['data' => $groupes]);
});

// Route publique : emploi du temps par groupe (pour l'espace stagiaire)
Route::get('/public-emploi', function (\Illuminate\Http\Request $request) {
    if (!$request->filled('groupe_id')) {
        return response()->json(['data' => null]);
    }
    $emploi = \App\Models\EmploiDuTemps::with('groupe')
        ->where('groupe_id', $request->groupe_id)
        ->orderByDesc('created_at')
        ->first();
    if (!$emploi) {
        return response()->json(['data' => null, 'message' => 'Aucun emploi trouvé pour ce groupe.']);
    }
    return response()->json(['data' => [
        'id'               => $emploi->id,
        'groupe'           => $emploi->groupe?->nom ?? '—',
        'semestre'         => $emploi->semestre,
        'periodeDebut'     => $emploi->periode_debut?->format('d/m/Y'),
        'formateur_parrain'=> $emploi->formateur_parrain,
        'grille'           => $emploi->grille,
    ]]);
});

// Route publique : statistiques générales pour la page d'accueil (sans authentification)
Route::get('/public-stats', function () {
    return response()->json([
        'total_secteurs'  => DB::table('secteurs')->count(),
        'total_groupes'   => DB::table('groupes')->count(),
        'total_filieres'  => DB::table('filieres')->count(),
        'total_formateurs'=> DB::table('formateurs')->count(),
        'total_modules'   => DB::table('modules')->count(),
    ]);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── Semaines académiques (read: all authenticated roles) ──
    Route::get('/semaines-academiques', [SemaineAcademiqueController::class, 'index']);

    // ── DIRECTEUR ──
    Route::middleware('role:directeur')->group(function () {
        Route::get('/stats', [UserController::class, 'stats']);

        // Semaines académiques — generation & deletion (admin only)
        Route::post('/semaines-academiques/generate',         [SemaineAcademiqueController::class, 'generate']);
        Route::delete('/semaines-academiques/{anneeScolaire}',[SemaineAcademiqueController::class, 'destroy']);

        // ⚠️  /users/options DOIT être AVANT apiResource (sinon Laravel
        //     interprète "options" comme un {user} et retourne 404)
        Route::get('/users/options',         [UserController::class, 'options']);
        Route::apiResource('users',          UserController::class);

        Route::get('/formateurs/all',            [FormateurController::class, 'all']);
        Route::get('/formateurs',                [FormateurController::class, 'index']);
        Route::post('/formateurs',               [FormateurController::class, 'store']);
        Route::put('/formateurs/{formateur}',    [FormateurController::class, 'update']);
        Route::delete('/formateurs/{formateur}', [FormateurController::class, 'destroy']);

        Route::get('/groupes',                   [GroupeController::class, 'index']);
        Route::get('/filieres-list',             [GroupeController::class, 'filieresList']);
        Route::get('/modules-list',              [ModuleController::class, 'index']);
        Route::post('/import/base-plate',        [ImportController::class, 'import']);
        Route::post('/import/salles',            [SalleController::class, 'import']);
        Route::get('/pole',                      [PoleController::class, 'index']);
        Route::get('/pole/{secteur}/groupes',    [PoleController::class, 'groupesSecteur']);
        Route::post('/pole/assign',              [PoleController::class, 'assign']);
        Route::delete('/pole/{secteur}',         [PoleController::class, 'remove']);
        Route::get('/alertes',                   [AlerteController::class, 'index']);

        Route::get('/suivi-journalier', function (\Illuminate\Http\Request $request) {
            $jours    = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            $horaires = ['08:30–11:00', '11:00–13:30', '13:30–16:00', '16:00–18:30'];

            $today        = \Carbon\Carbon::today();
            $debutSemaine = $today->copy()->startOfWeek(\Carbon\Carbon::MONDAY);
            $finSemaine   = $today->copy()->endOfWeek(\Carbon\Carbon::SUNDAY);

            // ── Detect whether today falls inside an active school-year week ──
            $semaines        = \App\Http\Controllers\PlanningController::getSemainesAnnee();
            $semainesIndexed = collect($semaines)->keyBy('num');
            $semaineCourante = collect($semaines)->first(function ($s) use ($today) {
                $lundi  = \Carbon\Carbon::parse($s['date_lundi']);
                $samedi = $lundi->copy()->addDays(6);
                return $today->between($lundi, $samedi);
            });

            $annee         = $today->month >= 9 ? $today->year : $today->year - 1;
            $anneeScolaire = $annee . '-' . ($annee + 1);

            // ── All emplois ordered newest first ──
            $allEmplois = \App\Models\EmploiDuTemps::with('groupe')
                ->orderByDesc('created_at')
                ->get();

            // ── Build the list of available week snapshots for the filter ──
            // Each entry = { num, date_lundi, label, emploi_count, created_at }
            $semaines_disponibles = $allEmplois
                ->whereNotNull('semaine_num')
                ->groupBy('semaine_num')
                ->map(function ($group, $num) use ($semainesIndexed) {
                    $semInfo = $semainesIndexed->get($num);
                    return [
                        'num'          => (int) $num,
                        'date_lundi'   => $semInfo['date_lundi'] ?? null,
                        'semestre'     => $semInfo ? ($semInfo['semestre'] === 1 ? 'S1' : 'S2') : null,
                        'emploi_count' => $group->count(),
                        'created_at'   => $group->max('created_at'),
                    ];
                })
                ->sortByDesc('num')
                ->values();

            // ── Optional week filter from query string ──
            $filterSemaineNum  = $request->filled('semaine_num') ? (int) $request->input('semaine_num') : null;
            $semaineCouranteNum = $semaineCourante ? $semaineCourante['num'] : null;

            // ── Pick the best emploi per groupe ──
            $emplois = $allEmplois
                ->groupBy('groupe_id')
                ->map(function ($group) use ($filterSemaineNum, $semaineCouranteNum) {
                    if ($filterSemaineNum !== null) {
                        // Specific week requested — use that week's emploi or nothing
                        return $group->firstWhere('semaine_num', $filterSemaineNum);
                    }
                    // Default: prefer the current school-year week, else the most recent
                    if ($semaineCouranteNum) {
                        $match = $group->firstWhere('semaine_num', $semaineCouranteNum);
                        if ($match) return $match;
                    }
                    return $group->first();
                })
                ->filter()
                ->values();

            // ── Determine which semaine is actually displayed ──
            $displayedSemaineNum = $filterSemaineNum
                ?? ($emplois->whereNotNull('semaine_num')->first()?->semaine_num);
            $displayedSemaine = $displayedSemaineNum
                ? $semainesIndexed->get($displayedSemaineNum)
                : $semaineCourante;

            // ── Index absences for the displayed week (not just today's week) ──
            if ($displayedSemaine && isset($displayedSemaine['date_lundi'])) {
                $semLundi = \Carbon\Carbon::parse($displayedSemaine['date_lundi']);
                $semDimanche = $semLundi->copy()->addDays(6);
            } else {
                $semLundi    = $debutSemaine;
                $semDimanche = $finSemaine;
            }

            $absences = \App\Models\FormateurAbsence::with('formateur')
                ->where('date_debut', '<=', $semDimanche)
                ->where('date_fin',   '>=', $semLundi)
                ->get()
                ->keyBy('formateur_id');

            // ── Index all formateurs by normalised name for fast lookup ──
            $formateurs = \App\Models\Formateur::all()->keyBy(fn($f) => mb_strtolower(trim($f->nom)));

            $result = [];
            foreach ($jours as $jour) {
                $rows = [];
                for ($si = 0; $si < 4; $si++) {
                    foreach ($emplois as $emploi) {
                        $grille = $emploi->grille;
                        if (!is_array($grille)) continue;
                        $cell = $grille[$jour][$si] ?? null;
                        if (!$cell || empty($cell['module'])) continue;

                        $mod          = $cell['module'];
                        $formateurNom = $cell['formateur'] ?? '—';
                        $formateurKey = mb_strtolower(trim($formateurNom));
                        $formateur    = $formateurs[$formateurKey] ?? null;
                        $formateurId  = $formateur?->id;
                        $absence      = $formateurId ? ($absences[$formateurId] ?? null) : null;

                        $rows[] = [
                            'horaire'      => $horaires[$si],
                            'formateur'    => $formateurNom,
                            'formateur_id' => $formateurId,
                            'groupe'       => $emploi->groupe?->nom ?? '—',
                            'salle'        => ($cell['mode'] ?? '') === 'DISTANCIEL' ? 'En ligne' : ($cell['salle'] ?? '—'),
                            'module'       => is_array($mod) ? ($mod['intitule'] ?? $mod['code'] ?? '—') : (string)$mod,
                            'mode'         => $cell['mode'] ?? 'PRESENTIEL',
                            'absent'       => $absence !== null,
                            'absence'      => $absence ? [
                                'id'         => $absence->id,
                                'date_debut' => $absence->date_debut->format('Y-m-d'),
                                'date_fin'   => $absence->date_fin->format('Y-m-d'),
                                'cause'      => $absence->cause,
                            ] : null,
                        ];
                    }
                }
                usort($rows, fn($a, $b) => $a['horaire'] !== $b['horaire']
                    ? strcmp($a['horaire'], $b['horaire'])
                    : strcmp($a['groupe'], $b['groupe']));
                $result[$jour] = $rows;
            }

            return response()->json([
                'data'                 => $result,
                'is_active'            => $semaineCourante !== null,
                'semaine'              => $displayedSemaine,
                'semaine_courante'     => $semaineCourante,
                'annee_scolaire'       => $anneeScolaire,
                'has_emplois'          => $allEmplois->isNotEmpty(),
                'semaines_disponibles' => $semaines_disponibles,
                'filter_semaine_num'   => $filterSemaineNum,
            ]);
        });
    });

    // ── SURVEILLANT ──
    Route::middleware('role:surveillant')->prefix('surveillant')->group(function () {
        Route::get('/planning',     fn() => response()->json(['page' => 'Planning']));
        Route::get('/emploi-temps', fn() => response()->json(['page' => 'Emploi du Temps']));
    });

    // ── FORMATEUR ──
    Route::middleware('role:formateur')->prefix('formateur')->group(function () {
        Route::get('/seances',         fn() => response()->json(['page' => 'Séances']));
        Route::get('/planning',        [FormateurController::class, 'planning']);
        Route::get('/emploi-du-temps', [FormateurController::class, 'emploi']);
    });

    // ── PÔLE ──
    Route::middleware('role:pole')->group(function () {

         // Stages
          Route::get('/stages/semaines-bloquees', [StageController::class, 'semainesBloquees']);
          Route::apiResource('stages', StageController::class);

        // Absences formateurs
        Route::apiResource('absences', FormateurAbsenceController::class);

        Route::put('/plannings/{planning}/semaine',              [PlanningController::class, 'updateSemaine']);
        Route::post('/plannings/{planning}/redistribuer',       [PlanningController::class, 'redistribuer']);
        Route::post('/plannings/{planning}/distribuer-restant', [PlanningController::class, 'distribuerRestant']);
        Route::post('/plannings/{planning}/auto-distribuer',    [PlanningController::class, 'autoDistribuerRoute']);

        // Emplois du temps (formateurs)
        Route::post('/formateur-emplois',        [FormateurEmploiController::class, 'store']);
        Route::get('/formateur-emplois',         [FormateurEmploiController::class, 'index']);
        Route::get('/formateur-emplois/{id}',    [FormateurEmploiController::class, 'show']);
        Route::delete('/formateur-emplois/all',  [FormateurEmploiController::class, 'destroyAll']);
        Route::delete('/formateur-emplois/{id}', [FormateurEmploiController::class, 'destroy']);

        // Emplois du temps
        Route::prefix('emplois')->group(function () {
            Route::get('/',                         [EmploiController::class, 'index']);
            Route::post('/',                        [EmploiController::class, 'store']);
            Route::post('/generate-from-plannings', [EmploiController::class, 'generateFromPlannings']);
            Route::get('/formateur/{formateurId}',  [EmploiController::class, 'formateurTimetable']);
            Route::delete('/groupe/{groupeId}',     [EmploiController::class, 'destroyByGroupe']);
            Route::get('/{id}',                     [EmploiController::class, 'show']);
            Route::put('/{id}',                     [EmploiController::class, 'update']);
            Route::delete('/{id}',                  [EmploiController::class, 'destroy']);
        });

        // Plannings
        Route::prefix('plannings')->group(function () {
            Route::get('/',                                [PlanningController::class, 'index']);
            Route::post('/',                               [PlanningController::class, 'store']);
            Route::delete('/all',                          [PlanningController::class, 'destroyAll']);
            Route::put('/{planning}',                      [PlanningController::class, 'update']);
            Route::delete('/{planning}',                   [PlanningController::class, 'destroy']);
            Route::put('/{planning}/semaine',              [PlanningController::class, 'updateSemaine']);
            Route::post('/{planning}/redistribuer',        [PlanningController::class, 'redistribuer']);
            Route::post('/{planning}/distribuer-restant',  [PlanningController::class, 'distribuerRestant']);
            Route::post('/{planning}/auto-distribuer',     [PlanningController::class, 'autoDistribuerRoute']);
        });

        // Salles — disponibles MUST come before /{id}
        Route::get('/salles/disponibles', [SalleController::class, 'disponibles']);
        Route::get('/salles',             [SalleController::class, 'index']);
        Route::post('/salles',            [SalleController::class, 'store']);

        // Groupes pour le modal planning — filtrés par le secteur du pôle connecté
        Route::get('/pole-groupes', function (\Illuminate\Http\Request $request) {
            $user      = $request->user();
            $secteurId = $user->secteur_id; // Le pôle a toujours un secteur_id

            $query = DB::table('groupes')
                ->select('groupes.id', 'groupes.nom',
                    DB::raw("COALESCE(filieres.intitule, filieres.code, '') as filiere"),
                    'filieres.secteur_id')
                ->leftJoin('filieres', 'groupes.filiere_id', '=', 'filieres.id');

            // Filtrer par secteur si l'utilisateur en a un
            if ($secteurId) {
                $query->where('filieres.secteur_id', $secteurId);
            }

            return response()->json(['data' => $query->orderBy('groupes.nom')->get()]);
        });

        // Formateurs pour le modal
        Route::get('/pole-formateurs', function () {
            $formateurs = DB::table('formateurs')
                ->select('id', 'nom')
                ->orderBy('nom')
                ->get();
            return response()->json(['data' => $formateurs]);
        });

        // Modules filtrés par groupe_id
        Route::get('/pole-modules', function (\Illuminate\Http\Request $request) {
            $query = DB::table('modules')
                ->select('id', 'intitule', 'code', 'semestre', 'mh_drif', 'formateur_id', 'eg_et');

            if ($request->filled('groupe_id')) {
                $query->where('groupe_id', $request->groupe_id);
            }

            return response()->json([
                'data' => $query->orderBy('semestre')->orderBy('intitule')->get(),
            ]);
        });

        // Modules planifiés pour un groupe + numéro de semaine donnés
        Route::get('/plannings-semaine', function (\Illuminate\Http\Request $request) {
            $groupeId   = $request->input('groupe_id');
            $semaineNum = (int) $request->input('semaine_num');

            if (!$groupeId || !$semaineNum) {
                return response()->json(['data' => []]);
            }

            $plannings = \App\Models\Planning::with(['module', 'formateur', 'semaines'])
                ->where('groupe_id', $groupeId)
                ->whereHas('semaines', fn($q) => $q->where('semaine_num', $semaineNum)->where('mh_prevue', '>', 0))
                ->get();

            $result = $plannings->map(function ($p) use ($semaineNum) {
                $semaine = $p->semaines->firstWhere('semaine_num', $semaineNum);
                $mhPrevue = (float)($semaine?->mh_prevue ?? 0);
                return [
                    'planning_id'   => $p->id,
                    'module_id'     => $p->module_id,
                    'module_nom'    => $p->module?->intitule ?? $p->module?->code ?? '—',
                    'formateur_id'  => $p->formateur_id,
                    'formateur_nom' => $p->formateur?->nom ?? '—',
                    'semestre'      => $p->semestre,
                    'mh_prevue'     => $mhPrevue,
                    'nb_seances'    => max(1, (int) ceil($mhPrevue / 2.5)),
                ];
            });

            return response()->json(['data' => $result]);
        });

        // Générer tous les emplois des formateurs depuis les emplois du temps existants
        Route::post('/generer-emplois-formateurs', function (\Illuminate\Http\Request $request) {
            $emplois    = \App\Models\EmploiDuTemps::all();
            $jours      = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            $nbSeances  = 4;

            // Regrouper les séances par formateur_id
            $parFormateur = [];
            foreach ($emplois as $emploi) {
                if (!is_array($emploi->grille)) continue;
                foreach ($jours as $jour) {
                    foreach (($emploi->grille[$jour] ?? []) as $si => $cell) {
                        if (empty($cell) || empty($cell['formateur_id'])) continue;
                        $fid = (int)$cell['formateur_id'];
                        if (!isset($parFormateur[$fid])) {
                            $parFormateur[$fid] = [];
                            foreach ($jours as $j) $parFormateur[$fid][$j] = array_fill(0, $nbSeances, null);
                        }
                        // Ne pas écraser une séance déjà placée pour ce formateur
                        if ($parFormateur[$fid][$jour][$si] === null) {
                            $parFormateur[$fid][$jour][$si] = [
                                'module'  => $cell['module']  ?? '—',
                                'groupe'  => $emploi->groupe?->nom ?? '?',
                                'salle'   => $cell['salle']   ?? '',
                                'mode'    => $cell['mode']    ?? 'PRESENTIEL',
                            ];
                        }
                    }
                }
            }

            $created = 0;
            $semestre = $request->semestre ?? 'S1';

            foreach ($parFormateur as $fid => $grille) {
                // Créer ou mettre à jour l'emploi du formateur
                \App\Models\FormateurEmploi::updateOrCreate(
                    ['formateur_id' => $fid, 'semestre' => $semestre],
                    ['grille' => $grille]
                );
                $created++;
            }

            return response()->json([
                'message' => "{$created} emploi(s) de formateur(s) générés avec succès.",
                'count'   => $created,
            ]);
        });
    });

    Route::put('/plannings/{planning}', [PlanningController::class, 'update']);
    Route::get('/emploi-temps/view', fn() => response()->json(['page' => 'Voir EDT']));

    // ── STAGIAIRE ──
    Route::middleware('role:stagiaire')->prefix('stagiaire')->group(function () {

        // Liste des groupes (pour le sélecteur)
        Route::get('/groupes', function () {
            $groupes = DB::table('groupes')
                ->select('groupes.id', 'groupes.nom',
                    DB::raw("COALESCE(filieres.intitule, filieres.code, '') as filiere"),
                    'groupes.filiere_id')
                ->leftJoin('filieres', 'groupes.filiere_id', '=', 'filieres.id')
                ->orderBy('groupes.nom')
                ->get();
            return response()->json(['data' => $groupes]);
        });

        // Emploi du temps du groupe sélectionné
        Route::get('/emploi', function (\Illuminate\Http\Request $request) {
            if (!$request->filled('groupe_id')) {
                return response()->json(['data' => null]);
            }
            $emploi = \App\Models\EmploiDuTemps::with('groupe')
                ->where('groupe_id', $request->groupe_id)
                ->orderByDesc('created_at')
                ->first();
            if (!$emploi) {
                return response()->json(['data' => null]);
            }
            return response()->json(['data' => [
                'id'               => $emploi->id,
                'groupe'           => $emploi->groupe?->nom ?? '—',
                'semestre'         => $emploi->semestre,
                'periodeDebut'     => $emploi->periode_debut?->format('d/m/Y'),
                'formateur_parrain'=> $emploi->formateur_parrain,
                'grille'           => $emploi->grille,
            ]]);
        });

        // Modules du groupe sélectionné
        Route::get('/modules', function (\Illuminate\Http\Request $request) {
            if (!$request->filled('groupe_id')) {
                return response()->json(['data' => []]);
            }
            $query = DB::table('modules')
                ->select('modules.id', 'modules.intitule', 'modules.code',
                    'modules.semestre', 'modules.mh_drif', 'modules.eg_et',
                    DB::raw("COALESCE(formateurs.nom, '') as formateur"))
                ->leftJoin('formateurs', 'modules.formateur_id', '=', 'formateurs.id')
                ->where('modules.groupe_id', $request->groupe_id);
            if ($request->filled('semestre')) {
                $query->where('modules.semestre', $request->semestre);
            }
            return response()->json([
                'data' => $query->orderBy('modules.semestre')->orderBy('modules.intitule')->get(),
            ]);
        });

        // Planning de stage du groupe sélectionné
        Route::get('/stages', function (\Illuminate\Http\Request $request) {
            if (!$request->filled('groupe_id')) {
                return response()->json(['data' => []]);
            }
            $stages = \App\Models\Stage::with(['groupe.filiere'])
                ->where('groupe_id', $request->groupe_id)
                ->orderBy('date_debut')
                ->get()
                ->map(fn($s) => [
                    'id'         => $s->id,
                    'date_debut' => $s->date_debut->format('d/m/Y'),
                    'date_fin'   => $s->date_fin->format('d/m/Y'),
                    'statut'     => $s->statut,
                    'filiere'    => $s->groupe->filiere->intitule ?? '—',
                    'duree_semaines' => (int) ceil($s->date_debut->diffInDays($s->date_fin) / 7),
                ]);
            return response()->json(['data' => $stages]);
        });
    });

});