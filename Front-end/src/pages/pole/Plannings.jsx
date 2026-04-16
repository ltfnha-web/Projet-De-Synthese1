import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const NB_SEM = 23;

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
};

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
        <span style={{ fontWeight: 700, color: "var(--sl8)", fontSize: 12, whiteSpace: "nowrap" }}>{p.groupe_nom}</span>
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
          <span style={{ fontSize: 11, color: "var(--sl6)" }}>{p.module_nom}</span>
        </div>
      </td>
      <td style={{ padding: editing ? "5px 10px" : "7px 14px", whiteSpace: "nowrap", minWidth: 140 }}>
        {editing ? (
          <select style={selStyle} value={editData.formateur_id}
            onChange={e => setEditData(d => ({ ...d, formateur_id: e.target.value }))}>
            <option value="">— Formateur —</option>
            {formateurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        ) : (
          <span style={{ fontSize: 11, color: "var(--sl5)" }}>{p.formateur_nom}</span>
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
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--sl8)" }}>{pm.module_nom}</span>
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
          {formateurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
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

  const [filterGroupe, setFilterGroupe]     = useState("");
  const [filterSemestre, setFilterSemestre] = useState("");

  const [groupes, setGroupes]       = useState([]);
  const [modules, setModules]       = useState([]);
  const [formateurs, setFormateurs] = useState([]);

  const FORM_INIT = { groupe_id: "", module_id: "", formateur_id: "", semestre: "S1", mh_drif: "", charge_hebdo: "", type: "Régionale", mode: "PRESENTIEL" };
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(FORM_INIT);
  const [saving, setSaving] = useState(false);

  const [pendingModules, setPendingModules] = useState({});

  const [autoModal, setAutoModal]   = useState(false);
  const [autoTarget, setAutoTarget] = useState(null);
  const [autoCharge, setAutoCharge] = useState("");
  const [autoSaving, setAutoSaving] = useState(false);

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
        module_nom:    m.intitule ?? m.code ?? `Module ${m.id}`,
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
    // ── Check doublon groupe_id + module_id ──
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
      flash(`Planning "${pm.module_nom}" créé.`);
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
      {/* EN-TÊTE */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Planning Hebdomadaire</div>
          <div className="pg-subtitle">Répartition des MH par semaine — {anneeScolaire} · {NB_SEM} semaines / semestre</div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={fetchPlannings}>{Ico.refresh} Actualiser</button>
          <button className="btn-primary" onClick={() => { setForm(FORM_INIT); setModal(true); }}>{Ico.plus} Nouveau Planning</button>
        </div>
      </div>

      {/* ALERTE */}
      {alert && (
        <div className={`al-alert al-alert-${alert.type}`}>
          {alert.type === "ok" ? Ico.check : Ico.alert} {alert.msg}
        </div>
      )}

      {/* FILTRES */}
      <div className="table-card" style={{ marginBottom: 16 }}>
        <div className="table-toolbar">
          <div className="toolbar-filters">
            <span style={{ fontSize: 12, color: "var(--sl5)", display: "flex", alignItems: "center", gap: 5 }}>{Ico.filter} Filtres</span>
            <select className="form-select" style={{ width: 210, height: 34 }} value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
              <option value="">Tous les groupes</option>
              {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
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

      {/* MODULES RESTANTS */}
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
                    Modules restants — {groupe?.nom ?? `Groupe ${groupeId}`}
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
                    <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--sl5)", textTransform: "uppercase", letterSpacing: ".5px" }}>Module</th>
                    <th style={{ padding: "8px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--sl5)", textTransform: "uppercase", letterSpacing: ".5px" }}>Semestre</th>
                    <th style={{ padding: "8px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--sl5)", textTransform: "uppercase", letterSpacing: ".5px" }}>MH</th>
                    <th style={{ padding: "8px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--sl5)", textTransform: "uppercase", letterSpacing: ".5px" }}>H/sem</th>
                    <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--sl5)", textTransform: "uppercase", letterSpacing: ".5px" }}>Formateur</th>
                    <th style={{ width: 50 }} />
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

      {/* TABLEAU PRINCIPAL */}
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

      {/* MODAL NOUVEAU PLANNING */}
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
                {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}{g.filiere ? ` (${g.filiere})` : ""}</option>)}
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
                        <option key={m.id} value={m.id}>{m.intitule}{m.mh_drif ? ` — ${m.mh_drif}h` : ""}</option>
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
                {formateurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
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
                <label className="form-label">
                  MH / semaine
                  <span style={{ fontSize: 10, color: "var(--sl4)", marginLeft: 4, fontWeight: 400, textTransform: "none" }}>(modifiable)</span>
                </label>
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

      {/* MODAL AUTO-DISTRIBUER */}
      {autoModal && autoTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAutoModal(false)}>
          <div className="modal" style={{ width: 420 }}>
            <div className="modal-header">
              <div className="modal-title">Distribution automatique</div>
              <button className="modal-close" onClick={() => setAutoModal(false)}>{Ico.close}</button>
            </div>
            <div style={{ background: "var(--sl0)", borderRadius: "var(--r-md)", padding: "12px 16px", marginBottom: 20, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--sl5)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".4px", fontWeight: 600 }}>Planning sélectionné</div>
              <div style={{ fontWeight: 700, color: "var(--sl8)", fontSize: 14 }}>{autoTarget.groupe_nom}</div>
              <div style={{ fontSize: 12, color: "var(--sl6)", marginTop: 2 }}>{autoTarget.module_nom}</div>
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
    </div>
  );
}