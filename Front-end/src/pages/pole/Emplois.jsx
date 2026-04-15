// ============================================================
// src/pages/pole/Emplois.jsx
// NOUVEAU FICHIER — Emploi du temps Pôle
// Connecté à POST /api/emplois via axios + Sanctum
// ============================================================
import { useState, useEffect } from "react";
import axios from "axios";

const SEANCES = [
  { label: "Séance 1", horaire: "08:30 → 11:00" },
  { label: "Séance 2", horaire: "11:00 → 13:30" },
  { label: "Séance 3", horaire: "13:30 → 16:00" },
  { label: "Séance 4", horaire: "16:00 → 18:30" },
];

const FORMATEUR_COLORS = [
  "#2563eb", "#7c3aed", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#9333ea", "#16a34a",
];

function getFormateurColor(name, map) {
  if (!map[name]) {
    const keys = Object.keys(map);
    map[name] = FORMATEUR_COLORS[keys.length % FORMATEUR_COLORS.length];
  }
  return map[name];
}

function SeanceCell({ seance, colorMap }) {
  if (!seance) return <td className="emploi-cell emploi-cell--empty">—</td>;
  const color = getFormateurColor(seance.formateur, colorMap);
  return (
    <td className="emploi-cell emploi-cell--filled">
      <div className="emploi-cell__module">{seance.module}</div>
      <div className="emploi-cell__formateur" style={{ color }}>{seance.formateur}</div>
      <div className="emploi-cell__salle">Salle: {seance.salle} ({seance.mode})</div>
    </td>
  );
}

export default function Emplois() {
  const [groupes, setGroupes]       = useState([]);
  const [selectedGroupe, setGroupe] = useState("");
  const [dateDebut, setDate]        = useState(new Date().toISOString().split("T")[0]);
  const [semestre, setSemestre]     = useState("");
  const [emploi, setEmploi]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [loadingGroupes, setLG]     = useState(true);
  const [error, setError]           = useState(null);
  const colorMap                    = {};

  // ── Charge la liste des groupes ──
  useEffect(() => {
    axios.get("/api/plannings")
      .then(({ data }) => {
        const list = data.data || data;
        const uniq = [...new Set(list.map(r => r.groupe).filter(Boolean))];
        setGroupes(uniq);
        if (uniq.length > 0) setGroupe(uniq[0]);
      })
      .catch(console.error)
      .finally(() => setLG(false));
  }, []);

  const handleGenerer = async () => {
    if (!selectedGroupe) return;
    setLoading(true);
    setError(null);
    setEmploi(null);
    try {
      const { data } = await axios.post("/api/emplois", {
        groupe:      selectedGroupe,
        date_debut:  dateDebut,
        semestre:    semestre || undefined,
      });
      setEmploi(data.data || data);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de la génération.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const jours = emploi ? Object.entries(emploi.jours || {}) : [];

  return (
    <div className="emplois-page">

      {/* ── Formulaire ── */}
      <div className="emplois-form-card">
        <div className="emplois-form-card__title">Créer un emploi du temps</div>
        <div className="emplois-form-card__fields">
          <div className="filter-group">
            <label className="filter-label">Groupe</label>
            {loadingGroupes ? (
              <select className="filter-select" disabled><option>Chargement…</option></select>
            ) : (
              <select className="filter-select" value={selectedGroupe} onChange={e => setGroupe(e.target.value)}>
                <option value="">Sélectionner un groupe</option>
                {groupes.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-label">Période début</label>
            <input
              type="date"
              className="filter-select"
              value={dateDebut}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Semestre</label>
            <select className="filter-select" value={semestre} onChange={e => setSemestre(e.target.value)}>
              <option value="">Automatique (depuis planning)</option>
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
              <option value="3">Semestre 3</option>
              <option value="4">Semestre 4</option>
            </select>
          </div>
        </div>

        <button className="btn btn--primary" onClick={handleGenerer} disabled={loading || !selectedGroupe}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {loading ? "Génération…" : "Générer l'emploi du temps"}
        </button>
      </div>

      {/* ── Erreur ── */}
      {error && <div className="alert alert--error">{error}</div>}

      {/* ── Grille emploi ── */}
      {emploi && (
        <div className="table-card">
          <div className="emploi-grid-wrapper">
            <div className="emploi-header">
              <div>
                <div className="emploi-header__title">
                  EMPLOI DU TEMPS OFFICIEL — {emploi.etablissement || "CF SALE I"}
                </div>
                <div className="emploi-header__subtitle">
                  Année de Formation 2025-2026 &nbsp;·&nbsp;
                  Période: à partir du {emploi.periodeDebut || dateDebut}
                </div>
              </div>
              <button
                className="btn btn--outline btn--light btn--sm"
                onClick={() => window.print()}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4, display: "inline" }}>
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimer
              </button>
            </div>

            <div className="emploi-info-bar">
              EFP: {emploi.efp || "ISTA HAY SALAM SALE"} &nbsp;|&nbsp;
              Filière: {emploi.filiere} &nbsp;|&nbsp;
              <strong>Groupe: {emploi.groupe}</strong>
            </div>

            <div className="table-scroll">
              <table className="emploi-table">
                <thead>
                  <tr>
                    <th className="emploi-th--jour">Jours</th>
                    {SEANCES.map((s, i) => (
                      <th key={i} className="text-center">
                        {s.label}<br />
                        <span className="emploi-th__horaire">{s.horaire}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jours.map(([jour, seances]) => (
                    <tr key={jour}>
                      <td className="emploi-jour">{jour}</td>
                      {(seances || [null, null, null, null]).map((s, i) => (
                        <SeanceCell key={i} seance={s} colorMap={colorMap} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="emploi-footer">
              <span>Le Directeur · Fait à Salé · Date: {emploi.periodeDebut || dateDebut}</span>
              <span>ISTA HAY SALAM SALE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}