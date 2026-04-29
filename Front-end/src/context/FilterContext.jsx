import { createContext, useContext, useState } from "react";

const FilterContext = createContext(null);

export const EXAM_TYPE_OPTIONS = [
  { value: "",                 label: "Tous types d'examen" },
  { value: "Fin de Formation", label: "Fin de Formation"    },
  { value: "Passage",          label: "Passage"              },
  { value: "Qualifiante",      label: "Qualifiante"          },
  { value: "Diplômante",       label: "Diplômante"           },
];

// Synonym map: DB may store EFF / "Fin Formation" — normalise to the canonical value
const SYNONYMS = {
  EFF:              "Fin de Formation",
  "Fin Formation":  "Fin de Formation",
  EFP:              "Passage",
  Qualifiante:      "Qualifiante",
  Diplômante:       "Diplômante",
  Diplomante:       "Diplômante",
};

export function normaliseExamType(raw) {
  if (!raw) return "";
  return SYNONYMS[raw] ?? SYNONYMS[raw.trim()] ?? raw;
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
