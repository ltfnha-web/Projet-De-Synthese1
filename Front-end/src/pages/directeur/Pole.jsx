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

export default function Pole() {
  const [secteurs, setSecteurs]     = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterFormateur, setFilterFormateur] = useState("");
  const [alert, setAlert]           = useState(null);

  // Détail secteur sélectionné
  const [selectedSecteur, setSelectedSecteur] = useState(null);
  const [groupes, setGroupes]                 = useState([]);
  const [groupesLoading, setGroupesLoading]   = useState(false);
  const [groupeSearch, setGroupeSearch]       = useState("");
  const [groupeAnnee, setGroupeAnnee]         = useState("");

  // Modal assign
  const [modal, setModal]           = useState(false);
  const [modalSecteur, setModalSecteur] = useState(null);
  const [assignForm, setAssignForm] = useState({ formateur_id: "", notes: "" });
  const [saving, setSaving]         = useState(false);

  const flash = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  // Fetch secteurs
  const fetchSecteurs = useCallback(() => {
    setLoading(true);
    axios.get("/pole", { params: { search, formateur_id: filterFormateur } })
      .then(r => setSecteurs(r.data))
      .catch(() => flash("Erreur de chargement.", "err"))
      .finally(() => setLoading(false));
  }, [search, filterFormateur]);

  useEffect(() => { fetchSecteurs(); }, [fetchSecteurs]);

  // Fetch formateurs pour le select — sans filtre statut pour tout récupérer
