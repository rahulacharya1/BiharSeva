import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiUserCheck, FiUserMinus, FiTrash2, FiMail, FiPhone, FiHome, FiCheckCircle, FiSearch } from "react-icons/fi";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSEO } from "../../hooks/useSEO";

import { EmptyState } from "../../components/EmptyState";

export function AdminVolunteersPage({ adminUser, onLogout }) {
  useSEO({ title: "Manage Volunteers", description: "Review, verify, and manage registered volunteers at your college.", keywords: "manage volunteers, verify volunteers", noIndex: true });
    const navigate = useNavigate();
    const toast = useToast();
    const [volunteers, setVolunteers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("name-asc");
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [volunteerToDelete, setVolunteerToDelete] = useState(null);

    const processedVolunteers = volunteers
        .filter((v) => {
            const q = searchQuery.trim().toLowerCase();
            const matchesSearch = !q || [
                v.name,
                v.email,
                v.phone,
                v.college,
                v.district,
                String(v.id ?? ""),
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(q));

            const matchesStatus = 
                filterStatus === "all" ||
                (filterStatus === "verified" && v.is_verified) ||
                (filterStatus === "pending" && !v.is_verified);

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === "name-asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (sortBy === "name-desc") {
                return (b.name || "").localeCompare(a.name || "");
            }
            if (sortBy === "id-desc") {
                return (b.id ?? 0) - (a.id ?? 0);
            }
            if (sortBy === "id-asc") {
                return (a.id ?? 0) - (b.id ?? 0);
            }
            return 0;
        });

    const loadVolunteers = async () => {
        try {
            const res = await adminApi.get("/admin/volunteers/");
            setVolunteers(res.data);
        } catch (err) {
            if (err?.response?.status === 401) {
                onLogout?.();
                navigate("/admin/login");
                return;
            }
            toast.error("Failed to load volunteer registry");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadVolunteers(); }, []);

    const verify = async (id, action) => {
        try {
            await adminApi.patch(`/admin/volunteers/${id}/`, { action });
            toast.success(`Volunteer status updated to ${action === 'verify' ? 'Verified' : 'Unverified'}`);
            loadVolunteers();
        } catch {
            toast.error("Failed to update volunteer status");
        }
    };

    const triggerDelete = (v) => {
        setVolunteerToDelete(v);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!volunteerToDelete) return;
        setDeleteLoading(true);
        try {
            await adminApi.delete(`/admin/volunteers/${volunteerToDelete.id}/`);
            toast.success("Member removed from registry");
            loadVolunteers();
        } catch {
            toast.error("Failed to delete volunteer");
        } finally {
            setDeleteLoading(false);
            setConfirmOpen(false);
            setVolunteerToDelete(null);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Accessing Member Records...</div>;

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-900 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        Membership Control
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Volunteer <span className="text-slate-500">Registry.</span>
                    </h1>
                    <div className="mt-10 flex justify-center">
                        <Link to="/college/dashboard" className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                            <FiArrowLeft /> Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* TABLE OVERLAP SECTION */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">

                <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row gap-4 md:items-center justify-between bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Registered Volunteers ({processedVolunteers.length})
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search name, phone, email..."
                                    className="pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-500 transition-all w-64 shadow-sm"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-500 transition-all shadow-sm"
                            >
                                <option value="all">All Statuses</option>
                                <option value="verified">Verified</option>
                                <option value="pending">Pending</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-500 transition-all shadow-sm"
                            >
                                <option value="name-asc">Sort: Name (A - Z)</option>
                                <option value="name-desc">Sort: Name (Z - A)</option>
                                <option value="id-desc">Sort: Newest First</option>
                                <option value="id-asc">Sort: Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {/* The Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Volunteer Detail</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Contact & Area</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedVolunteers.map((v, idx) => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                                        key={v.id} className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${v.is_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    <FiUserCheck />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{v.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{v.college || 'Individual'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-600 flex items-center gap-2 uppercase tracking-tight">
                                                    <FiMail className="text-purple-400" /> {v.email}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <FiHome className="text-purple-400" /> {v.district}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${v.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                {v.is_verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!v.is_verified ? (
                                                    <button onClick={() => verify(v.id, "verify")} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Approve</button>
                                                ) : (
                                                    <button onClick={() => verify(v.id, "unverify")} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-50 hover:text-amber-600 transition-all">Revoke</button>
                                                )}
                                                <button onClick={() => triggerDelete(v)} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl inline-flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {processedVolunteers.length === 0 && (
                        <EmptyState
                            title={volunteers.length === 0 ? "No volunteers found" : "No volunteers match"}
                            description={volunteers.length === 0 ? "No volunteers have registered under your college yet." : "Adjust your filters or search query to find volunteers."}
                        />
                    )}
                </div>
            </section>
            <ConfirmDialog 
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Remove Volunteer?"
                message={`This will permanently remove "${volunteerToDelete?.name || 'this volunteer'}" from BiharSeva.`}
                loading={deleteLoading}
            />
        </main>
    );
}

