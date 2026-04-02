import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { downloadTablePdf } from "../../utils/UsePdf";

function ProgressBar({ realisee, drif }) {
  if (!drif) return <span style={{ color: "var(--text-light)", fontSize: 12 }}>—</span>;
  const pct   = Math.min(120, (realisee / drif) * 100);
  const color = pct >= 100 ? "#8b5cf6" : pct >= 70 ? "#10b981" : pct >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 5, background: "var(--slate-200)", borderRadius: 3, overflow: "hidden" }}>
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
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filiere, setFiliere]   = useState("");
  const [egEt, setEgEt]         = useState("");
  const [semestre, setSemestre] = useState("");
  const [page, setPage]         = useState(1);

  useEffect(() => { axios.get("/filieres-list").then(r => setFilieres(r.data)).catch(() => {}); }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/modules-list", { params: { search, filiere_id: filiere, eg_et: egEt, semestre, page } })
      .then(r => { setData(r.data.data || []); setMeta({ last_page: r.data.last_page, total: r.data.total }); })
      .catch(console.error).finally(() => setLoading(false));
  }, [search, filiere, egEt, semestre, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Modules</div>
          <div className="pg-subtitle">{meta?.total ?? "—"} module(s) — avec suivi de la masse horaire</div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={() => downloadTablePdf("table-modules", "Modules — ISTA Hay Salam")}>
            {Icons.download} Exporter PDF
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="toolbar-filters">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)", display: "flex", pointerEvents: "none" }}>{Icons.search}</span>
              <input className="search-input" style={{ paddingLeft: 32 }} placeholder="Code ou intitulé du module..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-select" style={{ width: 195, height: 36 }} value={filiere} onChange={e => { setFiliere(e.target.value); setPage(1); }}>
              <option value="">Toutes les filières</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.intitule}</option>)}
            </select>
            <select className="form-select" style={{ width: 110, height: 36 }} value={egEt} onChange={e => { setEgEt(e.target.value); setPage(1); }}>
              <option value="">EG / ET</option>
              <option value="EG">EG</option>
              <option value="ET">ET</option>
            </select>
            <select className="form-select" style={{ width: 120, height: 36 }} value={semestre} onChange={e => { setSemestre(e.target.value); setPage(1); }}>
              <option value="">Semestre</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S1&S2">S1 & S2</option>
            </select>
          </div>
          <span className="results-count">{meta?.total ?? 0} résultat(s)</span>
        </div>

        {loading ? <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
        : data.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{Icons.book}</div>
            <div className="empty-title">Aucun module trouvé</div>
            <div className="empty-desc">Modifiez les filtres ou importez le fichier Excel BASE PLATE</div>
          </div>
        ) : (
          <table id="table-modules">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th style={{ width: 80 }}>Code</th>
                <th>Intitulé</th>
                <th>Groupe</th>
                <th>Formateur</th>
                <th>MH DRIF</th>
                <th>Réalisée</th>
                <th style={{ minWidth: 120 }}>Progression</th>
                <th>Restante</th>
                <th style={{ width: 60 }}>Type</th>
                <th style={{ width: 70 }}>Sem.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={m.id}>
                  <td style={{ color: "var(--text-light)" }}>{(page - 1) * 15 + i + 1}</td>
                  <td>
                    <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>{m.code}</span>
                  </td>
                  <td style={{ maxWidth: 180, fontSize: 13 }}>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.intitule}</span>
                  </td>
                  <td><strong style={{ fontSize: 12.5 }}>{m.groupe?.nom || "—"}</strong></td>
                  <td style={{ fontSize: 12, color: m.formateur ? "var(--slate-700)" : "var(--text-light)" }}>
                    {m.formateur?.nom || "Non assigné"}
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{m.mh_drif}h</td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--emerald-600)" }}>{m.mh_realisee_globale}h</td>
                  <td><ProgressBar realisee={m.mh_realisee_globale} drif={m.mh_drif} /></td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: m.mh_restante > 0 ? "var(--red-500)" : "var(--text-light)" }}>
                    {m.mh_restante}h
                  </td>
                  <td><span className={`badge ${m.eg_et === "EG" ? "badge-info" : "badge-warn"}`}>{m.eg_et || "—"}</span></td>
                  <td style={{ fontSize: 12 }}>{m.semestre || "—"}</td>
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
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "0 4px", color: "var(--text-light)" }}>…</span>}
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