import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiUser, FiHome, FiMapPin, FiAward, FiSearch, FiUsers } from "react-icons/fi";
import { api } from "../../api";

export function VolunteersPage() {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/volunteers/")
            .then((res) => {
                setVolunteers(res.data);
                setLoading(false);
            })
            .catch(() => {
                setVolunteers([]);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
            Connecting to Community Registry...
        </div>
    );

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[30%] h-[40%] bg-emerald-100/20 rounded-full blur-[100px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        BiharSeva Community
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Verified <span className="text-emerald-600">Volunteers.</span>
                    </h1>
                    <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                        Public directory of active BiharSeva contributors working across districts. Humare veero se miliye jo Bihar ko behtar bana rahe hain.
                    </p>
                </div>
            </div>

            {/* VOLUNTEERS GRID (Overlap) */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
                {volunteers.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {volunteers.map((v, index) => (
                            <motion.article
                                key={v.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-10 rounded-[1.5rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-500 group"
                            >
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-[1.5rem] flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                        <FiUser />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                                            {v.name}
                                        </h3>
                                        <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-100">
                                            <FiAward className="text-[10px]" /> Verified Member
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <FiHome className="text-emerald-500 text-sm" />
                                        <span className="line-clamp-1">{v.college || "Individual Contributor"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <FiMapPin className="text-emerald-500 text-sm" /> {v.district}
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-20 rounded-[1.5rem] border border-slate-100 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto text-4xl mb-6">
                            <FiUsers />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 italic">No verified volunteers to display right now.</h3>
                    </div>
                )}
            </section>
        </main>
    );
}
