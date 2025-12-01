import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Award,
  Calendar,
  Filter,
  Download,
  Star,
  ShoppingCart,
  Clock,
  BarChart3,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  joinDate?: string;
}

interface Transaction {
  id: string;
  date: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    assignedPerson?: string;
  }>;
  amount: number;
  staff?: string;
  paymentMethod: string;
}

interface StaffKPI {
  staffName: string;
  totalSales: number;
  totalTransactions: number;
  totalServices: number;
  averageTransactionValue: number;
  totalRevenue: number;
  commission: number;
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

export default function StaffKPIPage() {
  const { selectedWorkspace } = useWorkspace();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterPeriod, setFilterPeriod] = useState('this-month');
  const [selectedStaff, setSelectedStaff] = useState('all');

  const storageKeyStaff = selectedWorkspace 
    ? `zervos_team_members_${selectedWorkspace.id}`
    : 'zervos_team_members';

  useEffect(() => {
    loadData();
  }, [selectedWorkspace]);

  const loadData = () => {
    // Load staff members
    const storedStaff = localStorage.getItem(storageKeyStaff);
    if (storedStaff) {
      setStaffMembers(JSON.parse(storedStaff));
    }

    // Load transactions
    const storedTransactions = localStorage.getItem('pos_transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  };

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (filterPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this-week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'this-month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-month':
        startDate.setMonth(now.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(tx => new Date(tx.date) >= startDate);
  }, [transactions, filterPeriod]);

  // Calculate KPIs for each staff member
  const staffKPIs = useMemo(() => {
    const kpiMap = new Map<string, StaffKPI>();

    filteredTransactions.forEach(tx => {
      // Process items with assigned person
      tx.items.forEach(item => {
        if (item.assignedPerson) {
          const existing = kpiMap.get(item.assignedPerson) || {
            staffName: item.assignedPerson,
            totalSales: 0,
            totalTransactions: 0,
            totalServices: 0,
            averageTransactionValue: 0,
            totalRevenue: 0,
            commission: 0,
            performance: 'average' as const,
          };

          existing.totalServices += item.qty;
          existing.totalRevenue += item.price * item.qty;
          kpiMap.set(item.assignedPerson, existing);
        }
      });

      // Count transactions handled by staff (cashier)
      if (tx.staff) {
        const existing = kpiMap.get(tx.staff) || {
          staffName: tx.staff,
          totalSales: 0,
          totalTransactions: 0,
          totalServices: 0,
          averageTransactionValue: 0,
          totalRevenue: 0,
          commission: 0,
          performance: 'average' as const,
        };

        existing.totalTransactions += 1;
        existing.totalSales += tx.amount;
        kpiMap.set(tx.staff, existing);
      }
    });

    // Calculate averages and commission
    const kpis = Array.from(kpiMap.values()).map(kpi => {
      kpi.averageTransactionValue = kpi.totalTransactions > 0 
        ? kpi.totalSales / kpi.totalTransactions 
        : 0;
      
      // Commission: 5% of revenue generated from services
      kpi.commission = Math.round(kpi.totalRevenue * 0.05);

      // Performance rating based on revenue
      if (kpi.totalRevenue >= 50000) kpi.performance = 'excellent';
      else if (kpi.totalRevenue >= 30000) kpi.performance = 'good';
      else if (kpi.totalRevenue >= 10000) kpi.performance = 'average';
      else kpi.performance = 'needs-improvement';

      return kpi;
    });

    return kpis.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredTransactions]);

  const filteredKPIs = selectedStaff === 'all' 
    ? staffKPIs 
    : staffKPIs.filter(kpi => kpi.staffName === selectedStaff);

  // Overall stats
  const totalRevenue = staffKPIs.reduce((sum, kpi) => sum + kpi.totalRevenue, 0);
  const totalTransactions = staffKPIs.reduce((sum, kpi) => sum + kpi.totalTransactions, 0);
  const totalServices = staffKPIs.reduce((sum, kpi) => sum + kpi.totalServices, 0);
  const totalCommission = staffKPIs.reduce((sum, kpi) => sum + kpi.commission, 0);

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-700 border-green-300">⭐ Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">👍 Good</Badge>;
      case 'average':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">📊 Average</Badge>;
      case 'needs-improvement':
        return <Badge className="bg-red-100 text-red-700 border-red-300">⚠️ Needs Work</Badge>;
      default:
        return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['Staff Name', 'Services Done', 'Transactions', 'Revenue', 'Avg Transaction', 'Commission', 'Performance'];
    const rows = filteredKPIs.map(kpi => [
      kpi.staffName,
      kpi.totalServices,
      kpi.totalTransactions,
      (kpi.totalRevenue / 100).toFixed(2),
      (kpi.averageTransactionValue / 100).toFixed(2),
      (kpi.commission / 100).toFixed(2),
      kpi.performance,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff_kpi_${filterPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff KPI & Performance</h1>
          <p className="text-slate-600 mt-1">Track team performance and productivity metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
              <p className="text-xs text-slate-500 mt-1">Generated by staff</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalServices}</div>
              <p className="text-xs text-slate-500 mt-1">Total services done</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalTransactions}</div>
              <p className="text-xs text-slate-500 mt-1">Total checkouts</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <Award className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatPrice(totalCommission)}</div>
              <p className="text-xs text-slate-500 mt-1">5% of revenue</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter by Staff */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <Filter className="h-5 w-5 text-slate-400" />
        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff Members</SelectItem>
            {staffKPIs.map(kpi => (
              <SelectItem key={kpi.staffName} value={kpi.staffName}>
                {kpi.staffName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Leaderboard */}
      {filteredKPIs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-brand-50 to-purple-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Performance Leaderboard</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <AnimatePresence>
                {filteredKPIs.map((kpi, index) => (
                  <motion.div
                    key={kpi.staffName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                          index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                          'bg-gradient-to-br from-slate-400 to-slate-600'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-slate-900">{kpi.staffName}</h3>
                            {getPerformanceBadge(kpi.performance)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-slate-500">Services</p>
                              <p className="text-sm font-semibold text-slate-900">{kpi.totalServices}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Transactions</p>
                              <p className="text-sm font-semibold text-slate-900">{kpi.totalTransactions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Avg Transaction</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {formatPrice(kpi.averageTransactionValue)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Commission</p>
                              <p className="text-sm font-semibold text-amber-600">
                                {formatPrice(kpi.commission)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPrice(kpi.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredKPIs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm"
        >
          <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Performance Data</h3>
          <p className="mt-2 text-sm text-slate-600">
            {filteredTransactions.length === 0
              ? 'Start making sales to track staff performance'
              : 'No staff members have recorded activity in this period'}
          </p>
        </motion.div>
      )}

      {/* Performance Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Performance Ratings Guide
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4 border border-green-200">
            <Badge className="bg-green-100 text-green-700 border-green-300 mb-2">⭐ Excellent</Badge>
            <p className="text-sm text-slate-600">Revenue ≥ ₹500</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-blue-200">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 mb-2">👍 Good</Badge>
            <p className="text-sm text-slate-600">Revenue ≥ ₹300</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-yellow-200">
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 mb-2">📊 Average</Badge>
            <p className="text-sm text-slate-600">Revenue ≥ ₹100</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-red-200">
            <Badge className="bg-red-100 text-red-700 border-red-300 mb-2">⚠️ Needs Work</Badge>
            <p className="text-sm text-slate-600">Revenue &lt; ₹100</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          * Commission is calculated at 5% of total revenue generated from services performed
        </p>
      </motion.div>
      </div>
    </DashboardLayout>
  );
}
