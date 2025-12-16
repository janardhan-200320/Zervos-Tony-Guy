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
  HelpCircle, 
  CheckCircle2,
  User,
  MessageSquare,
  AlertCircle,
  FileText,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ContactSupportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactSupportModal({ open, onClose }: ContactSupportModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    priority: 'medium',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // In production, send to backend API
      // await fetch('/api/support/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      console.log('Support ticket created:', formData);
      setStep('success');
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to submit support request. Please try again.',
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
      subject: '',
      category: '',
      priority: 'medium',
      message: '',
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
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <HelpCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      Contact Support
                    </DialogTitle>
                    <DialogDescription>
                      Our support team is here to help you
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User size={18} className="text-purple-600" />
                    Your Information
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

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="phone">
                        <Phone size={14} className="inline mr-1" />
                        Phone Number (Optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91-9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Issue Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-purple-600" />
                    Issue Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="account">Account Management</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="subscription">Subscription Plans</SelectItem>
                          <SelectItem value="integration">Integrations</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Low
                              </Badge>
                              <span className="text-sm">- General inquiry</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Medium
                              </Badge>
                              <span className="text-sm">- Moderate impact</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                High
                              </Badge>
                              <span className="text-sm">- Business impacted</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Urgent
                              </Badge>
                              <span className="text-sm">- Critical issue</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="subject" className="flex items-center gap-1">
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-purple-600" />
                    Describe Your Issue
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="flex items-center gap-1">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide as much detail as possible about your issue or question..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Response Time Info */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-900">
                      <p className="font-semibold mb-1">Expected Response Time:</p>
                      <ul className="space-y-1 text-purple-700">
                        <li>• <strong>Urgent:</strong> Within 2 hours</li>
                        <li>• <strong>High:</strong> Within 4 hours</li>
                        <li>• <strong>Medium:</strong> Within 24 hours</li>
                        <li>• <strong>Low:</strong> Within 48 hours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Contact Options */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Need immediate help?</p>
                  <div className="flex flex-col sm:flex-row gap-2 text-sm">
                    <a href="tel:+919876543210" className="text-blue-600 hover:underline flex items-center gap-1">
                      <Phone size={14} />
                      +91-9876543210
                    </a>
                    <span className="hidden sm:inline text-gray-400">|</span>
                    <a href="mailto:support@zervos.com" className="text-blue-600 hover:underline flex items-center gap-1">
                      <Mail size={14} />
                      support@zervos.com
                    </a>
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
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Submit Request
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
                Support Request Submitted!
              </DialogTitle>
              <DialogDescription className="text-base mb-6">
                We've received your request and will respond soon.
              </DialogDescription>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <p className="text-sm text-gray-700">
                      Ticket created and assigned to our team
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <p className="text-sm text-gray-700">
                      Confirmation email sent to <span className="font-semibold">{formData.email}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <p className="text-sm text-gray-700">
                      Support agent will respond based on priority
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Ticket ID: <span className="font-mono font-semibold text-purple-600">TICKET-{Date.now().toString(36).toUpperCase()}</span>
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100">
                  <span className="text-sm font-semibold text-purple-700">Priority:</span>
                  <Badge 
                    variant="outline" 
                    className={
                      formData.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                      formData.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      formData.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }
                  >
                    {formData.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Button
                onClick={handleClose}
                size="lg"
                className="mt-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
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
