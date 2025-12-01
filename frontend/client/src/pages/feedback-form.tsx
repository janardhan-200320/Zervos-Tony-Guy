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

  useEffect(() => {
    // Load services from localStorage
    const workspaces = JSON.parse(localStorage.getItem('workspaces') || '[]');
    const activeWorkspace = workspaces.find((w: any) => w.isActive);
    
    if (activeWorkspace) {
      const services = JSON.parse(localStorage.getItem(`services_${activeWorkspace.id}`) || '[]');
      const products = JSON.parse(localStorage.getItem(`products_${activeWorkspace.id}`) || '[]');
      const members = JSON.parse(localStorage.getItem(`team_members_${activeWorkspace.id}`) || '[]');
      
      setAvailableServices(services);
      setAvailableProducts(products);
      setTeamMembers(members);
    }
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

                {/* Multiple Services Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Services Taken</Label>
                  <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
                    {/* Service Suggestions */}
                    <div className="flex flex-wrap gap-2">
                      {availableServices.map((service) => (
                        <Badge
                          key={service.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => {
                            addService(service.name);
                            if (currentStep < 2) setCurrentStep(2);
                          }}
                        >
                          + {service.name} (₹{service.price})
                        </Badge>
                      ))}
                    </div>

                    {/* Selected Services */}
                    {formData.selectedServices.length > 0 && (
                      <div className="space-y-2 pt-3 border-t">
                        <p className="text-sm font-medium text-slate-700">Selected Services:</p>
                        {formData.selectedServices.map((service, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 bg-white p-3 rounded-lg border"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{service.name}</p>
                              <select
                                value={service.attendee}
                                onChange={(e) => updateServiceAttendee(index, e.target.value)}
                                className="text-xs text-slate-600 border rounded px-2 py-1 mt-1 w-full"
                              >
                                <option value="">Select staff member...</option>
                                {teamMembers.map((member) => (
                                  <option key={member.id} value={member.name}>
                                    {member.name} - {member.role}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Custom Service Input */}
                    <div className="pt-2">
                      <Input
                        placeholder="Or type a custom service..."
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
                        className="text-sm"
                      />
                      <p className="text-xs text-slate-500 mt-1">Press Enter to add</p>
                    </div>
                  </div>
                </div>

                {/* Products Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Products Purchased (Optional)</Label>
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <div className="flex flex-wrap gap-2">
                      {availableProducts.map((product) => (
                        <Badge
                          key={product.id}
                          variant={formData.selectedProducts.includes(product.name) ? 'default' : 'outline'}
                          className={`cursor-pointer transition-colors ${
                            formData.selectedProducts.includes(product.name)
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'hover:bg-green-50'
                          }`}
                          onClick={() => toggleProduct(product.name)}
                        >
                          {formData.selectedProducts.includes(product.name) ? '✓ ' : ''}
                          {product.name} (₹{product.price})
                        </Badge>
                      ))}
                    </div>

                    {formData.selectedProducts.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-slate-600">
                          Selected Products: {formData.selectedProducts.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legacy single service field (for backward compatibility) */}
                {formData.selectedServices.length === 0 && (
                  <div className="grid gap-4 pt-3">
                    <div>
                      <Label htmlFor="service">Or enter service manually</Label>
                      <Input
                        id="service"
                        value={formData.service}
                        onChange={(e) => {
                          setFormData({ ...formData, service: e.target.value });
                          if (e.target.value && currentStep < 2) setCurrentStep(2);
                        }}
                        placeholder="e.g., Haircut, Massage, Consultation"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="attendee">Service Attendee / Staff Name</Label>
                      <Input
                        id="attendee"
                        value={formData.attendee}
                        onChange={(e) =>
                          setFormData({ ...formData, attendee: e.target.value })
                        }
                        placeholder="Who performed the service?"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
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
