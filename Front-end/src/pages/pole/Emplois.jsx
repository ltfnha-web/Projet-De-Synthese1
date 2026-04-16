// src/pages/pole/Emplois.jsx
import { useState, useEffect } from "react";
import axios from "axios";

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
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sl8)", marginBottom: 3 }}>{s.module}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: getColor(s.formateur), marginBottom: 2 }}>{s.formateur}</div>
      <div style={{ fontSize: 10, color: "var(--sl4)" }}>{s.salle}{s.salle && s.mode ? " · " : ""}{s.mode}</div>
    </td>
  );
}

// ── Modal Créer Emploi ────────────────────────────────────────────────────────
function ModalCreerEmploi({ onClose, onSaved, groupes }) {
  const [form, setForm] = useState({
    groupe_id: "", date_debut: new Date().toISOString().split("T")[0], semestre: "S1",
  });
  const [grille, setGrille] = useState(() => {
    const g = {}; JOURS.forEach(j => { g[j] = [null,null,null,null]; }); return g;
  });
  const [modules, setModules]       = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      if (field === "module" && !value) row[si] = null;
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
    setGrille(prev => {
      const next = { ...prev };
      const row  = [...(next[jour] || [null,null,null,null])];
      row[si] = { module: "", formateur: "", salle: "", mode: "PRESENTIEL" };
      next[jour] = row; return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.groupe_id) { setError("Choisir un groupe."); return; }
    setSaving(true); setError(null);
    try {
      const groupe = groupes.find(g => String(g.id) === String(form.groupe_id));
      await axios.post("/emplois", {
        groupe:     groupe?.nom ?? `Groupe ${form.groupe_id}`,
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
    width: "100%", padding: "6px 10px",
    border: "1.5px solid rgba(26,82,118,.14)", borderRadius: 6,
    fontSize: 12, background: "#f8fafc", color: "var(--sl9)",
    outline: "none", boxSizing: "border-box", fontFamily: "var(--font)",
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--surface)", borderRadius: "var(--r-xl)",
        width: "100%", maxWidth: 960, maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 20px 48px rgba(26,82,118,.18), 0 0 0 1px rgba(26,82,118,.08)",
        animation: "slideUp .2s ease",
      }}>
        {/* Header */}
        <div style={{
          background: "var(--p6)", padding: "16px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderRadius: "var(--r-xl) var(--r-xl) 0 0",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15, fontFamily: "var(--font-hd)" }}>
              Créer un emploi du temps
            </div>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginTop: 2 }}>
              Remplir la grille horaire du groupe
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "white" }}>
            {Ico.close}
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {error && (
            <div className="al-alert al-alert-err" style={{ marginBottom: 16 }}>
              {Ico.alert} {error}
            </div>
          )}

          {/* Infos générales */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Groupe *</label>
              <select className="form-select" value={form.groupe_id} onChange={e => handleGroupeChange(e.target.value)}>
                <option value="">Sélectionner un groupe</option>
                {groupes.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.nom ?? `Groupe ${g.id}`}{g.filiere ? ` — ${g.filiere}` : ""}
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

          {/* Titre grille */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: "var(--sl5)",
            textTransform: "uppercase", letterSpacing: ".6px",
            marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
          }}>
            {Ico.cal} Grille horaire — cliquer sur + pour ajouter une séance
          </div>

          {/* Grille */}
          <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720, fontSize: 12 }}>
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
                      return (
                        <td key={si} style={{ padding: 6, border: "1px solid var(--border)", verticalAlign: "top", minWidth: 170 }}>
                          {cell ? (
                            <div style={{
                              background: "var(--p0)", borderRadius: "var(--r-sm)",
                              padding: "8px 10px", position: "relative",
                              border: "1px solid var(--p1)",
                            }}>
                              <button type="button" onClick={() => clearCell(jour, si)} style={{
                                position: "absolute", top: 4, right: 4,
                                background: "#fee2e2", border: "none", borderRadius: 4,
                                color: "var(--rd5)", cursor: "pointer", width: 18, height: 18,
                                fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                              }}>×</button>

                              <select style={{ ...inpSt, marginBottom: 5 }}
                                value={cell.module}
                                onChange={e => setCell(jour, si, "module", e.target.value)}>
                                <option value="">Module…</option>
                                {modules.map(m => (
                                  <option key={m.id} value={m.intitule ?? m.code}>
                                    {m.intitule ?? m.code}
                                  </option>
                                ))}
                              </select>

                              <select style={{ ...inpSt, marginBottom: 5 }}
                                value={cell.formateur}
                                onChange={e => setCell(jour, si, "formateur", e.target.value)}>
                                <option value="">Formateur…</option>
                                {formateurs.map(f => (
                                  <option key={f.id} value={f.nom}>{f.nom}</option>
                                ))}
                              </select>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                                <input type="text" style={inpSt}
                                  placeholder="Salle" value={cell.salle}
                                  onChange={e => setCell(jour, si, "salle", e.target.value)} />
                                <select style={inpSt} value={cell.mode}
                                  onChange={e => setCell(jour, si, "mode", e.target.value)}>
                                  <option value="PRESENTIEL">Présentiel</option>
                                  <option value="DISTANCIEL">Distanciel</option>
                                </select>
                              </div>
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
            <button className="btn-primary" type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Enregistrement…" : <>{Ico.check} Enregistrer l'emploi du temps</>}
            </button>
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
  const [loading, setLoading]         = useState(true);
  const [showModal, setModal]         = useState(false);
  const [emploiActif, setEmploiActif] = useState(null);
  const [alert, setAlert]             = useState(null);

  const flash = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gRes, eRes] = await Promise.allSettled([
        axios.get("/pole-groupes"),
        axios.get("/emplois"),
      ]);
      if (gRes.status === "fulfilled") {
        const d = gRes.value.data;
        setGroupes(Array.isArray(d) ? d : (d.data ?? []));
      }
      if (eRes.status === "fulfilled") {
        const d = eRes.value.data;
        setEmplois(Array.isArray(d) ? d : (d.data ?? []));
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
      {/* EN-TÊTE */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Emplois du temps</div>
          <div className="pg-subtitle">
            {emplois.length} emploi{emplois.length > 1 ? "s" : ""} créé{emplois.length > 1 ? "s" : ""}
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn-primary" onClick={() => setModal(true)}>
            {Ico.plus} Nouvel emploi du temps
          </button>
        </div>
      </div>

      {/* ALERTE */}
      {alert && (
        <div className={`al-alert al-alert-${alert.type}`}>
          {alert.type === "ok" ? Ico.check : Ico.alert} {alert.msg}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <ModalCreerEmploi
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); fetchAll(); flash("Emploi du temps créé."); }}
          groupes={groupes}
        />
      )}

      {/* LOADER */}
      {loading && (
        <div className="loader"><div className="loader-spinner" /><span>Chargement…</span></div>
      )}

      {/* CARTES EMPLOIS */}
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
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--sl8)" }}>{e.groupe}</div>
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
                {Ico.cal} <span style={{ marginLeft: 4 }}>{e.periodeDebut ?? e.periode_debut ?? "—"}</span>
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

      {/* EMPTY */}
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

      {/* AFFICHAGE EMPLOI ACTIF */}
      {emploiActif && (
        <div className="table-card" style={{ padding: 0 }}>
          {/* Header emploi */}
          <div style={{
            background: "var(--p6)", padding: "14px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-hd)" }}>
                EMPLOI DU TEMPS — {emploiActif.efp ?? "ISTA HAY SALAM SALE"}
              </div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginTop: 2 }}>
                Année 2025-2026 · Période : {emploiActif.periodeDebut ?? emploiActif.periode_debut ?? "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ height: 32, fontSize: 12, background: "rgba(255,255,255,.12)", color: "white", border: "1px solid rgba(255,255,255,.2)" }}
                onClick={() => window.print()}>
                {Ico.print} Imprimer
              </button>
              <button className="btn-secondary" style={{ height: 32, fontSize: 12, background: "rgba(255,255,255,.12)", color: "white", border: "1px solid rgba(255,255,255,.2)" }}
                onClick={() => setEmploiActif(null)}>
                {Ico.close} Fermer
              </button>
            </div>
          </div>

          {/* Barre infos */}
          <div style={{
            background: "var(--sl0)", padding: "8px 20px",
            fontSize: 12, color: "var(--sl6)",
            borderBottom: "1px solid var(--border)",
            display: "flex", gap: 16,
          }}>
            <span>EFP : <strong>ISTA HAY SALAM SALE</strong></span>
            <span>Filière : <strong>{emploiActif.filiere ?? "—"}</strong></span>
            <span>Groupe : <strong style={{ color: "var(--p6)" }}>{emploiActif.groupe}</strong></span>
            {emploiActif.semestre && (
              <span className={`badge ${emploiActif.semestre === "S1" ? "badge-info" : "badge-purple"}`}>
                {emploiActif.semestre}
              </span>
            )}
          </div>

          {/* Table grille */}
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

          {/* Footer */}
          <div style={{
            padding: "10px 20px", background: "var(--sl0)", borderTop: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: "var(--sl5)",
          }}>
            <span>Le Directeur · Fait à Salé · Date : {emploiActif.periodeDebut ?? emploiActif.periode_debut}</span>
            <span>ISTA HAY SALAM SALE</span>
          </div>
        </div>
      )}
    </div>
  );
}