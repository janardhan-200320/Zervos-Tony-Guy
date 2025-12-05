import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  ArrowLeft,
  Store,
  BarChart3,
  Users,
  DollarSign,
  Package,
  Calendar,
  Eye,
  Settings,
  Check
} from 'lucide-react';
import { useLocation } from 'wouter';

interface Branch {
  id: string;
  name: string;
  initials: string;
  color: string;
  email: string;
  description: string;
  status: 'Active' | 'Inactive';
  bookingLink: string;
  prefix: string;
  maxDigits: number;
  type: 'main' | 'branch';
  branchCode: string;
  branchAddress?: string;
  branchPhone?: string;
  branchManager?: string;
  parentBusinessId?: string;
  createdAt?: string;
}

const BRANCH_COLORS = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
];

export default function BranchManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { workspaces, setWorkspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspace();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    branchCode: '',
    branchAddress: '',
    branchPhone: '',
    branchManager: '',
    email: '',
    description: '',
    prefix: 'BR',
    maxDigits: 4,
  });

  useEffect(() => {
    loadBranches();
  }, [workspaces]);

  const loadBranches = () => {
    const allBranches = workspaces as Branch[];
    setBranches(allBranches);
  };

  const handleAddBranch = () => {
    if (!formData.name || !formData.branchCode) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in branch name and code.',
        variant: 'destructive',
      });
      return;
    }

    const newBranch: Branch = {
      id: Date.now().toString(),
      name: formData.name,
      initials: formData.name.substring(0, 2).toUpperCase(),
      color: BRANCH_COLORS[Math.floor(Math.random() * BRANCH_COLORS.length)],
      email: formData.email,
      description: formData.description,
      status: 'Active',
      bookingLink: `${window.location.origin}/book/${formData.branchCode.toLowerCase()}`,
      prefix: formData.prefix,
      maxDigits: formData.maxDigits,
      type: 'branch',
      branchCode: formData.branchCode,
      branchAddress: formData.branchAddress,
      branchPhone: formData.branchPhone,
      branchManager: formData.branchManager,
      parentBusinessId: selectedWorkspace?.id || branches[0]?.id,
      createdAt: new Date().toISOString(),
    };

    const updatedBranches = [...workspaces, newBranch];
    setWorkspaces(updatedBranches);

    toast({
      title: 'Branch Created',
      description: `${formData.name} has been created successfully.`,
    });

    setIsAddBranchOpen(false);
    resetForm();
  };

  const handleUpdateBranch = () => {
    if (!editingBranch || !formData.name || !formData.branchCode) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in branch name and code.',
        variant: 'destructive',
      });
      return;
    }

    const updatedBranches = workspaces.map((branch) => {
      if (branch.id === editingBranch.id) {
        return {
          ...branch,
          name: formData.name,
          initials: formData.name.substring(0, 2).toUpperCase(),
          email: formData.email,
          description: formData.description,
          prefix: formData.prefix,
          maxDigits: formData.maxDigits,
          branchCode: formData.branchCode,
          branchAddress: formData.branchAddress,
          branchPhone: formData.branchPhone,
          branchManager: formData.branchManager,
        } as Branch;
      }
      return branch;
    });

    setWorkspaces(updatedBranches);

    toast({
      title: 'Branch Updated',
      description: `${formData.name} has been updated successfully.`,
    });

    setIsAddBranchOpen(false);
    setIsEditMode(false);
    setEditingBranch(null);
    resetForm();
  };

  const handleDeleteBranch = (branch: Branch) => {
    if (branch.type === 'main') {
      toast({
        title: 'Cannot Delete',
        description: 'Cannot delete the main branch.',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${branch.name}? All data for this branch will remain but the branch will be removed.`)) {
      const updatedBranches = workspaces.filter((b) => b.id !== branch.id);
      setWorkspaces(updatedBranches);

      if (selectedWorkspace?.id === branch.id) {
        setSelectedWorkspace(updatedBranches[0] || null);
      }

      toast({
        title: 'Branch Deleted',
        description: `${branch.name} has been removed.`,
      });
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setIsEditMode(true);
    setFormData({
      name: branch.name,
      branchCode: branch.branchCode || '',
      branchAddress: branch.branchAddress || '',
      branchPhone: branch.branchPhone || '',
      branchManager: branch.branchManager || '',
      email: branch.email,
      description: branch.description,
      prefix: branch.prefix,
      maxDigits: branch.maxDigits,
    });
    setIsAddBranchOpen(true);
  };

  const handleSwitchBranch = (branch: Branch) => {
    setSelectedWorkspace(branch);
    toast({
      title: 'Branch Switched',
      description: `Now viewing ${branch.name}`,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      branchCode: '',
      branchAddress: '',
      branchPhone: '',
      branchManager: '',
      email: '',
      description: '',
      prefix: 'BR',
      maxDigits: 4,
    });
  };

  const getBranchStats = (branchId: string) => {
    // Get stats for each branch
    const customers = JSON.parse(localStorage.getItem(`customers_${branchId}`) || '[]');
    const services = JSON.parse(localStorage.getItem(`zervos_services_${branchId}`) || '[]');
    const products = JSON.parse(localStorage.getItem(`zervos_products_${branchId}`) || '[]');
    const appointments = JSON.parse(localStorage.getItem(`appointments_${branchId}`) || '[]');

    return {
      customers: customers.length,
      services: services.length,
      products: products.length,
      appointments: appointments.length,
    };
  };

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.branchCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.branchAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-purple-600" />
                Branch Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage multiple branches with separate data and operations
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setIsEditMode(false);
              setEditingBranch(null);
              resetForm();
              setIsAddBranchOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Branch
          </Button>
        </div>

        {/* Quick Branch Switcher */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Quick Branch Switcher
            </CardTitle>
            <CardDescription>
              Switch between branches to view and manage their data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleSwitchBranch(branch)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedWorkspace?.id === branch.id
                      ? 'border-purple-500 bg-purple-100 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`${branch.color} flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold flex-shrink-0`}>
                    {branch.initials}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{branch.name}</p>
                    <p className="text-xs text-gray-500">
                      {branch.type === 'main' ? 'Main Branch' : branch.branchCode}
                    </p>
                  </div>
                  {selectedWorkspace?.id === branch.id && (
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search branches by name, code, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Stats Overview */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{branches.length}</div>
              <p className="text-xs text-muted-foreground">
                {branches.filter(b => b.status === 'Active').length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Main Branch</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {branches.find(b => b.type === 'main')?.name || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Primary location</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Branch</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedWorkspace?.name}</div>
              <p className="text-xs text-muted-foreground">Currently viewing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branch Code</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedWorkspace?.branchCode || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Current branch</p>
            </CardContent>
          </Card>
        </div>

        {/* Branch Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredBranches.map((branch, index) => {
              const stats = getBranchStats(branch.id);
              const isCurrentBranch = selectedWorkspace?.id === branch.id;

              return (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`relative ${isCurrentBranch ? 'ring-2 ring-purple-500' : ''}`}>
                    {branch.type === 'main' && (
                      <div className="absolute right-3 top-3">
                        <Badge className="bg-amber-500">Main Branch</Badge>
                      </div>
                    )}
                    {isCurrentBranch && (
                      <div className="absolute left-3 top-3">
                        <Badge className="bg-purple-500">Active</Badge>
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`${branch.color} flex h-12 w-12 items-center justify-center rounded-lg text-white font-bold text-lg`}>
                            {branch.initials}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{branch.name}</CardTitle>
                            <CardDescription className="mt-1">
                              Code: {branch.branchCode || 'N/A'}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Branch Details */}
                      <div className="space-y-2 text-sm">
                        {branch.branchAddress && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <span className="text-gray-600">{branch.branchAddress}</span>
                          </div>
                        )}
                        {branch.branchPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{branch.branchPhone}</span>
                          </div>
                        )}
                        {branch.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{branch.email}</span>
                          </div>
                        )}
                        {branch.branchManager && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Manager: {branch.branchManager}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="text-xs text-gray-500">Customers</div>
                            <div className="font-semibold">{stats.customers}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="text-xs text-gray-500">Appointments</div>
                            <div className="font-semibold">{stats.appointments}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-500" />
                          <div>
                            <div className="text-xs text-gray-500">Services</div>
                            <div className="font-semibold">{stats.services}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-amber-500" />
                          <div>
                            <div className="text-xs text-gray-500">Products</div>
                            <div className="font-semibold">{stats.products}</div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {!isCurrentBranch && (
                          <Button
                            onClick={() => handleSwitchBranch(branch)}
                            className="flex-1"
                            variant="default"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Switch to Branch
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEditBranch(branch)}
                          variant="outline"
                          size="icon"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {branch.type !== 'main' && (
                          <Button
                            onClick={() => handleDeleteBranch(branch)}
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add/Edit Branch Dialog */}
        <Dialog open={isAddBranchOpen} onOpenChange={setIsAddBranchOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Branch' : 'Add New Branch'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? 'Update branch information and settings.'
                  : 'Create a new branch with separate data and operations.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Downtown Branch"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchCode">Branch Code *</Label>
                  <Input
                    id="branchCode"
                    placeholder="e.g., BR001"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchAddress">Branch Address</Label>
                <Input
                  id="branchAddress"
                  placeholder="Full address of the branch"
                  value={formData.branchAddress}
                  onChange={(e) => setFormData({ ...formData, branchAddress: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branchPhone">Branch Phone</Label>
                  <Input
                    id="branchPhone"
                    placeholder="Contact number"
                    value={formData.branchPhone}
                    onChange={(e) => setFormData({ ...formData, branchPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Branch Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="branch@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchManager">Branch Manager</Label>
                <Input
                  id="branchManager"
                  placeholder="Manager name"
                  value={formData.branchManager}
                  onChange={(e) => setFormData({ ...formData, branchManager: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the branch"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Booking Prefix</Label>
                  <Input
                    id="prefix"
                    placeholder="BR"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDigits">Max Digits</Label>
                  <Input
                    id="maxDigits"
                    type="number"
                    value={formData.maxDigits}
                    onChange={(e) => setFormData({ ...formData, maxDigits: parseInt(e.target.value) || 4 })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddBranchOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={isEditMode ? handleUpdateBranch : handleAddBranch}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isEditMode ? 'Update Branch' : 'Create Branch'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
