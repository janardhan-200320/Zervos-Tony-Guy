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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Phone, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2,
  User,
  Mail,
  MessageSquare,
  Video
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleCallModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ScheduleCallModal({ open, onClose }: ScheduleCallModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    timeSlot: '',
    callType: 'phone',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !date || !formData.timeSlot) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // In production, send to backend API
      // await fetch('/api/schedule-call', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...formData, date }),
      // });

      console.log('Call scheduled:', { ...formData, date });
      setStep('success');
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to schedule call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setStep('form');
    setDate(undefined);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      timeSlot: '',
      callType: 'phone',
      notes: '',
    });
    onClose();
  };

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  ];

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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      Schedule a Call
                    </DialogTitle>
                    <DialogDescription>
                      Get personalized plan recommendations from our team
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
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
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        <Phone size={14} />
                        Phone Number <span className="text-red-500">*</span>
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
                  </div>
                </div>

                {/* Schedule Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-blue-600" />
                    Preferred Date & Time
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Select Date <span className="text-red-500">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date) =>
                              date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeSlot" className="flex items-center gap-1">
                        <Clock size={14} />
                        Time Slot <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.timeSlot}
                        onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}
                      >
                        <SelectTrigger id="timeSlot">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="callType" className="flex items-center gap-1">
                        Call Type
                      </Label>
                      <Select
                        value={formData.callType}
                        onValueChange={(value) => setFormData({ ...formData, callType: value })}
                      >
                        <SelectTrigger id="callType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">
                            <div className="flex items-center gap-2">
                              <Phone size={16} />
                              Phone Call
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video size={16} />
                              Video Call (Google Meet/Zoom)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" />
                    Additional Notes (Optional)
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      What would you like to discuss?
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="e.g., I'd like to learn more about the Pro plan features, pricing for multiple locations, etc."
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">What to expect:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• 15-30 minute consultation with our expert</li>
                        <li>• Personalized plan recommendations</li>
                        <li>• Answer all your questions</li>
                        <li>• Get special offers and discounts</li>
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
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Schedule Call
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
                Call Scheduled Successfully!
              </DialogTitle>
              <DialogDescription className="text-base mb-6">
                We're looking forward to speaking with you.
              </DialogDescription>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Date & Time</p>
                      <p className="text-sm text-gray-700">
                        {date && format(date, "PPPP")} at {formData.timeSlot}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Confirmation Email</p>
                      <p className="text-sm text-gray-700">
                        Sent to {formData.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Call Type</p>
                      <p className="text-sm text-gray-700 capitalize">
                        {formData.callType} Call
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Reference ID: <span className="font-mono font-semibold text-blue-600">CALL-{Date.now().toString(36).toUpperCase()}</span>
                </p>
                <p className="text-sm text-gray-600">
                  You'll receive a reminder 1 hour before the scheduled time.
                </p>
              </div>

              <Button
                onClick={handleClose}
                size="lg"
                className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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
