import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCalendar, FiUsers, FiAward, FiUserPlus, FiFileText, FiUser, FiArrowRight } from "react-icons/fi";
import { useSEO } from "../../hooks/useSEO";

export function CollegeDashboardPage({ adminUser, onLogout }) {
  useSEO({ title: "College Dashboard", description: "College administration dashboard — overview of volunteers, events, reports, and certificates.", keywords: "college dashboard, admin", noIndex: true });

  const collegeModules = [
      { 
          title: "Manage Events", 
          path: "/college/events", 
          description: "NSS events create, edit aur manage karein.",
          icon: <FiCalendar />, 
          color: "text-blue-600", 
          bg: "bg-blue-50" 
      },
      { 
          title: "Manage Volunteers", 
          path: "/college/volunteers", 
          description: "College ke registered volunteers verify aur manage karein.",
          icon: <FiUsers />, 
          color: "text-emerald-600", 
          bg: "bg-emerald-50" 
      },
      { 
          title: "Manage Reports", 
          path: "/college/reports", 
          description: "Assigned civic reports review aur update karein.",
          icon: <FiFileText />, 
          color: "text-amber-600", 
          bg: "bg-amber-50" 
      },
      { 
          title: "Manage Certificates", 
          path: "/college/certificates", 
          description: "Volunteer participation certificates issue karein.",
          icon: <FiAward />, 
          color: "text-purple-600", 
          bg: "bg-purple-50" 
      },
      { 
          title: "Program Officers", 
          path: "/college/program-officers", 
          description: "NSS program officers handle karein.",
          icon: <FiUserPlus />, 
          color: "text-indigo-600", 
          bg: "bg-indigo-50" 
      },
      { 
          title: "College Profile", 
          path: "/college/profile", 
          description: "College details aur settings update karein.",
          icon: <FiUser />, 
          color: "text-slate-600", 
          bg: "bg-slate-50" 
      },
  ];

  return (
      <div className="w-full min-h-full bg-white pb-24">
          {/* HERO BAR AREA */}
          <div className="relative bg-slate-900 pb-48 pt-16 md:pt-24 overflow-hidden text-center rounded-b-[3rem] lg:rounded-none">
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
                      College Administrator
                  </span>
                  <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                      Control <span className="text-slate-500 font-black">Center.</span>
                  </h1>
                  {adminUser?.admin_college_name && (
                    <p className="mt-4 text-slate-400 font-medium max-w-xl mx-auto">
                      Managing NSS operations for <span className="text-emerald-400 font-bold">{adminUser.admin_college_name}</span>
                    </p>
                  )}
              </div>
          </div>

          {/* CONTROLS BOX OVERLAP */}
          <section className="max-w-6xl mx-auto px-6 -mt-32 relative z-20">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collegeModules.map((module) => (
                      <motion.div
                          key={module.path}
                          whileHover={{ y: -4 }}
                          className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-200 group flex flex-col justify-between min-h-[260px]"
                      >
                          <div className="space-y-6">
                              <div className={`w-14 h-14 ${module.bg} ${module.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform`}>
                                  {module.icon}
                              </div>
                              <div className="space-y-2">
                                  <h2 className="text-xl font-display font-bold text-slate-900">{module.title}</h2>
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
