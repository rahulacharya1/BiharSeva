import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiUserPlus } from "react-icons/fi";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useSEO } from "../../hooks/useSEO";

const initialForm = { nss_unit: "", name: "", email: "", phone: "", designation: "NSS Program Officer" };

export function AdminProgramOfficersPage({ onLogout }) {
  useSEO({ title: "Program Officers", description: "Manage NSS program officers and coordinators for your college.", keywords: "program officers, NSS coordinators", noIndex: true });
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [adminRole, setAdminRole] = useState("platform_admin");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const isPlatform = adminRole === "platform_admin";

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const load = async () => {
    try {
      const [officersRes, unitsRes] = await Promise.all([
        adminApi.get("/admin/program-officers/"),
        adminApi.get("/admin/nss-units/"),
      ]);
      setRows(officersRes.data || []);
      setUnits(unitsRes.data || []);
      try {
        const me = await adminApi.get("/admin/auth/me/");
        setAdminRole(me.data?.admin_role || "platform_admin");
      } catch {
        setAdminRole("platform_admin");
      }
      if (!form.nss_unit && unitsRes.data?.length) {
        setForm((prev) => ({ ...prev, nss_unit: unitsRes.data[0].id }));
      }
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) return clearSession();
      toast.error("Failed to load program officers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitOfficer = async (e) => {
    e.preventDefault();

    // Validation
    const phoneClean = form.phone.replace(/\D/g, "");
    if (phoneClean.length !== 10 || !/^[6789]/.test(phoneClean)) {
      toast.error("Phone number must be a valid 10-digit number starting with 6, 7, 8, or 9.");
      return;
    }
    if (!form.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(form.email)) {
      toast.error("Please enter a valid email address (e.g. name@domain.com).");
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingId) {
        await adminApi.patch(`/admin/program-officers/${editingId}/`, form);
        toast.success("Program officer updated successfully");
      } else {
        await adminApi.post("/admin/program-officers/", form);
        toast.success("Program officer created successfully");
      }
      setEditingId(null);
      setForm((prev) => ({ ...initialForm, nss_unit: prev.nss_unit }));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save program officer");
    } finally {
      setSubmitLoading(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      nss_unit: row.nss_unit,
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      designation: row.designation || "NSS Program Officer",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm((prev) => ({ ...initialForm, nss_unit: prev.nss_unit }));
  };

  const triggerDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminApi.delete(`/admin/program-officers/${deleteId}/`);
      toast.success("Program officer deleted successfully");
      load();
    } catch (err) {
      toast.error("Failed to delete program officer");
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const inputClasses = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500/50 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm";

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Syncing Officers...</div>;

  return (
    <main className="min-h-screen pb-24 bg-white">
      {/* STANDARD HERO SECTION */}
      <div className="relative bg-slate-900 pb-48 pt-20 overflow-hidden text-center">
          <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8 shadow-sm">
                  <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  NSS Administration
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                  Program <span className="text-slate-500">Officers.</span>
              </h1>
              <div className="mt-10 flex justify-center gap-4">
                  <Link to="/college/dashboard" className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                      <FiArrowLeft /> Dashboard
                  </Link>
              </div>
          </div>
      </div>

      {/* CONTENT SECTION */}
      <section className="max-w-6xl mx-auto px-6 -mt-32 relative z-20 space-y-12">

        {/* Creation Form Card */}
        {isPlatform ? (
          <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 text-sm font-semibold text-slate-600 text-center shadow-sm">
            Platform Admin view: Program Officer create/update/delete is handled by each College Admin.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-inner"><FiUserPlus /></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {editingId ? "Edit Officer Profile" : "Register New Officer"}
                  </h3>
              </div>

              <form onSubmit={submitOfficer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input 
                    className={inputClasses} 
                    placeholder="Full Name" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    disabled={submitLoading}
                    required 
                  />
                  <input 
                    className={inputClasses} 
                    placeholder="Designation" 
                    value={form.designation} 
                    onChange={(e) => setForm({ ...form, designation: e.target.value })} 
                    disabled={submitLoading}
                    required 
                  />
                  <input 
                    type="email"
                    className={inputClasses} 
                    placeholder="Email Address" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    disabled={submitLoading}
                    required 
                  />
                  <input 
                    type="tel"
                    className={inputClasses} 
                    placeholder="Phone Number (10 digits)" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    disabled={submitLoading}
                    required 
                  />
                  
                  <div className="md:col-span-2 flex gap-3 mt-4">
                      <button disabled={submitLoading} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50">
                          {submitLoading ? (
                              <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  Processing...
                              </>
                          ) : (
                              editingId ? "Save Changes" : "Create Officer Account"
                          )}
                      </button>
                      {editingId && (
                          <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={submitLoading}
                              className="px-8 py-5 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all disabled:opacity-50"
                          >
                              Cancel
                          </button>
                      )}
                  </div>
              </form>
          </motion.div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Officer Info</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">NSS Unit</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, index) => (
                  <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-50/40 transition-colors"
                  >
                    <td className="px-6 py-5 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900">{r.name}</p>
                      <p className="text-xs font-bold text-indigo-600 mt-0.5">{r.designation}</p>
                    </td>
                    <td className="px-6 py-5 border-b border-slate-100 text-xs font-bold text-slate-500">
                      {r.unit_info?.college} / Unit {r.unit_info?.unit_number}
                    </td>
                    <td className="px-6 py-5 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-700">{r.email}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{r.phone}</p>
                    </td>
                    <td className="px-6 py-5 border-b border-slate-100 text-right">
                      {isPlatform ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">View Only</span>
                      ) : (
                        <div className="inline-flex gap-2 justify-end">
                          <button onClick={() => startEdit(r)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1"><FiEdit2 /> Edit</button>
                          <button onClick={() => triggerDelete(r.id)} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><FiTrash2 /></button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
                
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-14 text-sm font-bold text-slate-400 italic">
                      No program officers registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      <ConfirmDialog 
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Program Officer?"
        message="This will permanently delete this program officer and cannot be undone."
        loading={deleteLoading}
      />
    </main>
  );
}
