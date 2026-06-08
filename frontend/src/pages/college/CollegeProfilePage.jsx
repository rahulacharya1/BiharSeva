import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiUser, FiMail, FiShield, FiSave, FiLock } from "react-icons/fi";
import { adminApi } from "../../api";
import { useSEO } from "../../hooks/useSEO";

export function CollegeProfilePage({ onLogout }) {
  useSEO({ title: "College Profile", description: "View and update your college administration profile.", keywords: "college profile, admin profile", noIndex: true });
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", admin_role: "", college_name: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.get("/admin/profile/me/");
        setForm({
          username: res.data?.username || "",
          email: res.data?.email || "",
          admin_role: res.data?.admin_role || "",
          college_name: res.data?.college_name || "",
        });
      } catch (err) {
        if ([401, 403].includes(err?.response?.status)) return clearSession();
        setMessage("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    // Validation
    const usernameTrimmed = form.username.trim();
    if (usernameTrimmed.length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }
    if (!form.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(form.email)) {
      setMessage("Please enter a valid email address (e.g. name@domain.com).");
      return;
    }

    try {
      const res = await adminApi.patch("/admin/profile/me/", {
        username: form.username,
        email: form.email,
      });
      const profile = res.data?.profile || {};
      setForm((prev) => ({
        ...prev,
        username: profile.username || prev.username,
        email: profile.email || prev.email,
      }));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Could not update profile.");
    }
  };

  const inputClasses = "w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500/50 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm";
  const readOnlyClasses = "w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-medium text-sm cursor-not-allowed";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
        Loading Identity...
      </div>
    );
  }

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
                  Identity Management
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                  College <span className="text-slate-500">Profile.</span>
              </h1>
              <div className="mt-10 flex justify-center gap-4">
                  <Link to="/college/dashboard" className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                      <FiArrowLeft /> Dashboard
                  </Link>
              </div>
          </div>
      </div>

      {/* CONTENT SECTION */}
      <section className="max-w-4xl mx-auto px-6 -mt-32 relative z-20 space-y-8">
        
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-indigo-50 text-indigo-700 text-sm font-bold text-center border border-indigo-100 shadow-sm">
            {message}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 md:p-12 rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-inner"><FiUser /></div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Administrative Identity
              </h3>
          </div>

          <form onSubmit={submit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <label className="space-y-2 block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiUser /> Username</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={inputClasses}
                  required
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiMail /> Email Address</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClasses}
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiShield /> Access Level</span>
                <input
                  value={form.admin_role === "platform_admin" ? "Platform Administrator" : "College Administrator"}
                  readOnly
                  className={readOnlyClasses}
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiShield /> Assigned Entity</span>
                <input
                  value={form.college_name || "Central Authority (All)"}
                  readOnly
                  className={readOnlyClasses}
                />
              </label>
            </div>

            <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center gap-4">
              <button type="submit" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                <FiSave /> Save Identity
              </button>
              <Link to="/admin/request-otp" className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                <FiLock /> Request Password Reset
              </Link>
            </div>
          </form>
        </motion.div>

      </section>
    </main>
  );
}