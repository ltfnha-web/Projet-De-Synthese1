// src/pages/pole/Emplois.jsx — VERSION FINALE COMPLÈTE
import { useState, useEffect } from "react";
import axios from "axios";

const setToken = () => {
  const t = localStorage.getItem("token");
  if (t) axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
};

const SEANCES = [
  { label: "Séance 1", horaire: "08:30 → 11:00" },
  { label: "Séance 2", horaire: "11:00 → 13:30" },
  { label: "Séance 3", horaire: "13:30 → 16:00" },
  { label: "Séance 4", horaire: "16:00 → 18:30" },
];

const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

const COLORS = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#9333ea","#16a34a"];
const colorMap = {};
function getColor(name) {
  if (!name) return "#64748b";
  if (!colorMap[name]) colorMap[name] = COLORS[Object.keys(colorMap).length % COLORS.length];
  return colorMap[name];
}

// ── Cellule séance dans la grille ──
function SeanceCell({ s }) {
  if (!s) return (
    <td style={{
      padding: "10px 14px", textAlign: "center",
      color: "#94a3b8", border: "1px solid #e2e8f0",
      fontSize: 13,
    }}>—</td>
  );
  return (
    <td style={{
      padding: "10px 14px", verticalAlign: "top",
      border: "1px solid #e2e8f0",
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>
        {s.module}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: getColor(s.formateur), marginBottom: 2 }}>
        {s.formateur}
      </div>
      <div style={{ fontSize: 10, color: "#64748b" }}>
        {s.salle} · {s.mode}
      </div>
    </td>
  );
}

