import { motion, AnimatePresence } from "framer-motion";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";

/**
 * ConfirmDialog — Modal confirmation for destructive actions.
 *
 * @param {boolean} open - Whether the dialog is visible
 * @param {() => void} onClose - Called when the user cancels
 * @param {() => void} onConfirm - Called when the user confirms
 * @param {string} [title] - Dialog title
 * @param {string} [message] - Dialog body text
 * @param {string} [confirmLabel] - Confirm button text
 * @param {"danger" | "warning"} [variant] - Visual variant
 * @param {boolean} [loading] - Whether the confirm action is in progress
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  variant = "danger",
  loading = false,
}) {
  const colors = {
    danger: {
      bg: "bg-red-600 hover:bg-red-500",
      icon: FaTrash,
      iconBg: "bg-red-50 text-red-600",
      ring: "focus:ring-red-200",
    },
    warning: {
      bg: "bg-amber-600 hover:bg-amber-500",
      icon: FaExclamationTriangle,
      iconBg: "bg-amber-50 text-amber-600",
      ring: "focus:ring-amber-200",
    },
  };

  const style = colors[variant] || colors.danger;
  const IconComponent = style.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center">
                <div className={`w-16 h-16 ${style.iconBg} rounded-2xl flex items-center justify-center text-2xl`}>
                  <IconComponent />
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 py-3.5 px-6 rounded-2xl ${style.bg} text-white font-bold text-sm transition-all active:scale-95 ${style.ring} focus:ring-2 focus:outline-none disabled:opacity-60 flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
