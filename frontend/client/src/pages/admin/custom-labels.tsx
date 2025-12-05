import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Save,
  RotateCcw,
  Tag,
  LayoutGrid,
  Calendar,
  Settings,
  Users,
  FileText,
  Package,
  ShoppingCart,
  Building2,
  CreditCard,
  Award,
  DollarSign,
  TrendingUp,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface CustomLabel {
  key: string;
  label: string;
  defaultValue: string;
  icon: any;
  category: string;
  description: string;
}

const DEFAULT_LABELS: CustomLabel[] = [
  // Core System Labels
  { key: 'workspace', label: 'Workspace (One)', defaultValue: 'Workspace', icon: Building2, category: 'Core System', description: 'Single workspace term' },
  { key: 'workspaces', label: 'Workspaces (Many)', defaultValue: 'Workspaces', icon: Building2, category: 'Core System', description: 'Multiple workspaces term' },
  { key: 'eventType', label: 'Event Type (One)', defaultValue: 'Interview', icon: Calendar, category: 'Core System', description: 'Single event type term' },
  { key: 'eventTypes', label: 'Event Types (Many)', defaultValue: 'Interviews', icon: Calendar, category: 'Core System', description: 'Multiple event types term' },
  { key: 'user', label: 'User (One)', defaultValue: 'Recruiter', icon: Users, category: 'Core System', description: 'Single user term' },
  { key: 'users', label: 'Users (Many)', defaultValue: 'Recruiters', icon: Users, category: 'Core System', description: 'Multiple users term' },
  { key: 'resource', label: 'Resource (One)', defaultValue: 'Resource', icon: Package, category: 'Core System', description: 'Single resource term' },
  { key: 'resources', label: 'Resources (Many)', defaultValue: 'Resources', icon: Package, category: 'Core System', description: 'Multiple resources term' },
  
  // Navigation Labels
  { key: 'dashboard', label: 'Dashboard', defaultValue: 'Dashboard', icon: LayoutGrid, category: 'Navigation', description: 'Main dashboard navigation label' },
  { key: 'appointments', label: 'Appointments', defaultValue: 'Appointments', icon: Calendar, category: 'Navigation', description: 'Appointments/bookings section' },
  { key: 'workflows', label: 'Workflows', defaultValue: 'Workflows', icon: Settings, category: 'Navigation', description: 'Workflows automation section' },
  { key: 'teamMembers', label: 'Team Members', defaultValue: 'Team Members', icon: Users, category: 'Navigation', description: 'Team members or staff section' },
  { key: 'salespersons', label: 'Salespersons', defaultValue: 'Salespersons', icon: UserCheck, category: 'Navigation', description: 'Salespersons management' },
  { key: 'bookingPages', label: 'Booking Pages', defaultValue: 'Booking Pages', icon: FileText, category: 'Navigation', description: 'Booking pages configuration' },
  { key: 'customers', label: 'Customers', defaultValue: 'Customers', icon: Users, category: 'Navigation', description: 'Customer management section' },
  { key: 'invoices', label: 'Invoices', defaultValue: 'Invoices', icon: FileText, category: 'Navigation', description: 'Invoices and billing' },
  { key: 'pos', label: 'POS', defaultValue: 'POS', icon: ShoppingCart, category: 'Navigation', description: 'Point of Sale system' },
  { key: 'adminCenter', label: 'Admin Center', defaultValue: 'Admin Center', icon: Settings, category: 'Navigation', description: 'Admin center/settings' },
  
  // Items Section
  { key: 'services', label: 'Services', defaultValue: 'Services', icon: Sparkles, category: 'Items', description: 'Services offered' },
  { key: 'products', label: 'Products', defaultValue: 'Products', icon: Package, category: 'Items', description: 'Products catalog' },
  
  // Accounts Section
  { key: 'income', label: 'Income', defaultValue: 'Income', icon: TrendingUp, category: 'Accounts', description: 'Income tracking' },
  { key: 'expenses', label: 'Expenses', defaultValue: 'Expenses', icon: DollarSign, category: 'Accounts', description: 'Expenses tracking' },
  { key: 'balanceSheet', label: 'Balance Sheet', defaultValue: 'Balance Sheet', icon: FileText, category: 'Accounts', description: 'Financial balance sheet' },
  { key: 'vendorManagement', label: 'Vendor Management', defaultValue: 'Vendor Management', icon: Building2, category: 'Accounts', description: 'Vendor management system' },
  
  // Loyalty Section
  { key: 'memberships', label: 'Memberships', defaultValue: 'Memberships', icon: Award, category: 'Loyalty', description: 'Membership programs' },
  
  // Other Common Terms
  { key: 'appointment', label: 'Appointment', defaultValue: 'Appointment', icon: Calendar, category: 'General', description: 'Single appointment term' },
  { key: 'customer', label: 'Customer', defaultValue: 'Customer', icon: Users, category: 'General', description: 'Single customer term' },
  { key: 'service', label: 'Service', defaultValue: 'Service', icon: Sparkles, category: 'General', description: 'Single service term' },
  { key: 'product', label: 'Product', defaultValue: 'Product', icon: Package, category: 'General', description: 'Single product term' },
  { key: 'staff', label: 'Staff', defaultValue: 'Staff', icon: Users, category: 'General', description: 'Staff member term' },
  { key: 'invoice', label: 'Invoice', defaultValue: 'Invoice', icon: CreditCard, category: 'General', description: 'Single invoice term' },
];

