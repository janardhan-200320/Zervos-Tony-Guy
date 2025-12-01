import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'customer' | 'inventory' | 'staff' | 'system' | 'workflow';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: {
    bookingId?: string;
    customerId?: string;
    amount?: number;
    productId?: string;
    workflowId?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

interface NotificationPreferences {
  enabled: boolean;
  booking: boolean;
  payment: boolean;
  customer: boolean;
  inventory: boolean;
  staff: boolean;
  system: boolean;
  workflow: boolean;
  sound: boolean;
  desktop: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  booking: true,
  payment: true,
  customer: true,
  inventory: true,
  staff: true,
  system: true,
  workflow: true,
  sound: true,
  desktop: false,
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Load notifications and preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zervos_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
      } catch (error) {
        console.error('Failed to parse notifications:', error);
      }
    }

    const savedPrefs = localStorage.getItem('zervos_notification_preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Failed to parse preferences:', error);
      }
    }

    // Request desktop notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('zervos_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('zervos_notification_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Check if notifications are enabled and type-specific preference
    if (!preferences.enabled || !preferences[notification.type as keyof NotificationPreferences]) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Play sound
    if (preferences.sound) {
      playNotificationSound();
    }

    // Show desktop notification
    if (preferences.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        tag: newNotification.id,
      });
    }
  }, [preferences]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    preferences,
    updatePreferences,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Utility function to play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore errors (e.g., user hasn't interacted with page yet)
    });
  } catch (error) {
    // Ignore sound errors
  }
}
