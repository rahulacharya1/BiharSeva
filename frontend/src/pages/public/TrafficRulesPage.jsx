import { motion } from "framer-motion";

const rules = [
    { title: "Signal Compliance", desc: "Stop at red, move on green, and avoid risky yellow jumps.", icon: "fa-traffic-light", color: "text-red-500", bg: "bg-red-50" },
    { title: "Safety Gear", desc: "Wear helmet/seatbelt every time, even for short distances.", icon: "fa-hard-hat", color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Lane & Indicator", desc: "Use lanes correctly and signal before every single turn.", icon: "fa-arrows-left-right", color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "No Drunk Driving", desc: "Never drive under influence. Use alternate transport.", icon: "fa-beer-mug-empty", color: "text-slate-900", bg: "bg-slate-100" },
    { title: "Pedestrian Priority", desc: "Slow down at crossings, zebra lines, and school zones.", icon: "fa-person-walking", color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Speed Control", desc: "Maintain speed limits in city roads and residential areas.", icon: "fa-gauge-high", color: "text-indigo-500", bg: "bg-indigo-50" },
];

export function TrafficRulesPage() {
    return (
        <main className="min-h-screen pb-24 bg-white overflow-hidden">
            {/* --- HERO SECTION --- */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-48 px-6 overflow-hidden">
                {/* Decorative Background Glows (Red Theme) */}
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-red-100/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[40%] h-[50%] bg-orange-100/20 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center space-y-8">
                    {/* Eyebrow Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] text-red-700 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Road Safety Initiative
                    </motion.div>

                    {/* Main Title via SectionHero Concept */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    >
                        <h1 className="font-display text-5xl md:text-8xl font-bold tracking-tight text-slate-900 leading-[1.05]">
                            Save Lives, <br />
                            <span className="text-red-600">Follow Rules.</span>
                        </h1>
                        <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
                            Road discipline Bihar ke har nagrik ki zimmedari hai.
                            <span className="block mt-2 text-slate-400 italic font-normal">Safe driving starts with you.</span>
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* --- RULES GRID (Overlapping) --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rules.map((rule, index) => (
                        <motion.article
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_rgba(239,68,68,0.1)] transition-all duration-500"
                        >
                            <div className={`w-14 h-14 ${rule.bg} ${rule.color} rounded-2xl flex items-center justify-center text-xl mb-8 group-hover:scale-110 transition-transform duration-300`}>
                                <i className={`fas ${rule.icon}`}></i>
                            </div>
                            <h3 className="font-display text-2xl font-bold text-slate-900 mb-4 tracking-tight">{rule.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed text-sm">{rule.desc}</p>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* --- CHECKLIST SECTION (Dark Theme) --- */}
            <section className="max-w-6xl mx-auto px-6 mt-32">
                <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 space-y-12">
                        <div className="space-y-4">
                            <h3 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">Before You Start</h3>
                            <p className="text-slate-400 text-lg font-medium italic">Basic checks jo jaan bacha sakte hain.</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4">
                            {["Helmet / Seatbelt", "Valid Documents", "Indicators Working", "No Phone Use"].map((chip, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-white/10 hover:border-red-500/30 transition-all cursor-default"
                                >
                                    {chip}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Background Icon Decoration */}
                    <div className="absolute -bottom-10 -left-10 opacity-[0.03] text-9xl text-white pointer-events-none">
                        <i className="fas fa-car-side"></i>
                    </div>
                </div>
            </section>
        </main>
    );
}
