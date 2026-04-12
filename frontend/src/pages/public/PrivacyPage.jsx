import { motion } from "framer-motion";

const privacyPoints = [
    { title: "Data Collected", desc: "Name, contact details, district, submitted reports, and participation records.", icon: "fa-database", color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Usage", desc: "Used for verification, event coordination, status tracking, and certificate issuance.", icon: "fa-chart-line", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Security", desc: "API access is token-protected and sensitive operations require verified roles.", icon: "fa-shield-halved", color: "text-slate-900", bg: "bg-slate-100" },
    { title: "Privacy Contact", desc: "For privacy concerns or data requests, contact support@biharseva.org.", icon: "fa-envelope-shield", color: "text-emerald-600", bg: "bg-emerald-50" },
];

export function PrivacyPage() {
    return (
        <main className="min-h-screen pb-24 bg-white overflow-hidden">
            {/* --- HERO SECTION --- */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-48 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-indigo-100/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[40%] h-[50%] bg-slate-200/20 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-700 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Policy
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="font-display text-5xl md:text-8xl font-bold tracking-tight text-slate-900 leading-[1.05]"
                    >
                        Privacy & <br /> <span className="text-indigo-600">Data Use.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
                    >
                        We use minimum required information to run reporting, volunteering, and event operations responsibly.
                        <span className="block mt-2 text-slate-400 italic font-normal">Aapka data, aapka adhikaar.</span>
                    </motion.p>
                </div>
            </section>

            {/* --- POLICY GRID (OVERLAP) --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid md:grid-cols-2 gap-8">
                    {privacyPoints.map((point, i) => (
                        <motion.article
                            key={i}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="group bg-white p-10 md:p-12 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-500"
                        >
                            <div className={`w-14 h-14 ${point.bg} ${point.color} rounded-2xl flex items-center justify-center text-xl mb-8 group-hover:scale-110 transition-transform`}>
                                <i className={`fas ${point.icon}`}></i>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{point.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{point.desc}</p>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* --- TRANSPARENCY NOTE --- */}
            <section className="max-w-4xl mx-auto px-6 mt-32 text-center space-y-8">
                <div className="inline-block p-4 rounded-full bg-slate-50 border border-slate-100 mb-4">
                    <i className="fas fa-hand-holding-heart text-indigo-600"></i>
                </div>
                <h2 className="text-3xl font-display font-bold text-slate-900">Our Commitment</h2>
                <p className="text-slate-500 text-lg leading-relaxed">
                    BiharSeva is built on public trust. We do not sell user data to third parties.
                    Personal information is only shared with authorized campaign coordinators
                    when you explicitly volunteer for a local cleanup or traffic drive.
                </p>
                <div className="pt-8 border-t border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Last Updated: October 2023
                </div>
            </section>
        </main>
    );
}
