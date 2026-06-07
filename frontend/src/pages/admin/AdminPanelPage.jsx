import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPlusCircle, FiLayers, FiArrowRight } from "react-icons/fi";
import { useSEO } from "../../hooks/useSEO";

export function AdminPanelPage() {
  useSEO({ title: "Admin Panel", description: "BiharSeva platform administration panel. Manage colleges, volunteers, and settings.", keywords: "admin panel, administration", noIndex: true });
    const adminModules = [
        { 
            title: "Add New College", 
            path: "/admin/colleges/add", 
            description: "System mein naye college aur unke master operational credentials onboard karein.",
            icon: <FiPlusCircle />, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50" 
        },
        { 
            title: "View College Registry", 
            path: "/admin/colleges", 
            description: "Linked institutions ki registry track karein aur database entities handle karein.",
            icon: <FiLayers />, 
            color: "text-blue-600", 
            bg: "bg-blue-50" 
        },
    ];

    return (
        <div className="w-full min-h-full bg-white pb-24">
            {/* HERO BAR AREA */}
            <div className="relative bg-slate-900 pb-48 pt-24 overflow-hidden text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[-5%] w-[30%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Platform Administrator
                    </span>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        Control <span className="text-slate-500 font-black">Center.</span>
                    </h1>
                </div>
            </div>

            {/* CONTROLS BOX OVERLAP */}
            <section className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
                <div className="grid md:grid-cols-2 gap-8">
                    {adminModules.map((module) => (
                        <motion.div
                            key={module.path}
                            whileHover={{ y: -4 }}
                            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-200 group flex flex-col justify-between min-h-[280px]"
                        >
                            <div className="space-y-6">
                                <div className={`w-14 h-14 ${module.bg} ${module.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform`}>
                                    {module.icon}
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-display font-bold text-slate-900">{module.title}</h2>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{module.description}</p>
                                </div>
                            </div>
                            
                            <Link to={module.path} className="pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                                <span>Proceed to Action</span>
                                <FiArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}
