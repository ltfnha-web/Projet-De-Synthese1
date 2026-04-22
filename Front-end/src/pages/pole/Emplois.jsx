import { useState, useEffect } from "react";
import axios from "axios";

function toStr(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if (value.intitule) return toStr(value.intitule);
    if (value.code) return toStr(value.code);
    if (value.nom) return toStr(value.nom);
    if (value.label) return toStr(value.label);
    return JSON.stringify(value);
  }
  return String(value);
}

const SEANCES = [
  { label: "Séance 1", horaire: "08:30 → 11:00" },
  { label: "Séance 2", horaire: "11:00 → 13:30" },
  { label: "Séance 3", horaire: "13:30 → 16:00" },
  { label: "Séance 4", horaire: "16:00 → 18:30" },
];
const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const COLORS = ["#1a5276","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#9333ea","#16a34a"];
const colorMap = {};
function getColor(name) {
  if (!name) return "#64748b";
  if (!colorMap[name]) colorMap[name] = COLORS[Object.keys(colorMap).length % COLORS.length];
  return colorMap[name];
}

const Ico = {
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  alert:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  print:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  cal:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  table:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>,
};

// ── Cellule affichage séance ──────────────────────────────────────────────────
function SeanceCell({ s }) {
  if (!s || !s.module) return (
    <td style={{
      padding: "10px 14px", textAlign: "center",
      color: "var(--sl3)", border: "1px solid var(--border)", fontSize: 13,
    }}>—</td>
  );
  return (
    <td style={{ padding: "10px 14px", verticalAlign: "top", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sl8)", marginBottom: 3 }}>{toStr(s.module)}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: getColor(toStr(s.formateur)), marginBottom: 2 }}>{toStr(s.formateur)}</div>
      <div style={{ fontSize: 10, color: "var(--sl4)" }}>{toStr(s.salle)}{s.salle && s.mode ? " · " : ""}{toStr(s.mode)}</div>
    </td>
  );
}

// ── Mini Planning Preview (side panel) ───────────────────────────────────────
function MiniPlanningPreview({ plannings, groupeId, semestre }) {
  const filtered = plannings.filter(
    p => String(p.groupe_id) === String(groupeId) && p.semestre === semestre
  );

  if (!groupeId) return (
    <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--sl4)", fontSize: 12 }}>
      Sélectionnez un groupe pour voir le planning de référence
    </div>
  );

  if (filtered.length === 0) return (
    <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--sl4)", fontSize: 12 }}>
      Aucun planning pour ce groupe en {semestre}
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "var(--sl0)", borderBottom: "2px solid var(--border)" }}>
            {["Module","Formateur","MH","H/sem","Avct"].map((h, i) => (
              <th key={h} style={{
                padding: "8px 10px", textAlign: i < 2 ? "left" : "center",
                fontSize: 10, fontWeight: 700, color: "var(--sl5)",
                textTransform: "uppercase", letterSpacing: ".4px",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => {
            const pct = p.mh_drif ? Math.min(100, ((p.total_prevu ?? 0) / p.mh_drif) * 100) : 0;
            const barColor = pct >= 90 ? "#7c3aed" : pct >= 60 ? "#0891b2" : pct >= 30 ? "#d97706" : "#dc2626";
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--surface)" : "var(--sl0)" }}>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ fontWeight: 600, color: "var(--sl8)", fontSize: 11 }}>{toStr(p.module_nom)}</div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, marginTop: 3, display: "inline-block",
                    background: p.semestre === "S1" ? "#eff6ff" : "#f5f3ff",
                    color: p.semestre === "S1" ? "#1d4ed8" : "#7c3aed",
                  }}>{p.semestre}</span>
                </td>
                <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--sl5)" }}>{toStr(p.formateur_nom)}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, fontSize: 12, color: "var(--sl7)" }}>{p.mh_drif}h</td>
                <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, fontSize: 11, color: "var(--p6)" }}>
                  {parseFloat(p.charge_hebdo) || (parseFloat(p.mh_drif) / 23).toFixed(1)}h
                </td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <div style={{ width: 38, height: 4, background: "var(--sl2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: barColor, minWidth: 26 }}>{pct.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


// ── Modal Emploi du Formateur ─────────────────────────────────────────────────
function ModalFormateurTimetable({ onClose, formateurs }) {
  const [formateurId, setFormateurId] = useState("");
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const generate = async () => {
    if (!formateurId) return;
    setLoading(true); setError(null); setData(null);
    try {
      const { data: res } = await axios.get(`/emplois/formateur/${formateurId}`);
      setData(res.data);
    } catch {
      setError("Erreur lors de la génération.");
    } finally { setLoading(false); }
  };

  const grille    = data?.grille ?? null;
  const hasAny    = grille && JOURS.some(j => grille[j]?.some(Boolean));
  const fmtNom    = data?.formateur?.nom ?? "";

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}
      style={{ alignItems: "flex-start", paddingTop: 32, overflowY: "auto" }}>
      <div style={{
        width: "100%", maxWidth: 900, margin: "0 auto", padding: "0 12px",
        background: "var(--surface)", borderRadius: "var(--r-xl)",
        boxShadow: "0 20px 48px rgba(26,82,118,.18)", animation: "slideUp .2s ease", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ background: "var(--p6)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Emploi du temps — Formateur</div>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginTop: 2 }}>
              Généré automatiquement depuis tous les emplois existants
            </div>
          </div>
          <button className="modal-close" onClick={onClose}
            style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "white" }}>
            {Ico.close}
          </button>
        </div>

        <div style={{ padding: "22px 26px" }}>
          {/* Formateur selector */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 20 }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Formateur</label>
              <select className="form-select" value={formateurId} onChange={e => setFormateurId(e.target.value)}>
                <option value="">Sélectionner un formateur</option>
                {formateurs.map(f => (
                  <option key={f.id} value={f.id}>{toStr(f.nom)}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" onClick={generate} disabled={!formateurId || loading}
              style={{ height: 38, whiteSpace: "nowrap" }}>
              {loading
                ? <><div className="loader-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: "white" }} /> Génération…</>
                : <>{Ico.cal} Générer</>}
            </button>
          </div>

          {error && <div className="al-alert al-alert-err" style={{ marginBottom: 16 }}>{Ico.alert} {error}</div>}

          {/* Timetable grid */}
          {grille && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sl5)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 10 }}>
                {Ico.table} Emploi du temps de {fmtNom}
              </div>
              {!hasAny ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--sl4)", fontSize: 13 }}>
                  Aucune séance trouvée pour ce formateur.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ background: "var(--p6)", color: "rgba(255,255,255,.85)", padding: "10px 14px", border: "1px solid var(--p7)", width: 90, fontSize: 11, fontWeight: 700 }}>Jour</th>
                        {SEANCES.map((s, i) => (
                          <th key={i} style={{ background: "var(--p6)", color: "rgba(255,255,255,.85)", padding: "8px 12px", textAlign: "center", border: "1px solid var(--p7)" }}>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{s.label}</div>
                            <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.65 }}>{s.horaire}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {JOURS.map((jour, ji) => (
                        <tr key={jour} style={{ background: ji % 2 === 0 ? "var(--surface)" : "var(--sl0)" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 12, color: "var(--sl7)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>{jour}</td>
                          {[0,1,2,3].map(si => {
                            const cell = grille[jour]?.[si];
                            if (!cell) return (
                              <td key={si} style={{ padding: "10px 14px", textAlign: "center", color: "var(--sl3)", border: "1px solid var(--border)", fontSize: 13 }}>—</td>
                            );
                            const isDistanciel = cell.mode === "DISTANCIEL";
                            return (
                              <td key={si} style={{ padding: "8px 12px", verticalAlign: "top", border: "1px solid var(--border)", background: isDistanciel ? "#ecfeff" : undefined }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sl8)", marginBottom: 3 }}>{cell.module}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: getColor(cell.groupe), marginBottom: 2 }}>
                                  Groupe {cell.groupe}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--sl4)", display: "flex", gap: 5, flexWrap: "wrap" }}>
                                  {cell.salle && <span>{cell.salle}</span>}
                                  <span style={{
                                    background: isDistanciel ? "#cffafe" : "var(--p0)",
                                    color: isDistanciel ? "#0891b2" : "var(--p6)",
                                    padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                                  }}>{isDistanciel ? "DIST." : "PRÉS."}</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-secondary" onClick={() => window.print()} style={{ fontSize: 12 }}>
                  {Ico.print} Imprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Créer Emploi ────────────────────────────────────────────────────────
function ModalCreerEmploi({ onClose, onSaved, groupes, plannings = [] }) {
  const [form, setForm] = useState({
    groupe_id: "", date_debut: new Date().toISOString().split("T")[0], semestre: "S1",
  });
  const [grille, setGrille] = useState(() => {
    const g = {}; JOURS.forEach(j => { g[j] = [null,null,null,null]; }); return g;
  });
  const [modules, setModules]           = useState([]);
  const [formateurs, setFormateurs]     = useState([]);
  const [availableSalles, setAvailable] = useState({});  // jour → Salle[]
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchAvailableSalles = async (jour) => {
    if (availableSalles[jour]) return;  // already loaded for this day
    try {
      const { data } = await axios.get(
        `/salles/disponibles?jour=${encodeURIComponent(jour)}&semestre=${form.semestre}`
      );
      setAvailable(prev => ({ ...prev, [jour]: data.data ?? [] }));
    } catch {
      setAvailable(prev => ({ ...prev, [jour]: [] }));
    }
  };

  const loadModules = async (groupeId, sem) => {
    if (!groupeId) return;
    try {
      const { data } = await axios.get(`/pole-modules?groupe_id=${groupeId}&semestre=${sem}`);
      setModules(data.data ?? data ?? []);
    } catch {}
  };

  const handleGroupeChange = (groupeId) => {
    set("groupe_id", groupeId);
    setModules([]);
    if (groupeId) loadModules(groupeId, form.semestre);
  };

  const handleSemestreChange = (sem) => {
    set("semestre", sem);
    if (form.groupe_id) loadModules(form.groupe_id, sem);
  };

  useEffect(() => {
    axios.get("/pole-formateurs").then(({ data }) => setFormateurs(data.data ?? data ?? [])).catch(() => {});
  }, []);

  const setCell = (jour, si, field, value) => {
    setGrille(prev => {
      const next = { ...prev };
      const row  = [...(next[jour] || [null,null,null,null])];
      if (!row[si]) row[si] = { module: "", formateur: "", salle: "", mode: "PRESENTIEL" };
      else row[si] = { ...row[si] };
      row[si][field] = value;

      if (field === "module") {
        if (value) {
          const mod = modules.find(m => toStr(m.intitule ?? m.code) === value);
          if (mod?.formateur_id) {
            const fmt = formateurs.find(f => String(f.id) === String(mod.formateur_id));
            row[si].formateur   = fmt ? toStr(fmt.nom) : "";
            row[si].formateur_id = mod.formateur_id;
          } else {
            row[si].formateur    = "";
            row[si].formateur_id = null;
          }
          row[si].module_id = mod?.id ?? null;
        } else {
          row[si] = null;
        }
      }

      if (field === "salle_id") {
        const list  = availableSalles[jour] ?? [];
        const found = list.find(s => String(s.id) === String(value));
        row[si].salle    = found ? found.nom : "";
        row[si].salle_id = found ? found.id : null;
      }

      next[jour] = row;
      return next;
    });
  };

  const clearCell = (jour, si) => {
    setGrille(prev => {
      const next = { ...prev };
      const row  = [...(next[jour] || [null,null,null,null])];
      row[si] = null; next[jour] = row; return next;
    });
  };

  const addCell = (jour, si) => {
    if (!form.groupe_id) { setError("Choisir un groupe d'abord."); return; }
    fetchAvailableSalles(jour);
    setGrille(prev => {
      const next = { ...prev };
      const row  = [...(next[jour] || [null,null,null,null])];
      row[si] = { module: "", formateur: "", salle: "", salle_id: null, mode: "PRESENTIEL" };
      next[jour] = row; return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.groupe_id) { setError("Choisir un groupe."); return; }
    setSaving(true); setError(null);
    try {
      const groupe = groupes.find(g => String(g.id) === String(form.groupe_id));
      await axios.post("/emplois", {
        groupe:     toStr(groupe?.nom ?? `Groupe ${form.groupe_id}`),
        groupe_id:  Number(form.groupe_id),
        date_debut: form.date_debut,
        semestre:   form.semestre,
        grille,
      });
      onSaved();
    } catch (e) {
      const msg = e.response?.data?.message
        || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" | ") : null)
        || "Erreur inconnue";
      setError(msg);
    } finally { setSaving(false); }
  };

  const inpSt = {
    width: "100%", padding: "5px 8px",
    border: "1.5px solid rgba(26,82,118,.14)", borderRadius: 6,
    fontSize: 11, background: "#f8fafc", color: "var(--sl9)",
    outline: "none", boxSizing: "border-box", fontFamily: "var(--font)",
  };

  const groupeSelected = groupes.find(g => String(g.id) === String(form.groupe_id));

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ alignItems: "flex-start", paddingTop: 24, paddingBottom: 24, overflowY: "auto" }}
    >
      <div style={{ display: "flex", gap: 14, width: "100%", maxWidth: 1380, alignItems: "flex-start", margin: "0 auto", padding: "0 12px" }}>

        {/* ── Grille editor ── */}
        <div style={{
          flex: "1 1 860px",
          background: "var(--surface)", borderRadius: "var(--r-xl)",
          boxShadow: "0 20px 48px rgba(26,82,118,.18), 0 0 0 1px rgba(26,82,118,.08)",
          animation: "slideUp .2s ease", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            background: "var(--p6)", padding: "16px 24px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-hd)" }}>
                Créer un emploi du temps
              </div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginTop: 2 }}>
                Remplir la grille horaire du groupe
              </div>
            </div>
            <button className="modal-close" onClick={onClose}
              style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "white" }}>
              {Ico.close}
            </button>
          </div>

          <div style={{ padding: "22px 26px" }}>
            {error && (
              <div className="al-alert al-alert-err" style={{ marginBottom: 16 }}>
                {Ico.alert} {error}
              </div>
            )}

            {/* Form fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Groupe *</label>
                <select className="form-select" value={form.groupe_id} onChange={e => handleGroupeChange(e.target.value)}>
                  <option value="">Sélectionner un groupe</option>
                  {groupes.map(g => (
                    <option key={g.id} value={g.id}>
                      {toStr(g.nom ?? `Groupe ${g.id}`)}{g.filiere ? ` — ${toStr(g.filiere)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Semestre</label>
                <select className="form-select" value={form.semestre} onChange={e => handleSemestreChange(e.target.value)}>
                  {["S1","S2"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Période début</label>
                <input type="date" className="form-input" value={form.date_debut}
                  onChange={e => set("date_debut", e.target.value)} />
              </div>
            </div>

            {/* Grid label */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: "var(--sl5)",
              textTransform: "uppercase", letterSpacing: ".6px",
              marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
            }}>
              {Ico.cal} Grille horaire — cliquer sur + pour ajouter une séance
            </div>

            {/* Grid editor */}
            <div style={{ overflowX: "auto", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680, fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{
                      background: "var(--p6)", color: "rgba(255,255,255,.85)",
                      padding: "10px 14px", textAlign: "left", width: 90,
                      border: "1px solid var(--p7)", fontSize: 11, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: ".5px",
                    }}>Jour</th>
                    {SEANCES.map((s, i) => (
                      <th key={i} style={{
                        background: "var(--p6)", color: "rgba(255,255,255,.85)",
                        padding: "8px 12px", textAlign: "center",
                        border: "1px solid var(--p7)",
                      }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{s.label}</div>
                        <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.65 }}>{s.horaire}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JOURS.map((jour, ji) => (
                    <tr key={jour} style={{ background: ji % 2 === 0 ? "var(--surface)" : "var(--sl0)" }}>
                      <td style={{
                        padding: "10px 14px", fontWeight: 700, fontSize: 12,
                        color: "var(--sl7)", border: "1px solid var(--border)", whiteSpace: "nowrap",
                      }}>{jour}</td>
                      {[0,1,2,3].map(si => {
                        const cell = grille[jour]?.[si];
                        const list = availableSalles[jour]; // available salles for this day
                        return (
                          <td key={si} style={{
                            padding: 6, verticalAlign: "top", minWidth: 160,
                            border: "1px solid var(--border)",
                          }}>
                            {cell ? (
                              <div style={{
                                borderRadius: "var(--r-sm)",
                                padding: "8px 10px", position: "relative",
                                background: "var(--p0)", border: "1px solid var(--p1)",
                              }}>
                                <button type="button" onClick={() => clearCell(jour, si)} style={{
                                  position: "absolute", top: 4, right: 4,
                                  background: "#fee2e2", border: "none", borderRadius: 4,
                                  color: "var(--rd5)", cursor: "pointer", width: 18, height: 18,
                                  fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                                }}>×</button>

                                {/* Module selector */}
                                <select style={{ ...inpSt, marginBottom: 6 }}
                                  value={cell.module}
                                  onChange={e => setCell(jour, si, "module", e.target.value)}>
                                  <option value="">Module…</option>
                                  {modules.map(m => (
                                    <option key={m.id} value={toStr(m.intitule ?? m.code)}>
                                      {toStr(m.intitule ?? m.code)}
                                    </option>
                                  ))}
                                </select>

                                {/* Formateur: auto-filled */}
                                {cell.formateur ? (
                                  <div style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "5px 8px", marginBottom: 6,
                                    background: "white", border: "1.5px solid #bbf7d0",
                                    borderRadius: 6, fontSize: 11,
                                    color: getColor(cell.formateur), fontWeight: 600,
                                  }}>
                                    <span style={{
                                      fontSize: 8, fontWeight: 800, padding: "1px 4px",
                                      borderRadius: 4, background: "#dcfce7", color: "#16a34a",
                                      flexShrink: 0,
                                    }}>AUTO</span>
                                    {cell.formateur}
                                  </div>
                                ) : (
                                  <div style={{
                                    padding: "5px 8px", marginBottom: 6,
                                    background: "#f8fafc", border: "1.5px dashed var(--border)",
                                    borderRadius: 6, fontSize: 11, color: "var(--sl4)",
                                    fontStyle: "italic",
                                  }}>
                                    Formateur (auto après module)
                                  </div>
                                )}

                                {/* Mode selector — full width */}
                                <select style={{ ...inpSt, fontSize: 10, marginBottom: 5 }}
                                  value={cell.mode}
                                  onChange={e => setCell(jour, si, "mode", e.target.value)}>
                                  <option value="PRESENTIEL">Présentiel</option>
                                  <option value="DISTANCIEL">Distanciel</option>
                                </select>

                                {/* Salle — hidden for distanciel */}
                                {cell.mode === "DISTANCIEL" ? (
                                  <div style={{
                                    padding: "5px 8px", fontSize: 10, color: "#0891b2",
                                    background: "#ecfeff", border: "1px solid #a5f3fc",
                                    borderRadius: 6, fontStyle: "italic",
                                  }}>
                                    Formation à distance — pas de salle requise
                                  </div>
                                ) : list === undefined ? (
                                  <input type="text"
                                    style={{ ...inpSt, fontSize: 10 }}
                                    placeholder="Salle…" value={cell.salle}
                                    onClick={() => fetchAvailableSalles(jour)}
                                    onChange={e => setCell(jour, si, "salle", e.target.value)} />
                                ) : (
                                  <select
                                    style={{ ...inpSt, fontSize: 10 }}
                                    value={cell.salle_id ?? ""}
                                    onChange={e => setCell(jour, si, "salle_id", e.target.value)}>
                                    <option value="">Salle…</option>
                                    {list.length === 0 && <option disabled>Aucune salle disponible</option>}
                                    {list.map(s => (
                                      <option key={s.id} value={s.id}>
                                        {s.nom}{s.capacite ? ` (${s.capacite})` : ""}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            ) : (
                              <button type="button" onClick={() => addCell(jour, si)}
                                style={{
                                  width: "100%", padding: "18px 8px",
                                  background: "transparent", border: "2px dashed var(--border)",
                                  borderRadius: "var(--r-sm)", cursor: "pointer",
                                  color: "var(--sl3)", fontSize: 20,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "all .15s",
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.borderColor = "var(--p4)";
                                  e.currentTarget.style.color = "var(--p5)";
                                  e.currentTarget.style.background = "var(--p0)";
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.borderColor = "var(--border)";
                                  e.currentTarget.style.color = "var(--sl3)";
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >+</button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ marginTop: 0, paddingTop: 16 }}>
              <button className="btn-secondary" type="button" onClick={onClose}>Annuler</button>
              <button
                className="btn-primary"
                type="button"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Enregistrement…" : <>{Ico.check} Enregistrer l'emploi du temps</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mini Planning Preview panel ── */}
        <div style={{
          flex: "0 0 340px",
          background: "var(--surface)", borderRadius: "var(--r-xl)",
          boxShadow: "0 20px 48px rgba(26,82,118,.12), 0 0 0 1px rgba(26,82,118,.06)",
          animation: "slideUp .2s ease", overflow: "hidden",
          maxHeight: "88vh", display: "flex", flexDirection: "column",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #059669, #0891b2)",
            padding: "14px 18px", flexShrink: 0,
          }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
              {Ico.table} Planning de référence
            </div>
            <div style={{ color: "rgba(255,255,255,.65)", fontSize: 11, marginTop: 3 }}>
              {groupeSelected ? toStr(groupeSelected.nom) : "Aucun groupe sélectionné"} · {form.semestre}
            </div>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <MiniPlanningPreview plannings={plannings} groupeId={form.groupe_id} semestre={form.semestre} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Page principale Emplois ───────────────────────────────────────────────────
export default function Emplois() {
  const [groupes, setGroupes]         = useState([]);
  const [emplois, setEmplois]         = useState([]);
  const [plannings, setPlannings]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setModal]           = useState(false);
  const [showFmtModal, setFmtModal]     = useState(false);
  const [formateurs, setFormateurs]     = useState([]);
  const [emploiActif, setEmploiActif]   = useState(null);
  const [alert, setAlert]               = useState(null);

  const flash = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gRes, eRes, pRes, fRes] = await Promise.allSettled([
        axios.get("/pole-groupes"),
        axios.get("/emplois"),
        axios.get("/plannings"),
        axios.get("/pole-formateurs"),
      ]);
      if (gRes.status === "fulfilled") {
        const d = gRes.value.data;
        setGroupes(Array.isArray(d) ? d : (d.data ?? []));
      }
      if (eRes.status === "fulfilled") {
        const d = eRes.value.data;
        setEmplois(Array.isArray(d) ? d : (d.data ?? []));
      }
      if (pRes.status === "fulfilled") {
        const d = pRes.value.data;
        setPlannings(d.plannings ?? (Array.isArray(d) ? d : (d.data ?? [])));
      }
      if (fRes.status === "fulfilled") {
        const d = fRes.value.data;
        setFormateurs(Array.isArray(d) ? d : (d.data ?? []));
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const afficherEmploi = async (id) => {
    try {
      const { data } = await axios.get(`/emplois/${id}`);
      setEmploiActif(data.data ?? data);
    } catch (e) { flash("Erreur de chargement.", "err"); }
  };

  const supprimerEmploi = async (id) => {
    if (!window.confirm("Supprimer cet emploi du temps ?")) return;
    try {
      await axios.delete(`/emplois/${id}`);
      flash("Emploi supprimé.");
      if (emploiActif?.id === id) setEmploiActif(null);
      fetchAll();
    } catch { flash("Erreur de suppression.", "err"); }
  };

  const jours = emploiActif ? Object.entries(emploiActif.jours ?? {}) : [];

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Emplois du temps</div>
          <div className="pg-subtitle">
            {emplois.length} emploi{emplois.length > 1 ? "s" : ""} créé{emplois.length > 1 ? "s" : ""}
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={() => setFmtModal(true)}>
            {Ico.table} Emploi formateur
          </button>
          <button className="btn-primary" onClick={() => setModal(true)}>
            {Ico.plus} Nouvel emploi du temps
          </button>
        </div>
      </div>

      {alert && (
        <div className={`al-alert al-alert-${alert.type}`}>
          {alert.type === "ok" ? Ico.check : Ico.alert} {alert.msg}
        </div>
      )}

      {showModal && (
        <ModalCreerEmploi
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); fetchAll(); flash("Emploi du temps créé."); }}
          groupes={groupes}
          plannings={plannings}
        />
      )}

      {showFmtModal && (
        <ModalFormateurTimetable
          onClose={() => setFmtModal(false)}
          formateurs={formateurs}
        />
      )}

      {loading && (
        <div className="loader"><div className="loader-spinner" /><span>Chargement…</span></div>
      )}

      {!loading && emplois.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12, marginBottom: 20,
        }}>
          {emplois.map(e => (
            <div key={e.id}
              onClick={() => afficherEmploi(e.id)}
              style={{
                background: emploiActif?.id === e.id ? "var(--p0)" : "var(--surface)",
                border: `1px solid ${emploiActif?.id === e.id ? "var(--p4)" : "var(--border)"}`,
                borderRadius: "var(--r-lg)", padding: "14px 16px", cursor: "pointer",
                transition: "all .15s", boxShadow: "var(--sh-sm)",
              }}
              onMouseOver={e => { if (emploiActif?.id !== parseInt(e.currentTarget.dataset.id)) { e.currentTarget.style.boxShadow = "var(--sh-md)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = "var(--sh-sm)"; e.currentTarget.style.transform = "none"; }}
              data-id={e.id}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--sl8)" }}>{toStr(e.groupe)}</div>
                <button
                  className="btn-icon btn-icon-del"
                  style={{ width: 24, height: 24, flexShrink: 0 }}
                  title="Supprimer"
                  onClick={ev => { ev.stopPropagation(); supprimerEmploi(e.id); }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--sl5)", marginTop: 5 }}>
                {Ico.cal} <span style={{ marginLeft: 4 }}>{toStr(e.periodeDebut ?? e.periode_debut ?? "—")}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <span className={`badge ${e.valide ? "badge-ok" : "badge-warn"}`}>
                  {e.valide ? "Validé" : "En attente"}
                </span>
                {e.semestre && (
                  <span className={`badge ${e.semestre === "S1" ? "badge-info" : "badge-purple"}`} style={{ marginLeft: 6 }}>
                    {e.semestre}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && emplois.length === 0 && !emploiActif && (
        <div className="table-card">
          <div className="empty">
            <div className="empty-icon">{Ico.cal}</div>
            <div className="empty-title">Aucun emploi du temps</div>
            <div className="empty-desc">Créez le premier emploi du temps pour commencer</div>
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setModal(true)}>
              {Ico.plus} Créer un emploi du temps
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body > * { visibility: hidden !important; }
          #offppt-print, #offppt-print * { visibility: visible !important; }
          #offppt-print {
            position: fixed; top: 0; left: 0;
            width: 100%; background: white;
            font-family: Arial, sans-serif;
          }
          .op-table { width: 100%; border-collapse: collapse; }
          .op-table th, .op-table td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
          .op-cell-content { min-height: 38px; }
        }
      `}</style>

      {emploiActif && (
        <div id="offppt-print" style={{ display: "none" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 3, fontSize: 9 }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", width: "14%", padding: "4px 6px", textAlign: "center", verticalAlign: "middle" }}>
                  <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>OFPPT</div>
                  <div style={{ direction: "rtl", fontSize: 8.5 }}>مكتب التكوين المهني</div>
                  <div style={{ direction: "rtl", fontSize: 8.5 }}>وإنعاش الشغل</div>
                  <div style={{ direction: "rtl", fontSize: 8, color: "#555" }}>المملكة المغربية</div>
                </td>
                <td style={{ border: "1px solid #000", width: "70%", textAlign: "center", verticalAlign: "middle", padding: "6px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 3, marginBottom: 4 }}>EMPLOI DU TEMPS</div>
                  <div style={{ fontSize: 11, direction: "rtl", fontFamily: "serif", color: "#333" }}>جدول التوقيت الأسبوعي</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>Année de Formation 2025-2026</div>
                </td>
                <td style={{ border: "1px solid #000", width: "16%", textAlign: "center", verticalAlign: "middle", padding: "4px 6px", fontSize: 9 }}>
                  <div style={{ fontWeight: 700, fontSize: 11 }}>DRRSK</div>
                  <div style={{ fontWeight: 700, fontSize: 10, marginTop: 2 }}>CF SALÉ I</div>
                  <div style={{ fontSize: 8.5, color: "#444" }}>ISTA HAY SALAM</div>
                  <div style={{ fontSize: 8.5, color: "#444" }}>Salé</div>
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 3, fontSize: 9 }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 7px", width: "25%" }}>
                  <span style={{ fontWeight: 700 }}>EFP : </span>ISTA HAY SALAM SALE
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 7px", width: "25%" }}>
                  <span style={{ fontWeight: 700 }}>Filière : </span>{toStr(emploiActif.filiere ?? "—")}
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 7px", width: "25%" }}>
                  <span style={{ fontWeight: 700 }}>N° Groupe : </span>{toStr(emploiActif.groupe)}
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 7px", width: "25%" }}>
                  <span style={{ fontWeight: 700 }}>Semestre : </span>{toStr(emploiActif.semestre ?? "—")}
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 7px" }} colSpan={2}>
                  <span style={{ fontWeight: 700 }}>Formateur Parrain : </span>___________________________
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 7px" }}>
                  <span style={{ fontWeight: 700 }}>Période : </span>{toStr(emploiActif.periodeDebut ?? emploiActif.periode_debut ?? "—")}
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 7px" }}>
                  <span style={{ fontWeight: 700 }}>Nbre d'heures : </span>___h/sem
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 3, fontSize: 8.5 }}>
            <tbody>
              <tr>
                {[
                  "Technicien Spécialisé","Technicien","Qualification",
                  "Spécialisation","Formation Qualifiante","Bac Pro","Parcours Collégial",
                ].map(t => (
                  <td key={t} style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>
                    <input type="checkbox" style={{ marginRight: 4 }} readOnly />{t}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <table className="op-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 8.5 }}>
            <thead>
              <tr style={{ background: "#d0d8e8" }}>
                <th style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", width: 60, fontWeight: 700 }}>Jours</th>
                {SEANCES.map((s, i) => (
                  <th key={i} style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: 700 }}>
                    <div>{s.label}</div>
                    <div style={{ fontWeight: 400, fontSize: 8 }}>{s.horaire}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(emploiActif.jours ?? {}).map(([jour, seances]) => (
                <tr key={jour}>
                  <td style={{ border: "1px solid #000", padding: "5px 8px", fontWeight: 700, textAlign: "center", fontSize: 9 }}>
                    {jour}
                  </td>
                  {(seances ?? [null,null,null,null]).map((s, i) => (
                    <td key={i} style={{ border: "1px solid #000", padding: "4px 6px", verticalAlign: "top", minWidth: 120 }}>
                      {s && s.module ? (
                        <div className="op-cell-content">
                          <div style={{ fontWeight: 700, fontSize: 8.5, marginBottom: 2, lineHeight: 1.3 }}>{toStr(s.module)}</div>
                          <div style={{ fontSize: 8, color: "#333", marginBottom: 2 }}>{toStr(s.formateur)}</div>
                          <div style={{ fontSize: 7.5, color: "#555" }}>
                            {s.mode === "DISTANCIEL" ? "Formation à distance" : "Formation en présentiel"}
                            {s.salle ? ` / S${s.salle}` : ""}
                          </div>
                        </div>
                      ) : (
                        <div style={{ minHeight: 38 }} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 3, fontSize: 9 }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "3px 8px", width: "33%", textAlign: "center" }}>
                  <div style={{ fontWeight: 700 }}>Emargements</div>
                  <div style={{ height: 28 }} />
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 8px", width: "34%", textAlign: "center" }}>
                  <div style={{ fontWeight: 700 }}>Fait à Salé, le {toStr(emploiActif.periodeDebut ?? emploiActif.periode_debut ?? "—")}</div>
                  <div style={{ height: 28 }} />
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 8px", width: "33%", textAlign: "center" }}>
                  <div style={{ fontWeight: 700 }}>Le Directeur</div>
                  <div style={{ marginTop: 20, fontSize: 8.5 }}>
                    <div>KADDOURI HICHAM</div>
                    <div>DIRECTEUR D'ETABLISSEMENT</div>
                    <div>ISTA HAY SALAM SALE</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {emploiActif && (
        <div className="table-card" style={{ padding: 0 }}>
          <div style={{
            background: "var(--p6)", padding: "14px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-hd)" }}>
                EMPLOI DU TEMPS — {toStr(emploiActif.efp ?? "ISTA HAY SALAM SALE")}
              </div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginTop: 2 }}>
                Année 2025-2026 · Période : {toStr(emploiActif.periodeDebut ?? emploiActif.periode_debut ?? "—")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ height: 32, fontSize: 12, background: "rgba(255,255,255,.12)", color: "white", border: "1px solid rgba(255,255,255,.2)" }}
                onClick={() => window.print()}>
                {Ico.print} Imprimer (OFFPPT)
              </button>
              <button className="btn-secondary" style={{ height: 32, fontSize: 12, background: "rgba(255,255,255,.12)", color: "white", border: "1px solid rgba(255,255,255,.2)" }}
                onClick={() => setEmploiActif(null)}>
                {Ico.close} Fermer
              </button>
            </div>
          </div>

          <div style={{
            background: "var(--sl0)", padding: "8px 20px",
            fontSize: 12, color: "var(--sl6)",
            borderBottom: "1px solid var(--border)",
            display: "flex", gap: 16,
          }}>
            <span>EFP : <strong>ISTA HAY SALAM SALE</strong></span>
            <span>Filière : <strong>{toStr(emploiActif.filiere ?? "—")}</strong></span>
            <span>Groupe : <strong style={{ color: "var(--p6)" }}>{toStr(emploiActif.groupe)}</strong></span>
            {emploiActif.semestre && (
              <span className={`badge ${emploiActif.semestre === "S1" ? "badge-info" : "badge-purple"}`}>
                {emploiActif.semestre}
              </span>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{
                    background: "var(--sl0)", padding: "10px 16px",
                    textAlign: "left", fontSize: 11, fontWeight: 700,
                    color: "var(--sl5)", textTransform: "uppercase", letterSpacing: ".5px",
                    border: "1px solid var(--border)", width: 100,
                  }}>Jours</th>
                  {SEANCES.map((s, i) => (
                    <th key={i} style={{
                      background: "var(--sl0)", padding: "10px 16px", textAlign: "center",
                      fontSize: 11, fontWeight: 700, color: "var(--sl5)",
                      textTransform: "uppercase", letterSpacing: ".5px",
                      border: "1px solid var(--border)",
                    }}>
                      {s.label}
                      <div style={{ fontWeight: 400, fontSize: 10, color: "var(--sl4)", marginTop: 2, textTransform: "none", letterSpacing: 0 }}>{s.horaire}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jours.map(([jour, seances], ji) => (
                  <tr key={jour} style={{ background: ji % 2 === 0 ? "var(--surface)" : "var(--sl0)" }}>
                    <td style={{
                      padding: "10px 16px", fontWeight: 700, fontSize: 12,
                      color: "var(--sl7)", border: "1px solid var(--border)", whiteSpace: "nowrap",
                    }}>{jour}</td>
                    {(seances ?? [null,null,null,null]).map((s, i) => (
                      <SeanceCell key={i} s={s} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            padding: "10px 20px", background: "var(--sl0)", borderTop: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: "var(--sl5)",
          }}>
            <span>Le Directeur · Fait à Salé · Date : {toStr(emploiActif.periodeDebut ?? emploiActif.periode_debut)}</span>
            <span>ISTA HAY SALAM SALE</span>
          </div>
        </div>
      )}
    </div>
  );
}
