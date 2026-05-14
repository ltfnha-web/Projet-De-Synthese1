<?php

namespace App\Http\Controllers;

use App\Models\Secteur;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use Illuminate\Http\Request;
use Shuchkin\SimpleXLSX;

class ImportController extends Controller
{
    /**
     * POST /api/import/base-plate
     * Upload du fichier BASE_PLATE Excel — remplit toutes les tables
     *
     * Colonnes utilisées:
     * [3]  Secteur
     * [4]  Code Filière
     * [5]  filière
     * [7]  Créneau
     * [8]  Groupe
     * [9]  Effectif Groupe
     * [11] Statut Sous-Groupe
     * [14] Année de formation
     * [15] Mode
     * [16] Code Module
     * [17] Module
     * [19] Mle Affecté Présentiel Actif
     * [20] Formateur Affecté Présentiel Actif
     * [21] Mle Affecté Syn Actif
     * [22] Formateur Affecté Syn Actif
     * [40] MH Réalisée Globale
     * [38] MH Réalisée Présentiel
     * [39] MH Réalisée Sync
     * [46] Séance EFM
     * [47] Validation EFM
     * [48] EG/ET
     * [51] MH DRIF
     * [52] MH DRIF PRESENTIEL OK
     * [53] MH DRIF DISTANCIEL OK
     * [55] TX AVC MOD
     * [62] MH RESTANTE
     * [66] TYPE EXAMEN (colonne BO)
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,vnd.openxmlformats-officedocument.spreadsheetml.sheet|max:20480',
        ]);

        $path = $request->file('file')->getRealPath();
        $xlsx = SimpleXLSX::parse($path);

        if (!$xlsx) {
            return response()->json([
                'message' => 'Impossible de lire le fichier : ' . SimpleXLSX::parseError(),
            ], 422);
        }

        $rows = $xlsx->rows();

        if (count($rows) < 2) {
            return response()->json(['message' => 'Le fichier est vide.'], 422);
        }

        $totalRows = count($rows);

        // Auto-détection du début des données : chercher la 1ère ligne
        // où secteur[3], groupe[8] ET code module[16] sont tous non vides.
        // Cela gère les fichiers avec 1, 2 ou 3 lignes d'en-tête.
        $dataStart = null;
        foreach ($rows as $i => $r) {
            $s = trim((string)($r[3]  ?? ''));
            $g = trim((string)($r[8]  ?? ''));
            $m = trim((string)($r[16] ?? ''));
            if (!empty($s) && !empty($g) && !empty($m)) {
                $dataStart = $i;
                break;
            }
        }

        if ($dataStart === null) {
            $firstRow = array_slice(array_map('strval', $rows[0] ?? []), 0, 25);
            return response()->json([
                'message' => "Aucune donnée trouvée. Le fichier contient {$totalRows} lignes mais aucune avec secteur + groupe + code module remplis simultanément. Vérifiez que les colonnes D(secteur), I(groupe) et Q(code module) existent.",
                'debug'   => ['total_rows' => $totalRows, 'first_row_preview' => $firstRow],
            ], 422);
        }

        $rows = array_slice($rows, $dataStart);

        // ── Caches pour éviter les doublons ──
        $secteurCache  = [];
        $filiereCache  = [];
        $formateurCache= [];
        $groupeCache   = [];

        $stats = [
            'secteurs'   => 0,
            'filieres'   => 0,
            'formateurs' => 0,
            'groupes'    => 0,
            'modules'    => 0,
            'erreurs'    => [],
        ];

        foreach ($rows as $lineIdx => $row) {
            $lineNum = $lineIdx + 2;

            // ── Helper: récupérer valeur propre ──
            $v = fn(int $i) => trim((string)($row[$i] ?? ''));

            // Ignorer ligne vide
            if (empty($v(8)) && empty($v(16))) continue;

            // ════════════════════════════════
            // 1. SECTEUR
            // ════════════════════════════════
            $secteurNom = $v(3);
            if (empty($secteurNom)) {
                $stats['erreurs'][] = "Ligne {$lineNum} : secteur manquant.";
                continue;
            }
            if (!isset($secteurCache[$secteurNom])) {
                $secteur = Secteur::firstOrCreate(['nom' => $secteurNom]);
                $secteurCache[$secteurNom] = $secteur->id;
                if ($secteur->wasRecentlyCreated) $stats['secteurs']++;
            }
            $secteurId = $secteurCache[$secteurNom];

            // ════════════════════════════════
            // 2. FILIÈRE
            // ════════════════════════════════
            $filiereCode = $v(4);
            $filiereNom  = $v(5);
            if (empty($filiereCode)) {
                $stats['erreurs'][] = "Ligne {$lineNum} : code filière manquant.";
                continue;
            }
            if (!isset($filiereCache[$filiereCode])) {
                $filiere = Filiere::firstOrCreate(
                    ['code' => $filiereCode],
                    ['intitule' => $filiereNom, 'secteur_id' => $secteurId]
                );
                $filiereCache[$filiereCode] = $filiere->id;
                if ($filiere->wasRecentlyCreated) $stats['filieres']++;
            }
            $filiereId = $filiereCache[$filiereCode];

            // ════════════════════════════════
            // 3. FORMATEURS (présentiel + sync)
            // ════════════════════════════════
            $formateurId = null;

            $mleP = $v(19);
            $nomP = $v(20);
            if (!empty($nomP) && !empty($mleP)) {
                $key = $mleP;
                if (!isset($formateurCache[$key])) {
                    $f = Formateur::firstOrCreate(
                        ['mle' => $mleP],
                        ['nom' => $nomP, 'statut' => 'actif']
                    );
                    $formateurCache[$key] = $f->id;
                    if ($f->wasRecentlyCreated) $stats['formateurs']++;
                }
                $formateurId = $formateurCache[$key];
            }

            $mleS = $v(21);
            $nomS = $v(22);
            if (!empty($nomS) && !empty($mleS) && !isset($formateurCache[$mleS])) {
                $f2 = Formateur::firstOrCreate(
                    ['mle' => $mleS],
                    ['nom' => $nomS, 'statut' => 'actif']
                );
                $formateurCache[$mleS] = $f2->id;
                if ($f2->wasRecentlyCreated) $stats['formateurs']++;
            }

            // ════════════════════════════════
            // 4. GROUPE
            // ════════════════════════════════
            $groupeNom = $v(8);
            if (empty($groupeNom)) {
                $stats['erreurs'][] = "Ligne {$lineNum} : groupe manquant.";
                continue;
            }

            $groupeKey = $groupeNom . '_' . $filiereCode;
            if (!isset($groupeCache[$groupeKey])) {
                $effectif = is_numeric($row[9] ?? '') ? (int)$row[9] : 0;
                $groupe   = Groupe::firstOrCreate(
                    ['nom' => $groupeNom, 'filiere_id' => $filiereId],
                    [
                        'annee_formation' => $v(14),
                        'effectif'        => $effectif,
                        'statut'          => $v(11),
                        'mode'            => $v(15),
                        'creneau'         => $v(7),
                    ]
                );
                $groupeCache[$groupeKey] = $groupe->id;
                if ($groupe->wasRecentlyCreated) $stats['groupes']++;
            }
            $groupeId = $groupeCache[$groupeKey];

            // ════════════════════════════════
            // 5. MODULE
            // ════════════════════════════════
            $codeModule = $v(16);
            $nomModule  = $v(17);
            if (empty($codeModule)) {
                $stats['erreurs'][] = "Ligne {$lineNum} : code module manquant.";
                continue;
            }

            $n = fn(int $i) => is_numeric($row[$i] ?? '') ? (float)$row[$i] : 0;

            // Upsert : mettre à jour si existe déjà (même code + même groupe), sinon créer
            $module = Module::updateOrCreate(
                [
                    'code'      => $codeModule,
                    'groupe_id' => $groupeId,
                ],
                [
                    'intitule'               => $nomModule,
                    'formateur_id'           => $formateurId,
                    'type_formation'         => $v(66),
                    'mh_drif'                => $n(51),
                    'mh_drif_presentiel'     => $n(52),
                    'mh_drif_distanciel'     => $n(53),
                    'mh_realisee_presentiel' => $n(38),
                    'mh_realisee_sync'       => $n(39),
                    'mh_realisee_globale'    => $n(40),
                    'mh_restante'            => $n(62),
                    'taux_realisation'       => $n(43),
                    'tx_avc_mod'             => $n(55),
                    'eg_et'                  => $v(48),
                    'semestre'               => $v(50),
                    'validation_efm'         => $v(47),
                    'seance_efm'             => $v(46),
                ]
            );
            if ($module->wasRecentlyCreated) $stats['modules']++;
        }

        return response()->json([
            'message'  => 'Import terminé avec succès.',
            'imported' => [
                'secteurs'   => $stats['secteurs'],
                'filieres'   => $stats['filieres'],
                'formateurs' => $stats['formateurs'],
                'groupes'    => $stats['groupes'],
                'modules'    => $stats['modules'],
            ],
            'debug' => [
                'total_rows_in_file'  => $totalRows,
                'header_rows_skipped' => $dataStart,
                'data_rows_processed' => count($rows),
            ],
            'erreurs' => array_slice($stats['erreurs'], 0, 50),
        ]);
    }
}