import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";

const initialForm = {
  nss_unit: "",
  title: "",
  description: "",
  activity_type: "other",
  proposed_date: new Date().toISOString().split("T")[0],
  proposed_location: "",
  status: "draft",
  estimated_volunteers: 10,
  estimated_hours: 2,
  estimated_budget: 0,
};

const activityTypes = ["cleanliness", "awareness", "health", "education", "traffic", "environment", "disaster", "other"];
const statuses = ["draft", "submitted", "approved", "rejected", "in_progress", "completed"];

export function AdminActivityProposalsPage({ onLogout }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [adminRole, setAdminRole] = useState("platform_admin");
  const [msg, setMsg] = useState("");
  const isPlatform = adminRole === "platform_admin";

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesText =
        !q ||
        [r.title, r.description, r.activity_type, r.nss_unit_info?.college]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesActivity = activityFilter === "all" || r.activity_type === activityFilter;
      return matchesText && matchesStatus && matchesActivity;
    });
  }, [rows, query, statusFilter, activityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, activityFilter]);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const load = async () => {
    try {
      const [p, u] = await Promise.all([
        adminApi.get("/admin/activity-proposals/"),
        adminApi.get("/admin/nss-units/"),
      ]);
      setRows(p.data || []);
      setUnits(u.data || []);
      try {
        const me = await adminApi.get("/admin/auth/me/");
        setAdminRole(me.data?.admin_role || "platform_admin");
      } catch {
        setAdminRole("platform_admin");
      }
      if (!form.nss_unit && u.data?.length) setForm((prev) => ({ ...prev, nss_unit: u.data[0].id }));
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) return clearSession();
      setMsg("Failed to load proposals");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createProposal = async (e) => {
    e.preventDefault();
    try {
      await adminApi.post("/admin/activity-proposals/", {
        ...form,
        estimated_volunteers: Number(form.estimated_volunteers),
        estimated_hours: Number(form.estimated_hours),
        estimated_budget: Number(form.estimated_budget),
      });
      setMsg("Proposal created");
      setForm((prev) => ({ ...initialForm, nss_unit: prev.nss_unit }));
      load();
    } catch {
      setMsg("Could not create proposal");
    }
  };

  const updateStatus = async (id, status) => {
    await adminApi.patch(`/admin/activity-proposals/${id}/`, { status });
    setMsg("Proposal status updated");
    load();
  };

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">Activity Proposals</h1>
        <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{msg}</p>}

      {isPlatform ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-600">
          Platform Admin view: Proposal creation and status actions are handled by each College Admin.
        </div>
      ) : (
        <form onSubmit={createProposal} className="grid md:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.nss_unit} onChange={(e) => setForm({ ...form, nss_unit: e.target.value })} required>
            <option value="">Select Unit</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.college_name} / Unit {u.unit_number}</option>)}
          </select>
          <input className="md:col-span-3 px-3 py-2 rounded-xl border border-slate-200" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="md:col-span-4 px-3 py-2 rounded-xl border border-slate-200" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })}>{activityTypes.map((a) => <option key={a} value={a}>{a}</option>)}</select>
          <input type="date" className="px-3 py-2 rounded-xl border border-slate-200" value={form.proposed_date} onChange={(e) => setForm({ ...form, proposed_date: e.target.value })} required />
          <input className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Location" value={form.proposed_location} onChange={(e) => setForm({ ...form, proposed_location: e.target.value })} required />
          <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <input type="number" min="1" className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Volunteers" value={form.estimated_volunteers} onChange={(e) => setForm({ ...form, estimated_volunteers: e.target.value })} />
          <input type="number" step="0.5" min="0" className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Hours" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} />
          <input type="number" step="0.01" min="0" className="px-3 py-2 rounded-xl border border-slate-200" placeholder="Budget" value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })} />
          <button className="md:col-span-4 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider">Create Proposal</button>
        </form>
      )}

      <div className="grid md:grid-cols-4 gap-3 bg-white border border-slate-100 rounded-2xl p-4">
        <input
          className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200"
          placeholder="Search title, description, college"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
          <option value="all">All Activity Types</option>
          {activityTypes.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Unit</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{r.title}</td>
                <td className="px-4 py-3">{r.nss_unit_info?.college} / Unit {r.nss_unit_info?.unit_number}</td>
                <td className="px-4 py-3">{r.activity_type}</td>
                <td className="px-4 py-3">{r.proposed_date}</td>
                <td className="px-4 py-3">
                  {isPlatform ? (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">{r.status}</span>
                  ) : (
                    <select className="px-2 py-1 rounded-lg border border-slate-200" value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)}>
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-500">Showing {paginatedRows.length} of {filteredRows.length} proposals</p>
        <div className="inline-flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold disabled:opacity-40">Prev</button>
          <span className="text-xs font-black text-slate-600">Page {page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold disabled:opacity-40">Next</button>
        </div>
      </div>
    </main>
  );
}

