import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { downloadTablePdf } from "../../utils/UsePdf";
import { useFilters, EXAM_TYPE_OPTIONS } from "../../context/FilterContext";

function ProgressBar({ realisee, drif }) {
  if (!drif) return <span style={{ color: "var(--sl4)", fontSize: 12 }}>—</span>;
  const pct   = Math.min(120, (realisee / drif) * 100);
  const color = pct >= 100 ? "#7c3aed" : pct >= 70 ? "#10b981" : pct >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 5, background: "var(--sl2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

const EXAM_TYPE_STYLES = {
  // Codes courts (EFF, EFP…)
  EFF:              { label: "Fin de Formation",  bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  EFM:              { label: "EFM",               bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  EFP:              { label: "Passage",           bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  Qualifiante:      { label: "Qualifiante",       bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  Passage:          { label: "Passage",           bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  "1A":             { label: "1ère Année",        bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "2A":             { label: "2ème Année",        bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  Aucun:            { label: "Aucun",             bg: "var(--sl1)", color: "var(--sl4)", border: "var(--sl2)" },
  // Libellés longs (selon le fichier Excel importé)
  "Fin de Formation":   { label: "Fin de Formation",  bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  "Fin Formation":      { label: "Fin de Formation",  bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  Diplômante:           { label: "Diplômante",        bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
};

function ExamTypeBadge({ value }) {
  if (!value) return <span style={{ color: "var(--sl4)", fontSize: 12 }}>—</span>;
  const s = EXAM_TYPE_STYLES[value] || { label: value, bg: "var(--sl1)", color: "var(--sl5)", border: "var(--sl2)" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 20,
      fontSize: 10.5,
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

export default function Modules() {
  const [data, setData]           = useState([]);
  const [meta, setMeta]           = useState(null);
  const [filieres, setFilieres]   = useState([]);
  const [secteurs, setSecteurs]   = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [loading, setLoading]     = useState(true);

  // Filtre exam type partagé avec Dashboard
  const { examType, setExamType } = useFilters();

  // Filtres locaux
  const [search,    setSearch]    = useState("");
  const [filiere,   setFiliere]   = useState("");
  const [secteur,   setSecteur]   = useState("");
  const [formateur, setFormateur] = useState("");
  const [egEt,      setEgEt]      = useState("");
  const [semestre,  setSemestre]  = useState("");
  const [creneau,   setCreneau]   = useState("");
  const [regional,  setRegional]  = useState("");
  const [efm,       setEfm]       = useState("");
  const [efmValid,  setEfmValid]  = useState("");
  const [demarre,   setDemarre]   = useState("");
  const [typeForm,  setTypeForm]  = useState("");
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    // filieres-list retourne maintenant secteur_id pour le filtrage cascadé
    axios.get("/filieres-list").then(r => setFilieres(r.data)).catch(() => {});
    axios.get("/pole").then(r => setSecteurs(r.data)).catch(() => {});
    axios.get("/formateurs/all").then(r => setFormateurs(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  // Filtrer les filières selon le secteur sélectionné (cascade secteur → filière)
  const filteredFilieres = secteur
    ? filieres.filter(f => String(f.secteur_id) === String(secteur))
    : filieres;

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/modules-list", {
      params: {
        search, filiere_id: filiere, secteur_id: secteur,
        formateur_id: formateur,
        eg_et: egEt, semestre, creneau,
        is_regional: regional, seance_efm: efm,
        validation_efm: efmValid, demarre,
        type_formation: typeForm, exam_type: examType, page,
      }
    })
      .then(r => { setData(r.data.data || []); setMeta({ last_page: r.data.last_page, total: r.data.total }); })
      .catch(console.error).finally(() => setLoading(false));
  }, [search, filiere, secteur, formateur, egEt, semestre, creneau, regional, efm, efmValid, demarre, typeForm, examType, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => {
    setSearch(""); setFiliere(""); setSecteur(""); setFormateur("");
    setEgEt(""); setSemestre(""); setCreneau(""); setRegional("");
    setEfm(""); setEfmValid(""); setDemarre(""); setTypeForm(""); setExamType(""); setPage(1);
  };

  const allFilters  = [search, filiere, secteur, formateur, egEt, semestre, creneau, regional, efm, efmValid, demarre, typeForm, examType];
  const hasFilters  = allFilters.some(Boolean);
  const activeCount = allFilters.filter(Boolean).length;

  const filterSelectStyle = { height: 36 };

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Modules</div>
          <div className="pg-subtitle">{meta?.total ?? "—"} module(s) — suivi des masses horaires</div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={() => downloadTablePdf("table-modules", "Modules — ISTA Hay Salam")}>
            {Icons.download} Exporter PDF
          </button>
        </div>
      </div>

      <div className="table-card">
        {/* ── Filter panel ── */}
        <div className="filter-panel-inline">
          <div className="filter-panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--sl5)", display: "flex" }}>{Icons.filter}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sl7)" }}>Filtres</span>
              {activeCount > 0 && (
                <span style={{ background: "var(--g4)", color: "#111", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                  {activeCount}
                </span>
              )}
            </div>
            {hasFilters && (
              <button className="btn-reset" onClick={resetFilters}>
                {Icons.close} Réinitialiser
              </button>
            )}
          </div>

          {/* ── Ligne 1 : filtres principaux ── */}
          <div className="filter-row">
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
              <span className="search-icon">{Icons.search}</span>
              <input className="search-input filter-input" placeholder="Code ou intitulé..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-select filter-select" style={filterSelectStyle} value={secteur}
              onChange={e => { setSecteur(e.target.value); setFiliere(""); setPage(1); /* Réinitialiser filière */ }}>
              <option value="">Tous les secteurs</option>
              {secteurs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
            <select className="form-select filter-select" style={filterSelectStyle} value={filiere}
              onChange={e => { setFiliere(e.target.value); setPage(1); }}>
              <option value="">Toutes les filières</option>
              {filteredFilieres.map(f => <option key={f.id} value={f.id}>{f.intitule}</option>)}
            </select>
            <select className="form-select filter-select" style={filterSelectStyle} value={formateur}
              onChange={e => { setFormateur(e.target.value); setPage(1); }}>
              <option value="">Tous les formateurs</option>
              {formateurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <select className="form-select filter-select" style={{ ...filterSelectStyle, width: 110 }} value={egEt}
              onChange={e => { setEgEt(e.target.value); setPage(1); }}>
              <option value="">EG / ET</option>
              <option value="EG">EG</option>
              <option value="ET">ET</option>
            </select>
            <select className="form-select filter-select" style={{ ...filterSelectStyle, width: 120 }} value={semestre}
              onChange={e => { setSemestre(e.target.value); setPage(1); }}>
              <option value="">Semestre</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S1&S2">S1 & S2</option>
            </select>
          </div>

          {/* ── Ligne 2 ── */}
          <div className="filter-row" style={{ paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
              <select className="form-select filter-select" style={filterSelectStyle} value={creneau}
                onChange={e => { setCreneau(e.target.value); setPage(1); }}>
                <option value="">Tous créneaux</option>
                <option value="CDJ">Cours du Jour</option>
                <option value="CDS">Cours du Soir</option>
              </select>
              <select className="form-select filter-select" style={filterSelectStyle} value={regional}
                onChange={e => { setRegional(e.target.value); setPage(1); }}>
                <option value="">Rég. ou Local</option>
                <option value="1">Module Régional</option>
                <option value="0">Module Local</option>
              </select>
              <select className="form-select filter-select" style={filterSelectStyle} value={efm}
                onChange={e => { setEfm(e.target.value); setPage(1); }}>
                <option value="">Séance EFM</option>
                <option value="Oui">EFM prévu</option>
                <option value="Non">Sans EFM</option>
              </select>
              <select className="form-select filter-select" style={filterSelectStyle} value={efmValid}
                onChange={e => { setEfmValid(e.target.value); setPage(1); }}>
                <option value="">Validation EFM</option>
                <option value="Oui">EFM validé</option>
                <option value="Non">EFM non validé</option>
              </select>
              <select className="form-select filter-select" style={filterSelectStyle} value={demarre}
                onChange={e => { setDemarre(e.target.value); setPage(1); }}>
                <option value="">Tous modules</option>
                <option value="1">Module démarré</option>
                <option value="0">Non démarré</option>
              </select>
              <select className="form-select filter-select" style={filterSelectStyle} value={typeForm}
                onChange={e => { setTypeForm(e.target.value); setPage(1); }}>
                <option value="">Type formation</option>
                <option value="Diplômante">Diplômante</option>
                <option value="Qualifiante">Qualifiante</option>
              </select>
              <select className="form-select filter-select" style={{ ...filterSelectStyle, minWidth: 180 }} value={examType}
                onChange={e => { setExamType(e.target.value); setPage(1); }}>
                {EXAM_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
            <span className="results-count">{meta?.total ?? 0} résultat(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
        ) : data.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{Icons.book}</div>
            <div className="empty-title">Aucun module trouvé</div>
            <div className="empty-desc">Modifiez les filtres</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table id="table-modules" style={{ fontSize: 13, minWidth: 960 }}>
              <thead>
                <tr>
                  <th>#</th><th>Code</th><th>Intitulé</th><th>Groupe</th>
                  <th>Formateur</th><th>MH DRIF</th><th>Réalisée</th>
                  <th style={{ minWidth: 110 }}>AVC</th>
                  <th>Restante</th><th>EG/ET</th><th>Sem.</th>
                  <th>Type exam</th><th>EFM</th><th>Rég.</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m, i) => (
                  <tr key={m.id}>
                    <td style={{ color: "var(--sl4)" }}>{(page - 1) * 15 + i + 1}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>{m.code}</span>
                    </td>
                    <td style={{ maxWidth: 170 }}>
                      <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.intitule}</span>
                    </td>
                    <td><strong style={{ fontSize: 12.5 }}>{m.groupe?.nom || "—"}</strong></td>
                    <td style={{ fontSize: 12, color: m.formateur ? "var(--sl7)" : "var(--sl4)" }}>
                      {m.formateur?.nom || "—"}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{m.mh_drif}h</td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "#10b981" }}>{m.mh_realisee_globale}h</td>
                    <td><ProgressBar realisee={m.mh_realisee_globale} drif={m.mh_drif} /></td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: m.mh_restante > 0 ? "#ef4444" : "var(--sl4)" }}>
                      {m.mh_restante > 0 ? m.mh_restante + "h" : "—"}
                    </td>
                    <td><span className={`badge ${m.eg_et === "EG" ? "badge-info" : "badge-warn"}`}>{m.eg_et || "—"}</span></td>
                    <td style={{ fontSize: 12 }}>{m.semestre || "—"}</td>
                    <td><ExamTypeBadge value={m.type_formation} /></td>
                    <td>
                      {m.seance_efm === "Oui"
                        ? <span className="badge badge-red" style={{ fontSize: 10 }}>EFM</span>
                        : <span style={{ color: "var(--sl4)", fontSize: 12 }}>—</span>
                      }
                    </td>
                    <td>
                      {m.is_regional
                        ? <span className="badge badge-purple" style={{ fontSize: 10 }}>Rég.</span>
                        : <span style={{ color: "var(--sl4)", fontSize: 12 }}>Loc.</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta?.last_page > 1 && (
          <div className="pagination">
            <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "0 4px", color: "var(--sl4)" }}>…</span>}
                  <button className={`pg-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                </span>
              ))
            }
            <button className="pg-btn" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
