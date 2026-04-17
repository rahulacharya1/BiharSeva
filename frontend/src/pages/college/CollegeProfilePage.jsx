import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUser, FiMail, FiShield, FiSave } from "react-icons/fi";
import { adminApi } from "../../api";

export function CollegeProfilePage({ onLogout }) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
        Loading Profile...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-display font-bold text-slate-900">College Profile</h1>
          <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider inline-flex items-center gap-2">
            <FiArrowLeft /> Back
          </Link>
        </div>

        {message && <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700">{message}</div>}

        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="bg-slate-900 px-6 py-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
            <FiShield className="text-slate-500" /> Account Details
          </div>

          <form onSubmit={submit} className="p-6 md:p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiUser /> Username</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiMail /> Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                />
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiShield /> Role</span>
                <input
                  value={form.admin_role === "platform_admin" ? "Platform Admin" : "College Admin"}
                  readOnly
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiShield /> College</span>
                <input
                  value={form.college_name || "-"}
                  readOnly
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-500"
                />
              </label>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button type="submit" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest">
                <FiSave /> Save Changes
              </button>
              <Link to="/admin/request-otp" className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest">
                Change Password with OTP
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}