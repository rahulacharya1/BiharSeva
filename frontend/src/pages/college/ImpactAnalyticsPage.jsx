import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi } from "../../api";

const colors = ["#0f766e", "#0369a1", "#a16207", "#7c3aed", "#15803d", "#be185d", "#0891b2", "#2563eb"];

export function ImpactAnalyticsPage({ onLogout }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  const districtChartData = useMemo(() => {
    return (data?.district_breakdown || []).map((d) => ({
      name: d.volunteer__district,
      total_hours: Number(d.total_hours || 0),
    }));
  }, [data]);

  const activityChartData = useMemo(() => {
    return (data?.activity_breakdown || []).map((a) => ({
      name: a.event__activity_type,
      value: Number(a.total_hours || 0),
    }));
  }, [data]);

  const monthlyTrendData = useMemo(() => {
    return (data?.monthly_trend || []).map((m) => ({
      month: m.month ? new Date(m.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "N/A",
      total_hours: Number(m.total_hours || 0),
      events: Number(m.events || 0),
    }));
  }, [data]);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.get("/admin/impact-analytics/");
        setData(res.data);
      } catch (err) {
        if ([401, 403].includes(err?.response?.status)) return clearSession();
        setMsg("Failed to load impact analytics");
      }
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">Impact Analytics</h1>
        <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{msg}</p>}

      {data && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4"><p className="text-xs uppercase text-slate-500 font-black">Total Hours</p><p className="text-2xl font-bold">{data.summary.total_hours}</p></div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4"><p className="text-xs uppercase text-slate-500 font-black">Volunteers</p><p className="text-2xl font-bold">{data.summary.total_volunteers}</p></div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4"><p className="text-xs uppercase text-slate-500 font-black">Events</p><p className="text-2xl font-bold">{data.summary.total_events}</p></div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4"><p className="text-xs uppercase text-slate-500 font-black">Badges</p><p className="text-2xl font-bold">{data.summary.total_badges}</p></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <h3 className="font-bold mb-3">District Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total_hours" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <h3 className="font-bold mb-3">Activity Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activityChartData} dataKey="value" nameKey="name" outerRadius={98} innerRadius={44} label>
                      {activityChartData.map((item, idx) => (
                        <Cell key={item.name} fill={colors[idx % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <h3 className="font-bold mb-3">Monthly Service Trend</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total_hours" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="events" stroke="#0369a1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

