import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Server,
  Users,
  Zap,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  BarChart3,
  RefreshCw,
  Database,
  Cpu,
  HardDrive,
  MessageSquare,
  DollarSign,
  ShoppingCart,
  Calendar,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Circle,
  Play,
  Pause,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

interface LiveMetric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'time';
  icon: any;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

const RealTimeMetrics = () => {
  const { theme } = useSuperAdmin();
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('3');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated real-time metrics
  const [metrics, setMetrics] = useState<LiveMetric[]>([
    { id: 'active_users', label: 'Active Users', value: 2847, previousValue: 2823, icon: Users, color: 'blue', trend: 'up' },
    { id: 'requests_sec', label: 'Requests/sec', value: 1234, previousValue: 1198, icon: Zap, color: 'yellow', trend: 'up' },
    { id: 'revenue_today', label: 'Revenue Today', value: 4582.50, previousValue: 4250.00, format: 'currency', icon: DollarSign, color: 'green', trend: 'up' },
    { id: 'avg_response', label: 'Avg Response', value: 145, previousValue: 152, unit: 'ms', icon: Clock, color: 'purple', trend: 'down' },
    { id: 'error_rate', label: 'Error Rate', value: 0.12, previousValue: 0.15, format: 'percentage', icon: AlertTriangle, color: 'red', trend: 'down' },
    { id: 'uptime', label: 'Uptime', value: 99.98, previousValue: 99.98, format: 'percentage', icon: CheckCircle2, color: 'emerald', trend: 'stable' },
  ]);

  const [serverHealth, setServerHealth] = useState({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 78,
  });

  const [activityFeed, setActivityFeed] = useState([
    { id: 1, type: 'booking', message: 'New booking at Salon Elegance', time: '2s ago', icon: Calendar },
    { id: 2, type: 'payment', message: '$149 payment received', time: '5s ago', icon: DollarSign },
    { id: 3, type: 'signup', message: 'New client signup: Urban Fitness', time: '12s ago', icon: Users },
    { id: 4, type: 'message', message: 'Support ticket resolved #2847', time: '18s ago', icon: MessageSquare },
    { id: 5, type: 'order', message: 'POS order completed #ORD-4821', time: '25s ago', icon: ShoppingCart },
  ]);

  const [regionData] = useState([
    { region: 'North America', users: 1245, health: 'healthy' },
    { region: 'Europe', users: 892, health: 'healthy' },
    { region: 'Asia Pacific', users: 456, health: 'warning' },
    { region: 'South America', users: 254, health: 'healthy' },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        // Update metrics with random fluctuations
        setMetrics(prev => prev.map(metric => {
          const change = (Math.random() - 0.5) * (metric.value * 0.05);
          const newValue = Math.max(0, metric.value + change);
          const trend = newValue > metric.value ? 'up' : newValue < metric.value ? 'down' : 'stable';
          return {
            ...metric,
            previousValue: metric.value,
            value: metric.format === 'percentage' ? Math.min(100, newValue) : newValue,
            trend: trend as 'up' | 'down' | 'stable',
          };
        }));

        // Update server health
        setServerHealth(prev => ({
          cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.min(100, Math.max(0, prev.memory + (Math.random() - 0.5) * 5)),
          disk: Math.min(100, Math.max(0, prev.disk + (Math.random() - 0.5) * 2)),
          network: Math.min(100, Math.max(0, prev.network + (Math.random() - 0.5) * 15)),
        }));

        // Rotate activity feed
        setActivityFeed(prev => {
          const newActivities = [
            { id: Date.now(), type: ['booking', 'payment', 'signup', 'message', 'order'][Math.floor(Math.random() * 5)], message: getRandomActivity(), time: 'just now', icon: [Calendar, DollarSign, Users, MessageSquare, ShoppingCart][Math.floor(Math.random() * 5)] },
            ...prev.slice(0, 4),
          ];
          return newActivities;
        });

        setLastUpdate(new Date());
      }, parseInt(refreshInterval) * 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive, refreshInterval]);

  const getRandomActivity = () => {
    const activities = [
      'New booking at Wellness Spa',
      '$89 payment processed',
      'New client signup: Fresh Cuts',
      'Support ticket opened #2848',
      'POS order #ORD-4822 completed',
      'Appointment rescheduled',
      '$249 subscription renewed',
      'New staff added: John D.',
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  };

  const formatValue = (metric: LiveMetric) => {
    if (metric.format === 'currency') {
      return `$${metric.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (metric.format === 'percentage') {
      return `${metric.value.toFixed(2)}%`;
    }
    return `${Math.round(metric.value).toLocaleString()}${metric.unit ? ` ${metric.unit}` : ''}`;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getHealthColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isLive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <Activity className={`w-6 h-6 ${isLive ? 'text-green-600 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div>
              <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Real-Time Metrics
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isLive ? (
                  <>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-green-600 text-sm font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-500 text-sm">Paused</span>
                  </>
                )}
                <span className="text-slate-400 text-sm">• Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Refresh:</span>
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger className={`w-24 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1s</SelectItem>
                  <SelectItem value="3">3s</SelectItem>
                  <SelectItem value="5">5s</SelectItem>
                  <SelectItem value="10">10s</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={isLive ? 'default' : 'outline'}
              onClick={() => setIsLive(!isLive)}
              className={isLive ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isLive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isLive ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-4 overflow-hidden relative ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}>
                    <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
                  </div>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="mt-3">
                  <motion.p
                    key={metric.value}
                    initial={{ opacity: 0.5, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                  >
                    {formatValue(metric)}
                  </motion.p>
                  <p className="text-sm text-slate-500 mt-1">{metric.label}</p>
                </div>
                {/* Subtle animated background */}
                {isLive && metric.trend !== 'stable' && (
                  <motion.div
                    className={`absolute inset-0 ${metric.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}
                    initial={{ opacity: 0.1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  />
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Server Health */}
          <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <Server className="w-5 h-5 text-blue-600" />
                Server Health
              </h2>
              <Badge className={`${
                Object.values(serverHealth).every(v => v < 75) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {Object.values(serverHealth).every(v => v < 75) ? 'Healthy' : 'Warning'}
              </Badge>
            </div>
            <div className="space-y-4">
              {[
                { label: 'CPU', value: serverHealth.cpu, icon: Cpu },
                { label: 'Memory', value: serverHealth.memory, icon: HardDrive },
                { label: 'Disk', value: serverHealth.disk, icon: Database },
                { label: 'Network', value: serverHealth.network, icon: Wifi },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</span>
                    </div>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {Math.round(item.value)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getHealthColor(item.value)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Live Activity Feed */}
          <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <h2 className={`font-semibold flex items-center gap-2 mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Activity className="w-5 h-5 text-purple-600" />
              Live Activity
            </h2>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {activityFeed.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      index === 0 ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${
                      activity.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30' :
                      activity.type === 'booking' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      activity.type === 'signup' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      <activity.icon className={`w-3 h-3 ${
                        activity.type === 'payment' ? 'text-green-600' :
                        activity.type === 'booking' ? 'text-blue-600' :
                        activity.type === 'signup' ? 'text-purple-600' :
                        'text-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {activity.message}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{activity.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>

          {/* Regional Status */}
          <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <h2 className={`font-semibold flex items-center gap-2 mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Globe className="w-5 h-5 text-emerald-600" />
              Regional Status
            </h2>
            <div className="space-y-3">
              {regionData.map((region) => (
                <div
                  key={region.region}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Circle className={`w-2 h-2 ${
                        region.health === 'healthy' ? 'text-green-500 fill-green-500' :
                        region.health === 'warning' ? 'text-yellow-500 fill-yellow-500' :
                        'text-red-500 fill-red-500'
                      }`} />
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {region.region}
                      </span>
                    </div>
                    <Badge variant="outline">{region.users.toLocaleString()} users</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Bookings', value: '847', change: '+12%', up: true, icon: Calendar },
            { label: 'Messages Today', value: '3,241', change: '+8%', up: true, icon: MessageSquare },
            { label: 'API Calls (1h)', value: '245K', change: '-3%', up: false, icon: Zap },
            { label: 'Page Views', value: '12.4K', change: '+15%', up: true, icon: Eye },
          ].map((stat) => (
            <Card key={stat.label} className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <stat.icon className="w-5 h-5 text-slate-400" />
                <span className={`text-sm flex items-center gap-1 ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default RealTimeMetrics;
