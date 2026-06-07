import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";
import heroImg from "../../assets/biharseva_hero_cleanup.png";
import { useSEO } from "../../hooks/useSEO";

const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseInt(value, 10);
        if (isNaN(end) || end === 0) {
            setDisplayValue(0);
            return;
        }
        const duration = 1500; // ms
        const totalFrames = 60;
        const frameDuration = duration / totalFrames;
        const increment = end / totalFrames;
        let frame = 0;

        const timer = setInterval(() => {
            frame++;
            if (frame >= totalFrames) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(increment * frame));
            }
        }, frameDuration);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{displayValue}</span>;
};

export function HomePage() {
  useSEO({ title: "Home — Civic Engagement Platform", description: "Bihar's leading civic engagement platform. Report issues, volunteer for NSS events, earn certificates.", keywords: "BiharSeva, Bihar, civic engagement, NSS, volunteer, report issue" });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    useAutoDismissMessage(message, setMessage, 1000);

    useEffect(() => {
        api.get("/meta/home/")
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setMessage("Failed to load statistics");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 animate-pulse space-y-12">
                <div className="h-64 bg-slate-100 rounded-[3rem] w-full"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>)}
                </div>
            </div>
        );
    }

    if (message) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold text-center animate-pulse">
                    {message}
                </div>
            </div>
        );
    }

    const metrics = [
        { label: "Total Reports", value: data?.stats?.total_reports ?? 0, icon: "fa-bullhorn", color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Verified Volunteers", value: data?.stats?.total_volunteers ?? 0, icon: "fa-user-shield", color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Total Events", value: data?.stats?.total_events ?? 0, icon: "fa-calendar-check", color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Certificates", value: data?.stats?.total_certificates ?? 0, icon: "fa-award", color: "text-emerald-600", bg: "bg-emerald-50" },
    ];

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* --- HERO SECTION --- */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-44 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-emerald-100/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[40%] h-[50%] bg-blue-100/20 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
                    <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 shadow-sm"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Digital Bihar Initiative
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 leading-[1.05] tracking-tight"
                        >
                            Serve Bihar, Build <br /> <span className="text-emerald-600">Visible Impact.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="max-w-2xl mx-auto lg:mx-0 text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
                        >
                            A modern civic action platform where citizens report local issues, NSS volunteers execute field action, and outcomes are tracked in real time.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2"
                        >
                            <Link to="/volunteer/register" className="px-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 hover:shadow-emerald-200 active:scale-95 transition-all text-center">
                                Join as Volunteer
                            </Link>
                            <Link to="/report-issue" className="px-8 py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-sm active:scale-95 transition-all text-center">
                                Report an Issue
                            </Link>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-5 flex justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="relative bg-white p-6 rounded-[3.5rem] border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.06)] overflow-hidden flex items-center justify-center max-w-sm sm:max-w-md"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                            <img src={heroImg} alt="BiharSeva Civic Clean Up" className="w-full h-auto object-contain rounded-2xl" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- METRICS GRID (OVERLAP) --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col items-center text-center space-y-4 hover:shadow-[0_30px_60px_rgba(16,185,129,0.1)] transition-all duration-500 group"
                        >
                            <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <div>
                                <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">
                                    <AnimatedNumber value={item.value} />
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{item.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- ACTION STEPS --- */}
            <section className="max-w-7xl mx-auto px-6 mt-32">
                <div className="max-w-lg space-y-4 mb-16">
                    <h2 className="font-display text-4xl font-bold text-slate-900 tracking-tight">How it works</h2>
                    <p className="text-slate-500 font-medium">BiharSeva connects reporting, field execution, and recognition in one seamless loop.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { step: "01", title: "Report Issues", desc: "Upload clear evidence, area details and prioritize civic issues.", link: "/report-issue", btn: "Create Report", icon: "fa-camera-retro" },
                        { step: "02", title: "Volunteer", desc: "Join cleanliness drives and field missions across Bihar districts.", link: "/volunteer/register", btn: "Join Force", icon: "fa-hands-helping" },
                        { step: "03", title: "Track Outcomes", desc: "View events, participation, and verify generated certificates.", link: "/events", btn: "View Events", icon: "fa-chart-pie" },
                    ].map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_rgba(16,185,129,0.1)] transition-all duration-500"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <span className="font-display text-5xl font-black text-slate-100 group-hover:text-emerald-50 transition-colors">{card.step}</span>
                                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                    <i className={`fas ${card.icon} text-lg`}></i>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{card.title}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{card.desc}</p>
                            <Link to={card.link} className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 group-hover:gap-x-4 transition-all">
                                {card.btn} <i className="fas fa-arrow-right ml-2"></i>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- PARTNERING COLLEGES --- */}
            <section className="max-w-7xl mx-auto px-6 mt-32 border-t border-slate-100 pt-20">
                <div className="text-center max-w-xl mx-auto space-y-4 mb-16">
                    <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Partnering Institutions</h2>
                    <p className="text-slate-500 text-sm font-medium">BiharSeva powers NSS volunteer operations in leading colleges and universities across Bihar.</p>
                </div>
                {data?.colleges && data.colleges.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {data.colleges.map((c) => (
                            <div key={c.id} className="p-6 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{c.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-100 max-w-md mx-auto">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No partnering institutions registered yet</p>
                        <p className="text-xs text-slate-400 mt-2">Colleges can register by contacting the platform administrator.</p>
                    </div>
                )}
            </section>

            {/* --- SPOTLIGHT INFO --- */}
            <section className="max-w-7xl mx-auto px-6 mt-32">
                <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-24 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />

                    <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h3 className="font-display text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">Civic action, <br /> driven by data.</h3>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">
                                BiharSeva simplifies complex civic problems by bringing transparency.
                                Citizens raise issues, volunteers act, and administrators monitor everything via a real-time dashboard.
                            </p>
                        </div>
                        <div className="flex justify-center lg:justify-end">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                {[
                                    { label: "Districts", value: "38", icon: "fa-map-marker-alt" },
                                    { label: "Live Tracking", value: "24/7", icon: "fa-bolt" },
                                    { label: "Certified", value: "PDF", icon: "fa-file-pdf" },
                                    { label: "Transparent", value: "100%", icon: "fa-shield-halved" },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                        <i className={`fas ${item.icon} text-emerald-400 text-lg mb-2`}></i>
                                        <p className="text-white font-display font-bold text-xl">{item.value}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

