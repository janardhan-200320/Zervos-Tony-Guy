import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, X, TrendingUp, Sparkles, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InnovativeCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  bookedDates?: string[];
  availableDays?: string[]; // ['monday', 'tuesday', etc.]
  appointments?: Array<{ appointmentDate: string; status?: string }>;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fullDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function InnovativeCalendar({ 
  selectedDate, 
  onDateSelect,
  bookedDates = [],
  availableDays,
  appointments = []
}: InnovativeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (day: number) => {
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${currentYear}-${month}-${dayStr}`;
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  const isDayAvailable = (day: number) => {
    if (!availableDays || availableDays.length === 0) return true;
    const date = new Date(currentYear, currentMonth, day);
    const dayName = fullDayNames[date.getDay()];
    return availableDays.includes(dayName);
  };

  const getAppointmentCount = (day: number) => {
    const dateStr = formatDate(day);
    return appointments.filter(apt => apt.appointmentDate === dateStr).length;
  };

  const getDateStatus = (day: number) => {
    const dateStr = formatDate(day);
    const isBooked = bookedDates.includes(dateStr);
    const aptCount = getAppointmentCount(day);
    const isPast = isPastDate(day);
    const isAvailable = isDayAvailable(day);
    const isSelected = selectedDate === dateStr;
    
    return {
      isBooked,
      aptCount,
      isPast,
      isAvailable,
      isSelected,
      canSelect: !isPast && isAvailable
    };
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Statistics for current month
  const monthStats = useMemo(() => {
    const totalDays = getDaysInMonth(currentMonth, currentYear);
    let availableDaysCount = 0;
    let bookedDaysCount = 0;
    let appointmentCount = 0;

    for (let day = 1; day <= totalDays; day++) {
      const status = getDateStatus(day);
      if (status.canSelect) availableDaysCount++;
      if (status.isBooked) bookedDaysCount++;
      appointmentCount += status.aptCount;
    }

    return { totalDays, availableDaysCount, bookedDaysCount, appointmentCount };
  }, [currentMonth, currentYear, bookedDates, availableDays, appointments]);

  return (
    <div className="space-y-4">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-base font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600" />
            Select Date
          </Label>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Clock className="h-3 w-3 mr-1" />
              {monthStats.availableDaysCount} Available
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              {monthStats.appointmentCount} Bookings
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="gap-2 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
        >
          <Sparkles className="h-4 w-4 text-indigo-600" />
          Today
        </Button>
      </div>

      {/* Calendar Card */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 rounded-2xl border-2 border-gray-200 shadow-lg p-6 space-y-4">
        {/* Month/Year Selector */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select an available date for your appointment
            </p>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold text-gray-600 uppercase tracking-wider py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const status = getDateStatus(day);
              const dateStr = formatDate(day);
              const isHovered = hoveredDate === dateStr;

              return (
                <Tooltip key={day}>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      onClick={() => status.canSelect && onDateSelect(dateStr)}
                      disabled={!status.canSelect}
                      onMouseEnter={() => setHoveredDate(dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      whileHover={status.canSelect ? { scale: 1.1, y: -2 } : {}}
                      whileTap={status.canSelect ? { scale: 0.95 } : {}}
                      className={`
                        relative aspect-square rounded-xl text-sm font-semibold transition-all duration-200
                        flex flex-col items-center justify-center gap-1
                        ${status.isSelected
                          ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl ring-4 ring-indigo-200 z-10'
                          : isToday(day)
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg ring-2 ring-blue-300'
                          : status.isPast || !status.isAvailable
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : status.aptCount > 0
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800 border-2 border-amber-200 hover:border-amber-400 hover:shadow-md'
                          : 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-800 border-2 border-green-200 hover:border-green-400 hover:shadow-md'
                        }
                      `}
                    >
                      {/* Shimmer effect on hover for available dates */}
                      {status.canSelect && !status.isSelected && isHovered && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-xl"
                          initial={{ x: '-100%' }}
                          animate={{ x: '200%' }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      )}

                      {/* Day number */}
                      <span className="relative z-10 text-base font-bold">{day}</span>

                      {/* Status indicators */}
                      <div className="relative z-10 flex items-center justify-center gap-1">
                        {status.isSelected && (
                          <CheckCircle2 className="h-3 w-3 animate-pulse" />
                        )}
                        {!status.isAvailable && !status.isPast && (
                          <Ban className="h-3 w-3" />
                        )}
                        {status.aptCount > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-bold">{status.aptCount}</span>
                          </div>
                        )}
                      </div>

                      {/* Today marker */}
                      {isToday(day) && !status.isSelected && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-lg"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-gray-700 shadow-xl"
                  >
                    <div className="space-y-1">
                      <p className="font-bold">{monthNames[currentMonth]} {day}, {currentYear}</p>
                      {isToday(day) && <p className="text-xs text-blue-300">📅 Today</p>}
                      {status.isSelected && <p className="text-xs text-green-300">✓ Selected</p>}
                      {status.isPast && <p className="text-xs text-red-300">⚠ Past Date</p>}
                      {!status.isAvailable && !status.isPast && <p className="text-xs text-orange-300">🚫 Not Available</p>}
                      {status.aptCount > 0 && (
                        <p className="text-xs text-amber-300">📋 {status.aptCount} appointment{status.aptCount > 1 ? 's' : ''}</p>
                      )}
                      {status.canSelect && !status.isSelected && (
                        <p className="text-xs text-green-300">✓ Available</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Selected Date Display */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-xl border-2 border-green-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-full shadow-md">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700">Selected Date</p>
                  <p className="text-lg font-bold text-green-900">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDateSelect('')}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs flex-wrap p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-md shadow-sm"></div>
          <span className="text-gray-700 font-medium">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md shadow-sm"></div>
          <span className="text-gray-700 font-medium">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-400 rounded-md shadow-sm"></div>
          <span className="text-gray-700 font-medium">Has Bookings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-gray-300 rounded-md shadow-sm"></div>
          <span className="text-gray-700 font-medium">Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-md shadow-sm ring-2 ring-indigo-200"></div>
          <span className="text-gray-700 font-medium">Selected</span>
        </div>
      </div>
    </div>
  );
}
