import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiTrash2, FiMapPin, FiUser, FiActivity, FiSearch, FiUpload } from "react-icons/fi";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function AdminReportsPage({ adminUser, onLogout }) {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [afterPhotoFiles, setAfterPhotoFiles] = useState({});
    const [uploadingId, setUploadingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: "", text: "" });
    useAutoDismissMessage(message, setMessage, 2500);

    const filteredReports = reports.filter((r) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;

        return [
            r.reporter_name,
            r.location,
            r.district,
            r.status,
            String(r.id ?? ""),
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));
    });

    const clearSession = () => {
        localStorage.removeItem("admin_token");
        onLogout?.();
        navigate("/admin/login");
    };

    const loadReports = async () => {
        try {
            const res = await adminApi.get("/admin/reports/");
            setReports(res.data);
        } catch (err) {
            if ([401, 403].includes(err?.response?.status)) {
                clearSession();
                return;
            }
            setMessage({ type: "error", text: "Database connection failed" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadReports(); }, []);

    const updateStatus = async (id, status) => {
        const res = await adminApi.patch(`/admin/reports/${id}/`, { status });
        setMessage({ type: "success", text: res?.data?.message || "Report status synchronized" });
        loadReports();
    };

    const deleteReport = async (id) => {
        if (!window.confirm("Permanent delete? This cannot be undone.")) return;
        await adminApi.delete(`/admin/reports/${id}/`);
        setMessage({ type: "success", text: "Entry removed from registry" });
        loadReports();
    };

    const uploadAfterPhoto = async (reportId) => {
        const file = afterPhotoFiles[reportId];
        if (!file) {
            setMessage({ type: "error", text: "Choose an image first" });
            return;
        }

        const formData = new FormData();
        formData.append("after_photo", file);

        try {
            setUploadingId(reportId);
            await adminApi.patch(`/admin/reports/${reportId}/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMessage({ type: "success", text: "After photo uploaded" });
            setAfterPhotoFiles((prev) => ({ ...prev, [reportId]: null }));
            loadReports();
        } catch {
            setMessage({ type: "error", text: "Failed to upload after photo" });
        } finally {
            setUploadingId(null);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'cleaned': return 'bg-emerald-100 text-emerald-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'verified': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Loading Civic Registry...</div>;

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION */}
            <div className="relative bg-slate-900 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Reports Management
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Civic <span className="text-slate-500">Database.</span>
                    </h1>
                    <div className="mt-10 flex justify-center gap-4">
                        <Link to="/admin/panel" className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                            <FiArrowLeft /> Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* TABLE OVERLAP SECTION */}
            <section className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
                <AnimatePresence>
                    {message.text && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`mb-6 p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                    {/* Table Header/Toolbar */}
                    <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FiActivity className="text-blue-500" /> Active Registry ({filteredReports.length})
                        </h3>
                        <div className="flex gap-4">
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Search Reports..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm w-64"
                                />
                            </div>
                        </div>
                    </div>

                    {/* The Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Reporter / ID</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Location & Area</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Cleaned Photo</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map((r, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                                        key={r.id} className="hover:bg-slate-50/30 transition-colors group"
                                    >
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                                    <FiUser />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{r.reporter_name}</p>
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID: #{String(r.id ?? "").slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <FiMapPin className="text-red-400 text-xs" /> {r.location}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-5">{r.district}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <select
                                                value={r.status}
                                                onChange={(e) => updateStatus(r.id, e.target.value)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-blue-200 transition-all cursor-pointer shadow-sm ${getStatusStyle(r.status)}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="verified">Verified</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="cleaned">Cleaned</option>
                                            </select>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50">
                                            <div className="flex flex-col gap-2">
                                                {r.after_photo ? (
                                                    <img src={r.after_photo} alt="After cleanup" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No after photo</span>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        setAfterPhotoFiles((prev) => ({ ...prev, [r.id]: file }));
                                                    }}
                                                    className="text-[10px] w-44"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => uploadAfterPhoto(r.id)}
                                                    disabled={!afterPhotoFiles[r.id] || uploadingId === r.id}
                                                    className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 justify-center"
                                                >
                                                    <FiUpload /> {uploadingId === r.id ? "Uploading..." : "Upload"}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 border-b border-slate-50 text-right">
                                            <button
                                                onClick={() => deleteReport(r.id)}
                                                className="w-10 h-10 bg-red-50 text-red-400 rounded-xl inline-flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {filteredReports.length === 0 && (
                        <div className="py-20 text-center">
                            <p className="text-sm font-bold text-slate-400 italic">
                                {reports.length === 0 ? "No reports found in registry." : "No reports match your search."}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
