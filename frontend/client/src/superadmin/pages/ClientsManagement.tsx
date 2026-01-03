import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Download,
  Plus,
  Activity,
  ExternalLink,
  RefreshCw,
  X,
  UserCheck,
  LogIn,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin, Client } from '../contexts/SuperAdminContext';

type SortField = 'businessName' | 'createdAt' | 'monthlyRevenue' | 'healthScore';
type SortOrder = 'asc' | 'desc';

const ClientsManagement = () => {
  const [, setLocation] = useLocation();
  const { clients, updateClientStatus, theme, startImpersonation, impersonationSession } = useSuperAdmin();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImpersonateConfirm, setShowImpersonateConfirm] = useState<Client | null>(null);

  const handleLoginAsClient = (client: Client) => {
    setShowImpersonateConfirm(client);
  };

  const confirmImpersonation = () => {
    if (showImpersonateConfirm) {
      startImpersonation(showImpersonateConfirm.id, showImpersonateConfirm.businessName);
      toast({
        title: '🔐 Impersonation Started',
        description: `You are now viewing as ${showImpersonateConfirm.businessName}`,
      });
      setShowImpersonateConfirm(null);
      // Redirect to client dashboard
      setLocation('/dashboard');
    }
  };

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        client =>
          client.businessName.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.phone.includes(query)
      );
    }

    // Plan filter
    if (filterPlan !== 'all') {
      result = result.filter(client => client.plan === filterPlan);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(client => client.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'businessName':
          comparison = a.businessName.localeCompare(b.businessName);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'monthlyRevenue':
          comparison = a.monthlyRevenue - b.monthlyRevenue;
          break;
        case 'healthScore':
          comparison = a.healthScore - b.healthScore;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [clients, searchQuery, filterPlan, filterStatus, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'trial': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'inactive': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'elite': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'pro': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'classic': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'custom': return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    trial: clients.filter(c => c.status === 'trial').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    totalRevenue: clients.reduce((sum, c) => sum + c.monthlyRevenue, 0),
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 opacity-30" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Clients Management
            </h1>
            <p className="text-slate-500 mt-1">
              Manage and monitor all Zervos clients
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Clients', value: stats.total, icon: Users, color: 'blue' },
            { label: 'Active', value: stats.active, icon: CheckCircle, color: 'green' },
            { label: 'Trial', value: stats.trial, icon: Clock, color: 'yellow' },
            { label: 'Inactive', value: stats.inactive, icon: AlertCircle, color: 'red' },
            { label: 'Monthly Revenue', value: `₹${(stats.totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'purple' },
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

        {/* Search and Filters */}
        <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3">
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className={`w-32 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className={`w-32 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              {(filterPlan !== 'all' || filterStatus !== 'all' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterPlan('all');
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="text-slate-500"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Clients Table */}
        <Card className={`overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('businessName')}
                      className={`flex items-center gap-1 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      Client <SortIcon field="businessName" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      Plan
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      Status
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('monthlyRevenue')}
                      className={`flex items-center gap-1 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      Revenue <SortIcon field="monthlyRevenue" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('healthScore')}
                      className={`flex items-center gap-1 text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      Health <SortIcon field="healthScore" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      Last Active
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <AnimatePresence>
                  {filteredClients.map((client, index) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className={`${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} transition-colors`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {client.businessName.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {client.businessName}
                            </p>
                            <p className="text-sm text-slate-500">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`${getPlanColor(client.plan)} capitalize`}>
                          {client.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`${getStatusColor(client.status)} capitalize`}>
                          {client.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          ₹{client.monthlyRevenue.toLocaleString()}
                        </span>
                        <span className="text-slate-500 text-sm">/mo</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-600">
                            <div
                              className={`h-full rounded-full ${getHealthBgColor(client.healthScore)}`}
                              style={{ width: `${client.healthScore}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${getHealthColor(client.healthScore)}`}>
                            {client.healthScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(client.lastActive).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleLoginAsClient(client)}
                              className="text-purple-600 font-medium"
                            >
                              <LogIn className="w-4 h-4 mr-2" />
                              Login As Client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedClient(client);
                                setShowClientModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {client.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => updateClientStatus(client.id, 'suspended')}
                                className="text-orange-600"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => updateClientStatus(client.id, 'active')}
                                className="text-green-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                No clients found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </Card>

        {/* Client Details Modal */}
        <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
          <DialogContent className={`max-w-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Client Details</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedClient.businessName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {selectedClient.businessName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(selectedClient.status)}>
                        {selectedClient.status}
                      </Badge>
                      <Badge className={getPlanColor(selectedClient.plan)}>
                        {selectedClient.plan.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                        {selectedClient.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                        {selectedClient.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className="text-sm text-slate-500">Monthly Revenue</p>
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      ₹{selectedClient.monthlyRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className="text-sm text-slate-500">Workspaces</p>
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {selectedClient.workspaces}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className="text-sm text-slate-500">Health Score</p>
                    <p className={`text-xl font-bold ${getHealthColor(selectedClient.healthScore)}`}>
                      {selectedClient.healthScore}%
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <p className="text-sm text-slate-500">Member Since</p>
                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {new Date(selectedClient.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Subscription Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Started</p>
                      <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                        {new Date(selectedClient.subscriptionStart).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Expires</p>
                      <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                        {new Date(selectedClient.subscriptionEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClientModal(false)}>
                Close
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                onClick={() => {
                  if (selectedClient) {
                    handleLoginAsClient(selectedClient);
                    setShowClientModal(false);
                  }
                }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login As Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Impersonation Confirmation Dialog */}
        <Dialog open={!!showImpersonateConfirm} onOpenChange={() => setShowImpersonateConfirm(null)}>
          <DialogContent className={`max-w-md ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                <Shield className="w-5 h-5 text-purple-600" />
                Confirm Impersonation
              </DialogTitle>
              <DialogDescription>
                You are about to login as this client. All your actions will be logged for audit purposes.
              </DialogDescription>
            </DialogHeader>
            {showImpersonateConfirm && (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {showImpersonateConfirm.businessName.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {showImpersonateConfirm.businessName}
                    </p>
                    <p className="text-sm text-slate-500">{showImpersonateConfirm.email}</p>
                  </div>
                </div>
              </div>
            )}
            <div className={`p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Security Notice</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    This action will be recorded in the audit log with your admin credentials, timestamp, and session duration.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImpersonateConfirm(null)}>
                Cancel
              </Button>
              <Button onClick={confirmImpersonation} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <UserCheck className="w-4 h-4 mr-2" />
                Confirm & Login
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default ClientsManagement;
