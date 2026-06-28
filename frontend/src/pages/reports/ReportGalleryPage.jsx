import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../api";
import { SkeletonGrid } from "../../components/Skeleton";
import { useSEO } from "../../hooks/useSEO";
import { FaSearch, FaChevronDown, FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";
import { EmptyState } from "../../components/EmptyState";

const districts = ["", "Purnea", "Katihar", "Araria", "Kishanganj", "Madhepura", "Saharsa"];
const statuses = ["", "verified", "in_progress", "cleaned"];

export function ReportGalleryPage() {
  useSEO({ title: "Report Gallery", description: "Browse submitted civic reports across Bihar districts. View before and after cleanup photos.", keywords: "report gallery, civic reports, cleanup photos" });
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ district: "", status: "", search: "" });

    const fetchReports = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.district) params.set("district", filters.district);
        if (filters.status) params.set("status", filters.status);
        if (filters.search) params.set("search", filters.search);

        api.get(`/reports/gallery/?${params.toString()}`)
            .then((res) => {
                setReports(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchReports();
    }, [filters.district, filters.status]);

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(fetchReports, 400);
        return () => clearTimeout(timeout);
    }, [filters.search]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "cleaned": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200";
            case "verified": return "bg-violet-100 text-violet-700 border-violet-200";
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

            {/* --- SEARCH & FILTERS --- */}
            <section className="max-w-7xl mx-auto px-6 -mt-24 relative z-20 mb-10">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                        <input
                            type="text"
                            placeholder="Search by location, description..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={filters.district}
                            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                            className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 pr-10 text-sm font-medium focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                            <option value="">All Districts</option>
                            {districts.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                    </div>
                    <div className="relative">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 pr-10 text-sm font-medium focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            {statuses.filter(Boolean).map(s => (
                                <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                            ))}
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                    </div>
                </div>
            </section>

            {/* --- GALLERY GRID --- */}
            <section className="max-w-7xl mx-auto px-6">
                {loading ? (
                    <SkeletonGrid count={6} />
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
                                {/* Before / After Image Container */}
                                <div className="relative p-4 bg-slate-50 border-b border-slate-100">
                                    <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${getStatusColor(report.status)} shadow-sm`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-8">
                                        <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border-b border-slate-200">Before</div>
                                            <img
                                                src={report.photo || "https://placehold.co/600x400?text=Before+Photo"}
                                                alt={`${report.location} before cleanup`}
                                                className="w-full h-56 object-cover"
                                                loading="lazy"
                                                onError={(e) => { e.target.src = "https://placehold.co/600x400?text=Before+Photo"; }}
                                            />
                                        </div>
                                        <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border-b border-slate-200">After</div>
                                            <img
                                                src={report.after_photo || "https://placehold.co/600x400?text=After+Photo+Pending"}
                                                alt={`${report.location} after cleanup`}
                                                className="w-full h-56 object-cover"
                                                loading="lazy"
                                                onError={(e) => { e.target.src = "https://placehold.co/600x400?text=After+Photo+Pending"; }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 space-y-4 flex-grow">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
                                        <FaMapMarkerAlt />
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
                                        <FaExternalLinkAlt className="text-xs" />
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}

                {!loading && reports.length === 0 && (
                    <EmptyState
                        title="No reports match your filters."
                        description="Try modifying search query or selecting a different district/status."
                    />
                )}
            </section>
        </main>
    );
}
