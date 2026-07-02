import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FiPlusCircle, FiLayers, FiAlertCircle, FiClock, FiCheckCircle, 
  FiActivity, FiTrendingUp, FiInfo
} from "react-icons/fi";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { useSEO } from "../../hooks/useSEO";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";

export function AdminPanelPage() {
  useSEO({ 
    title: "Platform Supervisor Control Desk", 
    description: "BiharSeva Platform Admin Command Center. Monitor district analytics, SLA deadlines, college performance, and manage report overrides.", 
    noIndex: true 
  });

  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Fetch Dashboard Stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/admin/platform-dashboard/");
      setStats(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard stats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kpis = stats?.kpis || {};
  const metrics = stats?.assignment_metrics || {};

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/60 pb-8">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <FiActivity className="text-emerald-500 text-3xl" /> Platform Supervisor Command Center
            </h1>
            <p className="mt-2 text-slate-500 font-medium text-sm">
              Real-time SaaS operational summaries, SLA deadlines, and regional resolution rates.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : "Refresh Stats"}
            </button>
          </div>
        </div>

        {loading && !stats ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading supervisor statistics...</p>
          </div>
        ) : (
          <>
            {/* Live KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FiAlertCircle /> Pending Queue
                </span>
                <span className="text-3xl font-black text-slate-900">{kpis.pending_reports || 0}</span>
                <span className="text-[10px] text-slate-500 font-semibold">Unclaimed citizen reports</span>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FiClock /> Active Claims
                </span>
                <span className="text-3xl font-black text-slate-900">{kpis.claim_queue_reports || 0}</span>
                <span className="text-[10px] text-slate-500 font-semibold">Under 24h college claim window</span>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FiLayers /> Assigned & Cleaning
                </span>
                <span className="text-3xl font-black text-slate-900">
                  {(kpis.assigned_reports || 0) + (kpis.in_progress_reports || 0)}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Colleges actively engaged</span>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FiCheckCircle className="text-emerald-500" /> Resolved Cleanups
                </span>
                <span className="text-3xl font-black text-emerald-600">{kpis.completed_reports || 0}</span>
                <span className="text-[10px] text-slate-500 font-semibold">Total verified successes</span>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px] bg-red-50/10 col-span-2 lg:col-span-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5 animate-pulse">
                  SLA Overdue
                </span>
                <span className="text-3xl font-black text-red-600">{kpis.overdue_reports || 0}</span>
                <span className="text-[10px] text-red-800/80 font-bold">Needs Supervisor override</span>
              </div>
            </div>

            {/* QUICK DESK ACCESS CARDS */}
            <div className="grid md:grid-cols-3 gap-8 mt-12 mb-12">
              {/* Card 1: Add College */}
              <Link 
                to="/admin/colleges/add"
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:border-emerald-500/35 hover:shadow-md transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    <FiPlusCircle />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-650 transition-colors">Add College Unit</h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
                      Register new collegiate institutions, assign local admins, and configure district scopes.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                  Configure Institution &rarr;
                </div>
              </Link>

              {/* Card 2: View Colleges */}
              <Link 
                to="/admin/colleges"
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:border-indigo-500/35 hover:shadow-md transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    <FiLayers />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-650 transition-colors">Monitor Colleges</h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
                      Audit active NSS units, verify volunteer counts, track events completed, and evaluate workloads.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  View Performance &rarr;
                </div>
              </Link>

              {/* Card 3: Manage Reports */}
              <Link 
                to="/admin/reports"
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:border-amber-500/35 hover:shadow-md transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    <FiAlertCircle />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-amber-650 transition-colors">Supervisor Reports Desk</h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
                      Inspect civic complaints, override claim windows, upgrade priorities, or force auto-assigns.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1">
                  Manage Reports &rarr;
                </div>
              </Link>
            </div>

            {/* CHARTS & STATS SECTION */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Recharts Chart */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                    <FiTrendingUp className="text-emerald-500" /> Submission Trends (Last 30 Days)
                  </h3>
                </div>
                <div className="h-72 w-full">
                  {stats?.trends && stats.trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderRadius: "1rem", color: "#fff", border: "none" }}
                          labelStyle={{ fontWeight: "bold" }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-semibold">
                      No submissions trends data available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Automation & Escalation System Health */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                    <FiActivity className="text-emerald-500" /> Platform Workload Allocations
                  </h3>
                  <div className="divide-y divide-slate-100">
                    <div className="py-3 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Auto-Assignment Ratio</span>
                      <span className="font-black text-slate-950">{metrics.ratio_auto || 0}%</span>
                    </div>
                    <div className="py-3 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Claimed Queue Ratio</span>
                      <span className="font-black text-emerald-600">{metrics.ratio_claimed || 0}%</span>
                    </div>
                    <div className="py-3 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Avg. Supervisor Response</span>
                      <span className="font-black text-slate-950">{metrics.avg_response_time || 0} hrs</span>
                    </div>
                    <div className="py-3 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Avg. District Claim Speed</span>
                      <span className="font-black text-slate-950">{metrics.avg_claim_time || 0} hrs</span>
                    </div>
                    <div className="py-3 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Avg. Cleanup Duration</span>
                      <span className="font-black text-indigo-600">{metrics.avg_cleanup_time || 0} hrs</span>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-50 text-[10px] text-slate-400 font-semibold flex items-center gap-2">
                  <FiInfo /> Metrics recalibrate on every assignment change.
                </div>
              </div>
            </div>

            {/* DISTRICT ANALYTICS TABLE */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h3 className="text-lg font-black text-slate-950">District Breakdown & Resolution Rates</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-8">District Name</th>
                      <th className="py-4 px-6 text-center">Total Reports</th>
                      <th className="py-4 px-6 text-center">Cleaned Reports</th>
                      <th className="py-4 px-6 text-center">Active Colleges</th>
                      <th className="py-4 px-6 text-center">Registered Volunteers</th>
                      <th className="py-4 px-8 text-right">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {stats?.districts_summary && stats.districts_summary.length > 0 ? (
                      stats.districts_summary.map((d) => (
                        <tr key={d.district} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-8 text-slate-900 font-black">{d.district}</td>
                          <td className="py-4 px-6 text-center font-bold">{d.total_reports}</td>
                          <td className="py-4 px-6 text-center font-bold text-emerald-600">{d.cleaned_reports}</td>
                          <td className="py-4 px-6 text-center font-bold">{d.active_colleges}</td>
                          <td className="py-4 px-6 text-center font-bold text-indigo-600">{d.volunteer_count}</td>
                          <td className="py-4 px-8 text-right text-slate-900 font-black">
                            <span className={`inline-block px-2.5 py-1 rounded-lg ${
                              d.success_rate > 75 ? "bg-emerald-50 text-emerald-700" :
                              d.success_rate > 40 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                            }`}>
                              {d.success_rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                          No district data recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
