import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Calendar, FileText, ShoppingCart, CheckCircle, X } from 'lucide-react';

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  category: 'bookings' | 'invoices' | 'pos' | 'system';
  path?: string;
  date: string;
  read?: boolean;
};

type PopupNotification = NotificationItem & {
  popupId: string;
};

const STORAGE_KEY = 'zervos_notifications_v1';
let lastNotificationCount = 0;

// Beep sound generator (fallback if audio file not available)
function playNotificationSound() {
  try {
    // Try to play a custom notification sound
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Fallback to system beep using Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    });
  } catch (e) {
    console.error('Failed to play notification sound', e);
  }
}

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

export default function NotificationPopup() {
  const [popupQueue, setPopupQueue] = useState<PopupNotification[]>([]);

  useEffect(() => {
    // Initialize last count
    const initial = loadNotifications();
    lastNotificationCount = initial.length;

    // Check for new notifications periodically
    const checkInterval = setInterval(() => {
      const current = loadNotifications();
      const currentCount = current.length;

      if (currentCount > lastNotificationCount) {
        // New notification(s) detected
        const newNotifications = current.slice(0, currentCount - lastNotificationCount);
        
        // Add to popup queue with unique popup IDs
        const popups = newNotifications.map((n, idx) => ({
          ...n,
          popupId: `popup-${Date.now()}-${idx}`,
        }));

        setPopupQueue(prev => [...popups, ...prev]);
        
        // Play notification sound
        playNotificationSound();
      }

      lastNotificationCount = currentCount;
    }, 1000); // Check every second

    // Listen for custom event for immediate notification
    const handleNewNotification = ((e: CustomEvent<NotificationItem>) => {
      const notification = e.detail;
      const popup: PopupNotification = {
        ...notification,
        popupId: `popup-${Date.now()}`,
      };
      
      setPopupQueue(prev => [popup, ...prev]);
      playNotificationSound();
      lastNotificationCount++;
    }) as EventListener;

    window.addEventListener('new-notification', handleNewNotification);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('new-notification', handleNewNotification);
    };
  }, []);

  const removePopup = (popupId: string) => {
    setPopupQueue(prev => prev.filter(p => p.popupId !== popupId));
  };

  const iconFor = (category: NotificationItem['category']) => {
    switch (category) {
      case 'bookings': return <Calendar size={18} className="text-blue-600" />;
      case 'invoices': return <FileText size={18} className="text-green-600" />;
      case 'pos': return <ShoppingCart size={18} className="text-purple-600" />;
      default: return <CheckCircle size={18} className="text-slate-600" />;
    }
  };

  const categoryColor = (category: NotificationItem['category']) => {
    switch (category) {
      case 'bookings': return 'bg-blue-50 border-blue-200';
      case 'invoices': return 'bg-green-50 border-green-200';
      case 'pos': return 'bg-purple-50 border-purple-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {popupQueue.slice(0, 5).map((notification, index) => (
          <motion.div
            key={notification.popupId}
            initial={{ opacity: 0, x: 400, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto"
            style={{ zIndex: 100 - index }}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -2, 2, -2, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`w-96 rounded-lg border-2 shadow-xl ${categoryColor(notification.category)} backdrop-blur-sm`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
                  >
                    {iconFor(notification.category)}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.15 }}
                        >
                          <Bell size={14} className="text-slate-400" />
                        </motion.div>
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          {notification.category}
                        </span>
                      </div>
                      <button
                        onClick={() => removePopup(notification.popupId)}
                        className="flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X size={14} className="text-slate-400" />
                      </button>
                    </div>

                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="font-semibold text-slate-900 mt-1"
                    >
                      {notification.title}
                    </motion.h3>

                    {notification.body && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-sm text-slate-600 mt-1"
                      >
                        {notification.body}
                      </motion.p>
                    )}

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-2 mt-2 text-xs text-slate-400"
                    >
                      <span>Just now</span>
                    </motion.div>
                  </div>
                </div>

                {/* Auto-dismiss progress bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 5, ease: "linear" }}
                  onAnimationComplete={() => removePopup(notification.popupId)}
                  className="h-1 bg-slate-300 rounded-full mt-3 origin-left"
                />
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
