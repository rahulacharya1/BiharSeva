import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";

const initialForm = { college: "", unit_number: 1, name: "" };

export function AdminNssUnitsPage({ onLogout }) {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [adminRole, setAdminRole] = useState("platform_admin");
  const [msg, setMsg] = useState("");
  const isPlatform = adminRole === "platform_admin";

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const load = async () => {
    try {
      const [u, c] = await Promise.all([
        adminApi.get("/admin/nss-units/"),
        adminApi.get("/admin/colleges/"),
      ]);
      setUnits(u.data || []);
      setColleges(c.data || []);
      try {
        const me = await adminApi.get("/admin/auth/me/");
        setAdminRole(me.data?.admin_role || "platform_admin");
      } catch {
        setAdminRole("platform_admin");
      }
      if (!form.college && c.data?.length) setForm((prev) => ({ ...prev, college: c.data[0].id }));
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) return clearSession();
      setMsg("Failed to load NSS units");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitUnit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, unit_number: Number(form.unit_number) };
      if (editingId) {
        await adminApi.patch(`/admin/nss-units/${editingId}/`, payload);
        setMsg("NSS unit updated");
      } else {
        await adminApi.post("/admin/nss-units/", payload);
        setMsg("NSS unit created");
      }
      setEditingId(null);
      setForm((prev) => ({ ...initialForm, college: prev.college || "" }));
      load();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Could not create NSS unit");
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      college: row.college,
      unit_number: row.unit_number,
      name: row.name || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm((prev) => ({ ...initialForm, college: prev.college || "" }));
  };

  const removeUnit = async (id) => {
    if (!window.confirm("Delete this NSS unit?")) return;
    await adminApi.delete(`/admin/nss-units/${id}/`);
    setMsg("NSS unit deleted");
    load();
  };

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">NSS Units</h1>
        <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{msg}</p>}

      {isPlatform ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-600">
          Platform Admin view: NSS Unit create/update/delete is handled by each College Admin.
        </div>
      ) : (
        <form onSubmit={submitUnit} className="grid md:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} required>
            <option value="">Select College</option>
            {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" min="1" className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Unit Number" value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} required />
          <input className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200" placeholder="Unit Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <button className="md:col-span-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider">{editingId ? "Update Unit" : "Create Unit"}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="md:col-span-2 px-4 py-3 rounded-xl bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider">Cancel Edit</button>
          )}
        </form>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">College</th>
              <th className="text-left px-4 py-3">Unit</th>
              <th className="text-left px-4 py-3">Members</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{u.college_name}</td>
                <td className="px-4 py-3 font-semibold">#{u.unit_number} {u.name ? `- ${u.name}` : ""}</td>
                <td className="px-4 py-3">{u.members_count}</td>
                <td className="px-4 py-3 text-right">
                  {isPlatform ? (
                    <span className="text-xs text-slate-400 font-semibold">View Only</span>
                  ) : (
                    <div className="inline-flex gap-2">
                      <button onClick={() => startEdit(u)} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">Edit</button>
                      <button onClick={() => removeUnit(u.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

