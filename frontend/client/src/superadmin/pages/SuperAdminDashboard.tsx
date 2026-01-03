import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  Users,
  CreditCard,
  TrendingUp,
  TicketCheck,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  UserPlus,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Zap,
  Calendar,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

const SuperAdminDashboard = () => {
  const { stats, clients, tickets, activityLogs, refreshData, theme } = useSuperAdmin();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    refreshData();
    setIsRefreshing(false);
  };

  const statsCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients.toLocaleString(),
      change: `+${stats.newClientsThisMonth}`,
      changeLabel: 'this month',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions.toLocaleString(),
      change: `${((stats.activeSubscriptions / stats.totalClients) * 100).toFixed(1)}%`,
      changeLabel: 'active rate',
      trend: 'up',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats.totalRevenue / 100000).toFixed(2)}L`,
      change: `+${stats.monthlyGrowth}%`,
      changeLabel: 'MoM growth',
      trend: 'up',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Pending Tickets',
      value: stats.pendingTickets.toString(),
      change: tickets.filter(t => t.priority === 'critical' || t.priority === 'high').length.toString(),
      changeLabel: 'high priority',
      trend: 'down',
      icon: TicketCheck,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  const quickActions = [
    { label: 'Add New Client', icon: UserPlus, path: '/superadmin/clients', color: 'bg-blue-500' },
    { label: 'View Tickets', icon: TicketCheck, path: '/superadmin/tickets', color: 'bg-orange-500' },
    { label: 'Analytics', icon: TrendingUp, path: '/superadmin/analytics', color: 'bg-purple-500' },
    { label: 'Settings', icon: Zap, path: '/superadmin/settings', color: 'bg-green-500' },
  ];

  const recentClients = clients.slice(0, 5);
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').slice(0, 5);
  const recentActivities = activityLogs.slice(0, 6);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'trial': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'inactive': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client': return Users;
      case 'ticket': return TicketCheck;
      case 'payment': return DollarSign;
      case 'plan': return CreditCard;
      default: return Activity;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Welcome back, Super Admin! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Here's what's happening with Zervos today.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text' }} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span className="font-medium">{stat.change}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stat.value}
                  </h3>
                  <p className="text-slate-500 text-sm">{stat.title}</p>
                </div>
                <p className="text-xs text-slate-400 mt-2">{stat.changeLabel}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.path}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${action.color}`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {action.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Clients */}
          <Card className={`col-span-1 lg:col-span-2 p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Recent Clients
              </h3>
              <Link href="/superadmin/clients">
                <Button variant="ghost" size="sm" className="text-purple-600">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    theme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                  } transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold`}>
                      {client.businessName.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {client.businessName}
                      </p>
                      <p className="text-sm text-slate-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(client.status)} capitalize`}>
                      {client.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {client.plan}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Open Tickets */}
          <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Open Tickets
              </h3>
              <Link href="/superadmin/tickets">
                <Button variant="ghost" size="sm" className="text-purple-600">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {openTickets.length > 0 ? (
                openTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-xl ${
                      theme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                    } transition-all cursor-pointer`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {ticket.subject}
                        </p>
                        <p className="text-sm text-slate-500 truncate">{ticket.clientName}</p>
                      </div>
                      <Badge className={`${getPriorityColor(ticket.priority)} capitalize text-xs`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                    All tickets resolved!
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Activity Timeline & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Timeline */}
          <Card className={`col-span-1 lg:col-span-2 p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Recent Activity
              </h3>
              <Link href="/superadmin/activity">
                <Button variant="ghost" size="sm" className="text-purple-600">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.entityType);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`p-2 rounded-full ${
                      activity.entityType === 'payment' ? 'bg-green-100 dark:bg-green-900/30' :
                      activity.entityType === 'ticket' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      activity.entityType === 'client' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        activity.entityType === 'payment' ? 'text-green-600' :
                        activity.entityType === 'ticket' ? 'text-orange-600' :
                        activity.entityType === 'client' ? 'text-blue-600' :
                        'text-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{activity.userEmail}</span>
                        <span>•</span>
                        <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Avg. Revenue/Client
                  </span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    ₹{stats.avgRevenuePerClient.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-600">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                </div>
              </div>

              <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Churn Rate
                  </span>
                  <span className={`font-bold text-green-600`}>
                    {stats.churnRate}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-600">
                  <div className="h-full w-[10%] rounded-full bg-green-500" />
                </div>
              </div>

              <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Monthly Growth
                  </span>
                  <span className={`font-bold text-purple-600`}>
                    +{stats.monthlyGrowth}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-600">
                  <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 border-dashed ${
                theme === 'dark' ? 'border-slate-600' : 'border-slate-200'
              }`}>
                <div className="text-center">
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    New Clients This Month
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stats.newClientsThisMonth}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
