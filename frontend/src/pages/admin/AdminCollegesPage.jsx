import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiLayers, FiMapPin, FiCpu, FiSearch } from "react-icons/fi";
import { adminApi } from "../../api";
import { useSEO } from "../../hooks/useSEO";
import { EmptyState } from "../../components/EmptyState";

export function AdminCollegesPage({ adminUser, onLogout }) {
    useSEO({ title: "Manage Colleges", description: "View and manage registered colleges on the BiharSeva platform.", keywords: "manage colleges, admin", noIndex: true });
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDistrict, setFilterDistrict] = useState("all");
    const [sortBy, setSortBy] = useState("name-asc");

    const load = async () => {
        try {
            const res = await adminApi.get("/admin/colleges/");
            setRows(res.data || []);
        } catch (err) {
            if (err?.response?.status === 401) {
                localStorage.removeItem("admin_token");
                onLogout?.();
                navigate("/admin/login");
                return;
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const districts = useMemo(() => {
        const set = new Set();
        rows.forEach(r => {
            if (r.district) set.add(r.district);
        });
        return Array.from(set).sort();
    }, [rows]);

    const processedColleges = useMemo(() => {
        return rows
            .filter((r) => {
                const q = searchQuery.trim().toLowerCase();
                const matchesSearch = !q || [
                    r.name,
                    r.code,
                    r.city
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(q));

                const matchesDistrict =
                    filterDistrict === "all" ||
                    r.district === filterDistrict;

                return matchesSearch && matchesDistrict;
            })
            .sort((a, b) => {
                if (sortBy === "name-asc") {
                    return (a.name || "").localeCompare(b.name || "");
                }
                if (sortBy === "name-desc") {
                    return (b.name || "").localeCompare(a.name || "");
                }
                if (sortBy === "units-desc") {
                    return (b.nss_units_count ?? 0) - (a.nss_units_count ?? 0);
                }
                if (sortBy === "units-asc") {
                    return (a.nss_units_count ?? 0) - (b.nss_units_count ?? 0);
                }
                return 0;
            });
    }, [rows, searchQuery, filterDistrict, sortBy]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Accessing Core Database Layers...</div>;

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-900 pb-48 pt-24 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Core Repositories
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Linked <span className="text-slate-500 font-black">Registry.</span>
                    </h1>
                    <div className="mt-10 flex justify-center">
                        <Link to="/admin/panel" className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                            <FiArrowLeft /> Back to Control
                        </Link>
                    </div>
                </div>
            </div>

            {/* REGISTRY DATA TABLE (Overlap Architecture) */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
                <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">

                    {/* Table Header Controls */}
                    <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FiLayers className="text-blue-500" /> Active Corporate Entities ({processedColleges.length})
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Code or Title..."
                                    className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all w-64 shadow-sm"
                                />
                            </div>
                            <select
                                value={filterDistrict}
                                onChange={(e) => setFilterDistrict(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                            >
                                <option value="all">All Districts</option>
                                {districts.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                            >
                                <option value="name-asc">Sort: Name (A-Z)</option>
                                <option value="name-desc">Sort: Name (Z-A)</option>
                                <option value="units-desc">Sort: NSS Units (High-Low)</option>
                                <option value="units-asc">Sort: NSS Units (Low-High)</option>
                            </select>
                        </div>
                    </div>

                    {/* Master Layout Table Grid */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Educational Entity</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">District Boundary</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Registry Code</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">NSS Units</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Database Node</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedColleges.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-slate-50/40 transition-colors group">
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <p className="text-sm font-black text-slate-900 tracking-wide">{r.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{r.city || 'Bihar Boundary'}</p>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <FiMapPin className="text-blue-500 text-xs" /> {r.district}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-mono font-bold border border-slate-200/50">
                                                {r.code}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50 text-right">
                                            <span className="font-display font-black text-slate-800 text-sm">{r.nss_units_count ?? 0}</span>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50 text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-500 transition-colors">
                                                Protected View
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {processedColleges.length === 0 && (
                        <EmptyState
                            title={rows.length === 0 ? "No colleges found" : "No colleges match"}
                            description={rows.length === 0 ? "No colleges are registered on the platform yet." : "Adjust your filters or search query to find colleges."}
                        />
                    )}
                </div>
            </section>
        </main>
    );
}
