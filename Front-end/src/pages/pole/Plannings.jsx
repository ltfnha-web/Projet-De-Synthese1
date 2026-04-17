import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const NB_SEM = 23;

// Helper pour afficher proprement une chaîne ou un objet
function toStr(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if (value.intitule) return toStr(value.intitule); // récursif au cas où
    if (value.code) return toStr(value.code);
    if (value.nom) return toStr(value.nom);
    if (value.label) return toStr(value.label);
    return JSON.stringify(value);
  }
  return String(value);
}

function calcCharge(mh) {
  if (!mh || mh <= 0) return "";
  return Math.ceil((parseFloat(mh) / NB_SEM) * 2) / 2;
}

const Ico = {
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  magic:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  filter:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  close:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  alert:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  info:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  edit:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  save:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  cal:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  gen:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
};

// ── Séances et jours ─────────────────────────────────────────
const SEANCES = [
  { label: "Séance 1", horaire: "08:30 → 11:00" },
  { label: "Séance 2", horaire: "11:00 → 13:30" },
  { label: "Séance 3", horaire: "13:30 → 16:00" },
  { label: "Séance 4", horaire: "16:00 → 18:30" },
];
const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

function SemBadge({ s }) {
  return <span className={`badge ${s === "S1" ? "badge-info" : "badge-purple"}`}>{s}</span>;
}

