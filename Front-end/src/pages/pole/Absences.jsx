import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { openPrintWindow, NAVY } from "../../components/PrintDocOFPPT";

const FF = "Arial, Helvetica, sans-serif";

const MODAL_INIT = {
  formateur_id: "",
  date_debut: "",
  date_fin: "",
  cause: "",
  nb_heures: "",
};

const Ico = {
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  edit:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  print:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  close:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  user:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

/* ── Print document ────────────────────────────────────────── */
function AbsencesPrintDoc({ absences, formateurs, filterFormateurId }) {
  const filteredFormateur = filterFormateurId
    ? formateurs.find(f => String(f.id) === String(filterFormateurId))
    : null;

  const rows = absences;

  return (
    <div id="absences-print-doc" style={{ display: "none" }}>
      <div style={{ fontFamily: FF, width: "100%", padding: 0 }}>
        {/* Header */}
        <div style={{
          background: NAVY, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "8px 14px",
        }}>
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 9, opacity: 0.75, fontFamily: FF }}>OFPPT — CF SALÉ 1 / ISTA HAY SALAM</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: 0.5, fontFamily: FF }}>
              Registre des Absences des Formateurs
            </div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,.6)", marginTop: 2, fontFamily: FF }}>
              Année de Formation 2025–2026
            </div>
          </div>
          <div style={{ textAlign: "right", color: "#fff" }}>
            <div style={{ fontSize: 8, opacity: 0.75, fontFamily: FF }}>
              Édité le {new Date().toLocaleDateString("fr-FR")}
            </div>
            {filteredFormateur && (
              <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2, fontFamily: FF }}>
                Formateur : {filteredFormateur.nom}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: NAVY }}>
              {["#", "Formateur", "Date Début", "Date Fin", "Cause", "Heures", "Semaines"].map((h, i) => (
                <th key={i} style={{
                  border: "1px solid #bbb", padding: "5px 6px",
                  fontSize: 9, fontWeight: 700, color: "#fff",
                  textAlign: "left", fontFamily: FF,
                  width: i === 0 ? "4%" : i === 1 ? "22%" : i === 2 ? "12%" : i === 3 ? "12%" : i === 4 ? "32%" : "9%",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ border: "1px solid #bbb", padding: "10px", textAlign: "center", fontSize: 9, fontFamily: FF, color: "#888" }}>
                  Aucune absence enregistrée.
                </td>
              </tr>
            ) : rows.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                <td style={{ border: "1px solid #ddd", padding: "4px 6px", fontSize: 8.5, fontFamily: FF, textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #ddd", padding: "4px 6px", fontSize: 8.5, fontFamily: FF, fontWeight: 600 }}>{a.formateur}</td>
                <td style={{ border: "1px solid #ddd", padding: "4px 6px", fontSize: 8.5, fontFamily: FF }}>{fmt(a.date_debut)}</td>
                <td style={{ border: "1px solid #ddd", padding: "4px 6px", fontSize: 8.5, fontFamily: FF }}>{fmt(a.date_fin)}</td>
                <td style={{ border: "1px solid #ddd", padding: "4px 6px", fontSize: 8.5, fontFamily: FF }}>{a.cause || "—"}</td>
                <td style={{ border: "1px solid #ddd", padding: "4px 6px", fontSize: 8.5, fontFamily: FF, textAlign: "center" }}>{a.nb_heures ? `${a.nb_heures}h` : "—"}</td>
                <td style={{ border: "1px solid #ddd", padding: "4px 6px", fontSize: 8.5, fontFamily: FF, textAlign: "center" }}>{a.nb_semaines}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        {rows.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: "5px 12px", fontSize: 9, fontFamily: FF }}>
              <span style={{ color: "#64748b" }}>Total absences : </span>
              <strong>{rows.length}</strong>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: "5px 12px", fontSize: 9, fontFamily: FF }}>
              <span style={{ color: "#64748b" }}>Total heures : </span>
              <strong>{rows.reduce((s, a) => s + (parseFloat(a.nb_heures) || 0), 0)}h</strong>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
          {["Coordinateur Pôle", "Chef d'Établissement"].map(role => (
            <div key={role} style={{ textAlign: "center", width: "30%" }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, fontFamily: FF, color: "#374151" }}>{role}</div>
              <div style={{ marginTop: 24, borderTop: "1px solid #999", paddingTop: 4, fontSize: 8, fontFamily: FF, color: "#888" }}>Signature et cachet</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function Absences() {
  const [absences, setAbsences]     = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [filterFid, setFilterFid]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [alert, setAlert]           = useState(null);
  const [modal, setModal]           = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(MODAL_INIT);
  const [saving, setSaving]         = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const flash = (msg, type = "ok") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchAbsences = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterFid) params.formateur_id = filterFid;
    axios.get("/absences", { params })
      .then(r => setAbsences(r.data ?? []))
      .catch(() => flash("Erreur de chargement.", "err"))
      .finally(() => setLoading(false));
  }, [filterFid]);

  useEffect(() => { fetchAbsences(); }, [fetchAbsences]);

  useEffect(() => {
    axios.get("/pole-formateurs").then(r => setFormateurs(r.data.data ?? []));
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...MODAL_INIT, formateur_id: filterFid });
    setModal(true);
  };

  const openEdit = (a) => {
    setEditId(a.id);
    setForm({
      formateur_id: String(a.formateur_id),
      date_debut:   a.date_debut,
      date_fin:     a.date_fin,
      cause:        a.cause ?? "",
      nb_heures:    "",
    });
    setModal(true);
  };

  const handleSubmit = async () => {
    if (!form.formateur_id || !form.date_debut || !form.date_fin) {
      flash("Formateur, date début et date fin sont requis.", "err"); return;
    }
    setSaving(true);
    const payload = {
      formateur_id: parseInt(form.formateur_id),
      date_debut:   form.date_debut,
      date_fin:     form.date_fin,
      cause:        form.cause || null,
      nb_heures:    form.nb_heures !== "" ? parseFloat(form.nb_heures) : null,
    };
    try {
      if (editId) {
        await axios.put(`/absences/${editId}`, payload);
        flash("Absence modifiée.");
      } else {
        await axios.post("/absences", payload);
        flash("Absence enregistrée.");
      }
      setModal(false);
      fetchAbsences();
    } catch (e) {
      flash(e?.response?.data?.message ?? "Erreur.", "err");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/absences/${id}`);
      flash("Absence supprimée.");
      setConfirmDel(null);
      fetchAbsences();
    } catch {
      flash("Erreur lors de la suppression.", "err");
    }
  };

  const handlePrint = () => {
    openPrintWindow("absences-print-doc", "Absences des Formateurs");
  };

  const inp = {
    width: "100%", height: 36, padding: "0 10px",
    border: "1.5px solid var(--border)", borderRadius: 7,
    fontSize: 13, background: "#f8fafc", color: "var(--sl9)",
    outline: "none", fontFamily: "var(--font)",
    boxSizing: "border-box",
  };
  const sel = {
    ...inp, appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28,
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Alert */}
      {alert && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          background: alert.type === "err" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${alert.type === "err" ? "#fecaca" : "#bbf7d0"}`,
          color: alert.type === "err" ? "#dc2626" : "#15803d",
          borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,.1)",
        }}>
          {alert.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--sl9)" }}>Absences des Formateurs</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--sl5)" }}>
            Enregistrez et suivez les absences — le planning est mis à jour automatiquement.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 14px", borderRadius: 7, border: "1.5px solid var(--border)",
              background: "white", color: "var(--sl7)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {Ico.print} Imprimer
          </button>
          <button
            onClick={openAdd}
            className="btn-primary"
            style={{ height: 36, padding: "0 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          >
            {Ico.plus} Enregistrer une absence
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
        <div style={{ position: "relative", minWidth: 220 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sl4)", pointerEvents: "none" }}>
            {Ico.user}
          </span>
          <select
            style={{ ...sel, paddingLeft: 30 }}
            value={filterFid}
            onChange={e => setFilterFid(e.target.value)}
          >
            <option value="">Tous les formateurs</option>
            {formateurs.map(f => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: 12, color: "var(--sl4)" }}>
          {loading ? "Chargement…" : `${absences.length} absence${absences.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border)", background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--sl1)" }}>
              {["Formateur", "Date Début", "Date Fin", "Cause", "Heures", "Semaines", "Actions"].map(h => (
                <th key={h} style={{
                  padding: "10px 14px", textAlign: h === "Actions" ? "center" : "left",
                  fontSize: 11, fontWeight: 700, color: "var(--sl6)",
                  letterSpacing: 0.5, textTransform: "uppercase",
                  borderBottom: "1px solid var(--border)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--sl4)", fontSize: 13 }}>
                  Chargement…
                </td>
              </tr>
            ) : absences.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--sl4)", fontSize: 13 }}>
                  Aucune absence enregistrée.
                </td>
              </tr>
            ) : absences.map((a, i) => (
              <tr key={a.id} style={{
                borderBottom: "1px solid var(--sl1)",
                background: i % 2 === 0 ? "white" : "var(--sl0)",
              }}>
                <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, color: "var(--sl8)" }}>
                  {a.formateur}
                </td>
                <td style={{ padding: "9px 14px", fontSize: 13, color: "var(--sl7)" }}>
                  {fmt(a.date_debut)}
                </td>
                <td style={{ padding: "9px 14px", fontSize: 13, color: "var(--sl7)" }}>
                  {fmt(a.date_fin)}
                </td>
                <td style={{ padding: "9px 14px", fontSize: 12, color: "var(--sl6)", maxWidth: 200 }}>
                  {a.cause || <span style={{ color: "var(--sl3)" }}>—</span>}
                </td>
                <td style={{ padding: "9px 14px", fontSize: 13, textAlign: "center" }}>
                  {a.nb_heures
                    ? <span style={{ fontWeight: 700, color: "#b45309" }}>{a.nb_heures}h</span>
                    : <span style={{ color: "var(--sl3)" }}>—</span>}
                </td>
                <td style={{ padding: "9px 14px", fontSize: 13, textAlign: "center" }}>
                  <span style={{
                    display: "inline-block", padding: "2px 10px", borderRadius: 20,
                    background: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 12,
                    border: "1px solid #fde68a",
                  }}>
                    {a.nb_semaines} sem.
                  </span>
                </td>
                <td style={{ padding: "9px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                  <button
                    className="btn-icon btn-icon-edit"
                    title="Modifier"
                    onClick={() => openEdit(a)}
                    style={{ marginRight: 4 }}
                  >
                    {Ico.edit}
                  </button>
                  <button
                    className="btn-icon btn-icon-del"
                    title="Supprimer"
                    onClick={() => setConfirmDel(a.id)}
                  >
                    {Ico.trash}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats bar */}
      {absences.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
          <div style={{ padding: "7px 14px", borderRadius: 7, background: "#fef3c7", border: "1px solid #fde68a", fontSize: 12 }}>
            <span style={{ color: "#92400e" }}>Total absences : </span>
            <strong style={{ color: "#78350f" }}>{absences.length}</strong>
          </div>
          <div style={{ padding: "7px 14px", borderRadius: 7, background: "#fee2e2", border: "1px solid #fecaca", fontSize: 12 }}>
            <span style={{ color: "#b91c1c" }}>Total heures : </span>
            <strong style={{ color: "#7f1d1d" }}>{absences.reduce((s, a) => s + (parseFloat(a.nb_heures) || 0), 0)}h</strong>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "white", borderRadius: 12, width: 460, padding: "28px 28px 24px",
            boxShadow: "0 20px 60px rgba(0,0,0,.18)", maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--sl9)" }}>
                {editId ? "Modifier l'absence" : "Enregistrer une absence"}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sl5)" }}>
                {Ico.close}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Formateur */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--sl7)", display: "block", marginBottom: 5 }}>
                  Formateur *
                </label>
                <select style={sel} value={form.formateur_id}
                  onChange={e => setForm(p => ({ ...p, formateur_id: e.target.value }))}>
                  <option value="">— Choisir un formateur —</option>
                  {formateurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--sl7)", display: "block", marginBottom: 5 }}>
                    Date début *
                  </label>
                  <input type="date" style={inp} value={form.date_debut}
                    onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--sl7)", display: "block", marginBottom: 5 }}>
                    Date fin *
                  </label>
                  <input type="date" style={inp} value={form.date_fin}
                    onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))} />
                </div>
              </div>

              {/* Cause */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--sl7)", display: "block", marginBottom: 5 }}>
                  Cause
                </label>
                <input type="text" style={inp} placeholder="Maladie, formation, congé…"
                  value={form.cause}
                  onChange={e => setForm(p => ({ ...p, cause: e.target.value }))} />
              </div>

              {/* Nb heures */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--sl7)", display: "block", marginBottom: 5 }}>
                  Heures d'absence <span style={{ fontWeight: 400, color: "var(--sl4)" }}>(optionnel)</span>
                </label>
                <input type="number" min="0" step="0.5" style={inp} placeholder="Auto"
                  value={form.nb_heures}
                  onChange={e => setForm(p => ({ ...p, nb_heures: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(false)}
                style={{ height: 36, padding: "0 16px", borderRadius: 7, border: "1.5px solid var(--border)", background: "white", color: "var(--sl7)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary"
                style={{ height: 36, padding: "0 20px", fontSize: 13 }}>
                {saving ? "Enregistrement…" : editId ? "Modifier" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "white", borderRadius: 12, width: 360, padding: "24px 24px 20px",
            boxShadow: "0 20px 60px rgba(0,0,0,.18)",
          }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#dc2626" }}>
              Supprimer l'absence ?
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--sl6)" }}>
              Cette action va aussi restaurer les semaines du planning du formateur.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmDel(null)}
                style={{ height: 34, padding: "0 14px", borderRadius: 7, border: "1.5px solid var(--border)", background: "white", color: "var(--sl7)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={() => handleDelete(confirmDel)}
                style={{ height: 34, padding: "0 14px", borderRadius: 7, border: "none", background: "#dc2626", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print doc */}
      <AbsencesPrintDoc absences={absences} formateurs={formateurs} filterFormateurId={filterFid} />
    </div>
  );
}
