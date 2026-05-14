import { createContext, useContext, useState } from "react";

const FilterContext = createContext(null);

// Labels for raw DB values stored in eg_et and type_formation columns
export const EXAM_TYPE_LABELS = {
  "EG":         "Examen Général (EG)",
  "ET":         "Examen Technique (ET)",
  "EG/ET":      "EG / ET",
  "Diplômante": "Diplômante",
  "Diplomante": "Diplômante",
  "Qualifiante":"Qualifiante",
};

// Fallback hardcoded options (used only if API returns no exam_types_list)
export const EXAM_TYPE_OPTIONS = [
  { value: "",           label: "Tous types d'examen"    },
  { value: "EG",         label: "Examen Général (EG)"    },
  { value: "ET",         label: "Examen Technique (ET)"  },
  { value: "EG/ET",      label: "EG / ET"                },
  { value: "Diplômante", label: "Diplômante"             },
  { value: "Qualifiante",label: "Qualifiante"            },
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
