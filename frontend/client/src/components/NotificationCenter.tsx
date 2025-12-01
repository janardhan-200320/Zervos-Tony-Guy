import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Settings, X, Calendar, DollarSign, Users, Package, Briefcase, Zap, AlertCircle, Info } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

const notificationIcons = {
  booking: Calendar,
  payment: DollarSign,
  customer: Users,
  inventory: Package,
  staff: Briefcase,
  workflow: Zap,
  system: Info,
};

const priorityColors = {
  low: 'text-blue-600 bg-blue-50',
  medium: 'text-orange-600 bg-orange-50',
  high: 'text-red-600 bg-red-50',
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    preferences,
    updatePreferences,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    }

    if (isOpen || showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, showSettings]);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSettings(false);
        }}
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </Button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && !showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        <CheckCheck size={14} className="mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSettings(true)}
                    >
                      <Settings size={16} />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Notification List */}
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell size={48} className="text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No notifications</p>
                  <p className="text-xs text-gray-500 text-center">
                    You're all caught up! We'll notify you when something important happens.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const Icon = notificationIcons[notification.type] || AlertCircle;
                    const priorityClass = notification.priority
                      ? priorityColors[notification.priority]
                      : 'text-blue-600 bg-blue-50';

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50/30' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${priorityClass}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <div className="flex items-center gap-1">
                                {notification.actionLabel && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationClick(notification);
                                    }}
                                  >
                                    {notification.actionLabel}
                                  </Button>
                                )}
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                  >
                                    <Check size={12} />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} className="mr-1" />
                  Clear all notifications
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notification Settings</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSettings(false);
                  setIsOpen(true);
                }}
              >
                <X size={16} />
              </Button>
            </div>

            {/* Settings */}
            <div className="p-4 space-y-4">
              {/* Master Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Enable Notifications</p>
                  <p className="text-xs text-gray-500">Turn all notifications on/off</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.enabled}
                    onChange={(e) => updatePreferences({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase">Notification Types</p>
                
                {[
                  { key: 'booking', label: 'Bookings', desc: 'New bookings, cancellations, reschedules' },
                  { key: 'payment', label: 'Payments', desc: 'Payment received, pending, failed' },
                  { key: 'customer', label: 'Customers', desc: 'New customers, updates, birthdays' },
                  { key: 'inventory', label: 'Inventory', desc: 'Low stock, out of stock alerts' },
                  { key: 'staff', label: 'Staff', desc: 'Schedule changes, requests' },
                  { key: 'workflow', label: 'Workflows', desc: 'Workflow executions, failures' },
                  { key: 'system', label: 'System', desc: 'System updates, maintenance' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[key as keyof typeof preferences] as boolean}
                        onChange={(e) => updatePreferences({ [key]: e.target.checked })}
                        disabled={!preferences.enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer disabled:opacity-50 disabled:cursor-not-allowed peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Advanced Settings */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase">Advanced</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sound</p>
                    <p className="text-xs text-gray-500">Play sound for notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.sound}
                      onChange={(e) => updatePreferences({ sound: e.target.checked })}
                      disabled={!preferences.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer disabled:opacity-50 disabled:cursor-not-allowed peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Desktop Notifications</p>
                    <p className="text-xs text-gray-500">Show browser notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.desktop}
                      onChange={(e) => updatePreferences({ desktop: e.target.checked })}
                      disabled={!preferences.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer disabled:opacity-50 disabled:cursor-not-allowed peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
