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
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  FileText,
  Calendar,
  Building2,
  User,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst?: string;
  paymentTerms?: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: string;
  notes?: string;
}

interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  expectedDelivery?: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  notes?: string;
}

const VENDOR_CATEGORIES = [
  { value: 'products', label: 'Product Suppliers', icon: Package },
  { value: 'equipment', label: 'Equipment Suppliers', icon: ShoppingCart },
  { value: 'services', label: 'Service Providers', icon: FileText },
  { value: 'utilities', label: 'Utilities', icon: Building2 },
  { value: 'office', label: 'Office Supplies', icon: FileText },
  { value: 'other', label: 'Other', icon: DollarSign },
];

const PAYMENT_TERMS = ['Immediate', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Custom'];
const ORDER_STATUS = ['pending', 'confirmed', 'delivered', 'cancelled'];

export default function VendorManagement() {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState('vendors');
  
  // Vendor dialogs
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  
  // PO dialogs
  const [isPODialogOpen, setIsPODialogOpen] = useState(false);
  const [isEditPOOpen, setIsEditPOOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form states
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst: '',
    paymentTerms: 'Net 30',
    rating: 5,
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const [poForm, setPOForm] = useState({
    vendorId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    status: 'pending' as 'pending' | 'confirmed' | 'delivered' | 'cancelled',
    items: [{ name: '', quantity: 1, price: 0 }],
    notes: '',
  });

  const storageKeyVendors = selectedWorkspace 
    ? `zervos_vendors_${selectedWorkspace.id}`
    : 'zervos_vendors';
  const storageKeyPOs = selectedWorkspace 
    ? `zervos_purchase_orders_${selectedWorkspace.id}`
    : 'zervos_purchase_orders';

  useEffect(() => {
    loadData();
  }, [selectedWorkspace]);

  const loadData = () => {
    const storedVendors = localStorage.getItem(storageKeyVendors);
    const storedPOs = localStorage.getItem(storageKeyPOs);
    
    if (storedVendors) setVendors(JSON.parse(storedVendors));
    if (storedPOs) setPurchaseOrders(JSON.parse(storedPOs));
  };

  const saveVendors = (data: Vendor[]) => {
    localStorage.setItem(storageKeyVendors, JSON.stringify(data));
    setVendors(data);
  };

  const savePOs = (data: PurchaseOrder[]) => {
    localStorage.setItem(storageKeyPOs, JSON.stringify(data));
    setPurchaseOrders(data);
  };

  // Vendor CRUD
  const handleAddVendor = () => {
    if (!vendorForm.name || !vendorForm.category) {
      toast({
        title: 'Missing Information',
        description: 'Vendor name and category are required',
        variant: 'destructive',
      });
      return;
    }

    const newVendor: Vendor = {
      id: `VEN-${Date.now()}`,
      ...vendorForm,
      createdAt: new Date().toISOString(),
    };

    saveVendors([newVendor, ...vendors]);
    toast({ title: 'Vendor Added', description: `${newVendor.name} added successfully` });
    resetVendorForm();
    setIsAddVendorOpen(false);
  };

  const handleUpdateVendor = () => {
    if (!editingVendor) return;

    const updated = vendors.map(v =>
      v.id === editingVendor.id ? { ...v, ...vendorForm } : v
    );

    saveVendors(updated);
    toast({ title: 'Vendor Updated', description: 'Changes saved successfully' });
    resetVendorForm();
    setIsEditVendorOpen(false);
    setEditingVendor(null);
  };

  const handleDeleteVendor = (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    
    saveVendors(vendors.filter(v => v.id !== id));
    toast({ title: 'Vendor Deleted', description: 'Vendor removed successfully' });
  };

  const openEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      category: vendor.category,
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      pincode: vendor.pincode || '',
      gst: vendor.gst || '',
      paymentTerms: vendor.paymentTerms || 'Net 30',
      rating: vendor.rating,
      status: vendor.status as 'active' | 'inactive',
      notes: vendor.notes || '',
    });
    setIsEditVendorOpen(true);
  };

  const resetVendorForm = () => {
    setVendorForm({
      name: '',
      category: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gst: '',
      paymentTerms: 'Net 30',
      rating: 5,
      status: 'active',
      notes: '',
    });
  };

  // PO CRUD
  const handleAddPO = () => {
    if (!poForm.vendorId || poForm.items.some(item => !item.name || item.quantity <= 0)) {
      toast({
        title: 'Missing Information',
        description: 'Please select vendor and fill all item details',
        variant: 'destructive',
      });
      return;
    }

    const vendor = vendors.find(v => v.id === poForm.vendorId);
    if (!vendor) return;

    const totalAmount = poForm.items.reduce((sum, item) => sum + (item.quantity * item.price * 100), 0);

    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      vendorId: poForm.vendorId,
      vendorName: vendor.name,
      orderDate: poForm.orderDate,
      expectedDelivery: poForm.expectedDelivery,
      status: poForm.status,
      items: poForm.items,
      totalAmount,
      notes: poForm.notes,
    };

    savePOs([newPO, ...purchaseOrders]);
    toast({ title: 'Purchase Order Created', description: `PO ${newPO.id} created successfully` });
    resetPOForm();
    setIsPODialogOpen(false);
  };

  const handleUpdatePO = () => {
    if (!editingPO) return;

    const totalAmount = poForm.items.reduce((sum, item) => sum + (item.quantity * item.price * 100), 0);
    const vendor = vendors.find(v => v.id === poForm.vendorId);

    const updated = purchaseOrders.map(po =>
      po.id === editingPO.id
        ? {
            ...po,
            vendorId: poForm.vendorId,
            vendorName: vendor?.name || po.vendorName,
            orderDate: poForm.orderDate,
            expectedDelivery: poForm.expectedDelivery,
            status: poForm.status,
            items: poForm.items,
            totalAmount,
            notes: poForm.notes,
          }
        : po
    );

    savePOs(updated);
    toast({ title: 'Purchase Order Updated', description: 'Changes saved successfully' });
    resetPOForm();
    setIsEditPOOpen(false);
    setEditingPO(null);
  };

  const handleDeletePO = (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    
    savePOs(purchaseOrders.filter(po => po.id !== id));
    toast({ title: 'Purchase Order Deleted', description: 'PO removed successfully' });
  };

  const openEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPOForm({
      vendorId: po.vendorId,
      orderDate: po.orderDate,
      expectedDelivery: po.expectedDelivery || '',
      status: po.status as 'pending' | 'confirmed' | 'delivered' | 'cancelled',
      items: po.items,
      notes: po.notes || '',
    });
    setIsEditPOOpen(true);
  };

  const resetPOForm = () => {
    setPOForm({
      vendorId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
      status: 'pending',
      items: [{ name: '', quantity: 1, price: 0 }],
      notes: '',
    });
  };

  const addPOItem = () => {
    setPOForm({
      ...poForm,
      items: [...poForm.items, { name: '', quantity: 1, price: 0 }],
    });
  };

  const removePOItem = (index: number) => {
    setPOForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index),
    });
  };

  const updatePOItem = (index: number, field: string, value: any) => {
    const updated = [...poForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setPOForm({ ...poForm, items: updated });
  };

  // Filters
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || vendor.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || vendor.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || po.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'delivered':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>;
      case 'inactive':
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Inactive</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = VENDOR_CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : Package;
  };

  // Stats
  const activeVendors = vendors.filter(v => v.status === 'active').length;
  const totalPOValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const pendingPOs = purchaseOrders.filter(po => po.status === 'pending').length;

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
          <h1 className="text-3xl font-bold text-slate-900">Vendor Management</h1>
          <p className="text-slate-600 mt-1">Manage suppliers and purchase orders</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Vendors</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{activeVendors}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-slate-600">Total PO Value</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatPrice(totalPOValue)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-slate-600">Pending Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{pendingPOs}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
        </TabsList>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
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
                  placeholder="Search vendors..."
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
                    {VENDOR_CATEGORIES.map(cat => (
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => {
                    resetVendorForm();
                    setIsAddVendorOpen(true);
                  }}
                  className="bg-gradient-to-r from-brand-500 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Building2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No vendors found</h3>
              <p className="mt-2 text-sm text-slate-600">
                {vendors.length === 0
                  ? 'Start by adding your first vendor'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredVendors.map((vendor, index) => {
                  const Icon = getCategoryIcon(vendor.category);
                  const category = VENDOR_CATEGORIES.find(c => c.value === vendor.category);
                  
                  return (
                    <motion.div
                      key={vendor.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-brand-100 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-brand-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{vendor.name}</h3>
                            <p className="text-xs text-slate-500">{category?.label}</p>
                          </div>
                        </div>
                        {getStatusBadge(vendor.status)}
                      </div>

                      <div className="space-y-2 mb-4">
                        {vendor.contactPerson && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="h-4 w-4" />
                            <span>{vendor.contactPerson}</span>
                          </div>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{vendor.email}</span>
                          </div>
                        )}
                        {vendor.paymentTerms && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CreditCard className="h-4 w-4" />
                            <span>{vendor.paymentTerms}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < vendor.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditVendor(vendor)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
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
                  placeholder="Search purchase orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {ORDER_STATUS.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => {
                    resetPOForm();
                    setIsPODialogOpen(true);
                  }}
                  className="bg-gradient-to-r from-brand-500 to-purple-600"
                  disabled={vendors.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create PO
                </Button>
              </div>
            </div>
          </motion.div>

          {/* PO List */}
          {filteredPOs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No purchase orders</h3>
              <p className="mt-2 text-sm text-slate-600">
                {vendors.length === 0
                  ? 'Add vendors first to create purchase orders'
                  : 'Create your first purchase order'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">PO ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPOs.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{po.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{po.vendorName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          {formatPrice(po.totalAmount)}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(po.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditPO(po)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePO(po.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={isAddVendorOpen || isEditVendorOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddVendorOpen(false);
          setIsEditVendorOpen(false);
          setEditingVendor(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={vendorForm.category} onValueChange={(value) => setVendorForm({ ...vendorForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={vendorForm.contactPerson}
                  onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={vendorForm.address}
                onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={vendorForm.city}
                  onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={vendorForm.state}
                  onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={vendorForm.pincode}
                  onChange={(e) => setVendorForm({ ...vendorForm, pincode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  value={vendorForm.gst}
                  onChange={(e) => setVendorForm({ ...vendorForm, gst: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={vendorForm.paymentTerms} onValueChange={(value) => setVendorForm({ ...vendorForm, paymentTerms: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(term => (
                      <SelectItem key={term} value={term}>{term}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={vendorForm.rating}
                  onChange={(e) => setVendorForm({ ...vendorForm, rating: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={vendorForm.status} onValueChange={(value: 'active' | 'inactive') => setVendorForm({ ...vendorForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={vendorForm.notes}
                onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsAddVendorOpen(false);
              setIsEditVendorOpen(false);
              setEditingVendor(null);
            }}>
              Cancel
            </Button>
            <Button onClick={editingVendor ? handleUpdateVendor : handleAddVendor}>
              {editingVendor ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit PO Dialog */}
      <Dialog open={isPODialogOpen || isEditPOOpen} onOpenChange={(open) => {
        if (!open) {
          setIsPODialogOpen(false);
          setIsEditPOOpen(false);
          setEditingPO(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendor">Vendor *</Label>
                <Select value={poForm.vendorId} onValueChange={(value) => setPOForm({ ...poForm, vendorId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.filter(v => v.status === 'active').map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={poForm.status} onValueChange={(value: any) => setPOForm({ ...poForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={poForm.orderDate}
                  onChange={(e) => setPOForm({ ...poForm, orderDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                <Input
                  id="expectedDelivery"
                  type="date"
                  value={poForm.expectedDelivery}
                  onChange={(e) => setPOForm({ ...poForm, expectedDelivery: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPOItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {poForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updatePOItem(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => updatePOItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price (₹)"
                        value={item.price}
                        onChange={(e) => updatePOItem(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      {poForm.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePOItem(index)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="po-notes">Notes</Label>
              <Textarea
                id="po-notes"
                value={poForm.notes}
                onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(poForm.items.reduce((sum, item) => sum + (item.quantity * item.price * 100), 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setIsPODialogOpen(false);
              setIsEditPOOpen(false);
              setEditingPO(null);
            }}>
              Cancel
            </Button>
            <Button onClick={editingPO ? handleUpdatePO : handleAddPO}>
              {editingPO ? 'Save Changes' : 'Create PO'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
