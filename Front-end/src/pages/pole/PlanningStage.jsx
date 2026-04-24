// src/pages/pole/PlanningStage.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toStr(v) {
  if (v == null) return "";
  if (typeof v === "object") return v.nom ?? v.intitule ?? v.code ?? JSON.stringify(v);
  return String(v);
}

const STATUT_META = {
  planifie: { label: "Planifié", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", gantt: "rgba(29,78,216,0.85)"  },
  en_cours: { label: "En cours", bg: "#f0fdf4", color: "#15803d", border: "#86efac", gantt: "rgba(21,128,61,0.85)"  },
  termine:  { label: "Terminé",  bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", gantt: "rgba(71,85,105,0.85)" },
};

const Ico = {
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  edit:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  close:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  alert:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  cal:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  info:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

// ── Badge statut ───────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const m = STATUT_META[statut] ?? STATUT_META.planifie;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      whiteSpace: "nowrap",
    }}>
      {m.label}
    </span>
  );
}

// ── Ligne Gantt ────────────────────────────────────────────────────────────────
function GanttRow({ stage, semaines, premiereS2, onEdit, onDelete, idx }) {
  const rowBg      = idx % 2 !== 0 ? "var(--sl0)" : "var(--surface)";
  const covered    = new Set((stage.semaines_bloquees ?? []).map(Number));
  const ganttColor = STATUT_META[stage.statut]?.gantt ?? STATUT_META.planifie.gantt;

  // Coins arrondis : première/dernière semaine couverte dans les semaines affichées
  const coveredNums  = semaines.map(s => s.num).filter(n => covered.has(n));
  const firstCovered = coveredNums[0];
  const lastCovered  = coveredNums[coveredNums.length - 1];

  return (
    <tr style={{ borderBottom: "1px solid var(--sl1)", background: rowBg }}>

      {/* Groupe */}
      <td style={{
        padding: "7px 14px", position: "sticky", left: 0, zIndex: 1,
        background: rowBg, whiteSpace: "nowrap", minWidth: 130,
      }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: "var(--sl8)" }}>{toStr(stage.groupe_nom)}</span>
        <div style={{ fontSize: 10, color: "var(--sl5)", marginTop: 1 }}>{toStr(stage.filiere_nom)}</div>
      </td>

      {/* Période */}
      <td style={{ padding: "7px 14px", whiteSpace: "nowrap", minWidth: 100 }}>
        <div style={{ fontSize: 11, color: "var(--sl7)", fontWeight: 600 }}>
          {stage.date_debut?.split("-").reverse().join("/")}
        </div>
        <div style={{ fontSize: 10, color: "var(--sl4)", marginTop: 1 }}>
          → {stage.date_fin?.split("-").reverse().join("/")}
        </div>
      </td>

      {/* Durée */}
      <td style={{ textAlign: "center", padding: "7px 10px", whiteSpace: "nowrap", minWidth: 64 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--sl7)" }}>{stage.duree_semaines}</span>
        <span style={{ fontSize: 10, color: "var(--sl4)", marginLeft: 2 }}>sem</span>
      </td>

      {/* Statut */}
      <td style={{ padding: "7px 10px", whiteSpace: "nowrap", minWidth: 80, borderRight: "2px solid var(--border)" }}>
        <StatutBadge statut={stage.statut} />
      </td>

      {/* Cellules Gantt */}
      {semaines.map(s => {
        const inStage = covered.has(s.num);
        const isFirst = s.num === firstCovered;
        const isLast  = s.num === lastCovered;

        return (
          <td
            key={s.num}
            style={{
              width: 32, minWidth: 32, padding: 0,
              borderRight: s.num === premiereS2 - 1
                ? "3px solid rgba(124,58,237,.25)"
                : "1px solid var(--border)",
              verticalAlign: "middle",
            }}
            title={inStage
              ? `Semaine ${s.num} — ${toStr(stage.groupe_nom)} (${stage.date_debut} → ${stage.date_fin})`
              : undefined}
          >
            {inStage && (
              <div style={{
                height: 20,
                margin: `4px ${isLast ? 3 : 0}px 4px ${isFirst ? 3 : 0}px`,
                background: ganttColor,
                borderRadius: isFirst && isLast ? 6
                  : isFirst ? "6px 0 0 6px"
                  : isLast  ? "0 6px 6px 0"
                  : 0,
              }} />
            )}
          </td>
        );
      })}

      {/* Actions */}
      <td style={{ textAlign: "center", padding: "0 6px", whiteSpace: "nowrap" }}>
        <button className="btn-icon btn-icon-edit" title="Modifier"  onClick={() => onEdit(stage)}>{Ico.edit}</button>
        <button className="btn-icon btn-icon-del"  title="Supprimer" onClick={() => onDelete(stage.id)}>{Ico.trash}</button>
      </td>
    </tr>
  );
}

