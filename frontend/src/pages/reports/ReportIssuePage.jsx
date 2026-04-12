import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

const initialFormState = { 
    reporter_name: "", 
    district: "Purnea", 
    location: "", 
    description: "", 
    photo: null 
};

const districts = [
    "Purnea", "Katihar", "Araria", "Kishanganj", "Madhepura", 
    "Saharsa", "Patna", "Gaya", "Bhagalpur", "Muzaffarpur"
];

export function ReportIssuePage() {
    const [form, setForm] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    useAutoDismissMessage(message, setMessage, 2500);

    // --- CLEANUP ON NAVIGATE ---
    // Resets state when user leaves the page to prevent "stale" data on back button
    useEffect(() => {
        return () => {
            setForm(initialFormState);
            setMessage({ type: "", text: "" });
        };
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        const payload = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null) payload.append(k, v);
        });

        try {
            await api.post("/reports/", payload, { 
                headers: { "Content-Type": "multipart/form-data" } 
            });
            
            setMessage({ type: "success", text: "Issue reported successfully! Verification is in progress." });
            
            // --- FULL RESET ---
            setForm(initialFormState); // Clears React State
            e.target.reset();          // Clears native file input
            
        } catch (err) {
            setMessage({ 
                type: "error", 
                text: err.response?.data?.detail || "Failed to submit issue. Please try again." 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen pb-24 bg-white overflow-hidden">
            {/* --- HERO SECTION --- */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-44 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-emerald-100/30 rounded-full blur-[120px]" />
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
                        Citizen Action
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight"
                    >
                        Report a <span className="text-emerald-600">Civic Issue.</span>
                    </motion.h1>
                    <p className="max-w-xl mx-auto text-slate-500 font-medium italic">
                        Help us identify hotspots that need immediate attention.
                    </p>
                </div>
            </section>

            {/* --- FORM SECTION --- */}
            <section className="max-w-4xl mx-auto px-6 -mt-24 relative z-20">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden"
                >
                    <form className="p-8 md:p-14 space-y-8" onSubmit={onSubmit}>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Reporter Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Your Name</label>
                                <input 
                                    type="text"
                                    value={form.reporter_name}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-slate-900 font-medium"
                                    placeholder="e.g. Rahul Kumar"
                                    onChange={(e) => setForm({ ...form, reporter_name: e.target.value })} 
                                    required 
                                />
                            </div>

                            {/* District Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">District</label>
                                <div className="relative">
                                    <select 
                                        value={form.district}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 appearance-none focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer font-medium"
                                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                                    >
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                                </div>
                            </div>
                        </div>

                        {/* Location Detail */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Specific Location</label>
                            <input 
                                type="text"
                                value={form.location}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-slate-900 font-medium"
                                placeholder="Landmark, Ward No, or Street Name"
                                onChange={(e) => setForm({ ...form, location: e.target.value })} 
                                required 
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Problem Description</label>
                            <textarea 
                                value={form.description}
                                rows={4}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-slate-900 font-medium"
                                placeholder="What needs fixing? (e.g. Garbage pile at the corner, open drain...)"
                                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                                required 
                            />
                        </div>

                        {/* Photo Upload Area */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Photo Evidence</label>
                            <div className="relative group border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 hover:border-emerald-300 transition-all cursor-pointer overflow-hidden">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })} 
                                    required 
                                />
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    <i className="fas fa-camera"></i>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700">
                                        {form.photo ? form.photo.name : "Click to upload image"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter">Support for JPG, PNG (Max 5MB)</p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3
                                ${loading ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-emerald-900/10'}
                            `}
                        >
                            {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
                            {loading ? "Processing..." : "Submit Report"}
                        </button>

                        {/* Success/Error Feedback */}
                        <AnimatePresence>
                            {message.text && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-5 rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-3 ${
                                        message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}
                                >
                                    <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>
            </section>
        </main>
    );
}
