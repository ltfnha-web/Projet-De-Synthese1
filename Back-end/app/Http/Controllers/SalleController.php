<?php

namespace App\Http\Controllers;

use App\Models\Salle;
use App\Services\ClassroomConflictService;
use Illuminate\Http\Request;
use Shuchkin\SimpleXLSX;

class SalleController extends Controller
{
    public function __construct(private ClassroomConflictService $conflicts) {}

    /**
     * GET /api/salles
     */
    public function index()
    {
        return response()->json([
            'data' => Salle::actif()->orderBy('nom')->get(['id', 'nom', 'type', 'capacite', 'secteur']),
        ]);
    }

    /**
     * POST /api/salles
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom'      => 'required|string|max:100|unique:salles,nom',
            'secteur'  => 'nullable|string|max:100',
            'capacite' => 'nullable|integer|min:0',
            'type'     => 'nullable|string|max:50',
        ]);

        $salle = Salle::create(['actif' => true] + $data);
        return response()->json(['data' => $salle], 201);
    }

    /**
     * GET /api/salles/disponibles?jour=Lundi&numero_seance=0&semestre=S1
     */
    public function disponibles(Request $request)
    {
        $request->validate([
            'jour'      => 'required|string',
            'semestre'  => 'required|in:S1,S2',
            'emploi_id' => 'nullable|integer',
        ]);

        $salles = $this->conflicts->getAvailableSalles(
            $request->jour,
            $request->semestre,
            $request->emploi_id ? (int) $request->emploi_id : null,
        );

        return response()->json(['data' => $salles]);
    }

    /**
     * POST /api/import/salles
     * Accepts .xlsx, .xls (via SimpleXLSX) or .csv
     * Header row required: nom | secteur | capacite | type
     */
    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file|max:10240']);

        $file      = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $path      = $file->getRealPath();

        if (in_array($extension, ['xlsx', 'xls'])) {
            $rows = $this->parseXlsx($path);
        } elseif ($extension === 'csv') {
            $rows = $this->parseCsv($path);
        } else {
            return response()->json(['message' => 'Format non supporté. Utilisez .xlsx, .xls ou .csv.'], 422);
        }

        if (empty($rows)) {
            return response()->json(['message' => 'Le fichier est vide ou illisible.'], 422);
        }

        // First row = headers → normalize them
        $headers = array_map(fn($h) => strtolower(trim((string) $h)), array_shift($rows));

        // Find column indexes by normalized header name
        $col = function(array $candidates) use ($headers): int|false {
            foreach ($candidates as $name) {
                $idx = array_search($name, $headers, true);
                if ($idx !== false) return $idx;
            }
            return false;
        };

        // Excel: TYPE DE SALLE | CODE SALLE | EFP ESPACE
        $colNom     = $col(['code salle', 'code_salle', 'nom', 'salle']);
        $colType    = $col(['type de salle', 'type_de_salle', 'type']);
        $colSecteur = $col(['efp espace', 'efp_espace', 'espace', 'secteur']);

        if ($colNom === false) {
            return response()->json(['message' => 'Colonne "CODE SALLE" introuvable dans le fichier.'], 422);
        }

        $imported = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            $nom = trim((string)($row[$colNom] ?? ''));
            if (!$nom) continue;

            if (Salle::where('nom', $nom)->exists()) {
                $skipped++;
                continue;
            }

            $rawType = $colType !== false ? strtolower(trim((string)($row[$colType] ?? ''))) : '';
            // Map French type labels to short keys
            if (str_contains($rawType, 'atelier'))       $rawType = 'atelier';
            elseif (str_contains($rawType, 'spécialisée') || str_contains($rawType, 'specialisee')) $rawType = 'labo';
            elseif (str_contains($rawType, 'cours'))     $rawType = 'salle';
            elseif (!$rawType)                           $rawType = 'salle';

            Salle::create([
                'nom'     => $nom,
                'type'    => $rawType,
                'secteur' => $colSecteur !== false ? trim((string)($row[$colSecteur] ?? '')) : null,
                'actif'   => true,
            ]);
            $imported++;
        }

        return response()->json([
            'message'  => "Import terminé : {$imported} salle(s) ajoutée(s), {$skipped} ignorée(s).",
            'imported' => $imported,
            'skipped'  => $skipped,
        ]);
    }

    private function parseXlsx(string $path): array
    {
        $xlsx = SimpleXLSX::parse($path);
        if (!$xlsx) {
            return [];
        }
        return $xlsx->rows();
    }

    private function parseCsv(string $path): array
    {
        $rows = [];
        if (($handle = fopen($path, 'r')) === false) return [];
        while (($row = fgetcsv($handle, 1000, ',')) !== false) {
            $rows[] = $row;
        }
        fclose($handle);
        return $rows;
    }
}
