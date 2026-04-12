import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api";

export function ReportGalleryPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/reports/gallery/")
            .then((res) => {
                setReports(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <main className="min-h-screen pb-24 bg-white overflow-hidden">
            {/* --- HERO SECTION --- */}
            <section className="relative bg-slate-50 border-b border-slate-200/60 pt-20 pb-44 px-6 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] bg-blue-100/30 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] text-blue-700 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Transparency Portal
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight"
                    >
                        Impact <span className="text-blue-600">Gallery.</span>
                    </motion.h1>
                    <p className="max-w-xl mx-auto text-slate-500 font-medium">
                        Real-time updates on reported issues across Bihar. Track progress from reporting to resolution.
                    </p>
                </div>
            </section>

            {/* --- GALLERY GRID --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Reports...</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reports.map((report, index) => (
                            <motion.article 
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-white rounded-[1rem] border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
                            >
                                {/* Image Container */}
                                <div className="relative h-64 overflow-hidden bg-slate-100">
                                    <img 
                                        src={report.photo || "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?q=80&w=1000&auto=format&fit=crop"} 
                                        alt={report.location}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = "https://placehold.co/600x400?text=No+Image+Available" }}
                                    />
                                    <div className="absolute top-5 right-5">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${getStatusColor(report.status)} shadow-sm`}>
                                            {report.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 space-y-4 flex-grow">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
                                        <i className="fas fa-location-dot"></i>
                                        {report.district}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                        {report.location}
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 italic">
                                        "{report.description}"
                                    </p>
                                </div>

                                {/* Footer Info */}
                                <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        Reported by {report.reporter_name}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all cursor-pointer">
                                        <i className="fas fa-arrow-up-right-from-square text-xs"></i>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}

                {!loading && reports.length === 0 && (
                    <div className="bg-slate-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
                        <i className="fas fa-folder-open text-4xl text-slate-300 mb-4"></i>
                        <p className="text-slate-500 font-medium">No reports have been published to the gallery yet.</p>
                    </div>
                )}
            </section>
        </main>
    );
}
