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
  Calculator,
  DollarSign,
  Calendar,
  Building2,
  Wallet,
  CheckCircle,
  AlertCircle,
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
  CreditCard,
  PieChart,
  Target,
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

interface BalanceSheetItem {
  id: string;
  name: string;
  category: 'current-asset' | 'fixed-asset' | 'current-liability' | 'long-term-liability' | 'equity';
  amount: number; // in cents
  date: string;
  notes?: string;
  createdAt: string;
}

const BALANCE_SHEET_CATEGORIES = [
  { 
    value: 'current-asset', 
    label: 'Current Assets', 
    type: 'asset',
    icon: Wallet,
    description: 'Assets that can be converted to cash within one year',
    examples: ['Cash', 'Accounts Receivable', 'Inventory', 'Short-term Investments']
  },
  { 
    value: 'fixed-asset', 
    label: 'Fixed Assets', 
    type: 'asset',
    icon: Building2,
    description: 'Long-term assets used in business operations',
    examples: ['Property', 'Equipment', 'Vehicles', 'Furniture']
  },
  { 
    value: 'current-liability', 
    label: 'Current Liabilities', 
    type: 'liability',
    icon: CreditCard,
    description: 'Debts that must be paid within one year',
    examples: ['Accounts Payable', 'Short-term Loans', 'Accrued Expenses']
  },
  { 
    value: 'long-term-liability', 
    label: 'Long-term Liabilities', 
    type: 'liability',
    icon: TrendingDown,
    description: 'Debts that are due in more than one year',
    examples: ['Long-term Loans', 'Mortgages', 'Bonds Payable']
  },
  { 
    value: 'equity', 
    label: 'Owner\'s Equity', 
    type: 'equity',
    icon: Target,
    description: 'Owner\'s stake in the business',
    examples: ['Owner\'s Capital', 'Retained Earnings', 'Additional Paid-in Capital']
  },
];

