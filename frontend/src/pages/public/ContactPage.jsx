import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api";

export function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [status, setStatus] = useState({ type: "idle", text: "" });
    const [loading, setLoading] = useState(false);

    const updateField = (field) => (e) => {
        const { value } = e.target;
        setForm((current) => ({ ...current, [field]: value }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "idle", text: "" });

        try {
            await api.post("/contact/", form);
            setStatus({ type: "success", text: "Your message has been sent. We will reply by email soon." });
            setForm({ name: "", email: "", subject: "", message: "" });
        } catch (error) {
            const responseData = error?.response?.data || {};
            const detail = responseData.detail || Object.values(responseData).flat().join(" ");
            setStatus({
                type: "error",
                text: detail || "Unable to send message right now. Please try again later.",
            });
        } finally {
            setLoading(false);
        }
    };

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
                        Support & Help
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="font-display text-5xl md:text-8xl font-bold tracking-tight text-slate-900 leading-[1.05]"
                    >
                        Contact <br /> <span className="text-indigo-600">BiharSeva.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
                    >
                        Reach our team for platform help, partnership discussions, and civic collaboration.
                        <span className="block mt-2 text-slate-400 italic font-normal">Sath milkar badlav layein.</span>
                    </motion.p>
                </div>
            </section>

            {/* --- CONTACT CONTENT --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                <div className="grid lg:grid-cols-2 gap-8 items-start">

                    {/* INFO CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        className="bg-white p-10 md:p-16 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-12"
                    >
                        <div className="space-y-4">
                            <h2 className="text-3xl font-display font-bold text-slate-900">Support Desk</h2>
                            <p className="text-slate-500 font-medium">Have questions? Our team is here to guide you through reporting issues or organizing drives.</p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: "Email", val: "noreply.biharseva@gmail.com", icon: "fa-envelope" },
                                { label: "Phone", val: "+91 70661638189", icon: "fa-phone" },
                                { label: "Location", val: "Purnea, Bihar, India", icon: "fa-location-dot" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:bg-white hover:shadow-md transition-all">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <i className={`fas ${item.icon}`}></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                                        <p className="font-bold text-slate-900">{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* CONTACT FORM */}
                    <motion.form
                        onSubmit={submit}
                        initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        className="bg-slate-900 p-10 md:p-16 rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

                        <h2 className="text-3xl font-display font-bold text-white relative z-10">Send a Message</h2>

                        <div className="grid md:grid-cols-2 gap-4 relative z-10">
                            <input
                                value={form.name}
                                onChange={updateField("name")}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                                placeholder="Name" required
                            />
                            <input
                                type="email"
                                value={form.email}
                                onChange={updateField("email")}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                                placeholder="Email" required
                            />
                        </div>
                        <input
                            value={form.subject}
                            onChange={updateField("subject")}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all relative z-10"
                            placeholder="Subject" required
                        />
                        <textarea
                            rows={4}
                            value={form.message}
                            onChange={updateField("message")}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all relative z-10"
                            placeholder="How can we help?" required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40 relative z-10"
                        >
                            {loading ? "Sending..." : "Send Message"}
                        </button>

                        <AnimatePresence>
                            {status.text && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className={`text-sm font-medium text-center italic ${status.type === "success" ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                    {status.text}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.form>
                </div>
            </section>
        </main>
    );
}
