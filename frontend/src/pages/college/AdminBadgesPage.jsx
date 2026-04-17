import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";

const initialForm = { volunteer: "", level: "bronze", name: "", description: "", hours_required: 20 };
const levels = ["bronze", "silver", "gold", "platinum"];

export function AdminBadgesPage({ onLogout }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [msg, setMsg] = useState("");

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
      if ([401, 403].includes(err?.response?.status)) return clearSession();
      setMsg("Failed to load badges");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createBadge = async (e) => {
    e.preventDefault();
    try {
      await adminApi.post("/admin/badges/", { ...form, hours_required: Number(form.hours_required) });
      setMsg("Badge created");
      load();
    } catch {
      setMsg("Could not create badge");
    }
  };

  const removeBadge = async (id) => {
    if (!window.confirm("Delete this badge?")) return;
    await adminApi.delete(`/admin/badges/${id}/`);
    setMsg("Badge deleted");
    load();
  };

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">Badges</h1>
        <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{msg}</p>}

      <form onSubmit={createBadge} className="grid md:grid-cols-3 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.volunteer} onChange={(e) => setForm({ ...form, volunteer: e.target.value })} required>
          <option value="">Volunteer</option>
          {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>{levels.map((l) => <option key={l} value={l}>{l}</option>)}</select>
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Badge Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <textarea className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="number" step="0.5" min="0" className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Hours Required" value={form.hours_required} onChange={(e) => setForm({ ...form, hours_required: e.target.value })} required />
        <button className="md:col-span-3 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider">Award Badge</button>
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
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{r.volunteer_name}</td>
                <td className="px-4 py-3 uppercase font-semibold">{r.level}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.hours_required}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => removeBadge(r.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

