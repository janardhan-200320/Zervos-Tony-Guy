import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Send,
  CheckCircle,
  User,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Heart,
  Camera,
  Upload,
  X,
  Gift,
  Share2,
  Clock,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  Award,
  TrendingUp,
  Users,
  Zap,
  Package,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function FeedbackForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Parse URL parameters
  const [urlParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      appointmentId: params.get('appointmentId') || '',
      service: params.get('service') || '',
      attendee: params.get('attendee') || '',
      customer: params.get('customer') || '',
    };
  });

  // Form state
  const [formData, setFormData] = useState({
    customerName: urlParams.customer || '',
    customerEmail: '',
    customerPhone: '',
    service: urlParams.service || '',
    attendee: urlParams.attendee || '',
    rating: 0,
    comment: '',
    wouldRecommend: null as boolean | null,
    serviceQuality: 0,
    staffBehavior: 0,
    cleanliness: 0,
    valueForMoney: 0,
    waitTime: 0,
    uploadedImages: [] as string[],
    tags: [] as string[],
    selectedServices: [] as { name: string; attendee: string }[],
    selectedProducts: [] as string[],
  });

  const [hoveredStar, setHoveredStar] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [rewardPoints, setRewardPoints] = useState(0);
  const totalSteps = 4;

  // Load services and products from workspace
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // Search states
  const [serviceSearch, setServiceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  
  // Filtered lists based on search
  const filteredServices = availableServices.filter(service => 
    service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    service.category?.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  
  const filteredProducts = availableProducts.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    // Load services, products and team members from localStorage
    const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
    
    // Load services from Items > Services section
    const services = JSON.parse(
      localStorage.getItem(`zervos_services_${currentWorkspace}`) || '[]'
    );
    
    // Load products from Items > Products section
    const products = JSON.parse(
      localStorage.getItem(`zervos_products_${currentWorkspace}`) || '[]'
    );
    
    // Load team members/staff
    const staff = JSON.parse(
      localStorage.getItem(`zervos_staff_${currentWorkspace}`) || '[]'
    );
    
    console.log('🔍 Feedback Form - Current Workspace:', currentWorkspace);
    console.log('🔍 Feedback Form - Loaded Services:', services.length, services);
    console.log('🔍 Feedback Form - Loaded Products:', products.length, products);
    console.log('🔍 Feedback Form - Loaded Staff:', staff.length, staff);
    
    setAvailableServices(services);
    setAvailableProducts(products);
    setTeamMembers(staff);
    
    // Listen for changes in localStorage
    const handleStorageChange = () => {
      const updatedServices = JSON.parse(
        localStorage.getItem(`zervos_services_${currentWorkspace}`) || '[]'
      );
      const updatedProducts = JSON.parse(
        localStorage.getItem(`zervos_products_${currentWorkspace}`) || '[]'
      );
      const updatedStaff = JSON.parse(
        localStorage.getItem(`zervos_staff_${currentWorkspace}`) || '[]'
      );
      
      setAvailableServices(updatedServices);
      setAvailableProducts(updatedProducts);
      setTeamMembers(updatedStaff);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('feedback_draft');
    if (savedDraft && !urlParams.appointmentId) {
      const draft = JSON.parse(savedDraft);
      if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
        setFormData(draft.data);
      }
    }
  }, []);

  useEffect(() => {
    if (formData.customerName || formData.comment) {
      localStorage.setItem('feedback_draft', JSON.stringify({
        data: formData,
        timestamp: Date.now(),
      }));
    }
  }, [formData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedFiles.length > 5) {
      toast({
        title: 'Too Many Images',
        description: 'You can upload maximum 5 images',
        variant: 'destructive',
      });
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          uploadedImages: [...prev.uploadedImages, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
    }));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addService = (serviceName: string, attendee: string = '') => {
    setFormData(prev => ({
      ...prev,
      selectedServices: [...prev.selectedServices, { name: serviceName, attendee }]
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter((_, i) => i !== index)
    }));
  };

  const updateServiceAttendee = (index: number, attendee: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map((service, i) => 
        i === index ? { ...service, attendee } : service
      )
    }));
  };

  const toggleProduct = (productName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productName)
        ? prev.selectedProducts.filter(p => p !== productName)
        : [...prev.selectedProducts, productName]
    }));
  };

  const generateDiscountCode = (rating: number) => {
    if (rating >= 4) {
      const code = `ZERVOS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setDiscountCode(code);
      setRewardPoints(rating * 10);
      return code;
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.rating) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating',
        variant: 'destructive',
      });
      return;
    }

    // Generate reward
    const code = generateDiscountCode(formData.rating);

    // Calculate sentiment
    const avgRating = (formData.rating + formData.serviceQuality + formData.staffBehavior + 
                       formData.cleanliness + formData.valueForMoney + formData.waitTime) / 6;
    const sentiment = avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative';

    // Create feedback object
    const feedback = {
      id: `FB-${Date.now()}`,
      appointmentId: urlParams.appointmentId,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      service: formData.service,
      attendee: formData.attendee,
      selectedServices: formData.selectedServices,
      selectedProducts: formData.selectedProducts,
      rating: formData.rating,
      serviceQuality: formData.serviceQuality,
      staffBehavior: formData.staffBehavior,
      cleanliness: formData.cleanliness,
      valueForMoney: formData.valueForMoney,
      waitTime: formData.waitTime,
      comment: formData.comment,
      wouldRecommend: formData.wouldRecommend,
      tags: formData.tags,
      images: formData.uploadedImages,
      sentiment,
      discountCode: code,
      rewardPoints: formData.rating * 10,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };

    // Get existing feedback
    const existingFeedback = JSON.parse(
      localStorage.getItem('zervos_feedback') || '[]'
    );

    // Add new feedback
    const updatedFeedback = [feedback, ...existingFeedback];
    localStorage.setItem('zervos_feedback', JSON.stringify(updatedFeedback));

    // Clear draft
    localStorage.removeItem('feedback_draft');

    // Trigger storage event for dashboard
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('feedback-submitted'));

    setIsSubmitted(true);

    toast({
      title: 'Thank you for your feedback!',
      description: 'Your review helps us improve our services',
    });
  };

  const progress = (currentStep / totalSteps) * 100;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-4"
        >
          <Card className="p-8 text-center shadow-2xl border-0">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-slate-900 mb-3"
            >
              Thank You!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 mb-6"
            >
              Your feedback has been submitted successfully. We appreciate you taking the time to share your experience!
            </motion.p>

            {/* Reward Section */}
            {discountCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6 mb-6"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Gift className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-lg font-bold text-slate-900">You've Earned a Reward!</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border-2 border-dashed border-yellow-400">
                    <p className="text-xs text-slate-600 mb-1">Discount Code</p>
                    <p className="text-2xl font-bold text-yellow-600 tracking-wider">{discountCode}</p>
                    <p className="text-xs text-slate-500 mt-1">10% OFF on your next visit</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-purple-600">
                    <Award className="h-5 w-5" />
                    <span className="font-semibold">{rewardPoints} Reward Points Added!</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Social Share */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6"
            >
              <p className="text-sm text-slate-600 mb-3">Love our service? Share your experience!</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Just had an amazing experience at Zervos! Rated ${formData.rating}/5 stars ⭐`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Tweet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Just had an amazing experience at Zervos! Rated ${formData.rating}/5 stars`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex gap-3"
            >
              <Button
                onClick={() => window.close()}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setDiscountCode('');
                  setRewardPoints(0);
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Submit Another
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">We Value Your Feedback</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            How Was Your Experience?
          </h1>
          <p className="text-lg text-slate-600">
            Your feedback helps us serve you better
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Progress</span>
              <span className="text-sm font-medium text-purple-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full"
              />
            </div>
            <div className="flex justify-between mt-2">
              {['Info', 'Service', 'Rating', 'Details'].map((step, idx) => (
                <span
                  key={idx}
                  className={`text-xs ${currentStep > idx ? 'text-purple-600 font-semibold' : 'text-slate-400'}`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 shadow-xl border-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Your Information
                  <Badge variant="outline" className="ml-auto">Step 1/4</Badge>
                </h3>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) => {
                        setFormData({ ...formData, customerName: e.target.value });
                        if (e.target.value && currentStep < 1) setCurrentStep(1);
                      }}
                      placeholder="Enter your name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                      placeholder="your.email@example.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Services & Products
                  <Badge variant="outline" className="ml-auto">Step 2/4</Badge>
                </h3>

                {/* Services Selection - Compact with Search */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Select Services <span className="text-red-500">*</span></Label>
                    {availableServices.length > 0 && (
                      <span className="text-xs text-slate-500">{filteredServices.length} of {availableServices.length}</span>
                    )}
                  </div>
                  
                  {availableServices.length > 0 ? (
                    <>
                      {/* Innovative Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          placeholder="Search services by name or category..."
                          className="pl-10 pr-4 h-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 focus:border-blue-400"
                        />
                        {serviceSearch && (
                          <button
                            onClick={() => setServiceSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Compact Service Grid */}
                      <div className="max-h-60 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                        {filteredServices.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {filteredServices.map((service) => {
                              const isSelected = formData.selectedServices.some(s => s.name === service.name);
                              return (
                                <motion.div
                                  key={service.id}
                                  whileHover={{ x: 4 }}
                                  onClick={() => {
                                    if (!isSelected) {
                                      addService(service.name);
                                      if (currentStep < 2) setCurrentStep(2);
                                    }
                                  }}
                                  className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                                      : 'bg-white hover:bg-blue-50 border border-slate-200'
                                  }`}
                                >
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isSelected ? 'bg-white/20' : 'bg-blue-100'
                                  }`}>
                                    <Sparkles className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                      {service.name}
                                    </h4>
                                    <div className={`flex items-center gap-2 text-xs ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                                      <span>₹{service.price}</span>
                                      {service.duration && (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {service.duration}m
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No services match "{serviceSearch}"</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 text-center">
                      <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-medium text-amber-900 mb-1">No Services Available</p>
                      <p className="text-xs text-amber-700">
                        Add services in <strong>Dashboard → Items → Services</strong>
                      </p>
                    </div>
                  )}

                  {/* Custom Service Input */}
                  <div className="mt-3">
                    <Input
                      placeholder="+ Add custom service (Press Enter)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            addService(input.value.trim());
                            input.value = '';
                            if (currentStep < 2) setCurrentStep(2);
                          }
                        }
                      }}
                      className="text-sm border-dashed"
                    />
                  </div>
                </div>

                {/* Selected Services with Staff Assignment */}
                {formData.selectedServices.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <Label className="text-sm font-medium text-slate-700">
                      Assign Staff to Services
                    </Label>
                    {formData.selectedServices.map((service, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-slate-900">{service.name}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeService(index)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Staff Selection - Visual Cards */}
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-slate-600">Who performed this service?</p>
                              <div className="grid grid-cols-2 gap-2">
                                {teamMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    onClick={() => updateServiceAttendee(index, member.name)}
                                    className={`relative border rounded-lg p-2 cursor-pointer transition-all ${
                                      service.attendee === member.name
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-slate-300 hover:border-purple-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                        {member.name.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-900 truncate">{member.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{member.role}</p>
                                      </div>
                                      {service.attendee === member.name && (
                                        <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Custom Staff Input */}
                              <Input
                                placeholder="Or enter custom staff name..."
                                value={!teamMembers.find(m => m.name === service.attendee) ? service.attendee : ''}
                                onChange={(e) => updateServiceAttendee(index, e.target.value)}
                                className="text-xs mt-2 border-dashed"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Products Selection - Compact with Search */}
                <div className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Products Purchased (Optional)</Label>
                    {availableProducts.length > 0 && (
                      <span className="text-xs text-slate-500">{filteredProducts.length} of {availableProducts.length}</span>
                    )}
                  </div>
                  
                  {availableProducts.length > 0 ? (
                    <>
                      {/* Innovative Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products by name or category..."
                          className="pl-10 pr-4 h-10 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 focus:border-green-400"
                        />
                        {productSearch && (
                          <button
                            onClick={() => setProductSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Compact Product Grid */}
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                        {filteredProducts.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {filteredProducts.map((product) => {
                              const isSelected = formData.selectedProducts.includes(product.name);
                              return (
                                <motion.div
                                  key={product.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => toggleProduct(product.name)}
                                  className={`relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                                      : 'bg-white hover:bg-green-50 border border-slate-200'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                                    isSelected ? 'bg-white/20' : 'bg-green-100'
                                  }`}>
                                    <Package className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-green-600'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                      {product.name}
                                    </h4>
                                    <p className={`text-xs ${isSelected ? 'text-green-100' : 'text-slate-600'}`}>
                                      ₹{product.price}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No products match "{productSearch}"</p>
                          </div>
                        )}
                      </div>
                      
                      {formData.selectedProducts.length > 0 && (
                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <p className="text-xs font-medium text-green-800 mb-2">
                            {formData.selectedProducts.length} Product{formData.selectedProducts.length > 1 ? 's' : ''} Selected
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {formData.selectedProducts.map((product, idx) => (
                              <Badge key={idx} variant="default" className="bg-green-600 text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                      <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-xs font-medium text-blue-900 mb-1">No Products Available</p>
                      <p className="text-xs text-blue-700">
                        Add products in <strong>Dashboard → Items → Products</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  Your Rating <span className="text-red-500">*</span>
                  <Badge variant="outline" className="ml-auto">Step 3/4</Badge>
                </h3>

                <div className="flex items-center justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setFormData({ ...formData, rating: star });
                        if (currentStep < 3) setCurrentStep(3);
                      }}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-12 w-12 transition-colors ${
                          star <= (hoveredStar || formData.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>

                {formData.rating > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-slate-600"
                  >
                    {formData.rating === 5 && '⭐ Excellent!'}
                    {formData.rating === 4 && '😊 Very Good!'}
                    {formData.rating === 3 && '👍 Good'}
                    {formData.rating === 2 && '😕 Could be better'}
                    {formData.rating === 1 && '😞 Needs improvement'}
                  </motion.p>
                )}
              </div>

              {/* Detailed Ratings */}
              <AnimatePresence>
                {formData.rating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-6 border-t"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Rate Specific Aspects
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Service Quality */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Service Quality
                        </Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFormData({ ...formData, serviceQuality: rating })}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  rating <= formData.serviceQuality
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Staff Behavior */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          Staff Behavior
                        </Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFormData({ ...formData, staffBehavior: rating })}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  rating <= formData.staffBehavior
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cleanliness */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-green-500" />
                          Cleanliness
                        </Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFormData({ ...formData, cleanliness: rating })}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  rating <= formData.cleanliness
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Value for Money */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-blue-500" />
                          Value for Money
                        </Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFormData({ ...formData, valueForMoney: rating })}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  rating <= formData.valueForMoney
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Wait Time */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          Wait Time
                        </Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFormData({ ...formData, waitTime: rating })}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  rating <= formData.waitTime
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji Quick Feedback */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Smile className="h-5 w-5 text-pink-600" />
                  Quick Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Excellent Service', 'Friendly Staff', 'Quick Service', 'Clean & Hygienic', 'Good Value', 'Professional', 'Comfortable', 'Will Return'].map((tag) => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        formData.tags.includes(tag)
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'hover:bg-slate-100'
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Add Photos (Optional)
                </h3>
                <p className="text-sm text-slate-600">Share images of your experience</p>
                
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG up to 10MB (Max 5 images)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </label>

                  {formData.uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Would Recommend */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  Would you recommend us?
                </h3>

                <div className="flex gap-4 justify-center">
                  <Button
                    type="button"
                    variant={formData.wouldRecommend === true ? 'default' : 'outline'}
                    onClick={() => {
                      setFormData({ ...formData, wouldRecommend: true });
                      setCurrentStep(4);
                    }}
                    className={
                      formData.wouldRecommend === true
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                    }
                  >
                    👍 Yes
                  </Button>
                  <Button
                    type="button"
                    variant={formData.wouldRecommend === false ? 'default' : 'outline'}
                    onClick={() => {
                      setFormData({ ...formData, wouldRecommend: false });
                      setCurrentStep(4);
                    }}
                    className={
                      formData.wouldRecommend === false
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }
                  >
                    👎 No
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900">
                  Additional Comments
                </h3>

                <Textarea
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  placeholder="Tell us more about your experience..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-4"
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg shadow-xl"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Submit Feedback
                </Button>
              </motion.div>
            </form>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-sm text-slate-500"
        >
          Your feedback is confidential and helps us improve our services
        </motion.p>
      </div>
    </div>
  );
}
