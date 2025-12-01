import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Clock, DollarSign, Tag, MoreVertical, Sparkles, Search, Link2, Copy, Check, Upload, FileSpreadsheet, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  actualPrice?: string; // Original/MRP price
  offerPrice?: string; // Discounted/selling price
  barcode?: string; // Barcode for scanner
  currency: string;
  description: string;
  category: string;
  isEnabled: boolean;
  createdAt: string;
  // Package-specific fields (optional)
  packageServices?: string[];
  originalPrice?: string;
  discount?: string;
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'AED', symbol: 'د.إ', flag: '🇦🇪' },
];

const getCurrencySymbol = (code: string) => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency?.symbol || '₹';
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageServices, setPackageServices] = useState<string[]>([]);
  const [packageDiscount, setPackageDiscount] = useState('10');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    actualPrice: '',
    offerPrice: '',
    barcode: '',
    currency: 'INR',
    description: '',
    category: '',
  });

  const categories = ['Spa & Wellness', 'Beauty & Salon', 'Fitness & Training', 'Consultation', 'Treatment', 'Workshop', 'Other'];

  // CSV Template Download Function
  const downloadCSVTemplate = () => {
    const headers = [
      'Service Name',
      'Service Price (₹)',
      'Duration (mins)',
      'Category',
      'Description/Notes'
    ];
    
    const sampleData = [
      ['Swedish Massage', '2500', '60', 'Spa & Wellness', 'Relaxing full body massage'],
      ['Facial Treatment', '1500', '45', 'Beauty & Salon', 'Deep cleansing facial'],
      ['Haircut & Styling', '800', '30', 'Beauty & Salon', 'Professional haircut'],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ];

    // Create clean CSV content with title, customer info, and services table
    let csvContent = 'BULK SERVICES IMPORT\n';
    csvContent += '\n';
    csvContent += 'Customer Name,Customer Email,Customer Phone\n';
    csvContent += 'John Doe,john@example.com,9876543210\n';
    csvContent += '\n';
    csvContent += headers.join(',') + '\n';
    sampleData.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Bulk_Services_Import_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '📥 Template Downloaded',
      description: 'Single customer bulk services template - Apply green fill to header row & set font size 28',
      duration: 5000,
    });
  };

  // Parse CSV File
  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      console.log('CSV file content:', text);
      
      const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      console.log('Parsed lines:', lines);
      
      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV file must contain headers and at least one data row',
          variant: 'destructive',
        });
        return;
      }

      const data = [];
      let customerInfo: any = null;
      let serviceHeaderIndex = -1;

      // Find the service header row and customer info
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim());
        console.log(`Line ${i}:`, values);
        
        // Check if this is customer info row
        if (values[0] === 'Customer Name' && i + 1 < lines.length) {
          const customerValues = lines[i + 1].split(',').map(v => v.trim());
          customerInfo = {
            'Customer Name': customerValues[0] || '',
            'Customer Email': customerValues[1] || '',
            'Customer Phone': customerValues[2] || ''
          };
          continue;
        }
        
        // Check if this is the service header row
        if (values[0] === 'Service Name' || values.some(v => v.toLowerCase().includes('service'))) {
          serviceHeaderIndex = i;
          const headers = values;
          
          // Parse service rows
          for (let j = i + 1; j < lines.length; j++) {
            const serviceValues = lines[j].split(',').map(v => v.trim());
            if (serviceValues[0] && serviceValues[0] !== '') {
              const row: any = customerInfo ? { ...customerInfo } : {};
              headers.forEach((header, index) => {
                row[header] = serviceValues[index] || '';
              });
              data.push(row);
            }
          }
          break;
        }
      }

      if (data.length === 0) {
        console.log('No data found after parsing');
        toast({
          title: 'No Data Found',
          description: 'CSV file does not contain valid data rows. Please check the format.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Parsed data:', data);
      setImportedData(data);
      toast({
        title: '✅ CSV Parsed Successfully',
        description: `Found ${data.length} service entries ready to import`,
      });
    };

    reader.onerror = () => {
      toast({
        title: 'File Read Error',
        description: 'Failed to read the CSV file',
        variant: 'destructive',
      });
    };

    reader.readAsText(file);
  };

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
        return;
      }
      console.log('Parsing CSV file:', file.name);
      setCsvFile(file);
      parseCSVFile(file);
    }
  };

  // Process and import CSV data
  const processBulkImport = (directToPOS: boolean = false) => {
    console.log('processBulkImport called with directToPOS:', directToPOS);
    console.log('importedData:', importedData);
    
    if (importedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please upload a CSV file first',
        variant: 'destructive',
      });
      return;
    }

    const newServices: Service[] = [];
    const errors: string[] = [];

    // Extract customer info - it's in all rows now
    let customerInfo = { name: '', email: '', phone: '' };
    
    if (importedData.length > 0 && importedData[0]['Customer Name']) {
      customerInfo = {
        name: importedData[0]['Customer Name'] || '',
        email: importedData[0]['Customer Email'] || '',
        phone: importedData[0]['Customer Phone'] || ''
      };
    }

    // Process service rows (all rows have customer info, just check for Service Name)
    importedData.forEach((row, index) => {
      // Validate required fields
      if (!row['Service Name'] || !row['Service Price (₹)']) {
        return; // Skip empty rows
      }

      const duration = row['Duration (mins)'] || '30';
      const category = row['Category'] || 'Other';

      const newService: Service = {
        id: `bulk-${Date.now()}-${index}`,
        name: row['Service Name'],
        duration: `${duration} mins`,
        price: row['Service Price (₹)'],
        currency: 'INR',
        description: row['Description/Notes'] || `Service for ${customerInfo.name || 'customer'}`,
        category: category,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      };

      newServices.push(newService);
    });

    if (errors.length > 0) {
      toast({
        title: 'Import Errors',
        description: errors.join(', '),
        variant: 'destructive',
      });
    }

    if (newServices.length > 0) {
      saveServices([...services, ...newServices]);
      
      if (directToPOS) {
        // Extract customer info from first row
        const custInfo = importedData.length > 0 ? {
          name: importedData[0]['Customer Name'] || '',
          email: importedData[0]['Customer Email'] || '',
          phone: importedData[0]['Customer Phone'] || ''
        } : { name: '', email: '', phone: '' };

        console.log('Customer info:', custInfo);
        console.log('New services before conversion:', newServices);

        // Store data for POS with prices in cents
        const servicesForPOS = newServices.map(svc => ({
          ...svc,
          price: Math.round(parseFloat(svc.price) * 100) // Convert to cents
        }));

        console.log('Services for POS (with cents):', servicesForPOS);

        const bulkData = {
          services: servicesForPOS,
          customers: [custInfo]
        };
        
        localStorage.setItem('bulk_import_data', JSON.stringify(bulkData));
        console.log('Data stored in localStorage:', bulkData);
        
        // Verify storage
        const verification = localStorage.getItem('bulk_import_data');
        console.log('Verification - data in localStorage:', verification);
        
        // Close dialog first
        setIsBulkImportOpen(false);
        setCsvFile(null);
        setImportedData([]);
        
        toast({
          title: '✅ Services Imported',
          description: `${newServices.length} services added. Redirecting to POS...`,
        });
        
        // Small delay for toast, then navigate
        setTimeout(() => {
          console.log('Navigating to /pos-register');
          setLocation('/pos-register');
        }, 500);
        
        return; // Don't execute the rest
      } else {
        toast({
          title: '✅ Import Successful',
          description: `${newServices.length} services have been added to your catalog`,
        });
      }
      
      setIsBulkImportOpen(false);
      setCsvFile(null);
      setImportedData([]);
    }
  };

  // Recommended service templates
  const recommendedServices: Omit<Service, 'id' | 'createdAt'>[] = [
    // Spa & Wellness
    { name: 'Swedish Massage', duration: '60 mins', price: '2500', currency: 'INR', description: 'Full body relaxation massage with essential oils', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Deep Tissue Massage', duration: '90 mins', price: '3500', currency: 'INR', description: 'Therapeutic massage targeting deep muscle layers', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Hot Stone Therapy', duration: '75 mins', price: '3000', currency: 'INR', description: 'Relaxing massage using heated stones', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Aromatherapy Session', duration: '60 mins', price: '2800', currency: 'INR', description: 'Therapeutic massage with aromatic essential oils', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Body Scrub & Polish', duration: '45 mins', price: '2000', currency: 'INR', description: 'Exfoliating treatment for smooth, glowing skin', category: 'Spa & Wellness', isEnabled: true },
    { name: 'Couples Spa Package', duration: '120 mins', price: '8000', currency: 'INR', description: 'Relaxing spa experience for two', category: 'Spa & Wellness', isEnabled: true },
    
    // Beauty & Salon
    { name: 'Haircut & Styling', duration: '45 mins', price: '800', currency: 'INR', description: 'Professional haircut with styling', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Hair Coloring', duration: '120 mins', price: '4500', currency: 'INR', description: 'Full color treatment with conditioning', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Keratin Treatment', duration: '180 mins', price: '8500', currency: 'INR', description: 'Smoothing and straightening treatment', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Manicure & Pedicure', duration: '60 mins', price: '1200', currency: 'INR', description: 'Complete nail care and polish', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Gel Nails', duration: '45 mins', price: '1000', currency: 'INR', description: 'Long-lasting gel nail application', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Facial Treatment', duration: '60 mins', price: '2500', currency: 'INR', description: 'Deep cleansing and hydrating facial', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Makeup Application', duration: '60 mins', price: '2000', currency: 'INR', description: 'Professional makeup for special occasions', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Eyebrow Threading', duration: '15 mins', price: '100', currency: 'INR', description: 'Precise eyebrow shaping', category: 'Beauty & Salon', isEnabled: true },
    { name: 'Waxing Service', duration: '30 mins', price: '500', currency: 'INR', description: 'Hair removal service', category: 'Beauty & Salon', isEnabled: true },
    
    // Fitness & Training
    { name: 'Personal Training Session', duration: '60 mins', price: '1500', currency: 'INR', description: 'One-on-one fitness training', category: 'Fitness & Training', isEnabled: true },
    { name: 'Group Fitness Class', duration: '45 mins', price: '500', currency: 'INR', description: 'High-energy group workout', category: 'Fitness & Training', isEnabled: true },
    { name: 'Yoga Session', duration: '60 mins', price: '600', currency: 'INR', description: 'Mindful yoga practice for all levels', category: 'Fitness & Training', isEnabled: true },
    { name: 'Pilates Class', duration: '55 mins', price: '800', currency: 'INR', description: 'Core-strengthening pilates workout', category: 'Fitness & Training', isEnabled: true },
    { name: 'Spin Class', duration: '45 mins', price: '600', currency: 'INR', description: 'Indoor cycling workout', category: 'Fitness & Training', isEnabled: true },
    { name: 'HIIT Training', duration: '45 mins', price: '900', currency: 'INR', description: 'High-intensity interval training', category: 'Fitness & Training', isEnabled: true },
    { name: 'Nutrition Consultation', duration: '60 mins', price: '2000', currency: 'INR', description: 'Personalized nutrition planning', category: 'Consultation', isEnabled: true },
    { name: 'Fitness Assessment', duration: '30 mins', price: '1000', currency: 'INR', description: 'Complete fitness evaluation', category: 'Consultation', isEnabled: true },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
    const stored = localStorage.getItem(`zervos_services_${currentWorkspace}`);
    if (stored) {
      setServices(JSON.parse(stored));
    }
  };

  const saveServices = (updatedServices: Service[]) => {
    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
    localStorage.setItem(`zervos_services_${currentWorkspace}`, JSON.stringify(updatedServices));
    setServices(updatedServices);
    // Dispatch event for other components to sync
    window.dispatchEvent(new CustomEvent('services-updated'));
  };

  const handleOpenNew = () => {
    setFormData({ name: '', duration: '', price: '', actualPrice: '', offerPrice: '', barcode: '', currency: 'INR', description: '', category: '' });
    setEditingService(null);
    setIsNewServiceOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setFormData({
      name: service.name,
      duration: service.duration,
      price: service.price,
      actualPrice: service.actualPrice || '',
      offerPrice: service.offerPrice || '',
      barcode: service.barcode || '',
      currency: service.currency,
      description: service.description,
      category: service.category,
    });
    setEditingService(service);
    setIsNewServiceOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.duration || !formData.price || !formData.category) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (editingService) {
      // Update existing service
      const updatedServices = services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...formData }
          : s
      );
      saveServices(updatedServices);
      toast({
        title: 'Service Updated',
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      // Create new service
      const newService: Service = {
        id: Date.now().toString(),
        ...formData,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      };
      saveServices([...services, newService]);
      toast({
        title: 'Service Added',
        description: `${newService.name} has been added successfully.`,
      });
    }
    setIsNewServiceOpen(false);
  };

  const handleDelete = () => {
    if (!deletingService) return;
    
    const updatedServices = services.filter(s => s.id !== deletingService.id);
    saveServices(updatedServices);
    setIsDeleteDialogOpen(false);
    setDeletingService(null);
    toast({
      title: 'Service Deleted',
      description: `${deletingService.name} has been removed.`,
    });
  };

  const handleToggleEnabled = (id: string) => {
    const updatedServices = services.map(s =>
      s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
    );
    saveServices(updatedServices);
  };

  const openDeleteDialog = (service: Service) => {
    setDeletingService(service);
    setIsDeleteDialogOpen(true);
  };

  const copyBookingURL = (serviceId: string, serviceName: string) => {
    const url = `${window.location.origin}/book/${serviceId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(serviceId);
      toast({
        title: 'Booking Link Copied!',
        description: `Share this link for ${serviceName}`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    });
  };

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Services & Packages</h1>
                <p className="text-gray-600 mt-1">Manage your service offerings</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsBulkImportOpen(true)} variant="outline" className="gap-2 border-green-300 text-green-700 hover:bg-green-50">
              <Upload size={18} />
              Import Bulk
            </Button>
            <Button onClick={() => setIsPackageModalOpen(true)} variant="outline" className="gap-2">
              <Tag size={18} />
              Create Package
            </Button>
            <Button onClick={handleOpenNew} className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus size={18} />
              Add Service
            </Button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white border-gray-200 focus:border-purple-400 focus:ring-purple-400"
          />
        </motion.div>

        {/* Services Grid */}
        <AnimatePresence mode="popLayout">
          {filteredServices.length === 0 && services.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <div className="inline-block p-6 bg-white rounded-3xl shadow-lg mb-4">
                <Sparkles className="w-16 h-16 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No services yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first service or load recommended templates</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleOpenNew}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Service
                </Button>
                <Button
                  onClick={() => {
                    const servicesToAdd = recommendedServices.map((service, index) => ({
                      ...service,
                      id: `rec-${Date.now()}-${index}`,
                      createdAt: new Date().toISOString(),
                    }));
                    saveServices(servicesToAdd);
                    toast({
                      title: 'Recommended Services Loaded',
                      description: `${servicesToAdd.length} service templates have been added to your catalog.`,
                    });
                  }}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Load Recommended Services
                </Button>
              </div>
            </motion.div>
          ) : filteredServices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="inline-block p-6 bg-white rounded-3xl shadow-lg mb-4">
                <Search className="w-16 h-16 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No matching services</h3>
              <p className="text-gray-500">Try adjusting your search query</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service, index) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 p-6 ${
                !service.isEnabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                    {service.category === 'Package' && (
                      <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-semibold shadow-sm">
                        ✨ Package
                      </span>
                    )}
                    {!service.isEnabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                    <Tag size={12} />
                    {service.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={service.isEnabled}
                    onCheckedChange={() => handleToggleEnabled(service.id)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(service)}>
                        <Edit size={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(service)}
                        className="text-red-600"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
              )}

              {service.barcode && (
                <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Barcode</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{service.barcode}</p>
                </div>
              )}

              <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700 font-medium">{service.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {service.offerPrice ? (
                        <>
                          <span className="text-gray-900 font-semibold">
                            {getCurrencySymbol(service.currency)}{service.offerPrice}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                            OFFER
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-900 font-semibold">
                          {getCurrencySymbol(service.currency)}{service.price}
                        </span>
                      )}
                      <span className="text-gray-500">({service.currency})</span>
                    </div>
                    {service.actualPrice && service.offerPrice && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 line-through">
                          MRP: {getCurrencySymbol(service.currency)}{service.actualPrice}
                        </span>
                        <span className="text-xs text-green-600 font-semibold">
                          Save {Math.round(((parseFloat(service.actualPrice) - parseFloat(service.offerPrice)) / parseFloat(service.actualPrice)) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`text-sm font-medium ${service.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {service.isEnabled ? '● Active' : '● Disabled'}
                </span>
              </div>

              {/* Booking URL & QR Code */}
              {service.isEnabled && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    onClick={() => copyBookingURL(service.id, service.name)}
                  >
                    {copiedId === service.id ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-600">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 size={14} />
                        <span>Copy Booking Link</span>
                        <Copy size={12} className="ml-auto" />
                      </>
                    )}
                  </Button>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/book/' + service.id)}`}
                    download={`${service.name.replace(/\s+/g, '-')}-QR.png`}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      type="button"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm-2 14h8v-8H3v8zm2-6h4v4H5v-4zm8-10v8h8V3h-8zm6 6h-4V5h4v4zm-6 4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v4h-2v-4zm2-2h2v2h-2v-2zm0-4h2v2h-2v-2z"/>
                      </svg>
                      <span>Download QR Code</span>
                    </Button>
                  </a>
                  <p className="text-xs text-gray-400 mt-2 text-center truncate px-2">
                    /book/{service.id}
                  </p>
                </div>
              )}
            </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Service Form Modal */}
        <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
              <DialogDescription>
                {editingService ? 'Update service details' : 'Add a new bookable service'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  placeholder="Technical Interview"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="60 mins"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actualPrice">Actual Price (MRP)</Label>
                  <Input
                    id="actualPrice"
                    type="number"
                    placeholder="200"
                    value={formData.actualPrice}
                    onChange={(e) => setFormData({ ...formData, actualPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offerPrice">Offer Price (Selling)</Label>
                  <Input
                    id="offerPrice"
                    type="number"
                    placeholder="150"
                    value={formData.offerPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, offerPrice: e.target.value, price: e.target.value })
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Default Price (Fallback)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="150"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Used if no offer price is set</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode (Optional)</Label>
                <Input
                  id="barcode"
                  placeholder="Enter or scan barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500">Scan with barcode scanner for instant entry</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Service description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewServiceOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!formData.name || !formData.duration || !formData.price || !formData.category}
              >
                {editingService ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-600">Delete Service</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            {deletingService && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete <span className="font-bold">{deletingService.name}</span>?
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingService(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Package Dialog */}
        <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Tag className="text-purple-600" size={24} />
                Create Service Package
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Package Name */}
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name *</Label>
                <Input
                  id="packageName"
                  placeholder="e.g., Spa Day Package, Complete Wellness Bundle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Package Description */}
              <div className="space-y-2">
                <Label htmlFor="packageDescription">Description</Label>
                <Textarea
                  id="packageDescription"
                  placeholder="Describe what's included in this package..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Select Services */}
              <div className="space-y-3">
                <Label>Select Services to Include *</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-gray-50">
                  {services
                    .filter(s => s.isEnabled && s.category !== 'Package')
                    .map((service) => (
                      <div key={service.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded transition-colors">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={packageServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPackageServices([...packageServices, service.id]);
                            } else {
                              setPackageServices(packageServices.filter(id => id !== service.id));
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{service.name}</span>
                            <div className="text-sm text-gray-600">
                              <span className="mr-4">{service.duration} min</span>
                              <span className="font-semibold">₹{service.price}</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                </div>
                {packageServices.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Select at least 2 services to create a package</p>
                )}
              </div>

              {/* Discount Percentage */}
              <div className="space-y-2">
                <Label htmlFor="discount">Package Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="10"
                  value={packageDiscount}
                  onChange={(e) => setPackageDiscount(e.target.value)}
                />
                <p className="text-xs text-gray-500">Discount applied to the total of all services</p>
              </div>

              {/* Package Summary */}
              {packageServices.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-purple-900">Package Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Services included:</span>
                      <span className="font-medium">{packageServices.length} services</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total duration:</span>
                      <span className="font-medium">
                        {services
                          .filter(s => packageServices.includes(s.id))
                          .reduce((sum, s) => sum + parseInt(s.duration), 0)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Actual Total Price (MRP):</span>
                      <span className="line-through text-gray-500">
                        ₹{services
                          .filter(s => packageServices.includes(s.id))
                          .reduce((sum, s) => sum + parseFloat(s.actualPrice || s.price), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Discount ({packageDiscount}%):</span>
                      <span className="text-green-600 font-medium">
                        -₹{(services
                          .filter(s => packageServices.includes(s.id))
                          .reduce((sum, s) => sum + parseFloat(s.actualPrice || s.price), 0) * 
                          (parseFloat(packageDiscount) / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-purple-300">
                      <span className="font-semibold text-purple-900">Package Offer Price:</span>
                      <span className="font-bold text-xl text-purple-600">
                        ₹{(services
                          .filter(s => packageServices.includes(s.id))
                          .reduce((sum, s) => sum + parseFloat(s.actualPrice || s.price), 0) * 
                          (1 - parseFloat(packageDiscount) / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPackageModalOpen(false);
                  setPackageServices([]);
                  setPackageDiscount('10');
                  setFormData({
                    name: '',
                    duration: '',
                    price: '',
                    currency: 'INR',
                    description: '',
                    category: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!formData.name.trim()) {
                    toast({
                      title: "Package name required",
                      description: "Please enter a name for your package.",
                      variant: "destructive"
                    });
                    return;
                  }
                  if (packageServices.length < 2) {
                    toast({
                      title: "Select more services",
                      description: "A package must include at least 2 services.",
                      variant: "destructive"
                    });
                    return;
                  }

                  // Calculate package details
                  const selectedServices = services.filter(s => packageServices.includes(s.id));
                  const totalDuration = selectedServices.reduce((sum, s) => sum + parseInt(s.duration), 0);
                  const actualTotalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.actualPrice || s.price), 0);
                  const packageOfferPrice = actualTotalPrice * (1 - parseFloat(packageDiscount) / 100);

                  // Create package as a service
                  const newPackage: Service = {
                    id: Date.now().toString(),
                    name: formData.name,
                    duration: `${totalDuration} mins`,
                    price: packageOfferPrice.toFixed(2),
                    actualPrice: actualTotalPrice.toFixed(2),
                    offerPrice: packageOfferPrice.toFixed(2),
                    currency: 'INR',
                    category: 'Package',
                    description: formData.description || 
                      `Includes: ${selectedServices.map(s => s.name).join(', ')}. Save ${packageDiscount}%!`,
                    isEnabled: true,
                    createdAt: new Date().toISOString(),
                    packageServices: packageServices, // Store included service IDs
                    originalPrice: actualTotalPrice.toFixed(2),
                    discount: packageDiscount
                  };

                  saveServices([...services, newPackage]);
                  setIsPackageModalOpen(false);
                  setPackageServices([]);
                  setPackageDiscount('10');
                  setFormData({
                    name: '',
                    duration: '',
                    price: '',
                    currency: 'INR',
                    description: '',
                    category: '',
                  });

                  toast({
                    title: "Package created!",
                    description: `${newPackage.name} has been added to your services.`
                  });
                }}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!formData.name.trim() || packageServices.length < 2}
              >
                Create Package
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <Upload className="text-white" size={24} />
                </div>
                Bulk Import Services
              </DialogTitle>
              <DialogDescription className="text-base">
                Import multiple services at once using our CSV template. Perfect for adding services for customers taking multiple treatments.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Step 1: Download Template */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600 text-white rounded-full font-bold text-lg flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Download CSV Template</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Get our professionally designed CSV template with sample data and instructions. 
                      The template includes fields for customer details, service information, pricing, and more.
                    </p>
                    <Button 
                      onClick={downloadCSVTemplate}
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <FileSpreadsheet size={18} />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Fill Template */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-600 text-white rounded-full font-bold text-lg flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Fill in Service Details</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Open the downloaded CSV in Excel or Google Sheets and fill in the following columns:
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <span className="font-semibold text-purple-700">📋 Customer Name</span>
                        <p className="text-gray-600 text-xs mt-1">Full name of the customer</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <span className="font-semibold text-purple-700">📧 Email</span>
                        <p className="text-gray-600 text-xs mt-1">Customer email address</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <span className="font-semibold text-purple-700">📱 Phone</span>
                        <p className="text-gray-600 text-xs mt-1">10-digit phone number</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <span className="font-semibold text-purple-700">💼 Service Name</span>
                        <p className="text-gray-600 text-xs mt-1">Name of the service</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <span className="font-semibold text-purple-700">💰 Service Price</span>
                        <p className="text-gray-600 text-xs mt-1">Price in rupees (₹)</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <span className="font-semibold text-purple-700">⏱️ Duration</span>
                        <p className="text-gray-600 text-xs mt-1">Duration in minutes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Upload CSV */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-600 text-white rounded-full font-bold text-lg flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Filled CSV</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Upload your completed CSV file. We'll validate and import all services automatically.
                    </p>
                    
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center bg-white hover:bg-green-50 transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <Upload size={48} className="mx-auto text-green-600 mb-3" />
                        {csvFile ? (
                          <div>
                            <p className="text-lg font-semibold text-green-700 mb-1">✅ {csvFile.name}</p>
                            <p className="text-sm text-gray-600">Click to change file</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg font-semibold text-gray-700 mb-1">Click to upload CSV</p>
                            <p className="text-sm text-gray-500">or drag and drop your file here</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {importedData.length > 0 && (
                      <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-4">
                        <p className="text-sm font-semibold text-green-800">
                          ✅ Successfully parsed {importedData.length} service entries
                        </p>
                        <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                          {importedData.slice(0, 5).map((row, idx) => (
                            <div key={idx} className="py-1 border-b border-green-200 last:border-0">
                              <span className="font-medium">{row['Service Name']}</span> - 
                              <span className="text-gray-700"> ₹{row['Service Price (₹)']} for {row['Customer Name']}</span>
                            </div>
                          ))}
                          {importedData.length > 5 && (
                            <p className="text-gray-600 mt-2">...and {importedData.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkImportOpen(false);
                  setCsvFile(null);
                  setImportedData([]);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => processBulkImport(false)}
                disabled={importedData.length === 0}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
              >
                <Upload size={16} className="mr-2" />
                Import Services
              </Button>
              <Button
                onClick={() => processBulkImport(true)}
                disabled={importedData.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <ShoppingCart size={16} className="mr-2" />
                Import & Bill in POS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
