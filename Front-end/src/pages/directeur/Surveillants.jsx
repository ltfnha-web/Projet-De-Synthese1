import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { downloadTablePdf } from "../../utils/UsePdf";

const EMPTY = { name: "", email: "", password: "", telephone: "", statut: "actif" };

export default function Surveillants() {
  const [data, setData]       = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [statut, setStatut]   = useState("");
  const [page, setPage]       = useState(1);
  const [alert, setAlert]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  const flash = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500); };

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/users", { params: { role: "surveillant", search, statut, page } })
      .then(r => { setData(r.data.data || []); setMeta({ last_page: r.data.last_page, total: r.data.total }); })
      .catch(() => flash("Erreur de chargement.", "err"))
      .finally(() => setLoading(false));
  }, [search, statut, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = ()  => { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: "", telephone: u.telephone || "", statut: u.statut }); setErrors({}); setModal(true); };

  const submit = async () => {
    setSaving(true); setErrors({});
    try {
      if (editing) { await axios.put(`/users/${editing.id}`, { ...form, role: "surveillant" }); flash("Surveillant modifié."); }
      else         { await axios.post("/users", { ...form, role: "surveillant" }); flash("Surveillant créé."); }
      setModal(false); fetchData();
    } catch (e) {
      if (e.response?.status === 422) setErrors(e.response.data.errors || {});
      else flash("Erreur.", "err");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer ce surveillant ?")) return;
    try { await axios.delete(`/users/${id}`); flash("Supprimé."); fetchData(); }
    catch { flash("Erreur.", "err"); }
  };

  const F = (f) => ({ value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })), className: "form-input" });

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Surveillants</div>
          <div className="pg-subtitle">{meta?.total ?? "—"} surveillant(s) enregistré(s)</div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={() => downloadTablePdf("table-surveillants", "Surveillants — ISTA Hay Salam")}>
            {Icons.download} Exporter PDF
          </button>
          <button className="btn-primary" onClick={openAdd}>{Icons.plus} Ajouter</button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === "ok" ? Icons.check : Icons.alert}
          {alert.msg}
        </div>
      )}

      <div className="table-card">
        <div className="table-toolbar">
          <div className="toolbar-filters">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)", display: "flex", pointerEvents: "none" }}>{Icons.search}</span>
              <input className="search-input" style={{ paddingLeft: 32 }} placeholder="Rechercher par nom..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-select" style={{ width: 150, height: 36 }} value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }}>
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <span className="results-count">{meta?.total ?? 0} résultat(s)</span>
        </div>

        {loading ? <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
        : data.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{Icons.eye}</div>
            <div className="empty-title">Aucun surveillant trouvé</div>
            <div className="empty-desc">Ajoutez des surveillants manuellement</div>
          </div>
        ) : (
          <table id="table-surveillants">
            <thead>
              <tr><th>#</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Statut</th><th style={{ width: 100 }}>Actions</th></tr>
            </thead>
            <tbody>
              {data.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: "var(--text-light)" }}>{(page - 1) * 15 + i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--slate-100)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--slate-600)", flexShrink: 0 }}>
                        {u.name?.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <strong style={{ color: "var(--slate-800)", fontSize: 13.5 }}>{u.name}</strong>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--slate-600)" }}>{u.email}</td>
                  <td style={{ fontSize: 13 }}>{u.telephone || <span style={{ color: "var(--text-light)" }}>—</span>}</td>
                  <td><span className={`badge ${u.statut === "actif" ? "badge-ok" : "badge-off"}`}>{u.statut}</span></td>
                  <td>
                    <button className="btn-icon btn-icon-edit" onClick={() => openEdit(u)} title="Modifier">{Icons.edit}</button>
                    <button className="btn-icon btn-icon-del"  onClick={() => remove(u.id)} title="Supprimer">{Icons.trash}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {meta?.last_page > 1 && (
          <div className="pagination">
            <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "0 4px", color: "var(--text-light)" }}>…</span>}
                  <button className={`pg-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                </span>
              ))
            }
            <button className="pg-btn" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>›</button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? "Modifier le surveillant" : "Nouveau surveillant"}</div>
              <button className="modal-close" onClick={() => setModal(false)}>{Icons.close}</button>
            </div>
            <div className="form-group"><label className="form-label">Nom complet *</label><input {...F("name")} placeholder="Nom complet" />{errors.name && <div className="field-err">{errors.name[0]}</div>}</div>
            <div className="form-group"><label className="form-label">Email *</label><input {...F("email")} type="email" />{errors.email && <div className="field-err">{errors.email[0]}</div>}</div>
            <div className="form-group"><label className="form-label">{editing ? "Nouveau mot de passe (laisser vide)" : "Mot de passe *"}</label><input {...F("password")} type="password" placeholder="••••••••" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Téléphone</label><input {...F("telephone")} placeholder="06XXXXXXXX" /></div>
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))} className="form-select">
                  <option value="actif">Actif</option><option value="inactif">Inactif</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}