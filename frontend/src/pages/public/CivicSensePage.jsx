import { motion } from "framer-motion";

const points = [
    { title: "No Littering", desc: "Use bins and keep streets, schools, and public places clean.", icon: "fa-trash-restore", color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Public Property", desc: "Do not damage roads, parks, buses, or government facilities.", icon: "fa-monument", color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Queue Discipline", desc: "Follow first-come, first-serve in transport and service centers.", icon: "fa-users-line", color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Noise Control", desc: "Avoid unnecessary honking and loud sound in residential areas.", icon: "fa-volume-mute", color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Local Help", desc: "Support elders, children, and people in need during civic situations.", icon: "fa-hand-holding-heart", color: "text-red-500", bg: "bg-red-50" },
    { title: "Shared Ownership", desc: "Treat your area as your responsibility, not someone else’s.", icon: "fa-house-chimney-user", color: "text-indigo-500", bg: "bg-indigo-50" },
];

export function CivicSensePage() {
    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* --- HERO SECTION (Standardized Padding) --- */}
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
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Citizen Awareness
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="font-display text-5xl md:text-8xl font-bold tracking-tight text-slate-900 leading-[1.05]"
                    >
                        Civic Sense <br /> <span className="text-emerald-600">Essentials</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
                    >
                        Small daily habits build a cleaner, safer, and more respectful Bihar.
                        <span className="block mt-2 text-slate-400 italic font-normal">Badlav ki shuruat aapse hoti hai.</span>
                    </motion.p>
                </div>
            </section>

            {/* --- CORE POINTS GRID (Standardized -mt-24 Overlap) --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {points.map((point, index) => (
                        <motion.article
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_rgba(16,185,129,0.1)] transition-all duration-500 group"
                        >
                            <div className={`w-14 h-14 ${point.bg} ${point.color} rounded-2xl flex items-center justify-center text-xl mb-8 group-hover:scale-110 transition-transform duration-300`}>
                                <i className={`fas ${point.icon}`}></i>
                            </div>
                            <h3 className="font-display text-2xl font-bold text-slate-900 mb-4 tracking-tight">{point.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">{point.desc}</p>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* --- VALUES SECTION --- */}
            <section className="max-w-7xl mx-auto px-6 mt-32">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <h2 className="font-display text-4xl font-bold text-slate-900 tracking-tight">Why Civic Sense Matters</h2>
                            <p className="text-slate-500 text-lg font-medium leading-relaxed">
                                Civic sense is the social contract we sign with our community. When we respect public spaces, we improve quality of life for all.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: "Better Public Health", icon: "fa-heart-pulse" },
                                { title: "Economic Growth", icon: "fa-chart-line" },
                                { title: "Social Harmony", icon: "fa-handshake" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                        <i className={`fas ${item.icon}`}></i>
                                    </div>
                                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-white border border-slate-100 p-12 md:p-16 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                                <i className="fas fa-quote-right text-8xl text-slate-900"></i>
                            </div>
                            <div className="relative z-10 space-y-8">
                                <p className="text-2xl md:text-3xl font-display font-medium text-slate-800 leading-relaxed italic">
                                    "The best way to find yourself is to lose yourself in the service of others."
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold">MG</div>
                                    <div>
                                        <p className="font-bold text-slate-900">Mahatma Gandhi</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Civic Inspiration</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CHECKLIST CARD (Standardized Dark Style) --- */}
            <section className="max-w-6xl mx-auto px-6 mt-32">
                <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />
                    <div className="relative z-10 space-y-10">
                        <h3 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">Daily Civic Checklist</h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            {["Use Public Bins", "Respect Queue", "Keep Noise Low", "Protect Shared Spaces"].map((text, idx) => (
                                <div key={idx} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
