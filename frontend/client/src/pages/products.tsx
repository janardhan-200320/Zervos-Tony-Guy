import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Package, DollarSign, Tag, MoreVertical, Search, Box, Upload, FileSpreadsheet, ShoppingCart, Check, BarChart3, Download, FileText, PieChart, TrendingUp, AlertTriangle, PackageX, CalendarDays, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
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
import { InlineFeatureGate } from '@/components/FeatureGate';

interface Product {
  id: string;
  name: string;
  price: string;
  actualPrice?: string; // Original/MRP price
  offerPrice?: string; // Discounted/selling price
  barcode?: string; // Barcode for scanner
  currency: string;
  description: string;
  category: string;
  sku: string;
  stock: string;
  isEnabled: boolean;
  createdAt: string;
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [productsReportPeriod, setProductsReportPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customProductsReportDates, setCustomProductsReportDates] = useState({ from: '', to: '' });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    actualPrice: '',
    offerPrice: '',
    barcode: '',
    currency: 'INR',
    description: '',
    category: '',
    sku: '',
    stock: '',
  });

  const defaultCategories = ['Spa Products', 'Hair Care', 'Skin Care', 'Makeup', 'Fitness Equipment', 'Supplements', 'Retail', 'Other'];

  // Combine default and custom categories
  const categories = [...defaultCategories, ...customCategories];

  // Load custom categories from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('zervos_custom_product_categories');
    if (savedCategories) {
      setCustomCategories(JSON.parse(savedCategories));
    }
  }, []);

  // Save custom category
  const addCustomCategory = () => {
    if (customCategoryName.trim() && !categories.includes(customCategoryName.trim())) {
      const newCategories = [...customCategories, customCategoryName.trim()];
      setCustomCategories(newCategories);
      localStorage.setItem('zervos_custom_product_categories', JSON.stringify(newCategories));
      setFormData({ ...formData, category: customCategoryName.trim() });
      setCustomCategoryName('');
      setIsCustomCategory(false);
      toast({
        title: '✅ Category Added',
        description: `"${customCategoryName.trim()}" has been added to categories`,
      });
    }
  };

  // Filter products by time period
  const getFilteredProductsByPeriod = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (productsReportPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = customProductsReportDates.from ? new Date(customProductsReportDates.from) : new Date(0);
        endDate = customProductsReportDates.to ? new Date(customProductsReportDates.to) : now;
        break;
      default:
        startDate = new Date(0);
    }

    return products.filter(product => {
      const productDate = new Date(product.createdAt);
      return productDate >= startDate && productDate <= endDate;
    });
  };

  // Generate Products Report
  const generateProductsReport = () => {
    const filteredProducts = getFilteredProductsByPeriod();
    const enabledProducts = filteredProducts.filter(p => p.isEnabled);
    const disabledProducts = filteredProducts.filter(p => !p.isEnabled);
    const totalStock = filteredProducts.reduce((sum, p) => sum + parseInt(p.stock || '0'), 0);
    const totalInventoryValue = filteredProducts.reduce((sum, p) => sum + (parseInt(p.stock || '0') * parseFloat(p.price || '0')), 0);
    const lowStockProducts = filteredProducts.filter(p => parseInt(p.stock || '0') <= 10 && parseInt(p.stock || '0') > 0);
    const outOfStockProducts = filteredProducts.filter(p => parseInt(p.stock || '0') === 0);

    // Period label
    const periodLabel = productsReportPeriod === 'today' ? "Today's" :
      productsReportPeriod === 'week' ? 'Weekly' :
        productsReportPeriod === 'month' ? 'Monthly' :
          productsReportPeriod === 'year' ? 'Yearly' : 'Custom Range';

    // Category breakdown
    const categoryStats = categories.map(cat => {
      const catProducts = filteredProducts.filter(p => p.category === cat);
      const catStock = catProducts.reduce((sum, p) => sum + parseInt(p.stock || '0'), 0);
      const catValue = catProducts.reduce((sum, p) => sum + (parseInt(p.stock || '0') * parseFloat(p.price || '0')), 0);
      return {
        name: cat,
        count: catProducts.length,
        stock: catStock,
        inventoryValue: catValue,
        percentage: filteredProducts.length > 0 ? Math.round((catProducts.length / filteredProducts.length) * 100) : 0,
      };
    }).filter(cat => cat.count > 0);

    const prices = filteredProducts.map(p => parseFloat(p.price || '0'));
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const lowestPrice = prices.length > 0 ? Math.min(...prices.filter(p => p > 0)) : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    if (outOfStockProducts.length > 0) {
      recommendations.push(`🚨 ${outOfStockProducts.length} product(s) are out of stock - immediate reorder required!`);
    }
    if (lowStockProducts.length > 0) {
      recommendations.push(`⚠️ ${lowStockProducts.length} product(s) have low stock (≤10 units) - consider reordering soon`);
    }
    const categoriesWithProducts = categoryStats.filter(c => c.count > 0);
    if (categoriesWithProducts.length < 3) {
      recommendations.push(`💡 Consider diversifying - add products in more categories to expand offerings`);
    }
    if (filteredProducts.length > 0 && disabledProducts.length / filteredProducts.length > 0.3) {
      recommendations.push(`📊 ${Math.round(disabledProducts.length / filteredProducts.length * 100)}% of products are disabled - review and enable or remove`);
    }

    return {
      period: periodLabel,
      summary: {
        totalProducts: filteredProducts.length,
        enabledProducts: enabledProducts.length,
        disabledProducts: disabledProducts.length,
        totalStock,
        totalInventoryValue,
        averagePrice: avgPrice,
        highestPrice,
        lowestPrice,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      categoryBreakdown: categoryStats,
      lowStockProducts: lowStockProducts.map(p => ({
        name: p.name,
        stock: parseInt(p.stock || '0'),
        sku: p.sku,
        category: p.category,
        price: parseFloat(p.price || '0'),
      })),
      outOfStockProducts: outOfStockProducts.map(p => ({
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: parseFloat(p.price || '0'),
      })),
      allProducts: filteredProducts.map(p => ({
        name: p.name,
        category: p.category,
        price: parseFloat(p.price || '0'),
        stock: parseInt(p.stock || '0'),
        sku: p.sku,
        enabled: p.isEnabled,
        inventoryValue: parseInt(p.stock || '0') * parseFloat(p.price || '0'),
      })),
      recommendations,
    };
  };

  // Download Report in different formats
  const downloadReport = (format: 'csv' | 'pdf' | 'excel') => {
    const report = generateProductsReport();
    const date = new Date().toLocaleDateString('en-IN');
    const businessName = localStorage.getItem('zervos_business_name') || 'Business';

    if (format === 'csv' || format === 'excel') {
      let csvContent = '';

      // Summary Section
      csvContent += `${businessName} - Products Report\n`;
      csvContent += `Generated on: ${date}\n\n`;
      csvContent += `SUMMARY\n`;
      csvContent += `Total Products,${report.summary.totalProducts}\n`;
      csvContent += `Enabled Products,${report.summary.enabledProducts}\n`;
      csvContent += `Disabled Products,${report.summary.disabledProducts}\n`;
      csvContent += `Total Stock Units,${report.summary.totalStock}\n`;
      csvContent += `Total Inventory Value,₹${report.summary.totalInventoryValue.toLocaleString()}\n`;
      csvContent += `Average Price,₹${report.summary.averagePrice}\n`;
      csvContent += `Highest Price,₹${report.summary.highestPrice}\n`;
      csvContent += `Lowest Price,₹${report.summary.lowestPrice}\n`;
      csvContent += `Low Stock Products,${report.summary.lowStockCount}\n`;
      csvContent += `Out of Stock Products,${report.summary.outOfStockCount}\n\n`;

      // Category Breakdown
      csvContent += `CATEGORY BREAKDOWN\n`;
      csvContent += `Category,Products,Stock,Inventory Value,%\n`;
      report.categoryBreakdown.forEach(cat => {
        csvContent += `${cat.name},${cat.count},${cat.stock},₹${cat.inventoryValue.toLocaleString()},${cat.percentage}%\n`;
      });
      csvContent += '\n';

      // Out of Stock Alert
      if (report.outOfStockProducts.length > 0) {
        csvContent += `OUT OF STOCK - REORDER IMMEDIATELY\n`;
        csvContent += `Product Name,SKU,Category,Price\n`;
        report.outOfStockProducts.forEach(p => {
          csvContent += `${p.name},${p.sku},${p.category},₹${p.price}\n`;
        });
        csvContent += '\n';
      }

      // Low Stock Warning
      if (report.lowStockProducts.length > 0) {
        csvContent += `LOW STOCK WARNING (≤10 units)\n`;
        csvContent += `Product Name,SKU,Stock,Category,Price\n`;
        report.lowStockProducts.forEach(p => {
          csvContent += `${p.name},${p.sku},${p.stock},${p.category},₹${p.price}\n`;
        });
        csvContent += '\n';
      }

      // All Products
      csvContent += `ALL PRODUCTS\n`;
      csvContent += `Product Name,Category,Price,Stock,SKU,Status,Inventory Value\n`;
      report.allProducts.forEach(p => {
        csvContent += `${p.name},${p.category},₹${p.price},${p.stock},${p.sku},${p.enabled ? 'Active' : 'Inactive'},₹${p.inventoryValue.toLocaleString()}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${businessName}_Products_Report_${date}.${format === 'excel' ? 'xls' : 'csv'}`;
      link.click();

      toast({ title: `📊 ${format.toUpperCase()} Report Downloaded!`, description: `Products report saved successfully` });
    }

    if (format === 'pdf') {
      const doc = new jsPDF();
      let y = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text(`${businessName}`, 20, y);
      y += 10;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Products Inventory Report', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${date}`, 20, y);
      y += 15;

      // Summary
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Total Products: ${report.summary.totalProducts}`, 25, y);
      y += 6;
      doc.text(`Total Stock Units: ${report.summary.totalStock}`, 25, y);
      y += 6;
      doc.text(`Total Inventory Value: Rs.${report.summary.totalInventoryValue.toLocaleString()}`, 25, y);
      y += 6;
      doc.text(`Average Price: Rs.${report.summary.averagePrice}`, 25, y);
      y += 10;

      // Stock Alerts
      if (report.summary.outOfStockCount > 0 || report.summary.lowStockCount > 0) {
        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38);
        doc.text('Stock Alerts', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        if (report.summary.outOfStockCount > 0) {
          doc.text(`Out of Stock: ${report.summary.outOfStockCount} products (URGENT)`, 25, y);
          y += 6;
        }
        if (report.summary.lowStockCount > 0) {
          doc.text(`Low Stock (≤10 units): ${report.summary.lowStockCount} products`, 25, y);
          y += 6;
        }
        y += 5;
      }

      // Categories
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Category Breakdown', 20, y);
      y += 8;
      doc.setFontSize(10);
      report.categoryBreakdown.slice(0, 8).forEach(cat => {
        doc.text(`${cat.name}: ${cat.count} products, ${cat.stock} units, Rs.${cat.inventoryValue.toLocaleString()}`, 25, y);
        y += 6;
      });
      y += 5;

      // Recommendations
      if (report.recommendations.length > 0) {
        doc.setFontSize(14);
        doc.text('Recommendations', 20, y);
        y += 8;
        doc.setFontSize(9);
        report.recommendations.forEach(rec => {
          const cleanRec = rec.replace(/[🚨⚠️💡📊]/g, '');
          doc.text(`- ${cleanRec}`, 25, y);
          y += 6;
        });
      }

      doc.save(`${businessName}_Products_Report_${date}.pdf`);
      toast({ title: '📄 PDF Report Downloaded!', description: 'Products inventory report saved as PDF' });
    }
  };

  // CSV Template Download Function
  const downloadCSVTemplate = () => {
    const headers = [
      'Product Name',
      'Product Price (₹)',
      'SKU',
      'Stock Quantity',
      'Category',
      'Description/Notes'
    ];

    const sampleData = [
      ['Hair Serum', '1100', 'HAIR-101', '50', 'Hair Care', 'Premium anti-frizz serum'],
      ['Face Cream', '1300', 'SKIN-201', '75', 'Skin Care', 'Moisturizing day cream'],
      ['Body Lotion', '850', 'SKIN-202', '60', 'Skin Care', 'Hydrating body lotion'],
      ['Shampoo', '600', 'HAIR-102', '100', 'Hair Care', 'Professional shampoo'],
      ['Protein Powder', '1900', 'SUP-001', '40', 'Supplements', 'Whey protein isolate'],
    ];

    // Create styled CSV content - This is a clean CSV for Excel
    let csvContent = '';
    csvContent += headers.join(',') + '\n';
    sampleData.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    // Add empty rows for user to fill
    for (let i = 0; i < 10; i++) {
      csvContent += ',,,,,' + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Products_Bulk_Import_Template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '📥 Template Downloaded!',
      description: 'Open in Excel → Select header row → Apply bold & green background. Fill your products and upload!',
      duration: 6000,
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
      let headerIndex = -1;

      // Find the product header row
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        console.log(`Line ${i}:`, values);

        // Check if this is the product header row (starts with Product Name)
        if (values[0] === 'Product Name' || values[0].toLowerCase().includes('product name')) {
          headerIndex = i;
          const headers = values;

          // Parse product rows
          for (let j = i + 1; j < lines.length; j++) {
            const productValues = lines[j].split(',').map(v => v.trim().replace(/"/g, ''));
            if (productValues[0] && productValues[0] !== '') {
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = productValues[index] || '';
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
        description: `Found ${data.length} product entries ready to import`,
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

  // Process and import CSV data - Always navigates to POS after import
  const processBulkImport = () => {
    console.log('processBulkImport called');
    console.log('importedData:', importedData);

    if (importedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please upload a CSV file first',
        variant: 'destructive',
      });
      return;
    }

    const newProducts: Product[] = [];

    // Process product rows
    importedData.forEach((row, index) => {
      if (!row['Product Name'] || !row['Product Price (₹)']) {
        return; // Skip empty rows
      }

      const category = row['Category'] || 'Other';
      const sku = row['SKU'] || `PROD-${Date.now()}-${index}`;
      const stock = row['Stock Quantity'] || '0';

      const newProduct: Product = {
        id: `bulk-${Date.now()}-${index}`,
        name: row['Product Name'],
        price: row['Product Price (₹)'],
        currency: 'INR',
        description: row['Description/Notes'] || '',
        category: category,
        sku: sku,
        stock: stock,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      };

      newProducts.push(newProduct);
    });

    if (newProducts.length > 0) {
      saveProducts([...products, ...newProducts]);

      // Store data for POS with prices in cents
      const productsForPOS = newProducts.map(prod => ({
        ...prod,
        price: Math.round(parseFloat(prod.price) * 100) // Convert to cents
      }));

      const bulkData = {
        services: productsForPOS,
        type: 'products'
      };

      localStorage.setItem('bulk_import_data', JSON.stringify(bulkData));

      // Close dialog first
      setIsBulkImportOpen(false);
      setCsvFile(null);
      setImportedData([]);

      toast({
        title: '✅ Products Imported Successfully!',
        description: `${newProducts.length} products added. Opening POS for billing...`,
      });

      // Navigate to POS
      setTimeout(() => {
        setLocation('/pos-register');
      }, 500);
    }
  };

  // Recommended product templates loaded from `sample-retail.csv`
  const recommendedProducts: Omit<Product, 'id' | 'createdAt'>[] = [
    { name: 'ELEMENTS 2.0 CALM SERUM 100ML', price: '1900', currency: 'INR', description: '', category: 'WELLA', sku: '200', stock: '0', isEnabled: true },
    { name: 'ELEMENTS 2.0 CALM SHAMPOO 250ML', price: '1250', currency: 'INR', description: '', category: 'WELLA', sku: '201', stock: '0', isEnabled: true },
    { name: 'ELEMENTS 2.0 COND 200ml', price: '1350', currency: 'INR', description: '', category: 'WELLA', sku: '202', stock: '0', isEnabled: true },
    { name: 'ELEMENTS 2.0 MASK 150ml', price: '1400', currency: 'INR', description: '', category: 'WELLA', sku: '203', stock: '0', isEnabled: true },
    { name: 'ELEMENTS 2.0 SHAMPOO 250ML', price: '1250', currency: 'INR', description: '', category: 'WELLA', sku: '204', stock: '0', isEnabled: true },
    { name: 'ELEMENTS 2.0 SPRAY 150ml', price: '1850', currency: 'INR', description: '', category: 'WELLA', sku: '205', stock: '0', isEnabled: true },
    { name: 'WP FUSION COND 200ML', price: '1300', currency: 'INR', description: '', category: 'WELLA', sku: '206', stock: '0', isEnabled: true },
    { name: 'WP FUSION MASK 150ML', price: '1350', currency: 'INR', description: '', category: 'WELLA', sku: '207', stock: '0', isEnabled: true },
    { name: 'WP FUSION SHP 250ML', price: '1200', currency: 'INR', description: '', category: 'WELLA', sku: '208', stock: '0', isEnabled: true },
    { name: 'NUTRICURLS COND 200ml', price: '1350', currency: 'INR', description: '', category: 'WELLA', sku: '209', stock: '0', isEnabled: true },
    { name: 'NUTRICURLS MASK 150ML', price: '1400', currency: 'INR', description: '', category: 'WELLA', sku: '210', stock: '0', isEnabled: true },
    { name: 'NUTRICURLS SHAMPOO 250ML', price: '1250', currency: 'INR', description: '', category: 'WELLA', sku: '211', stock: '0', isEnabled: true },
    { name: 'WP OIL REF COND 200ML', price: '1350', currency: 'INR', description: '', category: 'WELLA', sku: '212', stock: '0', isEnabled: true },
    { name: 'WP OIL REF MASK 150ml', price: '1250', currency: 'INR', description: '', category: 'WELLA', sku: '213', stock: '0', isEnabled: true },
    { name: 'WP OIL REF SHP 250ml', price: '1250', currency: 'INR', description: '', category: 'WELLA', sku: '214', stock: '0', isEnabled: true },
    { name: 'WP OIL REFLECTN SERUM100ML', price: '1400', currency: 'INR', description: '', category: 'WELLA', sku: '215', stock: '0', isEnabled: true },
    { name: 'WP OIL REFLECTNS SERUM 30ML', price: '750', currency: 'INR', description: '', category: 'WELLA', sku: '216', stock: '0', isEnabled: true },
    { name: 'SP BALANCE SCALP LOTION 125ML', price: '1350', currency: 'INR', description: '', category: 'SYSPROF', sku: '217', stock: '0', isEnabled: true },
    { name: 'SP BALANCE SCALP MASK 200ML', price: '2000', currency: 'INR', description: '', category: 'SYSPROF', sku: '218', stock: '0', isEnabled: true },
    { name: 'SP BALANCE SCALP SHMP 250ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '219', stock: '0', isEnabled: true },
    { name: 'SP CLEAR SCALP SHMP 250ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '220', stock: '0', isEnabled: true },
    { name: 'SP COLOR SAVE COND 200ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '221', stock: '0', isEnabled: true },
    { name: 'SP COLOR SAVE MASK 200ML', price: '2000', currency: 'INR', description: '', category: 'SYSPROF', sku: '222', stock: '0', isEnabled: true },
    { name: 'SP COLOR SAVE SHMP 250ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '223', stock: '0', isEnabled: true },
    { name: 'SP COND HYDRATE 200ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '224', stock: '0', isEnabled: true },
    { name: 'SP HYDRATE MASK 200ML', price: '2000', currency: 'INR', description: '', category: 'SYSPROF', sku: '225', stock: '0', isEnabled: true },
    { name: 'SP HYDRATE SHMP 250ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '226', stock: '0', isEnabled: true },
    { name: 'SP LUXE KER PRTCT SHMP 200ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '227', stock: '0', isEnabled: true },
    { name: 'SP LUXE KER REST TRM MASK 150ML', price: '2000', currency: 'INR', description: '', category: 'SYSPROF', sku: '228', stock: '0', isEnabled: true },
    { name: 'SP LUXE OIL 100ML', price: '3300', currency: 'INR', description: '', category: 'SYSPROF', sku: '229', stock: '0', isEnabled: true },
    { name: 'SP LUXE OIL 30ML', price: '1200', currency: 'INR', description: '', category: 'SYSPROF', sku: '230', stock: '0', isEnabled: true },
    { name: 'SP REPAIR COND 200ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '231', stock: '0', isEnabled: true },
    { name: 'SP REPAIR MASK 200ML', price: '2000', currency: 'INR', description: '', category: 'SYSPROF', sku: '232', stock: '0', isEnabled: true },
    { name: 'SP REPAIR SHAMPOO 250ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '233', stock: '0', isEnabled: true },
    { name: 'SP SMOOTHEN COND 200ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '234', stock: '0', isEnabled: true },
    { name: 'SP SMOOTHEN SHMP 250ML', price: '1600', currency: 'INR', description: '', category: 'SYSPROF', sku: '235', stock: '0', isEnabled: true },
    { name: 'SP VOLUMIZE SHMP 250ML', price: '1800', currency: 'INR', description: '', category: 'SYSPROF', sku: '236', stock: '0', isEnabled: true },
    { name: 'SP DIA ALPHA ENERGY 100ML', price: '6000', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '237', stock: '0', isEnabled: true },
    { name: 'SP DIA BAL ENERGY SER 100ML', price: '5650', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '238', stock: '0', isEnabled: true },
    { name: 'SP DIA BAL MSK 200ML', price: '2900', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '239', stock: '0', isEnabled: true },
    { name: 'SP DIA BAL SHP 250ML', price: '2250', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '240', stock: '0', isEnabled: true },
    { name: 'SP DIA BALANCE LOTION 125ML', price: '2300', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '241', stock: '0', isEnabled: true },
    { name: 'SP DIA CLR SAVE CND 200ML', price: '2500', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '242', stock: '0', isEnabled: true },
    { name: 'SP DIA CLR SAVE MSK 200ML', price: '2900', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '243', stock: '0', isEnabled: true },
    { name: 'SP DIA CLR SAVE SHP 250ML', price: '2050', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '244', stock: '0', isEnabled: true },
    { name: 'SP DIA HYDRATE CND 200ML', price: '2500', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '245', stock: '0', isEnabled: true },
    { name: 'SP DIA HYDRATE MSK 200ML', price: '2900', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '246', stock: '0', isEnabled: true },
    { name: 'SP DIA HYDRATE SHP 250ML', price: '2100', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '247', stock: '0', isEnabled: true },
    { name: 'SP DIA LIQUID HAIR 100ML', price: '5500', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '248', stock: '0', isEnabled: true },
    { name: 'SP DIA LUXE K- CND 200ML', price: '2500', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '249', stock: '0', isEnabled: true },
    { name: 'SP DIA LUXE KERA MASK 200ML', price: '3150', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '250', stock: '0', isEnabled: true },
    { name: 'SP DIA LUXE KERA SHMP 250ML', price: '2100', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '251', stock: '0', isEnabled: true },
    { name: 'SP DIA LUXEOIL 100 ML', price: '3500', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '252', stock: '0', isEnabled: true },
    { name: 'SP DIA LUXEOIL 30ML', price: '1200', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '253', stock: '0', isEnabled: true },
    { name: 'SP DIA PURIFY LOTION 125ML', price: '2300', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '254', stock: '0', isEnabled: true },
    { name: 'SP DIA PURIFY MSK 200ML', price: '2900', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '255', stock: '0', isEnabled: true },
    { name: 'SP DIA PURIFY SHP 250ML M', price: '2250', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '256', stock: '0', isEnabled: true },
    { name: 'SP DIA REPAIR CND 200ML', price: '2500', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '257', stock: '0', isEnabled: true },
    { name: 'SP DIA SMOOTHEN CND 200ML', price: '2600', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '258', stock: '0', isEnabled: true },
    { name: 'SP DIA REPAIR MSK 200ML', price: '2900', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '259', stock: '0', isEnabled: true },
    { name: 'SP DIA REPAIR SHP 250ML', price: '2250', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '260', stock: '0', isEnabled: true },
    { name: 'SP DIA SMOOTHEN MSK 200ML', price: '2900', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '261', stock: '0', isEnabled: true },
    { name: 'SP DIA SMOOTHEN SHP 250ML', price: '2250', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '262', stock: '0', isEnabled: true },
    { name: 'SP DIA VOLUMIZE MSK 200ML', price: '2900', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '263', stock: '0', isEnabled: true },
    { name: 'SP DIA VOLUMIZE SHP 250ML', price: '2250', currency: 'INR', description: '', category: 'SYSPROF DIA', sku: '264', stock: '0', isEnabled: true },
    { name: 'WP ULTIME REPAIR REPAIRING SHAMPOO 250ML', price: '1800', currency: 'INR', description: '', category: 'ULTIME REPAIR', sku: '265', stock: '0', isEnabled: true },
    { name: 'WP ULTIME REPAIR REPAIRING DAILY COND 150ML', price: '1600', currency: 'INR', description: '', category: 'ULTIME REPAIR', sku: '266', stock: '0', isEnabled: true },
    { name: 'WP ULTIME REPAIR REPAIRING INTENSE MASK 150ML', price: '2500', currency: 'INR', description: '', category: 'ULTIME REPAIR', sku: '267', stock: '0', isEnabled: true },
    { name: 'WP ULTIME REPAIR MIRACLE HAIR RESCUE 30ML', price: '1050', currency: 'INR', description: '', category: 'ULTIME REPAIR', sku: '268', stock: '0', isEnabled: true },
    { name: 'WP ULTIME REPAIR MIRACLE HAIR RESCUE 95ML', price: '3000', currency: 'INR', description: '', category: 'ULTIME REPAIR', sku: '269', stock: '0', isEnabled: true },
    { name: 'WP ULTIME REPAIR MIRACLE OVERNIGHT HAIR TRMNT 95ML', price: '3000', currency: 'INR', description: '', category: 'ULTIME REPAIR', sku: '270', stock: '0', isEnabled: true },
    { name: 'QOD ARGAN SHAMPOO 300 ML', price: '1650', currency: 'INR', description: '', category: 'QOD PROFESSIONAL', sku: '271', stock: '0', isEnabled: true },
    { name: 'QOD ARGAN CONDITIONER 300 ML', price: '1650', currency: 'INR', description: '', category: 'QOD PROFESSIONAL', sku: '272', stock: '0', isEnabled: true },
    { name: 'REVIVER HAIR REPAIR SHAMPOO 250 ML', price: '1575', currency: 'INR', description: '', category: 'DE FABULOUS', sku: '273', stock: '0', isEnabled: true },
    { name: 'REVIVER HAIR REPAIR CONDITIONER 250 ML', price: '1575', currency: 'INR', description: '', category: 'DE FABULOUS', sku: '274', stock: '0', isEnabled: true },
    { name: 'ABSOLUT REPAIR MOLECULAR SHAMPOO 300 ML', price: '1490', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '275', stock: '0', isEnabled: true },
    { name: 'ABSOLUT REPAIR MOLECULAR RINSE OFF SERUM 250 ML', price: '1600', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '276', stock: '0', isEnabled: true },
    { name: 'ABSOLUT REPAIR MOLECULAR MASK 250 ML', price: '1600', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '277', stock: '0', isEnabled: true },
    { name: 'SCALP ADVANCED ANTI GRASS OILINESS SHAMPOO 300 ML', price: '990', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '278', stock: '0', isEnabled: true },
    { name: 'SCALP ADVANCED ANTI DANDRUFF SHAMPOO 300 ML', price: '990', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '279', stock: '0', isEnabled: true },
    { name: 'SCALP ADVANCED ANTI GRASS OILINESS 2 IN 1 CLAY 250 ML', price: '1150', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '280', stock: '0', isEnabled: true },
    { name: 'PRO LONGER SHAMPOO 300 ML', price: '745', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '281', stock: '0', isEnabled: true },
    { name: 'PRO LONGER MASK 250 ML', price: '920', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '282', stock: '0', isEnabled: true },
    { name: 'METAL DX SHAMPOO 300 ML', price: '1490', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '283', stock: '0', isEnabled: true },
    { name: 'METAL DX MASK 250 ML', price: '1600', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '284', stock: '0', isEnabled: true },
    { name: 'SE ABSOLUT REPAIR SHAMPOO 300 ML', price: '845', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '285', stock: '0', isEnabled: true },
    { name: 'SE ABSOLUT REPAIR MASK 250 ML', price: '990', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '286', stock: '0', isEnabled: true },
    { name: 'SE ABSOLUT REPAIR OIL 90 ML', price: '1390', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '287', stock: '0', isEnabled: true },
    { name: 'LISS UNLIMITED SHAMPOO 300 ML', price: '790', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '288', stock: '0', isEnabled: true },
    { name: 'LISS UNLIMITED MASK 250 ML', price: '990', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '289', stock: '0', isEnabled: true },
    { name: 'LISS UNLIMITED SERUM 125 ML', price: '890', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '290', stock: '0', isEnabled: true },
    { name: 'VITAMINO COLOR SHAMPOO 300 ML', price: '790', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '291', stock: '0', isEnabled: true },
    { name: 'VITAMINO COLOR MASK 250 ML', price: '990', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '292', stock: '0', isEnabled: true },
    { name: 'VITAMINO COLOR SPECTRUM SHAMPOO 300 ML', price: '1490', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '293', stock: '0', isEnabled: true },
    { name: 'VITAMINO COLOR SPECTRUM MASK 250 ML', price: '1600', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '294', stock: '0', isEnabled: true },
    { name: 'CURL EXPRESSION SHAMPOO 300 ML', price: '1490', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '295', stock: '0', isEnabled: true },
    { name: 'CURL EXPRESSION CREAM 200 ML', price: '1490', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '296', stock: '0', isEnabled: true },
    { name: 'CURL EXPRESSION MASK 250 ML', price: '1600', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '297', stock: '0', isEnabled: true },
    { name: 'INFORCER SHAMPOO 300 ML', price: '790', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '298', stock: '0', isEnabled: true },
    { name: 'INFORCER MASK 250 ML', price: '990', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '299', stock: '0', isEnabled: true },
    { name: 'SILVER SHAMPOO 300 ML', price: '790', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '300', stock: '0', isEnabled: true },
    { name: 'XTENSO CARE PRO KERATIN BLUE SHAMPOO 250 ML', price: '690', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '301', stock: '0', isEnabled: true },
    { name: 'XTENSO CARE PRO KERATIN BLUE MASQUE 196 ML', price: '770', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '302', stock: '0', isEnabled: true },
    { name: 'XTENSO CARE PRO SULPHATE FREE SHAMPOO 250 ML', price: '1100', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '303', stock: '0', isEnabled: true },
    { name: 'XTENSO CARE PRO SULPHATE FREE MASQUE 196 ML', price: '1290', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '304', stock: '0', isEnabled: true },
    { name: 'XTENSO CARE SERUM50 ML', price: '750', currency: 'INR', description: '', category: 'LOREAL PROFESSIONEL', sku: '305', stock: '0', isEnabled: true },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
    const stored = localStorage.getItem(`zervos_products_${currentWorkspace}`);
    if (stored) {
      setProducts(JSON.parse(stored));
    }
  };

  const saveProducts = (updatedProducts: Product[]) => {
    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
    localStorage.setItem(`zervos_products_${currentWorkspace}`, JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
    // Dispatch event for other components to sync
    window.dispatchEvent(new CustomEvent('products-updated'));
  };

  const handleOpenNew = () => {
    setFormData({ name: '', price: '', actualPrice: '', offerPrice: '', barcode: '', currency: 'INR', description: '', category: '', sku: '', stock: '' });
    setEditingProduct(null);
    setIsNewProductOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price,
      actualPrice: product.actualPrice || '',
      offerPrice: product.offerPrice || '',
      barcode: product.barcode || '',
      currency: product.currency,
      description: product.description,
      category: product.category,
      sku: product.sku,
      stock: product.stock,
    });
    setEditingProduct(product);
    setIsNewProductOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (editingProduct) {
      // Update existing product
      const updatedProducts = products.map(p =>
        p.id === editingProduct.id
          ? { ...p, ...formData }
          : p
      );
      saveProducts(updatedProducts);
      toast({
        title: 'Product Updated',
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      // Create new product
      const newProduct: Product = {
        id: Date.now().toString(),
        ...formData,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      };
      saveProducts([...products, newProduct]);
      toast({
        title: 'Product Added',
        description: `${newProduct.name} has been added successfully.`,
      });
    }
    setIsNewProductOpen(false);
  };

  const handleDelete = () => {
    if (!deletingProduct) return;

    const updatedProducts = products.filter(p => p.id !== deletingProduct.id);
    saveProducts(updatedProducts);
    setIsDeleteDialogOpen(false);
    setDeletingProduct(null);
    toast({
      title: 'Product Deleted',
      description: `${deletingProduct.name} has been removed.`,
    });
  };

  const handleToggleEnabled = (id: string) => {
    const updatedProducts = products.map(p =>
      p.id === id ? { ...p, isEnabled: !p.isEnabled } : p
    );
    saveProducts(updatedProducts);
  };

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
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
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <p className="text-gray-600 mt-1">Manage your product inventory</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                  <BarChart3 size={18} />
                  Reports
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => { setProductsReportPeriod('today'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Today's Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setProductsReportPeriod('week'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Weekly Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setProductsReportPeriod('month'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Monthly Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setProductsReportPeriod('year'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Yearly Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setProductsReportPeriod('custom'); setIsReportsOpen(true); }}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Custom Range
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsBulkImportOpen(true)} variant="outline" className="gap-2 border-green-300 text-green-700 hover:bg-green-50">
              <Upload size={18} />
              Import Bulk
            </Button>
            <Button onClick={handleOpenNew} className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus size={18} />
              Add Custom Product
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
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </motion.div>

        {/* Products Grid */}
        <AnimatePresence mode="popLayout">
          {filteredProducts.length === 0 && products.length === 0 ? (
            <>
              {(() => {
                const productsToAdd = recommendedProducts.map((product, index) => ({
                  ...product,
                  id: `rec-${Date.now()}-${index}`,
                  createdAt: new Date().toISOString(),
                }));
                saveProducts(productsToAdd);
                return null;
              })()}
            </>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="inline-block p-6 bg-white rounded-3xl shadow-lg mb-4">
                <Search className="w-16 h-16 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No matching products</h3>
              <p className="text-gray-500">Try adjusting your search query</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 p-6 ${!product.isEnabled ? 'opacity-60' : ''
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                        {!product.isEnabled && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            Disabled
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        <Tag size={12} />
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.isEnabled}
                        onCheckedChange={() => handleToggleEnabled(product.id)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                            <Edit size={16} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(product)}
                            className="text-red-600"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  )}

                  {product.barcode && (
                    <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Barcode</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">{product.barcode}</p>
                    </div>
                  )}

                  <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                    {product.sku && (
                      <div className="flex items-center gap-2 text-sm">
                        <Box className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-500">SKU:</span>
                        <span className="text-gray-700 font-medium">{product.sku}</span>
                      </div>
                    )}
                    {product.stock && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-500">Stock:</span>
                        <span className="text-gray-700 font-medium">{product.stock} units</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {product.offerPrice ? (
                            <>
                              <span className="text-gray-900 font-semibold">
                                {getCurrencySymbol(product.currency)}{product.offerPrice}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                                OFFER
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-900 font-semibold">
                              {getCurrencySymbol(product.currency)}{product.price}
                            </span>
                          )}
                          <span className="text-gray-500">({product.currency})</span>
                        </div>
                        {product.actualPrice && product.offerPrice && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 line-through">
                              MRP: {getCurrencySymbol(product.currency)}{product.actualPrice}
                            </span>
                            <span className="text-xs text-green-600 font-semibold">
                              Save {Math.round(((parseFloat(product.actualPrice) - parseFloat(product.offerPrice)) / parseFloat(product.actualPrice)) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className={`text-sm font-medium ${product.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {product.isEnabled ? '● Active' : '● Disabled'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Product Form Modal */}
        <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product details' : 'Add a new product to your inventory'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <Label htmlFor="price">Default Price (Fallback) *</Label>
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
                <Label htmlFor="category">Category *</Label>
                {!isCustomCategory ? (
                  <Select
                    value={formData.category}
                    onValueChange={(val) => {
                      if (val === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setFormData({ ...formData, category: val });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-orange-600 font-medium border-t mt-1 pt-2">
                        <span className="flex items-center gap-2">
                          <Plus size={14} /> Add Custom Category
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom category name"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
                      autoFocus
                    />
                    <Button type="button" onClick={addCustomCategory} size="sm" className="bg-orange-600 hover:bg-orange-700">
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCustomCategory(false);
                        setCustomCategoryName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="PROD-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="100"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
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
                  placeholder="Product description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewProductOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.price || !formData.category}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-600">Delete Product</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            {deletingProduct && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete <span className="font-bold">{deletingProduct.name}</span>?
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingProduct(null);
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

        {/* Bulk Import Dialog */}
        <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 rounded-2xl shadow-lg">
                  <Upload className="text-white" size={28} />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Bulk Import Products
                  </span>
                  <p className="text-sm font-normal text-gray-500 mt-1">Quick & Easy CSV Import</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Step 1: Download Template */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">📥 Download CSV Template</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get our ready-to-use template with sample data. Open in Excel and apply styling for professional look!
                    </p>
                    <div className="bg-white/80 rounded-xl p-3 mb-4 border border-blue-100">
                      <p className="text-xs text-blue-700 font-medium">💡 Pro Tip: In Excel, select header row → Home → Fill Color → Orange for attractive table look!</p>
                    </div>
                    <Button
                      onClick={downloadCSVTemplate}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 shadow-md"
                    >
                      <FileSpreadsheet size={18} />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Fill Template */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">✏️ Fill in Your Products</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">📦</span>
                        <span className="font-bold text-gray-800">Product Name</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., Hair Serum</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">💰</span>
                        <span className="font-bold text-gray-800">Price (₹)</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., 1100</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">🏷️</span>
                        <span className="font-bold text-gray-800">SKU</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., HAIR-101</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">📊</span>
                        <span className="font-bold text-gray-800">Stock</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., 50</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">📁</span>
                        <span className="font-bold text-gray-800">Category</span>
                        <p className="text-gray-500 text-xs mt-1">e.g., Hair Care</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm hover:border-amber-300 transition-colors">
                        <span className="text-2xl block mb-1">📝</span>
                        <span className="font-bold text-gray-800">Description</span>
                        <p className="text-gray-500 text-xs mt-1">Brief info</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Upload CSV */}
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">📤 Upload & Import to POS</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload your CSV and we'll automatically import products and open POS for billing!
                    </p>

                    <div className="border-3 border-dashed border-emerald-300 rounded-2xl p-6 text-center bg-white/80 hover:bg-emerald-50 transition-all cursor-pointer group">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload-products"
                      />
                      <label htmlFor="csv-upload-products" className="cursor-pointer block">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload size={32} className="text-emerald-600" />
                        </div>
                        {csvFile ? (
                          <div>
                            <p className="text-lg font-bold text-emerald-700 mb-1">✅ {csvFile.name}</p>
                            <p className="text-sm text-gray-500">Click to change file</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg font-bold text-gray-700 mb-1">Drop CSV here or Click to Upload</p>
                            <p className="text-sm text-gray-500">Supports .csv files</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {importedData.length > 0 && (
                      <div className="mt-4 bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300 rounded-xl p-4 shadow-inner">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check size={18} className="text-white" />
                          </div>
                          <p className="font-bold text-emerald-800">
                            {importedData.length} Products Ready to Import!
                          </p>
                        </div>
                        <div className="bg-white rounded-lg overflow-hidden border border-emerald-200">
                          <div className="grid grid-cols-4 gap-2 p-2 bg-orange-500 text-white text-xs font-bold">
                            <span>Product</span>
                            <span>Price</span>
                            <span>SKU</span>
                            <span>Stock</span>
                          </div>
                          <div className="max-h-32 overflow-y-auto">
                            {importedData.slice(0, 5).map((row, idx) => (
                              <div key={idx} className="grid grid-cols-4 gap-2 p-2 text-xs border-b border-emerald-100 last:border-0 hover:bg-orange-50">
                                <span className="font-medium text-gray-800 truncate">{row['Product Name']}</span>
                                <span className="text-emerald-700">₹{row['Product Price (₹)']}</span>
                                <span className="text-gray-600">{row['SKU']}</span>
                                <span className="text-gray-600">{row['Stock Quantity']}</span>
                              </div>
                            ))}
                          </div>
                          {importedData.length > 5 && (
                            <p className="text-xs text-center py-2 text-gray-500 bg-gray-50">
                              +{importedData.length - 5} more products
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t">
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
                onClick={processBulkImport}
                disabled={importedData.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 shadow-lg gap-2 text-base py-5"
              >
                <ShoppingCart size={20} />
                Import Products & Open POS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Products Report Dialog */}
        <Dialog open={isReportsOpen} onOpenChange={setIsReportsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
                  <span>Products Inventory Report</span>
                  <span className="text-sm font-normal text-gray-500 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${productsReportPeriod === 'today' ? 'bg-blue-100 text-blue-700' :
                        productsReportPeriod === 'week' ? 'bg-green-100 text-green-700' :
                          productsReportPeriod === 'month' ? 'bg-purple-100 text-purple-700' :
                            productsReportPeriod === 'year' ? 'bg-amber-100 text-amber-700' :
                              'bg-pink-100 text-pink-700'
                      }`}>
                      {productsReportPeriod === 'today' ? "Today's Report" :
                        productsReportPeriod === 'week' ? 'Weekly Report' :
                          productsReportPeriod === 'month' ? 'Monthly Report' :
                            productsReportPeriod === 'year' ? 'Yearly Report' :
                              'Custom Range'}
                    </span>
                  </span>
                </div>
              </DialogTitle>
              <DialogDescription>
                Comprehensive analysis of your product inventory with stock alerts
              </DialogDescription>
            </DialogHeader>

            {/* Custom Date Range Picker */}
            {productsReportPeriod === 'custom' && (
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CalendarDays className="text-pink-600" size={18} />
                  Select Custom Date Range
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">From Date</Label>
                    <Input
                      type="date"
                      value={customProductsReportDates.from}
                      onChange={(e) => setCustomProductsReportDates(prev => ({ ...prev, from: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">To Date</Label>
                    <Input
                      type="date"
                      value={customProductsReportDates.to}
                      onChange={(e) => setCustomProductsReportDates(prev => ({ ...prev, to: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const report = generateProductsReport();
              return (
                <div className="space-y-6 py-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="text-blue-600" size={20} />
                        <span className="text-sm text-gray-600">Total Products</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700">{report.summary.totalProducts}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Box className="text-emerald-600" size={20} />
                        <span className="text-sm text-gray-600">Total Stock</span>
                      </div>
                      <p className="text-3xl font-bold text-emerald-700">{report.summary.totalStock.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="text-purple-600" size={20} />
                        <span className="text-sm text-gray-600">Inventory Value</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-700">₹{report.summary.totalInventoryValue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-amber-600" size={20} />
                        <span className="text-sm text-gray-600">Avg Price</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-700">₹{report.summary.averagePrice}</p>
                    </div>
                  </div>

                  {/* Stock Alerts */}
                  {(report.summary.outOfStockCount > 0 || report.summary.lowStockCount > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.summary.outOfStockCount > 0 && (
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-300">
                          <div className="flex items-center gap-2 mb-3">
                            <PackageX className="text-red-600" size={22} />
                            <span className="font-bold text-red-700">Out of Stock Alert</span>
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold ml-auto">
                              {report.summary.outOfStockCount} products
                            </span>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {report.outOfStockProducts.slice(0, 5).map((p, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-2 text-sm border border-red-200 flex justify-between">
                                <span className="font-medium text-gray-800">{p.name}</span>
                                <span className="text-gray-500">{p.sku}</span>
                              </div>
                            ))}
                            {report.outOfStockProducts.length > 5 && (
                              <p className="text-xs text-red-600 text-center">+{report.outOfStockProducts.length - 5} more</p>
                            )}
                          </div>
                        </div>
                      )}
                      {report.summary.lowStockCount > 0 && (
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-300">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="text-amber-600" size={22} />
                            <span className="font-bold text-amber-700">Low Stock Warning</span>
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold ml-auto">
                              {report.summary.lowStockCount} products
                            </span>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {report.lowStockProducts.slice(0, 5).map((p, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-2 text-sm border border-amber-200 flex justify-between">
                                <span className="font-medium text-gray-800">{p.name}</span>
                                <span className="text-amber-600 font-bold">{p.stock} left</span>
                              </div>
                            ))}
                            {report.lowStockProducts.length > 5 && (
                              <p className="text-xs text-amber-600 text-center">+{report.lowStockProducts.length - 5} more</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* More Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Enabled</p>
                      <p className="text-xl font-bold text-emerald-600">{report.summary.enabledProducts}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Disabled</p>
                      <p className="text-xl font-bold text-gray-500">{report.summary.disabledProducts}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Highest Price</p>
                      <p className="text-xl font-bold text-gray-800">₹{report.summary.highestPrice}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border shadow-sm">
                      <p className="text-sm text-gray-500">Lowest Price</p>
                      <p className="text-xl font-bold text-gray-800">₹{report.summary.lowestPrice}</p>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3">
                      <h3 className="font-bold flex items-center gap-2">
                        <PieChart size={18} />
                        Category Breakdown
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Products</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Stock</th>
                            <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Inventory Value</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.categoryBreakdown.map((cat, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{cat.count}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{cat.stock.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-600">₹{cat.inventoryValue.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {cat.percentage}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* All Products Table */}
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3">
                      <h3 className="font-bold flex items-center gap-2">
                        <FileText size={18} />
                        All Products Details
                      </h3>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600">Product</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600">SKU</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600">Category</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Price</th>
                            <th className="text-center px-3 py-2 font-semibold text-gray-600">Stock</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Inv Value</th>
                            <th className="text-center px-3 py-2 font-semibold text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.allProducts.map((p, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                              <td className="px-3 py-2 text-gray-500">{p.sku}</td>
                              <td className="px-3 py-2 text-gray-600">{p.category}</td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-600">₹{p.price}</td>
                              <td className={`px-3 py-2 text-center font-medium ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-gray-600'}`}>
                                {p.stock}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600">₹{p.inventoryValue.toLocaleString()}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {p.enabled ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {report.recommendations.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        💡 Recommendations & Actions
                      </h3>
                      <ul className="space-y-2">
                        {report.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-500 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Download Buttons */}
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Download size={18} />
                      Download Report
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => downloadReport('csv')}
                        variant="outline"
                        className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        <FileSpreadsheet size={18} />
                        Download CSV
                      </Button>
                      <Button
                        onClick={() => downloadReport('excel')}
                        variant="outline"
                        className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <FileSpreadsheet size={18} />
                        Download Excel
                      </Button>
                      <Button
                        onClick={() => downloadReport('pdf')}
                        variant="outline"
                        className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <FileText size={18} />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReportsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
