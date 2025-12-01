import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle, Calendar, FileText, ShoppingCart, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';

type Category = 'all' | 'bookings' | 'invoices' | 'pos' | 'system';

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  category: Exclude<Category, 'all'>;
  path?: string;
  date: string; // ISO
  read?: boolean;
};

const STORAGE_KEY = 'zervos_notifications_v1';

function loadNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NotificationItem[];
  } catch (e) {
    console.error('Failed to load notifications', e);
    return [];
  }
}

function saveNotifications(items: NotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Dispatch event for notification popup
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: items }));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

// Export helper to add notification from anywhere in the app
export function addNotification(notification: Omit<NotificationItem, 'id' | 'date'>) {
  const newNotification: NotificationItem = {
    ...notification,
    id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    read: false,
  };
  
  const current = loadNotifications();
  const updated = [newNotification, ...current];
  saveNotifications(updated);
  
  // Dispatch custom event for immediate popup
  window.dispatchEvent(new CustomEvent('new-notification', { detail: newNotification }));
  
  return newNotification;
}

function sampleNotifications(): NotificationItem[] {
  const now = new Date();
  return [
    {
      id: 'n1',
      title: 'New booking: Beard Design',
      body: 'Vaishak booked Beard Design at 10:00 AM',
      category: 'bookings',
      path: '/dashboard/appointments',
      date: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'n2',
      title: 'Invoice paid',
      body: 'Invoice INV-20251106-001 was paid',
      category: 'invoices',
      path: '/dashboard/invoices',
      date: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'n3',
      title: 'In-person sale recorded',
      body: 'POS sale POS-20251107-001 recorded',
      category: 'pos',
      path: '/dashboard/pos',
      date: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
}

export default function NotificationDropdown() {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const loaded = loadNotifications();
    if (loaded.length === 0) {
      const samples = sampleNotifications();
      saveNotifications(samples);
      return samples;
    }
    return loaded;
  });

  const [filter, setFilter] = useState<Category>('all');

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications.slice().sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return notifications.filter(n => n.category === filter).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [notifications, filter]);

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const addNotification = (n: NotificationItem) => setNotifications(prev => [n, ...prev]);

  const handleClickNotification = (n: NotificationItem) => {
    markRead(n.id);
    setOpen(false);
    if (n.path) setLocation(n.path);
  };

  const clearAll = () => { setNotifications([]); };

  const iconFor = (c: NotificationItem['category']) => {
    switch (c) {
      case 'bookings': return <Calendar size={16} />;
      case 'invoices': return <FileText size={16} />;
      case 'pos': return <ShoppingCart size={16} />;
      default: return <CheckCircle size={16} />;
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notifications"
        className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
      >
        <motion.div
          animate={{ rotate: open ? [0, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Bell size={18} />
        </motion.div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="absolute right-0 top-full mt-2 w-96 rounded-lg border bg-white shadow-lg z-50 origin-top-right"
            role="dialog"
            aria-label="Notifications panel"
          >
            {/* caret */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute right-4 -top-2 h-3 w-3 bg-white rotate-45 shadow-sm border-l border-t"
              aria-hidden
            />

            <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex gap-2">
              <button onClick={() => setFilter('all')} className={`text-xs px-2 py-1 rounded ${filter==='all' ? 'bg-slate-100' : ''}`}>All</button>
              <button onClick={() => setFilter('bookings')} className={`text-xs px-2 py-1 rounded ${filter==='bookings' ? 'bg-slate-100' : ''}`}>Bookings</button>
              <button onClick={() => setFilter('invoices')} className={`text-xs px-2 py-1 rounded ${filter==='invoices' ? 'bg-slate-100' : ''}`}>Invoices</button>
              <button onClick={() => setFilter('pos')} className={`text-xs px-2 py-1 rounded ${filter==='pos' ? 'bg-slate-100' : ''}`}>POS</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={markAllRead} className="text-sm text-slate-500">Mark all read</button>
              <button onClick={clearAll} className="text-sm text-red-500">Clear</button>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-500"><X size={14} /></button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No notifications</div>
            ) : filtered.map(n => (
              <div key={n.id} className={`flex items-start gap-3 px-3 py-3 hover:bg-slate-50 cursor-pointer ${n.read ? '' : 'bg-slate-50'}`} onClick={() => handleClickNotification(n)}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">{iconFor(n.category)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-slate-400">{new Date(n.date).toLocaleString()}</div>
                  </div>
                  {n.body && <div className="text-sm text-slate-500 mt-1">{n.body}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t px-3 py-2 text-sm text-slate-500">Showing {filtered.length} notification(s)</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
