import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  Package,
  Star,
  TrendingUp,
  Zap,
  Gift,
  Heart,
  Award,
  DollarSign,
  Plus,
  Minus,
  X,
  Search,
  Filter,
  ChevronRight,
  Building2,
  Scissors,
  Palette,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  currency: string;
  category: string;
  isEnabled: boolean;
  popularityScore?: number;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  stock: number;
  image?: string;
}

interface CartItem {
  type: 'service' | 'product' | 'custom';
  id: string;
  name: string;
  price: number;
  quantity: number;
  duration?: string;
  customDetails?: string;
}

export default function UniversalBookingPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const [workspaceName, setWorkspaceName] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'services' | 'products' | 'custom'>('services');
  
  // Custom service form
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServiceDetails, setCustomServiceDetails] = useState('');
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Date & Time selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Load services and products
  useEffect(() => {
    if (!workspaceId) return;

    try {
      // Load workspace name
      const workspacesRaw = localStorage.getItem('workspaces');
      if (workspacesRaw) {
        const workspaces = JSON.parse(workspacesRaw);
        const workspace = workspaces.find((w: any) => w.id === workspaceId);
        if (workspace) {
          setWorkspaceName(workspace.name || 'Business');
        }
      }

      // Load services (show enabled ones, or all if isEnabled is not set)
      const servicesRaw = localStorage.getItem(`zervos_services_${workspaceId}`);
      if (servicesRaw) {
        const parsed = JSON.parse(servicesRaw);
        const servicesList = Array.isArray(parsed) ? parsed : [];
        // Show services that are enabled or don't have isEnabled property
        setServices(servicesList.filter((s: Service) => s.isEnabled !== false));
      }

      // Load products (show products with stock > 0)
      const productsRaw = localStorage.getItem(`zervos_products_${workspaceId}`);
      if (productsRaw) {
        const parsed = JSON.parse(productsRaw);
        const productsList = Array.isArray(parsed) ? parsed : [];
        setProducts(productsList.filter((p: Product) => (p.stock ?? 1) > 0));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [workspaceId]);

  // Generate calendar days
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 35; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentMonth]);

  // Categories
  const serviceCategories = useMemo(() => {
    const cats = new Set(services.map(s => s.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [services]);

  const productCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Filtered items
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Recommendations - Top 6 items (3 services + 3 products)
  const recommendedServices = useMemo(() => {
    return services
      .sort((a, b) => {
        // Prioritize items with popularity score, then by price
        const scoreA = a.popularityScore || 0;
        const scoreB = b.popularityScore || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return parseFloat(b.price || '0') - parseFloat(a.price || '0');
      })
      .slice(0, 3);
  }, [services]);

  const recommendedProducts = useMemo(() => {
    return products
      .sort((a, b) => {
        // Sort by price descending (premium items first)
        return parseFloat(b.price || '0') - parseFloat(a.price || '0');
      })
      .slice(0, 3);
  }, [products]);

  const allRecommendations = useMemo(() => {
    const combined = [
      ...recommendedServices.map(s => ({ ...s, type: 'service' as const })),
      ...recommendedProducts.map(p => ({ ...p, type: 'product' as const }))
    ];
    return combined.slice(0, 6); // Show max 6 recommendations
  }, [recommendedServices, recommendedProducts]);

  // Cart functions
  const addToCart = (item: CartItem) => {
    const existing = cart.find(c => c.id === item.id && c.type === item.type);
    if (existing) {
      setCart(cart.map(c => 
        c.id === item.id && c.type === item.type 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (itemId: string, type: string) => {
    setCart(cart.filter(c => !(c.id === itemId && c.type === type)));
  };

  const updateQuantity = (itemId: string, type: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId, type);
    } else {
      setCart(cart.map(c => 
        c.id === itemId && c.type === type 
          ? { ...c, quantity }
          : c
      ));
    }
  };

  const addServiceToCart = (service: Service) => {
    addToCart({
      type: 'service',
      id: service.id,
      name: service.name,
      price: parseFloat(service.price) || 0,
      quantity: 1,
      duration: service.duration,
    });
  };

  const addProductToCart = (product: Product) => {
    addToCart({
      type: 'product',
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      quantity: 1,
    });
  };

  const addCustomService = () => {
    if (!customServiceName.trim()) return;
    
    addToCart({
      type: 'custom',
      id: `custom-${Date.now()}`,
      name: customServiceName,
      price: 0, // Custom services can be priced later
      quantity: 1,
      customDetails: customServiceDetails,
    });

    setCustomServiceName('');
    setCustomServiceDetails('');
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const totalDuration = useMemo(() => {
    const serviceItems = cart.filter(c => c.type === 'service' && c.duration);
    if (serviceItems.length === 0) return '0 mins';
    
    const totalMinutes = serviceItems.reduce((sum, item) => {
      const match = item.duration?.match(/(\d+)/);
      const mins = match ? parseInt(match[0]) : 0;
      return sum + (mins * item.quantity);
    }, 0);
    
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${totalMinutes} mins`;
  }, [cart]);

  // Time slots
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour > 12 ? hour - 12 : hour;
        const time = `${hour12.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${period}`;
        slots.push({ time, available: true });
      }
    }
    return slots;
  }, [selectedDate]);

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const handleDateSelect = (date: Date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleBooking = () => {
    if (!workspaceId) return;

    // Create booking record
    const booking = {
      id: `BOOK-${Date.now()}`,
      customerName,
      email: customerEmail,
      phone: customerPhone,
      date: selectedDate ? selectedDate.toISOString() : '',
      time: selectedTime || '',
      items: cart,
      total: cartTotal,
      duration: totalDuration,
      notes: additionalNotes,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      workspaceId: workspaceId,
    };

    // Save to localStorage
    try {
      const existingBookings = JSON.parse(
        localStorage.getItem(`zervos_bookings_${workspaceId}`) || '[]'
      );
      existingBookings.push(booking);
      localStorage.setItem(
        `zervos_bookings_${workspaceId}`,
        JSON.stringify(existingBookings)
      );

      // Trigger event for dashboard update
      window.dispatchEvent(new CustomEvent('bookings-updated'));
      
      setStep(4);
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const lower = category?.toLowerCase() || '';
    if (lower.includes('hair')) return Scissors;
    if (lower.includes('beauty') || lower.includes('makeup')) return Palette;
    if (lower.includes('spa') || lower.includes('massage')) return Sparkles;
    if (lower.includes('nail')) return Heart;
    return Lightbulb;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-8 py-6 shadow-2xl">
            <Building2 size={40} />
            <div className="text-left">
              <h1 className="text-3xl font-bold">
                {workspaceName || 'Business'} Booking
              </h1>
              <p className="text-purple-100">Choose services, products & book instantly</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: 'Select Items' },
              { num: 2, label: 'Choose Time' },
              { num: 3, label: 'Your Details' },
              { num: 4, label: 'Confirmed' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center gap-2">
                {idx > 0 && <div className="w-16 h-0.5 bg-gray-300"></div>}
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s.num 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? <CheckCircle2 size={20} /> : s.num}
                  </div>
                  <span className={`hidden sm:inline font-medium ${step >= s.num ? 'text-purple-600' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-2 border-purple-100">
              <CardContent className="p-6">
                {/* STEP 1: Select Services/Products */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">What would you like today?</h2>
                      <p className="text-gray-600">Select services, products, or request custom services</p>
                    </div>

                    {/* Recommendations Section */}
                    {allRecommendations.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                            <Star className="text-white" size={18} />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Recommended for You</h3>
                          <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">
                            <TrendingUp size={12} className="mr-1" />
                            Popular
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {allRecommendations.map((item, idx) => {
                            const isService = item.type === 'service';
                            const inCart = cart.find(c => c.id === item.id && c.type === item.type);
                            const Icon = isService ? getCategoryIcon(item.category) : Package;
                            
                            return (
                              <motion.div
                                key={`${item.type}-${item.id}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <Card className="h-full hover:shadow-lg transition-all duration-300 border-amber-200 hover:border-amber-400 bg-white">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                                        <Icon className="text-amber-600" size={20} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-900 mb-1 truncate">
                                          {item.name}
                                        </h4>
                                        <p className="text-xs text-gray-600 line-clamp-2">
                                          {item.description}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {isService && (item as Service).duration && (
                                      <Badge variant="outline" className="text-xs mb-2">
                                        <Clock size={10} className="mr-1" />
                                        {(item as Service).duration}
                                      </Badge>
                                    )}
                                    
                                    {!isService && (item as Product).stock && (
                                      <Badge variant="outline" className="text-xs mb-2">
                                        <Package size={10} className="mr-1" />
                                        {(item as Product).stock} in stock
                                      </Badge>
                                    )}

                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-base font-bold text-amber-600">
                                        {item.currency === 'INR' && '₹'}
                                        {item.currency === 'USD' && '$'}
                                        {item.price}
                                      </span>
                                      {inCart ? (
                                        <Badge className="bg-green-500 hover:bg-green-600 gap-1 text-xs">
                                          <CheckCircle2 size={12} />
                                          Added
                                        </Badge>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => isService 
                                            ? addServiceToCart(item as Service)
                                            : addProductToCart(item as Product)
                                          }
                                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-xs h-7 px-3"
                                        >
                                          <Plus size={14} className="mr-1" />
                                          Add
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                        
                        <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">
                          <Zap size={12} />
                          Quick picks based on popularity and availability
                        </p>
                      </motion.div>
                    )}

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                          placeholder="Search services or products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white w-full sm:w-auto"
                        >
                          <option value="all">All Categories</option>
                          {(activeTab === 'services' ? serviceCategories : productCategories)
                            .filter(c => c !== 'all')
                            .map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                      <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="services" className="gap-2">
                          <Scissors size={16} />
                          Services ({services.length})
                        </TabsTrigger>
                        <TabsTrigger value="products" className="gap-2">
                          <Package size={16} />
                          Products ({products.length})
                        </TabsTrigger>
                        <TabsTrigger value="custom" className="gap-2">
                          <Lightbulb size={16} />
                          Custom
                        </TabsTrigger>
                      </TabsList>

                      {/* Services Tab */}
                      <TabsContent value="services" className="space-y-4 mt-6">
                        {filteredServices.length === 0 ? (
                          <div className="text-center py-12">
                            <Scissors size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No services found</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredServices.map((service, idx) => {
                              const Icon = getCategoryIcon(service.category);
                              const inCart = cart.find(c => c.id === service.id && c.type === 'service');
                              
                              return (
                                <motion.div
                                  key={service.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="group"
                                >
                                  <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-purple-300">
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                          <Icon className="text-purple-600" size={24} />
                                        </div>
                                        <div className="flex-1">
                                          <h3 className="font-bold text-gray-900 mb-1">{service.name}</h3>
                                          <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="text-xs">
                                          <Clock size={12} className="mr-1" />
                                          {service.duration}
                                        </Badge>
                                        {service.category && (
                                          <Badge variant="secondary" className="text-xs">
                                            {service.category}
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-purple-600">
                                          {service.currency === 'INR' && '₹'}
                                          {service.currency === 'USD' && '$'}
                                          {service.price}
                                        </span>
                                        {inCart ? (
                                          <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                                            <CheckCircle2 size={14} />
                                            In Cart
                                          </Badge>
                                        ) : (
                                          <Button
                                            size="sm"
                                            onClick={() => addServiceToCart(service)}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                          >
                                            <Plus size={16} className="mr-1" />
                                            Add
                                          </Button>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>

                      {/* Products Tab */}
                      <TabsContent value="products" className="space-y-4 mt-6">
                        {filteredProducts.length === 0 ? (
                          <div className="text-center py-12">
                            <Package size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No products found</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProducts.map((product, idx) => {
                              const inCart = cart.find(c => c.id === product.id && c.type === 'product');
                              
                              return (
                                <motion.div
                                  key={product.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-purple-300">
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                                          <Package className="text-blue-600" size={24} />
                                        </div>
                                        <div className="flex-1">
                                          <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 mb-3">
                                        {product.stock > 0 ? (
                                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                            {product.stock} in stock
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                                            Out of stock
                                          </Badge>
                                        )}
                                        {product.category && (
                                          <Badge variant="secondary" className="text-xs">
                                            {product.category}
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-blue-600">
                                          {product.currency === 'INR' && '₹'}
                                          {product.currency === 'USD' && '$'}
                                          {product.price}
                                        </span>
                                        {inCart ? (
                                          <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                                            <CheckCircle2 size={14} />
                                            In Cart
                                          </Badge>
                                        ) : (
                                          <Button
                                            size="sm"
                                            onClick={() => addProductToCart(product)}
                                            disabled={product.stock === 0}
                                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                                          >
                                            <Plus size={16} className="mr-1" />
                                            Add
                                          </Button>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>

                      {/* Custom Service Tab */}
                      <TabsContent value="custom" className="space-y-4 mt-6">
                        <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-900">
                              <Lightbulb className="text-purple-600" />
                              Request Custom Service
                            </CardTitle>
                            <CardDescription>
                              Need something specific? Tell us what you're looking for!
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="customName">Service Name *</Label>
                              <Input
                                id="customName"
                                placeholder="e.g., Special Hair Treatment"
                                value={customServiceName}
                                onChange={(e) => setCustomServiceName(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customDetails">Additional Details</Label>
                              <Textarea
                                id="customDetails"
                                placeholder="Describe what you need in detail..."
                                value={customServiceDetails}
                                onChange={(e) => setCustomServiceDetails(e.target.value)}
                                rows={4}
                              />
                            </div>

                            <Button
                              onClick={addCustomService}
                              disabled={!customServiceName.trim()}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              <Plus size={18} className="mr-2" />
                              Add Custom Service Request
                            </Button>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>

                    {/* Continue Button */}
                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={() => setStep(2)}
                        disabled={cart.length === 0}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                      >
                        Continue to Time Selection
                        <ChevronRight size={18} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Select Date & Time */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Appointment Time</h2>
                      <p className="text-gray-600">Total duration: {totalDuration}</p>
                    </div>

                    {/* Calendar */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                          ← Previous
                        </Button>
                        <h3 className="text-lg font-semibold">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                          Next →
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                        {calendarDays.map((date, index) => {
                          const isAvailable = isDateAvailable(date);
                          const isSelected = selectedDate && isSameDay(date, selectedDate);
                          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

                          return (
                            <button
                              key={index}
                              onClick={() => handleDateSelect(date)}
                              disabled={!isAvailable}
                              className={`
                                aspect-square p-2 rounded-lg text-sm font-medium transition-all
                                ${!isCurrentMonth ? 'text-gray-300' : ''}
                                ${isAvailable && isCurrentMonth
                                  ? 'hover:bg-purple-100 text-gray-900 cursor-pointer'
                                  : 'text-gray-300 cursor-not-allowed'
                                }
                                ${isSelected ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : ''}
                              `}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Available Times</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {timeSlots.map(slot => (
                            <Button
                              key={slot.time}
                              variant={selectedTime === slot.time ? 'default' : 'outline'}
                              onClick={() => setSelectedTime(slot.time)}
                              className={selectedTime === slot.time ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        ← Back
                      </Button>
                      <Button
                        onClick={() => setStep(3)}
                        disabled={!selectedDate || !selectedTime}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                      >
                        Continue to Details
                        <ChevronRight size={18} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Customer Details */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Contact Information</h2>
                      <p className="text-gray-600">We'll send booking confirmation to these details</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special requests or preferences..."
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        ← Back
                      </Button>
                      <Button
                        onClick={handleBooking}
                        disabled={!customerName || !customerEmail || !customerPhone}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                      >
                        Confirm Booking
                        <CheckCircle2 size={18} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Confirmation */}
                {step === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 space-y-6"
                  >
                    <div className="flex justify-center">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={56} className="text-green-600" />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                      <p className="text-gray-600">Thank you! Your appointment has been successfully booked.</p>
                    </div>

                    <Card className="max-w-md mx-auto">
                      <CardContent className="p-6 space-y-4 text-left">
                        <div className="flex items-start gap-3">
                          <Calendar size={20} className="text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-semibold">{selectedDate && formatDate(selectedDate)}</p>
                            <p className="text-sm text-gray-600">{selectedTime}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <User size={20} className="text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-semibold">{customerName}</p>
                            <p className="text-sm text-gray-600">{customerEmail}</p>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <p className="text-sm text-gray-600 mb-2">Booked Items:</p>
                          {cart.map(item => (
                            <div key={`${item.type}-${item.id}`} className="flex justify-between text-sm mb-1">
                              <span>{item.name} x{item.quantity}</span>
                              <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t">
                            <span>Total:</span>
                            <span className="text-purple-600">₹{cartTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="lg"
                    >
                      Book Another Appointment
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 shadow-xl border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Your Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Your cart is empty</p>
                    <p className="text-xs text-gray-400 mt-1">Add services or products to get started</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {cart.map((item) => (
                          <motion.div
                            key={`${item.type}-${item.id}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-gray-50 rounded-lg p-3 border"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{item.name}</h4>
                                {item.duration && (
                                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                    <Clock size={12} />
                                    {item.duration}
                                  </p>
                                )}
                                {item.customDetails && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.customDetails}</p>
                                )}
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id, item.type)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <span className="font-bold text-purple-600">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Duration:</span>
                        <span className="font-semibold">{totalDuration}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-purple-600">₹{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {step === 1 && (
                      <Button
                        onClick={() => setStep(2)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        size="lg"
                      >
                        Proceed to Book
                        <ChevronRight size={18} className="ml-2" />
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
