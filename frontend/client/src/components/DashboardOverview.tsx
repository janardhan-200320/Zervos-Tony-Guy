import { motion } from 'framer-motion';
import {
  Calendar,
  TrendingUp,
  Clock,
  Activity,
  AlertCircle,
  User,
  ArrowUpRight,
  Sparkles,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard, { StatsGrid } from './StatsCard';
import AnimatedButton from './AnimatedButton';

interface RecentActivity {
  id: string;
  customerName: string;
  service: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed';
}

const DashboardOverview = () => {
  const recentActivities: RecentActivity[] = [
    { id: '1', customerName: 'John Doe', service: 'Technical Interview', time: '2 hours ago', status: 'confirmed' },
    { id: '2', customerName: 'Jane Smith', service: 'HR Screening', time: '3 hours ago', status: 'pending' },
    { id: '3', customerName: 'Robert Brown', service: 'Final Round', time: '5 hours ago', status: 'completed' },
    { id: '4', customerName: 'Alice Johnson', service: 'Phone Screen', time: '1 day ago', status: 'confirmed' },
    { id: '5', customerName: 'Mike Wilson', service: 'Team Meeting', time: '1 day ago', status: 'completed' },
  ];

  // Weekly chart data (last 7 days)
  const weeklyData = [
    { day: 'Mon', bookings: 12 },
    { day: 'Tue', bookings: 18 },
    { day: 'Wed', bookings: 8 },
    { day: 'Thu', bookings: 15 },
    { day: 'Fri', bookings: 22 },
    { day: 'Sat', bookings: 6 },
    { day: 'Sun', bookings: 4 },
  ];

  const maxBookings = Math.max(...weeklyData.map(d => d.bookings));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-white/80 via-white/60 to-purple-50/40 p-8 shadow-xl backdrop-blur"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
              <Sparkles size={16} /> Momentum
            </div>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
              Stellar booking week, keep the pace going!
            </h2>
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              You are 12% ahead of last week. Automate follow-ups and share your booking page to convert the new traffic spike into confirmed sessions.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <AnimatedButton size="md">
                <ArrowUpRight size={16} /> Boost conversions
              </AnimatedButton>
              <AnimatedButton variant="outline" size="md" className="border-slate-200 text-slate-700">
                View automation recipes
              </AnimatedButton>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 18 }}
            className="relative w-full max-w-xs rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Weekly target</span>
              <span>68%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '68%' }}
                transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-600"
              />
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Confirmed slots</span>
                <span className="font-semibold text-slate-900">45 / 60</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Average rating</span>
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <Star size={14} className="text-amber-400" /> 4.9
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <StatsGrid>
        <StatsCard
          title="Today's Appointments"
          value={8}
          change="12% vs. yesterday"
          changeType="positive"
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="This Week's Bookings"
          value={85}
          change="+8 new registrants"
          changeType="positive"
          icon={Activity}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          delay={0.05}
        />
        <StatsCard
          title="Pending Confirmations"
          value={5}
          change="2 follow-ups needed"
          changeType="negative"
          icon={AlertCircle}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          delay={0.1}
        />
        <StatsCard
          title="Upcoming Appointments"
          value={23}
          change="Next 72 hours"
          changeType="neutral"
          icon={Clock}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          delay={0.15}
        />
      </StatsGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-white/40 bg-white/80 backdrop-blur lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900">Weekly bookings</CardTitle>
                <CardDescription>Performance across the last 7 days</CardDescription>
              </div>
              <AnimatedButton variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Detailed report
              </AnimatedButton>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end gap-3 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-6">
              {weeklyData.map((data, index) => (
                <motion.div
                  key={data.day}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${(data.bookings / maxBookings) * 100}%`, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05, type: 'spring', stiffness: 80, damping: 18 }}
                  className="relative flex-1"
                >
                  <motion.div
                    whileHover={{ scale: 1.03, translateY: -4 }}
                    className="h-full w-full rounded-t-2xl bg-gradient-to-t from-brand-500/80 via-brand-400 to-white"
                  />
                  <div className="mt-3 text-center text-xs font-semibold text-slate-500">{data.day}</div>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-lg"
                  >
                    {data.bookings}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/40 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-slate-900">Conversion funnel</CardTitle>
            <CardDescription>Top channel performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'Landing page visits', value: '1,240', percent: 100 },
              { label: 'Booking page views', value: '786', percent: 63 },
              { label: 'Form starts', value: '342', percent: 28 },
              { label: 'Confirmed meetings', value: '128', percent: 10 },
            ].map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>{item.label}</span>
                  <span className="text-slate-900">{item.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-600"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-white/40 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-slate-900">Recent activity</CardTitle>
            <CardDescription>Last five confirmed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/60 p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-purple-100 text-brand-600">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{activity.customerName}</p>
                    <p className="text-xs text-slate-500">{activity.service}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{activity.time}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-white/40 bg-gradient-to-br from-white/85 via-white/80 to-blue-50/70 backdrop-blur">
          <CardContent className="flex flex-col justify-between gap-6 p-6 md:flex-row">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Next appointment</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">John Doe — Technical interview</h3>
              <p className="mt-2 text-sm text-slate-600">Today at 3:00 PM · Google Meet · 30 minutes</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">Auto-reminders active</span>
                <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">Prep notes shared</span>
              </div>
            </div>
            <motion.div
              initial={{ rotate: -8, opacity: 0, y: 12 }}
              animate={{ rotate: 0, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative flex h-36 w-full max-w-xs flex-col justify-between rounded-2xl border border-white/40 bg-white/90 p-5 shadow-xl"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Smart assistant</span>
                <TrendingUp size={14} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Prep score</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">92%</p>
              </div>
              <AnimatedButton size="sm" className="w-full justify-center">
                Review call notes
              </AnimatedButton>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
