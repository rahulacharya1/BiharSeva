import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiPhone, FiLock, FiShield, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { api } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function VolunteerPasswordResetPage() {
    const [form, setForm] = useState({ email: "", phone: "", new_password: "", confirm_password: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    useAutoDismissMessage(message, setMessage, 2500);

    const submit = async (e) => {
        e.preventDefault();
        if (form.new_password !== form.confirm_password) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await api.post("/volunteers/password-reset/", form);
            setMessage({ type: "success", text: res.data.message || "Password updated successfully!" });
        } catch (err) {
            setMessage({ 
                type: "error", 
                text: err.response?.data?.detail || "Password reset failed. Please check your details." 
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400";
    const iconClasses = "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-indigo-500 transition-colors";

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Security Center
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Reset <span className="text-indigo-600">Password.</span>
                    </h1>
                    <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                        Apne account ki security restore karein. Verification ke liye wahi details enter karein jo registration ke waqt di thi.
                    </p>
                </div>
            </div>

            {/* RESET FORM (Overlap Card) */}
            <section className="max-w-xl mx-auto px-6 -mt-32 relative z-20">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden"
                >
                    <div className="bg-slate-900 px-10 py-4 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Identity Verification</span>
                        <FiShield className="text-indigo-400 text-sm" />
                    </div>

                    <form onSubmit={submit} className="p-10 md:p-14 space-y-6">
                        <div className="relative group">
                            <FiMail className={iconClasses} />
                            <input type="email" placeholder="Email Address" className={inputClasses} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="relative group">
                            <FiPhone className={iconClasses} />
                            <input placeholder="Registered Phone" className={inputClasses} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                        </div>
                        <div className="relative group">
                            <FiLock className={iconClasses} />
                            <input type="password" placeholder="New Password" className={inputClasses} onChange={(e) => setForm({ ...form, new_password: e.target.value })} required />
                        </div>
                        <div className="relative group">
                            <FiLock className={iconClasses} />
                            <input type="password" placeholder="Confirm New Password" className={inputClasses} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required />
                        </div>

                        <div className="pt-4 space-y-6">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-6 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Update Password <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                            </button>

                            <AnimatePresence>
                                {message.text && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className={`p-5 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                                    >
                                        {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                                        {message.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </motion.div>

                <p className="text-center mt-10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    Remembered your password? <a href="/volunteer/login" className="text-indigo-600 underline">Back to Login</a>
                </p>
            </section>
        </main>
    );
}
