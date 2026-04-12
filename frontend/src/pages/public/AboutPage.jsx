import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../api";

export function AboutPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/meta/about/")
            .then((res) => {
                setStats(res.data.stats);
                setLoading(false);
            })
            .catch(() => {
                setStats(null);
                setLoading(false);
            });
    }, []);

    const features = [
        { title: "Report", desc: "Citizens submit geo-aware issue reports with evidence.", icon: "fa-bullhorn", color: "text-orange-500", bg: "bg-orange-50" },
        { title: "Mobilize", desc: "Verified volunteers join local events and drives.", icon: "fa-users", color: "text-blue-500", bg: "bg-blue-50" },
        { title: "Recognize", desc: "Participation is rewarded through digital certificates.", icon: "fa-award", color: "text-emerald-500", bg: "bg-emerald-50" },
    ];

    return (
        <main className="min-h-screen pb-24 bg-white overflow-hidden">
            {/* --- HERO SECTION --- */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-48 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-emerald-100/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[40%] h-[50%] bg-blue-100/20 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center space-y-8">
                    {/* Mission Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Our Mission
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="font-display text-5xl md:text-8xl font-bold text-slate-900 tracking-tight leading-[1.05]"
                    >
                        People Powered <br />
                        <span className="text-emerald-600">Civic Action.</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
                    >
                        BiharSeva connects citizens, volunteers, and organizers to convert issue reporting into real field action.
                        <span className="block mt-2 text-slate-400 italic">Humara maqsad Bihar ko digital transparency ke zariye behtar banana hai.</span>
                    </motion.p>
                </div>
            </section>

            {/* --- FEATURES GRID (OVERLAP) --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <motion.article
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_rgba(16,185,129,0.1)] transition-all duration-500"
                        >
                            <div className={`w-14 h-14 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center text-xl mb-8 group-hover:scale-110 transition-transform duration-300`}>
                                <i className={`fas ${f.icon}`}></i>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed italic text-sm">{f.desc}</p>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* --- DYNAMIC IMPACT STATS --- */}
            {!loading && stats && (
                <section className="max-w-7xl mx-auto px-6 py-32">
                    <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-24 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-10 grid md:grid-cols-3 gap-16">
                            {[
                                { label: "Resolved Reports", value: stats.total_reports, icon: "fa-check-circle", color: "text-emerald-400" },
                                { label: "Verified Volunteers", value: stats.total_volunteers, icon: "fa-user-shield", color: "text-blue-400" },
                                { label: "Events Organized", value: stats.total_events, icon: "fa-calendar-alt", color: "text-purple-400" }
                            ].map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="space-y-4"
                                >
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                                        <i className={`fas ${stat.icon} ${stat.color} text-xl`}></i>
                                    </div>
                                    <h2 className="font-display text-5xl md:text-6xl font-black text-white tracking-tighter italic">
                                        {stat.value}
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* --- OPERATING PRINCIPLES --- */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <div className="bg-slate-50 border border-slate-100 rounded-[3.5rem] p-12 md:p-20 space-y-12 text-center relative overflow-hidden shadow-sm">
                    <div className="space-y-4 relative z-10">
                        <h3 className="font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Operating Principles</h3>
                        <p className="text-slate-500 font-medium">BiharSeva in mool mantron par chalta hai:</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        {["Transparency", "Community Ownership", "Verified Participation", "Measured Outcomes"].map((chip, idx) => (
                            <motion.span
                                key={idx}
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all cursor-default shadow-sm"
                            >
                                {chip}
                            </motion.span>
                        ))}
                    </div>

                    <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-9xl text-slate-900 pointer-events-none">
                        <i className="fas fa-landmark"></i>
                    </div>
                </div>
            </section>
        </main>
    );
}
