import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { downloadTablePdf } from "../../utils/UsePdf";

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

export default function Modules() {
  const [data, setData]         = useState([]);
  const [meta, setMeta]         = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Filtres
  const [search, setSearch]         = useState("");
  const [filiere, setFiliere]       = useState("");
  const [secteur, setSecteur]       = useState("");
  const [egEt, setEgEt]             = useState("");
  const [semestre, setSemestre]     = useState("");
  const [creneau, setCreneau]       = useState("");
  const [regional, setRegional]     = useState("");
  const [efm, setEfm]               = useState("");       // Séance EFM oui/non
  const [efmValid, setEfmValid]     = useState("");       // Validation EFM
  const [demarre, setDemarre]       = useState("");       // Module démarré ou non
  const [typeForm, setTypeForm]     = useState("");       // Diplômante/Qualifiante
  const [page, setPage]             = useState(1);

  useEffect(() => {
    axios.get("/filieres-list").then(r => setFilieres(r.data)).catch(() => {});
    axios.get("/pole").then(r => setSecteurs(r.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/modules-list", {
      params: {
        search, filiere_id: filiere, secteur_id: secteur,
        eg_et: egEt, semestre, creneau,
        is_regional: regional, seance_efm: efm,
        validation_efm: efmValid, demarre,
        type_formation: typeForm, page
      }
    })
      .then(r => { setData(r.data.data || []); setMeta({ last_page: r.data.last_page, total: r.data.total }); })
      .catch(console.error).finally(() => setLoading(false));
  }, [search, filiere, secteur, egEt, semestre, creneau, regional, efm, efmValid, demarre, typeForm, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => {
    setSearch(""); setFiliere(""); setSecteur(""); setEgEt(""); setSemestre("");
    setCreneau(""); setRegional(""); setEfm(""); setEfmValid(""); setDemarre(""); setTypeForm(""); setPage(1);
  };

  const hasFilters = search || filiere || secteur || egEt || semestre || creneau || regional || efm || efmValid || demarre || typeForm;

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
        {/* ── FILTRES ── */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--sl0)" }}>
          {/* Ligne 1 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sl4)", display: "flex", pointerEvents: "none" }}>{Icons.search}</span>
              <input className="search-input" style={{ paddingLeft: 32, width: 220 }} placeholder="Code ou intitulé..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-select" style={{ width: 175, height: 36 }} value={secteur}
              onChange={e => { setSecteur(e.target.value); setFiliere(""); setPage(1); }}>
              <option value="">Tous les secteurs</option>
              {secteurs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
            <select className="form-select" style={{ width: 195, height: 36 }} value={filiere}
              onChange={e => { setFiliere(e.target.value); setPage(1); }}>
              <option value="">Toutes les filières</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.intitule}</option>)}
            </select>
            <select className="form-select" style={{ width: 110, height: 36 }} value={egEt}
              onChange={e => { setEgEt(e.target.value); setPage(1); }}>
              <option value="">EG / ET</option>
              <option value="EG">EG</option>
              <option value="ET">ET</option>
            </select>
            <select className="form-select" style={{ width: 120, height: 36 }} value={semestre}
              onChange={e => { setSemestre(e.target.value); setPage(1); }}>
              <option value="">Semestre</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S1&S2">S1 & S2</option>
            </select>
          </div>
          {/* Ligne 2 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {/* Créneau CDJ/CDS */}
            <select className="form-select" style={{ width: 155, height: 36 }} value={creneau}
              onChange={e => { setCreneau(e.target.value); setPage(1); }}>
              <option value="">Tous créneaux</option>
              <option value="CDJ">Cours du Jour</option>
              <option value="CDS">Cours du Soir</option>
            </select>

            {/* Régional / Local */}
            <select className="form-select" style={{ width: 155, height: 36 }} value={regional}
              onChange={e => { setRegional(e.target.value); setPage(1); }}>
              <option value="">Rég. ou Local</option>
              <option value="1">Module Régional</option>
              <option value="0">Module Local</option>
            </select>

            {/* Séance EFM */}
            <select className="form-select" style={{ width: 155, height: 36 }} value={efm}
              onChange={e => { setEfm(e.target.value); setPage(1); }}>
              <option value="">Séance EFM</option>
              <option value="Oui">EFM prévu</option>
              <option value="non">Sans EFM</option>
            </select>

            {/* Validation EFM */}
            <select className="form-select" style={{ width: 160, height: 36 }} value={efmValid}
              onChange={e => { setEfmValid(e.target.value); setPage(1); }}>
              <option value="">Validation EFM</option>
              <option value="Oui">EFM validé</option>
              <option value="non">EFM non validé</option>
            </select>

            {/* Module démarré ou non */}
            <select className="form-select" style={{ width: 165, height: 36 }} value={demarre}
              onChange={e => { setDemarre(e.target.value); setPage(1); }}>
              <option value="">Tous modules</option>
              <option value="1">Module démarré</option>
              <option value="0">Module non démarré</option>
            </select>

            {/* Type formation */}
            <select className="form-select" style={{ width: 160, height: 36 }} value={typeForm}
              onChange={e => { setTypeForm(e.target.value); setPage(1); }}>
              <option value="">Type formation</option>
              <option value="Diplômante">Diplômante</option>
              <option value="Qualifiante">Qualifiante</option>
            </select>

            {hasFilters && (
              <button className="btn-secondary" style={{ fontSize: 12, height: 36 }} onClick={resetFilters}>
                {Icons.close} Réinitialiser
              </button>
            )}
            <span className="results-count" style={{ marginLeft: "auto" }}>{meta?.total ?? 0} résultat(s)</span>
          </div>
        </div>

        {loading ? <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
        : data.length === 0 ? (
          <div className="empty"><div className="empty-icon">{Icons.book}</div><div className="empty-title">Aucun module trouvé</div><div className="empty-desc">Modifiez les filtres</div></div>
        ) : (
          <table id="table-modules" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>#</th><th>Code</th><th>Intitulé</th><th>Groupe</th>
                <th>Formateur</th><th>MH DRIF</th><th>Réalisée</th>
                <th style={{ minWidth: 110 }}>Progression</th>
                <th>Restante</th><th>EG/ET</th><th>Sem.</th>
                <th>EFM</th><th>Rég.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={m.id}>
                  <td style={{ color: "var(--sl4)" }}>{(page - 1) * 15 + i + 1}</td>
                  <td><span className="badge badge-info" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>{m.code}</span></td>
                  <td style={{ maxWidth: 170 }}>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13 }}>{m.intitule}</span>
                  </td>
                  <td><strong style={{ fontSize: 12.5 }}>{m.groupe?.nom || "—"}</strong></td>
                  <td style={{ fontSize: 12, color: m.formateur ? "var(--sl7)" : "var(--sl4)" }}>{m.formateur?.nom || "—"}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{m.mh_drif}h</td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "#10b981" }}>{m.mh_realisee_globale}h</td>
                  <td><ProgressBar realisee={m.mh_realisee_globale} drif={m.mh_drif} /></td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: m.mh_restante > 0 ? "#ef4444" : "var(--sl4)" }}>
                    {m.mh_restante > 0 ? m.mh_restante + "h" : "—"}
                  </td>
                  <td><span className={`badge ${m.eg_et === "EG" ? "badge-info" : "badge-warn"}`}>{m.eg_et || "—"}</span></td>
                  <td style={{ fontSize: 12 }}>{m.semestre || "—"}</td>
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