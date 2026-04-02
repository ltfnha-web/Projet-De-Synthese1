import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { downloadTablePdf } from "../../utils/UsePdf";

export default function Formateurs() {
  const [data, setData]       = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [statut, setStatut]   = useState("");
  const [page, setPage]       = useState(1);
  const [alert, setAlert]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ nom: "", mle: "", statut: "actif" });
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  const flash = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500); };

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/formateurs", { params: { search, statut, page } })
      .then(r => { setData(r.data.data || []); setMeta({ last_page: r.data.last_page, total: r.data.total });
    console.log(r);
     })
      .catch(() => flash("Erreur de chargement.", "err"))
      .finally(() => setLoading(false));
  }, [search, statut, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (f) => { setEditing(f); setForm({ nom: f.nom, mle: f.mle, statut: f.statut }); setErrors({}); setModal(true); };
  const openAdd  = ()  => { setEditing(null); setForm({ nom: "", mle: "", statut: "actif" }); setErrors({}); setModal(true); };

  const submit = async () => {
    setSaving(true); setErrors({});
    try {
      if (editing) { await axios.put(`/formateurs/${editing.id}`, form); flash("Formateur modifié avec succès."); }
      else         { await axios.post("/formateurs", form); flash("Formateur créé avec succès."); }
      setModal(false); fetchData();
    } catch (e) {
      if (e.response?.status === 422) setErrors(e.response.data.errors || {});
      else flash("Une erreur est survenue.", "err");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer ce formateur ?")) return;
    try { await axios.delete(`/formateurs/${id}`); flash("Formateur supprimé."); fetchData(); }
    catch { flash("Erreur lors de la suppression.", "err"); }
  };

  const F = (f) => ({ value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })), className: "form-input" });

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Formateurs</div>
          <div className="pg-subtitle">{meta?.total ?? "—"} formateur(s) enregistré(s) — importés depuis le fichier Excel</div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={() => downloadTablePdf("table-formateurs", "Formateurs — ISTA Hay Salam")}>
            {Icons.download} Exporter PDF
          </button>
          <button className="btn-primary" onClick={openAdd}>
            {Icons.plus} Ajouter
          </button>
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
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)", display: "flex", pointerEvents: "none" }}>
                {Icons.search}
              </span>
              <input
                className="search-input"
                style={{ paddingLeft: 32 }}
                placeholder="Rechercher par nom ou matricule..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="form-select" style={{ width: 150, height: 36 }} value={statut}
              onChange={e => { setStatut(e.target.value); setPage(1); }}>
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <span className="results-count">{meta?.total ?? 0} résultat(s)</span>
        </div>

        {loading ? (
          <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>
        ) : data.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{Icons.users}</div>
            <div className="empty-title">Aucun formateur trouvé</div>
            <div className="empty-desc">Importez le fichier Excel BASE PLATE ou ajoutez manuellement</div>
          </div>
        ) : (
          <table id="table-formateurs">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Matricule</th>
                <th>Nom complet</th>
                <th>Statut</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((f, i) => (
                <tr key={f.id}>
                  <td style={{ color: "var(--text-light)", fontVariantNumeric: "tabular-nums" }}>{(page - 1) * 15 + i + 1}</td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontFamily: "var(--font-mono)", letterSpacing: ".5px" }}>{f.mle}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--indigo-50)", border: "1px solid var(--indigo-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--indigo-600)", flexShrink: 0 }}>
                        {f.nom.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <strong style={{ color: "var(--slate-800)", fontSize: 13.5 }}>{f.nom}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${f.statut === "actif" ? "badge-ok" : "badge-off"}`}>
                      {f.statut === "actif" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon btn-icon-edit" onClick={() => openEdit(f)} title="Modifier">{Icons.edit}</button>
                    <button className="btn-icon btn-icon-del"  onClick={() => remove(f.id)} title="Supprimer">{Icons.trash}</button>
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
                <>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "0 4px", color: "var(--text-light)" }}>…</span>}
                  <button key={p} className={`pg-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                </>
              ))
            }
            <button className="pg-btn" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>›</button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? "Modifier le formateur" : "Nouveau formateur"}</div>
              <button className="modal-close" onClick={() => setModal(false)}>{Icons.close}</button>
            </div>

            <div className="form-group">
              <label className="form-label">Nom complet *</label>
              <input {...F("nom")} placeholder="Ex: AMINE MAJID" />
              {errors.nom && <div className="field-err">{errors.nom[0]}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Matricule *</label>
              <input {...F("mle")} placeholder="Ex: 13329" style={{ fontFamily: "var(--font-mono)" }} />
              {errors.mle && <div className="field-err">{errors.mle[0]}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))} className="form-select">
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le formateur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}