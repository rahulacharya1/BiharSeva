import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLogOut, FiArrowRight, FiHome } from "react-icons/fi";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function AdminPanelPage({ adminUser, onLogout }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [adminContext, setAdminContext] = useState(null);
    const [collegesOverview, setCollegesOverview] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    useAutoDismissMessage(message, setMessage, 2500);

    const clearSession = () => {
        localStorage.removeItem("admin_token");
        onLogout?.();
        navigate("/admin/login");
    };

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await adminApi.get("/admin/dashboard/");
                setStats(res.data.stats);
                setAdminContext(res.data.admin_context || null);
                setCollegesOverview(res.data.colleges_overview || []);
            } catch (err) {
                if ([401, 403].includes(err?.response?.status)) {
                    clearSession();
                    return;
                }
                setMessage("Failed to load dashboard stats.");
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (!adminUser && !localStorage.getItem("admin_token")) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center max-w-sm">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Unauthorized</p>
                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-8">Admin Access Required.</h2>
                    <Link to="/admin/login" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Login as Admin</Link>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
            Initialising Command Center...
        </div>
    );

    const role = adminContext?.role || adminUser?.admin_role || "platform_admin";
    const isPlatform = role === "platform_admin";

    if (!isPlatform) {
        return <Navigate to="/college/dashboard" replace />;
    }

    const visibleModules = [
        { title: "Colleges", path: "/admin/colleges", count: "ORG", icon: <FiHome />, color: "text-cyan-700", bg: "bg-cyan-50" },
    ];

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION (DARK THEME) */}
            <div className="relative bg-slate-900 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[30%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Platform Administrator
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Control <span className="text-slate-500 font-black">Center.</span>
                    </h1>

                    <div className="mt-10 flex justify-center">
                        <button onClick={clearSession} className="px-8 py-3 bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2">
                            <FiLogOut /> Terminate Session
                        </button>
                    </div>
                </div>
            </div>

            {/* MODULES GRID (Overlap) */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
                {message && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center">
                        {message}
                    </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visibleModules.map((module, index) => (
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
                                    Enter Module <FiArrowRight />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* QUICK STATUS INFO */}
            <section className="max-w-3xl mx-auto px-6 mt-20">
                <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 text-center">
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                        Ye Platform Admin command center hai. Aap yahan sirf college create karte ho aur
                        all-college monitoring dekhte ho. Daily NSS operations College Dashboard se handle hote hain.
                    </p>
                </div>
            </section>

            {isPlatform && (
                <section className="max-w-7xl mx-auto px-6 mt-10">
                    <div className="bg-white border border-slate-100 rounded-3xl overflow-x-auto">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">College Operations Overview</h2>
                            <p className="text-xs text-slate-500 mt-1">Platform view only: units, officers, events, volunteers and certificates by college.</p>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="text-left px-4 py-3">College</th>
                                    <th className="text-left px-4 py-3">District</th>
                                    <th className="text-right px-4 py-3">Units</th>
                                    <th className="text-right px-4 py-3">Officers</th>
                                    <th className="text-right px-4 py-3">Events</th>
                                    <th className="text-right px-4 py-3">Volunteers</th>
                                    <th className="text-right px-4 py-3">Certificates</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collegesOverview.map((college) => (
                                    <tr key={college.college_id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-800">{college.college_name}</td>
                                        <td className="px-4 py-3 text-slate-600">{college.district || "-"}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700">{college.nss_units}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700">{college.program_officers}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700">{college.events}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700">{college.volunteers}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700">{college.certificates}</td>
                                    </tr>
                                ))}
                                {!collegesOverview.length && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-xs font-semibold text-slate-400">No colleges found yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </main>
    );
}
