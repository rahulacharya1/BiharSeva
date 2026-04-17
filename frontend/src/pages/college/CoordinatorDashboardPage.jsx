import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi } from "../../api";

const palette = ["#0f766e", "#0369a1", "#b45309", "#7c3aed", "#15803d", "#be185d"];

export function CoordinatorDashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [payload, setPayload] = useState(null);
  const [msg, setMsg] = useState("");

  const proposalStatusData = useMemo(() => {
    if (!payload?.stats?.proposal_status) return [];
    return Object.entries(payload.stats.proposal_status).map(([name, value]) => ({ name, value }));
  }, [payload]);

  const topMemberHoursData = useMemo(() => {
    return (payload?.top_members || []).map((m) => ({ name: m.name, hours: Number(m.total_hours || 0) }));
  }, [payload]);

  const recentEventRegistrationData = useMemo(() => {
    return (payload?.recent_events || []).map((e) => ({
      name: e.title.length > 16 ? `${e.title.slice(0, 16)}...` : e.title,
      registrations: Number(e.registrations || 0),
    }));
  }, [payload]);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const loadOfficers = async () => {
    try {
      const res = await adminApi.get("/admin/program-officers/");
      setOfficers(res.data || []);
      if (res.data?.length) setSelectedOfficer(String(res.data[0].id));
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) return clearSession();
      setMsg("Failed to load officers");
    }
  };

  const loadDashboard = async (officerId) => {
    if (!officerId) return;
    try {
      const res = await adminApi.get(`/admin/coordinator-dashboard/?officer_id=${officerId}`);
      setPayload(res.data);
    } catch {
      setMsg("Could not load coordinator dashboard");
    }
  };

  useEffect(() => {
    loadOfficers();
  }, []);

  useEffect(() => {
    if (selectedOfficer) loadDashboard(selectedOfficer);
  }, [selectedOfficer]);

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">Coordinator Dashboard</h1>
        <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{msg}</p>}

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <label className="block text-xs text-slate-500 uppercase font-black mb-2">Program Officer</label>
        <select className="w-full md:w-[420px] px-3 py-2 rounded-xl border border-slate-200" value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)}>
          {officers.map((o) => (
            <option key={o.id} value={o.id}>{o.name} - {o.unit_info?.college} / Unit {o.unit_info?.unit_number}</option>
          ))}
        </select>
      </div>

      {payload && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4"><p className="text-xs text-slate-500 font-black uppercase">Members</p><p className="text-2xl font-bold">{payload.stats.total_members}</p></div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4"><p className="text-xs text-slate-500 font-black uppercase">Events</p><p className="text-2xl font-bold">{payload.stats.total_events}</p></div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4"><p className="text-xs text-slate-500 font-black uppercase">Service Hours</p><p className="text-2xl font-bold">{payload.stats.total_service_hours}</p></div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4"><p className="text-xs text-slate-500 font-black uppercase">Badges</p><p className="text-2xl font-bold">{payload.stats.badges_awarded}</p></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <h3 className="font-bold text-slate-900 mb-3">Top Members</h3>
              <ul className="space-y-2 text-sm">
                {payload.top_members.map((m) => (
                  <li key={m.id} className="flex justify-between border-b border-slate-100 pb-2">
                    <span>{m.name}</span>
                    <span className="font-semibold">{m.total_hours}h</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <h3 className="font-bold text-slate-900 mb-3">Recent Events</h3>
              <ul className="space-y-2 text-sm">
                {payload.recent_events.map((e) => (
                  <li key={e.id} className="flex justify-between border-b border-slate-100 pb-2">
                    <span>{e.title}</span>
                    <span className="text-slate-500">{e.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 h-[320px]">
              <h3 className="font-bold text-slate-900 mb-3">Top Members by Hours</h3>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={topMemberHoursData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={54} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 h-[320px]">
              <h3 className="font-bold text-slate-900 mb-3">Proposal Status Split</h3>
              <ResponsiveContainer width="100%" height="88%">
                <PieChart>
                  <Pie data={proposalStatusData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={45} label>
                    {proposalStatusData.map((entry, idx) => (
                      <Cell key={entry.name} fill={palette[idx % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-4 h-[320px]">
            <h3 className="font-bold text-slate-900 mb-3">Recent Event Registrations</h3>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={recentEventRegistrationData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="registrations" fill="#0369a1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </main>
  );
}