// ── Modal création / édition ───────────────────────────────────────────────────
function StageModal({ groupes, onClose, onSave, initial }) {
  const INIT = { groupe_id: "", date_debut: "", date_fin: "", statut: "planifie" };
  const [form, setForm]     = useState(initial
    ? { groupe_id: String(initial.groupe_id), date_debut: initial.date_debut ?? "", date_fin: initial.date_fin ?? "", statut: initial.statut ?? "planifie" }
    : INIT);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  let dureePreview = null;
  if (form.date_debut && form.date_fin && form.date_fin > form.date_debut)
    dureePreview = Math.ceil((new Date(form.date_fin) - new Date(form.date_debut)) / (7 * 86400000));

  const handleSubmit = async () => {
    if (!form.groupe_id || !form.date_debut || !form.date_fin) { setErr("Tous les champs sont obligatoires."); return; }
    if (form.date_fin <= form.date_debut) { setErr("La date de fin doit être après la date de début."); return; }
    setSaving(true); setErr("");
    try { await onSave(form, initial?.id); }
    catch (e) { setErr(e?.response?.data?.message ?? "Erreur lors de l'enregistrement."); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 460 }}>
        <div className="modal-header">
          <div className="modal-title">{initial ? "Modifier le stage" : "Nouveau stage"}</div>
          <button className="modal-close" onClick={onClose}>{Ico.close}</button>
        </div>

        <div className="form-group">
          <label className="form-label">Groupe <span style={{ color: "var(--rd5)" }}>*</span></label>
          <select className="form-select" value={form.groupe_id}
            onChange={e => setForm(p => ({ ...p, groupe_id: e.target.value }))} disabled={!!initial}>
            <option value="">— Sélectionner un groupe —</option>
            {groupes.map(g => (
              <option key={g.id} value={g.id}>{toStr(g.nom)}{g.filiere ? ` (${toStr(g.filiere)})` : ""}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Date début <span style={{ color: "var(--rd5)" }}>*</span></label>
            <input className="form-input" type="date" value={form.date_debut}
              onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Date fin <span style={{ color: "var(--rd5)" }}>*</span></label>
            <input className="form-input" type="date" value={form.date_fin} min={form.date_debut || undefined}
              onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))} />
          </div>
        </div>

        {dureePreview !== null && (
          <div style={{
            padding: "9px 14px", marginBottom: 14, background: "var(--p0)", border: "1px solid var(--p1)",
            borderRadius: "var(--r-md)", fontSize: 12, color: "var(--p7)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {Ico.cal}
            <span>Durée calculée : <strong>{dureePreview} semaine{dureePreview > 1 ? "s" : ""}</strong></span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Statut</label>
          <select className="form-select" value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </div>

        {err && (
          <div style={{
            padding: "8px 12px", marginBottom: 12, background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: "var(--r-md)", fontSize: 12, color: "#dc2626",
            display: "flex", gap: 6, alignItems: "center",
          }}>
            {Ico.alert} {err}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Enregistrement..." : initial ? "Enregistrer" : "Créer le stage"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── COMPOSANT PRINCIPAL ────────────────────────────────────────────────────────
export default function PlanningStage() {
  const [stages, setStages]            = useState([]);
  const [groupes, setGroupes]          = useState([]);
  const [semaines, setSemaines]        = useState([]);
  const [anneeScolaire, setAnneeSco]   = useState("");
  const [loading, setLoading]          = useState(true);
  const [alert, setAlert]              = useState(null);
  const [filterGroupe, setFilterG]     = useState("");
  const [filterStatut, setFilterS]     = useState("");
  const [filterSemestre, setFilterSem] = useState("");
  const [modal, setModal]              = useState(false);
  const [editTarget, setEditTarget]    = useState(null);

  const flash = (msg, type = "ok") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterGroupe) params.groupe_id = filterGroupe;
      const [stagesRes, planningsRes] = await Promise.all([
        axios.get("/stages", { params }),
        axios.get("/plannings"),
      ]);
      setStages(stagesRes.data.data ?? []);
      setSemaines(planningsRes.data.semaines_annee ?? []);
      setAnneeSco(planningsRes.data.annee_scolaire ?? "");
    } catch { flash("Erreur de chargement.", "err"); }
    setLoading(false);
  }, [filterGroupe]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { axios.get("/pole-groupes").then(r => setGroupes(r.data.data ?? [])); }, []);

  const handleSave = async (form, id) => {
    if (id) { await axios.put(`/stages/${id}`, form); flash("Stage modifié."); }
    else    { await axios.post("/stages", form);       flash("Stage créé.");    }
    setModal(false); setEditTarget(null); fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce stage ? Les semaines seront de nouveau disponibles.")) return;
    try { await axios.delete(`/stages/${id}`); flash("Stage supprimé."); fetchAll(); }
    catch { flash("Erreur de suppression.", "err"); }
  };

  const stagesFiltres = stages.filter(s => {
    if (filterGroupe && String(s.groupe_id) !== String(filterGroupe)) return false;
    if (filterStatut && s.statut !== filterStatut) return false;
    return true;
  });

  const semainesAff = filterSemestre ? semaines.filter(s => `S${s.semestre}` === filterSemestre) : semaines;
  const premiereS2  = semaines.find(s => s.semestre === 2)?.num;

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Planning des Stages</div>
          <div className="pg-subtitle">Vue Gantt — Périodes de stage par groupe · {anneeScolaire}</div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={fetchAll}>{Ico.refresh} Actualiser</button>
          <button className="btn-primary" onClick={() => setModal(true)}>{Ico.plus} Nouveau Stage</button>
        </div>
      </div>

      {alert && (
        <div className={`al-alert al-alert-${alert.type}`}>
          {alert.type === "ok" ? Ico.check : Ico.alert} {alert.msg}
        </div>
      )}

      {/* ── Légende ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {Object.entries(STATUT_META).map(([key, m]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 28, height: 12, borderRadius: 3, background: m.gantt }} />
            <span style={{ fontSize: 11, color: "var(--sl5)", fontWeight: 600 }}>Stage {m.label}</span>
          </div>
        ))}
        <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 2px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 28, height: 12, borderRadius: 3,
            background: "repeating-linear-gradient(45deg,#cbd5e1 0,#cbd5e1 2px,#f1f5f9 2px,#f1f5f9 6px)",
          }} />
          <span style={{ fontSize: 11, color: "var(--sl5)", fontWeight: 600 }}>Semaine occupée (planning)</span>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div className="table-card" style={{ marginBottom: 16 }}>
        <div className="table-toolbar">
          <div className="toolbar-filters">
            <select className="form-select" style={{ width: 210, height: 34 }} value={filterGroupe} onChange={e => setFilterG(e.target.value)}>
              <option value="">Tous les groupes</option>
              {groupes.map(g => <option key={g.id} value={g.id}>{toStr(g.nom)}{g.filiere ? ` (${toStr(g.filiere)})` : ""}</option>)}
            </select>
            <select className="form-select" style={{ width: 150, height: 34 }} value={filterStatut} onChange={e => setFilterS(e.target.value)}>
              <option value="">Tous statuts</option>
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
            </select>
            <select className="form-select" style={{ width: 150, height: 34 }} value={filterSemestre} onChange={e => setFilterSem(e.target.value)}>
              <option value="">Toute l'année</option>
              <option value="S1">Semestre 1</option>
              <option value="S2">Semestre 2</option>
            </select>
            {(filterGroupe || filterStatut || filterSemestre) && (
              <button className="btn-secondary" style={{ height: 34, fontSize: 12 }}
                onClick={() => { setFilterG(""); setFilterS(""); setFilterSem(""); }}>
                {Ico.close} Réinitialiser
              </button>
            )}
          </div>
          <span className="results-count">{stagesFiltres.length} stage(s)</span>
        </div>
      </div>

      {/* ── Tableau Gantt ── */}
      {loading ? (
        <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
      ) : (
        <div className="table-card" style={{ padding: 0 }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, tableLayout: "auto", width: "max-content", minWidth: "100%" }}>
              <thead>
                {/* Ligne 1 : numéros semaines */}
                <tr style={{ background: "var(--sl1)" }}>
                  <th colSpan={4} style={{
                    textAlign: "left", padding: "6px 14px", fontSize: 11, fontWeight: 600,
                    color: "var(--sl5)", borderRight: "2px solid var(--border)",
                    position: "sticky", left: 0, zIndex: 3, background: "var(--sl1)", whiteSpace: "nowrap",
                  }}>
                    Année scolaire {anneeScolaire}
                  </th>
                  {semainesAff.map(s => (
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
                  <th style={{ width: 72 }} />
                </tr>

                {/* Ligne 2 : libellés colonnes + dates lundi */}
                <tr style={{ background: "var(--sl0)", borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "9px 14px", whiteSpace: "nowrap", minWidth: 130, position: "sticky", left: 0, zIndex: 3, background: "var(--sl0)" }}>Groupe</th>
                  <th style={{ textAlign: "left", padding: "9px 14px", whiteSpace: "nowrap", minWidth: 100 }}>Période</th>
                  <th style={{ textAlign: "center", whiteSpace: "nowrap", minWidth: 64 }}>Durée</th>
                  <th style={{ textAlign: "center", whiteSpace: "nowrap", minWidth: 80, borderRight: "2px solid var(--border)" }}>Statut</th>
                  {semainesAff.map(s => (
                    <th key={s.num} style={{
                      textAlign: "center", fontSize: 9, padding: "5px 0", fontWeight: 500,
                      color: "var(--sl4)", width: 32, minWidth: 32,
                      borderRight: s.num === premiereS2 - 1 ? "3px solid rgba(124,58,237,.25)" : "1px solid var(--border)",
                    }}>
                      {s.date_lundi?.slice(5).replace("-", "/")}
                    </th>
                  ))}
                  <th style={{ width: 72 }} />
                </tr>
              </thead>

              <tbody>
                {stagesFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={4 + semainesAff.length + 1}>
                      <div className="empty">
                        <div className="empty-icon">{Ico.cal}</div>
                        <div className="empty-title">Aucun stage planifié</div>
                        <div className="empty-desc">Cliquez sur "Nouveau Stage" pour définir une période de stage pour un groupe.</div>
                      </div>
                    </td>
                  </tr>
                ) : stagesFiltres.map((stage, idx) => (
                  <GanttRow
                    key={stage.id}
                    stage={stage}
                    semaines={semainesAff}
                    premiereS2={premiereS2}
                    idx={idx}
                    onEdit={s => setEditTarget(s)}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal      && <StageModal groupes={groupes} onClose={() => setModal(false)}     onSave={handleSave} initial={null}       />}
      {editTarget && <StageModal groupes={groupes} onClose={() => setEditTarget(null)} onSave={handleSave} initial={editTarget} />}
    </div>
  );
}