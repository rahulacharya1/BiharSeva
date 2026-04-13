import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBriefcase, FiCheckCircle, FiLock, FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import { api } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";
import { PasswordInput } from "../../components/PasswordInput";

export function VolunteerRegisterPage() {
    const [form, setForm] = useState({
        name: "",
        college: "",
        email: "",
        phone: "",
        district: "Purnea",
        password: "",
        password_confirm: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    useAutoDismissMessage(message, setMessage, 2500);

    const updateField = (field) => (event) => {
        const { value } = event.target;
        setForm((current) => ({ ...current, [field]: value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await api.post("/volunteers/register/", form);
            setMessage(response.data.message || "Registration submitted.");
            setSuccess(true);
        } catch (error) {
            const responseData = error?.response?.data || {};
            const detail = responseData.detail || Object.values(responseData).flat().join(" ");
            setMessage(detail || "Failed to register volunteer.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]" />
                </div>

                <div className="bg-white p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] max-w-md w-full text-center border border-slate-100 relative z-10">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <FiCheckCircle size={40} />
                    </div>
                    <h2 className="font-display text-3xl font-bold text-slate-900 mb-4 tracking-tight">Registration Sent</h2>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed text-sm">
                        Your volunteer profile has been saved and is waiting for admin verification. It will now appear in Django admin under Volunteers.
                    </p>
                    <Link
                        to="/"
                        className="w-full bg-slate-900 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-3"
                    >
                        Back to Home <FiArrowRight />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen pb-24 bg-white">
            <section className="relative bg-slate-50 border-b border-slate-200/60 pb-48 pt-20 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Join the movement
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Become a <span className="text-emerald-600">Volunteer.</span>
                    </h1>
                    <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                        Register here and your profile will be saved in the same database that Django admin uses.
                    </p>
                </div>
            </section>

            <section className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
                <div className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 px-10 py-4 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Volunteer Profile</span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <FiCheckCircle /> Admin Verification Required
                        </span>
                    </div>

                    <form onSubmit={submit} className="p-10 md:p-16 space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <label className="relative block group">
                                <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={updateField("name")}
                                    required
                                    placeholder="Full Name"
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                            </label>

                            <label className="relative block group">
                                <FiBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    value={form.college}
                                    onChange={updateField("college")}
                                    required
                                    placeholder="College / Organization"
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                            </label>

                            <label className="relative block group">
                                <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={updateField("email")}
                                    required
                                    placeholder="Email Address"
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                            </label>

                            <label className="relative block group">
                                <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={updateField("phone")}
                                    required
                                    placeholder="Phone Number"
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                            </label>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <label className="relative block group">
                                <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors" />
                                <select
                                    value={form.district}
                                    onChange={updateField("district")}
                                    required
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 appearance-none"
                                >
                                    <option value="Purnea">Purnea</option>
                                    <option value="Katihar">Katihar</option>
                                    <option value="Araria">Araria</option>
                                    <option value="Kishanganj">Kishanganj</option>
                                    <option value="Madhepura">Madhepura</option>
                                    <option value="Saharsa">Saharsa</option>
                                </select>
                            </label>

                            <span className="hidden md:block" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <PasswordInput
                                leftIcon={<FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors" />}
                                value={form.password}
                                onChange={updateField("password")}
                                required
                                placeholder="Password"
                                autoComplete="new-password"
                                inputClassName="w-full pl-12 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            />

                            <PasswordInput
                                leftIcon={<FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors" />}
                                value={form.password_confirm}
                                onChange={updateField("password_confirm")}
                                required
                                placeholder="Confirm Password"
                                autoComplete="new-password"
                                inputClassName="w-full pl-12 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-emerald-600 text-white py-6 rounded-2xl font-black text-sm tracking-[0.2em] uppercase transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-4 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Submit Registration
                                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            {message && <p className="text-center text-sm font-medium text-rose-500 mt-4">{message}</p>}
                            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-10">
                                Registration confirms you agree to our <Link to="/privacy" className="text-emerald-600 underline">Privacy Policy</Link>
                            </p>
                            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-10">
                                By submitting this form, you agree to our <Link to="/services" className="text-emerald-600 underline">Terms of Service</Link>
                            </p>
                            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-10">
                                Already have an account? <Link to="/volunteer/login" className="text-emerald-600 underline">Login here</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}

export default VolunteerRegisterPage;
