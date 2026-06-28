import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiAward, FiCalendar, FiLogOut, FiEdit3, FiCheckCircle, FiClock, FiArrowRight, FiChevronRight, FiPlus } from "react-icons/fi";
import { api } from "../../api";
import { useSEO } from "../../hooks/useSEO";

export function DashboardPage({ volunteer, onLogout }) {
  useSEO({ title: "Volunteer Dashboard", description: "Your BiharSeva volunteer dashboard — view service hours, badges, upcoming events, and certificates.", keywords: "dashboard, volunteer dashboard, service hours", noIndex: true });
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

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        const base = api.defaults.baseURL.replace("/api", "");
        return `${base}${url}`;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Synchronizing Data...</div>;

    const totalHours = parseFloat(data?.volunteer?.total_hours || 0);

    const tiers = [
        { name: "Volunteer", hours: 0, color: "text-slate-500 bg-slate-50 border-slate-200" },
        { name: "Bronze", hours: 20, color: "text-amber-700 bg-amber-50 border-amber-200" },
        { name: "Silver", hours: 50, color: "text-slate-600 bg-slate-100 border-slate-300" },
        { name: "Gold", hours: 100, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
        { name: "Platinum", hours: 250, color: "text-indigo-600 bg-indigo-50 border-indigo-200" }
    ];

    let currentTier = tiers[0];
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
        if (totalHours >= tiers[i].hours) {
            currentTier = tiers[i];
        }
    }

    const currentTierIndex = tiers.findIndex(t => t.name === currentTier.name);
    if (currentTierIndex < tiers.length - 1) {
        nextTier = tiers[currentTierIndex + 1];
    }

    let progressPercent = 0;
    let hoursNeededForNext = 0;
    if (nextTier) {
        const prevRequired = currentTier.hours;
        const nextRequired = nextTier.hours;
        const currentEarnedInStage = totalHours - prevRequired;
        const stageTotalNeeded = nextRequired - prevRequired;
        progressPercent = Math.min(100, Math.max(0, (currentEarnedInStage / stageTotalNeeded) * 100));
        hoursNeededForNext = nextRequired - totalHours;
    } else {
        progressPercent = 100;
    }

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    
                    {/* Volunteer Avatar */}
                    {data?.volunteer?.avatar && (
                        <div className="flex justify-center mb-6">
                            <img 
                                src={getMediaUrl(data.volunteer.avatar)} 
                                alt={data.volunteer.name} 
                                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl"
                            />
                        </div>
                    )}

                    {/* Added the Ping Dot here */}
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Volunteer Dashboard
                    </span>

                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Welcome, <span className="text-emerald-600">{data?.volunteer?.name?.split(' ')[0]}.</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                            <FiClock />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-bold text-slate-900">{totalHours}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Hours</p>
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

            {/* GAMIFICATION & MILESTONE BANNER */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-7xl mx-auto px-6 mt-10"
            >
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.01)] flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl shadow-md border ${currentTier.color}`}>
                            <FiAward />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Recognition Tier</span>
                            <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">{currentTier.name} Badge</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {nextTier ? (
                                    <>You have completed <span className="font-bold text-slate-700">{totalHours} hours</span>. Earn <span className="font-bold text-emerald-600">{hoursNeededForNext.toFixed(1)} more hours</span> to unlock the <span className="font-bold text-emerald-600">{nextTier.name}</span> tier.</>
                                ) : (
                                    <>Amazing! You have achieved the highest tier (<span className="font-bold text-indigo-600">{currentTier.name}</span>) with <span className="font-bold text-slate-700">{totalHours} hours</span>!</>
                                )}
                            </p>
                        </div>
                    </div>

                    {nextTier && (
                        <div className="w-full lg:w-96 space-y-2">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                <span>{currentTier.name} ({currentTier.hours}h)</span>
                                <span className="text-emerald-600">{progressPercent.toFixed(0)}% to {nextTier.name}</span>
                            </div>
                            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/30">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </motion.section>

            {/* RECOMMENDED ACTIONS BANNER FOR NEW/IDLE VOLUNTEERS */}
            {data.registration_count === 0 && (
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-7xl mx-auto px-6 mt-8"
                >
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-8 md:p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(4,120,87,0.15)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
                        <div className="space-y-2 relative z-10">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-wider text-white">
                                Get Started
                            </span>
                            <h3 className="text-2xl font-display font-bold tracking-tight">Ready to make an impact?</h3>
                            <p className="text-sm text-emerald-100 font-medium max-w-xl">
                                You haven't registered for any volunteering missions yet. Browse our upcoming NSS drives and register for one to start earning service hours and merit badges!
                            </p>
                        </div>
                        <Link 
                            to="/events" 
                            className="px-8 py-4 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 whitespace-nowrap relative z-10"
                        >
                            Browse Events <FiArrowRight />
                        </Link>
                    </div>
                </motion.section>
            )}

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
                                <FiChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-all" />
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
                                    <FiPlus className="text-xs" />
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
