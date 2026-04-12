import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_GROUPS } from "./navConfig";

// Improved NavItem with micro-indicator
const NavItem = ({ to, children, end = false, className = "" }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `relative px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-all duration-300 ${isActive
                ? "bg-emerald-100 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
            } ${className}`
        }
    >
        {({ isActive }) => (
            <>
                {children}
                {isActive && (
                    <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full"
                    />
                )}
            </>
        )}
    </NavLink>
);

export function Header({ volunteer, adminUser, mobileOpen, onToggleMobile, onCloseMobile }) {
    return (
        <header className="sticky top-0 z-[100] w-full bg-white/90 backdrop-blur-xl border-b border-slate-100/60">
            <div className="max-w-7xl mx-auto px-6 h-20 md:h-24 flex items-center justify-between">

                {/* Brand Identity */}
                <NavLink to="/" className="flex items-center space-x-4 group outline-none">
                    <div className="relative">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 shadow-xl shadow-slate-200 transition-all duration-500 group-hover:rotate-[-6deg]">
                            <i className="fas fa-leaf text-white text-xl"></i>
                        </div>
                        {/* Online Status Indicator */}
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
                            Bihar<span className="text-emerald-600">Seva</span>
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 leading-none">
                            Swaach • Shrestha
                        </span>
                    </div>
                </NavLink>

                {/* Desktop Navigation (Improved Spacing) */}
                <nav className="hidden lg:flex items-center gap-x-1.5" aria-label="Main navigation">
                    {NAV_GROUPS.Public.map(([label, path]) => (
                        <NavItem key={path} to={path} end={path === "/"}>
                            {label}
                        </NavItem>
                    ))}

                    <div className="h-6 w-px bg-slate-200 mx-4 opacity-50" />

                    {/* Action CTAs */}
                    <div className="flex items-center gap-x-4">
                        <NavLink
                            to="/report-issue"
                            className="text-[11px] font-black text-slate-500 hover:text-red-500 uppercase tracking-widest px-2 transition-colors flex items-center gap-1.5"
                        >
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                            Report Issue
                        </NavLink>

                        {volunteer ? (
                            <NavItem to="/dashboard">Dashboard</NavItem>
                        ) : (
                            <NavLink
                                to="/volunteer/register"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-6 py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 uppercase tracking-widest"
                            >
                                Join Volunteer
                            </NavLink>
                        )}

                        <NavLink
                            to={adminUser ? "/admin/panel" : "/admin/login"}
                            className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100 hover:border-slate-200"
                            title={adminUser ? "Admin Panel" : "Admin Login"}
                        >
                            <i className={`fas ${adminUser ? "fa-user-shield" : "fa-lock-open"} text-sm`}></i>
                        </NavLink>
                    </div>
                </nav>

                {/* Mobile Toggle Button (App-style) */}
                <button
                    className="lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-900 border border-slate-200 active:scale-90 transition-all shadow-sm"
                    onClick={onToggleMobile}
                >
                    <motion.i
                        key={mobileOpen ? "close" : "open"}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        className={`fas ${mobileOpen ? "fa-times" : "fa-bars-staggered"} text-lg`}
                    />
                </button>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onCloseMobile}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-[120] lg:hidden shadow-2xl overflow-y-auto"
                        >
                            <div className="p-8 pb-32 space-y-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Menu</span>
                                    <button onClick={onCloseMobile} className="text-slate-400"><i className="fas fa-times"></i></button>
                                </div>

                                <div className="space-y-10">
                                    {Object.entries(NAV_GROUPS).map(([groupName, items]) => (
                                        <section key={groupName} className="space-y-4">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-2 italic">{groupName}</p>
                                            <div className="grid gap-y-3">
                                                {items.map(([label, path]) => (
                                                    <NavLink
                                                        key={path}
                                                        to={path}
                                                        onClick={onCloseMobile}
                                                        className={({ isActive }) =>
                                                            `flex items-center px-6 py-5 rounded-[24px] text-sm font-black uppercase tracking-tight transition-all border ${isActive
                                                                ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-200"
                                                                : "bg-slate-50 text-slate-700 border-slate-100 active:bg-slate-100"
                                                            }`
                                                        }
                                                    >
                                                        {label}
                                                    </NavLink>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
