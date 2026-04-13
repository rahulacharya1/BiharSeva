import { motion, AnimatePresence } from "framer-motion";

export function PageTransition({ pageKey, children }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pageKey}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for premium smoothness
                }}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
