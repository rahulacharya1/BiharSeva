import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiLayers, FiMapPin, FiCpu, FiSearch } from "react-icons/fi";
import { adminApi } from "../../api";

export function AdminCollegesPage({ adminUser, onLogout }) {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            const res = await adminApi.get("/admin/colleges/");
            setRows(res.data || []);
        } catch (err) {
            if ([401, 403].includes(err?.response?.status)) {
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

    // Soft real-time search filtration filter
    const filteredRows = rows.filter(r =>
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.code?.toLowerCase().includes(search.toLowerCase())
    );

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
                    <div className="px-10 py-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FiLayers className="text-blue-500" /> Active Corporate Entities ({filteredRows.length})
                        </h3>
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by Code or Entity Title..."
                                className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all w-64 shadow-sm"
                            />
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
                                {filteredRows.map((r, idx) => (
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
                                {!filteredRows.length && (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-16 text-center text-sm font-medium text-slate-400 italic">No corresponding institutional registries matched or found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </section>
        </main>
    );
}
