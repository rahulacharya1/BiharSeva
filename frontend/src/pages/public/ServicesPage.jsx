import { motion } from "framer-motion";

const services = [
    { title: "Issue Reporting", desc: "Submit civic issues with location and image evidence.", icon: "fa-map-pin", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Volunteer Network", desc: "Onboard verified volunteers for local campaigns.", icon: "fa-users-gear", color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Event Operations", desc: "Publish events, manage attendance, and track outcomes.", icon: "fa-calendar-day", color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Digital Certificates", desc: "Generate verifiable certificates for participants.", icon: "fa-certificate", color: "text-emerald-600", bg: "bg-emerald-50" },
];

export function ServicesPage() {
    return (
        <main className="min-h-screen pb-24 bg-white overflow-hidden">
            {/* --- HERO SECTION --- */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-48 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-blue-100/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[40%] h-[50%] bg-indigo-100/20 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] text-blue-700 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Platform Services
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="font-display text-5xl md:text-8xl font-bold tracking-tight text-slate-900 leading-[1.05]"
                    >
                        Civic Execution <br /> <span className="text-blue-600">Simplified.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
                    >
                        A practical digital stack for citizens, volunteers, and administrators.
                        <span className="block mt-2 text-slate-400 italic font-normal">Technology meeting ground-level action.</span>
                    </motion.p>
                </div>
            </section>

            {/* --- MAIN SERVICES GRID (OVERLAP) --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid md:grid-cols-2 gap-8">
                    {services.map((svc, i) => (
                        <motion.article
                            key={i}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-8 p-10 bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-500 group"
                        >
                            <div className={`w-16 h-16 shrink-0 ${svc.bg} ${svc.color} rounded-[1.5rem] flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform`}>
                                <i className={`fas ${svc.icon}`}></i>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{svc.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{svc.desc}</p>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* --- PROCESS PIPELINE --- */}
            <section className="max-w-7xl mx-auto px-6 py-32">
                <div className="grid md:grid-cols-3 gap-12">
                    {[
                        { phase: "Phase 1", title: "Collect", desc: "Citizens and volunteers submit actionable civic data.", icon: "fa-database" },
                        { phase: "Phase 2", title: "Coordinate", desc: "Events and teams are planned for on-ground execution.", icon: "fa-shuffle" },
                        { phase: "Phase 3", title: "Close The Loop", desc: "Progress is recorded and recognition is issued transparently.", icon: "fa-circle-check" }
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="relative space-y-6 group"
                        >
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600/60">{step.phase}</div>
                            <h3 className="text-3xl font-display font-bold text-slate-900">{step.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                            <div className="h-1 w-12 bg-blue-100 group-hover:w-full transition-all duration-700" />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- FOOTER CTA --- */}
            <section className="max-w-5xl mx-auto px-6">
                <div className="bg-slate-900 rounded-[3.5rem] p-12 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
                    <div className="relative z-10 space-y-6">
                        <h3 className="font-display text-3xl font-bold text-white tracking-tight">Need a custom campaign?</h3>
                        <p className="text-slate-400 font-medium italic">We partner with NGOs and local bodies for large-scale operations.</p>
                        <button className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                            Contact Admin
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
