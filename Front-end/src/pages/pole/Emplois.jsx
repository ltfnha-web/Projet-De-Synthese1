import { useState, useEffect } from "react";
import axios from "axios";
import { DocumentOFPPT, DocumentFormateurOFPPT, openPrintWindow } from "../../components/PrintDocOFPPT";
import { useConfirm } from "../../hooks/useConfirm";

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
  { label: "Séance 1", horaire: "08:30-11:00" },
  { label: "Séance 2", horaire: "11:00-13:30" },
  { label: "Séance 3", horaire: "13:30-16:00" },
  { label: "Séance 4", horaire: "16:00-18:30" },
];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const NIVEAUX_COL1 = ["Technicien Spécialisé", "Technicien", "Qualification", "Spécialisation"];
const NIVEAUX_COL2 = ["Formation Qualifiante", "Bac Pro", "Parcours Collégial"];

const Ico = {
  plus:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  print: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  cal:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  table: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
};

function calcNbHeures(jours) {
  if (!jours) return 0;
  let count = 0;
  Object.values(jours).forEach(seances => {
    if (Array.isArray(seances)) seances.forEach(s => { if (s && s.module) count++; });
  });
  return count * 2.5;
}

/* ═══════════════════════════════════════════════════════════════
   MINI PLANNING PREVIEW
═══════════════════════════════════════════════════════════════ */
function MiniPlanningPreview({ plannings, groupeId, semestre }) {
  const filtered = plannings.filter(p => String(p.groupe_id) === String(groupeId) && p.semestre === semestre);
  if (!groupeId) return <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--sp-gray-400)", fontSize: 12 }}>Sélectionnez un groupe</div>;
  if (filtered.length === 0) return <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--sp-gray-400)", fontSize: 12 }}>Aucun planning pour ce groupe en {semestre}</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "var(--sp-gray-100)", borderBottom: "2px solid var(--sp-border)" }}>
            {["Module","Formateur","MH","H/sem","Avct"].map((h, i) => (
              <th key={h} style={{ padding: "8px 10px", textAlign: i < 2 ? "left" : "center", fontSize: 10, fontWeight: 700, color: "var(--sp-gray-600)", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => {
            const pct = p.mh_drif ? Math.min(100, p.avce ?? (((p.mh_realisee_module ?? 0) / p.mh_drif) * 100)) : 0;
            const bc = pct >= 90 ? "#7c3aed" : pct >= 60 ? "#0891b2" : pct >= 30 ? "#d97706" : "#dc2626";
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--sp-border)", background: i % 2 === 0 ? "#fff" : "var(--sp-gray-100)" }}>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ fontWeight: 600, fontSize: 11 }}>{toStr(p.module_nom)}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, display: "inline-block", marginTop: 2, background: p.semestre === "S1" ? "#eff6ff" : "#f5f3ff", color: p.semestre === "S1" ? "#1d4ed8" : "#7c3aed" }}>{p.semestre}</span>
                </td>
                <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--sp-gray-600)" }}>{toStr(p.formateur_nom)}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, fontSize: 12 }}>{p.mh_drif}h</td>
                <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, fontSize: 11 }}>{parseFloat(p.charge_hebdo) || (parseFloat(p.mh_drif) / 23).toFixed(1)}h</td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <div style={{ width: 38, height: 4, background: "var(--sp-gray-200)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: bc }} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: bc, minWidth: 26 }}>{pct.toFixed(0)}%</span>
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

/* ═══════════════════════════════════════════════════════════════
   MODAL EMPLOI FORMATEUR
═══════════════════════════════════════════════════════════════ */
function ModalFormateurTimetable({ onClose, formateurs, onSaved }) {
  const [formateurId, setFormateurId] = useState("");
  const [semestre, setSemestre]       = useState("S1");
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);
  const [saved, setSaved]             = useState(false);
  const [signataire, setSignataire]   = useState("");

  const generate = async () => {
    if (!formateurId) return;
    setLoading(true); setError(null); setData(null); setSaved(false);
    try {
      const { data: res } = await axios.get(`/emplois/formateur/${formateurId}`);
      setData(res.data ?? res);
    } catch {
      setError("Erreur lors de la génération.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formateurId || !grille) return;
    setSaving(true); setError(null);
    try {
      await axios.post("/formateur-emplois", { formateur_id: formateurId, semestre, signataire_nom: signataire || null });
      setSaved(true);
      onSaved?.();
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const nom = formateurs.find(f => String(f.id) === String(formateurId))?.nom ?? "";
    openPrintWindow("formateur-doc-content", `Emploi du temps — ${nom}`);
  };

  const grille = data?.grille ?? null;
  const hasAny = grille && JOURS.some(j => (grille[j] ?? []).some(Boolean));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ alignItems: "flex-start", paddingTop: 32, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: "0 12px", background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", overflow: "hidden" }}>
        <div style={{ background: "var(--sp-black)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Emploi du temps — Formateur</div>
          <button className="sp-btn sp-btn--secondary" onClick={onClose} style={{ height: 28, padding: "0 10px", fontSize: 12 }}>{Ico.close} Fermer</button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 18 }}>
            <div className="sp-form-group" style={{ flex: 1, minWidth: 180 }}>
              <label className="sp-form-label">Formateur</label>
              <select className="sp-form-control" value={formateurId} onChange={e => setFormateurId(e.target.value)}>
                <option value="">Sélectionner un formateur</option>
                {formateurs.map(f => <option key={f.id} value={f.id}>{toStr(f.nom)}</option>)}
              </select>
            </div>
            <div className="sp-form-group" style={{ width: 100 }}>
              <label className="sp-form-label">Semestre</label>
              <select className="sp-form-control" value={semestre} onChange={e => setSemestre(e.target.value)}>
                <option>S1</option><option>S2</option>
              </select>
            </div>
            <div className="sp-form-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="sp-form-label">
                Signataire — Nom &amp; Prénom&nbsp;<span style={{ fontWeight: 400, color: "var(--sp-gray-400)", fontSize: 10 }}>(optionnel)</span>
              </label>
              <input type="text" className="sp-form-control" placeholder="Nom & Prénom du signataire…" value={signataire} onChange={e => setSignataire(e.target.value)} />
            </div>
            <button className="sp-btn sp-btn--primary" onClick={generate} disabled={!formateurId || loading}>
              {loading ? "Génération…" : <>{Ico.cal} Générer</>}
            </button>
            {hasAny && !saved && (
              <button className="sp-btn sp-btn--secondary" onClick={handleSave} disabled={saving}>
                {saving ? "Sauvegarde…" : <>{Ico.check} Sauvegarder</>}
              </button>
            )}
            {saved && (
              <span style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
                {Ico.check} Sauvegardé
              </span>
            )}
            {hasAny && (
              <button className="sp-btn sp-btn--secondary" onClick={handlePrint}>
                {Ico.print} Imprimer
              </button>
            )}
          </div>
          {error && <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: 6, marginBottom: 14, fontSize: 12 }}>{error}</div>}
          {grille && !hasAny && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--sp-gray-400)" }}>Aucune séance trouvée.</div>}
          {grille && hasAny && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ background: "var(--sp-black)", color: "#fff", padding: "10px 12px", border: "1px solid #333", width: 80, fontSize: 11 }}>Jour</th>
                    {SEANCES.map((s, i) => (
                      <th key={i} style={{ background: "var(--sp-black)", color: "#fff", padding: "8px 12px", textAlign: "center", border: "1px solid #333" }}>
                        <div style={{ fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.6 }}>{s.horaire}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JOURS.map((jour, ji) => (
                    <tr key={jour} style={{ background: ji % 2 === 0 ? "#fff" : "var(--sp-gray-100)" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "1px solid var(--sp-border)" }}>{jour}</td>
                      {[0,1,2,3].map(si => {
                        const cell = (grille[jour] ?? [])[si];
                        if (!cell) return <td key={si} style={{ padding: "10px 12px", textAlign: "center", color: "var(--sp-gray-400)", border: "1px solid var(--sp-border)" }}>—</td>;
                        return (
                          <td key={si} style={{ padding: "8px 12px", verticalAlign: "top", border: "1px solid var(--sp-border)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{toStr(cell.module)}</div>
                            <div style={{ fontSize: 11, color: "var(--sp-green)", marginBottom: 2 }}>Groupe {toStr(cell.groupe)}</div>
                            <div style={{ fontSize: 10, color: "var(--sp-gray-600)" }}>{cell.salle || ""} {cell.mode === "DISTANCIEL" ? "DIST." : "PRÉS."}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hidden render used by handlePrint — same mechanism as emploi-doc-content */}
          {grille && hasAny && (
            <div id="formateur-doc-content" style={{ display: "none" }}>
              <DocumentFormateurOFPPT
                nom={formateurs.find(f => String(f.id) === String(formateurId))?.nom ?? "—"}
                annee="2025-2026"
                semestre={semestre}
                periodeDebut={new Date().toLocaleDateString("fr-FR")}
                grille={grille}
                signataire={signataire}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL CRÉER EMPLOI — flux en 2 étapes
   Étape 1 : choisir groupe + semaine
   Étape 2 : assigner les créneaux aux modules planifiés
═══════════════════════════════════════════════════════════════ */
function ModalCreerEmploi({ onClose, onSaved, groupes, plannings = [], semainesAnnee = [] }) {
  const [step, setStep]                     = useState(1);
  const [groupeId, setGroupeId]             = useState("");
  const [semaineNum, setSemaineNum]         = useState("");
  const [planningModules, setPlanModules]   = useState([]);
  const [slots, setSlots]                   = useState({});
  const [availableSalles, setAvail]         = useState({});
  const [formateurs, setFormateurs]         = useState([]);
  const [form, setForm]                     = useState({ formateur_parrain: "", signataire_nom: "" });
  const [loadingModules, setLoadingModules] = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedGroupe  = groupes.find(g => String(g.id) === String(groupeId));
  const selectedSemaine = semainesAnnee.find(s => s.num === Number(semaineNum));
  const semestre        = selectedSemaine ? (selectedSemaine.semestre === 1 ? "S1" : "S2") : "S1";

  useEffect(() => {
    axios.get("/pole-formateurs").then(({ data }) => setFormateurs(data.data ?? data ?? [])).catch(() => {});
  }, []);

  const fetchPlanningModules = async () => {
    if (!groupeId || !semaineNum) return;
    setLoadingModules(true);
    try {
      const { data } = await axios.get(`/plannings-semaine?groupe_id=${groupeId}&semaine_num=${semaineNum}`);
      const modules = data.data ?? [];
      setPlanModules(modules);
      const initial = {};
      modules.forEach(p => {
        initial[p.planning_id] = Array.from({ length: p.nb_seances }, () => ({
          jour: "", seance: "", salle: "", salle_id: null, mode: "PRESENTIEL",
        }));
      });
      setSlots(initial);
    } catch { setPlanModules([]); }
    finally { setLoadingModules(false); }
  };

  const handleContinue = async () => {
    if (!groupeId)   { setError("Choisir un groupe."); return; }
    if (!semaineNum) { setError("Choisir une semaine."); return; }
    setError(null);
    await fetchPlanningModules();
    setStep(2);
  };

  const fetchAvailableSalles = async (jour) => {
    if (!jour || availableSalles[jour]) return;
    try {
      const { data } = await axios.get(`/salles/disponibles?jour=${encodeURIComponent(jour)}&semestre=${semestre}`);
      setAvail(prev => ({ ...prev, [jour]: data.data ?? [] }));
    } catch { setAvail(prev => ({ ...prev, [jour]: [] })); }
  };

  const updateSlot = (planId, idx, field, value) => {
    setSlots(prev => {
      const arr = [...(prev[planId] ?? [])];
      arr[idx] = { ...arr[idx], [field]: value };
      if (field === "salle_id") {
        const found = (availableSalles[arr[idx].jour] ?? []).find(s => String(s.id) === String(value));
        arr[idx].salle = found ? found.nom : "";
      }
      if (field === "jour" && value) fetchAvailableSalles(value);
      return { ...prev, [planId]: arr };
    });
  };

  const handleSubmit = async () => {
    if (!groupeId) { setError("Choisir un groupe."); return; }
    setSaving(true); setError(null);

    const grille = {};
    JOURS.forEach(j => { grille[j] = [null, null, null, null]; });

    for (const [planId, planSlots] of Object.entries(slots)) {
      const plan = planningModules.find(p => String(p.planning_id) === planId);
      if (!plan) continue;
      for (const slot of planSlots) {
        if (!slot.jour || slot.seance === "" || slot.seance == null) continue;
        const si = Number(slot.seance);
        if (grille[slot.jour][si] !== null) continue;
        grille[slot.jour][si] = {
          module: plan.module_nom, module_id: plan.module_id,
          formateur: plan.formateur_nom, formateur_id: plan.formateur_id,
          salle: slot.salle, salle_id: slot.salle_id, mode: slot.mode,
        };
      }
    }

    try {
      await axios.post("/emplois", {
        groupe:             toStr(selectedGroupe?.nom ?? `Groupe ${groupeId}`),
        groupe_id:          Number(groupeId),
        date_debut:         selectedSemaine?.date_lundi ?? new Date().toISOString().split("T")[0],
        semestre,
        semaine_num:        Number(semaineNum),
        grille,
        formateur_parrain:  form.formateur_parrain || null,
        signataire_nom:     form.signataire_nom    || null,
      });
      onSaved();
    } catch (e) {
      setError(
        e.response?.data?.message
        || (e.response?.data?.conflicts ? e.response.data.conflicts.join(" | ") : null)
        || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" | ") : null)
        || "Erreur lors de l'enregistrement. Vérifiez les conflits de salles ou de formateurs."
      );
    } finally { setSaving(false); }
  };

  const selSt = { width: "100%", padding: "5px 8px", border: "1px solid var(--sp-border)", borderRadius: 5, fontSize: 11, background: "#fff", outline: "none", boxSizing: "border-box" };

  /* ── ÉTAPE 1 ─────────────────────────────────────────────── */
  if (step === 1) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 540, background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", overflow: "hidden", border: "1px solid var(--sp-border)" }}>
          <div style={{ background: "var(--sp-black)", padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Créer un emploi du temps</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginTop: 2 }}>Étape 1 / 2 — Groupe et semaine</div>
            </div>
            <button className="sp-btn sp-btn--secondary" onClick={onClose} style={{ height: 28, padding: "0 10px", fontSize: 12 }}>{Ico.close}</button>
          </div>

          <div style={{ padding: "24px 24px" }}>
            {error && <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: 6, marginBottom: 16, fontSize: 12 }}>{Ico.alert} {error}</div>}

            <div className="sp-form-group" style={{ marginBottom: 18 }}>
              <label className="sp-form-label">Groupe *</label>
              <select className="sp-form-control" value={groupeId} onChange={e => { setGroupeId(e.target.value); setSemaineNum(""); }}>
                <option value="">Sélectionner un groupe</option>
                {groupes.map(g => <option key={g.id} value={g.id}>{toStr(g.nom ?? `Groupe ${g.id}`)}{g.filiere ? ` — ${g.filiere}` : ""}</option>)}
              </select>
            </div>

            <div className="sp-form-group" style={{ marginBottom: 18 }}>
              <label className="sp-form-label">Semaine *</label>
              {semainesAnnee.length === 0 ? (
                <div style={{ padding: "10px 14px", background: "#fef9c3", color: "#a16207", borderRadius: 6, fontSize: 12 }}>
                  Aucune semaine disponible. Vérifiez que le planning est configuré.
                </div>
              ) : (
                <select className="sp-form-control" value={semaineNum} onChange={e => setSemaineNum(e.target.value)}>
                  <option value="">Sélectionner une semaine</option>
                  {[1, 2].map(sem => {
                    const semWeeks = semainesAnnee.filter(s => s.semestre === sem);
                    if (semWeeks.length === 0) return null;
                    return (
                      <optgroup key={sem} label={sem === 1 ? "Semestre 1" : "Semestre 2"}>
                        {semWeeks.map(s => {
                          const d   = new Date(s.date_lundi);
                          const fmt = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
                          return <option key={s.num} value={s.num}>Semaine {s.num} — {fmt}</option>;
                        })}
                      </optgroup>
                    );
                  })}
                </select>
              )}
            </div>

            {selectedSemaine && (
              <div style={{ padding: "10px 14px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 7, marginBottom: 18, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: "#0369a1", marginBottom: 2 }}>Semaine {selectedSemaine.num} · {semestre}</div>
                <div style={{ color: "#0284c7" }}>
                  Du lundi {new Date(selectedSemaine.date_lundi).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--sp-border)" }}>
              <button className="sp-btn sp-btn--secondary" type="button" onClick={onClose}>Annuler</button>
              <button className="sp-btn sp-btn--primary" type="button" onClick={handleContinue} disabled={!groupeId || !semaineNum || loadingModules}>
                {loadingModules ? "Chargement…" : "Continuer →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── ÉTAPE 2 ─────────────────────────────────────────────── */
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ alignItems: "flex-start", paddingTop: 24, paddingBottom: 24, overflowY: "auto" }}>
      <div style={{ display: "flex", gap: 14, width: "100%", maxWidth: 1200, alignItems: "flex-start", margin: "0 auto", padding: "0 12px" }}>

        {/* Main panel */}
        <div style={{ flex: "1 1 800px", background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", overflow: "hidden", border: "1px solid var(--sp-border)" }}>
          <div style={{ background: "var(--sp-black)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Créer un emploi du temps</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginTop: 2 }}>
                {toStr(selectedGroupe?.nom)} · Semaine {semaineNum} · {semestre}
              </div>
            </div>
            <button className="sp-btn sp-btn--secondary" onClick={onClose} style={{ height: 28, padding: "0 10px", fontSize: 12 }}>{Ico.close}</button>
          </div>

          <div style={{ padding: "20px 22px" }}>
            {error && <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: 6, marginBottom: 14, fontSize: 12 }}>{Ico.alert} {error}</div>}

            <button type="button" onClick={() => { setStep(1); setError(null); }}
              style={{ fontSize: 12, color: "#0369a1", background: "none", border: "none", cursor: "pointer", padding: "0 0 16px 0", display: "inline-flex", alignItems: "center", gap: 5 }}>
              ← Étape précédente
            </button>

            {planningModules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--sp-gray-400)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Aucun module planifié pour cette semaine</div>
                <div style={{ fontSize: 12 }}>Vérifiez que des heures sont prévues (MH &gt; 0) pour la semaine {semaineNum} dans le planning de ce groupe.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sp-gray-600)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>
                  {planningModules.length} module{planningModules.length > 1 ? "s" : ""} planifié{planningModules.length > 1 ? "s" : ""} — assignez les créneaux
                </div>

                {planningModules.map(p => {
                  const planSlots = slots[p.planning_id] ?? [];
                  return (
                    <div key={p.planning_id} style={{ border: "1px solid var(--sp-border)", borderRadius: 8, marginBottom: 14, overflow: "hidden" }}>
                      <div style={{ background: "var(--sp-gray-100)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--sp-border)" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--sp-black)", marginBottom: 3 }}>{p.module_nom}</div>
                          <div style={{ fontSize: 11, color: "var(--sp-gray-600)", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 600 }}>{p.formateur_nom}</span>
                            <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: "var(--sp-green-light)", color: "var(--sp-green)" }}>AUTO</span>
                            {p.mh_prevue > 0 && (
                              <span style={{ padding: "1px 7px", background: "#dcfce7", color: "#16a34a", borderRadius: 10, fontWeight: 700, fontSize: 10 }}>
                                {p.mh_prevue}h prévues · {p.nb_seances} séance{p.nb_seances > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: p.semestre === "S1" ? "#eff6ff" : "#f5f3ff", color: p.semestre === "S1" ? "#1d4ed8" : "#7c3aed", border: `1px solid ${p.semestre === "S1" ? "#bfdbfe" : "#ddd6fe"}` }}>
                          {p.semestre}
                        </span>
                      </div>

                      <div style={{ padding: "12px 16px" }}>
                        {planSlots.map((slot, idx) => {
                          const sallesList = availableSalles[slot.jour];
                          return (
                            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: idx < planSlots.length - 1 ? 10 : 0, padding: "10px 12px", background: slot.jour && slot.seance !== "" ? "#f0f9ff" : "#f8fafc", borderRadius: 6, border: `1px solid ${slot.jour && slot.seance !== "" ? "#bae6fd" : "transparent"}` }}>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sp-gray-600)", marginBottom: 4 }}>Jour *</div>
                                <select style={selSt} value={slot.jour} onChange={e => updateSlot(p.planning_id, idx, "jour", e.target.value)}>
                                  <option value="">Jour…</option>
                                  {JOURS.map(j => <option key={j}>{j}</option>)}
                                </select>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sp-gray-600)", marginBottom: 4 }}>Séance *</div>
                                <select style={selSt} value={slot.seance} onChange={e => updateSlot(p.planning_id, idx, "seance", e.target.value)}>
                                  <option value="">Séance…</option>
                                  {SEANCES.map((s, i) => <option key={i} value={i}>{s.label} · {s.horaire}</option>)}
                                </select>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sp-gray-600)", marginBottom: 4 }}>Mode</div>
                                <select style={selSt} value={slot.mode} onChange={e => updateSlot(p.planning_id, idx, "mode", e.target.value)}>
                                  <option value="PRESENTIEL">Présentiel</option>
                                  <option value="DISTANCIEL">À distance</option>
                                </select>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sp-gray-600)", marginBottom: 4 }}>Salle</div>
                                {slot.mode === "DISTANCIEL" ? (
                                  <div style={{ padding: "5px 8px", fontSize: 10, color: "#0891b2", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5 }}>En ligne</div>
                                ) : sallesList === undefined ? (
                                  <input type="text" style={selSt} placeholder="Cliquer pour charger…" value={slot.salle}
                                    onClick={() => slot.jour && fetchAvailableSalles(slot.jour)}
                                    onChange={e => updateSlot(p.planning_id, idx, "salle", e.target.value)} />
                                ) : (
                                  <select style={selSt} value={slot.salle_id ?? ""} onChange={e => updateSlot(p.planning_id, idx, "salle_id", e.target.value)}>
                                    <option value="">Salle…</option>
                                    {sallesList.length === 0 && <option disabled>Aucune salle disponible</option>}
                                    {sallesList.map(s => <option key={s.id} value={s.id}>{s.nom}{s.capacite ? ` (${s.capacite})` : ""}</option>)}
                                  </select>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
              <div className="sp-form-group">
                <label className="sp-form-label">Formateur Parrain <span style={{ fontWeight: 400, color: "var(--sp-gray-400)", fontSize: 10 }}>(optionnel)</span></label>
                <select className="sp-form-control" value={form.formateur_parrain} onChange={e => setF("formateur_parrain", e.target.value)}>
                  <option value="">— Aucun —</option>
                  {formateurs.map(f => <option key={f.id} value={toStr(f.nom)}>{toStr(f.nom)}</option>)}
                </select>
              </div>
              <div className="sp-form-group">
                <label className="sp-form-label">Signataire <span style={{ fontWeight: 400, color: "var(--sp-gray-400)", fontSize: 10 }}>(optionnel)</span></label>
                <input type="text" className="sp-form-control" placeholder="Nom & Prénom du signataire…" value={form.signataire_nom} onChange={e => setF("signataire_nom", e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: "1px solid var(--sp-border)", marginTop: 16 }}>
              <button className="sp-btn sp-btn--secondary" type="button" onClick={onClose}>Annuler</button>
              <button className="sp-btn sp-btn--primary" type="button" onClick={handleSubmit} disabled={saving || planningModules.length === 0}>
                {saving ? "Enregistrement…" : <>{Ico.check} Enregistrer</>}
              </button>
            </div>
          </div>
        </div>

        {/* Planning preview sidebar */}
        <div style={{ flex: "0 0 290px", background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", border: "1px solid var(--sp-border)", overflow: "hidden", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "var(--sp-black)", padding: "12px 16px", flexShrink: 0 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Planning de référence</div>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginTop: 2 }}>
              {selectedGroupe ? toStr(selectedGroupe.nom) : "Aucun groupe"} · {semestre}
            </div>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <MiniPlanningPreview plannings={plannings} groupeId={groupeId} semestre={semestre} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL — VOIR UN EMPLOI FORMATEUR SAUVEGARDÉ
═══════════════════════════════════════════════════════════════ */
function ModalViewFormateurEmploi({ record, onClose, onDelete }) {
  const grille = record.grille ?? null;
  const hasAny = grille && JOURS.some(j => (grille[j] ?? []).some(Boolean));
  const [signataire, setSignataire] = useState(record.signataire_nom ?? "");
  const [confirm, ConfirmDialog] = useConfirm();

  const handlePrint = () => {
    openPrintWindow("saved-fmt-doc-content", `Emploi du temps — ${toStr(record.formateur)}`);
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Supprimer l'emploi de ${toStr(record.formateur)} ?`,
      message: "L'emploi du temps enregistré sera définitivement supprimé. Cette action est irréversible.",
      confirmLabel: "Supprimer",
      variant: "danger",
    });
    if (ok) onDelete(record.id);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ alignItems: "flex-start", paddingTop: 32, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: "0 12px", background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "var(--sp-black)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{toStr(record.formateur)} · {record.semestre}</div>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginTop: 2 }}>Sauvegardé le {record.created_at}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {hasAny && (
              <button className="sp-btn sp-btn--secondary" onClick={handlePrint} style={{ height: 28, padding: "0 10px", fontSize: 12 }}>
                {Ico.print} Imprimer
              </button>
            )}
            <button
              className="sp-btn sp-btn--secondary"
              onClick={handleDelete}
              style={{ height: 28, padding: "0 10px", fontSize: 12, color: "#dc2626", borderColor: "#dc2626" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              {" "}Supprimer
            </button>
            <button className="sp-btn sp-btn--secondary" onClick={onClose} style={{ height: 28, padding: "0 10px", fontSize: 12 }}>{Ico.close} Fermer</button>
          </div>
        </div>
        {ConfirmDialog}

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>
          <div className="sp-form-group" style={{ maxWidth: 380, marginBottom: 18 }}>
            <label className="sp-form-label">
              Signataire — Nom &amp; Prénom&nbsp;<span style={{ fontWeight: 400, color: "var(--sp-gray-400)", fontSize: 10 }}>(optionnel, pour le pied de page)</span>
            </label>
            <input type="text" className="sp-form-control" placeholder="Nom & Prénom du signataire…" value={signataire} onChange={e => setSignataire(e.target.value)} />
          </div>
          {!hasAny && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--sp-gray-400)" }}>Aucune séance enregistrée.</div>}
          {hasAny && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ background: "var(--sp-black)", color: "#fff", padding: "10px 12px", border: "1px solid #333", width: 80, fontSize: 11 }}>Jour</th>
                    {SEANCES.map((s, i) => (
                      <th key={i} style={{ background: "var(--sp-black)", color: "#fff", padding: "8px 12px", textAlign: "center", border: "1px solid #333" }}>
                        <div style={{ fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.6 }}>{s.horaire}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JOURS.map((jour, ji) => (
                    <tr key={jour} style={{ background: ji % 2 === 0 ? "#fff" : "var(--sp-gray-100)" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "1px solid var(--sp-border)" }}>{jour}</td>
                      {[0,1,2,3].map(si => {
                        const cell = (grille[jour] ?? [])[si];
                        if (!cell) return <td key={si} style={{ padding: "10px 12px", textAlign: "center", color: "var(--sp-gray-400)", border: "1px solid var(--sp-border)" }}>—</td>;
                        return (
                          <td key={si} style={{ padding: "8px 12px", verticalAlign: "top", border: "1px solid var(--sp-border)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{toStr(cell.module)}</div>
                            <div style={{ fontSize: 11, color: "var(--sp-green)", marginBottom: 2 }}>Groupe {toStr(cell.groupe)}</div>
                            <div style={{ fontSize: 10, color: "var(--sp-gray-600)" }}>{cell.salle || ""} {cell.mode === "DISTANCIEL" ? "DIST." : "PRÉS."}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hidden div for print capture */}
          {hasAny && (
            <div id="saved-fmt-doc-content" style={{ display: "none" }}>
              <DocumentFormateurOFPPT
                nom={toStr(record.formateur)}
                annee="2025-2026"
                semestre={record.semestre}
                periodeDebut={record.created_at}
                grille={grille}
                signataire={signataire}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL MODIFIER UN EMPLOI EXISTANT
   Charge la grille existante et permet de la modifier
═══════════════════════════════════════════════════════════════ */
function ModalModifierEmploi({ emploi, onClose, onSaved, groupes, plannings = [] }) {
  // Initialiser la grille depuis l'emploi existant (jours = grille JSON)
  const [grille, setGrille] = useState(() => {
    const base = {};
    JOURS.forEach(j => { base[j] = [null, null, null, null]; });
    if (emploi?.jours) {
      JOURS.forEach(j => { if (Array.isArray(emploi.jours[j])) base[j] = [...emploi.jours[j]]; });
    }
    return base;
  });

  const [modules, setModules]           = useState([]);
  const [formateurs, setFormateurs]     = useState([]);
  const [availableSalles, setAvail]     = useState({});
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);
  const [formateurParrain, setFmtParrain] = useState(emploi?.formateur_parrain ?? "");
  const [signataire, setSignataire]     = useState(emploi?.signataire_nom ?? "");

  useEffect(() => {
    axios.get("/pole-formateurs").then(({ data }) => setFormateurs(data.data ?? data ?? [])).catch(() => {});
    if (emploi?.groupe_id) {
      axios.get(`/pole-modules?groupe_id=${emploi.groupe_id}`).then(({ data }) => setModules(data.data ?? data ?? [])).catch(() => {});
    }
  }, [emploi]);

  const fetchAvailableSalles = async (jour) => {
    if (availableSalles[jour]) return;
    try {
      const { data } = await axios.get(`/salles/disponibles?jour=${encodeURIComponent(jour)}&semestre=${emploi.semestre}`);
      setAvail(prev => ({ ...prev, [jour]: data.data ?? [] }));
    } catch { setAvail(prev => ({ ...prev, [jour]: [] })); }
  };

  const setCell = (jour, si, field, value) => {
    setGrille(prev => {
      const next = { ...prev };
      const row = [...(next[jour] || [null, null, null, null])];
      if (!row[si]) row[si] = { module: "", formateur: "", salle: "", mode: "PRESENTIEL" };
      else row[si] = { ...row[si] };
      row[si][field] = value;
      if (field === "module") {
        if (value) {
          const mod = modules.find(m => toStr(m.intitule ?? m.code) === value);
          if (mod?.formateur_id) {
            const fmt = formateurs.find(f => String(f.id) === String(mod.formateur_id));
            row[si].formateur = fmt ? toStr(fmt.nom) : "";
            row[si].formateur_id = mod.formateur_id;
          } else { row[si].formateur = ""; row[si].formateur_id = null; }
          row[si].module_id = mod?.id ?? null;
        } else { row[si] = null; }
      }
      if (field === "salle_id") {
        const found = (availableSalles[jour] ?? []).find(s => String(s.id) === String(value));
        row[si].salle = found ? found.nom : "";
        row[si].salle_id = found ? found.id : null;
      }
      next[jour] = row;
      return next;
    });
  };

  const clearCell = (jour, si) => setGrille(prev => {
    const next = { ...prev }; const row = [...(next[jour] || [])]; row[si] = null; next[jour] = row; return next;
  });

  const addCell = (jour, si) => {
    fetchAvailableSalles(jour);
    setGrille(prev => {
      const next = { ...prev };
      const row = [...(next[jour] || [null, null, null, null])];
      row[si] = { module: "", formateur: "", salle: "", salle_id: null, mode: "PRESENTIEL" };
      next[jour] = row; return next;
    });
  };

  const handleSubmit = async () => {
    setSaving(true); setError(null);
    try {
      await axios.put(`/emplois/${emploi.id}`, { grille, semestre: emploi.semestre, formateur_parrain: formateurParrain || null, signataire_nom: signataire || null });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message
        || (e.response?.data?.conflicts ? e.response.data.conflicts.join(" | ") : null)
        || "Erreur inconnue");
    } finally { setSaving(false); }
  };

  const inpSt = { width: "100%", padding: "5px 8px", border: "1px solid var(--sp-border)", borderRadius: 6, fontSize: 11, background: "var(--sp-gray-100)", color: "var(--sp-black)", outline: "none", boxSizing: "border-box" };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ alignItems: "flex-start", paddingTop: 24, paddingBottom: 24, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", padding: "0 12px", background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", overflow: "hidden", border: "1px solid var(--sp-border)" }}>

        <div style={{ background: "var(--sp-black)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Modifier l'emploi du temps — {toStr(emploi.groupe)}</div>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginTop: 2 }}>{emploi.semestre} · Modifiez les séances puis enregistrez</div>
          </div>
          <button className="sp-btn sp-btn--secondary" onClick={onClose} style={{ height: 28, padding: "0 10px", fontSize: 12 }}>{Ico.close}</button>
        </div>

        <div style={{ padding: "20px 22px" }}>
          {error && <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: 6, marginBottom: 14, fontSize: 12 }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div className="sp-form-group">
              <label className="sp-form-label">
                Formateur Parrain&nbsp;<span style={{ fontWeight: 400, color: "var(--sp-gray-400)", fontSize: 10 }}>(optionnel)</span>
              </label>
              <select className="sp-form-control" value={formateurParrain} onChange={e => setFmtParrain(e.target.value)}>
                <option value="">— Aucun —</option>
                {formateurs.map(f => <option key={f.id} value={toStr(f.nom)}>{toStr(f.nom)}</option>)}
              </select>
            </div>
            <div className="sp-form-group">
              <label className="sp-form-label">
                Signataire (pied de page)&nbsp;<span style={{ fontWeight: 400, color: "var(--sp-gray-400)", fontSize: 10 }}>(optionnel)</span>
              </label>
              <input type="text" className="sp-form-control" placeholder="Nom & Prénom du signataire…" value={signataire} onChange={e => setSignataire(e.target.value)} />
            </div>
          </div>

          {/* Grille horaire */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ background: "#1e293b", color: "#fff", padding: "10px 14px", border: "1px solid #0f172a", width: 88, fontSize: 11, fontWeight: 700, textAlign: "left" }}>Jour</th>
                  {SEANCES.map((s, i) => (
                    <th key={i} style={{ background: "#1e293b", color: "#fff", padding: "10px 14px", textAlign: "center", border: "1px solid #0f172a" }}>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{s.label}</div>
                      <div style={{ fontWeight: 400, fontSize: 10, color: "rgba(255,255,255,.55)", marginTop: 2 }}>{s.horaire}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JOURS.map((jour, ji) => (
                  <tr key={jour}>
                    <td style={{ padding: "10px 14px", fontWeight: 800, fontSize: 12, background: "#f8fafc", border: "1px solid var(--sp-border)", color: "#1e293b", letterSpacing: .3 }}>{jour}</td>
                    {[0, 1, 2, 3].map(si => {
                      const cell = (grille[jour] ?? [])[si];
                      const list = availableSalles[jour];
                      const hasModule = cell && toStr(cell.module);
                      return (
                        <td key={si} style={{ padding: 6, verticalAlign: "top", border: "1px solid var(--sp-border)", minWidth: 170, background: hasModule ? "#f0f9ff" : (ji % 2 === 0 ? "#fff" : "#f8fafc") }}>
                          {cell ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              {hasModule && (
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", padding: "3px 7px", background: "#e0f2fe", borderRadius: 4, border: "1px solid #bae6fd", marginBottom: 2 }}>
                                  {toStr(cell.module)}
                                </div>
                              )}
                              <select style={{ ...inpSt, fontSize: 10, borderColor: hasModule ? "#7dd3fc" : "var(--sp-border)" }} value={toStr(cell.module)} onChange={e => setCell(jour, si, "module", e.target.value)}>
                                <option value="">Module…</option>
                                {modules.map(m => <option key={m.id} value={toStr(m.intitule ?? m.code)}>{toStr(m.code)} — {toStr(m.intitule)}</option>)}
                              </select>
                              <select style={{ ...inpSt, fontSize: 10 }} value={toStr(cell.formateur)} onChange={e => setCell(jour, si, "formateur", e.target.value)}>
                                <option value="">Formateur…</option>
                                {formateurs.map(f => <option key={f.id} value={toStr(f.nom)}>{toStr(f.nom)}</option>)}
                              </select>
                              <div style={{ display: "flex", gap: 4 }}>
                                <select style={{ ...inpSt, fontSize: 10, flex: 1 }} value={cell.mode ?? "PRESENTIEL"} onChange={e => setCell(jour, si, "mode", e.target.value)}>
                                  <option value="PRESENTIEL">Présentiel</option>
                                  <option value="DISTANCIEL">À distance</option>
                                </select>
                              </div>
                              {cell.mode !== "DISTANCIEL" && (
                                list === undefined ? (
                                  <input type="text" style={{ ...inpSt, fontSize: 10 }} placeholder="Salle (cliquer pour charger)…" value={cell.salle} onClick={() => fetchAvailableSalles(jour)} onChange={e => setCell(jour, si, "salle", e.target.value)} />
                                ) : (
                                  <select style={{ ...inpSt, fontSize: 10 }} value={cell.salle_id ?? ""} onChange={e => setCell(jour, si, "salle_id", e.target.value)}>
                                    <option value="">Salle…</option>
                                    {(list ?? []).map(s => <option key={s.id} value={s.id}>{s.nom}{s.capacite ? ` (${s.capacite})` : ""}</option>)}
                                  </select>
                                )
                              )}
                              <button type="button" onClick={() => clearCell(jour, si)}
                                style={{ fontSize: 10, padding: "3px 8px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 5, cursor: "pointer", fontWeight: 600 }}>
                                × Supprimer
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => addCell(jour, si)}
                              style={{ width: "100%", padding: "20px 8px", background: "transparent", border: "2px dashed #cbd5e1", borderRadius: 7, cursor: "pointer", color: "#94a3b8", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
                              onMouseOver={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.color = "#0369a1"; e.currentTarget.style.background = "#f0f9ff"; }}
                              onMouseOut={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--sp-border)", marginTop: 16 }}>
            <button className="sp-btn sp-btn--secondary" type="button" onClick={onClose}>Annuler</button>
            <button className="sp-btn sp-btn--primary" type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Enregistrement…" : <>{Ico.check} Enregistrer les modifications</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function Emplois() {
  const [groupes, setGroupes]               = useState([]);
  const [emplois, setEmplois]               = useState([]);
  const [plannings, setPlannings]           = useState([]);
  const [semainesAnnee, setSemainesAnnee]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setModal]               = useState(false);
  const [showFmtModal, setFmtModal]         = useState(false);
  const [formateurs, setFormateurs]         = useState([]);
  const [emploiActif, setEmploiActif]       = useState(null);
  const [alert, setAlert]                   = useState(null);
  const [formateurEmplois, setFmtEmplois]   = useState([]);
  const [viewingFmtEmploi, setViewingFmt]   = useState(null);
  // Emploi à modifier (bouton Modifier emploi)
  const [emploiAModifier, setEmploiAModifier] = useState(null);
  const [generatingAll, setGeneratingAll]     = useState(false);
  const [filterGroupeEmploi, setFilterGroupeEmploi] = useState("");

  const [confirm, ConfirmDialog] = useConfirm();
  const flash = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gRes, eRes, pRes, fRes, feRes] = await Promise.allSettled([
        axios.get("/pole-groupes"), axios.get("/emplois"), axios.get("/plannings"),
        axios.get("/pole-formateurs"), axios.get("/formateur-emplois"),
      ]);
      if (gRes.status  === "fulfilled") { const d = gRes.value.data;  setGroupes(Array.isArray(d) ? d : (d.data ?? [])); }
      if (eRes.status  === "fulfilled") { const d = eRes.value.data;  setEmplois(Array.isArray(d) ? d : (d.data ?? [])); }
      if (pRes.status  === "fulfilled") {
        const d = pRes.value.data;
        setPlannings(d.plannings ?? (Array.isArray(d) ? d : (d.data ?? [])));
        if (d.semaines_annee) setSemainesAnnee(d.semaines_annee);
      }
      if (fRes.status  === "fulfilled") { const d = fRes.value.data;  setFormateurs(Array.isArray(d) ? d : (d.data ?? [])); }
      if (feRes.status === "fulfilled") { const d = feRes.value.data; setFmtEmplois(Array.isArray(d) ? d : (d.data ?? [])); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const afficherEmploi = async (id) => {
    try {
      const { data } = await axios.get(`/emplois/${id}`);
      setEmploiActif(data.data ?? data);
      setTimeout(() => document.getElementById("emploi-doc")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch { flash("Impossible d'afficher l'emploi du temps. Vérifiez votre connexion.", "err"); }
  };

  // Charger un emploi pour le modifier
  const ouvrirModification = async (id) => {
    try {
      const { data } = await axios.get(`/emplois/${id}`);
      setEmploiAModifier(data.data ?? data);
    } catch { flash("Impossible de charger l'emploi à modifier. Veuillez réessayer.", "err"); }
  };

  // Générer tous les emplois de formateurs depuis les emplois du temps existants
  const genererTousEmploisFormateurs = async () => {
    const ok = await confirm({
      title: "Générer les emplois de tous les formateurs ?",
      message: "Cette action va créer les emplois du temps individuels de chaque formateur à partir des emplois du temps existants. Les emplois déjà générés ne seront pas modifiés.",
      confirmLabel: "Générer les emplois",
      variant: "warning",
    });
    if (!ok) return;
    setGeneratingAll(true);
    try {
      const { data } = await axios.post("/generer-emplois-formateurs", { semestre: "S1" });
      flash(data.message ?? "Emplois générés avec succès.");
      fetchAll();
    } catch (e) {
      flash(e.response?.data?.message ?? "La génération a échoué. Veuillez réessayer.", "err");
    } finally { setGeneratingAll(false); }
  };

  const supprimerEmploi = async (id) => {
    const ok = await confirm({
      title: "Supprimer cet emploi du temps ?",
      message: "L'emploi du temps et toutes ses séances seront définitivement supprimés. Cette action est irréversible.",
      confirmLabel: "Supprimer",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await axios.delete(`/emplois/${id}`);
      flash("Emploi du temps supprimé.");
      if (emploiActif?.id === id) setEmploiActif(null);
      fetchAll();
    } catch { flash("La suppression a échoué. Veuillez réessayer.", "err"); }
  };

  const afficherFormateurEmploi = async (id) => {
    try {
      const { data } = await axios.get(`/formateur-emplois/${id}`);
      setViewingFmt(data.data ?? data);
    } catch { flash("Impossible de charger l'emploi du formateur. Veuillez réessayer.", "err"); }
  };

  const supprimerFormateurEmploi = async (id) => {
    try {
      await axios.delete(`/formateur-emplois/${id}`);
      flash("Emploi du formateur supprimé avec succès.");
      setViewingFmt(null);
      fetchAll();
    } catch { flash("La suppression a échoué. Veuillez réessayer.", "err"); }
  };

  const supprimerTousEmploisGroupe = async () => {
    if (!filterGroupeEmploi) { flash("Sélectionnez un groupe.", "err"); return; }
    const groupeNom = emplois.find(e => String(e.groupe_id) === String(filterGroupeEmploi))?.groupe ?? `Groupe #${filterGroupeEmploi}`;
    const ok = await confirm({
      title: `Supprimer les emplois de ${groupeNom} ?`,
      message: `Tous les emplois du temps du groupe ${groupeNom} seront définitivement supprimés. Cette action est irréversible.`,
      confirmLabel: `Supprimer les emplois de ${groupeNom}`,
      variant: "danger",
    });
    if (!ok) return;
    try {
      await axios.delete(`/emplois/groupe/${filterGroupeEmploi}`);
      flash(`Emplois du groupe ${groupeNom} supprimés.`);
      setFilterGroupeEmploi("");
      if (emploiActif && String(emploiActif.groupe_id) === String(filterGroupeEmploi)) setEmploiActif(null);
      fetchAll();
    } catch { flash("La suppression a échoué. Veuillez réessayer.", "err"); }
  };

  const supprimerTousEmploisFormateurs = async () => {
    const ok = await confirm({
      title: "Supprimer tous les emplois formateurs ?",
      message: "Tous les emplois du temps des formateurs seront définitivement supprimés. Cette action est irréversible.",
      confirmLabel: "Supprimer tous les emplois formateurs",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await axios.delete("/formateur-emplois/all");
      flash("Tous les emplois formateurs supprimés.");
      fetchAll();
    } catch { flash("La suppression a échoué. Veuillez réessayer.", "err"); }
  };

  const handlePrint = () => {
    openPrintWindow("emploi-doc-content", `Emploi du temps — ${toStr(emploiActif?.groupe ?? "")}`);
  };

  return (
    <div className="sp-container" style={{ paddingTop: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--sp-black)", letterSpacing: -0.5 }}>Emplois du temps</div>
          <div style={{ fontSize: 13, color: "var(--sp-gray-400)", marginTop: 3 }}>
            {emplois.length} emploi{emplois.length > 1 ? "s" : ""} enregistré{emplois.length > 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Supprimer emplois d'un groupe */}
          {emplois.length > 0 && (() => {
            const emploiGroupes = [...new Map(emplois.map(e => [e.groupe_id, { id: e.groupe_id, nom: e.groupe }])).values()];
            return (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  className="form-select"
                  style={{ height: 34, fontSize: 13, minWidth: 160 }}
                  value={filterGroupeEmploi}
                  onChange={e => setFilterGroupeEmploi(e.target.value)}
                >
                  <option value="">Choisir un groupe</option>
                  {emploiGroupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
                </select>
                <button
                  className="sp-btn sp-btn--secondary"
                  style={{ color: "var(--rd5, #dc2626)", borderColor: "var(--rd3, #fca5a5)" }}
                  onClick={supprimerTousEmploisGroupe}
                  disabled={!filterGroupeEmploi}
                  title="Supprimer tous les emplois du groupe sélectionné"
                >
                  {Ico.trash} Supprimer emplois groupe
                </button>
              </div>
            );
          })()}
          {/* Supprimer tous les emplois formateurs */}
          {formateurEmplois.length > 0 && (
            <button
              className="sp-btn sp-btn--secondary"
              style={{ color: "var(--rd5, #dc2626)", borderColor: "var(--rd3, #fca5a5)" }}
              onClick={supprimerTousEmploisFormateurs}
              title="Supprimer tous les emplois des formateurs"
            >
              {Ico.trash} Supprimer emplois formateurs
            </button>
          )}
          {/* Générer tous les emplois formateurs en un clic */}
          <button className="sp-btn sp-btn--secondary" onClick={genererTousEmploisFormateurs} disabled={generatingAll}
            title="Génère automatiquement les emplois de tous les formateurs depuis les emplois du temps existants">
            {generatingAll ? "Génération…" : <>{Ico.table} Générer tous les emplois formateurs</>}
          </button>
          <button className="sp-btn sp-btn--secondary" onClick={() => setFmtModal(true)}>{Ico.table} Emploi formateur</button>
          <button className="sp-btn sp-btn--primary" onClick={() => setModal(true)}>{Ico.plus} Nouvel emploi</button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div style={{ padding: "10px 16px", borderRadius: "var(--sp-radius)", marginBottom: 16, fontSize: 13, background: alert.type === "ok" ? "var(--sp-green-light)" : "#fee2e2", color: alert.type === "ok" ? "#16a34a" : "#dc2626", border: `1px solid ${alert.type === "ok" ? "var(--sp-green)" : "#dc2626"}` }}>
          {alert.type === "ok" ? Ico.check : Ico.alert} {alert.msg}
        </div>
      )}

      {showModal && <ModalCreerEmploi onClose={() => setModal(false)} onSaved={() => { setModal(false); fetchAll(); flash("Emploi du temps créé."); }} groupes={groupes} plannings={plannings} semainesAnnee={semainesAnnee} />}
      {showFmtModal && <ModalFormateurTimetable onClose={() => setFmtModal(false)} formateurs={formateurs} onSaved={() => { fetchAll(); flash("Emploi du formateur sauvegardé."); }} />}
      {viewingFmtEmploi && <ModalViewFormateurEmploi record={viewingFmtEmploi} onClose={() => setViewingFmt(null)} onDelete={supprimerFormateurEmploi} />}
      {/* Modal modification d'emploi */}
      {emploiAModifier && (
        <ModalModifierEmploi
          emploi={emploiAModifier}
          groupes={groupes}
          plannings={plannings}
          onClose={() => setEmploiAModifier(null)}
          onSaved={() => { setEmploiAModifier(null); fetchAll(); flash("Emploi modifié avec succès."); afficherEmploi(emploiAModifier.id); }}
        />
      )}

      {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "var(--sp-gray-400)" }}>Chargement…</div>}

      {/* Cartes emplois */}
      {!loading && emplois.length > 0 && (
        <div className="sp-cards-grid" style={{ padding: 0, marginBottom: 24 }}>
          {emplois.map(e => (
            <div key={e.id} onClick={() => afficherEmploi(e.id)} className="sp-card"
              style={{ cursor: "pointer", borderColor: emploiActif?.id === e.id ? "var(--sp-green)" : "var(--sp-border)", background: emploiActif?.id === e.id ? "var(--sp-green-light)" : "#fff" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--sp-black)" }}>{toStr(e.groupe)}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {/* Bouton Modifier emploi */}
                  <button style={{ background: "#eff6ff", border: "none", borderRadius: 5, color: "#1d4ed8", cursor: "pointer", width: 24, height: 24, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    title="Modifier cet emploi du temps"
                    onClick={ev => { ev.stopPropagation(); ouvrirModification(e.id); }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button style={{ background: "#fee2e2", border: "none", borderRadius: 5, color: "#dc2626", cursor: "pointer", width: 24, height: 24, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    title="Supprimer" onClick={ev => { ev.stopPropagation(); supprimerEmploi(e.id); }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--sp-gray-400)", display: "flex", alignItems: "center", gap: 5 }}>
                {Ico.cal} {toStr(e.periodeDebut ?? e.periode_debut ?? "—")}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={`sp-status ${e.valide ? "sp-status--active" : "sp-status--pending"}`}>{e.valide ? "Validé" : "En attente"}</span>
                {e.semestre && <span className="sp-status sp-status--closed">{e.semestre}</span>}
                {e.semaine_num && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>S{e.semaine_num}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && emplois.length === 0 && !emploiActif && (
        <div className="sp-section">
          <div className="sp-empty">
            <div className="sp-empty-icon">{Ico.cal}</div>
            <div className="sp-empty-title">Aucun emploi du temps</div>
            <div className="sp-empty-desc">Créez le premier emploi du temps pour commencer</div>
            <button className="sp-btn sp-btn--primary" style={{ marginTop: 8 }} onClick={() => setModal(true)}>{Ico.plus} Créer un emploi du temps</button>
          </div>
        </div>
      )}

      {/* ══ EMPLOIS FORMATEURS SAUVEGARDÉS ════════════════════════════════ */}
      {!loading && formateurEmplois.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "var(--sp-border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "var(--sp-gray-600)", textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" }}>
              {Ico.table} Emplois formateurs sauvegardés
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--sp-border)" }} />
          </div>
          <div className="sp-cards-grid" style={{ padding: 0 }}>
            {formateurEmplois.map(fe => (
              <div key={fe.id} onClick={() => afficherFormateurEmploi(fe.id)} className="sp-card"
                style={{ cursor: "pointer", borderColor: viewingFmtEmploi?.id === fe.id ? "#7c3aed" : "var(--sp-border)", background: viewingFmtEmploi?.id === fe.id ? "#faf5ff" : "#fff" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--sp-black)" }}>{fe.formateur}</div>
                  <button
                    style={{ background: "#fee2e2", border: "none", borderRadius: 5, color: "#dc2626", cursor: "pointer", width: 24, height: 24, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    title="Supprimer"
                    onClick={ev => { ev.stopPropagation(); supprimerFormateurEmploi(fe.id); }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "var(--sp-gray-400)", display: "flex", alignItems: "center", gap: 5 }}>
                  {Ico.cal} {fe.created_at}
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>{fe.semestre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ DOCUMENT OFPPT ═════════════════════════════════════════════════ */}
      {emploiActif && (
        <div id="emploi-doc" style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
          {/* Barre d'actions */}
          <div style={{ background: "var(--sp-black)", padding: "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
              {toStr(emploiActif.groupe)} · {toStr(emploiActif.semestre)}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {/* Modifier l'emploi du temps depuis le document affiché */}
              <button className="sp-btn sp-btn--secondary" style={{ height: 28, fontSize: 11, background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.2)" }}
                onClick={() => ouvrirModification(emploiActif.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Modifier emploi
              </button>
              <button className="sp-btn sp-btn--secondary" style={{ height: 28, fontSize: 11, background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.2)" }} onClick={handlePrint}>
                {Ico.print} Imprimer
              </button>
              <button className="sp-btn sp-btn--secondary" style={{ height: 28, fontSize: 11, background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.2)" }} onClick={() => setEmploiActif(null)}>
                {Ico.close} Fermer
              </button>
            </div>
          </div>

          {/* Contenu copié dans la fenêtre d'impression */}
          <div id="emploi-doc-content">
            <DocumentOFPPT emploi={emploiActif} />
          </div>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}