import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const services = [
    {
        title: "Issue Reporting",
        desc: "Submit civic issues with location details and photographic evidence. Track your report from submission through verification to resolution.",
        icon: "fa-map-pin",
        color: "text-blue-600",
        bg: "bg-blue-50",
        link: "/report-issue",
        cta: "Report an Issue",
    },
    {
        title: "Volunteer Network",
        desc: "Join Bihar's verified volunteer force. Get matched to local campaigns, earn service hours, and build your civic profile.",
        icon: "fa-users-gear",
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        link: "/volunteer/register",
        cta: "Join as Volunteer",
    },
    {
        title: "Event Operations",
        desc: "Discover upcoming cleanliness drives, awareness campaigns, and field missions. Register, attend, and get your hours tracked automatically.",
        icon: "fa-calendar-day",
        color: "text-purple-600",
        bg: "bg-purple-50",
        link: "/events",
        cta: "Browse Events",
    },
    {
        title: "Digital Certificates",
        desc: "Receive verifiable PDF certificates for every event you attend. Each certificate has a unique ID that can be verified by anyone.",
        icon: "fa-certificate",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        link: "/certificates",
        cta: "View Certificates",
    },
];

const adminServices = [
    {
        title: "College Dashboard",
        desc: "Manage volunteers, events, and certificates scoped to your institution. Track NSS units, program officers, and activity proposals.",
        icon: "fa-building-columns",
    },
    {
        title: "Impact Analytics",
        desc: "District-level breakdowns, activity-type distributions, monthly trends, and volunteer leaderboards — all in real time.",
        icon: "fa-chart-line",
    },
    {
        title: "Data Export",
        desc: "Export volunteers, reports, and event data as CSV files for reporting to university bodies and NSS cells.",
        icon: "fa-file-export",
    },
    {
        title: "Badge & Hours System",
        desc: "Automated service hour tracking with Bronze, Silver, Gold, and Platinum badge thresholds. Gamified volunteer recognition.",
        icon: "fa-medal",
    },
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

            {/* --- CITIZEN & VOLUNTEER SERVICES (OVERLAP) --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid md:grid-cols-2 gap-8">
                    {services.map((svc, i) => (
                        <motion.article
                            key={i}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="flex flex-col gap-6 p-10 bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-500 group"
                        >
                            <div className="flex items-start gap-6">
                                <div className={`w-16 h-16 shrink-0 ${svc.bg} ${svc.color} rounded-[1.5rem] flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform`}>
                                    <i className={`fas ${svc.icon}`}></i>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{svc.title}</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">{svc.desc}</p>
                                </div>
                            </div>
                            <Link
                                to={svc.link}
                                className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 group-hover:gap-x-4 transition-all ml-[88px]"
                            >
                                {svc.cta} <i className="fas fa-arrow-right ml-2"></i>
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* --- ADMIN & INSTITUTIONAL SERVICES --- */}
            <section className="max-w-7xl mx-auto px-6 mt-32">
                <div className="max-w-lg space-y-4 mb-16">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">For Administrators</span>
                    <h2 className="font-display text-4xl font-bold text-slate-900 tracking-tight">Institutional Tools</h2>
                    <p className="text-slate-500 font-medium">Powerful management tools for college NSS units, program officers, and platform administrators.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {adminServices.map((svc, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-500 group space-y-4"
                        >
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                <i className={`fas ${svc.icon}`}></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{svc.title}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{svc.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- PROCESS PIPELINE --- */}
            <section className="max-w-7xl mx-auto px-6 py-32">
                <div className="max-w-lg space-y-4 mb-16">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">How It Works</span>
                    <h2 className="font-display text-4xl font-bold text-slate-900 tracking-tight">Three-Phase Execution</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {[
                        { phase: "Phase 1", title: "Collect", desc: "Citizens and volunteers submit actionable civic data — issue reports with photos, location context, and priority levels.", icon: "fa-database" },
                        { phase: "Phase 2", title: "Coordinate", desc: "Admins create events, assign NSS units, and manage volunteer teams for on-ground execution across districts.", icon: "fa-shuffle" },
                        { phase: "Phase 3", title: "Close The Loop", desc: "Attendance is recorded, service hours are tracked, badges are awarded, and verifiable certificates are generated.", icon: "fa-circle-check" }
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
                        <Link
                            to="/contact"
                            className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