function AvcBar({ mhDrif, totalPrevu }) {
  if (!mhDrif) return <span style={{ color: "var(--sl4)", fontSize: 11 }}>—</span>;
  const pct   = Math.min(100, (totalPrevu / mhDrif) * 100);
  const color = pct >= 90 ? "#7c3aed" : pct >= 60 ? "var(--em5)" : pct >= 30 ? "var(--am5)" : "var(--rd5)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 90 }}>
      <div style={{ flex: 1, height: 4, background: "var(--sl2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width .3s" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function CellSemaine({ planningId, semaineNum, value, onSave, planSemestre, cellSemestre }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value ?? "");
  const [saving, setSaving]   = useState(false);
  const inputRef              = useRef();
  const hors = planSemestre && planSemestre !== cellSemestre;

  useEffect(() => { setVal(value ?? ""); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = async () => {
    const mh = parseFloat(val) || 0;
    if (mh === (parseFloat(value) || 0)) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await axios.put(`/plannings/${planningId}/semaine`, { semaine_num: semaineNum, mh_prevue: mh });
      onSave(planningId, semaineNum, mh, res.data.total_prevu, res.data.mh_restante);
    } catch { /* silently */ }
    setSaving(false);
    setEditing(false);
  };

  if (hors) return <td style={{ background: "var(--sl1)", borderRight: "1px solid var(--border)", width: 32, minWidth: 32 }} />;

  const bg = saving ? "rgba(26,82,118,.12)" : value > 0 ? "rgba(16,185,129,.09)" : undefined;

  return (
    <td onClick={() => setEditing(true)} style={{ padding: 0, width: 32, minWidth: 32, borderRight: "1px solid var(--border)", background: bg, cursor: "pointer", transition: "background .12s" }}>
      {editing ? (
        <input ref={inputRef} type="number" min="0" max="20" step="0.5" value={val}
          onChange={e => setVal(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(value ?? ""); setEditing(false); } }}
          style={{ width: "100%", minHeight: 28, border: "2px solid var(--p6)", borderRadius: 3, background: "white", color: "var(--sl9)", textAlign: "center", fontSize: 11, fontWeight: 700, padding: 0, outline: "none", display: "block" }}
        />
      ) : (
        <div style={{ textAlign: "center", fontSize: 11, fontWeight: value > 0 ? 700 : 400, color: value > 0 ? "var(--em6)" : "var(--sl3)", padding: "5px 2px", userSelect: "none" }}>
          {value > 0 ? value : "·"}
        </div>
      )}
    </td>
  );
}

// ── Modal Générer Emploi ──────────────────────────────────────────────────────
function ModalGenererEmploi({ plannings, onClose, onSaved, flash }) {
  const groupesDispos = [];
  const seen = new Set();
  plannings.forEach(p => {
    if (!seen.has(p.groupe_id)) {
      seen.add(p.groupe_id);
      groupesDispos.push({ id: p.groupe_id, nom: toStr(p.groupe_nom) });
    }
  });

  const [groupeId, setGroupeId]     = useState(groupesDispos[0]?.id ?? "");
  const [semestre, setSemestre]     = useState("S1");
  const [dateDebut, setDateDebut]   = useState(new Date().toISOString().split("T")[0]);
  const [grille, setGrille]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const planningsDuGroupe = plannings.filter(
    p => String(p.groupe_id) === String(groupeId) && p.semestre === semestre
  );

  const genererGrille = () => {
    setPreviewing(true);
    const g = {};
    JOURS.forEach(j => { g[j] = [null, null, null, null]; });
    const creneaux = [];
    JOURS.forEach(j => [0, 1, 2, 3].forEach(si => creneaux.push({ jour: j, si })));
    let idx = 0;
    for (const p of planningsDuGroupe) {
      const chargeHebdo = parseFloat(p.charge_hebdo) || parseFloat(p.mh_drif) / NB_SEM;
      const nbSeances   = Math.max(1, Math.round(chargeHebdo / 2.5));
      for (let s = 0; s < nbSeances; s++) {
        while (idx < creneaux.length && g[creneaux[idx].jour][creneaux[idx].si] !== null) idx++;
        if (idx >= creneaux.length) break;
        const { jour, si } = creneaux[idx];
        g[jour][si] = {
          module:     toStr(p.module_nom),
          formateur:  toStr(p.formateur_nom),
          salle:      "",
          mode:       "PRESENTIEL",
        };
        idx++;
      }
    }
    setGrille(g);
    setPreviewing(false);
  };

  const setCell = (jour, si, field, value) => {
    setGrille(prev => {
      const next = { ...prev };
      const row  = [...(next[jour] || [null,null,null,null])];
      if (!row[si]) row[si] = { module: "", formateur: "", salle: "", mode: "PRESENTIEL" };
      else row[si] = { ...row[si] };
      row[si][field] = value;
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

  const handleSave = async () => {
    if (!grille) { flash("Veuillez d'abord générer la grille.", "err"); return; }
    if (!groupeId) { flash("Sélectionner un groupe.", "err"); return; }
    setSaving(true);
    try {
      await axios.post("/emplois", {
        groupe_id:  parseInt(groupeId),
        date_debut: dateDebut,
        semestre,
        grille,
      });
      flash("Emploi du temps généré avec succès !");
      onSaved();
    } catch (e) {
      flash(e?.response?.data?.message ?? "Erreur lors de la création.", "err");
    }
    setSaving(false);
  };

  const inpSt = {
    width: "100%", padding: "5px 8px",
    border: "1.5px solid rgba(26,82,118,.14)", borderRadius: 5,
    fontSize: 11, background: "#f8fafc", color: "var(--sl9)",
    outline: "none", boxSizing: "border-box", fontFamily: "var(--font)",
  };

  const COLORS = ["#1a5276","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#9333ea","#16a34a"];
  const colorMapLocal = {};
  let colorIdx = 0;
  const getColor = (name) => {
    if (!name) return "#64748b";
    if (!colorMapLocal[name]) colorMapLocal[name] = COLORS[colorIdx++ % COLORS.length];
    return colorMapLocal[name];
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--r-xl)",
        width: "100%", maxWidth: 980,
        maxHeight: "94vh", overflowY: "auto",
        boxShadow: "0 20px 48px rgba(26,82,118,.18), 0 0 0 1px rgba(26,82,118,.08)",
        animation: "slideUp .2s ease",
      }}>
        <div style={{
          background: "linear-gradient(135deg, var(--p6), #7c3aed)",
          padding: "16px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderRadius: "var(--r-xl) var(--r-xl) 0 0",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-hd)", display: "flex", alignItems: "center", gap: 8 }}>
              {Ico.gen} Générer un Emploi du Temps
            </div>
            <div style={{ color: "rgba(255,255,255,.65)", fontSize: 11, marginTop: 2 }}>
              Génération automatique depuis les plannings du groupe
            </div>
          </div>
          <button className="modal-close" onClick={onClose}
            style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "white" }}>
            {Ico.close}
          </button>
        </div>

        <div style={{ padding: "22px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Groupe *</label>
              <select className="form-select" value={groupeId}
                onChange={e => { setGroupeId(e.target.value); setGrille(null); }}>
                {groupesDispos.map(g => (
                  <option key={g.id} value={g.id}>{toStr(g.nom)}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Semestre</label>
              <select className="form-select" value={semestre}
                onChange={e => { setSemestre(e.target.value); setGrille(null); }}>
                {["S1","S2"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Période début</label>
              <input type="date" className="form-input" value={dateDebut}
                onChange={e => setDateDebut(e.target.value)} />
            </div>
          </div>

          {planningsDuGroupe.length > 0 ? (
            <div style={{
              background: "var(--p0)", border: "1px solid var(--p1)",
              borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--p6)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
                {Ico.info} {planningsDuGroupe.length} module(s) détecté(s) pour {semestre}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {planningsDuGroupe.map(p => (
                  <div key={p.id} style={{
                    background: "white", border: "1px solid var(--p2)",
                    borderRadius: 6, padding: "4px 10px", fontSize: 11,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: getColor(toStr(p.module_nom)) }} />
                    <span style={{ fontWeight: 600, color: "var(--sl8)" }}>{toStr(p.module_nom)}</span>
                    <span style={{ color: "var(--sl4)" }}>·</span>
                    <span style={{ color: "var(--sl5)" }}>{toStr(p.formateur_nom)}</span>
                    <span style={{ color: "var(--sl4)" }}>·</span>
                    <span style={{ color: "var(--p6)", fontWeight: 700 }}>
                      {parseFloat(p.charge_hebdo) || (parseFloat(p.mh_drif) / NB_SEM).toFixed(1)}h/sem
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: "#fff7ed", border: "1px solid #fed7aa",
              borderRadius: "var(--r-md)", padding: "12px 16px", marginBottom: 16,
              fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8,
            }}>
              {Ico.alert} Aucun planning trouvé pour ce groupe en {semestre}. Créez d'abord des plannings.
            </div>
          )}

          {planningsDuGroupe.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <button
                className="btn-primary"
                style={{
                  height: 38, padding: "0 24px", fontSize: 13,
                  background: "linear-gradient(135deg, var(--p6), #7c3aed)",
                  display: "flex", alignItems: "center", gap: 8,
                }}
                onClick={genererGrille}
                disabled={previewing}
              >
                {previewing ? "Génération…" : <>{Ico.magic} Générer automatiquement la grille</>}
              </button>
            </div>
          )}

          {grille && (
            <>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--sl5)",
                textTransform: "uppercase", letterSpacing: ".6px",
                marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
              }}>
                {Ico.cal} Grille générée — vous pouvez modifier les cases avant d'enregistrer
              </div>
              <div style={{ overflowX: "auto", marginBottom: 20 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 740, fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{
                        background: "var(--p6)", color: "rgba(255,255,255,.85)",
                        padding: "9px 12px", textAlign: "left", width: 90,
                        border: "1px solid var(--p7)", fontSize: 11, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: ".5px",
                      }}>Jour</th>
                      {SEANCES.map((s, i) => (
                        <th key={i} style={{
                          background: "var(--p6)", color: "rgba(255,255,255,.85)",
                          padding: "8px 10px", textAlign: "center",
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
                          padding: "8px 12px", fontWeight: 700, fontSize: 12,
                          color: "var(--sl7)", border: "1px solid var(--border)", whiteSpace: "nowrap",
                        }}>{jour}</td>
                        {[0,1,2,3].map(si => {
                          const cell = grille[jour]?.[si];
                          return (
                            <td key={si} style={{ padding: 5, border: "1px solid var(--border)", verticalAlign: "top", minWidth: 165 }}>
                              {cell ? (
                                <div style={{
                                  background: "linear-gradient(135deg, rgba(26,82,118,.06), rgba(124,58,237,.04))",
                                  border: `1.5px solid ${getColor(cell.module)}33`,
                                  borderLeft: `3px solid ${getColor(cell.module)}`,
                                  borderRadius: "var(--r-sm)", padding: "7px 9px",
                                  position: "relative",
                                }}>
                                  <button type="button" onClick={() => clearCell(jour, si)} style={{
                                    position: "absolute", top: 3, right: 3,
                                    background: "#fee2e2", border: "none", borderRadius: 4,
                                    color: "var(--rd5)", cursor: "pointer",
                                    width: 16, height: 16, fontSize: 11,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    lineHeight: 1,
                                  }}>×</button>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sl8)", marginBottom: 4, paddingRight: 18 }}>
                                    {cell.module}
                                  </div>
                                  <div style={{ fontSize: 10, color: getColor(cell.module), fontWeight: 600, marginBottom: 4 }}>
                                    {cell.formateur}
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                    <input type="text" style={{ ...inpSt, fontSize: 10 }}
                                      placeholder="Salle" value={cell.salle}
                                      onChange={e => setCell(jour, si, "salle", e.target.value)} />
                                    <select style={{ ...inpSt, fontSize: 10 }} value={cell.mode}
                                      onChange={e => setCell(jour, si, "mode", e.target.value)}>
                                      <option value="PRESENTIEL">Présentiel</option>
                                      <option value="DISTANCIEL">Distanciel</option>
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                <div style={{
                                  height: 60, display: "flex", alignItems: "center", justifyContent: "center",
                                  color: "var(--sl3)", fontSize: 18,
                                }}>—</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="modal-footer" style={{ marginTop: 0, paddingTop: 16 }}>
            <button className="btn-secondary" type="button" onClick={onClose}>Annuler</button>
            <button className="btn-primary" type="button" onClick={handleSave}
              disabled={saving || !grille}
              style={{ background: "linear-gradient(135deg, var(--p6), #7c3aed)" }}>
              {saving ? "Enregistrement…" : <>{Ico.check} Enregistrer l'emploi du temps</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PlanningRow ───────────────────────────────────────────────────────────────
function PlanningRow({ p, idx, semainesAffichees, premiereS2, formateurs, onCellSave, onDelete, onAutoOpen, onUpdate, onFlash }) {
  const [editing, setEditing]   = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving]     = useState(false);
  const rowBg = idx % 2 !== 0 ? "var(--sl0)" : "var(--surface)";

  const startEdit = () => {
    setEditData({
      formateur_id: String(p.formateur_id ?? ""),
      semestre:     p.semestre ?? "S1",
      mh_drif:      p.mh_drif ?? "",
      charge_hebdo: p.charge_hebdo ?? "",
    });
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`/plannings/${p.id}`, {
        formateur_id: parseInt(editData.formateur_id),
        semestre:     editData.semestre,
        mh_drif:      parseInt(editData.mh_drif),
        charge_hebdo: editData.charge_hebdo !== "" ? parseFloat(editData.charge_hebdo) : p.charge_hebdo,
      });
      onUpdate(p.id, res.data.planning ?? {
        formateur_id:  parseInt(editData.formateur_id),
        formateur_nom: formateurs.find(f => String(f.id) === String(editData.formateur_id))?.nom ?? p.formateur_nom,
        semestre:      editData.semestre,
        mh_drif:       parseInt(editData.mh_drif),
      });
      setEditing(false);
    } catch (e) {
      onFlash(e.response?.data?.message ?? JSON.stringify(e.response?.data) ?? "Erreur de modification.", "err");
    }
    setSaving(false);
  };

  const inpStyle = {
    width: "100%", height: 30, padding: "0 8px",
    border: "1.5px solid var(--p2)", borderRadius: 6,
    fontSize: 12, background: "white", color: "var(--sl9)",
    outline: "none", fontFamily: "var(--font)",
  };
  const selStyle = {
    ...inpStyle, appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 7px center", paddingRight: 22,
  };

  return (
    <tr style={{ borderBottom: "1px solid var(--sl1)", background: editing ? "rgba(26,82,118,.03)" : undefined }}>
      <td style={{ padding: "7px 14px", position: "sticky", left: 0, zIndex: 1, background: rowBg }}>
        <span style={{ fontWeight: 700, color: "var(--sl8)", fontSize: 12, whiteSpace: "nowrap" }}>{toStr(p.groupe_nom)}</span>
      </td>
      <td style={{ padding: "7px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {editing ? (
            <select style={{ ...selStyle, width: 90 }} value={editData.semestre}
              onChange={e => setEditData(d => ({ ...d, semestre: e.target.value }))}>
              {["S1","S2"].map(s => <option key={s}>{s}</option>)}
            </select>
          ) : (
            <SemBadge s={p.semestre} />
          )}
          <span style={{ fontSize: 11, color: "var(--sl6)" }}>{toStr(p.module_nom)}</span>
        </div>
      </td>
      <td style={{ padding: editing ? "5px 10px" : "7px 14px", whiteSpace: "nowrap", minWidth: 140 }}>
        {editing ? (
          <select style={selStyle} value={editData.formateur_id}
            onChange={e => setEditData(d => ({ ...d, formateur_id: e.target.value }))}>
            <option value="">— Formateur —</option>
            {formateurs.map(f => <option key={f.id} value={f.id}>{toStr(f.nom)}</option>)}
          </select>
        ) : (
          <span style={{ fontSize: 11, color: "var(--sl5)" }}>{toStr(p.formateur_nom)}</span>
        )}
      </td>
      <td style={{ textAlign: "center", whiteSpace: "nowrap", padding: editing ? "5px 6px" : undefined }}>
        {editing ? (
          <input style={{ ...inpStyle, width: 64, textAlign: "center" }} type="number" min="1"
            value={editData.mh_drif}
            onChange={e => setEditData(d => ({ ...d, mh_drif: e.target.value, charge_hebdo: calcCharge(e.target.value) }))} />
        ) : (
          <span style={{ fontWeight: 700, fontSize: 12, color: "var(--sl8)" }}>{p.mh_drif}h</span>
        )}
      </td>
      <td style={{ textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: p.mh_restante > 0 ? "var(--rd5)" : "var(--em6)" }}>
          {p.mh_restante > 0 ? `${p.mh_restante}h` : "—"}
        </span>
      </td>
      <td style={{ padding: "0 10px", borderRight: "2px solid var(--border)" }}>
        <AvcBar mhDrif={p.mh_drif} totalPrevu={p.total_prevu} />
      </td>
      {semainesAffichees.map(s => (
        <CellSemaine key={s.num} planningId={p.id} semaineNum={s.num}
          value={parseFloat(p.semaines?.[s.num]) || 0}
          planSemestre={p.semestre} cellSemestre={`S${s.semestre}`} onSave={onCellSave} />
      ))}
      <td style={{ textAlign: "center", padding: "0 6px", whiteSpace: "nowrap" }}>
        {editing ? (
          <>
            <button className="btn-icon btn-icon-edit" title="Enregistrer" onClick={saveEdit} disabled={saving}
              style={{ color: "var(--em6)", borderColor: "var(--em5)" }}>
              {Ico.save}
            </button>
            <button className="btn-icon" title="Annuler" onClick={cancelEdit}>{Ico.close}</button>
          </>
        ) : (
          <>
            <button className="btn-icon btn-icon-edit" title="Modifier" onClick={startEdit}>{Ico.edit}</button>
            <button className="btn-icon btn-icon-edit" title="Auto-distribuer" onClick={() => onAutoOpen(p)}>{Ico.magic}</button>
            <button className="btn-icon btn-icon-del" title="Supprimer" onClick={() => onDelete(p.id)}>{Ico.trash}</button>
          </>
        )}
      </td>
    </tr>
  );
}

// ── PendingRow ────────────────────────────────────────────────────────────────
function PendingRow({ pm, idx, formateurs, groupeId, onCreate }) {
  const [fid, setFid]           = useState(pm.formateur_id ?? "");
  const [charge, setCharge]     = useState(pm.charge_hebdo ?? "");
  const [semestre, setSemestre] = useState(pm.semestre ?? "S1");
  const [creating, setCreating] = useState(false);
  const rowBg = idx % 2 !== 0 ? "var(--sl0)" : "var(--surface)";

  const handleCreate = async () => {
    setCreating(true);
    await onCreate(groupeId, { ...pm, semestre, charge_hebdo: charge }, fid);
    setCreating(false);
  };

  const selStyle = {
    height: 30, padding: "0 8px",
    border: "1.5px solid var(--border)", borderRadius: 6,
    fontSize: 12, background: "#f8fafc", color: "var(--sl9)",
    outline: "none", fontFamily: "var(--font)", appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 7px center", paddingRight: 22,
  };

  return (
    <tr style={{ borderBottom: "1px solid var(--sl1)", background: rowBg }}>
      <td style={{ padding: "8px 14px" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--sl8)" }}>{toStr(pm.module_nom)}</span>
      </td>
      <td style={{ textAlign: "center", padding: "8px 10px" }}>
        <select style={{ ...selStyle, width: 74 }} value={semestre} onChange={e => setSemestre(e.target.value)}>
          {["S1","S2"].map(s => <option key={s}>{s}</option>)}
        </select>
      </td>
      <td style={{ textAlign: "center", padding: "8px 10px" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--sl7)" }}>{pm.mh_drif}h</span>
      </td>
      <td style={{ textAlign: "center", padding: "8px 10px" }}>
        <input type="number" min="0.5" step="0.5" value={charge}
          onChange={e => setCharge(e.target.value)}
          style={{ width: 60, height: 30, textAlign: "center", padding: "0 6px", border: "1.5px solid var(--border)", borderRadius: 6, fontSize: 12, background: "#f8fafc", color: "var(--sl9)", outline: "none" }}
          placeholder="auto" />
      </td>
      <td style={{ padding: "8px 10px" }}>
        <select style={{ ...selStyle, width: "100%", minWidth: 160 }} value={fid} onChange={e => setFid(e.target.value)}>
          <option value="">— Formateur —</option>
          {formateurs.map(f => <option key={f.id} value={f.id}>{toStr(f.nom)}</option>)}
        </select>
      </td>
      <td style={{ textAlign: "center", padding: "8px 10px" }}>
        <button className="btn-primary" style={{ height: 30, padding: "0 12px", fontSize: 12 }}
          onClick={handleCreate} disabled={creating || !fid} title="Créer le planning">
          {creating ? "…" : <>{Ico.plus} Créer</>}
        </button>
      </td>
    </tr>
  );
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────
export default function Plannings() {
  const [plannings, setPlannings]         = useState([]);
  const [semainesAnnee, setSemainesAnnee] = useState([]);
  const [anneeScolaire, setAnneeScolaire] = useState("");
  const [loading, setLoading]             = useState(true);
  const [alert, setAlert]                 = useState(null);
  const [filterGroupe, setFilterGroupe]   = useState("");
  const [filterSemestre, setFilterSemestre] = useState("");
  const [groupes, setGroupes]             = useState([]);
  const [modules, setModules]             = useState([]);
  const [formateurs, setFormateurs]       = useState([]);
  const FORM_INIT = { groupe_id: "", module_id: "", formateur_id: "", semestre: "S1", mh_drif: "", charge_hebdo: "", type: "Régionale", mode: "PRESENTIEL" };
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(FORM_INIT);
  const [saving, setSaving] = useState(false);
  const [pendingModules, setPendingModules] = useState({});
  const [autoModal, setAutoModal]   = useState(false);
  const [autoTarget, setAutoTarget] = useState(null);
  const [autoCharge, setAutoCharge] = useState("");
  const [autoSaving, setAutoSaving] = useState(false);
  const [genModal, setGenModal] = useState(false);

  const flash = (msg, type = "ok") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchPlannings = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterGroupe)   params.groupe_id = filterGroupe;
    if (filterSemestre) params.semestre  = filterSemestre;
    axios.get("/plannings", { params })
      .then(r => {
        setPlannings(r.data.plannings ?? []);
        setSemainesAnnee(r.data.semaines_annee ?? []);
        setAnneeScolaire(r.data.annee_scolaire ?? "");
      })
      .catch(() => flash("Erreur de chargement.", "err"))
      .finally(() => setLoading(false));
  }, [filterGroupe, filterSemestre]);

  useEffect(() => { fetchPlannings(); }, [fetchPlannings]);

  useEffect(() => {
    axios.get("/pole-groupes").then(r => setGroupes(r.data.data ?? []));
    axios.get("/pole-formateurs").then(r => setFormateurs(r.data.data ?? []));
  }, []);

  const loadModules = (groupeId) => {
    if (!groupeId) { setModules([]); return; }
    axios.get("/pole-modules", { params: { groupe_id: groupeId } })
      .then(r => setModules(r.data.data ?? []));
  };

  useEffect(() => {
    if (modal && form.groupe_id) loadModules(form.groupe_id);
    if (!modal) setModules([]);
  }, [modal]);

  const computePendingModules = (groupeId, allModules, existingPlannings, formateursMap) => {
    const usedModuleIds = new Set(
      existingPlannings.filter(p => String(p.groupe_id) === String(groupeId)).map(p => p.module_id)
    );
    return allModules
      .filter(m => !usedModuleIds.has(m.id))
      .map(m => ({
        module_id:     m.id,
        module_nom:    toStr(m.intitule ?? m.code ?? `Module ${m.id}`),
        semestre:      m.semestre ?? "S1",
        mh_drif:       m.mh_drif ?? 0,
        formateur_id:  m.formateur_id ? String(m.formateur_id) : "",
        formateur_nom: m.formateur_id ? (formateursMap[m.formateur_id] ?? "") : "",
        charge_hebdo:  calcCharge(m.mh_drif),
      }));
  };

  const handleGroupeChange = (groupeId) => {
    setForm(p => ({ ...p, groupe_id: groupeId, module_id: "", formateur_id: "", mh_drif: "", charge_hebdo: "" }));
    loadModules(groupeId);
  };

  const handleSelectModule = (moduleId) => {
    const mod = modules.find(m => m.id == moduleId);
    if (!mod) { setForm(p => ({ ...p, module_id: "" })); return; }
    setForm(p => ({
      ...p,
      module_id:    moduleId,
      semestre:     mod.semestre ?? "S1",
      mh_drif:      parseFloat(mod.mh_drif) || "",
      charge_hebdo: calcCharge(mod.mh_drif),
      formateur_id: mod.formateur_id ? String(mod.formateur_id) : "",
    }));
  };

  const handleMhChange = (val) => {
    setForm(p => ({ ...p, mh_drif: val, charge_hebdo: calcCharge(parseFloat(val)) }));
  };

  const submitForm = async () => {
    if (!form.groupe_id || !form.module_id || !form.formateur_id || !form.mh_drif) {
      flash("Remplissez tous les champs obligatoires.", "err"); return;
    }
    const doublon = plannings.find(
      p => String(p.groupe_id) === String(form.groupe_id) &&
           String(p.module_id) === String(form.module_id)
    );
    if (doublon) {
      flash(`Ce module est déjà planifié pour ce groupe (${doublon.semestre}).`, "err");
      return;
    }
    setSaving(true);
    try {
      await axios.post("/plannings", {
        groupe_id:    parseInt(form.groupe_id),
        module_id:    parseInt(form.module_id),
        formateur_id: parseInt(form.formateur_id),
        semestre:     form.semestre,
        mh_drif:      parseInt(form.mh_drif),
        charge_hebdo: form.charge_hebdo ? parseFloat(form.charge_hebdo) : undefined,
        type:         form.type,
        mode:         form.mode,
      });
      flash("Planning créé avec succès.");
      setModal(false);
      setForm(FORM_INIT);
      const formateursMap = {};
      formateurs.forEach(f => { formateursMap[f.id] = f.nom; });
      const params = {};
      if (filterGroupe)   params.groupe_id = filterGroupe;
      if (filterSemestre) params.semestre  = filterSemestre;
      const updated      = await axios.get("/plannings", { params });
      const newPlannings = updated.data.plannings ?? [];
      setPlannings(newPlannings);
      setSemainesAnnee(updated.data.semaines_annee ?? []);
      setAnneeScolaire(updated.data.annee_scolaire ?? "");
      const groupeId  = form.groupe_id;
      const remaining = computePendingModules(groupeId, modules, newPlannings, formateursMap);
      if (remaining.length > 0) {
        setPendingModules(prev => ({ ...prev, [groupeId]: remaining }));
      } else {
        setPendingModules(prev => { const n = { ...prev }; delete n[groupeId]; return n; });
      }
    } catch (e) {
      flash(e?.response?.data?.message ?? "Erreur lors de la création.", "err");
    }
    setSaving(false);
  };

  const createFromPending = async (groupeId, pm, updatedFId) => {
    const fid = updatedFId !== undefined ? updatedFId : pm.formateur_id;
    if (!fid) { flash("Choisissez un formateur pour ce module.", "err"); return; }
    const doublon = plannings.find(
      p => String(p.groupe_id) === String(groupeId) &&
           String(p.module_id) === String(pm.module_id)
    );
    if (doublon) {
      flash(`Ce module est déjà planifié (${doublon.semestre}).`, "err"); return;
    }
    try {
      await axios.post("/plannings", {
        groupe_id:    parseInt(groupeId),
        module_id:    pm.module_id,
        formateur_id: parseInt(fid),
        semestre:     pm.semestre,
        mh_drif:      parseInt(pm.mh_drif),
        charge_hebdo: pm.charge_hebdo ? parseFloat(pm.charge_hebdo) : undefined,
        type:         "Régionale",
        mode:         "PRESENTIEL",
      });
      flash(`Planning "${toStr(pm.module_nom)}" créé.`);
      setPendingModules(prev => {
        const list = (prev[groupeId] ?? []).filter(m => m.module_id !== pm.module_id);
        if (list.length === 0) { const n = { ...prev }; delete n[groupeId]; return n; }
        return { ...prev, [groupeId]: list };
      });
      fetchPlannings();
    } catch (e) {
      flash(e?.response?.data?.message ?? "Erreur.", "err");
    }
  };

  const handleUpdate = (id, updated) => {
    setPlannings(prev => prev.map(p => p.id !== id ? p : { ...p, ...updated }));
  };

  const handleCellSave = (planningId, semaineNum, mh, totalPrevu, mhRestante) => {
    setPlannings(prev => prev.map(p => p.id !== planningId ? p : {
      ...p, semaines: { ...p.semaines, [semaineNum]: mh }, total_prevu: totalPrevu, mh_restante: mhRestante,
    }));
  };

  const deletePlanning = async (id) => {
    if (!window.confirm("Supprimer ce planning ?")) return;
    try {
      await axios.delete(`/plannings/${id}`);
      flash("Planning supprimé.");
      fetchPlannings();
    } catch { flash("Erreur de suppression.", "err"); }
  };

  const openAutoModal = (p) => { setAutoTarget(p); setAutoCharge(calcCharge(p.mh_drif)); setAutoModal(true); };

  const submitAuto = async () => {
    if (!autoCharge || parseFloat(autoCharge) <= 0) { flash("Entrez une charge hebdomadaire.", "err"); return; }
    setAutoSaving(true);
    try {
      const res = await axios.post(`/plannings/${autoTarget.id}/auto-distribuer`, { charge_hebdo: parseFloat(autoCharge) });
      flash("Distribution effectuée.");
      setAutoModal(false);
      setPlannings(prev => prev.map(p => p.id !== autoTarget.id ? p : {
        ...p, semaines: res.data.semaines, total_prevu: res.data.total_prevu, mh_restante: res.data.mh_restante,
      }));
    } catch { flash("Erreur.", "err"); }
    setAutoSaving(false);
  };

  const semainesAffichees = filterSemestre
    ? semainesAnnee.filter(s => `S${s.semestre}` === filterSemestre)
    : semainesAnnee;
  const premiereS2 = semainesAnnee.find(s => s.semestre === 2)?.num;
  const totalParSemaine = {};
  semainesAffichees.forEach(s => {
    totalParSemaine[s.num] = plannings.reduce((acc, p) => acc + (parseFloat(p.semaines?.[s.num]) || 0), 0);
  });
  const pendingGroupeIds = Object.keys(pendingModules);

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Planning Hebdomadaire</div>
          <div className="pg-subtitle">Répartition des MH par semaine — {anneeScolaire} · {NB_SEM} semaines / semestre</div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={fetchPlannings}>{Ico.refresh} Actualiser</button>
          {plannings.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => setGenModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, borderColor: "#7c3aed", color: "#7c3aed" }}
              title="Générer un emploi du temps depuis les plannings"
            >
              {Ico.gen} Générer Emploi
            </button>
          )}
          <button className="btn-primary" onClick={() => { setForm(FORM_INIT); setModal(true); }}>{Ico.plus} Nouveau Planning</button>
        </div>
      </div>

      {alert && (
        <div className={`al-alert al-alert-${alert.type}`}>
          {alert.type === "ok" ? Ico.check : Ico.alert} {alert.msg}
        </div>
      )}

      <div className="table-card" style={{ marginBottom: 16 }}>
        <div className="table-toolbar">
          <div className="toolbar-filters">
            <span style={{ fontSize: 12, color: "var(--sl5)", display: "flex", alignItems: "center", gap: 5 }}>{Ico.filter} Filtres</span>
            <select className="form-select" style={{ width: 210, height: 34 }} value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
              <option value="">Tous les groupes</option>
              {groupes.map(g => <option key={g.id} value={g.id}>{toStr(g.nom)}{g.filiere ? ` (${toStr(g.filiere)})` : ""}</option>)}
            </select>
            <select className="form-select" style={{ width: 150, height: 34 }} value={filterSemestre} onChange={e => setFilterSemestre(e.target.value)}>
              <option value="">Toute l'année</option>
              <option value="S1">Semestre 1</option>
              <option value="S2">Semestre 2</option>
            </select>
            {(filterGroupe || filterSemestre) && (
              <button className="btn-secondary" style={{ height: 34, fontSize: 12 }} onClick={() => { setFilterGroupe(""); setFilterSemestre(""); }}>
                {Ico.close} Réinitialiser
              </button>
            )}
          </div>
          <span className="results-count">{plannings.length} planning(s)</span>
        </div>
      </div>

      {pendingGroupeIds.length > 0 && pendingGroupeIds.map(groupeId => {
        const list   = pendingModules[groupeId] ?? [];
        const groupe = groupes.find(g => String(g.id) === String(groupeId));
        return (
          <div key={groupeId} className="table-card" style={{ marginBottom: 16 }}>
            <div style={{
              padding: "12px 18px",
              background: "linear-gradient(135deg, rgba(26,82,118,.06), rgba(26,82,118,.02))",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--p0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {Ico.info}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sl8)" }}>
                    Modules restants — {toStr(groupe?.nom ?? `Groupe ${groupeId}`)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sl5)", marginTop: 1 }}>
                    {list.length} module{list.length > 1 ? "s" : ""} sans planning — cliquez sur + pour créer
                  </div>
                </div>
              </div>
              <button className="btn-icon" title="Fermer" onClick={() =>
                setPendingModules(prev => { const n = { ...prev }; delete n[groupeId]; return n; })
              }>{Ico.close}</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "var(--sl0)", borderBottom: "1px solid var(--border)" }}>
                    {["Module","Semestre","MH","H/sem","Formateur",""].map((h, i) => (
                      <th key={i} style={{ padding: "8px 14px", textAlign: i === 0 ? "left" : "center", fontSize: 11, fontWeight: 700, color: "var(--sl5)", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((pm, i) => (
                    <PendingRow key={pm.module_id} pm={pm} idx={i} formateurs={formateurs} groupeId={groupeId} onCreate={createFromPending} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {loading ? (
        <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
      ) : (
        <div className="table-card" style={{ padding: 0 }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, tableLayout: "auto", width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr style={{ background: "var(--sl1)" }}>
                  <th colSpan={6} style={{
                    textAlign: "left", padding: "6px 14px", fontSize: 11, fontWeight: 600,
                    color: "var(--sl5)", borderRight: "2px solid var(--border)",
                    position: "sticky", left: 0, zIndex: 3, background: "var(--sl1)", whiteSpace: "nowrap",
                  }}>
                    Année scolaire {anneeScolaire}
                  </th>
                  {semainesAffichees.map(s => (
                    <th key={s.num} style={{
                      width: 32, minWidth: 32, padding: "4px 0", textAlign: "center",
                      fontSize: 9, fontWeight: 700,
                      color: s.semestre === 1 ? "var(--p5)" : "#7c3aed",
                      borderRight: s.num === premiereS2 - 1 ? "3px solid rgba(124,58,237,.25)" : "1px solid var(--border)",
                      background: s.semestre === 1 ? "rgba(26,82,118,.05)" : "rgba(124,58,237,.05)",
                    }}>
                      S{s.num}
                    </th>
                  ))}
                  <th style={{ width: 88 }} />
                </tr>
                <tr style={{ background: "var(--sl0)", borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "9px 14px", whiteSpace: "nowrap", minWidth: 110, position: "sticky", left: 0, zIndex: 3, background: "var(--sl0)" }}>Groupe</th>
                  <th style={{ textAlign: "left", padding: "9px 14px", whiteSpace: "nowrap", minWidth: 150 }}>Module</th>
                  <th style={{ textAlign: "left", padding: "9px 14px", whiteSpace: "nowrap", minWidth: 130 }}>Formateur</th>
                  <th style={{ textAlign: "center", whiteSpace: "nowrap", minWidth: 56 }}>MH</th>
                  <th style={{ textAlign: "center", whiteSpace: "nowrap", minWidth: 68 }}>Restante</th>
                  <th style={{ textAlign: "center", whiteSpace: "nowrap", minWidth: 96, borderRight: "2px solid var(--border)" }}>Avancement</th>
                  {semainesAffichees.map(s => (
                    <th key={s.num} style={{
                      textAlign: "center", fontSize: 9, padding: "5px 0", fontWeight: 500,
                      color: "var(--sl4)", width: 32, minWidth: 32,
                      borderRight: s.num === premiereS2 - 1 ? "3px solid rgba(124,58,237,.25)" : "1px solid var(--border)",
                    }}>
                      {s.date_lundi?.slice(5).replace("-", "/")}
                    </th>
                  ))}
                  <th style={{ width: 88 }} />
                </tr>
              </thead>
              <tbody>
                {plannings.length === 0 ? (
                  <tr>
                    <td colSpan={6 + semainesAffichees.length + 1}>
                      <div className="empty">
                        <div className="empty-icon">{Ico.filter}</div>
                        <div className="empty-title">Aucun planning</div>
                        <div className="empty-desc">Créez un nouveau planning pour commencer</div>
                      </div>
                    </td>
                  </tr>
                ) : plannings.map((p, idx) => (
                  <PlanningRow
                    key={p.id} p={p} idx={idx}
                    semainesAffichees={semainesAffichees} premiereS2={premiereS2}
                    formateurs={formateurs}
                    onCellSave={handleCellSave}
                    onDelete={deletePlanning}
                    onAutoOpen={openAutoModal}
                    onUpdate={handleUpdate}
                    onFlash={flash}
                  />
                ))}
                {plannings.length > 0 && (
                  <tr style={{ background: "var(--sl1)", borderTop: "2px solid var(--border)" }}>
                    <td style={{ padding: "7px 14px", fontSize: 11, fontWeight: 700, color: "var(--sl6)", whiteSpace: "nowrap", position: "sticky", left: 0, zIndex: 1, background: "var(--sl1)" }}>
                      Total / semaine
                    </td>
                    <td colSpan={2} />
                    <td style={{ textAlign: "center", fontWeight: 700, fontSize: 12, color: "var(--sl7)" }}>
                      {plannings.reduce((a, p) => a + (p.mh_drif ?? 0), 0)}h
                    </td>
                    <td /><td style={{ borderRight: "2px solid var(--border)" }} />
                    {semainesAffichees.map(s => {
                      const t = totalParSemaine[s.num];
                      return (
                        <td key={s.num} style={{
                          textAlign: "center", fontSize: 10, fontWeight: 700,
                          color: t > 0 ? "var(--p6)" : "var(--sl3)",
                          borderRight: s.num === premiereS2 - 1 ? "3px solid rgba(124,58,237,.25)" : "1px solid var(--border)",
                          padding: "6px 0", width: 32, fontVariantNumeric: "tabular-nums",
                        }}>
                          {t > 0 ? t : ""}
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ width: 540 }}>
            <div className="modal-header">
              <div className="modal-title">Nouveau Planning</div>
              <button className="modal-close" onClick={() => setModal(false)}>{Ico.close}</button>
            </div>
            <div className="form-group">
              <label className="form-label">Groupe <span style={{ color: "var(--rd5)" }}>*</span></label>
              <select className="form-select" value={form.groupe_id} onChange={e => handleGroupeChange(e.target.value)}>
                <option value="">— Sélectionner un groupe —</option>
                {groupes.map(g => <option key={g.id} value={g.id}>{toStr(g.nom)}{g.filiere ? ` (${toStr(g.filiere)})` : ""}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Module <span style={{ color: "var(--rd5)" }}>*</span></label>
              <select className="form-select" value={form.module_id} onChange={e => handleSelectModule(e.target.value)} disabled={!form.groupe_id}>
                <option value="">{form.groupe_id ? "— Sélectionner un module —" : "— Choisissez d'abord un groupe —"}</option>
                {["S1","S2"].map(sem => {
                  const mods = modules.filter(m => (m.semestre ?? "S1") === sem);
                  if (!mods.length) return null;
                  return (
                    <optgroup key={sem} label={`── Semestre ${sem} ──`}>
                      {mods.map(m => (
                        <option key={m.id} value={m.id}>{toStr(m.intitule)}{m.mh_drif ? ` — ${m.mh_drif}h` : ""}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Formateur <span style={{ color: "var(--rd5)" }}>*</span></label>
              <select className="form-select" value={form.formateur_id} onChange={e => setForm(p => ({ ...p, formateur_id: e.target.value }))}>
                <option value="">— Sélectionner un formateur —</option>
                {formateurs.map(f => <option key={f.id} value={f.id}>{toStr(f.nom)}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Semestre</label>
                <select className="form-select" value={form.semestre} onChange={e => setForm(p => ({ ...p, semestre: e.target.value }))}>
                  {["S1","S2"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">MH DRIF <span style={{ color: "var(--rd5)" }}>*</span></label>
                <input className="form-input" type="number" min="1" placeholder="ex: 60"
                  value={form.mh_drif} onChange={e => handleMhChange(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">MH / semaine <span style={{ fontSize: 10, color: "var(--sl4)", marginLeft: 4, fontWeight: 400, textTransform: "none" }}>(modifiable)</span></label>
                <input className="form-input" type="number" min="0.5" step="0.5" placeholder="auto"
                  value={form.charge_hebdo} onChange={e => setForm(p => ({ ...p, charge_hebdo: e.target.value }))} />
              </div>
            </div>
            {form.mh_drif > 0 && form.charge_hebdo > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 12px", background: "var(--p0)", border: "1px solid var(--p1)",
                borderRadius: "var(--r-md)", marginBottom: 14, fontSize: 12, color: "var(--p7)",
              }}>
                {Ico.info}
                <span>
                  {form.mh_drif}h à raison de <strong>{form.charge_hebdo}h/sem</strong>
                  {" = "}
                  <strong style={{ color: "var(--p6)" }}>{Math.ceil(form.mh_drif / form.charge_hebdo)} sem.</strong>
                  {" sur "}<strong>{NB_SEM}</strong> disponibles en <strong>{form.semestre}</strong>
                  {Math.ceil(form.mh_drif / form.charge_hebdo) > NB_SEM && (
                    <span style={{ color: "var(--rd5)", marginLeft: 6, fontWeight: 700 }}>
                      — Attention : dépasse les {NB_SEM} semaines
                    </span>
                  )}
                </span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option>Régionale</option><option>Locale</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mode</label>
                <select className="form-select" value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))}>
                  <option value="PRESENTIEL">Présentiel</option>
                  <option value="DISTANCIEL">Distanciel</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={submitForm} disabled={saving}>
                {saving ? "Enregistrement..." : "Créer le planning"}
              </button>
            </div>
          </div>
        </div>
      )}

      {autoModal && autoTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAutoModal(false)}>
          <div className="modal" style={{ width: 420 }}>
            <div className="modal-header">
              <div className="modal-title">Distribution automatique</div>
              <button className="modal-close" onClick={() => setAutoModal(false)}>{Ico.close}</button>
            </div>
            <div style={{ background: "var(--sl0)", borderRadius: "var(--r-md)", padding: "12px 16px", marginBottom: 20, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--sl5)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".4px", fontWeight: 600 }}>Planning sélectionné</div>
              <div style={{ fontWeight: 700, color: "var(--sl8)", fontSize: 14 }}>{toStr(autoTarget.groupe_nom)}</div>
              <div style={{ fontSize: 12, color: "var(--sl6)", marginTop: 2 }}>{toStr(autoTarget.module_nom)}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <SemBadge s={autoTarget.semestre} />
                <span style={{ fontSize: 12, color: "var(--sl5)" }}>{autoTarget.mh_drif}h DRIF</span>
                {autoTarget.mh_restante > 0 && (
                  <span style={{ fontSize: 12, color: "var(--rd5)", fontWeight: 600 }}>{autoTarget.mh_restante}h restantes</span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">MH par semaine</label>
              <input className="form-input" type="number" min="0.5" step="0.5"
                placeholder={`Suggéré : ${calcCharge(autoTarget.mh_drif)}`}
                value={autoCharge} onChange={e => setAutoCharge(e.target.value)} />
            </div>
            {autoCharge > 0 && (
              <div style={{ padding: "9px 12px", background: "var(--p0)", border: "1px solid var(--p1)", borderRadius: "var(--r-md)", fontSize: 12, color: "var(--p7)", marginBottom: 4, display: "flex", gap: 6, alignItems: "center" }}>
                {Ico.info}
                <span>
                  {autoTarget.mh_drif}h à raison de <strong>{autoCharge}h/sem</strong>
                  {" = "}
                  <strong style={{ color: "var(--p6)" }}>{Math.ceil(autoTarget.mh_drif / autoCharge)} sem.</strong>
                  {" sur "}<strong>{NB_SEM}</strong> disponibles en <strong>{autoTarget.semestre}</strong>
                </span>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setAutoModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={submitAuto} disabled={autoSaving}>
                {autoSaving ? "Distribution..." : "Distribuer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {genModal && (
        <ModalGenererEmploi
          plannings={plannings}
          onClose={() => setGenModal(false)}
          onSaved={() => { setGenModal(false); flash("Emploi du temps créé ! Consultez la page Emplois du temps."); }}
          flash={flash}
        />
      )}
    </div>
  );
}