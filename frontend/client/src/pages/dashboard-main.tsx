import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardOverview from '@/components/DashboardOverview';
import AnimatedButton from '@/components/AnimatedButton';
import EmptyState from '@/components/EmptyState';
import { CardSkeleton } from '@/components/LoadingStates';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  Search,
  Download,
  Video,
  Share2,
  TrendingUp,
  DollarSign,
  Eye,
} from 'lucide-react';

type Tab = 'bookings' | 'sessions' | 'responses' | 'settings' | 'overview';
type BookingFilter = 'upcoming' | 'important' | 'recurring' | 'completed' | 'cancelled';

const DashboardMain = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const hasMountedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<BookingFilter>('completed');
  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailReminders: true,
    emailCancellations: true,
    smsBookings: false,
    smsReminders: true,
    smsCancellations: false,
  });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, [activeTab]);

  // Completed bookings data
  const completedBookings = [
    {
      id: 1,
      date: 'Tuesday, 05 Aug 2025',
      time: '07:00pm - 07:30pm',
      name: 'Ajay N',
      duration: '30 mins',
      platform: 'Google Meet',
      service: 'Science based Business Development Marketing',
    },
    {
      id: 2,
      date: 'Friday, 01 Aug 2025',
      time: '04:00pm - 04:30pm',
      name: 'Pragadeesh Gurumoorthy',
      duration: '30 mins',
      platform: 'Google Meet',
      service: 'Science based Business Development Marketing',
    },
    {
      id: 3,
      date: 'Friday, 25 Jul 2025',
      time: '11:00am - 11:30am',
      name: 'Kavya GR',
      duration: '30 mins',
      platform: 'Google Meet',
      service: 'Science based Business Development Marketing',
    },
  ];

  // Filter counts
  const filterCounts = {
    upcoming: 0,
    important: 1,
    recurring: 0,
    completed: 8,
    cancelled: 0,
  };

  const renderBookings = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Search and Export Section */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Product Title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/20 bg-white/80 px-11 py-3 text-sm text-slate-600 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.3)] transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <AnimatedButton
          variant="outline"
          size="md"
          className="justify-center border-white/20 bg-white/70 text-slate-700 hover:text-slate-900"
        >
          <Download size={16} />
          Export report
        </AnimatedButton>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content - Left Side (2 columns) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Filter Pills */}
          <motion.div 
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {(['upcoming', 'important', 'recurring', 'completed', 'cancelled'] as BookingFilter[]).map((filter, index) => (
              <motion.button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-lg shadow-brand-500/30'
                    : 'border border-white/30 bg-white/80 text-slate-600 hover:border-brand-200 hover:text-slate-900'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({filterCounts[filter]})
              </motion.button>
            ))}
          </motion.div>

          {/* Bookings List or Empty State */}
          <AnimatePresence mode="wait">
            {activeFilter === 'completed' && completedBookings.length > 0 ? (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {completedBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-[0_16px_40px_-25px_rgba(79,70,229,0.55)] transition-all duration-500 hover:-translate-y-1 hover:border-brand-200/80 hover:shadow-[0_20px_60px_-25px_rgba(99,102,241,0.55)]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                          <span className="font-medium">{booking.date}</span>
                          <Clock size={16} />
                          <span>{booking.time}</span>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-slate-900">
                          Booking with {booking.name} ({booking.duration})
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <Video size={16} className="text-emerald-500" />
                          <span className="font-medium text-slate-900">{booking.platform}</span>
                          <span>|</span>
                          <span>{booking.service}</span>
                        </div>
                      </div>
                      <AnimatedButton
                        variant="ghost"
                        size="sm"
                        className="text-slate-600"
                      >
                        Manage booking
                      </AnimatedButton>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
            /* Empty State */
            <EmptyState
              icon={CalendarIcon}
              title="No upcoming bookings"
              description="Your schedule is clear. Launch a campaign or share your booking link to fill the calendar with high-intent leads."
              action={{
                label: 'Create booking page',
                onClick: () => window.dispatchEvent(new CustomEvent('open-create-booking')),
              }}
              secondaryAction={{
                label: 'Share availability',
                onClick: () => window.dispatchEvent(new CustomEvent('share-booking')), 
              }}
            />
          )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Stats */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Profile Link Card */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            className="rounded-3xl border border-white/20 bg-white/80 p-5 shadow-lg shadow-slate-900/10 backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <motion.div 
                whileHover={{ rotate: 4 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-xl"
              >
                Z
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Primary link</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">superprofile.bio/bookings/pro-plan</p>
                <p className="mt-2 text-xs text-slate-500">Share this across your funnels to keep conversions flowing.</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <AnimatedButton
                    size="sm"
                    variant="secondary"
                    className="bg-white/80 text-slate-800 hover:bg-white"
                    onClick={() => window.open('https://superprofile.bio/bookings/pro-plan', '_blank')}
                  >
                    Preview page
                  </AnimatedButton>
                  <AnimatedButton
                    size="sm"
                    variant="outline"
                    className="border-white/40 text-slate-700 hover:border-brand-300"
                    onClick={() => navigator.clipboard.writeText('https://superprofile.bio/bookings/pro-plan').catch(() => {})}
                  >
                    Copy link
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {[
              { label: 'Total Bookings', value: '8', bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', icon: CalendarIcon, color: 'text-blue-600' },
              { label: 'Amount Earned', value: '₹3000', bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', icon: DollarSign, color: 'text-orange-600' },
              { label: 'Total views', value: '169', bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', icon: Eye, color: 'text-purple-600' },
              { label: 'Conversions', value: '4.1%', bg: 'from-pink-50 to-pink-100', border: 'border-pink-200', icon: TrendingUp, color: 'text-pink-600' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className={`cursor-pointer rounded-3xl border ${stat.border} bg-gradient-to-br ${stat.bg} p-4 shadow-lg shadow-slate-900/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={16} className={stat.color} />
                  <span className="text-xs text-gray-600 font-medium">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Share Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="rounded-3xl border border-white/20 bg-gradient-to-br from-white/85 via-white/70 to-brand-50/80 p-6 shadow-lg backdrop-blur"
          >
            <div className="mb-4 flex gap-4">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="flex h-20 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-brand-100 text-brand-600 shadow-lg"
              >
                <Users size={24} />
              </motion.div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-slate-900">Share your booking page</h3>
                <p className="text-sm text-slate-600">Amplify reach across socials, newsletters and automations.</p>
              </div>
            </div>
            <AnimatedButton className="w-full justify-center">
              Share now
            </AnimatedButton>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <CardSkeleton count={4} />
        </motion.div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'bookings':
        return renderBookings();
      case 'sessions':
        return <div className="p-6 text-gray-600">Sessions tab content (to be implemented)</div>;
      case 'responses':
        return <div className="p-6 text-gray-600">Responses tab content (to be implemented)</div>;
      case 'settings':
        return <div className="p-6 text-gray-600">Settings tab content (to be implemented)</div>;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between rounded-3xl border border-white/20 bg-white/10 px-4 py-2 shadow-inner backdrop-blur-xl sm:px-6"
        >
          <div className="flex items-center gap-3 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'bookings', label: 'Bookings' },
              { key: 'sessions', label: 'Sessions' },
              { key: 'responses', label: 'Responses' },
              { key: 'settings', label: 'Settings' },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as Tab)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.key && (
                  <motion.span
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-500 to-purple-600 shadow-lg"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          <AnimatedButton
            size="sm"
            variant="ghost"
            className="text-slate-200"
            onClick={() => window.dispatchEvent(new CustomEvent('share-booking'))}
          >
            <Share2 size={16} /> Share page
          </AnimatedButton>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (isLoading ? '-loading' : '-ready')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default DashboardMain;
