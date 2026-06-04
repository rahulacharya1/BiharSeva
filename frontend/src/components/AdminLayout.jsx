import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiHome, FiBarChart2, FiCalendar, FiFileText, FiUsers, FiClock, 
    FiAward, FiAlertTriangle, FiGrid, FiUserCheck, FiSettings, 
    FiCpu, FiShield, FiLogOut, FiMenu, FiChevronDown, FiX, FiUser 
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export function AdminLayout() {
    const { adminUser, handleAdminLogout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const logout = async () => {
        await handleAdminLogout();
        navigate("/admin/login");
    };

    const isPlatformAdmin = adminUser?.admin_role === "platform_admin";

    // Navigation links configuration
    const navLinks = isPlatformAdmin 
        ? [
            { path: "/admin/panel", label: "System Panel", icon: <FiCpu /> },
            { path: "/admin/colleges", label: "Manage Colleges", icon: <FiShield /> }
          ]
        : [
            { path: "/college/dashboard", label: "Dashboard", icon: <FiHome /> },
            { path: "/college/impact-analytics", label: "Impact Analytics", icon: <FiBarChart2 /> },
            { path: "/college/events", label: "Events & Missions", icon: <FiCalendar /> },
            { path: "/college/activity-proposals", label: "Activity Proposals", icon: <FiFileText /> },
            { path: "/college/volunteers", label: "Volunteers Directory", icon: <FiUsers /> },
            { path: "/college/volunteer-hours", label: "Volunteer Hours", icon: <FiClock /> },
            { path: "/college/badges", label: "Merit Badges", icon: <FiAward /> },
            { path: "/college/certificates", label: "Certificates Portal", icon: <FiAward /> },
            { path: "/college/reports", label: "Civic Reports", icon: <FiAlertTriangle /> },
            { path: "/college/nss-units", label: "NSS Units", icon: <FiGrid /> },
            { path: "/college/program-officers", label: "Program Officers", icon: <FiUserCheck /> },
            { path: "/college/profile", label: "College Profile", icon: <FiSettings /> }
          ];

    // Helper to generate breadcrumbs
    const getBreadcrumbs = () => {
        const parts = location.pathname.split("/").filter(Boolean);
        return parts.map((part, index) => {
            let label = part.replace(/-/g, " ");
            if (label.toLowerCase() === "nss") {
                label = "NSS";
            } else if (label.toLowerCase() === "nss units") {
                label = "NSS Units";
            } else {
                label = label.replace(/\b\w/g, (char) => char.toUpperCase());
            }
            return {
                label,
                path: "/" + parts.slice(0, index + 1).join("/")
            };
        });
    };

    const breadcrumbs = getBreadcrumbs();

    const sidebarVariants = {
        expanded: { width: 280 },
        collapsed: { width: 88 }
    };

    const LinkItem = ({ link, onClick }) => {
        const isActive = location.pathname === link.path;
        return (
            <Link
                to={link.path}
                onClick={onClick}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold tracking-wide transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <span className="text-xl shrink-0">{link.icon}</span>
                {(!sidebarCollapsed || onClick) && (
                    <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="whitespace-nowrap"
                    >
                        {link.label}
                    </motion.span>
                )}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
            {/* DESKTOP SIDEBAR */}
            <motion.aside
                variants={sidebarVariants}
                animate={sidebarCollapsed ? "collapsed" : "expanded"}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 text-white relative z-30 shrink-0 h-screen overflow-y-auto"
            >
                {/* Sidebar Header / Logo */}
                <div className="p-6 flex items-center justify-between border-b border-slate-800/60 min-h-[80px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            B
                        </div>
                        {!sidebarCollapsed && (
                            <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
                            >
                                BiharSeva
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-2.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                    {navLinks.map((link) => (
                        <LinkItem key={link.path} link={link} />
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800/60">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        {sidebarCollapsed ? "→" : "← Collapse"}
                    </button>
                </div>
            </motion.aside>

            {/* MOBILE DRAWER SIDEBAR */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                        />

                        {/* Drawer panel */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "tween", duration: 0.3 }}
                            className="fixed top-0 bottom-0 left-0 w-[280px] bg-slate-900 text-white z-50 p-6 flex flex-col lg:hidden shadow-2xl overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-slate-800/60 pb-6 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                                        B
                                    </div>
                                    <span className="font-display font-extrabold text-lg tracking-tight text-white">
                                        BiharSeva
                                    </span>
                                </div>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <nav className="flex-1 space-y-2.5">
                                {navLinks.map((link) => (
                                    <LinkItem key={link.path} link={link} onClick={() => setMobileOpen(false)} />
                                ))}
                            </nav>

                            <div className="border-t border-slate-800/60 pt-6 mt-6">
                                <button
                                    onClick={logout}
                                    className="w-full py-4 bg-red-650/10 text-red-400 hover:bg-red-650 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-red-500/20"
                                >
                                    <FiLogOut /> Logout
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* MAIN APP WORKSPACE */}
            <div className="flex-grow flex flex-col h-screen overflow-hidden">
                {/* TOP HEADER BAR */}
                <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between min-h-[80px] relative z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu trigger */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            <FiMenu size={22} />
                        </button>

                        {/* Breadcrumbs (Desktop) */}
                        <nav className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <span>Admin Portal</span>
                            {breadcrumbs.map((bc, idx) => (
                                <div key={bc.path} className="flex items-center gap-2">
                                    <span className="text-slate-350">/</span>
                                    <span className={idx === breadcrumbs.length - 1 ? "text-slate-800 font-bold" : "hover:text-slate-600 cursor-pointer"} onClick={() => idx < breadcrumbs.length - 1 && navigate(bc.path)}>
                                        {bc.label}
                                    </span>
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-4">
                        {/* College/NSS Status Badge */}
                        {adminUser?.admin_college_name && (
                            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-700 shadow-sm max-w-[200px] truncate">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                                {adminUser.admin_college_name}
                            </span>
                        )}

                        {/* User Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-full transition-all"
                            >
                                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {adminUser?.username?.substring(0, 2).toUpperCase() || <FiUser />}
                                </div>
                                <span className="hidden sm:inline text-xs font-bold text-slate-700 pr-2">{adminUser?.username}</span>
                                <FiChevronDown className="hidden sm:inline text-slate-400 text-sm" />
                            </button>

                            <AnimatePresence>
                                {profileDropdownOpen && (
                                    <>
                                        {/* Click away listener */}
                                        <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-2.5xl shadow-2xl py-3 z-40"
                                        >
                                            <div className="px-5 py-3 border-b border-slate-50 mb-2">
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                                                <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{adminUser?.username}</p>
                                                <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black uppercase text-slate-500 tracking-wider mt-1.5">
                                                    {isPlatformAdmin ? "Super Admin" : "College Admin"}
                                                </span>
                                            </div>

                                            {!isPlatformAdmin && (
                                                <Link 
                                                    to="/college/profile"
                                                    onClick={() => setProfileDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                                >
                                                    <FiSettings /> College Profile
                                                </Link>
                                            )}

                                            <button
                                                onClick={() => {
                                                    setProfileDropdownOpen(false);
                                                    logout();
                                                }}
                                                className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                                            >
                                                <FiLogOut /> Sign Out
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* SCROLLABLE MAIN LAYOUT VIEWSPACE */}
                <main className="flex-grow overflow-y-auto bg-slate-50 p-6 md:p-10 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