export default function CustomLabelsPage() {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadLabels();
  }, []);

  const loadLabels = () => {
    const savedLabels = localStorage.getItem('custom_labels');
    if (savedLabels) {
      setLabels(JSON.parse(savedLabels));
    } else {
      // Initialize with defaults
      const defaultLabels: Record<string, string> = {};
      DEFAULT_LABELS.forEach(item => {
        defaultLabels[item.key] = item.defaultValue;
      });
      setLabels(defaultLabels);
    }
  };

  const handleLabelChange = (key: string, value: string) => {
    setLabels(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem('custom_labels', JSON.stringify(labels));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('custom-labels-updated', { detail: labels }));
    
    toast({
      title: 'Labels Saved',
      description: 'Custom labels have been updated successfully',
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaultLabels: Record<string, string> = {};
    DEFAULT_LABELS.forEach(item => {
      defaultLabels[item.key] = item.defaultValue;
    });
    setLabels(defaultLabels);
    setHasChanges(true);
    toast({
      title: 'Labels Reset',
      description: 'All labels have been reset to defaults',
    });
  };

  const filteredLabels = DEFAULT_LABELS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedLabels = filteredLabels.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CustomLabel[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Tag className="h-8 w-8 text-purple-600" />
              Custom Labels
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Customize system labels to match your business terminology
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Personalize Your Dashboard</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Change how menu items, buttons, and sections are labeled throughout the system. 
                  For example, change "Appointments" to "Bookings" or "Team Members" to "Employees" 
                  to match your business language.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search labels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Labels by Category */}
        {Object.entries(groupedLabels).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-xl">{category}</CardTitle>
              <CardDescription>
                Customize {category.toLowerCase()} labels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                          <Icon className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={item.key} className="text-sm font-semibold text-gray-900">
                            {item.label}
                          </Label>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          id={item.key}
                          value={labels[item.key] || item.defaultValue}
                          onChange={(e) => handleLabelChange(item.key, e.target.value)}
                          placeholder={item.defaultValue}
                          className="font-medium"
                        />
                        {labels[item.key] !== item.defaultValue && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <span className="text-xs text-purple-600 font-medium">Modified</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Save Button at Bottom */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button 
              onClick={handleSave}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 shadow-2xl"
            >
              <Save className="mr-2 h-5 w-5" />
              Save All Changes
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
