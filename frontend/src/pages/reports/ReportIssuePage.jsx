import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../../api";
import { useToast } from "../../context/ToastContext";
import { compressImage } from "../../utils/compressImage";
import { useSEO } from "../../hooks/useSEO";
import { FaChevronDown, FaCompress, FaCamera, FaSpinner, FaPaperPlane } from "react-icons/fa";

const initialFormState = { 
    reporter_name: "", 
    district: "Purnia", 
    priority: "medium",
    location: "", 
    description: "", 
    photo: null 
};

const districts = [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
    "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar",
    "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur",
    "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran",
    "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"
];

export function ReportIssuePage() {
  useSEO({ title: "Report a Civic Issue", description: "Report civic issues in Bihar with photo evidence. Track cleanup progress in your district.", keywords: "report issue, civic problem, Bihar cleanup" });
    const [form, setForm] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const toast = useToast();

    // Resets state on unmount
    useEffect(() => {
        return () => {
            setForm(initialFormState);
        };
    }, []);

    const handlePhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setCompressing(true);
            toast.info("Compressing large image...");
            const compressed = await compressImage(file, { maxSizeMB: 2, quality: 0.75 });
            setForm({ ...form, photo: compressed });
            setCompressing(false);
            toast.success(`Image compressed: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressed.size / 1024 / 1024).toFixed(1)}MB`);
        } else {
            setForm({ ...form, photo: file });
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const reporterNameTrimmed = form.reporter_name.trim();
        if (reporterNameTrimmed.length < 2) {
            toast.error("Reporter Name must be at least 2 characters.");
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(reporterNameTrimmed)) {
            toast.error("Reporter Name must only contain letters and spaces.");
            return;
        }

        const locationTrimmed = form.location.trim();
        if (locationTrimmed.length < 5) {
            toast.error("Specific Location details must be at least 5 characters.");
            return;
        }

        const descriptionTrimmed = form.description.trim();
        if (descriptionTrimmed.length < 10) {
            toast.error("Problem Description must be at least 10 characters long.");
            return;
        }
        if (descriptionTrimmed.length > 2000) {
            toast.error("Problem Description cannot exceed 2000 characters.");
            return;
        }

        if (!form.photo) {
            toast.error("Please upload photo evidence of the issue.");
            return;
        }

        setLoading(true);

        const payload = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null) payload.append(k, v);
        });

        try {
            const res = await api.post("/reports/", payload, { 
                headers: { "Content-Type": "multipart/form-data" } 
            });
            const tracking = res.data.tracking_number || "";
            toast.success(`Report submitted! Your tracking number: ${tracking}`, 8000);
            setForm(initialFormState);
        } catch (err) {
            if (err?.response?.data?.existing_report_id) {
                const dupId = err.response.data.existing_report_id;
                const trackingNum = err.response.data.tracking_number;
                toast.warning(`Duplicate report detected: tracking number ${trackingNum}. Redirecting to tracking...`, 6000);
                // Redirect user to tracking page
                window.location.href = `/reports/status?tracking=${trackingNum}`;
            } else {
                toast.error(err?.response?.data?.detail || "Something went wrong. Please check fields.");
            }
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
                    {/* Badge */}
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

                    {/* Title */}
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
                        
                        <div className="grid md:grid-cols-3 gap-6">
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
                                    <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                                </div>
                            </div>

                            {/* Priority Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Priority</label>
                                <div className="relative">
                                    <select 
                                        value={form.priority}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 appearance-none focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer font-medium"
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    >
                                        <option value="low">Low (48 hours)</option>
                                        <option value="medium">Medium (24 hours)</option>
                                        <option value="high">High (6 hours)</option>
                                    </select>
                                    <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
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
                                maxLength={2000}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-slate-900 font-medium"
                                placeholder="What needs fixing? (e.g. Garbage pile at the corner, open drain...)"
                                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                                required 
                            />
                            <p className="text-[10px] text-slate-300 ml-2 font-bold">{form.description.length}/2000</p>
                        </div>

                        {/* Photo Upload Area */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Photo Evidence</label>
                            <div className="relative group border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 hover:border-emerald-300 transition-all cursor-pointer overflow-hidden">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    capture="environment"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handlePhoto} 
                                    required 
                                />
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${compressing ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {compressing ? <FaCompress /> : <FaCamera />}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700">
                                        {compressing ? "Compressing..." : form.photo ? form.photo.name : "Click to upload image"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter">
                                        {form.photo 
                                            ? `${(form.photo.size / 1024 / 1024).toFixed(1)}MB selected`
                                            : "Support for JPG, PNG (auto-compressed if over 5MB)"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading || compressing}
                            className={`w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3
                                ${loading || compressing ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-emerald-900/10'}
                            `}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                            {loading ? "Processing..." : "Submit Report"}
                        </button>
                    </form>
                </motion.div>
            </section>
        </main>
    );
}
