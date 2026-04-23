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
};

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT OFPPT — noir / blanc / cyan  — identique à l'image
═══════════════════════════════════════════════════════════════ */
/* Calcule les heures hebdo depuis la grille (chaque séance = 2.5h) */
function calcNbHeures(jours) {
  if (!jours) return 0;
  let count = 0;
  Object.values(jours).forEach(seances => {
    if (Array.isArray(seances)) seances.forEach(s => { if (s && s.module) count++; });
  });
  return count * 2.5;
}

function DocumentOFPPT({ emploi }) {
  if (!emploi) return null;

  // Heures hebdo calculées automatiquement depuis les séances de la grille
  const heuresHebdo = emploi.nb_heures ?? calcNbHeures(emploi.jours);
  // Heures annuelles = heures hebdo × 23 semaines
  const heuresAnnee = heuresHebdo * 23;

  /* Styles de base pour toutes les <td> du document */
  const TD = {
    border: "1px solid #000",
    padding: "4px 7px",
    verticalAlign: "top",
    color: "#000",
    background: "#fff",
    fontSize: 11,
    fontFamily: "Arial, Helvetica, sans-serif",
  };

  const TBL = {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  };

  return (
    <div style={{
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 11,
      color: "#000",
      background: "#fff",
      padding: "10px 12px",
      boxSizing: "border-box",
      width: "100%",
    }}>

      {/* ══ 1. EN-TÊTE ══════════════════════════════════════════════════════ */}
      <table style={TBL}>
        <colgroup>
          <col style={{ width: "14%" }} />
          <col style={{ width: "56%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <tbody>
          <tr>
            {/* OFPPT */}
            <td style={{ ...TD, textAlign: "center", verticalAlign: "middle", padding: "6px 8px" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>OFPPT</div>
              <div style={{ fontSize: 8.5, direction: "rtl", lineHeight: 1.6 }}>مكتب التكوين المهني وإنعاش الشغل</div>
              <div style={{ fontSize: 8, color: "#555", direction: "rtl" }}>المملكة المغربية</div>
              <div style={{ marginTop: 4, fontWeight: 700, fontSize: 10 }}>CF SALE I</div>
            </td>

            {/* Titre */}
            <td style={{ ...TD, textAlign: "center", verticalAlign: "middle", padding: "10px 12px" }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2, color: "#000" }}>EMPLOI DU TEMPS</div>
              <div style={{ fontSize: 11, direction: "rtl", fontFamily: "serif", color: "#333", margin: "4px 0" }}>
                جدول التوقيت الأسبوعي
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>Année de Formation 2025-2026</div>
            </td>

            {/* Arabe droite */}
            <td style={{ ...TD, textAlign: "right", verticalAlign: "middle", padding: "6px 10px" }}>
              <div style={{ direction: "rtl", fontSize: 10, lineHeight: 2, color: "#000" }}>
                <div style={{ fontWeight: 700 }}>مكتب التكوين المهني والتقني</div>
                <div>Office de la Formation Professionnelle</div>
                <div>et de la Promotion du Travail</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ 2. EFP + VERSION ════════════════════════════════════════════════ */}
      <table style={TBL}>
        <tbody>
          <tr>
            <td style={{ ...TD, padding: "3px 8px" }}>
              <span style={{ fontWeight: 700 }}>EFP : </span>ISTA HAY SALAM SALE
              <span style={{ float: "right", fontWeight: 700, textDecoration: "underline" }}>Version 1</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ 3. BANDEAU CYAN ═════════════════════════════════════════════════ */}
      <table style={TBL}>
        <tbody>
          <tr>
            <td style={{
              border: "1px solid #000",
              padding: "5px 10px",
              background: "#00bcd4",
              textAlign: "center",
              fontWeight: 900,
              fontSize: 13,
              color: "#000",
            }}>
              Période d'application : A partir du {toStr(emploi.periodeDebut ?? emploi.periode_debut ?? "—")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ 4. FILIÈRE / NIVEAUX ════════════════════════════════════════════ */}
      <table style={TBL}>
        <colgroup>
          <col style={{ width: "50%" }} />
          <col style={{ width: "50%" }} />
        </colgroup>
        <tbody>
          <tr>
            {/* Infos groupe */}
            <td style={{ ...TD, padding: "5px 8px" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11 }}>
                <tbody>
                  {[
                    ["Filière :", toStr(emploi.filiere ?? "—")],
                    ["Année :", toStr(emploi.annee ?? "—")],
                    ["Groupe :", <strong key="g">{toStr(emploi.groupe)}</strong>],
                    ["Formateur Parrain du Groupe :", toStr(emploi.formateur_parrain ?? "")],
                  ].map(([k, v], i) => (
                    <tr key={i}>
                      <td style={{ paddingRight: 6, fontWeight: 700, whiteSpace: "nowrap", verticalAlign: "top", lineHeight: 2, color: "#000" }}>{k}</td>
                      <td style={{ lineHeight: 2, color: "#000" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>

            {/* Niveaux + nb heures */}
            <td style={{ ...TD, padding: "5px 10px" }}>
              <div style={{ display: "flex", gap: 24, marginBottom: 5 }}>
                <div>
                  {NIVEAUX_COL1.map(n => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 5, lineHeight: 1.95, fontSize: 10.5, color: "#000" }}>
                      <div style={{ width: 11, height: 11, border: "1px solid #000", flexShrink: 0, background: "#fff" }} />
                      {n}
                    </div>
                  ))}
                </div>
                <div>
                  {NIVEAUX_COL2.map(n => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 5, lineHeight: 1.95, fontSize: 10.5, color: "#000" }}>
                      <div style={{ width: 11, height: 11, border: "1px solid #000", flexShrink: 0, background: "#fff" }} />
                      {n}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "#000" }}>
                <span style={{ fontWeight: 700 }}>Nombre d'heures : </span>
                <strong style={{ fontSize: 13 }}>{heuresHebdo} heures / sem</strong>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                  Soit <strong>{heuresAnnee}h</strong> / an (23 sem)
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ 5. GRILLE HORAIRE ═══════════════════════════════════════════════ */}
      <table style={TBL}>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "23%" }} />
          <col style={{ width: "23%" }} />
          <col style={{ width: "23%" }} />
          <col style={{ width: "23%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...TD, background: "#d0d8e8", textAlign: "center", fontWeight: 700, verticalAlign: "middle" }}>
              <div style={{ color: "#000" }}>Séances</div>
              <div style={{ color: "#000" }}>Jours</div>
            </th>
            {SEANCES.map((s, i) => (
              <th key={i} style={{ ...TD, background: "#d0d8e8", textAlign: "center", fontWeight: 700 }}>
                <div style={{ color: "#000", fontSize: 11 }}>{s.label}</div>
                <div style={{ color: "#000", fontWeight: 400, fontSize: 10 }}>{s.horaire}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOURS.map((jour) => {
            const seances = Array.isArray(emploi.jours?.[jour])
              ? emploi.jours[jour]
              : [null, null, null, null];
            return (
              <tr key={jour}>
                {/* Nom du jour */}
                <td style={{ ...TD, fontWeight: 700, fontSize: 11, textAlign: "center", verticalAlign: "middle", background: "#fafafa", color: "#000" }}>
                  {jour}
                </td>
                {seances.map((s, i) => {
                  if (!s || !s.module) {
                    return (
                      <td key={i} style={{ ...TD, background: "#fff" }}>
                        <div style={{ minHeight: 44 }} />
                      </td>
                    );
                  }
                  return (
                    <td key={i} style={{ ...TD, background: "#fff", verticalAlign: "top" }}>
                      {/* Horaire */}
                      <div style={{ fontSize: 9.5, color: "#444", marginBottom: 1 }}>{SEANCES[i].horaire}</div>
                      {/* Module */}
                      <div style={{ fontWeight: 700, fontSize: 11, color: "#000", lineHeight: 1.3, marginBottom: 1 }}>
                        {toStr(s.module)}
                      </div>
                      {/* Formateur */}
                      <div style={{ fontSize: 10.5, color: "#000", marginBottom: 1 }}>
                        {toStr(s.formateur)}
                      </div>
                      {/* Mode / Salle */}
                      <div style={{ fontSize: 10, color: "#000" }}>
                        {s.mode === "DISTANCIEL"
                          ? "Formation à distance"
                          : `Formation en présentiel${s.salle ? ` / ${s.salle}` : ""}`}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ══ 6. PIED DE PAGE ═════════════════════════════════════════════════ */}
      <table style={TBL}>
        <colgroup>
          <col style={{ width: "35%" }} />
          <col style={{ width: "35%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <tbody>
          <tr>
            {/* Emargements */}
            <td style={{ ...TD, verticalAlign: "top" }}>
              <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 3, fontSize: 11, color: "#000" }}>Emargements :</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.9, color: "#000" }}>
                <div>Fait à Salé</div>
                <div>Date : {toStr(emploi.periodeDebut ?? emploi.periode_debut ?? "—")}</div>
              </div>
              <div style={{ height: 28 }} />
            </td>

            {/* Le Directeur */}
            <td style={{ ...TD, textAlign: "center", verticalAlign: "top" }}>
              <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 4, fontSize: 11, color: "#000" }}>Le Directeur</div>
              <div style={{ height: 28 }} />
              <div style={{ fontSize: 10.5, color: "#0055aa", fontWeight: 700, lineHeight: 1.8 }}>
                <div>KADDOURI HICHAM</div>
                <div>DIRECTEUR D'ETABLISSEMENT</div>
                <div>ISTA HAY SALAM SALE</div>
              </div>
            </td>

            {/* DRRSK */}
            <td style={{ ...TD, textAlign: "center", verticalAlign: "middle" }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 5, color: "#000" }}>DRRSK</div>
              <div style={{ fontSize: 10.5, lineHeight: 1.8, color: "#000" }}>
                <div>ISTA Hay Salam - CF SALE 1</div>
                <div>Abd ABDELKRIM KHATABI</div>
                <div>Hay Salam - Salé</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
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
            const pct = p.mh_drif ? Math.min(100, ((p.total_prevu ?? 0) / p.mh_drif) * 100) : 0;
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
function ModalFormateurTimetable({ onClose, formateurs }) {
  const [formateurId, setFormateurId] = useState("");
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!formateurId) return;
    setLoading(true); setError(null); setData(null);
    try { const { data: res } = await axios.get(`/emplois/formateur/${formateurId}`); setData(res.data); }
    catch { setError("Erreur lors de la génération."); }
    finally { setLoading(false); }
  };

  const grille = data?.grille ?? null;
  const hasAny = grille && JOURS.some(j => grille[j]?.some(Boolean));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ alignItems: "flex-start", paddingTop: 32, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: "0 12px", background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", overflow: "hidden" }}>
        <div style={{ background: "var(--sp-black)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Emploi du temps — Formateur</div>
          <button className="sp-btn sp-btn--secondary" onClick={onClose} style={{ height: 28, padding: "0 10px", fontSize: 12 }}>{Ico.close} Fermer</button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 18 }}>
            <div className="sp-form-group" style={{ flex: 1 }}>
              <label className="sp-form-label">Formateur</label>
              <select className="sp-form-control" value={formateurId} onChange={e => setFormateurId(e.target.value)}>
                <option value="">Sélectionner un formateur</option>
                {formateurs.map(f => <option key={f.id} value={f.id}>{toStr(f.nom)}</option>)}
              </select>
            </div>
            <button className="sp-btn sp-btn--primary" onClick={generate} disabled={!formateurId || loading}>
              {loading ? "Génération…" : <>{Ico.cal} Générer</>}
            </button>
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
                        const cell = grille[jour]?.[si];
                        if (!cell) return <td key={si} style={{ padding: "10px 12px", textAlign: "center", color: "var(--sp-gray-400)", border: "1px solid var(--sp-border)" }}>—</td>;
                        return (
                          <td key={si} style={{ padding: "8px 12px", verticalAlign: "top", border: "1px solid var(--sp-border)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{cell.module}</div>
                            <div style={{ fontSize: 11, color: "var(--sp-green)", marginBottom: 2 }}>Groupe {cell.groupe}</div>
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
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL CRÉER EMPLOI
═══════════════════════════════════════════════════════════════ */
function ModalCreerEmploi({ onClose, onSaved, groupes, plannings = [] }) {
  const [form, setForm] = useState({ groupe_id: "", date_debut: new Date().toISOString().split("T")[0], semestre: "S1" });
  const [grille, setGrille] = useState(() => { const g = {}; JOURS.forEach(j => { g[j] = [null,null,null,null]; }); return g; });
  const [modules, setModules]       = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [availableSalles, setAvail] = useState({});
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchAvailableSalles = async (jour) => {
    if (availableSalles[jour]) return;
    try { const { data } = await axios.get(`/salles/disponibles?jour=${encodeURIComponent(jour)}&semestre=${form.semestre}`); setAvail(prev => ({ ...prev, [jour]: data.data ?? [] })); }
    catch { setAvail(prev => ({ ...prev, [jour]: [] })); }
  };

  const loadModules = async (gid, sem) => {
    if (!gid) return;
    try { const { data } = await axios.get(`/pole-modules?groupe_id=${gid}&semestre=${sem}`); setModules(data.data ?? data ?? []); } catch {}
  };

  const handleGroupeChange = v => { set("groupe_id", v); setModules([]); if (v) loadModules(v, form.semestre); };
  const handleSemestreChange = v => { set("semestre", v); if (form.groupe_id) loadModules(form.groupe_id, v); };

  useEffect(() => { axios.get("/pole-formateurs").then(({ data }) => setFormateurs(data.data ?? data ?? [])).catch(() => {}); }, []);

  const setCell = (jour, si, field, value) => {
    setGrille(prev => {
      const next = { ...prev }; const row = [...(next[jour] || [null,null,null,null])];
      if (!row[si]) row[si] = { module: "", formateur: "", salle: "", mode: "PRESENTIEL" };
      else row[si] = { ...row[si] };
      row[si][field] = value;
      if (field === "module") {
        if (value) {
          const mod = modules.find(m => toStr(m.intitule ?? m.code) === value);
          if (mod?.formateur_id) { const fmt = formateurs.find(f => String(f.id) === String(mod.formateur_id)); row[si].formateur = fmt ? toStr(fmt.nom) : ""; row[si].formateur_id = mod.formateur_id; }
          else { row[si].formateur = ""; row[si].formateur_id = null; }
          row[si].module_id = mod?.id ?? null;
        } else { row[si] = null; }
      }
      if (field === "salle_id") { const found = (availableSalles[jour] ?? []).find(s => String(s.id) === String(value)); row[si].salle = found ? found.nom : ""; row[si].salle_id = found ? found.id : null; }
      next[jour] = row; return next;
    });
  };

  const clearCell = (jour, si) => setGrille(prev => { const next = { ...prev }; const row = [...(next[jour] || [])]; row[si] = null; next[jour] = row; return next; });
  const addCell = (jour, si) => {
    if (!form.groupe_id) { setError("Choisir un groupe d'abord."); return; }
    fetchAvailableSalles(jour);
    setGrille(prev => { const next = { ...prev }; const row = [...(next[jour] || [null,null,null,null])]; row[si] = { module: "", formateur: "", salle: "", salle_id: null, mode: "PRESENTIEL" }; next[jour] = row; return next; });
  };

  const handleSubmit = async () => {
    if (!form.groupe_id) { setError("Choisir un groupe."); return; }
    setSaving(true); setError(null);
    try {
      const groupe = groupes.find(g => String(g.id) === String(form.groupe_id));
      await axios.post("/emplois", { groupe: toStr(groupe?.nom ?? `Groupe ${form.groupe_id}`), groupe_id: Number(form.groupe_id), date_debut: form.date_debut, semestre: form.semestre, grille });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" | ") : null) || "Erreur inconnue");
    } finally { setSaving(false); }
  };

  const inpSt = { width: "100%", padding: "5px 8px", border: "1px solid var(--sp-border)", borderRadius: 6, fontSize: 11, background: "var(--sp-gray-100)", color: "var(--sp-black)", outline: "none", boxSizing: "border-box" };
  const groupeSelected = groupes.find(g => String(g.id) === String(form.groupe_id));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ alignItems: "flex-start", paddingTop: 24, paddingBottom: 24, overflowY: "auto" }}>
      <div style={{ display: "flex", gap: 14, width: "100%", maxWidth: 1380, alignItems: "flex-start", margin: "0 auto", padding: "0 12px" }}>

        {/* Éditeur grille */}
        <div style={{ flex: "1 1 860px", background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", overflow: "hidden", border: "1px solid var(--sp-border)" }}>
          <div style={{ background: "var(--sp-black)", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Créer un emploi du temps</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginTop: 2 }}>Remplir la grille horaire du groupe</div>
            </div>
            <button className="sp-btn sp-btn--secondary" onClick={onClose} style={{ height: 28, padding: "0 10px", fontSize: 12 }}>{Ico.close}</button>
          </div>
          <div style={{ padding: "20px 22px" }}>
            {error && <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: 6, marginBottom: 14, fontSize: 12 }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div className="sp-form-group">
                <label className="sp-form-label">Groupe *</label>
                <select className="sp-form-control" value={form.groupe_id} onChange={e => handleGroupeChange(e.target.value)}>
                  <option value="">Sélectionner un groupe</option>
                  {groupes.map(g => <option key={g.id} value={g.id}>{toStr(g.nom ?? `Groupe ${g.id}`)}{g.filiere ? ` — ${toStr(g.filiere)}` : ""}</option>)}
                </select>
              </div>
              <div className="sp-form-group">
                <label className="sp-form-label">Semestre</label>
                <select className="sp-form-control" value={form.semestre} onChange={e => handleSemestreChange(e.target.value)}>
                  {["S1","S2"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sp-form-group">
                <label className="sp-form-label">Période début</label>
                <input type="date" className="sp-form-control" value={form.date_debut} onChange={e => set("date_debut", e.target.value)} />
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sp-gray-600)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>
              Grille horaire — cliquer sur + pour ajouter une séance
            </div>

            <div style={{ overflowX: "auto", marginBottom: 18 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680, fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ background: "var(--sp-black)", color: "#fff", padding: "10px 12px", textAlign: "left", width: 90, border: "1px solid #333", fontSize: 11, fontWeight: 700 }}>Jour</th>
                    {SEANCES.map((s, i) => (
                      <th key={i} style={{ background: "var(--sp-black)", color: "#fff", padding: "8px 12px", textAlign: "center", border: "1px solid #333" }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{s.label}</div>
                        <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.6 }}>{s.horaire}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JOURS.map((jour, ji) => (
                    <tr key={jour} style={{ background: ji % 2 === 0 ? "#fff" : "var(--sp-gray-100)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 12, border: "1px solid var(--sp-border)" }}>{jour}</td>
                      {[0,1,2,3].map(si => {
                        const cell = grille[jour]?.[si];
                        const list = availableSalles[jour];
                        return (
                          <td key={si} style={{ padding: 6, verticalAlign: "top", minWidth: 160, border: "1px solid var(--sp-border)" }}>
                            {cell ? (
                              <div style={{ borderRadius: 6, padding: "8px 10px", position: "relative", background: "var(--sp-green-light)", border: "1px solid var(--sp-green)" }}>
                                <button type="button" onClick={() => clearCell(jour, si)} style={{ position: "absolute", top: 4, right: 4, background: "#fee2e2", border: "none", borderRadius: 4, color: "#dc2626", cursor: "pointer", width: 18, height: 18, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                                <select style={{ ...inpSt, marginBottom: 5 }} value={cell.module} onChange={e => setCell(jour, si, "module", e.target.value)}>
                                  <option value="">Module…</option>
                                  {modules.map(m => <option key={m.id} value={toStr(m.intitule ?? m.code)}>{toStr(m.intitule ?? m.code)}</option>)}
                                </select>
                                {cell.formateur ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", marginBottom: 5, background: "#fff", border: "1px solid var(--sp-border)", borderRadius: 5, fontSize: 11, color: "var(--sp-black)", fontWeight: 600 }}>
                                    <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 4px", borderRadius: 4, background: "var(--sp-green-light)", color: "var(--sp-green)" }}>AUTO</span>
                                    {cell.formateur}
                                  </div>
                                ) : (
                                  <div style={{ padding: "4px 8px", marginBottom: 5, background: "#fff", border: "1px dashed var(--sp-border)", borderRadius: 5, fontSize: 11, color: "var(--sp-gray-400)", fontStyle: "italic" }}>Formateur (auto)</div>
                                )}
                                <select style={{ ...inpSt, fontSize: 10, marginBottom: 4 }} value={cell.mode} onChange={e => setCell(jour, si, "mode", e.target.value)}>
                                  <option value="PRESENTIEL">Présentiel</option>
                                  <option value="DISTANCIEL">Distanciel</option>
                                </select>
                                {cell.mode === "DISTANCIEL" ? (
                                  <div style={{ padding: "4px 8px", fontSize: 10, color: "#0891b2", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 5 }}>Distance — sans salle</div>
                                ) : list === undefined ? (
                                  <input type="text" style={{ ...inpSt, fontSize: 10 }} placeholder="Salle…" value={cell.salle} onClick={() => fetchAvailableSalles(jour)} onChange={e => setCell(jour, si, "salle", e.target.value)} />
                                ) : (
                                  <select style={{ ...inpSt, fontSize: 10 }} value={cell.salle_id ?? ""} onChange={e => setCell(jour, si, "salle_id", e.target.value)}>
                                    <option value="">Salle…</option>
                                    {list.length === 0 && <option disabled>Aucune salle disponible</option>}
                                    {list.map(s => <option key={s.id} value={s.id}>{s.nom}{s.capacite ? ` (${s.capacite})` : ""}</option>)}
                                  </select>
                                )}
                              </div>
                            ) : (
                              <button type="button" onClick={() => addCell(jour, si)}
                                style={{ width: "100%", padding: "18px 8px", background: "transparent", border: "2px dashed var(--sp-border)", borderRadius: 6, cursor: "pointer", color: "var(--sp-gray-400)", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = "var(--sp-green)"; e.currentTarget.style.color = "var(--sp-green)"; e.currentTarget.style.background = "var(--sp-green-light)"; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = "var(--sp-border)"; e.currentTarget.style.color = "var(--sp-gray-400)"; e.currentTarget.style.background = "transparent"; }}
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: "1px solid var(--sp-border)" }}>
              <button className="sp-btn sp-btn--secondary" type="button" onClick={onClose}>Annuler</button>
              <button className="sp-btn sp-btn--primary" type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? "Enregistrement…" : <>{Ico.check} Enregistrer</>}
              </button>
            </div>
          </div>
        </div>

        {/* Planning preview */}
        <div style={{ flex: "0 0 330px", background: "#fff", borderRadius: "var(--sp-radius)", boxShadow: "var(--sp-shadow-lg)", border: "1px solid var(--sp-border)", overflow: "hidden", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "var(--sp-black)", padding: "12px 16px", flexShrink: 0 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Planning de référence</div>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginTop: 2 }}>
              {groupeSelected ? toStr(groupeSelected.nom) : "Aucun groupe"} · {form.semestre}
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

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function Emplois() {
  const [groupes, setGroupes]         = useState([]);
  const [emplois, setEmplois]         = useState([]);
  const [plannings, setPlannings]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setModal]         = useState(false);
  const [showFmtModal, setFmtModal]   = useState(false);
  const [formateurs, setFormateurs]   = useState([]);
  const [emploiActif, setEmploiActif] = useState(null);
  const [alert, setAlert]             = useState(null);

  const flash = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gRes, eRes, pRes, fRes] = await Promise.allSettled([
        axios.get("/pole-groupes"), axios.get("/emplois"), axios.get("/plannings"), axios.get("/pole-formateurs"),
      ]);
      if (gRes.status === "fulfilled") { const d = gRes.value.data; setGroupes(Array.isArray(d) ? d : (d.data ?? [])); }
      if (eRes.status === "fulfilled") { const d = eRes.value.data; setEmplois(Array.isArray(d) ? d : (d.data ?? [])); }
      if (pRes.status === "fulfilled") { const d = pRes.value.data; setPlannings(d.plannings ?? (Array.isArray(d) ? d : (d.data ?? []))); }
      if (fRes.status === "fulfilled") { const d = fRes.value.data; setFormateurs(Array.isArray(d) ? d : (d.data ?? [])); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const afficherEmploi = async (id) => {
    try {
      const { data } = await axios.get(`/emplois/${id}`);
      setEmploiActif(data.data ?? data);
      setTimeout(() => document.getElementById("emploi-doc")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch { flash("Erreur de chargement.", "err"); }
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

  return (
    <div className="sp-container" style={{ paddingTop: 24, paddingBottom: 40 }}>

      {/* CSS impression */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          body > * { visibility: hidden !important; }
          #emploi-doc, #emploi-doc * { visibility: visible !important; }
          #emploi-doc {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100% !important; box-shadow: none !important;
            border: none !important; border-radius: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header page */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--sp-black)", letterSpacing: -0.5 }}>Emplois du temps</div>
          <div style={{ fontSize: 13, color: "var(--sp-gray-400)", marginTop: 3 }}>
            {emplois.length} emploi{emplois.length > 1 ? "s" : ""} enregistré{emplois.length > 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
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

      {showModal && <ModalCreerEmploi onClose={() => setModal(false)} onSaved={() => { setModal(false); fetchAll(); flash("Emploi du temps créé."); }} groupes={groupes} plannings={plannings} />}
      {showFmtModal && <ModalFormateurTimetable onClose={() => setFmtModal(false)} formateurs={formateurs} />}

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--sp-gray-400)" }}>Chargement…</div>
      )}

      {/* ── Cartes emplois ── */}
      {!loading && emplois.length > 0 && (
        <div className="sp-cards-grid" style={{ padding: 0, marginBottom: 24 }}>
          {emplois.map(e => (
            <div key={e.id}
              onClick={() => afficherEmploi(e.id)}
              className="sp-card"
              style={{ cursor: "pointer", borderColor: emploiActif?.id === e.id ? "var(--sp-green)" : "var(--sp-border)", background: emploiActif?.id === e.id ? "var(--sp-green-light)" : "#fff" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--sp-black)" }}>{toStr(e.groupe)}</div>
                <button
                  style={{ background: "#fee2e2", border: "none", borderRadius: 5, color: "#dc2626", cursor: "pointer", width: 24, height: 24, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  title="Supprimer"
                  onClick={ev => { ev.stopPropagation(); supprimerEmploi(e.id); }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--sp-gray-400)", display: "flex", alignItems: "center", gap: 5 }}>
                {Ico.cal} {toStr(e.periodeDebut ?? e.periode_debut ?? "—")}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={`sp-status ${e.valide ? "sp-status--active" : "sp-status--pending"}`}>{e.valide ? "Validé" : "En attente"}</span>
                {e.semestre && <span className="sp-status sp-status--closed">{e.semestre}</span>}
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

      {/* ══════════════════════════════════════════════════════════════════
          DOCUMENT OFPPT — affiché dans la page, imprimé identique
          ══════════════════════════════════════════════════════════════════ */}
      {emploiActif && (
        <div id="emploi-doc" style={{
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        }}>
          {/* Barre d'actions (cachée à l'impression) */}
          <div className="no-print" style={{
            background: "var(--sp-black)",
            padding: "9px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
              {toStr(emploiActif.groupe)} · {toStr(emploiActif.semestre)}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="sp-btn sp-btn--secondary" style={{ height: 28, fontSize: 11, background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.2)" }} onClick={() => window.print()}>
                {Ico.print} Imprimer
              </button>
              <button className="sp-btn sp-btn--secondary" style={{ height: 28, fontSize: 11, background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.2)" }} onClick={() => setEmploiActif(null)}>
                {Ico.close} Fermer
              </button>
            </div>
          </div>

          {/* Le document OFPPT — noir / blanc / cyan */}
          <DocumentOFPPT emploi={emploiActif} />
        </div>
      )}
    </div>
  );
}