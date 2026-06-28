import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSEO } from "../../hooks/useSEO";

import { EmptyState } from "../../components/EmptyState";
import { FiArrowLeft, FiTrash2, FiAward, FiUser, FiEye, FiSearch } from "react-icons/fi";
import { useMemo } from "react";

export function AdminCertificatesPage({ adminUser, onLogout }) {
  useSEO({ title: "Manage Certificates", description: "Issue, view, and manage volunteer participation certificates.", keywords: "manage certificates, issue certificates", noIndex: true });
    const navigate = useNavigate();
    const toast = useToast();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [certToDelete, setCertToDelete] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterEvent, setFilterEvent] = useState("all");
    const [sortBy, setSortBy] = useState("date-desc");

    const events = useMemo(() => {
        const map = {};
        certificates.forEach(c => {
            if (c.event?.id && c.event?.title) {
                map[c.event.id] = c.event.title;
            }
        });
        return Object.entries(map).map(([id, title]) => ({ id, title }));
    }, [certificates]);

    const processedCertificates = useMemo(() => {
        return certificates
            .filter((c) => {
                const q = searchQuery.trim().toLowerCase();
                const matchesSearch = !q || [
                    c.volunteer?.name,
                    c.certificate_id,
                    c.event?.title
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(q));

                const matchesEvent =
                    filterEvent === "all" ||
                    String(c.event?.id) === String(filterEvent);

                return matchesSearch && matchesEvent;
            })
            .sort((a, b) => {
                if (sortBy === "date-desc") {
                    return new Date(b.issued_date || 0) - new Date(a.issued_date || 0);
                }
                if (sortBy === "date-asc") {
                    return new Date(a.issued_date || 0) - new Date(b.issued_date || 0);
                }
                if (sortBy === "name-asc") {
                    return (a.volunteer?.name || "").localeCompare(b.volunteer?.name || "");
                }
                if (sortBy === "name-desc") {
                    return (b.volunteer?.name || "").localeCompare(a.volunteer?.name || "");
                }
                return 0;
            });
    }, [certificates, searchQuery, filterEvent, sortBy]);

    const clearSession = () => {
        localStorage.removeItem("admin_token");
        onLogout?.();
        navigate("/admin/login");
    };

    const loadAll = async () => {
        try {
            const certRes = await adminApi.get("/admin/certificates/");
            setCertificates(certRes.data);
        } catch (err) {
            if (err?.response?.status === 401) {
                clearSession();
                return;
            }
            toast.error(err?.response?.data?.detail || "Failed to load registry data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const triggerDelete = (c) => {
        setCertToDelete(c);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!certToDelete) return;
        setDeleteLoading(true);
        try {
            await adminApi.delete(`/admin/certificates/${certToDelete.id}/`);
            toast.success("Certificate record removed");
            loadAll();
        } catch {
            toast.error("Failed to delete certificate");
        } finally {
            setDeleteLoading(false);
            setConfirmOpen(false);
            setCertToDelete(null);
        }
    };

    const viewCertificate = async (certificate) => {
        try {
            const res = await adminApi.get(`/admin/certificates/${certificate.id}/view/`, {
                responseType: "blob",
            });
            const file = new Blob([res.data], { type: "application/pdf" });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, "_blank", "noopener,noreferrer");
            setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
        } catch {
            toast.error("Unable to open certificate");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Syncing Achievements Registry...</div>;

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION (ADMIN DARK) */}
            <div className="relative bg-slate-900 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Recognition Management
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Issue <span className="text-slate-500">Awards.</span>
                    </h1>
                    <div className="mt-10 flex justify-center">
                        <Link to="/college/dashboard" className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                            <FiArrowLeft /> Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* CONTENT SECTION (Overlap) */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20 space-y-12">

                {/* Certificates Table Registry */}
                <div className="bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Master Registry ({processedCertificates.length})
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search recipient, ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all shadow-sm w-56"
                                />
                            </div>
                            <select
                                value={filterEvent}
                                onChange={(e) => setFilterEvent(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all shadow-sm"
                            >
                                <option value="all">All Events</option>
                                {events.map((ev) => (
                                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                                ))}
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all shadow-sm"
                            >
                                <option value="date-desc">Sort: Issued (Newest)</option>
                                <option value="date-asc">Sort: Issued (Oldest)</option>
                                <option value="name-asc">Sort: Recipient (A-Z)</option>
                                <option value="name-desc">Sort: Recipient (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Certificate ID</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Recipient</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Mission/Event</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedCertificates.map((c, idx) => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                                        key={c.id} className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xs">
                                                    <FiAward />
                                                </div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{c.certificate_id}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <FiUser className="text-blue-400" /> {c.volunteer?.name}
                                            </p>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <p className="text-sm font-medium text-slate-500 line-clamp-1 italic">
                                                {c.event?.title}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-300 uppercase mt-1">{c.issued_date}</p>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50 text-right">
                                            <div className="inline-flex gap-2">
                                                <button
                                                    onClick={() => viewCertificate(c)}
                                                    className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl inline-flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                    title="View Certificate"
                                                >
                                                    <FiEye />
                                                </button>
                                                <button 
                                                    onClick={() => triggerDelete(c)}
                                                    className="w-10 h-10 bg-red-50 text-red-400 rounded-xl inline-flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    title="Delete Certificate"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {processedCertificates.length === 0 && (
                        <EmptyState
                            title={certificates.length === 0 ? "No certificates issued" : "No certificates match"}
                            description={certificates.length === 0 ? "No NSS certificates have been issued yet." : "Adjust your filters or search query to find certificates."}
                        />
                    )}
                </div>
            </section>
            <ConfirmDialog 
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Revoke Certificate?"
                message={`This will permanently revoke certificate "${certToDelete?.certificate_id || ''}" and delete it from the registry.`}
                loading={deleteLoading}
            />
        </main>
    );
}
