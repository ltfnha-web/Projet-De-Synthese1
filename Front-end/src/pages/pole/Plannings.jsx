// src/pages/pole/Plannings.jsx — FINAL COMPLET
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const getPct        = (mh, rest) => (mh > 0 ? Math.round(((mh - rest) / mh) * 100) : 0);
const progressColor = (p) => p >= 80 ? "#16a34a" : p >= 50 ? "#d97706" : "#dc2626";
const restColor     = (r) => r === 0 ? "#16a34a" : r > 30 ? "#dc2626" : "#d97706";
const typeClass     = (t) => t === "Régionale" ? "badge--purple" : "badge--blue";
const statutClass   = (s) => s === "En cours" ? "badge--green" : s === "En retard" ? "badge--orange" : "badge--gray";

const setToken = () => {
  const t = localStorage.getItem("token");
  if (t) axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
};

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

function ModalCreer({ onClose, onSaved, groupes, formateurs }) {
  const [form, setForm] = useState({
    groupe_id: "", module_id: "", formateur_id: "",
    semestre: "2", type: "Régionale", mh_drif: "",
    date_debut: "", nb_semaines: "",
    jour: "", seance_numero: "", salle: "", mode: "PRESENTIEL",
  });
  const [modules, setModules]   = useState([]);
  const [loadingMod, setLM]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Quand groupe change → recharge les modules filtrés
  const handleGroupeChange = async (groupeId) => {
    set("groupe_id", groupeId);
    set("module_id", "");
    setModules([]);
    if (!groupeId) return;
    setLM(true);
    try {
      const { data } = await axios.get(`/pole-modules?groupe_id=${groupeId}`);
      setModules(data.data ?? data ?? []);
    } catch (e) {
      console.error("modules error:", e);
    } finally {
      setLM(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      setToken();
      await axios.post("/plannings", {
        ...form,
        groupe_id:     Number(form.groupe_id),
        module_id:     Number(form.module_id),
        formateur_id:  Number(form.formateur_id),
        mh_drif:       Number(form.mh_drif),
        nb_semaines:   form.nb_semaines   ? Number(form.nb_semaines)   : undefined,
        seance_numero: form.seance_numero ? Number(form.seance_numero) : undefined,
      });
      onSaved();
    } catch (e) {
      const msg = e.response?.data?.message
        || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" | ") : null)
        || e.message || "Erreur inconnue";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "7px 10px",
    border: "1px solid #e2e8f0", borderRadius: 6,
    fontSize: 13, background: "#f8faff", color: "#0f172a",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 11, color: "#64748b", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.5px",
    display: "block", marginBottom: 4,
  };
  const groupStyle = { display: "flex", flexDirection: "column", marginBottom: 0 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "white", borderRadius: 12, width: "100%", maxWidth: 660,
        maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
      }}>
        {/* Header */}
        <div style={{
          background: "#1a2744", padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderRadius: "12px 12px 0 0",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>Créer un planning</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>
              Affecter un module à un formateur pour un groupe
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.1)", border: "none", color: "white",
            width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {error && (
            <div style={{
              background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13,
            }}>{error}</div>
          )}

          {/* Ligne 1 : Groupe + Semestre + Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Groupe *</label>
              <select style={inputStyle} value={form.groupe_id} required
                onChange={e => handleGroupeChange(e.target.value)}>
                <option value="">Sélectionner</option>
                {groupes.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.code ?? g.nom} {g.filiere ? `— ${g.filiere}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Semestre *</label>
              <select style={inputStyle} value={form.semestre} required
                onChange={e => set("semestre", e.target.value)}>
                {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semestre {s}</option>)}
              </select>
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Type *</label>
              <select style={inputStyle} value={form.type} required
                onChange={e => set("type", e.target.value)}>
                <option value="Régionale">Régionale</option>
                <option value="Locale">Locale</option>
              </select>
            </div>
          </div>

          {/* Ligne 2 : Module (filtré par groupe) */}
          <div style={{ ...groupStyle, marginBottom: 14 }}>
            <label style={labelStyle}>Module * {form.groupe_id ? "" : "(choisir un groupe d'abord)"}</label>
            <select style={{
              ...inputStyle,
              opacity: !form.groupe_id ? 0.5 : 1,
              cursor: !form.groupe_id ? "not-allowed" : "pointer",
            }}
              value={form.module_id} required
              disabled={!form.groupe_id || loadingMod}
              onChange={e => set("module_id", e.target.value)}>
              <option value="">
                {loadingMod ? "Chargement…" : modules.length === 0 && form.groupe_id ? "Aucun module pour ce groupe" : "Sélectionner un module"}
              </option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>
                  {m.intitule ?? m.nom ?? m.code}
                  {m.code ? ` (${m.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Ligne 3 : Formateur */}
          <div style={{ ...groupStyle, marginBottom: 14 }}>
            <label style={labelStyle}>Formateur *</label>
            <select style={inputStyle} value={form.formateur_id} required
              onChange={e => set("formateur_id", e.target.value)}>
              <option value="">Sélectionner un formateur</option>
              {formateurs.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name ?? f.nom_complet ?? f.nom}
                  {f.specialite ? ` — ${f.specialite}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Ligne 4 : MH + Date + Nb semaines */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={groupStyle}>
              <label style={labelStyle}>MH DRIF *</label>
              <input type="number" style={inputStyle} value={form.mh_drif}
                required min="1" placeholder="ex: 90"
                onChange={e => set("mh_drif", e.target.value)} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Date début</label>
              <input type="date" style={inputStyle} value={form.date_debut}
                onChange={e => set("date_debut", e.target.value)} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Nb semaines</label>
              <input type="number" style={inputStyle} value={form.nb_semaines}
                min="1" placeholder="ex: 9"
                onChange={e => set("nb_semaines", e.target.value)} />
            </div>
          </div>

          {/* Ligne 5 : Placement EDT */}
          <div style={{
            background: "#f8faff", border: "1px solid #e2e8f0",
            borderRadius: 8, padding: "12px 14px", marginBottom: 18,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 10,
              textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Placement emploi du temps (optionnel)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div style={groupStyle}>
                <label style={labelStyle}>Jour</label>
                <select style={inputStyle} value={form.jour} onChange={e => set("jour", e.target.value)}>
                  <option value="">—</option>
                  {["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"].map(j =>
                    <option key={j} value={j}>{j}</option>
                  )}
                </select>
              </div>
              <div style={groupStyle}>
                <label style={labelStyle}>Séance</label>
                <select style={inputStyle} value={form.seance_numero}
                  onChange={e => set("seance_numero", e.target.value)}>
                  <option value="">—</option>
                  <option value="1">S1 08:30-11:00</option>
                  <option value="2">S2 11:00-13:30</option>
                  <option value="3">S3 13:30-16:00</option>
                  <option value="4">S4 16:00-18:30</option>
                </select>
              </div>
              <div style={groupStyle}>
                <label style={labelStyle}>Salle</label>
                <input type="text" style={inputStyle} value={form.salle}
                  placeholder="ex: S16" onChange={e => set("salle", e.target.value)} />
              </div>
              <div style={groupStyle}>
                <label style={labelStyle}>Mode</label>
                <select style={inputStyle} value={form.mode} onChange={e => set("mode", e.target.value)}>
                  <option value="PRESENTIEL">Présentiel</option>
                  <option value="DISTANCIEL">Distanciel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{
              padding: "8px 18px", borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: "transparent", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer",
            }}>Annuler</button>
            <button type="submit" disabled={saving} style={{
              padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: saving ? "#94a3b8" : "#1a2744", color: "white",
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {saving ? "Enregistrement…" : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { key: "groupes",    label: "Planning par Groupes" },
  { key: "formateurs", label: "Planning par Formateurs" },
];

export default function Plannings() {
  const [tab, setTab]             = useState("groupes");
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [filters, setFilters]     = useState({ groupe: "", semestre: "" });
  const [showModal, setModal]     = useState(false);
  const [groupes, setGroupes]     = useState([]);
  const [formateurs, setFormateurs] = useState([]);

  const stats = {
    groupes: [...new Set(data.map(r => r.groupe).filter(Boolean))].length,
    mhTotal: data.reduce((s, r) => s + (Number(r.mh) || 0), 0),
    mhRest:  data.reduce((s, r) => s + (Number(r.mhRestant) || 0), 0),
    retard:  data.filter(r => r.statut === "En retard").length,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setToken();
    try {
      const params = {};
      if (filters.groupe)       params.groupe   = filters.groupe;
      if (filters.semestre)     params.semestre = filters.semestre;
      if (tab === "formateurs") params.vue      = "formateurs";
      const { data: res } = await axios.get("/plannings", { params });
      const rows = res.data ?? res;
      setData(Array.isArray(rows) ? rows : []);
    } catch (e) {
      const status = e.response?.status;
      const msg    = e.response?.data?.message || e.message || "Erreur";
      if (status === 403)      setError("Accès refusé — rôle 'pole' requis.");
      else if (status === 401) setError("Session expirée — reconnectez-vous.");
      else                     setError(`Erreur ${status ?? ""}: ${msg}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tab, filters.groupe, filters.semestre]);

  const fetchFormData = async () => {
    setToken();
    try {
      const [gRes, fRes] = await Promise.allSettled([
        axios.get("/pole-groupes"),
        axios.get("/pole-formateurs"),
      ]);
      if (gRes.status === "fulfilled") {
        const d = gRes.value.data;
        setGroupes(d.data ?? d ?? []);
      }
      if (fRes.status === "fulfilled") {
        const d = fRes.value.data;
        setFormateurs(d.data ?? d ?? []);
      }
    } catch (e) {
      console.error("fetchFormData:", e);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchFormData(); }, []);

  const filtered = data.filter(r =>
    (r.module    || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.groupe    || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.formateur || "").toLowerCase().includes(search.toLowerCase())
  );

// APRÈS — utilise les groupes déjà fetchés
const groupesList = groupes.map(g => g.code).filter(Boolean);
  return (
    <div className="planning-page">

      {showModal && (
        <ModalCreer
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); fetchData(); }}
          groupes={groupes}
          formateurs={formateurs}
        />
      )}

      {/* Tabs */}
      <div className="page-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`page-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => { setTab(t.key); setData([]); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label">Groupe</label>
          <select className="filter-select" value={filters.groupe}
            onChange={e => setFilters(f => ({ ...f, groupe: e.target.value }))}>
            <option value="">Tous les groupes</option>
            {groupesList.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Semestre</label>
          <select className="filter-select" value={filters.semestre}
            onChange={e => setFilters(f => ({ ...f, semestre: e.target.value }))}>
            <option value="">Tous les semestres</option>
            {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semestre {s}</option>)}
          </select>
        </div>
        <div className="filters-bar__actions">
          <button className="btn btn--primary" onClick={fetchData}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtrer
          </button>
          <button className="btn btn--outline"
            onClick={() => { setFilters({ groupe: "", semestre: "" }); setSearch(""); }}>
            Réinitialiser
          </button>
          <button className="btn btn--primary" onClick={() => setModal(true)}
            style={{ marginLeft: "auto", background: "#059669" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouveau planning
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="planning-stats">
        {[
          { val: stats.groupes, lbl: "Groupes actifs",    color: "blue",  stroke: "#2563eb",
            icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></> },
          { val: stats.mhTotal, lbl: "MH planifiées",     color: "green", stroke: "#16a34a",
            icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
          { val: stats.mhRest,  lbl: "MH restantes",      color: "amber", stroke: "#d97706",
            icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
          { val: stats.retard,  lbl: "Modules en retard", color: "red",   stroke: "#dc2626",
            icon: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-card__icon stat-card__icon--${s.color}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.stroke} strokeWidth="2">{s.icon}</svg>
            </div>
            <div>
              <div className="stat-card__val">{s.val}</div>
              <div className="stat-card__lbl">{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <span className="table-toolbar__title">
            {tab === "groupes" ? "Planning par Groupes" : "Planning par Formateurs"}
          </span>
          <div className="table-toolbar__right">
            <input className="search-input" placeholder="Rechercher module, groupe, formateur..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading && <div className="table-loading">Chargement…</div>}
        {!loading && error && <div className="alert alert--error" style={{ margin: 16 }}>{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="table-empty" style={{ padding: "40px 20px" }}>
            <div style={{ marginBottom: 12 }}>Aucun planning trouvé.</div>
            <button className="btn btn--primary" onClick={() => setModal(true)}
              style={{ background: "#059669" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Créer le premier planning
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && tab === "groupes" && (
          <div className="table-scroll">
            <table className="planning-table">
              <thead>
                <tr>
                  <th>Groupe</th><th>Module</th><th>Régionale / Locale</th>
                  <th className="text-center">MH</th><th>Formateur</th>
                  <th className="text-center">MH Restant</th><th>Date début</th>
                  <th>Semaines</th><th className="text-center">Avancement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const pct = getPct(row.mh, row.mhRestant);
                  return (
                    <tr key={row.id ?? i}>
                      <td><span className="badge badge--blue">{row.groupe}</span></td>
                      <td className="module-name">{row.module}</td>
                      <td><span className={`badge ${typeClass(row.type)}`}>{row.type}</span></td>
                      <td className="text-center fw-500">{row.mh}</td>
                      <td>{row.formateur}</td>
                      <td className="text-center fw-500" style={{ color: restColor(row.mhRestant) }}>{row.mhRestant}</td>
                      <td className="text-muted">{row.dateDebut ?? "—"}</td>
                      <td><SemaineDots total={row.semestres ?? 0} done={row.semFaites ?? 0} /></td>
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

        {!loading && !error && filtered.length > 0 && tab === "formateurs" && (
          <div className="table-scroll">
            <table className="planning-table">
              <thead>
                <tr>
                  <th>Formateur</th><th>Module</th><th>Groupe</th>
                  <th className="text-center">MH Total</th><th className="text-center">MH Réalisé</th>
                  <th className="text-center">MH Restant</th><th className="text-center">Charge hebdo</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id ?? i}>
                    <td>
                      <div className="fw-500">{row.formateur}</div>
                      <div className="text-muted text-sm">{row.specialite}</div>
                    </td>
                    <td>{row.module}</td>
                    <td><span className="badge badge--blue">{row.groupe}</span></td>
                    <td className="text-center fw-500">{row.mhTotal ?? row.mh}</td>
                    <td className="text-center">{row.mhRealise ?? 0}</td>
                    <td className="text-center fw-500" style={{ color: restColor(row.mhRestant) }}>{row.mhRestant}</td>
                    <td className="text-center">{row.chargeHebdo > 0 ? `${row.chargeHebdo}h` : "—"}</td>
                    <td><span className={`badge ${statutClass(row.statut)}`}>{row.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span className="table-footer__count">{filtered.length} ligne{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}