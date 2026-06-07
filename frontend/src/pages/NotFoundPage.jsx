import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSEO } from "../hooks/useSEO";

export function NotFoundPage() {
  useSEO({ title: "Page Not Found", description: "The page you are looking for does not exist.", noIndex: true });
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-lg w-full text-center space-y-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-[10rem] md:text-[14rem] font-bold text-slate-100 leading-none select-none">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 -mt-16 relative z-10"
        >
          <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            Page not found
          </h2>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link
            to="/"
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-xl"
          >
            Go Home
          </Link>
          <Link
            to="/report-issue"
            className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
          >
            Report Issue
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
