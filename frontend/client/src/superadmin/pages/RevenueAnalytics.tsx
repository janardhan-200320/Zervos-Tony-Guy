import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PieChart,
  Download,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

const RevenueAnalytics = () => {
  const { stats, clients, plans, theme } = useSuperAdmin();
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedPlan, setSelectedPlan] = useState('all');

  // Calculate revenue metrics
  const activeClients = clients.filter(c => c.status === 'active');
  const totalMRR = activeClients.reduce((sum, c) => sum + c.monthlyRevenue, 0);
  const totalARR = totalMRR * 12;
  const avgRevenuePerClient = activeClients.length > 0 ? totalMRR / activeClients.length : 0;
  
  // Revenue by plan
  const revenueByPlan = plans.map(plan => {
    const planClients = activeClients.filter(c => c.plan === plan.id);
    const revenue = planClients.reduce((sum, c) => sum + c.monthlyRevenue, 0);
    return {
      ...plan,
      clients: planClients.length,
      revenue,
      percentage: totalMRR > 0 ? (revenue / totalMRR) * 100 : 0,
    };
  });

  // Mock monthly data for charts
  const monthlyData = [
    { month: 'Jul', revenue: 3200000, clients: 1100, newClients: 65 },
    { month: 'Aug', revenue: 3450000, clients: 1130, newClients: 72 },
    { month: 'Sep', revenue: 3680000, clients: 1165, newClients: 68 },
    { month: 'Oct', revenue: 3920000, clients: 1190, newClients: 75 },
    { month: 'Nov', revenue: 4250000, clients: 1220, newClients: 82 },
    { month: 'Dec', revenue: 4567890, clients: 1247, newClients: 89 },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  const topClients = [...clients]
    .filter(c => c.status === 'active')
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 5);

  const metrics = [
    {
      title: 'Monthly Recurring Revenue',
      value: `₹${(totalMRR / 100000).toFixed(2)}L`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'purple',
    },
    {
      title: 'Annual Recurring Revenue',
      value: `₹${(totalARR / 10000000).toFixed(2)}Cr`,
      change: '+15.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Average Revenue Per Client',
      value: `₹${avgRevenuePerClient.toFixed(0)}`,
      change: '+8.3%',
      trend: 'up',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Churn Rate',
      value: `${stats.churnRate}%`,
      change: '-0.5%',
      trend: 'down',
      icon: TrendingDown,
      color: 'orange',
    },
  ];

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'classic': return 'from-slate-500 to-slate-700';
      case 'pro': return 'from-blue-500 to-blue-700';
      case 'elite': return 'from-purple-500 to-purple-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Revenue Analytics
            </h1>
            <p className="text-slate-500 mt-1">
              Track revenue, growth, and financial performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className={`w-40 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}>
                    <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-orange-500'}`}>
                    {metric.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span className="font-medium">{metric.change}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {metric.value}
                  </h3>
                  <p className="text-slate-500 text-sm">{metric.title}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className={`col-span-2 p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Revenue Trend
              </h3>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +42.8% growth
              </Badge>
            </div>
            
            {/* Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyData.map((data, index) => (
                <motion.div
                  key={data.month}
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex-1 flex flex-col items-center"
                >
                  <div 
                    className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-blue-500 relative group cursor-pointer"
                    style={{ height: '100%' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={`px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap ${
                        theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'
                      }`}>
                        <p className="font-semibold">₹{(data.revenue / 100000).toFixed(2)}L</p>
                        <p className="text-slate-400">{data.clients} clients</p>
                      </div>
                    </div>
                  </div>
                  <span className={`mt-2 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {data.month}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Revenue by Plan */}
          <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Revenue by Plan
            </h3>
            <div className="space-y-4">
              {revenueByPlan.map((plan) => (
                <div key={plan.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`bg-gradient-to-r ${getPlanGradient(plan.id)} text-white`}>
                        {plan.name}
                      </Badge>
                    </div>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      ₹{(plan.revenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${plan.percentage}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full bg-gradient-to-r ${getPlanGradient(plan.id)}`}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">
                      {plan.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {plan.clients} subscribers
                  </p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className={`mt-6 pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total MRR</span>
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  ₹{(totalMRR / 100000).toFixed(2)}L
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clients */}
          <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Top Revenue Clients
            </h3>
            <div className="space-y-3">
              {topClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-slate-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-slate-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {client.businessName}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{client.plan} Plan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      ₹{client.monthlyRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">/month</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Growth Metrics */}
          <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Growth Metrics
            </h3>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex items-center gap-4">
                  <div className={`w-12 text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {data.month}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">New Clients</span>
                      <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        +{data.newClients}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.newClients / 100) * 100}%` }}
                        transition={{ delay: index * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {data.clients}
                    </span>
                    <p className="text-xs text-slate-500">total</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Net Growth */}
            <div className={`mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200 dark:border-green-800`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-400">Net Client Growth (6M)</p>
                  <p className={`text-2xl font-bold text-green-600`}>
                    +{monthlyData.reduce((sum, d) => sum + d.newClients, 0)} clients
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default RevenueAnalytics;
