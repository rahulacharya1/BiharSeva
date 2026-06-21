import { useState, Suspense } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { FiCpu, FiPlusCircle, FiLayers, FiLogOut, FiMenu, FiChevronDown, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "./PageLoader";

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

    const navLinks = [
        { path: "/admin/panel", label: "Overview Panel", icon: <FiCpu /> },
        { path: "/admin/colleges/add", label: "Add College", icon: <FiPlusCircle /> },
        { path: "/admin/colleges", label: "View Colleges", icon: <FiLayers /> }
    ];

    const getBreadcrumbs = () => {
        const trailMap = {
            "/admin/panel": [
                { label: "Admin Portal", path: "/admin/panel" },
                { label: "Overview Panel", path: "/admin/panel" },
            ],
            "/admin/colleges": [
                { label: "Admin Portal", path: "/admin/panel" },
                { label: "View Colleges", path: "/admin/colleges" },
            ],
            "/admin/colleges/add": [
                { label: "Admin Portal", path: "/admin/panel" },
                { label: "Add College", path: "/admin/colleges/add" },
            ],
        };

        return trailMap[location.pathname] ?? [];
    };

    return (
        <div className="fixed inset-0 w-screen h-screen bg-slate-50 flex overflow-hidden font-sans antialiased">
            
            {/* PERMANENT FIX SIDEBAR - WILL NEVER FLASH */}
            <div 
                style={{ width: sidebarCollapsed ? "88px" : "280px" }}
                className="hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 text-white h-full shrink-0 transition-all duration-300 ease-in-out relative z-30"
            >
                <div className="p-6 flex items-center justify-between border-b border-slate-800/60 h-20 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">B</div>
                        {!sidebarCollapsed && (
                            <Link to="/" className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent truncate">
                                BiharSeva
                            </Link>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-150 ${
                                    isActive 
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                }`}
                            >
                                <span className="text-xl shrink-0">{link.icon}</span>
                                {!sidebarCollapsed && <span className="whitespace-nowrap text-[11px] tracking-widest">{link.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800/60 bg-slate-950/20 shrink-0">
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full py-3 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                        {sidebarCollapsed ? "→" : "← Collapse"}
                    </button>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="flex-grow flex flex-col h-full overflow-hidden relative">
                
                {/* PERMANENT FIX HEADER - WILL NEVER FLASH */}
                <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between h-20 relative z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 border border-slate-200/60 rounded-xl">
                            <FiMenu size={22} />
                        </button>
                        
                        <nav className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {getBreadcrumbs().map((bc, idx, arr) => {
                                const isCurrent = idx === arr.length - 1;

                                return (
                                    <div key={`${bc.path}-${bc.label}-${idx}`} className="flex items-center gap-2">
                                        {idx > 0 && <span className="text-slate-300">/</span>}
                                        {isCurrent ? (
                                            <span className="text-slate-900 font-black">{bc.label}</span>
                                        ) : (
                                            <Link
                                                to={bc.path}
                                                className="hover:text-slate-600 transition-colors"
                                            >
                                                {bc.label}
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all">
                                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs border border-slate-800">
                                    {adminUser?.username?.substring(0, 2).toUpperCase() || "AD"}
                                </div>
                                <span className="hidden sm:inline text-xs font-black text-slate-800 uppercase tracking-wider pr-1 pl-0.5">{adminUser?.username || "Admin"}</span>
                                <FiChevronDown className="hidden sm:inline text-slate-400 text-xs mr-1" />
                            </button>

                            {profileDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-3 w-60 bg-white border border-slate-100 rounded-[2rem] shadow-2xl py-4 z-40 overflow-hidden">
                                        <div className="px-6 py-3 border-b border-slate-50 mb-2">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Signed in as</p>
                                            <p className="text-sm font-black text-slate-900 truncate mt-0.5">{adminUser?.username || "Platform Admin"}</p>
                                        </div>
                                        <button onClick={logout} className="w-full flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors text-left">
                                            <FiLogOut /> Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ONLY THIS AREA WILL SWITCH RE-RENDER */}
                <div className="flex-grow overflow-y-auto bg-white relative z-10">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet />
                    </Suspense>
                </div>
            </div>

            {/* MOBILE DRAWER */}
            {mobileOpen && (
                <>
                    <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden" />
                    <div className="fixed top-0 bottom-0 left-0 w-[280px] bg-slate-900 text-white z-50 p-6 flex flex-col lg:hidden shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-6 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black text-lg">B</div>
                                <span className="font-display font-extrabold text-lg tracking-tight text-white">BiharSeva</span>
                            </div>
                            <button onClick={() => setMobileOpen(false)} className="p-2 bg-slate-800 text-slate-400 rounded-xl"><FiX size={20} /></button>
                        </div>
                        <nav className="flex-1 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-400 hover:bg-slate-800"
                                >
                                    <span className="text-xl">{link.icon}</span>
                                    <span className="text-[11px]">{link.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </>
            )}
        </div>
    );
}
