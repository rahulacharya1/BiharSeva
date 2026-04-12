import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiMapPin, FiCheckCircle, FiLock, FiInfo } from "react-icons/fi";
import { api } from "../../api";

export function EventsPage({ volunteer }) {
    const [data, setData] = useState({ events: [], registered_event_ids: [] });
    const [msg, setMsg] = useState({ type: "", text: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/events/")
            .then((res) => {
                setData(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const register = async (id) => {
        try {
            const res = await api.post(`/events/${id}/register/`);
            setMsg({ type: "success", text: res.data.message });
            setData((prev) => ({
                ...prev,
                registered_event_ids: [...new Set([...prev.registered_event_ids, id])]
            }));
        } catch (err) {
            setMsg({
                type: "error",
                text: err.response?.data?.detail || "Registration failed."
            });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Syncing Missions...</div>;

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Community Missions
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Upcoming <span className="text-emerald-600">Events.</span>
                    </h1>
                    <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                        Join local field actions, awareness drives, and cleanliness missions happening across Bihar. Aapka ek chota sa yogdaan, ek bada badlav la sakta hai.
                    </p>
                </div>
            </div>

            {/* EVENTS GRID (Overlap) */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.events.map((event, index) => {
                        const isRegistered = data.registered_event_ids.includes(event.id);
                        return (
                            <motion.article
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-10 rounded-[1.5rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-500 group flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                                        <FiCalendar className="text-xl" />
                                    </div>
                                    {isRegistered && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                            <FiCheckCircle /> Enrolled
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-2xl font-display font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">{event.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3 font-medium italic">"{event.description}"</p>

                                <div className="space-y-4 mb-10 flex-grow">
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <FiMapPin className="text-emerald-500 text-sm" /> {event.location}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <FiInfo className="text-emerald-500 text-sm" /> {event.date}
                                    </div>
                                </div>

                                <button
                                    disabled={!volunteer || isRegistered}
                                    onClick={() => register(event.id)}
                                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl 
                                        ${isRegistered
                                            ? 'bg-slate-50 text-emerald-600 cursor-not-allowed border border-emerald-100'
                                            : !volunteer
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-slate-200'
                                        }`}
                                >
                                    {isRegistered ? <><FiCheckCircle /> Registered</> : !volunteer ? <><FiLock /> Login to Join</> : "Join Mission"}
                                </button>
                            </motion.article>
                        );
                    })}
                </div>
            </section>

            {/* MESSAGE TOAST */}
            <AnimatePresence>
                {msg.text && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]"
                    >
                        <div className={`px-8 py-4 rounded-full shadow-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                            {msg.type === 'success' ? <FiCheckCircle /> : <FiInfo />}
                            {msg.text}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
