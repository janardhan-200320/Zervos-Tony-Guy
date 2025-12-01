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
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Building2,
  Zap,
  Users,
  Package,
  Wrench,
  CreditCard,
  FileText,
  X,
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

interface Expenditure {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  vendor?: string;
  receipt?: string;
  notes?: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'rent', label: 'Rent & Utilities', icon: Building2 },
  { value: 'salaries', label: 'Salaries & Wages', icon: Users },
  { value: 'supplies', label: 'Supplies & Inventory', icon: Package },
  { value: 'maintenance', label: 'Maintenance & Repairs', icon: Wrench },
  { value: 'marketing', label: 'Marketing & Advertising', icon: TrendingUp },
  { value: 'utilities', label: 'Electricity & Water', icon: Zap },
  { value: 'taxes', label: 'Taxes & Fees', icon: FileText },
  { value: 'other', label: 'Other Expenses', icon: Receipt },
];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque'];

export default function Expenditures() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState<Expenditure | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    paymentMethod: 'Cash',
    vendor: '',
    notes: '',
  });

  const storageKey = selectedWorkspace 
    ? `zervos_expenditures_${selectedWorkspace.id}`
    : 'zervos_expenditures';

  useEffect(() => {
    loadExpenditures();
  }, [selectedWorkspace]);

  const loadExpenditures = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setExpenditures(JSON.parse(stored));
    }
  };

  const saveExpenditures = (data: Expenditure[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setExpenditures(data);
  };

  const handleAddExpenditure = () => {
    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newExpenditure: Expenditure = {
      id: `EXP-${Date.now()}`,
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount) * 100, // Store in cents
      paymentMethod: formData.paymentMethod,
      vendor: formData.vendor,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newExpenditure, ...expenditures];
    saveExpenditures(updated);

    toast({
      title: 'Expenditure Added',
      description: `₹${(newExpenditure.amount / 100).toFixed(2)} recorded successfully`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleUpdateExpenditure = () => {
    if (!editingExpenditure) return;

    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const updated = expenditures.map(exp =>
      exp.id === editingExpenditure.id
        ? {
            ...exp,
            date: formData.date,
            category: formData.category,
            description: formData.description,
            amount: parseFloat(formData.amount) * 100,
            paymentMethod: formData.paymentMethod,
            vendor: formData.vendor,
            notes: formData.notes,
          }
        : exp
    );

    saveExpenditures(updated);

    toast({
      title: 'Expenditure Updated',
      description: 'Changes saved successfully',
    });

    resetForm();
    setIsEditDialogOpen(false);
    setEditingExpenditure(null);
  };

  const handleDeleteExpenditure = (id: string) => {
    if (!confirm('Are you sure you want to delete this expenditure?')) return;

    const updated = expenditures.filter(exp => exp.id !== id);
    saveExpenditures(updated);

    toast({
      title: 'Expenditure Deleted',
      description: 'Record removed successfully',
    });
  };

  const openEditDialog = (expenditure: Expenditure) => {
    setEditingExpenditure(expenditure);
    setFormData({
      date: expenditure.date,
      category: expenditure.category,
      description: expenditure.description,
      amount: (expenditure.amount / 100).toString(),
      paymentMethod: expenditure.paymentMethod,
      vendor: expenditure.vendor || '',
      notes: expenditure.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: '',
      paymentMethod: 'Cash',
      vendor: '',
      notes: '',
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Vendor', 'Notes'];
    const rows = filteredExpenditures.map(exp => [
      exp.date,
      CATEGORIES.find(c => c.value === exp.category)?.label || exp.category,
      exp.description,
      (exp.amount / 100).toFixed(2),
      exp.paymentMethod,
      exp.vendor || '',
      exp.notes || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenditures_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter expenditures
  const filteredExpenditures = expenditures.filter(exp => {
    const matchesSearch = 
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    
    const matchesMonth = filterMonth === 'all' || exp.date.startsWith(filterMonth);

    return matchesSearch && matchesCategory && matchesMonth;
  });

  // Calculate totals
  const totalExpenditure = filteredExpenditures.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: filteredExpenditures
      .filter(exp => exp.category === cat.value)
      .reduce((sum, exp) => sum + exp.amount, 0),
  })).filter(cat => cat.total > 0);

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : Receipt;
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
          <h1 className="text-3xl font-bold text-slate-900">Expenditures</h1>
          <p className="text-slate-600 mt-1">Track and manage all company expenses</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Expenditure
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Expenditure</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(totalExpenditure)}</p>
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
              <p className="text-sm font-medium text-slate-600">Total Records</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{filteredExpenditures.length}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-slate-600">Categories</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{categoryTotals.length}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search expenditures..."
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
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value={new Date().toISOString().substring(0, 7)}>This Month</SelectItem>
                <SelectItem value={new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().substring(0, 7)}>
                  Last Month
                </SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Category Summary */}
      {categoryTotals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Expense Breakdown</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryTotals.map((cat, index) => {
              const Icon = cat.icon;
              const percentage = ((cat.total / totalExpenditure) * 100).toFixed(1);
              return (
                <motion.div
                  key={cat.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-600">{cat.label}</p>
                    <p className="text-sm font-bold text-slate-900">{formatPrice(cat.total)}</p>
                    <p className="text-xs text-slate-500">{percentage}%</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Expenditures List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        {filteredExpenditures.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No expenditures found</h3>
            <p className="mt-2 text-sm text-slate-600">
              {expenditures.length === 0
                ? 'Start tracking your expenses by adding your first expenditure'
                : 'Try adjusting your search or filter criteria'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <AnimatePresence>
                  {filteredExpenditures.map((expenditure, index) => {
                    const Icon = getCategoryIcon(expenditure.category);
                    const category = CATEGORIES.find(c => c.value === expenditure.category);
                    return (
                      <motion.tr
                        key={expenditure.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {new Date(expenditure.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Icon className="h-3 w-3" />
                            {category?.label || expenditure.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{expenditure.description}</p>
                            {expenditure.vendor && (
                              <p className="text-xs text-slate-500">{expenditure.vendor}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          {formatPrice(expenditure.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">{expenditure.paymentMethod}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(expenditure)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpenditure(expenditure.id)}
                              className="text-red-600 hover:text-red-700"
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
        )}
      </motion.div>

      {/* Add Expenditure Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Expenditure</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="e.g., Monthly office rent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
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
              <Label htmlFor="vendor">Vendor/Supplier</Label>
              <Input
                id="vendor"
                placeholder="e.g., ABC Services"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpenditure}>
              Add Expenditure
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expenditure Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expenditure</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Input
                id="edit-description"
                placeholder="e.g., Monthly office rent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-amount">Amount (₹) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
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
              <Label htmlFor="edit-vendor">Vendor/Supplier</Label>
              <Input
                id="edit-vendor"
                placeholder="e.g., ABC Services"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateExpenditure}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
