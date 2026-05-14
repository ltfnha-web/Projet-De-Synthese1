import { createContext, useContext, useState } from "react";

const FilterContext = createContext(null);

// Normalise raw TYPE EXAMEN values (col BO) to readable labels
export const EXAM_TYPE_LABELS = {
  "Fin Formation":       "Fin de Formation",
  "Fin Formation(S5)":   "Fin de Formation (S5)",
  "Formation Qualifiante": "Formation Qualifiante",
  "Passage (1A)":        "Passage (1ère Année)",
  "Passage (2A)":        "Passage (2ème Année)",
};

// Fallback options shown when API returns no exam_types_list (before first import)
export const EXAM_TYPE_OPTIONS = [
  { value: "",                     label: "Tous types d'examen"       },
  { value: "Passage (1A)",         label: "Passage (1ère Année)"      },
  { value: "Passage (2A)",         label: "Passage (2ème Année)"      },
  { value: "Fin Formation",        label: "Fin de Formation"           },
  { value: "Fin Formation(S5)",    label: "Fin de Formation (S5)"      },
  { value: "Formation Qualifiante",label: "Formation Qualifiante"      },
];

// Returns a human-readable label for a raw DB value
export function normaliseExamType(raw) {
  if (!raw) return "";
  return EXAM_TYPE_LABELS[raw] ?? EXAM_TYPE_LABELS[raw.trim()] ?? raw;
}

export function FilterProvider({ children }) {
  const [examType, setExamType] = useState("");
  return (
    <FilterContext.Provider value={{ examType, setExamType }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}
