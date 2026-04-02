import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Zap, MessageSquare, Users, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Notif {
  id: number;
  type: 'task_assigned' | 'message';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  roadmap_id?: number | null;
  task_id?: number | null;
}

const ICONS: Record<string, React.ReactNode> = {
  task_assigned: <Zap className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
};

export function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);

  const fetchNotifications = async () => {
    try {
      const data: Notif[] = await api.get('/api/notifications', token);
      setNotifications(data);

      // Show toasts for brand-new notifications (skip on first page load)
      if (!isFirstLoad.current) {
        for (const n of data) {
          if (!knownIds.current.has(n.id) && !n.read) {
            toast(n.body, {
              icon: n.type === 'task_assigned' ? '⚡' : n.title.includes('Project') ? '🏗️' : '💬',
              duration: 5000,
              style: {
                borderLeft: `4px solid ${n.type === 'task_assigned' ? '#6366f1' : '#10b981'}`,
                fontWeight: '500',
                fontSize: '13px',
              },
            });
          }
          knownIds.current.add(n.id);
        }
      } else {
        // Seed known IDs on first load so existing notifications don't toast
        data.forEach(n => knownIds.current.add(n.id));
        isFirstLoad.current = false;
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [token]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`, {}, token);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all', {}, token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };
  
  const deleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`, token);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    } catch { toast.error('Failed to delete'); }
  };
  
  const clearAllNotifications = async () => {
    try {
      await api.delete('/api/notifications', token);
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch { toast.error('Failed to clear'); }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead}
                      className="flex items-center gap-1 text-white/80 hover:text-white text-[11px] font-bold transition-colors">
                      <CheckCheck className="w-3.5 h-3.5" />
                      Read
                    </button>
                  )}
                  <button onClick={clearAllNotifications}
                    className="flex items-center gap-1 text-white/80 hover:text-white text-[11px] font-bold transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-indigo-50/50' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === 'task_assigned'
                        ? 'bg-violet-100 text-violet-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {n.type === 'task_assigned' ? <Zap className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-gray-800 truncate ${!n.read ? 'text-indigo-900' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-2 shrink-0 self-center">
                      {!n.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}
                      <button 
                        onClick={(e) => deleteNotification(e, n.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
