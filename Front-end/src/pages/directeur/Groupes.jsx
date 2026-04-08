import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { downloadTablePdf } from "../../utils/UsePdf";

function AvcBar({ value }) {
  if (value == null) return <span style={{ color: "var(--sl4)", fontSize: 12 }}>—</span>;
  const pct   = Math.min(120, value * 100);
  const color = pct >= 100 ? "#7c3aed" : pct >= 70 ? "#10b981" : pct >= 50 ? "#0ea5e9" : pct >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
      <div style={{ flex: 1, height: 5, background: "var(--sl2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 38, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function Groupes() {
  const [data, setData]         = useState([]);
  const [meta, setMeta]         = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Filtres
  const [search, setSearch]         = useState("");
  const [filiere, setFiliere]       = useState("");
  const [secteur, setSecteur]       = useState("");
  const [annee, setAnnee]           = useState("");
  const [mode, setMode]             = useState("");
  const [creneau, setCreneau]       = useState("");
  const [statutGrp, setStatutGrp]   = useState("");
  const [avcMin, setAvcMin]         = useState("");
  const [page, setPage]             = useState(1);

  useEffect(() => {
    axios.get("/filieres-list").then(r => setFilieres(r.data)).catch(() => {});
    axios.get("/pole").then(r => setSecteurs(r.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/groupes", {
      params: { search, filiere_id: filiere, secteur_id: secteur, annee_formation: annee, mode, creneau, statut: statutGrp, avc_max: avcMin, page }
    })
      .then(r => { setData(r.data.data || []); setMeta({ last_page: r.data.last_page, total: r.data.total }); })
      .catch(console.error).finally(() => setLoading(false));
  }, [search, filiere, secteur, annee, mode, creneau, statutGrp, avcMin, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetFilters = () => {
    setSearch(""); setFiliere(""); setSecteur(""); setAnnee("");
    setMode(""); setCreneau(""); setStatutGrp(""); setAvcMin(""); setPage(1);
  };

  const hasFilters = search || filiere || secteur || annee || mode || creneau || statutGrp || avcMin;

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
        {/* ── FILTRES ── */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--sl0)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>

          {/* Recherche */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sl4)", display: "flex", pointerEvents: "none" }}>{Icons.search}</span>
            <input className="search-input" style={{ paddingLeft: 32, width: 200 }} placeholder="Rechercher un groupe..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          {/* Secteur */}
          <select className="form-select" style={{ width: 185, height: 36 }} value={secteur}
            onChange={e => { setSecteur(e.target.value); setFiliere(""); setPage(1); }}>
            <option value="">Tous les secteurs</option>
            {secteurs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>

          {/* Filière */}
          <select className="form-select" style={{ width: 195, height: 36 }} value={filiere}
            onChange={e => { setFiliere(e.target.value); setPage(1); }}>
            <option value="">Toutes les filières</option>
            {filieres.map(f => <option key={f.id} value={f.id}>{f.intitule}</option>)}
          </select>

          {/* Année */}
          <select className="form-select" style={{ width: 130, height: 36 }} value={annee}
            onChange={e => { setAnnee(e.target.value); setPage(1); }}>
            <option value="">Toutes années</option>
            <option value="1">Année 1</option>
            <option value="2">Année 2</option>
            <option value="3">Année 3</option>
          </select>

          {/* Mode */}
          <select className="form-select" style={{ width: 145, height: 36 }} value={mode}
            onChange={e => { setMode(e.target.value); setPage(1); }}>
            <option value="">Tous les modes</option>
            <option value="Résidentiel">Résidentiel</option>
            <option value="Alterné">Alterné</option>
          </select>

          {/* Créneau CDJ/CDS */}
          <select className="form-select" style={{ width: 155, height: 36 }} value={creneau}
            onChange={e => { setCreneau(e.target.value); setPage(1); }}>
            <option value="">Tous les créneaux</option>
            <option value="CDJ">Cours du Jour</option>
            <option value="CDS">Cours du Soir</option>
          </select>

          {/* Statut groupe */}
          <select className="form-select" style={{ width: 130, height: 36 }} value={statutGrp}
            onChange={e => { setStatutGrp(e.target.value); setPage(1); }}>
            <option value="">Tous statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>

          {/* AVC critique filtre */}
          <select className="form-select" style={{ width: 165, height: 36 }} value={avcMin}
            onChange={e => { setAvcMin(e.target.value); setPage(1); }}>
            <option value="">Tous AVC</option>
            <option value="0.3">Critiques (AVC &lt; 30%)</option>
            <option value="0.5">Faibles (AVC &lt; 50%)</option>
            <option value="0.7">Moyens (AVC &lt; 70%)</option>
          </select>

          {hasFilters && (
            <button className="btn-secondary" style={{ fontSize: 12, height: 36 }} onClick={resetFilters}>
              {Icons.close} Réinitialiser
            </button>
          )}

          <span className="results-count" style={{ marginLeft: "auto" }}>{meta?.total ?? 0} résultat(s)</span>
        </div>

        {loading ? <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
        : data.length === 0 ? (
          <div className="empty"><div className="empty-icon">{Icons.groups}</div><div className="empty-title">Aucun groupe trouvé</div><div className="empty-desc">Modifiez les filtres</div></div>
        ) : (
          <table id="table-groupes">
            <thead>
              <tr>
                <th>#</th><th>Groupe</th><th>Filière</th><th>Secteur</th>
                <th>Année</th><th>Effectif</th><th>Mode</th><th>Créneau</th>
                <th>Statut</th><th>AVC</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g, i) => (
                <tr key={g.id}>
                  <td style={{ color: "var(--sl4)" }}>{(page - 1) * 15 + i + 1}</td>
                  <td><strong style={{ color: "var(--sl8)" }}>{g.nom}</strong></td>
                  <td style={{ fontSize: 12, color: "var(--sl6)", maxWidth: 160 }}>{g.filiere?.intitule || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--sl5)" }}>{g.filiere?.secteur?.nom || "—"}</td>
                  <td><span className="badge badge-info">Année {g.annee_formation}</span></td>
                  <td><strong>{g.effectif}</strong></td>
                  <td><span className={`badge ${g.mode === "Résidentiel" ? "badge-neutral" : "badge-purple"}`}>{g.mode || "—"}</span></td>
                  <td style={{ fontSize: 12 }}>
                    {g.creneau === "CDS"
                      ? <span className="badge badge-warn">Soir</span>
                      : g.creneau === "CDJ"
                        ? <span className="badge badge-info">Jour</span>
                        : "—"
                    }
                  </td>
                  <td><span className={`badge ${g.statut === "Actif" ? "badge-ok" : "badge-off"}`}>{g.statut || "—"}</span></td>
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