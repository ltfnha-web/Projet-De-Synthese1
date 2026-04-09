// ============================================================
// src/pages/pole/Plannings.jsx
// NOUVEAU FICHIER — Planning Pôle
// Connecté à POST /api/plannings via axios + Sanctum
// ============================================================
import { useState, useEffect } from "react";
import axios from "axios";

// ── Helpers couleurs ──
const getPct        = (mh, rest) => Math.round(((mh - rest) / mh) * 100);
const progressColor = (pct) => pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
const restColor     = (r)   => r === 0 ? "#16a34a" : r > 30 ? "#dc2626" : "#d97706";
const typeClass     = (t)   => t === "Régionale" ? "badge--purple" : "badge--blue";
const statutClass   = (s)   => s === "En cours" ? "badge--green" : s === "En retard" ? "badge--orange" : "badge--gray";

// ── Dots semaines ──
function SemaineDots({ total, done }) {
  return (
    <div className="semaine-dots">
      {Array.from({ length: total }, (_, i) => {
        const cls = i < done - 1 ? "dot--done" : i === done - 1 ? "dot--current" : "dot--pending";
        return <div key={i} className={`semaine-dot ${cls}`}>{i + 1}</div>;
      })}
    </div>
  );
}

// ── Tabs ──
const TABS = [
  { key: "groupes",    label: "Planning par Groupes" },
  { key: "formateurs", label: "Planning par Formateurs" },
];

export default function Plannings() {
  const [tab, setTab]           = useState("groupes");
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [filters, setFilters]   = useState({ groupe: "", semestre: "" });

  // ── Stats calculées ──
  const stats = {
    groupes:  [...new Set(data.map(r => r.groupe))].length,
    mhTotal:  data.reduce((s, r) => s + (r.mh || 0), 0),
    mhRest:   data.reduce((s, r) => s + (r.mhRestant || 0), 0),
    retard:   data.filter(r => r.statut === "En retard").length,
  };

  // ── Chargement depuis l'API ──
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.groupe)   params.groupe   = filters.groupe;
      if (filters.semestre) params.semestre = filters.semestre;

      const endpoint = tab === "groupes"
        ? "/api/plannings"
        : "/api/plannings?vue=formateurs";

      const { data: res } = await axios.get(endpoint, { params });
      setData(res.data || res);
    } catch (e) {
      setError("Erreur lors du chargement des données.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab, filters.groupe, filters.semestre]);

  const filtered = data.filter(r =>
    (r.module     || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.groupe     || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.formateur  || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="planning-page">

      {/* ── Tabs ── */}
      <div className="page-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`page-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label">Groupe</label>
          <select
            className="filter-select"
            value={filters.groupe}
            onChange={e => setFilters(f => ({ ...f, groupe: e.target.value }))}
          >
            <option value="">Tous les groupes</option>
            {[...new Set(data.map(r => r.groupe))].filter(Boolean).map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Semestre</label>
          <select
            className="filter-select"
            value={filters.semestre}
            onChange={e => setFilters(f => ({ ...f, semestre: e.target.value }))}
          >
            <option value="">Tous les semestres</option>
            {[1, 2, 3, 4].map(s => (
              <option key={s} value={s}>Semestre {s}</option>
            ))}
          </select>
        </div>
        <div className="filters-bar__actions">
          <button className="btn btn--primary" onClick={fetchData}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtrer
          </button>
          <button
            className="btn btn--outline"
            onClick={() => { setFilters({ groupe: "", semestre: "" }); setSearch(""); }}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="planning-stats">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
          </div>
          <div>
            <div className="stat-card__val">{stats.groupes}</div>
            <div className="stat-card__lbl">Groupes actifs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div>
            <div className="stat-card__val">{stats.mhTotal}</div>
            <div className="stat-card__lbl">MH planifiées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div className="stat-card__val">{stats.mhRest}</div>
            <div className="stat-card__lbl">MH restantes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--red">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div className="stat-card__val">{stats.retard}</div>
            <div className="stat-card__lbl">Modules en retard</div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-card">
        <div className="table-toolbar">
          <span className="table-toolbar__title">
            {tab === "groupes" ? "Planning par Groupes" : "Planning par Formateurs"}
          </span>
          <div className="table-toolbar__right">
            <input
              className="search-input"
              placeholder="Rechercher module, groupe, formateur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && <div className="table-loading">Chargement…</div>}

        {/* Error */}
        {!loading && error && (
          <div className="alert alert--error" style={{ margin: 16 }}>{error}</div>
        )}

        {/* Vide */}
        {!loading && !error && filtered.length === 0 && (
          <div className="table-empty">Aucun résultat trouvé.</div>
        )}

        {/* Tableau Groupes */}
        {!loading && !error && filtered.length > 0 && tab === "groupes" && (
          <div className="table-scroll">
            <table className="planning-table">
              <thead>
                <tr>
                  <th>Groupe</th>
                  <th>Module</th>
                  <th>Régionale / Locale</th>
                  <th className="text-center">MH</th>
                  <th>Formateur</th>
                  <th className="text-center">MH Restant</th>
                  <th>Date début</th>
                  <th>Semaines</th>
                  <th className="text-center">Avancement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const pct = getPct(row.mh, row.mhRestant);
                  return (
                    <tr key={row.id || i}>
                      <td><span className="badge badge--blue">{row.groupe}</span></td>
                      <td className="module-name">{row.module}</td>
                      <td><span className={`badge ${typeClass(row.type)}`}>{row.type}</span></td>
                      <td className="text-center fw-500">{row.mh}</td>
                      <td>{row.formateur}</td>
                      <td className="text-center fw-500" style={{ color: restColor(row.mhRestant) }}>
                        {row.mhRestant}
                      </td>
                      <td className="text-muted">{row.dateDebut}</td>
                      <td>
                        <SemaineDots total={row.semestres || 0} done={row.semFaites || 0} />
                      </td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: progressColor(pct) }} />
                          </div>
                          <span className="progress-pct" style={{ color: progressColor(pct) }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tableau Formateurs */}
        {!loading && !error && filtered.length > 0 && tab === "formateurs" && (
          <div className="table-scroll">
            <table className="planning-table">
              <thead>
                <tr>
                  <th>Formateur</th>
                  <th>Module</th>
                  <th>Groupe</th>
                  <th className="text-center">MH Total</th>
                  <th className="text-center">MH Réalisé</th>
                  <th className="text-center">MH Restant</th>
                  <th className="text-center">Charge hebdo</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id || i}>
                    <td>
                      <div className="fw-500">{row.formateur}</div>
                      <div className="text-muted text-sm">{row.specialite}</div>
                    </td>
                    <td>{row.module}</td>
                    <td><span className="badge badge--blue">{row.groupe}</span></td>
                    <td className="text-center fw-500">{row.mhTotal || row.mh}</td>
                    <td className="text-center">{row.mhRealise}</td>
                    <td className="text-center fw-500" style={{ color: restColor(row.mhRestant) }}>
                      {row.mhRestant}
                    </td>
                    <td className="text-center">
                      {row.chargeHebdo > 0 ? `${row.chargeHebdo}h` : "—"}
                    </td>
                    <td>
                      <span className={`badge ${statutClass(row.statut)}`}>{row.statut}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span className="table-footer__count">{filtered.length} ligne{filtered.length > 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}