useEffect(() => {
    axios.get("/formateurs/all")  
      .then(r => {
        setFormateurs(Array.isArray(r.data) ? r.data : []);
      })
}, []);

  // Fetch groupes d'un secteur
  const fetchGroupes = useCallback((secteurId) => {
    if (!secteurId) return;
    setGroupesLoading(true);
    axios.get(`/pole/${secteurId}/groupes`, { params: { search: groupeSearch, annee: groupeAnnee } })
      .then(r => setGroupes(r.data))
      .catch(console.error)
      .finally(() => setGroupesLoading(false));
  }, [groupeSearch, groupeAnnee]);

  useEffect(() => {
    if (selectedSecteur) fetchGroupes(selectedSecteur.id);
  }, [selectedSecteur, fetchGroupes]);

  const openAssign = (s) => {
    setModalSecteur(s);
    setAssignForm({ formateur_id: s.responsable?.id || "", notes: s.responsable?.notes || "" });
    setModal(true);
  };

  const submitAssign = async () => {
    setSaving(true);
    try {
      await axios.post("/pole/assign", {
        secteur_id:   modalSecteur.id,
        formateur_id: assignForm.formateur_id || null,
        notes:        assignForm.notes,
      });
      flash("Responsable mis à jour avec succès.");
      setModal(false);
      fetchSecteurs();
      if (selectedSecteur?.id === modalSecteur.id) fetchGroupes(modalSecteur.id);
    } catch { flash("Erreur lors de l'enregistrement.", "err"); }
    finally { setSaving(false); }
  };

  const removeResponsable = async (secteurId) => {
    if (!window.confirm("Retirer le responsable de ce secteur ?")) return;
    try {
      await axios.delete(`/pole/${secteurId}`);
      flash("Responsable retiré.");
      fetchSecteurs();
    } catch { flash("Erreur.", "err"); }
  };

  const avcColor = (avc) => {
    if (avc >= 70) return "#10b981";
    if (avc >= 50) return "#0ea5e9";
    if (avc >= 30) return "#f59e0b";
    return "#ef4444";
  };

  // Fix filtre __none__ (sans responsable)
  const filtered = secteurs.filter(s => {
    if (search && !s.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterFormateur === "__none__") return !s.responsable;
    if (filterFormateur) return s.responsable?.id == filterFormateur;
    return true;
  });

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Pôle — Responsables de Secteur</div>
          <div className="pg-subtitle">
            Assignez un formateur responsable à chaque secteur et consultez les groupes associés
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={() => downloadTablePdf("table-pole", "Pôle Secteurs — ISTA Hay Salam")}>
            {Icons.download} Exporter PDF
          </button>
        </div>
      </div>

      {alert && (
        <div className={`al-alert al-alert-${alert.type}`}>
          {alert.type === "ok" ? Icons.check : Icons.alert}
          {alert.msg}
        </div>
      )}

      {/* ── FILTRES ── */}
      <div className="table-card" style={{ marginBottom: 20 }}>
        <div className="table-toolbar">
          <div className="toolbar-filters">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sl4)", display: "flex", pointerEvents: "none" }}>{Icons.search}</span>
              <input className="search-input" style={{ paddingLeft: 32 }} placeholder="Rechercher un secteur..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 220, height: 36 }} value={filterFormateur}
              onChange={e => setFilterFormateur(e.target.value)}>
              <option value="">Tous les responsables</option>
              <option value="__none__">Sans responsable</option>
              {formateurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <span className="results-count">{filtered.length} secteur(s)</span>
        </div>

        {/* ── TABLE SECTEURS ── */}
        {loading ? (
          <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon">{Icons.map}</div><div className="empty-title">Aucun secteur</div></div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table id="table-pole" style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th>#</th><th>Secteur</th><th>Filières</th><th>Groupes</th>
                  <th>Critiques</th><th>AVC Moyen</th><th>MH Restante</th>
                  <th>Responsable</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id}
                    style={{ cursor: "pointer", background: selectedSecteur?.id === s.id ? "var(--p0)" : undefined }}
                    onClick={() => setSelectedSecteur(s)}
                  >
                    <td style={{ color: "var(--sl4)" }}>{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: avcColor(s.avc_moyen * 100), flexShrink: 0 }} />
                        <strong style={{ color: "var(--sl8)" }}>{s.nom}</strong>
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{s.nb_filieres}</span></td>
                    <td><span className="badge badge-info">{s.nb_groupes}</span></td>
                    <td>
                      {s.groupes_critiques > 0
                        ? <span className="badge badge-red">{s.groupes_critiques} critiques</span>
                        : <span className="badge badge-ok">Aucun</span>
                      }
                    </td>
                    <td><AvcBar value={s.avc_moyen} /></td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                      {s.mh_restante > 0
                        ? <span style={{ color: "#ef4444", fontWeight: 600 }}>{s.mh_restante?.toLocaleString()}h</span>
                        : <span style={{ color: "#10b981" }}>—</span>
                      }
                    </td>
                    <td>
                      {s.responsable
                        ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--p0)", border: "1px solid var(--p2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--p6)", flexShrink: 0 }}>
                              {s.responsable.nom?.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </div>
                            <span style={{ fontSize: 13, color: "var(--sl7)" }}>{s.responsable.nom}</span>
                          </div>
                        )
                        : <span style={{ fontSize: 12, color: "var(--sl4)", fontStyle: "italic" }}>Non assigné</span>
                      }
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn-icon btn-icon-edit" title="Assigner responsable" onClick={() => openAssign(s)}>{Icons.star}</button>
                      {s.responsable && (
                        <button className="btn-icon btn-icon-del" title="Retirer responsable" onClick={() => removeResponsable(s.id)}>{Icons.trash}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DÉTAIL SECTEUR SÉLECTIONNÉ ── */}
      {selectedSecteur && (
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <strong style={{ fontSize: 14, color: "var(--sl8)" }}>
                Groupes du secteur — {selectedSecteur.nom}
              </strong>
              {selectedSecteur.responsable && (
                <span style={{ marginLeft: 12, fontSize: 12, color: "var(--p6)" }}>
                  Responsable : {selectedSecteur.responsable.nom}
                </span>
              )}
            </div>
            <div className="toolbar-filters">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sl4)", display: "flex", pointerEvents: "none" }}>{Icons.search}</span>
                <input className="search-input" style={{ paddingLeft: 32, width: 200 }} placeholder="Nom du groupe..."
                  value={groupeSearch} onChange={e => setGroupeSearch(e.target.value)} />
              </div>
              <select className="form-select" style={{ width: 130, height: 36 }} value={groupeAnnee}
                onChange={e => setGroupeAnnee(e.target.value)}>
                <option value="">Toutes années</option>
                <option value="1">Année 1</option>
                <option value="2">Année 2</option>
                <option value="3">Année 3</option>
              </select>
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setSelectedSecteur(null)}>
                {Icons.close} Fermer
              </button>
            </div>
          </div>

          {groupesLoading ? (
            <div className="loader"><div className="loader-spinner" /></div>
          ) : groupes.length === 0 ? (
            <div className="empty"><div className="empty-icon">{Icons.groups}</div><div className="empty-title">Aucun groupe</div></div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ minWidth: 780 }}>
                <thead>
                  <tr>
                    <th>#</th><th>Groupe</th><th>Filière</th><th>Année</th>
                    <th>Effectif</th><th>Mode</th><th>MH DRIF</th>
                    <th>MH Réalisée</th><th>Restante</th><th>AVC</th>
                  </tr>
                </thead>
                <tbody>
                  {groupes.map((g, i) => (
                    <tr key={g.id}>
                      <td style={{ color: "var(--sl4)" }}>{i + 1}</td>
                      <td><strong>{g.nom}</strong></td>
                      <td style={{ fontSize: 12, color: "var(--sl6)" }}>{g.filiere_nom}</td>
                      <td><span className="badge badge-info">Année {g.annee_formation}</span></td>
                      <td><strong>{g.effectif}</strong></td>
                      <td style={{ fontSize: 12 }}>{g.mode || "—"}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{g.mh_drif}h</td>
                      <td style={{ fontVariantNumeric: "tabular-nums", color: "#10b981", fontWeight: 600 }}>{g.mh_realisee}h</td>
                      <td style={{ fontVariantNumeric: "tabular-nums", color: g.mh_restante > 0 ? "#ef4444" : "var(--sl4)", fontWeight: g.mh_restante > 0 ? 600 : 400 }}>
                        {g.mh_restante > 0 ? g.mh_restante + "h" : "—"}
                      </td>
                      <td><AvcBar value={g.avc_moyen} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL ASSIGN ── */}
      {modal && modalSecteur && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ width: 480 }}>
            <div className="modal-header">
              <div className="modal-title">Assigner un responsable</div>
              <button className="modal-close" onClick={() => setModal(false)}>{Icons.close}</button>
            </div>

            <div style={{ background: "var(--sl0)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--sl5)", marginBottom: 2 }}>Secteur</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sl8)" }}>{modalSecteur.nom}</div>
              <div style={{ fontSize: 12, color: "var(--sl5)", marginTop: 4 }}>
                {modalSecteur.nb_groupes} groupes · AVC {(modalSecteur.avc_moyen * 100).toFixed(1)}%
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Formateur responsable</label>
              <select
                className="form-select"
                value={assignForm.formateur_id}
                onChange={e => setAssignForm(p => ({ ...p, formateur_id: e.target.value }))}
              >
                <option value="">— Aucun responsable —</option>
                {formateurs.map(f => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optionnel)</label>
              <textarea
                className="form-input"
                style={{ height: 80, resize: "vertical", paddingTop: 10 }}
                placeholder="Observations, remarques..."
                value={assignForm.notes}
                onChange={e => setAssignForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={submitAssign} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}