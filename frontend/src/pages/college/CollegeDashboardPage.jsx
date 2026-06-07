import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLogOut, FiArrowRight, FiCalendar, FiUsers, FiAward, FiUserPlus, FiFileText, FiClock, FiBarChart2, FiUser } from "react-icons/fi";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";
import { useSEO } from "../../hooks/useSEO";

export function CollegeDashboardPage({ adminUser, onLogout }) {
  useSEO({ title: "College Dashboard", description: "College administration dashboard — overview of volunteers, events, reports, and certificates.", keywords: "college dashboard, admin", noIndex: true });
  const navigate = useNavigate();
  const [adminContext, setAdminContext] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  useAutoDismissMessage(message, setMessage, 2500);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  useEffect(() => {
    const loadContext = async () => {
      try {
        const res = await adminApi.get("/admin/dashboard/");
        setAdminContext(res.data.admin_context || null);
        setStats(res.data.stats || null);
      } catch (err) {
        if ([401, 403].includes(err?.response?.status)) {
          clearSession();
          return;
        }
        setMessage("Failed to load college dashboard.");
      } finally {
        setLoading(false);
      }
    };
    loadContext();
  }, []);

  if (!adminUser && !localStorage.getItem("admin_token")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center max-w-sm">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Unauthorized</p>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-8">Admin Access Required.</h2>
          <Link to="/admin/login" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Login</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
        Loading College Dashboard...
      </div>
    );
  }

  const role = adminContext?.role || adminUser?.admin_role;
  const modules = [
    { title: "Events & Missions", path: "/college/events", count: stats ? stats.total_events : "0", icon: <FiCalendar />, color: "text-blue-700", bg: "bg-blue-50" },
    { title: "Volunteers Directory", path: "/college/volunteers", count: stats ? stats.total_volunteers : "0", icon: <FiUsers />, color: "text-emerald-700", bg: "bg-emerald-50" },
    { title: "Certificates Portal", path: "/college/certificates", count: stats ? stats.total_certificates : "0", icon: <FiAward />, color: "text-amber-700", bg: "bg-amber-50" },
    { title: "Program Officers", path: "/college/program-officers", count: "PO", icon: <FiUserPlus />, color: "text-indigo-700", bg: "bg-indigo-50" },
    { title: "Activity Proposals", path: "/college/activity-proposals", count: "PROP", icon: <FiFileText />, color: "text-orange-700", bg: "bg-orange-50" },
    { title: "Volunteer Hours", path: "/college/volunteer-hours", count: "LOG", icon: <FiClock />, color: "text-slate-700", bg: "bg-slate-100" },
    { title: "Merit Badges", path: "/college/badges", count: "BDG", icon: <FiAward />, color: "text-rose-700", bg: "bg-rose-50" },
    { title: "Coordinator Dashboard", path: "/college/coordinator-dashboard", count: "COORD", icon: <FiUsers />, color: "text-cyan-700", bg: "bg-cyan-50" },
    { title: "Impact Analytics", path: "/college/impact-analytics", count: "DATA", icon: <FiBarChart2 />, color: "text-lime-700", bg: "bg-lime-50" },
    { title: "Civic Reports", path: "/college/reports", count: stats ? stats.total_reports : "0", icon: <FiFileText />, color: "text-fuchsia-700", bg: "bg-fuchsia-50" },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-200/60 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wider text-emerald-700">
          NSS College Portal
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight leading-tight">
          Welcome back, {adminUser?.username}
        </h1>
        {adminContext?.college_name && (
          <p className="text-sm font-medium text-slate-500 mt-2">
            Managing NSS operations for <span className="font-bold text-slate-700">{adminContext.college_name}</span>
          </p>
        )}
      </motion.div>

      {/* Grid of modules */}
      <section className="space-y-6">
        {message && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-650 text-xs font-bold text-center">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={module.path}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
            >
              <div className="space-y-4">
                <div className={`w-14 h-14 ${module.bg} ${module.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                  {module.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold text-slate-900 leading-none">{module.count}</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1.5">{module.title}</p>
                </div>
              </div>
              <Link 
                to={module.path}
                className="pt-6 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors border-t border-slate-50 mt-4"
              >
                Manage <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
