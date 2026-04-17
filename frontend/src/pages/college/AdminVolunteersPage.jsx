import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiUserCheck, FiUserMinus, FiTrash2, FiMail, FiPhone, FiHome, FiCheckCircle, FiSearch } from "react-icons/fi";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function AdminVolunteersPage({ adminUser, onLogout }) {
    const navigate = useNavigate();
    const [volunteers, setVolunteers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    useAutoDismissMessage(message, setMessage, 2500);

    const filteredVolunteers = volunteers.filter((v) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return [
            v.name,
            v.email,
            v.phone,
            v.college,
            v.district,
            v.is_verified ? "verified" : "pending",
            String(v.id ?? ""),
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));
    });

    const loadVolunteers = async () => {
        try {
            const res = await adminApi.get("/admin/volunteers/");
            setVolunteers(res.data);
        } catch (err) {
            if ([401, 403].includes(err?.response?.status)) {
                localStorage.removeItem("admin_token");
                onLogout?.();
                navigate("/admin/login");
                return;
            }
            setMessage("Failed to load volunteer registry");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadVolunteers(); }, []);

    const verify = async (id, action) => {
        await adminApi.patch(`/admin/volunteers/${id}/`, { action });
        setMessage(`Volunteer status updated to ${action === 'verify' ? 'Verified' : 'Unverified'}`);
        loadVolunteers();
    };

    const deleteVolunteer = async (v) => {
        if (!window.confirm(`Permanently remove ${v.name} from BiharSeva?`)) return;
        await adminApi.delete(`/admin/volunteers/${v.id}/`);
        setMessage("Member removed from registry");
        loadVolunteers();
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
                <AnimatePresence>
                    {message && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="mb-6 p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm">
                            <FiCheckCircle className="inline mr-2" /> {message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Registered Volunteers ({filteredVolunteers.length})
                        </h3>
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search members..."
                                className="pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-500 transition-all w-64"
                            />
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
                                {filteredVolunteers.map((v, idx) => (
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
                                                <button onClick={() => deleteVolunteer(v)} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl inline-flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredVolunteers.length === 0 && (
                        <div className="py-14 text-center border-t border-slate-50">
                            <p className="text-sm font-bold text-slate-400 italic">
                                {volunteers.length === 0 ? "No volunteers found." : "No volunteers match your search."}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

