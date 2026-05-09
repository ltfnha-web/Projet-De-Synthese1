import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { downloadTablePdf } from "../../utils/UsePdf";
import { useConfirm } from "../../hooks/useConfirm";

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

  const [confirm, ConfirmDialog] = useConfirm();
  const flash = (msg, type = "ok") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500); };

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/formateurs", { params: { search, statut, page } })
      .then(r => { setData(r.data.data || []); setMeta({ last_page: r.data.last_page, total: r.data.total }); })
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
      else flash("Impossible d'enregistrer le formateur. Vérifiez les informations saisies et réessayez.", "err");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    const ok = await confirm({
      title: "Supprimer ce formateur ?",
      message: "Le formateur sera définitivement supprimé. Cette action est irréversible.",
      confirmLabel: "Supprimer",
      variant: "danger",
    });
    if (!ok) return;
    try { await axios.delete(`/formateurs/${id}`); flash("Formateur supprimé avec succès."); fetchData(); }
    catch { flash("La suppression a échoué. Le formateur est peut-être lié à des données existantes.", "err"); }
  };

  const F = (f) => ({ value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })), className: "form-input" });

  const hasFilters = !!(search || statut);
  const activeCount = [search, statut].filter(Boolean).length;

  const resetFilters = () => { setSearch(""); setStatut(""); setPage(1); };

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
        {/* ── Filter panel ── */}
        <div className="filter-panel-inline">
          <div className="filter-panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--sl5)", display: "flex" }}>{Icons.search}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sl7)" }}>Recherche & Filtres</span>
              {activeCount > 0 && (
                <span style={{ background: "var(--g4)", color: "#111", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                  {activeCount}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {hasFilters && (
                <button className="btn-reset" onClick={resetFilters}>
                  {Icons.close} Réinitialiser
                </button>
              )}
              <span className="results-count">{meta?.total ?? 0} résultat(s)</span>
            </div>
          </div>

          <div className="filter-row">
            {/* Recherche */}
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
              <span className="search-icon">{Icons.search}</span>
              <input className="search-input filter-input" placeholder="Rechercher par nom ou matricule..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>

            {/* Statut */}
            <select className="form-select filter-select" style={{ height: 36, width: 160 }} value={statut}
              onChange={e => { setStatut(e.target.value); setPage(1); }}>
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
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
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "var(--g0)", border: "1px solid var(--g1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "var(--g6)", flexShrink: 0,
                      }}>
                        {f.nom.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <strong style={{ color: "var(--sl8)", fontSize: 13.5 }}>{f.nom}</strong>
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

      {ConfirmDialog}

      {/* ── Modal ── */}
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
