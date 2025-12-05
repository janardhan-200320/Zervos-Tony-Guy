import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  Heart,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Search,
  Award,
  Star,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { format } from 'date-fns';

export default function StaffTipsReport() {
  const { selectedWorkspace } = useWorkspace();
  const branchId = selectedWorkspace?.id || 'default';
  
  const [tips, setTips] = useState<any[]>([]);
  const [staffSummary, setStaffSummary] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  useEffect(() => {
    loadTipsData();
  }, [branchId]);

  const loadTipsData = () => {
    const tipsData = JSON.parse(localStorage.getItem(`tips_${branchId}`) || '[]');
    const summaryData = JSON.parse(localStorage.getItem(`staff_tips_summary_${branchId}`) || '{}');
    
    setTips(tipsData);
    setStaffSummary(summaryData);
  };

  const filterTips = () => {
    let filtered = [...tips];

    // Filter by staff
    if (selectedStaff !== 'all') {
      filtered = filtered.filter(tip => tip.staffId === selectedStaff);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tip =>
        tip.staffMember.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (timeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(tip => new Date(tip.timestamp) >= filterDate);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const filteredTips = filterTips();

  const calculateTotalTips = () => {
    return filteredTips.reduce((sum, tip) => sum + tip.amount, 0);
  };

  const getTopEarner = () => {
    const staffTotals: any = {};
    filteredTips.forEach(tip => {
      if (!staffTotals[tip.staffId]) {
        staffTotals[tip.staffId] = {
          name: tip.staffMember,
          total: 0,
        };
      }
      staffTotals[tip.staffId].total += tip.amount;
    });

    const entries = Object.values(staffTotals) as any[];
    return entries.length > 0 ? entries.reduce((max: any, staff: any) => 
      staff.total > max.total ? staff : max
    ) : null;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Staff Member', 'Customer', 'Bill Amount', 'Tip Amount', 'Transaction ID'];
    const rows = filteredTips.map(tip => [
      format(new Date(tip.timestamp), 'dd/MM/yyyy HH:mm'),
      tip.staffMember,
      tip.customerName,
      tip.billAmount.toFixed(2),
      tip.amount.toFixed(2),
      tip.transactionId,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-tips-report-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
  };

  const topEarner = getTopEarner();
  const totalTips = calculateTotalTips();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
              Staff Tips Report
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track and manage tips earned by your staff
            </p>
          </div>
          <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalTips.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {filteredTips.length} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Tip</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{filteredTips.length > 0 ? (totalTips / filteredTips.length).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Earner</CardTitle>
              <Award className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-amber-600 truncate">
                {topEarner ? topEarner.name : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {topEarner ? `₹${topEarner.total.toFixed(2)}` : 'No data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(staffSummary).length}
              </div>
              <p className="text-xs text-muted-foreground">Received tips</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {Object.entries(staffSummary).map(([staffId, data]: any) => (
                    <SelectItem key={staffId} value={staffId}>
                      {data.staffName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Staff Summary Cards */}
        {Object.keys(staffSummary).length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Staff Summary</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(staffSummary).map(([staffId, data]: any) => (
                <motion.div
                  key={staffId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-2 hover:border-purple-300 transition-all">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
                          <Star className="h-6 w-6 text-white fill-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{data.staffName}</CardTitle>
                          <CardDescription>{data.tipCount} tips received</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Tips</span>
                        <span className="text-2xl font-bold text-green-600">
                          ₹{data.totalTips.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Average per tip</span>
                        <span className="text-sm font-semibold text-gray-700">
                          ₹{(data.totalTips / data.tipCount).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tips List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tips</CardTitle>
            <CardDescription>
              Showing {filteredTips.length} tip{filteredTips.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTips.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tips found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTips.map((tip) => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                        <Heart className="h-5 w-5 text-pink-600 fill-pink-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{tip.staffMember}</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-sm text-gray-600">{tip.customerName}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-gray-500">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {format(new Date(tip.timestamp), 'dd MMM yyyy, hh:mm a')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Bill: ₹{tip.billAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">₹{tip.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {((tip.amount / tip.billAmount) * 100).toFixed(0)}% of bill
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
