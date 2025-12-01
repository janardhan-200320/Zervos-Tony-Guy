import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  FileText,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  CalendarCheck,
  Briefcase,
  Package,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalBookings: number;
    completedBookings: number;
    upcomingBookings: number;
    cancelledBookings: number;
    cancellationRate: number;
    totalRevenue: number;
    pendingRevenue: number;
    averageBookingValue: number;
    revenueGrowth: number;
    bookingsGrowth: number;
  };
  services: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  team: Array<{
    id: string;
    name: string;
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    revenue: number;
  }>;
  resources: Array<{
    resourceId: string;
    totalBookings: number;
    totalHours: number;
    revenue: number;
  }>;
  timeAnalytics: {
    byDayOfWeek: Record<string, number>;
    byTimeOfDay: Record<string, number>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retentionRate: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

type ReportTemplate = 
  | 'monthly_summary'
  | 'revenue_analysis'
  | 'team_performance'
  | 'resource_utilization'
  | 'customer_insights'
  | 'service_analysis';

export default function Reports() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>('monthly_summary');
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; businessName: string }>>([]);
  
  // Filters
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const [activeView, setActiveView] = useState<'overview' | 'bookings' | 'revenue' | 'team' | 'resources'>('overview');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();
    
    switch (dateRange) {
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: customStartDate,
            endDate: customEndDate,
          };
        }
        start.setDate(end.getDate() - 30);
        break;
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  // Fetch workspaces from localStorage (same as Workspaces page)
  const fetchWorkspaces = () => {
    try {
      const workspacesData = localStorage.getItem('workspaces');
      if (workspacesData) {
        const data = JSON.parse(workspacesData);
        console.log('📊 Workspaces loaded from localStorage:', data);
        // Map workspace format to match what we need
        const mappedWorkspaces = data.map((w: any) => ({
          id: w.id,
          businessName: w.name
        }));
        setWorkspaces(mappedWorkspaces);
        
        if (mappedWorkspaces.length === 0) {
          console.warn('⚠️ No workspaces found. Go to Workspaces section to create one.');
        }
      } else {
        console.warn('⚠️ No workspaces found in localStorage.');
        setWorkspaces([]);
      }
    } catch (error) {
      console.error('❌ Error loading workspaces:', error);
      setWorkspaces([]);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const range = getDateRange();
      const params = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
      });
      
      if (selectedWorkspace && selectedWorkspace !== 'all') {
        params.append('workspaceId', selectedWorkspace);
      }
      
      const response = await fetch(`/api/reports/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customStartDate, customEndDate, selectedWorkspace]);

  // Export functions
  const exportToCSV = () => {
    if (!analytics) return;
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Bookings', analytics.overview.totalBookings],
      ['Completed Bookings', analytics.overview.completedBookings],
      ['Total Revenue', `$${analytics.overview.totalRevenue}`],
      ['Average Booking Value', `$${analytics.overview.averageBookingValue}`],
      ['Cancellation Rate', `${analytics.overview.cancellationRate}%`],
      ['Revenue Growth', `${analytics.overview.revenueGrowth}%`],
      [''],
      ['Service', 'Bookings', 'Revenue'],
      ...analytics.services.map(s => [s.name, s.count, `$${s.revenue}`]),
      [''],
      ['Team Member', 'Total Bookings', 'Completed', 'Revenue'],
      ...analytics.team.map(t => [t.name, t.totalBookings, t.completedBookings, `$${t.revenue}`]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'Report has been exported to CSV',
    });
  };

  const generateReport = () => {
    toast({
      title: 'Report Generated',
      description: `${selectedTemplate.replace('_', ' ').toUpperCase()} report has been created`,
    });
    setShowNewReportDialog(false);
  };

  const reportTemplates = [
    {
      id: 'monthly_summary' as ReportTemplate,
      name: 'Monthly Business Summary',
      description: 'Complete overview of bookings, revenue, and key metrics',
      icon: BarChart3,
    },
    {
      id: 'revenue_analysis' as ReportTemplate,
      name: 'Revenue Analysis',
      description: 'Detailed financial performance and revenue trends',
      icon: DollarSign,
    },
    {
      id: 'team_performance' as ReportTemplate,
      name: 'Team Performance',
      description: 'Individual team member bookings and revenue contribution',
      icon: Users,
    },
    {
      id: 'resource_utilization' as ReportTemplate,
      name: 'Resource Utilization',
      description: 'Room and equipment booking rates and efficiency',
      icon: Package,
    },
    {
      id: 'customer_insights' as ReportTemplate,
      name: 'Customer Insights',
      description: 'New vs returning customers and retention analysis',
      icon: Activity,
    },
    {
      id: 'service_analysis' as ReportTemplate,
      name: 'Service Analysis',
      description: 'Most popular services and demand patterns',
      icon: Briefcase,
    },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">Reports & Analytics</h1>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {analytics ? `${analytics.overview.totalBookings} bookings` : '0 bookings'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder={workspaces.length === 0 ? "No workspaces" : "All Workspaces"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {workspaces.length === 0 ? "No workspaces available" : "All Workspaces"}
                </SelectItem>
                {workspaces.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-gray-500">
                    <p className="mb-2">No workspaces found</p>
                    <p className="text-xs">Complete onboarding or create a workspace</p>
                  </div>
                ) : (
                  workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.businessName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download size={16} className="mr-2" /> Export CSV
            </Button>
            <Button onClick={() => setShowNewReportDialog(true)}>
              <FileText size={16} className="mr-2" /> New Report
            </Button>
          </div>
        </div>
        
        {/* Filters Row */}
        {dateRange === 'custom' && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-date">From:</Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-date">To:</Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="bg-gray-50 border-b border-gray-200 px-6">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'resources', label: 'Resources', icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                activeView === tab.id
                  ? 'border-purple-600 text-purple-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        {analytics && (
          <>
            {activeView === 'overview' && (
              <OverviewTab analytics={analytics} />
            )}
            {activeView === 'bookings' && (
              <BookingsTab analytics={analytics} />
            )}
            {activeView === 'revenue' && (
              <RevenueTab analytics={analytics} />
            )}
            {activeView === 'team' && (
              <TeamTab analytics={analytics} />
            )}
            {activeView === 'resources' && (
              <ResourcesTab analytics={analytics} />
            )}
          </>
        )}
      </div>

      {/* New Report Dialog */}
      <Dialog open={showNewReportDialog} onOpenChange={setShowNewReportDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Choose a report template to generate insights about your business
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {reportTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                      selectedTemplate === template.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-3 ${
                      selectedTemplate === template.id ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Report Settings</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="report-range">Date Range</Label>
                  <Select defaultValue="30days">
                    <SelectTrigger id="report-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                      <SelectItem value="ytd">Year to date</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="report-format">Export Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger id="report-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                      <SelectItem value="excel">Excel Workbook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewReportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={generateReport}>
                <FileText size={16} className="mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ analytics }: { analytics: AnalyticsData }) {
  const { overview, customers, timeAnalytics } = analytics;
  
  const kpiCards = [
    {
      label: 'Total Bookings',
      value: overview.totalBookings,
      icon: CalendarCheck,
      color: 'purple',
      growth: overview.bookingsGrowth,
    },
    {
      label: 'Total Revenue',
      value: `$${overview.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      growth: overview.revenueGrowth,
    },
    {
      label: 'Avg Booking Value',
      value: `$${overview.averageBookingValue}`,
      icon: TrendingUp,
      color: 'blue',
    },
    {
      label: 'Cancellation Rate',
      value: `${overview.cancellationRate}%`,
      icon: XCircle,
      color: 'red',
    },
    {
      label: 'Completed Bookings',
      value: overview.completedBookings,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Upcoming Bookings',
      value: overview.upcomingBookings,
      icon: Clock,
      color: 'orange',
    },
    {
      label: 'Total Customers',
      value: customers.total,
      icon: Users,
      color: 'indigo',
    },
    {
      label: 'Customer Retention',
      value: `${customers.retentionRate}%`,
      icon: Activity,
      color: 'teal',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const colors = colorMap[card.color];
          
          return (
            <div
              key={card.label}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                {card.growth !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    card.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(card.growth)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-600" />
            Bookings by Day of Week
          </h3>
          <div className="space-y-3">
            {Object.entries(timeAnalytics.byDayOfWeek).map(([day, count]) => {
              const maxCount = Math.max(...Object.values(timeAnalytics.byDayOfWeek));
              const percentage = (count / maxCount) * 100;
              
              return (
                <div key={day}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{day}</span>
                    <span className="text-gray-600">{count} bookings</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-purple-600" />
            Customer Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-2xl font-bold text-blue-600">{customers.new}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {((customers.new / customers.total) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">of total</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm text-gray-600">Returning Customers</p>
                <p className="text-2xl font-bold text-green-600">{customers.returning}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {((customers.returning / customers.total) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">of total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-purple-600" />
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <AlertCircle className="text-purple-600 mb-2" size={20} />
            <p className="text-sm text-gray-600 mb-1">Business Growth</p>
            <p className="text-sm font-medium text-gray-900">
              Revenue is {overview.revenueGrowth >= 0 ? 'up' : 'down'} {Math.abs(overview.revenueGrowth)}% 
              compared to the previous period
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="text-blue-600 mb-2" size={20} />
            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
            <p className="text-sm font-medium text-gray-900">
              {((overview.completedBookings / overview.totalBookings) * 100).toFixed(1)}% of bookings 
              are successfully completed
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <AlertCircle className="text-green-600 mb-2" size={20} />
            <p className="text-sm text-gray-600 mb-1">Customer Retention</p>
            <p className="text-sm font-medium text-gray-900">
              {customers.retentionRate}% of customers are returning for repeat bookings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bookings Tab Component
function BookingsTab({ analytics }: { analytics: AnalyticsData }) {
  const { overview, timeAnalytics } = analytics;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview.completedBookings}</p>
          <p className="text-sm text-gray-500 mt-1">
            {((overview.completedBookings / overview.totalBookings) * 100).toFixed(1)}% completion rate
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">Upcoming</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview.upcomingBookings}</p>
          <p className="text-sm text-gray-500 mt-1">
            ${(overview.upcomingBookings * overview.averageBookingValue).toFixed(0)} potential revenue
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-600">Cancelled</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview.cancelledBookings}</p>
          <p className="text-sm text-gray-500 mt-1">
            {overview.cancellationRate}% cancellation rate
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Booking Times</h3>
        <div className="space-y-3">
          {Object.entries(timeAnalytics.byTimeOfDay)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([time, count]) => {
              const maxCount = Math.max(...Object.values(timeAnalytics.byTimeOfDay));
              const percentage = (count / maxCount) * 100;
              
              return (
                <div key={time}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{time}</span>
                    <span className="text-gray-600">{count} bookings</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 rounded-full h-2"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// Revenue Tab Component
function RevenueTab({ analytics }: { analytics: AnalyticsData }) {
  const { overview, services } = analytics;
  
  const topServices = [...services].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${overview.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp size={14} />
            {overview.revenueGrowth}% growth
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Avg Booking Value</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${overview.averageBookingValue}
          </p>
          <p className="text-sm text-gray-500 mt-1">Per completed booking</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">Pending Revenue</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${overview.pendingRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">From upcoming bookings</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Revenue Services</h3>
        <div className="space-y-3">
          {topServices.map((service) => {
            const maxRevenue = Math.max(...services.map(s => s.revenue));
            const percentage = (service.revenue / maxRevenue) * 100;
            
            return (
              <div key={service.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{service.name}</span>
                  <div className="text-right">
                    <span className="text-gray-900 font-semibold">
                      ${service.revenue.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-2">({service.count} bookings)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-600 rounded-full h-2"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Team Tab Component
function TeamTab({ analytics }: { analytics: AnalyticsData }) {
  const topPerformers = [...analytics.team].sort((a, b) => b.revenue - a.revenue);
  
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Team Member
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Bookings
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Completed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Cancelled
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topPerformers.map((member, index) => {
                const completionRate = member.totalBookings > 0
                  ? ((member.completedBookings / member.totalBookings) * 100).toFixed(1)
                  : '0';
                
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-purple-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">
                      {member.totalBookings}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {member.completedBookings}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                      {member.cancelledBookings}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                      ${member.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        parseFloat(completionRate) >= 90 ? 'bg-green-100 text-green-800' :
                        parseFloat(completionRate) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {completionRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Resources Tab Component
function ResourcesTab({ analytics }: { analytics: AnalyticsData }) {
  const topResources = [...analytics.resources].sort((a, b) => b.revenue - a.revenue);
  
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Resource Utilization</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Resource ID
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Bookings
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Avg Hours/Booking
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topResources.map((resource) => {
                const avgHours = resource.totalBookings > 0
                  ? (resource.totalHours / resource.totalBookings).toFixed(1)
                  : '0';
                
                return (
                  <tr key={resource.resourceId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{resource.resourceId}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">
                      {resource.totalBookings}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">
                      {resource.totalHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                      ${resource.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {avgHours}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {topResources.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Resource Data</h3>
          <p className="text-gray-600">
            Resource booking data will appear here once you start using resources.
          </p>
        </div>
      )}
    </div>
  );
}
