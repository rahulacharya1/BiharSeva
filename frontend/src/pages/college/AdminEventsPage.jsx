import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiCheckCircle } from "react-icons/fi";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function AdminEventsPage({ adminUser, onLogout }) {
    const navigate = useNavigate();
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);
    const initialForm = useMemo(() => ({
        title: "",
        date: today,
        location: "",
        description: "",
        program_coordinator_name: "",
        nss_unit: "",
        activity_type: "other",
        hours_per_volunteer: 2,
    }), [today]);
    const [events, setEvents] = useState([]);
    const [units, setUnits] = useState([]);
    const [adminRole, setAdminRole] = useState(adminUser?.admin_role || "platform_admin");
    const [form, setForm] = useState(initialForm);
    const [editingEventId, setEditingEventId] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [attendanceData, setAttendanceData] = useState({ event: null, registrations: [] });
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [loading, setLoading] = useState(true);
    useAutoDismissMessage(message, setMessage, 2500);

    const clearSession = () => {
        localStorage.removeItem("admin_token");
        onLogout?.();
        navigate("/admin/login");
    };

    const loadEvents = async () => {
        try {
            const [eventsRes, unitsRes, meRes] = await Promise.all([
                adminApi.get("/admin/events/"),
                adminApi.get("/admin/nss-units/"),
                adminApi.get("/admin/auth/me/"),
            ]);
            setEvents(eventsRes.data || []);
            setUnits(unitsRes.data || []);
            setAdminRole(meRes.data?.admin_role || "platform_admin");
        } catch (err) {
            if ([401, 403].includes(err?.response?.status)) {
                clearSession();
                return;
            }
            setMessage({ type: "error", text: "Failed to load event registry" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadEvents(); }, []);

    const submitEvent = async (e) => {
        e.preventDefault();
        try {
            if (editingEventId) {
                await adminApi.patch(`/admin/events/${editingEventId}/`, form);
                setMessage({ type: "success", text: "Event updated successfully" });
            } else {
                await adminApi.post("/admin/events/", form);
                setMessage({ type: "success", text: "Mission deployed successfully" });
            }
            setForm(initialForm);
            setEditingEventId(null);
            loadEvents();
        } catch (err) {
            const detail = err?.response?.data;
            const text = typeof detail === "string" ? detail : detail?.date?.[0] || detail?.detail || "Could not save event";
            setMessage({ type: "error", text });
        }
    };

    const startEditEvent = (event) => {
        setEditingEventId(event.id);
        setForm({
            title: event.title || "",
            date: event.date || today,
            location: event.location || "",
            description: event.description || "",
            program_coordinator_name: event.program_coordinator_name || "",
            nss_unit: event.nss_unit || "",
            activity_type: event.activity_type || "other",
            hours_per_volunteer: event.hours_per_volunteer || 2,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditingEventId(null);
        setForm(initialForm);
    };

    const deleteEvent = async (event) => {
        if (!window.confirm(`Permanently delete ${event.title}?`)) return;
        await adminApi.delete(`/admin/events/${event.id}/`);
        setMessage({ type: "success", text: "Event removed" });
        loadEvents();
    };

    const markEventComplete = async (event) => {
        if (event.is_completed) return;
        try {
            await adminApi.patch(`/admin/events/${event.id}/`, { is_completed: true });
            setMessage({ type: "success", text: "Event marked as completed" });
            loadEvents();
        } catch {
            setMessage({ type: "error", text: "Failed to mark event as completed" });
        }
    };

    const loadAttendance = async (eventId) => {
        if (!eventId) return;
        setAttendanceLoading(true);
        try {
            const res = await adminApi.get(`/admin/events/${eventId}/attendance/`);
            setAttendanceData(res.data);
        } catch {
            setMessage({ type: "error", text: "Failed to load attendance list" });
        } finally {
            setAttendanceLoading(false);
        }
    };

    const markPresent = async (registrationId) => {
        if (!selectedEventId) return;
        try {
            await adminApi.patch(`/admin/events/${selectedEventId}/attendance/${registrationId}/`, { attended: true });
            setMessage({ type: "success", text: "Attendance marked. Certificate generated automatically for verified volunteer." });
            await loadAttendance(selectedEventId);
        } catch {
            setMessage({ type: "error", text: "Failed to mark attendance" });
        }
    };

    const inputClasses = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm";

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Syncing Missions...</div>;

    return (
        <main className="min-h-screen pb-24 bg-white">
            {/* STANDARD HERO SECTION (ADMIN DARK) */}
            <div className="relative bg-slate-900 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Mission Control
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Manage <span className="text-slate-500">Events.</span>
                    </h1>
                    <div className="mt-10 flex justify-center gap-4">
                        <Link to="/college/dashboard" className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                            <FiArrowLeft /> Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* CONTENT SECTION (Overlap) */}
            <section className="max-w-6xl mx-auto px-6 -mt-32 relative z-20 space-y-12">

                {/* Event Creation Form Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg shadow-inner"><FiPlus /></div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            {editingEventId ? "Edit Mission" : "Deploy New Mission"}
                        </h3>
                    </div>

                        <form onSubmit={submitEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input className={`${inputClasses} md:col-span-2`} placeholder="Event Title (e.g. Clean Purnea Drive)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                            <select className={inputClasses} value={form.nss_unit} onChange={(e) => setForm({ ...form, nss_unit: e.target.value })} required={adminRole !== "platform_admin"}>
                                <option value="">Select NSS Unit</option>
                                {units.map((u) => (
                                    <option key={u.id} value={u.id}>{u.college_name} / Unit {u.unit_number}</option>
                                ))}
                            </select>
                            <input type="number" step="0.25" min="0.25" className={inputClasses} placeholder="Hours per Volunteer" value={form.hours_per_volunteer} onChange={(e) => setForm({ ...form, hours_per_volunteer: e.target.value })} />
                        <input type="date" min={today} className={inputClasses} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                        <input className={inputClasses} placeholder="Location / Meeting Point" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
                        <textarea className={`${inputClasses} md:col-span-2 resize-none h-32`} placeholder="Mission Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <input className={`${inputClasses} md:col-span-2`} placeholder="Program Coordinator Name" value={form.program_coordinator_name} onChange={(e) => setForm({ ...form, program_coordinator_name: e.target.value })} />
                            <div className="md:col-span-2 flex gap-3">
                                <button className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200">
                                    {editingEventId ? "Save Changes" : "Create Event Mission"}
                                </button>
                                {editingEventId && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-8 py-5 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                    </form>
                </motion.div>

                {/* Event List Table */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {message.text && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className={`p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Title</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Coordinator</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">NSS Unit</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Description</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((e, index) => (
                                        <motion.tr
                                            key={e.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="hover:bg-slate-50/40 transition-colors"
                                        >
                                            <td className="px-6 py-4 border-b border-slate-100 text-sm font-bold text-slate-900">{e.title}</td>
                                            <td className="px-6 py-4 border-b border-slate-100 text-xs font-bold text-slate-600">{e.date}</td>
                                            <td className="px-6 py-4 border-b border-slate-100 text-xs font-bold text-slate-600">{e.location}</td>
                                            <td className="px-6 py-4 border-b border-slate-100 text-xs font-bold text-slate-600">{e.program_coordinator_name || "-"}</td>
                                            <td className="px-6 py-4 border-b border-slate-100 text-xs font-bold text-slate-500">{e.nss_unit_name || "Unassigned"}</td>
                                            <td className="px-6 py-4 border-b border-slate-100 text-xs text-slate-500 max-w-[320px]">{e.description || "-"}</td>
                                            <td className="px-6 py-4 border-b border-slate-100">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${e.is_completed ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                                                    {e.is_completed ? <FiCheckCircle /> : null}
                                                    {e.is_completed ? "Completed" : "Active"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-b border-slate-100 text-right">
                                                <div className="inline-flex gap-2">
                                                    {!e.is_completed && (
                                                        <button onClick={() => startEditEvent(e)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1"><FiEdit2 /> Edit</button>
                                                    )}
                                                    <button
                                                        onClick={() => markEventComplete(e)}
                                                        disabled={e.is_completed}
                                                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${e.is_completed ? "bg-emerald-100 text-emerald-700 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                                                    >
                                                        {e.is_completed ? "Completed" : "Mark Complete"}
                                                    </button>
                                                    <button onClick={() => deleteEvent(e)} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {events.length === 0 && (
                            <div className="py-14 text-center">
                                <p className="text-sm font-bold text-slate-400 italic">No events found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attendance and Auto Certificate Section */}
                <div className="bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Attendance and Auto Certificates</h3>
                            <p className="text-xs text-slate-500 mt-1">Mark volunteer present and certificate will be generated automatically.</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <select
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="min-w-[220px] bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                            >
                                <option value="">Select Event</option>
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>{event.title}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => loadAttendance(selectedEventId)}
                                disabled={!selectedEventId || attendanceLoading}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                {attendanceLoading ? "Loading" : "Load"}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/40">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Volunteer</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Email</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Attendance</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.registrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="px-6 py-4 border-b border-slate-100 text-sm font-bold text-slate-900">{reg.volunteer?.name}</td>
                                        <td className="px-6 py-4 border-b border-slate-100 text-xs text-slate-600">{reg.volunteer?.email}</td>
                                        <td className="px-6 py-4 border-b border-slate-100">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${reg.attended ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                {reg.attended ? "Present" : "Pending"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 text-right">
                                            <button
                                                type="button"
                                                onClick={() => markPresent(reg.id)}
                                                disabled={reg.attended}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${reg.attended ? "bg-emerald-100 text-emerald-700 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                                            >
                                                {reg.attended ? "Marked" : "Mark Present"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedEventId && !attendanceLoading && attendanceData.registrations.length === 0 && (
                        <div className="py-10 text-center">
                            <p className="text-sm font-bold text-slate-400 italic">No registrations found for selected event.</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

