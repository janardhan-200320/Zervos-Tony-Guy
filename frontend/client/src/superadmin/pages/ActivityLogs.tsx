import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Search,
  Filter,
  Download,
  Users,
  CreditCard,
  TicketCheck,
  DollarSign,
  Settings,
  LogIn,
  LogOut,
  UserPlus,
  Trash2,
  Edit,
  Eye,
  Clock,
  ChevronRight,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  Shield,
  AlertCircle,
  Info,
  XCircle,
  Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin, ActivityLog } from '../contexts/SuperAdminContext';

const ActivityLogs = () => {
  const { activityLogs, theme } = useSuperAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');

  // Generate more mock activity logs for demo
  const allLogs: ActivityLog[] = [
    ...activityLogs,
    {
      id: 'log5',
      action: 'user_login',
      description: 'Super admin logged in',
      userEmail: 'superadmin@zervos.com',
      entityType: 'system',
      timestamp: '2024-12-31T08:00:00Z',
      severity: 'info',
      ipAddress: '192.168.1.1',
    },
    {
      id: 'log6',
      action: 'plan_updated',
      description: 'Pro plan price updated',
      userEmail: 'superadmin@zervos.com',
      entityType: 'plan',
      entityId: 'pro',
      metadata: { oldPrice: 2000, newPrice: 2500 },
      timestamp: '2024-12-30T16:30:00Z',
      severity: 'warning',
    },
    {
      id: 'log7',
      action: 'client_suspended',
      description: 'Client account suspended',
      userEmail: 'trendy@example.com',
      entityType: 'client',
      entityId: '5',
      metadata: { reason: 'Payment overdue' },
      timestamp: '2024-12-30T12:00:00Z',
      severity: 'critical',
    },
    {
      id: 'log8',
      action: 'ticket_resolved',
      description: 'Support ticket resolved',
      userEmail: 'elite@example.com',
      entityType: 'ticket',
      entityId: 't4',
      timestamp: '2024-12-25T10:30:00Z',
      severity: 'info',
    },
    {
      id: 'log9',
      action: 'announcement_created',
      description: 'New maintenance announcement created',
      userEmail: 'superadmin@zervos.com',
      entityType: 'system',
      timestamp: '2024-12-28T10:00:00Z',
      severity: 'info',
    },
    {
      id: 'log10',
      action: 'bulk_email_sent',
      description: 'Promotional email sent to 500 clients',
      userEmail: 'superadmin@zervos.com',
      entityType: 'system',
      metadata: { recipients: 500 },
      timestamp: '2024-12-27T14:00:00Z',
      severity: 'info',
    },
    {
      id: 'log11',
      action: 'impersonation_started',
      description: 'Admin impersonated client: Glamour Salon',
      userEmail: 'superadmin@zervos.com',
      entityType: 'client',
      entityId: '1',
      timestamp: '2024-12-31T09:00:00Z',
      severity: 'warning',
      ipAddress: '192.168.1.1',
    },
    {
      id: 'log12',
      action: 'failed_login_attempt',
      description: 'Multiple failed login attempts detected',
      userEmail: 'unknown@attacker.com',
      entityType: 'system',
      metadata: { attempts: 5, blocked: true },
      timestamp: '2024-12-31T03:00:00Z',
      severity: 'critical',
      ipAddress: '45.33.32.156',
    },
  ];

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 gap-1"><XCircle className="w-3 h-3" /> Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 gap-1"><AlertCircle className="w-3 h-3" /> Warning</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 gap-1"><Info className="w-3 h-3" /> Info</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return LogIn;
    if (action.includes('logout')) return LogOut;
    if (action.includes('signup') || action.includes('created')) return UserPlus;
    if (action.includes('deleted') || action.includes('removed')) return Trash2;
    if (action.includes('updated') || action.includes('edited')) return Edit;
    if (action.includes('view')) return Eye;
    if (action.includes('payment')) return DollarSign;
    if (action.includes('ticket')) return TicketCheck;
    if (action.includes('subscription') || action.includes('plan')) return CreditCard;
    if (action.includes('suspended')) return AlertTriangle;
    if (action.includes('resolved')) return CheckCircle;
    return Activity;
  };

  const getActionColor = (action: string, entityType: string) => {
    if (action.includes('deleted') || action.includes('suspended')) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (action.includes('created') || action.includes('signup')) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (action.includes('payment')) return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    if (entityType === 'ticket') return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    if (entityType === 'client') return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (entityType === 'plan') return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30';
    return 'text-slate-600 bg-slate-100 dark:bg-slate-700';
  };

  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress?.includes(searchQuery);
    const matchesType = filterType === 'all' || log.entityType === filterType;
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    return matchesSearch && matchesType && matchesSeverity;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, ActivityLog[]>);

  const stats = {
    total: allLogs.length,
    today: allLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    critical: allLogs.filter(l => l.severity === 'critical').length,
    security: allLogs.filter(l => l.action.includes('login') || l.action.includes('impersonation') || l.action.includes('failed')).length,
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Activity Logs
            </h1>
            <p className="text-slate-500 mt-1">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className={`w-36 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: stats.total, icon: Activity, color: 'blue' },
            { label: 'Today', value: stats.today, icon: Clock, color: 'green' },
            { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'red' },
            { label: 'Security Events', value: stats.security, icon: Shield, color: 'purple' },
          ].map((stat) => (
            <Card key={stat.label} className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search activities, emails, IP addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className={`w-40 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="plan">Plan</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className={`w-40 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Activity Timeline */}
        <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          {Object.entries(groupedLogs).map(([date, logs], groupIndex) => (
            <div key={date} className={groupIndex > 0 ? 'mt-8' : ''}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-px flex-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {date}
                </span>
                <div className={`h-px flex-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
              </div>

              {/* Logs */}
              <div className="space-y-3">
                <AnimatePresence>
                  {logs.map((log, index) => {
                    const Icon = getActionIcon(log.action);
                    const colorClass = getActionColor(log.action, log.entityType);
                    
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-start gap-4 p-4 rounded-xl ${
                          log.severity === 'critical' ? 'border-l-4 border-l-red-500' : 
                          log.severity === 'warning' ? 'border-l-4 border-l-yellow-500' : ''
                        } ${
                          theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                        } transition-colors`}
                      >
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {log.description}
                                </p>
                                {getSeverityBadge(log.severity)}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {log.userEmail && (
                                  <span className="text-sm text-slate-500">
                                    {log.userEmail}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-xs capitalize">
                                  {log.entityType}
                                </Badge>
                                {log.ipAddress && (
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {log.ipAddress}
                                  </span>
                                )}
                              </div>
                              {log.metadata && (
                                <div className={`mt-2 p-2 rounded-lg text-xs ${
                                  theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                                }`}>
                                  {Object.entries(log.metadata).map(([key, value]) => (
                                    <span key={key} className="mr-3">
                                      <span className="text-slate-400">{key}:</span>{' '}
                                      <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                                        {String(value)}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {Object.keys(groupedLogs).length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                No activity logs found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default ActivityLogs;
