import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiArrowLeft, FiBriefcase, FiCheckCircle, FiLock, FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import { api } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";
import { PasswordInput } from "../../components/PasswordInput";

const districts = [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
    "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar",
    "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur",
    "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran",
    "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"
];

export function VolunteerRegisterPage() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: "",
        college: "",
        email: "",
        phone: "",
        district: "Patna",
        password: "",
        password_confirm: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [colleges, setColleges] = useState([]);
    const [isOtherCollege, setIsOtherCollege] = useState(false);

    useEffect(() => {
        api.get("/colleges/public/")
            .then((res) => {
                setColleges(res.data || []);
            })
            .catch(() => {
                setColleges([]);
            });
    }, []);
    useAutoDismissMessage(message, setMessage, 2500);

    const updateField = (field) => (event) => {
        const { value } = event.target;
        setForm((current) => ({ ...current, [field]: value }));
    };

    const nextStep = () => {
        if (step === 1) {
            if (!form.name || !form.email || !form.phone) {
                setMessage("Please fill in all personal details.");
                return;
            }
            const nameTrimmed = form.name.trim();
            if (nameTrimmed.length < 2) {
                setMessage("Full Name must be at least 2 characters.");
                return;
            }
            if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
                setMessage("Full Name must only contain letters and spaces.");
                return;
            }
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(form.email)) {
                setMessage("Please enter a valid email address (e.g. name@domain.com).");
                return;
            }
            const phoneClean = form.phone.replace(/\D/g, "");
            if (phoneClean.length !== 10 || !/^[6789]/.test(phoneClean)) {
                setMessage("Phone number must be a valid 10-digit number starting with 6, 7, 8, or 9.");
                return;
            }
        } else if (step === 2) {
            if (!form.college || !form.district) {
                setMessage("Please select your organization and district.");
                return;
            }
        }
        setMessage("");
        setStep((prev) => prev + 1);
    };

    const prevStep = () => {
        setMessage("");
        setStep((prev) => Math.max(1, prev - 1));
    };

    const submit = async (event) => {
        event.preventDefault();
        if (form.password.length < 8) {
            setMessage("Password must be at least 8 characters long.");
            return;
        }
        if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) {
            setMessage("Password must contain at least one letter and one number.");
            return;
        }
        if (form.password !== form.password_confirm) {
            setMessage("Passwords do not match.");
            return;
        }
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
                        Your volunteer profile has been submitted successfully. 
                        <br /><br />
                        <span className="text-slate-800 font-bold block bg-slate-50 py-3 px-4 rounded-xl border border-slate-100">
                            Verification SLA: 24 - 48 Hours
                        </span>
                        <br />
                        Our College NSS Coordinator will review your details. Once verified, you will be able to log in and earn digital awards.
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

    const steps = [
        { num: 1, label: "Personal Details" },
        { num: 2, label: "Affiliation" },
        { num: 3, label: "Security" }
    ];

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
                        Join BiharSeva to manage drives, coordinate clean-ups, and receive certified NSS recognition.
                    </p>
                </div>
            </section>

            <section className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
                <div className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                    
                    {/* Header with Visual Steps */}
                    <div className="bg-slate-900 px-8 py-6 md:px-10 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Volunteer Profile</span>
                            <span className="text-xs font-bold text-white mt-1">Step {step} of 3: {steps[step - 1].label}</span>
                        </div>
                        
                        {/* Stepper Progress Bar */}
                        <div className="flex items-center gap-3">
                            {steps.map((s) => (
                                <div key={s.num} className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step === s.num ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20' : step > s.num ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                        {s.num}
                                    </div>
                                    {s.num < 3 && <div className={`w-8 h-0.5 rounded-full ${step > s.num ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-10 md:p-16 space-y-8">
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid md:grid-cols-2 gap-6">
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

                                <label className="relative block group md:col-span-2">
                                    <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={updateField("phone")}
                                        required
                                        placeholder="Phone Number (e.g. 9876543210)"
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    />
                                </label>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid md:grid-cols-2 gap-6">
                                <label className="relative block group md:col-span-2">
                                    <FiBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors pointer-events-none z-10" />
                                    <select
                                        value={isOtherCollege ? "other" : form.college}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "other") {
                                                setIsOtherCollege(true);
                                                setForm(prev => ({ ...prev, college: "" }));
                                            } else {
                                                setIsOtherCollege(false);
                                                const matched = colleges.find(c => c.name === val);
                                                setForm(prev => ({ ...prev, college: val, district: matched?.district || prev.district }));
                                            }
                                        }}
                                        required
                                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select College / Organization</option>
                                        {colleges.map((c) => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                        <option value="other">Other (My College is not listed)</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <i className="fas fa-chevron-down text-xs"></i>
                                    </div>
                                </label>

                                {isOtherCollege && (
                                    <motion.label 
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="relative block group md:col-span-2"
                                    >
                                        <FiBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                                        <input
                                            type="text"
                                            value={form.college}
                                            onChange={updateField("college")}
                                            required
                                            placeholder="Type your College Name manually"
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                        />
                                    </motion.label>
                                )}

                                <label className="relative block group md:col-span-2">
                                    <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                                    <select
                                        value={form.district}
                                        onChange={updateField("district")}
                                        required
                                        disabled={!isOtherCollege && !!form.college}
                                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-slate-900 appearance-none cursor-pointer disabled:opacity-75 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    >
                                        {districts.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <i className="fas fa-chevron-down text-xs"></i>
                                    </div>
                                    {!isOtherCollege && !!form.college && (
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 ml-2 mt-1 block">
                                            ✓ Auto-selected based on college location
                                        </span>
                                    )}
                                </label>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid md:grid-cols-2 gap-6">
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
                            </motion.div>
                        )}

                        {message && <p className="text-center text-sm font-semibold text-rose-500 mt-2 bg-rose-50 border border-rose-100 rounded-xl py-3 px-4 animate-shake">{message}</p>}

                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    disabled={loading}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    <FiArrowLeft /> Back
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                                >
                                    Continue <FiArrowRight />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-slate-900 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Submit Registration <FiCheckCircle />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="pt-4 space-y-3">
                            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                By registering you agree to our <Link to="/privacy" className="text-emerald-600 underline">Privacy Policy</Link> and <Link to="/services" className="text-emerald-600 underline">Terms</Link>
                            </p>
                            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
