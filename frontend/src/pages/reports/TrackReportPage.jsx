import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api";
import { useToast } from "../../context/ToastContext";

const statusConfig = {
    pending: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: "fa-clock", label: "Pending Review" },
    verified: { color: "bg-violet-100 text-violet-700 border-violet-200", icon: "fa-check-circle", label: "Verified" },
    in_progress: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: "fa-spinner", label: "In Progress" },
    cleaned: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "fa-check-double", label: "Cleaned ✓" },
};

export function TrackReportPage() {
    const [tracking, setTracking] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleTrack = async (e) => {
        e.preventDefault();
        const val = tracking.trim().toUpperCase();
        if (!val) return toast.warning("Please enter a tracking number.");

        setLoading(true);
        setResult(null);
        try {
            const res = await api.get(`/reports/status/?tracking=${val}`);
            setResult(res.data);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Could not find report.");
        } finally {
            setLoading(false);
        }
    };

    const config = result ? statusConfig[result.status] || statusConfig.pending : null;

    const steps = ["pending", "verified", "in_progress", "cleaned"];
    const currentStep = result ? steps.indexOf(result.status) : -1;

    return (
        <main className="min-h-screen pb-24 bg-white overflow-hidden">
            {/* Hero */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-44 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-indigo-100/30 rounded-full blur-[120px]" />
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
                        Report Tracking
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight"
                    >
                        Track Your <span className="text-indigo-600">Report.</span>
                    </motion.h1>
                    <p className="max-w-xl mx-auto text-slate-500 font-medium italic">
                        Enter your tracking number to check the current status of your civic report.
                    </p>
                </div>
            </section>

            {/* Search */}
            <section className="max-w-2xl mx-auto px-6 -mt-24 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-8 md:p-12"
                >
                    <form onSubmit={handleTrack} className="flex gap-4">
                        <div className="flex-1 relative">
                            <i className="fas fa-hashtag absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                            <input
                                type="text"
                                value={tracking}
                                onChange={(e) => setTracking(e.target.value)}
                                placeholder="BS-R000001"
                                className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 transition-all text-lg font-mono font-bold text-slate-900 uppercase tracking-wide"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 shrink-0"
                        >
                            {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-search"></i>}
                            Track
                        </button>
                    </form>

                    {/* Result */}
                    <AnimatePresence>
                        {result && config && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-10 space-y-8"
                            >
                                {/* Status badge */}
                                <div className="text-center">
                                    <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest border ${config.color}`}>
                                        <i className={`fas ${config.icon}`}></i>
                                        {config.label}
                                    </span>
                                </div>

                                {/* Progress steps */}
                                <div className="flex items-center justify-between gap-2 px-4">
                                    {steps.map((step, idx) => {
                                        const isActive = idx <= currentStep;
                                        const stepLabel = step.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());
                                        return (
                                            <div key={step} className="flex-1 flex flex-col items-center gap-2">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                                    isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-300"
                                                }`}>
                                                    {isActive ? <i className="fas fa-check text-xs"></i> : idx + 1}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-indigo-600" : "text-slate-300"}`}>
                                                    {stepLabel}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Details */}
                                <div className="bg-slate-50 rounded-2xl p-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tracking</p>
                                        <p className="font-mono font-bold text-slate-900">{result.tracking_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">District</p>
                                        <p className="font-bold text-slate-900">{result.district}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Location</p>
                                        <p className="font-bold text-slate-900">{result.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reported</p>
                                        <p className="font-bold text-slate-900">
                                            {new Date(result.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </section>
        </main>
    );
}
