import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiPlusCircle, FiCheckCircle, FiAlertCircle, FiInfo, FiKey, FiGlobe, FiPhone, FiMail, FiMapPin, FiBriefcase, FiUser } from "react-icons/fi";
import { adminApi } from "../../api";
import { useSEO } from "../../hooks/useSEO";

const initialForm = {
  name: "",
  city: "",
  district: "Purnia",
  code: "",
  email: "",
  phone: "",
  website: "",
  admin_username: "",
  admin_email: "",
};

const districts = [
  "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
  "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar",
  "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur",
  "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran",
  "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"
];

export function AdminAddCollegePage() {
  useSEO({ title: "Add New College", description: "Register a new college and create an admin account on BiharSeva.", keywords: "add college, register college", noIndex: true });
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [inviteInfo, setInviteInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitCollege = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    // Validations consistent with BiharSeva specifications
    if (form.phone) {
      const phoneClean = form.phone.replace(/\D/g, "");
      if (phoneClean.length !== 10 || !/^[6789]/.test(phoneClean)) {
        setMsg({ type: "error", text: "Phone number must be a valid 10-digit number starting with 6-9." });
        setLoading(false);
        return;
      }
    }

    try {
      setInviteInfo(null);
      const payload = {
        ...form,
        admin_username: form.admin_username.trim(),
        admin_email: form.admin_email.trim(),
      };
      const res = await adminApi.post("/admin/colleges/", payload);
      const collegeAdmin = res.data?.college_admin;
      setInviteInfo(collegeAdmin || null);
      setMsg({ type: "success", text: "College entity successfully onboarded to registry." });
      setForm(initialForm);
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.detail || "Could not add college execution node." });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm";
  const iconClasses = "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors";

  return (
    <main className="min-h-screen pb-24 bg-white">
      {/* STANDARD HERO SECTION */}
      <div className="relative bg-slate-900 pb-48 pt-24 overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Configuration
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Add <span className="text-slate-500 font-black">College.</span>
          </h1>
          <div className="mt-10 flex justify-center">
            <Link to="/admin/panel" className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <FiArrowLeft /> Cancel Onboarding
            </Link>
          </div>
        </div>
      </div>

      {/* FORM WRAPPER (Overlap Card Architecture) */}
      <section className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          
          {/* Notification Messages inside card stack */}
          <AnimatePresence>
            {msg.text && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-6 border-b text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {msg.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />} {msg.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Secure Invite Password Display Block */}
          {inviteInfo?.temporary_password && (
            <div className="bg-cyan-950 p-8 border-b border-cyan-900 text-white space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                <FiKey /> Master Token Credentials Generated
              </div>
              <div className="grid sm:grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-xs font-medium text-slate-400">Admin Username: <span className="font-bold text-white block text-sm mt-1">{inviteInfo.username}</span></p>
                <p className="text-xs font-medium text-slate-400">Temporary Password: <span className="font-bold text-cyan-300 block text-sm mt-1 select-all">{inviteInfo.temporary_password}</span></p>
              </div>
              <p className="text-[10px] text-cyan-400/80 font-medium">Please share these keys securely once with the assigned college manager node.</p>
            </div>
          )}

          <form onSubmit={submitCollege} className="p-10 md:p-14 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <FiPlusCircle className="text-emerald-500 text-lg" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Institutional Master Form</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative group md:col-span-2">
                <FiBriefcase className={iconClasses} />
                <input className={inputClasses} placeholder="College Complete Identity Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              
              <div className="relative group">
                <FiMapPin className={iconClasses} />
                <input className={inputClasses} placeholder="City Location" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>

              <div className="relative group">
                <FiMapPin className={iconClasses} />
                <select className={inputClasses} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="relative group">
                <FiKey className={iconClasses} />
                <input className={inputClasses} placeholder="AISHE / Institution Registry Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              </div>

              <div className="relative group">
                <FiMail className={iconClasses} />
                <input type="email" className={inputClasses} placeholder="Official Contact Email Node" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              <div className="relative group">
                <FiPhone className={iconClasses} />
                <input className={inputClasses} placeholder="Primary Contact Line" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>

              <div className="relative group">
                <FiGlobe className={iconClasses} />
                <input className={inputClasses} placeholder="Domain Website URL" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>

              <div className="relative group border-t border-slate-50 pt-6 md:col-span-2 grid md:grid-cols-2 gap-6">
                <div className="relative group md:col-span-1">
                  <FiUser className={iconClasses} style={{ top: '65%' }} />
                  <input className={`${inputClasses} mt-4`} placeholder="Manager Username (Optional)" value={form.admin_username} onChange={(e) => setForm({ ...form, admin_username: e.target.value })} />
                </div>
                <div className="relative group md:col-span-1">
                  <FiMail className={iconClasses} style={{ top: '65%' }} />
                  <input type="email" className={`${inputClasses} mt-4`} placeholder="Manager Email Target (Optional)" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <FiInfo className="text-emerald-500 text-sm shrink-0" />
                <span>Onboarding confirmation updates temporary passwords structure node configurations automatically.</span>
              </div>

              <button disabled={loading} className="md:col-span-2 py-5 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50">
                {loading ? "Synchronizing Matrix..." : "Deploy Corporate Node"}
              </button>
            </div>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
