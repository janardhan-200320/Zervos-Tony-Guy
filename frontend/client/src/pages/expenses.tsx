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
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  X,
  Target,
  ShoppingCart,
  FileText,
  Package,
  RefreshCw,
  ArrowDownRight,
  Receipt,
  Truck,
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

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number; // in cents
  date: string;
  vendor?: string;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'overdue';
  attachments?: string[];
  notes?: string;
  createdAt: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'office-supplies', label: 'Office Supplies', icon: FileText },
  { value: 'equipment', label: 'Equipment', icon: ShoppingCart },
  { value: 'utilities', label: 'Utilities', icon: Building2 },
  { value: 'marketing', label: 'Marketing', icon: Target },
  { value: 'travel', label: 'Travel', icon: Calendar },
  { value: 'rent', label: 'Rent & Facilities', icon: Building2 },
  { value: 'software', label: 'Software & Subscriptions', icon: CreditCard },
  { value: 'professional', label: 'Professional Services', icon: User },
  { value: 'inventory', label: 'Inventory', icon: Package },
  { value: 'transportation', label: 'Transportation', icon: Truck },
  { value: 'other', label: 'Other', icon: DollarSign },
];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Digital Wallet', 'Other'];

export default function Expenses() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Form state
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: 'Cash',
    status: 'paid' as 'paid' | 'pending' | 'overdue',
    notes: '',
  });

  const storageKey = selectedWorkspace 
    ? `zervos_expenses_${selectedWorkspace.id}`
    : 'zervos_expenses';

  useEffect(() => {
    loadData();
  }, [selectedWorkspace]);

  const loadData = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setExpenses(JSON.parse(stored));
  };

  const saveExpenses = (data: Expense[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setExpenses(data);
  };

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;
  const parsePriceToCents = (value: string) => Math.round(parseFloat(value || '0') * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.category || !expenseForm.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      description: expenseForm.description,
      category: expenseForm.category,
      amount: parsePriceToCents(expenseForm.amount),
      date: expenseForm.date,
      vendor: expenseForm.vendor,
      paymentMethod: expenseForm.paymentMethod,
      status: expenseForm.status,
      notes: expenseForm.notes,
      createdAt: new Date().toISOString(),
    };

    saveExpenses([newExpense, ...expenses]);
    toast({ title: 'Expense Added', description: 'Expense recorded successfully' });
    resetForm();
    setIsExpenseDialogOpen(false);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) return;

    const updated = expenses.map(exp =>
      exp.id === editingExpense.id
        ? {
            ...exp,
            description: expenseForm.description,
            category: expenseForm.category,
            amount: parsePriceToCents(expenseForm.amount),
            date: expenseForm.date,
            vendor: expenseForm.vendor,
            paymentMethod: expenseForm.paymentMethod,
            status: expenseForm.status,
            notes: expenseForm.notes,
          }
        : exp
    );

    saveExpenses(updated);
    toast({ title: 'Expense Updated', description: 'Changes saved successfully' });
    resetForm();
    setIsExpenseDialogOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    saveExpenses(expenses.filter(exp => exp.id !== id));
    toast({ title: 'Expense Deleted', description: 'Expense removed successfully' });
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      category: expense.category,
      amount: (expense.amount / 100).toString(),
      date: expense.date,
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod,
      status: expense.status,
      notes: expense.notes || '',
    });
    setIsExpenseDialogOpen(true);
  };

  const resetForm = () => {
    setExpenseForm({
      description: '',
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      paymentMethod: 'Cash',
      status: 'paid',
      notes: '',
    });
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpenses = expenses.filter(exp => exp.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = expenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses.filter(exp => {
    const expenseDate = new Date(exp.date);
    const currentDate = new Date();
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, exp) => sum + exp.amount, 0);

  // Get filtered expenses
  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      const matchesSearch = 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
      
      let matchesDate = true;
      if (dateRange !== 'all') {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        switch (dateRange) {
          case 'today':
            matchesDate = expenseDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = expenseDate >= weekAgo;
            break;
          case 'month':
            matchesDate = expenseDate.getMonth() === now.getMonth() && 
                         expenseDate.getFullYear() === now.getFullYear();
            break;
        }
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  };

  const getCategoryIcon = (category: string) => {
    const categoryObj = EXPENSE_CATEGORIES.find(c => c.value === category);
    return categoryObj ? categoryObj.icon : DollarSign;
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
          <h1 className="text-3xl font-bold text-slate-900">Expense Management</h1>
          <p className="text-slate-600 mt-1">Track and manage your business expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="bg-gradient-to-r from-red-500 to-red-600 gap-2">
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
              <p className="text-sm font-medium text-slate-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatPrice(totalExpenses)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
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
              <p className="text-sm font-medium text-slate-600">Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatPrice(paidExpenses)}</p>
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
              <p className="text-2xl font-bold text-yellow-600 mt-2">{formatPrice(pendingExpenses)}</p>
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
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(thisMonthExpenses)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <ArrowDownRight className="h-6 w-6 text-blue-600" />
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
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
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
                setEditingExpense(null);
                setIsExpenseDialogOpen(true);
              }}
              className="bg-gradient-to-r from-red-500 to-red-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Expenses Table */}
      {getFilteredExpenses().length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Receipt className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No expenses found</h3>
          <p className="mt-2 text-sm text-slate-600">
            {expenses.length === 0
              ? 'Start by adding your first expense'
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <AnimatePresence>
                  {getFilteredExpenses().map((expense, index) => {
                    const CategoryIcon = getCategoryIcon(expense.category);
                    const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);

                    return (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">{expense.description}</div>
                            {expense.vendor && (
                              <div className="text-sm text-slate-500">Vendor: {expense.vendor}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-600">{category?.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-red-600">{formatPrice(expense.amount)}</span>
                          <div className="text-sm text-slate-500">{expense.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(expense.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteExpense(expense.id)}
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

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsExpenseDialogOpen(false);
          setEditingExpense(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Enter expense description"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <Label htmlFor="payment">Payment Method</Label>
                <Select value={expenseForm.paymentMethod} onValueChange={(value) => setExpenseForm({ ...expenseForm, paymentMethod: value })}>
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
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={expenseForm.status} onValueChange={(value: any) => setExpenseForm({ ...expenseForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsExpenseDialogOpen(false);
              setEditingExpense(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingExpense ? handleUpdateExpense : handleAddExpense}>
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}