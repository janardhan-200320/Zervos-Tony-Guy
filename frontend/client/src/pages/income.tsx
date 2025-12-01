import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  X,
  Target,
  BarChart3,
  ShoppingCart,
  Eye,
  RefreshCw,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface Income {
  id: string;
  description: string;
  source: string;
  amount: number; // in cents
  date: string;
  customer?: string;
  invoiceNumber?: string;
  paymentMethod: string;
  status: 'received' | 'pending' | 'partial';
  notes?: string;
  createdAt: string;
}

const INCOME_SOURCES = [
  { value: 'sales', label: 'Product Sales', icon: ShoppingCart },
  { value: 'services', label: 'Service Revenue', icon: User },
  { value: 'consulting', label: 'Consulting', icon: Target },
  { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { value: 'interest', label: 'Interest Income', icon: TrendingUp },
  { value: 'investments', label: 'Investment Returns', icon: BarChart3 },
  { value: 'grants', label: 'Grants', icon: DollarSign },
  { value: 'other', label: 'Other', icon: DollarSign },
];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Digital Wallet', 'Other'];

export default function Income() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [income, setIncome] = useState<Income[]>([]);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Form state
  const [incomeForm, setIncomeForm] = useState({
    description: '',
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    customer: '',
    invoiceNumber: '',
    paymentMethod: 'Cash',
    status: 'received' as 'received' | 'pending' | 'partial',
    notes: '',
  });

  const storageKey = selectedWorkspace 
    ? `zervos_income_${selectedWorkspace.id}`
    : 'zervos_income';

  useEffect(() => {
    loadData();
  }, [selectedWorkspace]);

  const loadData = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setIncome(JSON.parse(stored));
  };

  const saveIncome = (data: Income[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setIncome(data);
  };

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;
  const parsePriceToCents = (value: string) => Math.round(parseFloat(value || '0') * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Received</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddIncome = () => {
    if (!incomeForm.description || !incomeForm.source || !incomeForm.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newIncome: Income = {
      id: `INC-${Date.now()}`,
      description: incomeForm.description,
      source: incomeForm.source,
      amount: parsePriceToCents(incomeForm.amount),
      date: incomeForm.date,
      customer: incomeForm.customer,
      invoiceNumber: incomeForm.invoiceNumber,
      paymentMethod: incomeForm.paymentMethod,
      status: incomeForm.status,
      notes: incomeForm.notes,
      createdAt: new Date().toISOString(),
    };

    saveIncome([newIncome, ...income]);
    toast({ title: 'Income Added', description: 'Income recorded successfully' });
    resetForm();
    setIsIncomeDialogOpen(false);
  };

  const handleUpdateIncome = () => {
    if (!editingIncome) return;

    const updated = income.map(inc =>
      inc.id === editingIncome.id
        ? {
            ...inc,
            description: incomeForm.description,
            source: incomeForm.source,
            amount: parsePriceToCents(incomeForm.amount),
            date: incomeForm.date,
            customer: incomeForm.customer,
            invoiceNumber: incomeForm.invoiceNumber,
            paymentMethod: incomeForm.paymentMethod,
            status: incomeForm.status,
            notes: incomeForm.notes,
          }
        : inc
    );

    saveIncome(updated);
    toast({ title: 'Income Updated', description: 'Changes saved successfully' });
    resetForm();
    setIsIncomeDialogOpen(false);
    setEditingIncome(null);
  };

  const handleDeleteIncome = (id: string) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return;
    
    saveIncome(income.filter(inc => inc.id !== id));
    toast({ title: 'Income Deleted', description: 'Income entry removed successfully' });
  };

  const openEditIncome = (inc: Income) => {
    setEditingIncome(inc);
    setIncomeForm({
      description: inc.description,
      source: inc.source,
      amount: (inc.amount / 100).toString(),
      date: inc.date,
      customer: inc.customer || '',
      invoiceNumber: inc.invoiceNumber || '',
      paymentMethod: inc.paymentMethod,
      status: inc.status,
      notes: inc.notes || '',
    });
    setIsIncomeDialogOpen(true);
  };

  const resetForm = () => {
    setIncomeForm({
      description: '',
      source: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      customer: '',
      invoiceNumber: '',
      paymentMethod: 'Cash',
      status: 'received',
      notes: '',
    });
  };

  // Calculations
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
  const receivedIncome = income.filter(inc => inc.status === 'received').reduce((sum, inc) => sum + inc.amount, 0);
  const pendingIncome = income.filter(inc => inc.status === 'pending').reduce((sum, inc) => sum + inc.amount, 0);
  const thisMonthIncome = income.filter(inc => {
    const incomeDate = new Date(inc.date);
    const currentDate = new Date();
    return incomeDate.getMonth() === currentDate.getMonth() && 
           incomeDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, inc) => sum + inc.amount, 0);

  // Get filtered income
  const getFilteredIncome = () => {
    return income.filter(inc => {
      const matchesSearch = 
        inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSource = filterSource === 'all' || inc.source === filterSource;
      const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;
      
      let matchesDate = true;
      if (dateRange !== 'all') {
        const incomeDate = new Date(inc.date);
        const now = new Date();
        switch (dateRange) {
          case 'today':
            matchesDate = incomeDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = incomeDate >= weekAgo;
            break;
          case 'month':
            matchesDate = incomeDate.getMonth() === now.getMonth() && 
                         incomeDate.getFullYear() === now.getFullYear();
            break;
        }
      }

      return matchesSearch && matchesSource && matchesStatus && matchesDate;
    });
  };

  const getSourceIcon = (source: string) => {
    const sourceObj = INCOME_SOURCES.find(s => s.value === source);
    return sourceObj ? sourceObj.icon : DollarSign;
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
          <h1 className="text-3xl font-bold text-slate-900">Income Management</h1>
          <p className="text-slate-600 mt-1">Track and manage your revenue sources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-green-600 gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatPrice(totalIncome)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Received</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatPrice(receivedIncome)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{formatPrice(pendingIncome)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(thisMonthIncome)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search income entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {INCOME_SOURCES.map(source => (
                  <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                resetForm();
                setEditingIncome(null);
                setIsIncomeDialogOpen(true);
              }}
              className="bg-gradient-to-r from-green-500 to-green-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Income Table */}
      {getFilteredIncome().length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <TrendingUp className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No income entries found</h3>
          <p className="mt-2 text-sm text-slate-600">
            {income.length === 0
              ? 'Start by adding your first income entry'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <AnimatePresence>
                  {getFilteredIncome().map((inc, index) => {
                    const SourceIcon = getSourceIcon(inc.source);
                    const source = INCOME_SOURCES.find(s => s.value === inc.source);

                    return (
                      <motion.tr
                        key={inc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">{inc.description}</div>
                            {inc.customer && (
                              <div className="text-sm text-slate-500">Customer: {inc.customer}</div>
                            )}
                            {inc.invoiceNumber && (
                              <div className="text-sm text-slate-500">Invoice: {inc.invoiceNumber}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <SourceIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-600">{source?.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-600">{formatPrice(inc.amount)}</span>
                          <div className="text-sm text-slate-500">{inc.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(inc.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(inc.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditIncome(inc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteIncome(inc.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Income Dialog */}
      <Dialog open={isIncomeDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsIncomeDialogOpen(false);
          setEditingIncome(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Edit Income' : 'Add New Income'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  placeholder="Enter income description"
                />
              </div>
              <div>
                <Label htmlFor="source">Source *</Label>
                <Select value={incomeForm.source} onValueChange={(value) => setIncomeForm({ ...incomeForm, source: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_SOURCES.map(source => (
                      <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Input
                  id="customer"
                  value={incomeForm.customer}
                  onChange={(e) => setIncomeForm({ ...incomeForm, customer: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="invoice">Invoice Number</Label>
                <Input
                  id="invoice"
                  value={incomeForm.invoiceNumber}
                  onChange={(e) => setIncomeForm({ ...incomeForm, invoiceNumber: e.target.value })}
                  placeholder="Invoice #"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment">Payment Method</Label>
                <Select value={incomeForm.paymentMethod} onValueChange={(value) => setIncomeForm({ ...incomeForm, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={incomeForm.status} onValueChange={(value: any) => setIncomeForm({ ...incomeForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={incomeForm.notes}
                onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsIncomeDialogOpen(false);
              setEditingIncome(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingIncome ? handleUpdateIncome : handleAddIncome}>
              {editingIncome ? 'Save Changes' : 'Add Income'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}