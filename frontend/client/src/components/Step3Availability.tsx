import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { useOnboarding } from '@/contexts/OnboardingContext';
import { motion } from 'framer-motion';
import { Clock, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const timezones = [
  'Asia/Kolkata - IST (+05:30)',
  'America/New_York - EST (-05:00)',
  'America/Los_Angeles - PST (-08:00)',
  'Europe/London - GMT (+00:00)',
  'Europe/Paris - CET (+01:00)',
  'Asia/Tokyo - JST (+09:00)',
  'Australia/Sydney - AEDT (+11:00)',
];

const timeSlots = [
  '12:00 am', '01:00 am', '02:00 am', '03:00 am', '04:00 am', '05:00 am',
  '06:00 am', '07:00 am', '08:00 am', '09:00 am', '10:00 am', '11:00 am',
  '12:00 pm', '01:00 pm', '02:00 pm', '03:00 pm', '04:00 pm', '05:00 pm',
  '06:00 pm', '07:00 pm', '08:00 pm', '09:00 pm', '10:00 pm', '11:00 pm',
];

const daysOfWeek = [
  { short: 'Sun', full: 'Sunday' },
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
];

export default function Step3Availability() {
  const { data, updateData, prevStep } = useOnboarding();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [timezone, setTimezone] = useState(data.timezone);
  const [startTime, setStartTime] = useState(data.availableTimeStart);
  const [endTime, setEndTime] = useState(data.availableTimeEnd);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Default: Mon-Fri
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = Boolean(timezone && startTime && endTime && selectedWeekdays.length > 0);

  const toggleWeekday = (dayIndex: number) => {
    setSelectedWeekdays((prev) => {
      if (prev.includes(dayIndex)) return prev.filter((d) => d !== dayIndex);
      return [...prev, dayIndex].sort((a, b) => a - b);
    });
  };

  // Convert date to ISO string for consistent handling
  const getDateKey = (date: any): string => {
    try {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const toggleDate = (date: any) => {
    const key = getDateKey(date);
    if (!key) return;
    
    setSelectedDates((prev) => {
      const exists = prev.some((d) => getDateKey(d) === key);
      if (exists) {
        return prev.filter((d) => getDateKey(d) !== key);
      }
      
      // Store as proper Date object
      try {
        const dateObj = new Date(date);
        return [...prev, dateObj];
      } catch {
        return prev;
      }
    });
  };

  const handleNext = async () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const availableDays = selectedWeekdays.map(idx => dayNames[idx]);
    const finalData = {
      businessName: data.businessName || '',
      websiteUrl: data.websiteUrl || '',
      currency: data.currency || 'INR',
      industries: Array.isArray(data.industries) ? data.industries : ['General'],
      businessNeeds: Array.isArray(data.businessNeeds) ? data.businessNeeds : ['Booking Management'],
      timezone,
      availableDays,
      availableTimeStart: startTime,
      availableTimeEnd: endTime,
      eventTypeLabel: data.eventTypeLabel || 'Appointment',
      teamMemberLabel: data.teamMemberLabel || 'Staff',
    };
    
    // Validate required fields
    if (!finalData.businessName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a business name',
        variant: 'destructive',
      });
      return;
    }
    
    if (!finalData.websiteUrl.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a website URL',
        variant: 'destructive',
      });
      return;
    }
    
    updateData({
      timezone,
      availableTimeStart: startTime,
      availableTimeEnd: endTime,
      availableDays,
      isCompleted: true,
    });
    
    // Submit onboarding data to backend
    setIsSubmitting(true);
    try {
      console.log('📝 Submitting onboarding data:', finalData);
      const response = await apiRequest('POST', '/api/onboarding', finalData);
      const result = await response.json();
      console.log('✅ Onboarding completed:', result);
      
      // Clear onboarding data from localStorage
      localStorage.removeItem('zervos_onboarding');
      
      // Show success toast
      toast({
        title: 'Setup Complete!',
        description: 'Your account has been created successfully. Redirecting to dashboard...',
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('❌ Error completing onboarding:', error);
      console.error('Error details:', error.message);
      setIsSubmitting(false);
      
      // Show error toast
      const errorMessage = error?.message || 'Failed to complete setup. Please try again.';
      toast({
        title: 'Setup Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const availableDays = selectedWeekdays.map(idx => dayNames[idx]);
    updateData({
      timezone,
      availableTimeStart: startTime,
      availableTimeEnd: endTime,
      availableDays,
    });
    prevStep();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <motion.div
          className="absolute -top-6 -left-6"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Clock className="w-10 h-10 text-gray-300" />
        </motion.div>
        
        <motion.h1 
          className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 tracking-tight"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Your available times <span className="text-red-600">*</span>
        </motion.h1>
        <motion.p 
          className="text-gray-600 mt-3 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Set your working hours and available days
        </motion.p>
        
        <motion.div 
          className="h-1 w-24 bg-gradient-to-r from-gray-900 to-gray-600 rounded-full mt-4"
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
      </motion.div>

      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* Timezone Card */}
        <motion.div
          className="group relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <Label htmlFor="timezone" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time zone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone" data-testid="select-timezone" className="h-14 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 rounded-xl text-base font-medium">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Working Hours Card */}
        <motion.div
          className="group relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                Working Hours
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Time</span>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger data-testid="select-start-time" className="h-14 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 rounded-xl text-base font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End Time</span>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger data-testid="select-end-time" className="h-14 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 rounded-xl text-base font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Available Dates Card */}
        <motion.div
          className="group relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Available Days
              </Label>

              <div className="grid grid-cols-4 gap-3">
                {daysOfWeek.map((d, idx) => (
                  <motion.button
                    key={d.full}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    title={d.full}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-5 py-3 border-2 rounded-xl text-sm font-bold focus:outline-none text-center min-w-[80px] transition-all overflow-hidden ${
                      selectedWeekdays.includes(idx)
                        ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white border-gray-900 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {selectedWeekdays.includes(idx) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    <span className="relative z-10">{d.short}</span>
                  </motion.button>
                ))}
              </div>
              
              <div className="pt-2">
                <span className="text-xs text-gray-500 font-medium">
                  {selectedWeekdays.length > 0 ? `${selectedWeekdays.length} day${selectedWeekdays.length > 1 ? 's' : ''} selected` : 'Select days above'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Specific Dates Calendar Card */}
        <motion.div
          className="group relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-600" />
                Business Open on Specific Dates (Optional)
              </Label>
              
              <div className="flex flex-col gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-300 justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDates.length > 0
                          ? `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`
                          : 'Click to select dates'}
                      </Button>
                    </motion.div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => {
                        // Handle both single date and array of dates
                        if (Array.isArray(dates)) {
                          setSelectedDates(dates);
                        } else if (dates) {
                          toggleDate(dates);
                        }
                      }}
                      disabled={(date) => {
                        // Disable past dates
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>

                {selectedDates.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Selected Dates:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates
                        .map((date) => {
                          const key = getDateKey(date);
                          const dateObj = new Date(date);
                          return { key, date: dateObj };
                        })
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .map(({ key, date }) => (
                          <motion.button
                            key={key}
                            type="button"
                            onClick={() => toggleDate(date)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            {date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="flex justify-between pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={handleBack}
            data-testid="button-back"
            className="min-w-36 h-12 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-xl transition-all duration-300"
          >
            Back
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleNext}
            disabled={!isFormValid || isSubmitting}
            data-testid="button-next"
            className="min-w-36 h-12 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="relative z-10">Creating...</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Complete Setup</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
