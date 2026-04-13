import { motion } from "framer-motion";

export function SectionHero({ eyebrow, title, description, tone = "default" }) {
    // Tone-based accents (Optional: Agar aap unique colors use karna chahein)
    const toneStyles = {
        default: "text-emerald-600",
        warning: "text-red-600",
        civic: "text-blue-600",
        clean: "text-teal-600",
        trust: "text-indigo-600",
    };

    return (
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            {/* Eyebrow Label */}
            {eyebrow && (
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 shadow-sm"
                >
                    {/* BiharSeva Identity Pulse (Emerald by default) */}
                    <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tone === 'warning' ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${tone === 'warning' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    </span>
                    {eyebrow}
                </motion.span>
            )}

            {/* Main Title */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Title prop can be a string or JSX (useful for colored spans) */}
                <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                    {title}
                </h1>
            </motion.div>

            {/* Description */}
            {description && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed italic"
                >
                    {description}
                </motion.p>
            )}
        </div>
    );
}
