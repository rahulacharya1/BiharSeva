import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCheck, FiMail } from "react-icons/fi";
import { adminApi } from "../api";

export function AdminNotificationBell({ adminUser }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await adminApi.get("/admin/notifications/");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [adminUser]);

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
      await adminApi.patch(`/admin/notifications/${id}/read/`);
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
      await adminApi.post("/admin/notifications/read-all/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  if (!adminUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 border border-slate-200 transition-all focus:outline-none"
        title="Admin Notifications"
      >
        <FiBell className="text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black px-1 border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Admin Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                >
                  <FiCheck className="text-xs" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-5 py-4 transition-colors hover:bg-slate-50 flex items-start gap-4 ${
                      !n.is_read ? "bg-emerald-50/20" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm shrink-0">
                      <FiMail />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 shrink-0"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-block text-[10px] font-bold text-emerald-600 hover:underline mt-1"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FiBell className="text-3xl mx-auto opacity-30" />
                  <p className="text-xs font-semibold">No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
