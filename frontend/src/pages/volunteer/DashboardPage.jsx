import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiAward, FiCalendar, FiLogOut, FiEdit3, FiCheckCircle } from "react-icons/fi";
import { api } from "../../api";

export function DashboardPage({ volunteer, onLogout }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/volunteers/me/")
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch(() => {
                setData(null);
                setLoading(false);
            });
    }, []);

    const logout = async () => {
        await api.post("/volunteers/logout/");
        onLogout?.();
    };

    if (!volunteer) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center max-w-sm">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Access Denied</p>
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-8">Please login to view your dashboard.</h2>
                <Link to="/volunteer/login" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Go to Login</Link>
            </div>
        </div>
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Synchronizing Data...</div>;

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    {/* Added the Ping Dot here */}
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Volunteer Dashboard
                    </span>

                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Welcome, <span className="text-emerald-600">{data.volunteer.name.split(' ')[0]}.</span>
                    </h1>
                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        <Link to="/volunteer/profile" className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                            <FiEdit3 /> Edit Profile
                        </Link>
                        <button onClick={logout} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm">
                            <FiLogOut /> Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* STATS OVERLAP GRID */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-bold text-slate-900">{data.registration_count}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Missions</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                            <FiAward />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-bold text-slate-900">{data.certificate_count}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Certificates</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] flex items-center gap-6">
                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                            <FiCalendar />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-bold text-slate-900">{data.upcoming_events.length}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upcoming Drives</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* DASHBOARD CONTENT GRID */}
            <section className="max-w-7xl mx-auto px-6 mt-16 grid lg:grid-cols-2 gap-10">

                {/* Registrations List */}
                <article className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">My Participation</h3>
                        <Link to="/events" className="text-[10px] font-black text-emerald-600 uppercase underline decoration-2 underline-offset-4">Browse More</Link>
                    </div>
                    <div className="space-y-4">
                        {data.registrations.length > 0 ? data.registrations.map((r) => (
                            <div key={r.id} className="group p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-emerald-200 transition-all flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 mb-1">{r.event.title}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status: Confirmed</p>
                                </div>
                                <i className="fas fa-chevron-right text-slate-200 group-hover:text-emerald-500 transition-all"></i>
                            </div>
                        )) : (
                            <p className="text-sm font-medium text-slate-400 italic py-10 text-center underline decoration-slate-100">No registrations found.</p>
                        )}
                    </div>
                </article>

                {/* Upcoming Events List */}
                <article className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="flex justify-between items-center border-b border-white/5 pb-6 relative z-10">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Upcoming Missions</h3>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="space-y-4 relative z-10">
                        {data.upcoming_events.length > 0 ? data.upcoming_events.map((e) => (
                            <div key={e.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">{e.title}</p>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{e.date}</p>
                                </div>
                                <Link to="/events" className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-emerald-500 transition-all">
                                    <i className="fas fa-plus text-xs"></i>
                                </Link>
                            </div>
                        )) : (
                            <p className="text-sm font-medium text-slate-500 italic py-10 text-center">No upcoming events listed.</p>
                        )}
                    </div>
                </article>

            </section>
        </main>
    );
}