// ── Modal Créer Emploi ──
function ModalCreerEmploi({ onClose, onSaved, groupes }) {
  const [form, setForm] = useState({
    groupe_id: "",
    date_debut: new Date().toISOString().split("T")[0],
    semestre: "S2",
  });

  // Grille : { Lundi: [null,null,null,null], Mardi: [...], ... }
  const [grille, setGrille]     = useState(() => {
    const g = {};
    JOURS.forEach(j => { g[j] = [null, null, null, null]; });
    return g;
  });

  const [modules, setModules]       = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [loadingMod, setLM]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Quand groupe change → charge modules
  const handleGroupeChange = async (groupeId) => {
    set("groupe_id", groupeId);
    setModules([]);
    if (!groupeId) return;
    setLM(true);
    try {
      setToken();
      const { data } = await axios.get(`/pole-modules?groupe_id=${groupeId}&semestre=${form.semestre}`);
      setModules(data.data ?? data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLM(false);
    }
  };

  // Quand semestre change → recharge modules si groupe déjà sélectionné
  const handleSemestreChange = async (sem) => {
    set("semestre", sem);
    if (!form.groupe_id) return;
    setLM(true);
    try {
      setToken();
      const { data } = await axios.get(`/pole-modules?groupe_id=${form.groupe_id}&semestre=${sem}`);
      setModules(data.data ?? data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLM(false);
    }
  };

  // Charge formateurs au montage
  useEffect(() => {
    setToken();
    axios.get("/pole-formateurs")
      .then(({ data }) => setFormateurs(data.data ?? data ?? []))
      .catch(console.error);
  }, []);

  // Met à jour une cellule de la grille
  const setCell = (jour, seanceIdx, field, value) => {
    setGrille(prev => {
      const next = { ...prev };
      const row  = [...(next[jour] || [null,null,null,null])];
      if (!row[seanceIdx]) row[seanceIdx] = { module: "", formateur: "", salle: "", mode: "PRESENTIEL" };
      else row[seanceIdx] = { ...row[seanceIdx] };
      row[seanceIdx][field] = value;
      // Si module vide → reset cellule
      if (field === "module" && !value) row[seanceIdx] = null;
      next[jour] = row;
      return next;
    });
  };

  // Vide une cellule
  const clearCell = (jour, seanceIdx) => {
    setGrille(prev => {
      const next = { ...prev };
      const row  = [...(next[jour] || [null,null,null,null])];
      row[seanceIdx] = null;
      next[jour] = row;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.groupe_id) { setError("Choisir un groupe."); return; }
    setSaving(true);
    setError(null);
    try {
      setToken();
      const groupe = groupes.find(g => String(g.id) === String(form.groupe_id));
      await axios.post("/emplois", {
        groupe:      groupe?.nom ?? groupe?.code ?? `Groupe ${form.groupe_id}`,
        groupe_id:   Number(form.groupe_id),
        date_debut:  form.date_debut,
        semestre:    form.semestre,
        grille,
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

  const inp = {
    width: "100%", padding: "6px 10px",
    border: "1px solid #e2e8f0", borderRadius: 6,
    fontSize: 12, background: "#f8faff", color: "#0f172a",
    outline: "none", boxSizing: "border-box",
  };
  const lbl = {
    fontSize: 11, color: "#64748b", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.5px",
    display: "block", marginBottom: 4,
  };
  const grp = { display: "flex", flexDirection: "column" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      zIndex: 1000, display: "flex", alignItems: "flex-start",
      justifyContent: "center", padding: "16px", overflowY: "auto",
    }}>
      <div style={{
        background: "white", borderRadius: 12, width: "100%", maxWidth: 900,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)", marginTop: 20, marginBottom: 20,
      }}>
        {/* Header */}
        <div style={{
          background: "#1a2744", padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderRadius: "12px 12px 0 0",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>Créer un emploi du temps</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>
              Remplir la grille horaire du groupe
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

          {/* Infos générales */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={grp}>
              <label style={lbl}>Groupe *</label>
              <select style={inp} value={form.groupe_id} required
                onChange={e => handleGroupeChange(e.target.value)}>
                <option value="">Sélectionner un groupe</option>
                {groupes.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.nom ?? g.code ?? `Groupe ${g.id}`}
                    {g.filiere_nom ? ` — ${g.filiere_nom}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={grp}>
              <label style={lbl}>Semestre</label>
              <select style={inp} value={form.semestre}
                onChange={e => handleSemestreChange(e.target.value)}>
                {["S1","S2","S3","S4","S5","S6"].map(s =>
                  <option key={s} value={s}>{s}</option>
                )}
              </select>
            </div>
            <div style={grp}>
              <label style={lbl}>Période début</label>
              <input type="date" style={inp} value={form.date_debut}
                onChange={e => set("date_debut", e.target.value)} />
            </div>
          </div>

          {/* Grille EDT */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: "#1a2744",
              marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
              </svg>
              GRILLE HORAIRE — remplir séance par séance
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{
                      background: "#1a2744", color: "rgba(255,255,255,0.85)",
                      padding: "10px 14px", textAlign: "left", width: 90,
                      border: "1px solid #1a2744",
                    }}>Jour</th>
                    {SEANCES.map((s, i) => (
                      <th key={i} style={{
                        background: "#1a2744", color: "rgba(255,255,255,0.85)",
                        padding: "8px 12px", textAlign: "center",
                        border: "1px solid #1a2744",
                      }}>
                        <div style={{ fontWeight: 500 }}>{s.label}</div>
                        <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.7 }}>{s.horaire}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JOURS.map(jour => (
                    <tr key={jour}>
                      <td style={{
                        padding: "10px 14px", fontWeight: 600, background: "#f8faff",
                        border: "1px solid #e2e8f0", whiteSpace: "nowrap",
                      }}>{jour}</td>
                      {[0,1,2,3].map(si => {
                        const cell = grille[jour]?.[si];
                        return (
                          <td key={si} style={{
                            padding: 6, border: "1px solid #e2e8f0",
                            verticalAlign: "top", minWidth: 160,
                          }}>
                            {cell ? (
                              <div style={{
                                background: "#f0f9ff", borderRadius: 6,
                                padding: "6px 8px", position: "relative",
                              }}>
                                {/* Bouton supprimer */}
                                <button type="button" onClick={() => clearCell(jour, si)}
                                  style={{
                                    position: "absolute", top: 4, right: 4,
                                    background: "#fee2e2", border: "none", borderRadius: 4,
                                    color: "#dc2626", cursor: "pointer", width: 18, height: 18,
                                    fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>×</button>

                                {/* Module */}
                                <select style={{ ...inp, marginBottom: 4, paddingRight: 24 }}
                                  value={cell.module}
                                  onChange={e => setCell(jour, si, "module", e.target.value)}>
                                  <option value="">Module…</option>
                                  {modules.map(m => (
                                    <option key={m.id} value={m.intitule ?? m.code}>
                                      {m.intitule ?? m.code}
                                    </option>
                                  ))}
                                </select>

                                {/* Formateur */}
                                <select style={{ ...inp, marginBottom: 4 }}
                                  value={cell.formateur}
                                  onChange={e => setCell(jour, si, "formateur", e.target.value)}>
                                  <option value="">Formateur…</option>
                                  {formateurs.map(f => (
                                    <option key={f.id} value={f.name ?? f.nom}>
                                      {f.name ?? f.nom}
                                    </option>
                                  ))}
                                </select>

                                {/* Salle + Mode */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                  <input type="text" style={inp}
                                    placeholder="Salle" value={cell.salle}
                                    onChange={e => setCell(jour, si, "salle", e.target.value)} />
                                  <select style={inp} value={cell.mode}
                                    onChange={e => setCell(jour, si, "mode", e.target.value)}>
                                    <option value="PRESENTIEL">Présentiel</option>
                                    <option value="DISTANCIEL">Distanciel</option>
                                  </select>
                                </div>
                              </div>
                            ) : (
                              // Cellule vide → bouton ajouter
                              <button type="button"
                                onClick={() => {
                                  if (!form.groupe_id) {
                                    setError("Choisir un groupe d'abord.");
                                    return;
                                  }
                                  setCell(jour, si, "module", "");
                                  setGrille(prev => {
                                    const next = { ...prev };
                                    const row  = [...(next[jour] || [null,null,null,null])];
                                    row[si] = { module: "", formateur: "", salle: "", mode: "PRESENTIEL" };
                                    next[jour] = row;
                                    return next;
                                  });
                                }}
                                style={{
                                  width: "100%", padding: "20px 8px",
                                  background: "transparent",
                                  border: "2px dashed #e2e8f0",
                                  borderRadius: 6, cursor: "pointer",
                                  color: "#94a3b8", fontSize: 20,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "all 0.15s",
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.borderColor = "#2563eb";
                                  e.currentTarget.style.color = "#2563eb";
                                  e.currentTarget.style.background = "#eff6ff";
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.borderColor = "#e2e8f0";
                                  e.currentTarget.style.color = "#94a3b8";
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
          </div>

          {/* Note */}
          <div style={{
            background: "#f0f9ff", border: "1px solid #bae6fd",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            fontSize: 12, color: "#0369a1",
          }}>
            💡 Cliquer sur <strong>+</strong> pour ajouter une séance — cliquer sur <strong>×</strong> pour la supprimer
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
                  Enregistrer l'emploi du temps
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale Emplois ──
export default function Emplois() {
  const [groupes, setGroupes]       = useState([]);
  const [emplois, setEmplois]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showModal, setModal]       = useState(false);
  const [emploiActif, setEmploiActif] = useState(null); // emploi affiché

  // Charge les groupes + emplois existants
  const fetchAll = async () => {
    setToken();
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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Affiche un emploi existant
  const afficherEmploi = async (id) => {
    setToken();
    try {
      const { data } = await axios.get(`/emplois/${id}`);
      setEmploiActif(data.data ?? data);
    } catch (e) {
      console.error(e);
    }
  };

  const jours = emploiActif ? Object.entries(emploiActif.jours ?? {}) : [];

  return (
    <div className="emplois-page">

      {showModal && (
        <ModalCreerEmploi
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); fetchAll(); }}
          groupes={groupes}
        />
      )}

      {/* Header + bouton créer */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Emplois du temps</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            {emplois.length} emploi{emplois.length > 1 ? "s" : ""} créé{emplois.length > 1 ? "s" : ""}
          </div>
        </div>
        <button className="btn btn--primary" onClick={() => setModal(true)}
          style={{ background: "#059669" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvel emploi du temps
        </button>
      </div>

      {/* Liste des emplois existants */}
      {loading && <div className="table-loading">Chargement…</div>}
      {!loading && error && <div className="alert alert--error">{error}</div>}

      {!loading && emplois.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12, marginBottom: 20,
        }}>
          {emplois.map(e => (
            <div key={e.id}
              onClick={() => afficherEmploi(e.id)}
              style={{
                background: emploiActif?.id === e.id ? "#eff6ff" : "white",
                border: `1px solid ${emploiActif?.id === e.id ? "#2563eb" : "#e2e8f0"}`,
                borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                transition: "all 0.15s",
              }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                {e.groupe}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Période: {e.periodeDebut ?? e.periode_debut ?? "—"}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{
                  background: e.valide ? "#dcfce7" : "#fef3c7",
                  color: e.valide ? "#15803d" : "#b45309",
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  borderRadius: 10,
                }}>
                  {e.valide ? "Validé" : "En attente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && emplois.length === 0 && !emploiActif && (
        <div className="table-card">
          <div className="table-empty" style={{ padding: "50px 20px" }}>
            <div style={{ marginBottom: 12, color: "#64748b" }}>
              Aucun emploi du temps créé.
            </div>
            <button className="btn btn--primary" onClick={() => setModal(true)}
              style={{ background: "#059669" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Créer le premier emploi du temps
            </button>
          </div>
        </div>
      )}

      {/* Affichage emploi sélectionné */}
      {emploiActif && (
        <div className="table-card">
          <div className="emploi-grid-wrapper">
            <div className="emploi-header">
              <div>
                <div className="emploi-header__title">
                  EMPLOI DU TEMPS — {emploiActif.efp ?? "ISTA HAY SALAM SALE"}
                </div>
                <div className="emploi-header__subtitle">
                  Année de Formation 2025-2026 · Période: {emploiActif.periodeDebut ?? emploiActif.periode_debut}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn--outline btn--light btn--sm"
                  onClick={() => window.print()}>
                  Imprimer
                </button>
                <button className="btn btn--outline btn--light btn--sm"
                  onClick={() => setEmploiActif(null)}>
                  Fermer
                </button>
              </div>
            </div>

            <div className="emploi-info-bar">
              EFP: ISTA HAY SALAM SALE &nbsp;|&nbsp;
              Filière: {emploiActif.filiere ?? "—"} &nbsp;|&nbsp;
              <strong>Groupe: {emploiActif.groupe}</strong>
            </div>

            <div className="table-scroll">
              <table className="emploi-table">
                <thead>
                  <tr>
                    <th className="emploi-th--jour">Jours</th>
                    {SEANCES.map((s, i) => (
                      <th key={i} className="text-center">
                        {s.label}<br />
                        <span className="emploi-th__horaire">{s.horaire}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jours.map(([jour, seances]) => (
                    <tr key={jour}>
                      <td className="emploi-jour">{jour}</td>
                      {(seances ?? [null,null,null,null]).map((s, i) => (
                        <SeanceCell key={i} s={s} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="emploi-footer">
              <span>Le Directeur · Fait à Salé · Date: {emploiActif.periodeDebut ?? emploiActif.periode_debut}</span>
              <span>ISTA HAY SALAM SALE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}