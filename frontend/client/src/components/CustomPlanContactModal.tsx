import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, 
  Phone, 
  Building2, 
  Users, 
  MessageSquare, 
  CheckCircle2,
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomPlanContactModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CustomPlanContactModal({ open, onClose }: CustomPlanContactModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    businessType: '',
    teamSize: '',
    requirements: '',
    preferredContactTime: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Simulate sending contact request
    // In production, send to backend API
    try {
      // await fetch('/api/contact/custom-plan', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      console.log('Custom plan inquiry submitted:', formData);
      
      // Show success step
      setStep('success');
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to submit your request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      businessType: '',
      teamSize: '',
      requirements: '',
      preferredContactTime: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="text-white" size={24} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      Request Custom Plan
                    </DialogTitle>
                    <DialogDescription>
                      Tell us about your business needs and we'll create a tailored solution
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users size={18} className="text-indigo-600" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-1">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1">
                        <Mail size={14} />
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        <Phone size={14} />
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91-9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="flex items-center gap-1">
                        <Building2 size={14} />
                        Company Name
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Your Company Ltd."
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-600" />
                    Business Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select
                        value={formData.businessType}
                        onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                      >
                        <SelectTrigger id="businessType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salon">Salon</SelectItem>
                          <SelectItem value="spa">Spa</SelectItem>
                          <SelectItem value="clinic">Clinic</SelectItem>
                          <SelectItem value="gym">Gym/Fitness</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="services">Professional Services</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teamSize">Team Size</Label>
                      <Select
                        value={formData.teamSize}
                        onValueChange={(value) => setFormData({ ...formData, teamSize: value })}
                      >
                        <SelectTrigger id="teamSize">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-100">51-100 employees</SelectItem>
                          <SelectItem value="101-500">101-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="preferredContactTime" className="flex items-center gap-1">
                        <Clock size={14} />
                        Preferred Contact Time
                      </Label>
                      <Select
                        value={formData.preferredContactTime}
                        onValueChange={(value) => setFormData({ ...formData, preferredContactTime: value })}
                      >
                        <SelectTrigger id="preferredContactTime">
                          <SelectValue placeholder="When should we call you?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                          <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                          <SelectItem value="anytime">Anytime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-600" />
                    Your Requirements
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="requirements">
                      Tell us what custom features you need
                    </Label>
                    <Textarea
                      id="requirements"
                      placeholder="Describe your specific requirements, integrations needed, number of locations, special features, etc."
                      rows={5}
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-indigo-900">
                      <p className="font-semibold mb-1">What happens next?</p>
                      <ul className="space-y-1 text-indigo-700">
                        <li>• Our team will review your requirements within 24 hours</li>
                        <li>• We'll schedule a consultation call at your preferred time</li>
                        <li>• Receive a custom proposal tailored to your needs</li>
                        <li>• Get a detailed quote with transparent pricing</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Company
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-xl"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>

              <DialogTitle className="text-2xl font-bold mb-2">
                Request Submitted Successfully!
              </DialogTitle>
              <DialogDescription className="text-base mb-6">
                Thank you for your interest in our Custom Plan.
              </DialogDescription>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <p className="text-sm text-gray-700">
                      Confirmation email sent to <span className="font-semibold">{formData.email}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <p className="text-sm text-gray-700">
                      Our team will contact you within 24 hours
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <p className="text-sm text-gray-700">
                      We'll schedule a consultation at your preferred time
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Reference ID: <span className="font-mono font-semibold text-indigo-600">REQ-{Date.now().toString(36).toUpperCase()}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Need immediate assistance? Call us at{' '}
                  <a href="tel:+919876543210" className="font-semibold text-indigo-600 hover:underline">
                    +91-9876543210
                  </a>
                </p>
              </div>

              <Button
                onClick={handleClose}
                size="lg"
                className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
