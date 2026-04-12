import { motion } from "framer-motion";

export function CleanBiharPage() {
    const mainSteps = [
        { title: "Identify Hotspots", desc: "Use report data to find recurring waste and civic problem clusters.", icon: "fa-map-location-dot", color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Plan Local Drives", desc: "Coordinate events with volunteers and area coordinators.", icon: "fa-calendar-check", color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Track Outcomes", desc: "Mark verified progress and publish transparent status updates.", icon: "fa-chart-pie", color: "text-purple-600", bg: "bg-purple-50" },
    ];

    const strategies = [
        { title: "Ward-Level Action Teams", desc: "Focused local teams reduce delays in cleanup execution.", icon: "fa-sitemap" },
        { title: "Monthly Public Dashboard", desc: "Open metrics help communities track real improvements.", icon: "fa-desktop" },
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
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700 shadow-sm"
                    >
                        {/* The Missing Ping Dot */}
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Campaign
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="font-display text-5xl md:text-8xl font-bold tracking-tight text-slate-900 leading-[1.05]"
                    >
                        Clean Bihar <br /> <span className="text-emerald-600">Blueprint.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
                    >
                        From reporting to restoration, we run a full civic cleanup loop.
                        <span className="block mt-2 text-slate-400 italic font-normal">Bihar ko swachh banana hum sabka sankalp hai.</span>
                    </motion.p>
                </div>
            </section>

            {/* --- THREE-STEP GRID (OVERLAP) --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid md:grid-cols-3 gap-8">
                    {mainSteps.map((step, i) => (
                        <motion.article
                            key={i}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_rgba(16,185,129,0.1)] transition-all duration-500"
                        >
                            <div className={`w-14 h-14 ${step.bg} ${step.color} rounded-2xl flex items-center justify-center text-xl mb-8 group-hover:scale-110 transition-transform`}>
                                <i className={`fas ${step.icon}`}></i>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{step.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm italic">{step.desc}</p>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* --- WIDE STRATEGY SECTION --- */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid md:grid-cols-2 gap-8">
                    {strategies.map((strat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-start gap-8 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500"
                        >
                            <div className="w-16 h-16 shrink-0 bg-white rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <i className={`fas ${strat.icon} text-2xl`}></i>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-slate-900">{strat.title}</h4>
                                <p className="text-slate-500 font-medium leading-relaxed">{strat.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- CALL TO ACTION --- */}
            <section className="max-w-5xl mx-auto px-6">
                <div className="bg-slate-900 rounded-[3.5rem] p-12 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
                    <div className="relative z-10 space-y-6">
                        <h3 className="font-display text-3xl font-bold text-white tracking-tight">Ready to lead a drive?</h3>
                        <p className="text-slate-400 font-medium italic">Join our network of Ward Coordinators today.</p>
                        <button className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20">
                            Apply as Volunteer
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