export default function BalanceSheet() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [balanceSheetItems, setBalanceSheetItems] = useState<BalanceSheetItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BalanceSheetItem | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Form state
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'current-asset' as 'current-asset' | 'fixed-asset' | 'current-liability' | 'long-term-liability' | 'equity',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const storageKey = selectedWorkspace 
    ? `zervos_balance_sheet_${selectedWorkspace.id}`
    : 'zervos_balance_sheet';

  useEffect(() => {
    loadData();
  }, [selectedWorkspace]);

  const loadData = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setBalanceSheetItems(JSON.parse(stored));
  };

  const saveBalanceSheetItems = (data: BalanceSheetItem[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setBalanceSheetItems(data);
  };

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;
  const parsePriceToCents = (value: string) => Math.round(parseFloat(value || '0') * 100);

  const handleAddItem = () => {
    if (!itemForm.name || !itemForm.category || !itemForm.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newItem: BalanceSheetItem = {
      id: `BS-${Date.now()}`,
      name: itemForm.name,
      category: itemForm.category,
      amount: parsePriceToCents(itemForm.amount),
      date: itemForm.date,
      notes: itemForm.notes,
      createdAt: new Date().toISOString(),
    };

    saveBalanceSheetItems([newItem, ...balanceSheetItems]);
    toast({ title: 'Item Added', description: 'Balance sheet item added successfully' });
    resetForm();
    setIsDialogOpen(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    const updated = balanceSheetItems.map(item =>
      item.id === editingItem.id
        ? {
            ...item,
            name: itemForm.name,
            category: itemForm.category,
            amount: parsePriceToCents(itemForm.amount),
            date: itemForm.date,
            notes: itemForm.notes,
          }
        : item
    );

    saveBalanceSheetItems(updated);
    toast({ title: 'Item Updated', description: 'Changes saved successfully' });
    resetForm();
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    saveBalanceSheetItems(balanceSheetItems.filter(item => item.id !== id));
    toast({ title: 'Item Deleted', description: 'Balance sheet item removed successfully' });
  };

  const openEditItem = (item: BalanceSheetItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      amount: (item.amount / 100).toString(),
      date: item.date,
      notes: item.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setItemForm({
      name: '',
      category: 'current-asset' as any,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  // Calculations
  const totalAssets = balanceSheetItems
    .filter(item => item.category.includes('asset'))
    .reduce((sum, item) => sum + item.amount, 0);
  
  const currentAssets = balanceSheetItems
    .filter(item => item.category === 'current-asset')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const fixedAssets = balanceSheetItems
    .filter(item => item.category === 'fixed-asset')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const totalLiabilities = balanceSheetItems
    .filter(item => item.category.includes('liability'))
    .reduce((sum, item) => sum + item.amount, 0);
  
  const currentLiabilities = balanceSheetItems
    .filter(item => item.category === 'current-liability')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const longTermLiabilities = balanceSheetItems
    .filter(item => item.category === 'long-term-liability')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const totalEquity = balanceSheetItems
    .filter(item => item.category === 'equity')
    .reduce((sum, item) => sum + item.amount, 0);

  const netWorth = totalAssets - totalLiabilities;
  const isBalanced = Math.abs((totalAssets) - (totalLiabilities + totalEquity)) < 100; // Allow for rounding errors

  // Get filtered items
  const getFilteredItems = () => {
    return balanceSheetItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getCategoryData = (categoryValue: string) => {
    const category = BALANCE_SHEET_CATEGORIES.find(c => c.value === categoryValue);
    const items = balanceSheetItems.filter(item => item.category === categoryValue);
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return { category, items, total };
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
          <h1 className="text-3xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-slate-600 mt-1">Track assets, liabilities, and equity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Assets</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(totalAssets)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-slate-600">Total Liabilities</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatPrice(totalLiabilities)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-red-600" />
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
              <p className="text-sm font-medium text-slate-600">Total Equity</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatPrice(totalEquity)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-slate-600">Net Worth</p>
              <p className={`text-2xl font-bold mt-2 ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(Math.abs(netWorth))}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${netWorth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {netWorth >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Balance Check */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-4 shadow-sm ${
          isBalanced 
            ? 'border-green-200 bg-green-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}
      >
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          <div>
            <h3 className={`font-semibold ${isBalanced ? 'text-green-800' : 'text-yellow-800'}`}>
              Balance Sheet {isBalanced ? 'Balanced' : 'Unbalanced'}
            </h3>
            <p className={`text-sm ${isBalanced ? 'text-green-600' : 'text-yellow-600'}`}>
              {isBalanced 
                ? 'Assets = Liabilities + Equity. Your balance sheet is properly balanced.'
                : 'Assets ≠ Liabilities + Equity. Please review your entries.'}
            </p>
          </div>
        </div>
      </motion.div>

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
              placeholder="Search balance sheet items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {BALANCE_SHEET_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                resetForm();
                setEditingItem(null);
                setIsDialogOpen(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Balance Sheet Categories */}
      <div className="grid gap-6">
        {BALANCE_SHEET_CATEGORIES.map((category) => {
          const { items, total } = getCategoryData(category.value);
          const Icon = category.icon;
          
          return (
            <motion.div
              key={category.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className={`px-6 py-4 border-b ${
                category.type === 'asset' ? 'bg-blue-50' :
                category.type === 'liability' ? 'bg-red-50' : 'bg-green-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${
                      category.type === 'asset' ? 'text-blue-600' :
                      category.type === 'liability' ? 'text-red-600' : 'text-green-600'
                    }`} />
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        category.type === 'asset' ? 'text-blue-900' :
                        category.type === 'liability' ? 'text-red-900' : 'text-green-900'
                      }`}>
                        {category.label}
                      </h3>
                      <p className={`text-sm ${
                        category.type === 'asset' ? 'text-blue-600' :
                        category.type === 'liability' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      category.type === 'asset' ? 'text-blue-700' :
                      category.type === 'liability' ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {formatPrice(total)}
                    </div>
                    <div className="text-sm text-slate-500">{items.length} items</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-slate-500 mb-2">No items in this category</p>
                    <p className="text-sm text-slate-400">
                      Examples: {category.examples.join(', ')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-sm text-slate-500">
                              Added on {new Date(item.date).toLocaleDateString()}
                            </div>
                            {item.notes && (
                              <div className="text-sm text-slate-600 mt-1">{item.notes}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-semibold ${
                              category.type === 'asset' ? 'text-blue-600' :
                              category.type === 'liability' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatPrice(item.amount)}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDialogOpen(false);
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Balance Sheet Item' : 'Add Balance Sheet Item'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={itemForm.category} onValueChange={(value: any) => setItemForm({ ...itemForm, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BALANCE_SHEET_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={itemForm.amount}
                  onChange={(e) => setItemForm({ ...itemForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={itemForm.date}
                  onChange={(e) => setItemForm({ ...itemForm, date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this item"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setEditingItem(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingItem ? handleUpdateItem : handleAddItem}>
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}