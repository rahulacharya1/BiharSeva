import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiShield, FiLock, FiHash, FiArrowRight, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";
import { PasswordInput } from "../../components/PasswordInput";

export function AdminVerifyOtpPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const tokenFromState = location.state?.otp_reset_token || "";
    const tokenFromStorage = sessionStorage.getItem("admin_otp_reset_token") || "";
    const otpResetToken = tokenFromState || tokenFromStorage;
    const email = useMemo(() => {
        return location.state?.email || sessionStorage.getItem("admin_otp_reset_email") || "";
    }, [location.state]);

    const [form, setForm] = useState({ otp: "", new_password: "", confirm_password: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    useAutoDismissMessage(message, setMessage, 2500);

    const submit = async (e) => {
        e.preventDefault();
        if (form.new_password !== form.confirm_password) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }
        if (!otpResetToken) {
            setMessage({ type: "error", text: "Session expired. Please request OTP again." });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await adminApi.post("/admin/auth/verify-otp/", {
                ...form,
                otp_reset_token: otpResetToken,
            });
            setMessage({ type: "success", text: res.data.message || "Password reset successful!" });
            sessionStorage.removeItem("admin_otp_reset_token");
            sessionStorage.removeItem("admin_otp_reset_email");
            setTimeout(() => navigate("/admin/login"), 2000);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.detail || "OTP verification failed. Please check the code."
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-900/50 focus:ring-4 focus:ring-slate-900/5 transition-all font-medium text-slate-900 placeholder:text-slate-400";
    const iconClasses = "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-slate-900 transition-colors";

    return (
        <main className="min-h-screen pb-24 bg-white">
            <div className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-200/40 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
                        </span>
                        Final Verification
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Verify <span className="text-slate-400 font-black">OTP.</span>
                    </h1>
                    {email ? (
                        <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                            We sent a 6-digit code to <span className="text-slate-900 font-bold">{email}</span>. Enter it below to reset your admin password.
                        </p>
                    ) : (
                        <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                            Enter the OTP sent to your admin email to continue.
                        </p>
                    )}
                </div>
            </div>

            <section className="max-w-xl mx-auto px-6 -mt-32 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden"
                >
                    <div className="bg-slate-900 px-10 py-5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center w-full flex items-center justify-center gap-2">
                            <FiShield /> Final Security Check
                        </span>
                    </div>

                    <form onSubmit={submit} className="p-10 md:p-14 space-y-6">
                        {!otpResetToken && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-700">
                                OTP session missing. Please request OTP again.
                            </div>
                        )}

                        {/* OTP Input */}
                        <div className="relative group">
                            <FiHash className={iconClasses} />
                            <input
                                placeholder="6-digit OTP Code"
                                className={`${inputClasses} tracking-[0.5em] font-black text-center pl-6`}
                                maxLength="6"
                                onChange={(e) => setForm({ ...form, otp: e.target.value })}
                                required
                            />
                        </div>

                        {/* New Password - Removed the manual top: 75% which caused misalignment */}
                        <PasswordInput
                            leftIcon={<FiLock className={iconClasses} />}
                            value={form.new_password}
                            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                            placeholder="New Secure Password"
                            required
                            autoComplete="new-password"
                            inputClassName={`${inputClasses} pr-16`}
                        />

                        {/* Confirm Password */}
                        <PasswordInput
                            leftIcon={<FiLock className={iconClasses} />}
                            value={form.confirm_password}
                            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                            placeholder="Confirm New Password"
                            required
                            autoComplete="new-password"
                            inputClassName={`${inputClasses} pr-16`}
                        />

                        <div className="pt-4 space-y-6">
                            <button
                                type="submit"
                                disabled={loading || !otpResetToken}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Verify & Reset
                                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <AnimatePresence>
                                {message.text && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`p-5 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold ${message.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}
                                    >
                                        {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                                        {message.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </motion.div>

                <p className="text-center mt-10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    Code didn't arrive? <Link to="/admin/request-otp" className="text-slate-900 underline">Request New OTP</Link>
                </p>
            </section>
        </main>
    );
}
