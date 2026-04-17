import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";

const initialForm = {
  name: "",
  city: "",
  district: "Purnea",
  code: "",
  email: "",
  phone: "",
  website: "",
  admin_username: "",
  admin_email: "",
};

const districts = ["Purnea", "Katihar", "Araria", "Kishanganj", "Madhepura", "Saharsa"];

export function AdminCollegesPage({ adminUser, onLogout }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [context, setContext] = useState(null);
  const [msg, setMsg] = useState("");
  const [inviteInfo, setInviteInfo] = useState(null);
  const isPlatform = (context?.admin_role || adminUser?.admin_role) === "platform_admin";

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const load = async () => {
    try {
      const [res, me] = await Promise.all([
        adminApi.get("/admin/colleges/"),
        adminApi.get("/admin/auth/me/"),
      ]);
      setRows(res.data || []);
      setContext(me.data || null);
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) return clearSession();
      setMsg("Failed to load colleges");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitCollege = async (e) => {
    e.preventDefault();
    try {
      setInviteInfo(null);
      const payload = {
        ...form,
        admin_username: form.admin_username.trim(),
        admin_email: form.admin_email.trim(),
      };
      const res = await adminApi.post("/admin/colleges/", payload);
      const collegeAdmin = res.data?.college_admin;
      setInviteInfo(collegeAdmin || null);
      setMsg(collegeAdmin?.temporary_password ? "College added. Invite password generated for the new college admin." : "College added successfully.");
      setForm(initialForm);
      load();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Could not add college");
    }
  };

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">Colleges</h1>
        <Link to="/admin/panel" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{msg}</p>}

      {inviteInfo?.temporary_password && (
        <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 text-sm text-cyan-900 space-y-2">
          <p className="font-bold">College admin account created</p>
          <p className="text-xs">Username: <span className="font-semibold">{inviteInfo.username}</span></p>
          <p className="text-xs">Temporary password: <span className="font-semibold">{inviteInfo.temporary_password}</span></p>
          <p className="text-xs">Share this once with the college admin. They can then sign in through the College tab and change it using OTP reset.</p>
        </div>
      )}

      {isPlatform ? (
      <form onSubmit={submitCollege} className="grid md:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="College Admin Username (optional)" value={form.admin_username} onChange={(e) => setForm({ ...form, admin_username: e.target.value })} />
        <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="College Admin Email (optional)" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} />
        <div className="md:col-span-2 flex items-center rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
          Temporary password will be generated automatically for the college admin.
        </div>
        <button className="md:col-span-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider">Create College</button>
      </form>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-600">
          You are assigned as College Admin. College creation and updates are restricted to Platform Admin.
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">District</th>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Units</th>
              <th className="text-right px-4 py-3">Access</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{r.name}</td>
                <td className="px-4 py-3">{r.district}</td>
                <td className="px-4 py-3">{r.code}</td>
                <td className="px-4 py-3">{r.nss_units_count}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-slate-400 font-semibold">View Only</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
