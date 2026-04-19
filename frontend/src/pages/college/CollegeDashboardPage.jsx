import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLogOut, FiArrowRight, FiCalendar, FiUsers, FiAward, FiLayers, FiUserPlus, FiFileText, FiClock, FiBarChart2, FiUser } from "react-icons/fi";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function CollegeDashboardPage({ adminUser, onLogout }) {
  const navigate = useNavigate();
  const [adminContext, setAdminContext] = useState(null);
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
      <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
        Loading College Dashboard...
      </div>
    );
  }

  const role = adminContext?.role || adminUser?.admin_role;
  if (role === "platform_admin") {
    return <Navigate to="/admin/panel" replace />;
  }

  const modules = [
    { title: "Events", path: "/college/events", count: "EVT", icon: <FiCalendar />, color: "text-blue-700", bg: "bg-blue-50" },
    { title: "Volunteers", path: "/college/volunteers", count: "VOL", icon: <FiUsers />, color: "text-emerald-700", bg: "bg-emerald-50" },
    { title: "Certificates", path: "/college/certificates", count: "CRT", icon: <FiAward />, color: "text-amber-700", bg: "bg-amber-50" },
    { title: "NSS Units", path: "/college/nss-units", count: "UNT", icon: <FiLayers />, color: "text-teal-700", bg: "bg-teal-50" },
    { title: "Program Officers", path: "/college/program-officers", count: "PO", icon: <FiUserPlus />, color: "text-indigo-700", bg: "bg-indigo-50" },
    { title: "Activity Proposals", path: "/college/activity-proposals", count: "PLN", icon: <FiFileText />, color: "text-orange-700", bg: "bg-orange-50" },
    { title: "Volunteer Hours", path: "/college/volunteer-hours", count: "HRS", icon: <FiClock />, color: "text-slate-700", bg: "bg-slate-100" },
    { title: "Badges", path: "/college/badges", count: "BDG", icon: <FiAward />, color: "text-rose-700", bg: "bg-rose-50" },
    { title: "Coordinator Dashboard", path: "/college/coordinator-dashboard", count: "CO", icon: <FiUsers />, color: "text-cyan-700", bg: "bg-cyan-50" },
    { title: "Impact Analytics", path: "/college/impact-analytics", count: "DATA", icon: <FiBarChart2 />, color: "text-lime-700", bg: "bg-lime-50" },
    { title: "Reports", path: "/college/reports", count: "REP", icon: <FiFileText />, color: "text-fuchsia-700", bg: "bg-fuchsia-50" },
  ];

  return (
    <main className="min-h-screen pb-24 bg-white">
      <div className="relative bg-slate-900 pb-48 pt-20 overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-[-5%] w-[30%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8">
            College Management{adminContext?.college_name ? ` - ${adminContext.college_name}` : ""}
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            College <span className="text-slate-500 font-black">Dashboard.</span>
          </h1>

          <div className="mt-10 flex justify-center">
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/college/profile" className="px-8 py-3 bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
                <FiUser /> Profile
              </Link>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/college/profile" className="px-8 py-3 bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
                  <FiUser /> Profile
                </Link>
                <button onClick={clearSession} className="px-8 py-3 bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2">
                  <FiLogOut /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
        {message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center">
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <motion.div
              key={module.path}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-500 group"
            >
              <Link to={module.path} className="flex flex-col items-center text-center space-y-4">
                <div className={`w-14 h-14 ${module.bg} ${module.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                  {module.icon}
                </div>
                <div>
                  <h2 className="text-4xl font-display font-bold text-slate-900 leading-none">{module.count}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">{module.title}</p>
                </div>
                <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                  Open <FiArrowRight />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
