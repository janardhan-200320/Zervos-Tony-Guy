import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TicketCheck,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,
  Sparkles,
  Building2,
  Megaphone,
  Activity,
  Shield,
  HelpCircle,
  Command,
  Zap,
  Flag,
  DollarSign,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import { supabase } from '@/lib/superbase';
import { useToast } from '@/hooks/use-toast';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const [location, setLocation] = useLocation();
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    theme, 
    setTheme,
    searchQuery,
    setSearchQuery,
    stats,
    tickets,
  } = useSuperAdmin();
  const { toast } = useToast();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowNotifications(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigation = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/superadmin', 
      badge: null 
    },
    { 
      name: 'Clients', 
      icon: Users, 
      path: '/superadmin/clients', 
      badge: null 
    },
    { 
      name: 'Subscriptions', 
      icon: CreditCard, 
      path: '/superadmin/subscriptions', 
      badge: null 
    },
    { 
      name: 'Billing', 
      icon: DollarSign, 
      path: '/superadmin/billing', 
      badge: null 
    },
    { 
      name: 'Support Tickets', 
      icon: TicketCheck, 
      path: '/superadmin/tickets', 
      badge: tickets.filter(t => t.status === 'open').length || null
    },
    { 
      name: 'Revenue Analytics', 
      icon: BarChart3, 
      path: '/superadmin/analytics', 
      badge: null 
    },
    { 
      name: 'Real-Time Metrics', 
      icon: Gauge, 
      path: '/superadmin/metrics', 
      badge: null 
    },
    { 
      name: 'Feature Flags', 
      icon: Flag, 
      path: '/superadmin/features', 
      badge: null 
    },
    { 
      name: 'Announcements', 
      icon: Megaphone, 
      path: '/superadmin/announcements', 
      badge: null 
    },
    { 
      name: 'Activity Logs', 
      icon: Activity, 
      path: '/superadmin/activity', 
      badge: null 
    },
    { 
      name: 'System Settings', 
      icon: Settings, 
      path: '/superadmin/settings', 
      badge: null 
    },
  ];

  const isActive = (path: string) => {
    if (path === '/superadmin') {
      return location === '/superadmin';
    }
    return location.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('zervos_superadmin');
      await supabase.auth.signOut();
      toast({
        title: '👋 Logged out',
        description: 'You have been signed out successfully',
      });
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const pendingTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950' : 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30'}`}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 280,
          x: mobileSidebarOpen ? 0 : (window.innerWidth < 1024 ? -280 : 0),
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed left-0 top-0 h-full z-50 ${
          theme === 'dark' 
            ? 'bg-slate-900 border-r border-slate-800' 
            : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700'
        } shadow-2xl`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700/50">
          <Link href="/superadmin">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    <h1 className="font-bold text-white text-lg whitespace-nowrap">Super Admin</h1>
                    <p className="text-xs text-slate-400 whitespace-nowrap">Zervos Control Center</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-700 hidden lg:flex"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          <LayoutGroup>
            {navigation.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <motion.div
                    onMouseEnter={() => !sidebarCollapsed && setHoveredNav(item.path)}
                    onMouseLeave={() => setHoveredNav(null)}
                    className={`relative flex items-center ${
                      sidebarCollapsed ? 'justify-center' : 'gap-3'
                    } px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200`}
                  >
                    {/* Active background */}
                    {active && (
                      <motion.div
                        layoutId="superadmin-nav-active"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}

                    {/* Hover background */}
                    {!active && hoveredNav === item.path && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-700/50 rounded-xl"
                      />
                    )}

                    <span className="relative z-10">
                      <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                    </span>

                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`relative z-10 font-medium whitespace-nowrap ${
                            active ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Badge */}
                    {item.badge && !sidebarCollapsed && (
                      <Badge className="relative z-10 ml-auto bg-red-500 text-white text-xs px-2 py-0.5">
                        {item.badge}
                      </Badge>
                    )}

                    {/* Tooltip for collapsed sidebar */}
                    {sidebarCollapsed && hoveredNav === item.path && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute left-full ml-2 px-3 py-2 bg-slate-800 rounded-lg shadow-xl z-50 whitespace-nowrap"
                      >
                        <span className="text-white text-sm font-medium">{item.name}</span>
                        {item.badge && (
                          <Badge className="ml-2 bg-red-500 text-white text-xs">{item.badge}</Badge>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </LayoutGroup>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700/50">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} text-slate-400 hover:text-white hover:bg-slate-700 mb-2`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'
        }`}
      >
        {/* Top Header Bar */}
        <header className={`sticky top-0 z-30 h-16 ${
          theme === 'dark' 
            ? 'bg-slate-900/80 border-b border-slate-800' 
            : 'bg-white/80 border-b border-slate-200'
        } backdrop-blur-xl flex items-center justify-between px-4 lg:px-6`}>
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center relative">
              <div 
                onClick={() => setShowSearchModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Search anything...</span>
                <div className="flex items-center gap-1 ml-8 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                  <Command className="w-3 h-3" />
                  <span className="text-xs">K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 mr-4">
              <div className={`px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <span className="text-xs text-slate-500">Clients</span>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {stats.totalClients.toLocaleString()}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <span className="text-xs text-slate-500">Revenue</span>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  ₹{(stats.totalRevenue / 100000).toFixed(1)}L
                </p>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {pendingTickets > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingTickets}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 ${
                      theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
                    }`}
                  >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {pendingTickets > 0 ? (
                        <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <TicketCheck className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {pendingTickets} Pending Tickets
                              </p>
                              <p className="text-xs text-slate-500">Require your attention</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                    <Link href="/superadmin/tickets">
                      <div className="p-3 text-center border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                        <span className="text-sm text-purple-600 font-medium">View All Tickets →</span>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Admin Avatar */}
            <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl ${
              theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Super Admin
                </p>
                <p className="text-xs text-slate-500">Full Access</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Global Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
            onClick={() => setShowSearchModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clients, tickets, plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`flex-1 outline-none bg-transparent text-lg ${
                    theme === 'dark' ? 'text-white placeholder:text-slate-500' : 'text-slate-900'
                  }`}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearchModal(false)}
                  className="text-slate-400"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-500 mb-3">Quick Actions</p>
                <div className="space-y-1">
                  {[
                    { icon: Users, label: 'View All Clients', path: '/superadmin/clients' },
                    { icon: TicketCheck, label: 'Open Tickets', path: '/superadmin/tickets' },
                    { icon: CreditCard, label: 'Subscription Plans', path: '/superadmin/subscriptions' },
                    { icon: BarChart3, label: 'Revenue Analytics', path: '/superadmin/analytics' },
                  ].map((action) => (
                    <Link key={action.path} href={action.path}>
                      <div
                        onClick={() => setShowSearchModal(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${
                          theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                        }`}
                      >
                        <action.icon className="w-4 h-4 text-slate-400" />
                        <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                          {action.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminLayout;
