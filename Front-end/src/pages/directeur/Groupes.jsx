import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { downloadTablePdf } from "../../utils/UsePdf";

function AvcBar({ value }) {
  if (value == null) return <span style={{ color: "var(--text-light)", fontSize: 12 }}>—</span>;
  const pct   = Math.min(120, value * 100);
  const color = pct >= 100 ? "#8b5cf6" : pct >= 70 ? "#10b981" : pct >= 50 ? "#0ea5e9" : pct >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
      <div style={{ flex: 1, height: 5, background: "var(--slate-200)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function Groupes() {
  const [data, setData]       = useState([]);
  const [meta, setMeta]       = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filiere, setFiliere] = useState("");
  const [annee, setAnnee]     = useState("");
  const [mode, setMode]       = useState("");
  const [page, setPage]       = useState(1);

  useEffect(() => { axios.get("/filieres-list").then(r => setFilieres(r.data)).catch(() => {}); }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/groupes", { params: { search, filiere_id: filiere, annee_formation: annee, mode, page } })
      .then(r => { setData(r.data.data || []); setMeta({ last_page: r.data.last_page, total: r.data.total }); })
      .catch(console.error).finally(() => setLoading(false));
  }, [search, filiere, annee, mode, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Groupes</div>
          <div className="pg-subtitle">{meta?.total ?? "—"} groupe(s) — données issues du fichier Excel</div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={() => downloadTablePdf("table-groupes", "Groupes — ISTA Hay Salam")}>
            {Icons.download} Exporter PDF
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="toolbar-filters">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)", display: "flex", pointerEvents: "none" }}>{Icons.search}</span>
              <input className="search-input" style={{ paddingLeft: 32 }} placeholder="Rechercher un groupe..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-select" style={{ width: 200, height: 36 }} value={filiere} onChange={e => { setFiliere(e.target.value); setPage(1); }}>
              <option value="">Toutes les filières</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.intitule}</option>)}
            </select>
            <select className="form-select" style={{ width: 130, height: 36 }} value={annee} onChange={e => { setAnnee(e.target.value); setPage(1); }}>
              <option value="">Toutes années</option>
              <option value="1">Année 1</option>
              <option value="2">Année 2</option>
              <option value="3">Année 3</option>
            </select>
            <select className="form-select" style={{ width: 145, height: 36 }} value={mode} onChange={e => { setMode(e.target.value); setPage(1); }}>
              <option value="">Tous les modes</option>
              <option value="Résidentiel">Résidentiel</option>
              <option value="Alterné">Alterné</option>
            </select>
          </div>
          <span className="results-count">{meta?.total ?? 0} résultat(s)</span>
        </div>

        {loading ? <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
        : data.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{Icons.groups}</div>
            <div className="empty-title">Aucun groupe trouvé</div>
            <div className="empty-desc">Importez le fichier Excel BASE PLATE</div>
          </div>
        ) : (
          <table id="table-groupes">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Groupe</th>
                <th>Filière</th>
                <th>Secteur</th>
                <th>Année</th>
                <th>Effectif</th>
                <th>Mode</th>
                <th>Créneau</th>
                <th>Statut</th>
                <th>AVC</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g, i) => (
                <tr key={g.id}>
                  <td style={{ color: "var(--text-light)" }}>{(page - 1) * 15 + i + 1}</td>
                  <td><strong style={{ color: "var(--slate-800)" }}>{g.nom}</strong></td>
                  <td style={{ fontSize: 12, maxWidth: 160, color: "var(--slate-600)" }}>{g.filiere?.intitule || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{g.filiere?.secteur?.nom || "—"}</td>
                  <td><span className="badge badge-info">Année {g.annee_formation}</span></td>
                  <td><strong>{g.effectif}</strong></td>
                  <td>
                    <span className={`badge ${g.mode === "Résidentiel" ? "badge-neutral" : "badge-purple"}`}>
                      {g.mode || "—"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{g.creneau || "—"}</td>
                  <td>
                    <span className={`badge ${g.statut === "Actif" ? "badge-ok" : "badge-off"}`}>{g.statut || "—"}</span>
                  </td>
                  <td><AvcBar value={g.avc_moyen} /></td>
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