import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const initialForm = { volunteer: "", level: "bronze", name: "", description: "", hours_required: 20 };
const levels = ["bronze", "silver", "gold", "platinum"];

export function AdminBadgesPage({ onLogout }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState(null);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const load = async () => {
    try {
      const [b, v] = await Promise.all([
        adminApi.get("/admin/badges/"),
        adminApi.get("/admin/volunteers/"),
      ]);
      setRows(b.data || []);
      setVolunteers(v.data || []);
      if (!form.volunteer && v.data?.length) {
        setForm((prev) => ({ ...prev, volunteer: v.data[0].id }));
      }
    } catch (err) {
      if (err?.response?.status === 401) return clearSession();
      toast.error(err?.response?.data?.detail || "Failed to load badges");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createBadge = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await adminApi.post("/admin/badges/", { ...form, hours_required: Number(form.hours_required) });
      toast.success("Badge awarded successfully");
      setForm((prev) => ({ ...initialForm, volunteer: prev.volunteer }));
      load();
    } catch {
      toast.error("Could not create badge");
    } finally {
      setSubmitLoading(false);
    }
  };

  const triggerDelete = (r) => {
    setBadgeToDelete(r);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!badgeToDelete) return;
    setDeleteLoading(true);
    try {
      await adminApi.delete(`/admin/badges/${badgeToDelete.id}/`);
      toast.success("Badge deleted");
      load();
    } catch {
      toast.error("Failed to delete badge");
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setBadgeToDelete(null);
    }
  };

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">Badges</h1>
        <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>



      <form onSubmit={createBadge} className="grid md:grid-cols-3 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.volunteer} onChange={(e) => setForm({ ...form, volunteer: e.target.value })} disabled={submitLoading} required>
          <option value="">Volunteer</option>
          {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} disabled={submitLoading}>{levels.map((l) => <option key={l} value={l}>{l}</option>)}</select>
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Badge Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={submitLoading} required />
        <textarea className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={submitLoading} />
        <input type="number" step="0.5" min="0" className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Hours Required" value={form.hours_required} onChange={(e) => setForm({ ...form, hours_required: e.target.value })} disabled={submitLoading} required />
        <button disabled={submitLoading} className="md:col-span-3 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
          {submitLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            "Award Badge"
          )}
        </button>
      </form>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Volunteer</th>
              <th className="text-left px-4 py-3">Level</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Hours</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{r.volunteer_name}</td>
                  <td className="px-4 py-3 uppercase font-semibold">{r.level}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.hours_required}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => triggerDelete(r)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-400 italic">
                  No badges awarded yet.
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
        title="Delete Badge?"
        message={`This will permanently revoke the ${badgeToDelete?.level || ''} badge awarded to ${badgeToDelete?.volunteer_name || 'this volunteer'}.`}
        loading={deleteLoading}
      />
    </main>
  );
}

