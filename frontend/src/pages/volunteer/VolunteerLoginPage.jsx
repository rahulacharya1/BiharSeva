import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";
import { PasswordInput } from "../../components/PasswordInput";

export function VolunteerLoginPage({ onLogin }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    useAutoDismissMessage(message, setMessage, 2500);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await api.post("/volunteers/login/", { email, password });
            onLogin?.({ token: res.data.token, volunteer: res.data.volunteer });
            setMessage({ type: "success", text: "Welcome back! Redirecting..." });
            navigate("/dashboard");
        } catch (err) {
            const isNetworkError = !err.response;
            setMessage({ 
                type: "error", 
                text: isNetworkError
                    ? "Cannot reach API server. Check Django is running on port 8000 and CORS is configured."
                    : (err.response?.data?.detail || "Invalid credentials. Please try again.")
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-20 relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Brand Header */}
                <div className="text-center mb-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">
                         <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Secure Access
                    </div>
                    <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Volunteer Portal</h1>
                    <p className="text-slate-500 font-medium">Log in to manage your events and certificates.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white p-8 md:p-10 rounded-[1rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
                    <form className="space-y-5" onSubmit={submit}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                            <div className="relative">
                                <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                                <input 
                                    type="email" 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:border-indigo-500/50 transition-all font-medium text-slate-900"
                                    placeholder="name@example.com"
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Password</label>
                            <PasswordInput
                                leftIcon={<i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                inputClassName="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-16 py-4 focus:outline-none focus:border-indigo-500/50 transition-all font-medium text-slate-900"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3
                                ${loading ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-indigo-900/10'}
                            `}
                        >
                            {loading ? <i className="fas fa-circle-notch animate-spin"></i> : "Sign In"}
                        </button>

                        <AnimatePresence>
                            {message.text && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className={`p-4 rounded-xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                                >
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    {/* Reset Options */}
                    <div className="pt-8 border-t border-slate-50 space-y-4">
                        <Link 
                            to="/volunteer/request-otp" 
                            className="flex items-center justify-between group p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all"
                        >
                            <span className="text-xs font-bold text-slate-600">Forgot Password? Use OTP</span>
                            <i className="fas fa-mobile-screen text-[10px] text-slate-300 group-hover:text-indigo-500 transition-all"></i>
                        </Link>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-400 text-xs font-medium">
                    Don't have a volunteer account? <Link to="/volunteer/register" className="text-indigo-600 font-black hover:underline">Apply Now</Link>
                </p>
            </motion.div>
        </main>
    );
}
