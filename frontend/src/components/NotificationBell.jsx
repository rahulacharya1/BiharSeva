import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCheck, FiMail, FiTrash2 } from "react-icons/fi";
import { FaGraduationCap, FaAward, FaShieldAlt, FaBell } from "react-icons/fa";
import { api } from "../api";

export function NotificationBell({ volunteer }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (volunteer) {
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [volunteer]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read/`);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  if (!volunteer) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100/80 flex items-center justify-center text-slate-500 hover:text-slate-900 border border-slate-100 hover:border-slate-200 transition-all focus:outline-none"
        title="Notifications"
      >
        <FiBell className={`text-lg ${unreadCount > 0 ? "animate-swing" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black px-1 border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  <FiCheck className="text-xs" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id);
                    }}
                    className={`p-4 hover:bg-slate-50/80 cursor-pointer transition-colors relative flex items-start gap-3 ${
                      !n.is_read ? "bg-emerald-50/20" : ""
                    }`}
                  >
                    {/* Read indicator dot */}
                    {!n.is_read && (
                      <span className="absolute left-2.5 top-5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    )}

                    {/* Icon mapping */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          n.type === "certificate"
                            ? "bg-amber-100 text-amber-700"
                            : n.type === "badge"
                            ? "bg-indigo-100 text-indigo-700"
                            : n.type === "verification"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {n.type === "certificate" ? (
                          <FaGraduationCap />
                        ) : n.type === "badge" ? (
                          <FaAward />
                        ) : n.type === "verification" ? (
                          <FaShieldAlt />
                        ) : (
                          <FaBell />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1.5">
                        {new Date(n.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center text-slate-400">
                  <FiBell className="text-3xl mb-2 opacity-50" />
                  <p className="text-xs font-medium">No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
