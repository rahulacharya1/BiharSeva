import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const initialForm = { nss_unit: "", name: "", email: "", phone: "", designation: "NSS Program Officer" };

export function AdminProgramOfficersPage({ onLogout }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [adminRole, setAdminRole] = useState("platform_admin");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const isPlatform = adminRole === "platform_admin";

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const load = async () => {
    try {
      const [officersRes, unitsRes] = await Promise.all([
        adminApi.get("/admin/program-officers/"),
        adminApi.get("/admin/nss-units/"),
      ]);
      setRows(officersRes.data || []);
      setUnits(unitsRes.data || []);
      try {
        const me = await adminApi.get("/admin/auth/me/");
        setAdminRole(me.data?.admin_role || "platform_admin");
      } catch {
        setAdminRole("platform_admin");
      }
      if (!form.nss_unit && unitsRes.data?.length) {
        setForm((prev) => ({ ...prev, nss_unit: unitsRes.data[0].id }));
      }
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) return clearSession();
      toast.error("Failed to load program officers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitOfficer = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editingId) {
        await adminApi.patch(`/admin/program-officers/${editingId}/`, form);
        toast.success("Program officer updated successfully");
      } else {
        await adminApi.post("/admin/program-officers/", form);
        toast.success("Program officer created successfully");
      }
      setEditingId(null);
      setForm((prev) => ({ ...initialForm, nss_unit: prev.nss_unit }));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save program officer");
    } finally {
      setSubmitLoading(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      nss_unit: row.nss_unit,
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      designation: row.designation || "NSS Program Officer",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm((prev) => ({ ...initialForm, nss_unit: prev.nss_unit }));
  };

  const triggerDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminApi.delete(`/admin/program-officers/${deleteId}/`);
      toast.success("Program officer deleted successfully");
      load();
    } catch (err) {
      toast.error("Failed to delete program officer");
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Loading Program Officers...</div>;

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">Program Officers</h1>
        <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>

      {isPlatform ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-600">
          Platform Admin view: Program Officer create/update/delete is handled by each College Admin.
        </div>
      ) : (
        <form onSubmit={submitOfficer} className="grid md:grid-cols-3 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <select 
            className="px-3 py-2 rounded-xl border border-slate-200" 
            value={form.nss_unit} 
            onChange={(e) => setForm({ ...form, nss_unit: e.target.value })} 
            disabled={submitLoading}
            required
          >
            <option value="">Select NSS Unit</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.college_name} - Unit {u.unit_number}</option>)}
          </select>
          <input 
            className="px-3 py-2 rounded-xl border border-slate-200" 
            placeholder="Name" 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            disabled={submitLoading}
            required 
          />
          <input 
            className="px-3 py-2 rounded-xl border border-slate-200" 
            placeholder="Designation" 
            value={form.designation} 
            onChange={(e) => setForm({ ...form, designation: e.target.value })} 
            disabled={submitLoading}
            required 
          />
          <input 
            type="email"
            className="px-3 py-2 rounded-xl border border-slate-200" 
            placeholder="Email" 
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
            disabled={submitLoading}
            required 
          />
          <input 
            type="tel"
            className="px-3 py-2 rounded-xl border border-slate-200" 
            placeholder="Phone" 
            value={form.phone} 
            onChange={(e) => setForm({ ...form, phone: e.target.value })} 
            disabled={submitLoading}
            required 
          />
          <button 
            disabled={submitLoading}
            className="px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50"
          >
            {submitLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              editingId ? "Update Officer" : "Create Officer"
            )}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={cancelEdit} 
              disabled={submitLoading}
              className="px-4 py-3 rounded-xl bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              Cancel Edit
            </button>
          )}
        </form>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Officer</th>
              <th className="text-left px-4 py-3">Unit</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold">{r.name}<div className="text-xs text-slate-500">{r.designation}</div></td>
                  <td className="px-4 py-3">{r.unit_info?.college} / Unit {r.unit_info?.unit_number}</td>
                  <td className="px-4 py-3">{r.email}<div className="text-xs text-slate-500">{r.phone}</div></td>
                  <td className="px-4 py-3 text-right">
                    {isPlatform ? (
                      <span className="text-xs text-slate-400 font-semibold">View Only</span>
                    ) : (
                      <div className="inline-flex gap-2">
                        <button onClick={() => startEdit(r)} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors">Edit</button>
                        <button onClick={() => triggerDelete(r.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-10 text-slate-400 italic">
                  No program officers registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog 
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Program Officer?"
        message="This will permanently delete this program officer and cannot be undone."
        loading={deleteLoading}
      />
    </main>
  );
}
