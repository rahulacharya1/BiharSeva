import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiHome, FiPhone, FiMapPin, FiLock, FiCheckCircle, FiAlertCircle, FiSave } from "react-icons/fi";
import { api } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function VolunteerProfilePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", college: "", phone: "", district: "Purnea", new_password: "" });
    const [message, setMessage] = useState({ type: "", text: "" });
    const [loading, setLoading] = useState(false);
    useAutoDismissMessage(message, setMessage, 2500);

    useEffect(() => {
        api.get("/volunteers/me/")
            .then((res) => {
                const v = res.data.volunteer;
                setForm((prev) => ({
                    ...prev,
                    name: v.name,
                    college: v.college,
                    phone: v.phone,
                    district: v.district
                }));
            })
            .catch(() => setMessage({ type: "error", text: "Login required to access profile." }));
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            await api.patch("/volunteers/me/", form);
            setMessage({ type: "success", text: "Profile updated successfully!" });
            navigate("/dashboard");
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.detail || "Failed to update profile."
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400";
    const iconClasses = "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors";

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Account Settings
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Edit <span className="text-emerald-600">Profile.</span>
                    </h1>
                    <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                        Update your personal information and contact details to stay connected with the BiharSeva community.
                    </p>
                </div>
            </div>

            {/* PROFILE FORM (Overlap Card) */}
            <section className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden"
                >
                    <form onSubmit={submit} className="p-10 md:p-16 space-y-10">

                        {/* Section Header */}
                        <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
                                <FiUser />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Personal Information</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Volunteer Member</p>
                            </div>
                        </div>

                        {/* Form Fields Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="relative group">
                                <FiUser className={iconClasses} />
                                <input value={form.name} placeholder="Full Name" className={inputClasses} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="relative group">
                                <FiHome className={iconClasses} />
                                <input value={form.college} placeholder="College/Institution" className={inputClasses} onChange={(e) => setForm({ ...form, college: e.target.value })} required />
                            </div>
                            <div className="relative group">
                                <FiPhone className={iconClasses} />
                                <input value={form.phone} placeholder="Phone Number" className={inputClasses} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                            </div>
                            <div className="relative group">
                                <FiMapPin className={iconClasses} />
                                <select value={form.district} className={`${inputClasses} appearance-none cursor-pointer`} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                                    <option>Purnea</option><option>Katihar</option><option>Araria</option><option>Kishanganj</option><option>Madhepura</option><option>Saharsa</option>
                                </select>
                                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            <div className="relative group md:col-span-2">
                                <FiLock className={iconClasses} />
                                <input type="password" placeholder="New Password (Leave blank to keep current)" className={inputClasses} onChange={(e) => setForm({ ...form, new_password: e.target.value })} />
                            </div>
                        </div>

                        {/* Submit & Message */}
                        <div className="pt-6 space-y-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-emerald-600 text-white py-6 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><FiSave /> Save Changes</>}
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
            </section>
        </main>
    );
}
