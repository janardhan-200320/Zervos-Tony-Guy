import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, Sunrise, Sun, Sunset, Moon, Zap, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TimeSlotSelectorProps {
  selectedTime: string;
  selectedDate: string;
  onTimeSelect: (time: string) => void;
  bookedSlots?: string[];
  serviceDuration?: number; // in minutes
  businessHours?: {
    start: string; // e.g., "09:00 am"
    end: string; // e.g., "06:00 pm"
  };
}

const parseTime12To24 = (time12: string): number => {
  const [time, period] = time12.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  if (period === 'pm' && hours !== 12) hour24 += 12;
  if (period === 'am' && hours === 12) hour24 = 0;
  return hour24 * 60 + minutes; // return minutes from midnight
};

const generateTimeSlots = (serviceDuration: number = 30, businessHours?: {start: string; end: string}) => {
  const slots = [];
  let startMinutes = 0; // Start from midnight
  let endMinutes = 24 * 60; // End at midnight next day

  // If business hours provided, use them
  if (businessHours) {
    startMinutes = parseTime12To24(businessHours.start);
    endMinutes = parseTime12To24(businessHours.end);
  }

  // Generate slots based on service duration
  const slotInterval = serviceDuration || 30;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotInterval) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    
    const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const isPM = hour >= 12;
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const time12 = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${isPM ? 'pm' : 'am'}`;
    
    slots.push({ time24, time12, hour, minutes });
  }
  
  return slots;
};

const getTimeOfDayIcon = (hour: number) => {
  if (hour >= 5 && hour < 12) return <Sunrise className="h-4 w-4 text-orange-500" />;
  if (hour >= 12 && hour < 17) return <Sun className="h-4 w-4 text-yellow-500" />;
  if (hour >= 17 && hour < 20) return <Sunset className="h-4 w-4 text-orange-600" />;
  return <Moon className="h-4 w-4 text-indigo-500" />;
};

const getTimeOfDayColor = (hour: number) => {
  if (hour >= 5 && hour < 12) return 'from-orange-50 via-yellow-50 to-orange-50';
  if (hour >= 12 && hour < 17) return 'from-yellow-50 via-amber-50 to-yellow-50';
  if (hour >= 17 && hour < 20) return 'from-orange-50 via-red-50 to-pink-50';
  return 'from-indigo-50 via-purple-50 to-indigo-50';
};

const getTimeOfDayBorder = (hour: number) => {
  if (hour >= 5 && hour < 12) return 'border-orange-200 hover:border-orange-400';
  if (hour >= 12 && hour < 17) return 'border-yellow-200 hover:border-yellow-400';
  if (hour >= 17 && hour < 20) return 'border-red-200 hover:border-red-400';
  return 'border-indigo-200 hover:border-indigo-400';
};

export default function InnovativeTimeSlotSelector({
  selectedTime,
  selectedDate,
  onTimeSelect,
  bookedSlots = [],
  serviceDuration = 30,
  businessHours,
}: TimeSlotSelectorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const timeSlots = useMemo(() => 
    generateTimeSlots(serviceDuration, businessHours), 
    [serviceDuration, businessHours]
  );

  const filteredSlots = timeSlots.filter((slot) => {
    if (selectedPeriod === 'all') return true;
    if (selectedPeriod === 'morning') return slot.hour >= 5 && slot.hour < 12;
    if (selectedPeriod === 'afternoon') return slot.hour >= 12 && slot.hour < 17;
    if (selectedPeriod === 'evening') return slot.hour >= 17 && slot.hour < 20;
    if (selectedPeriod === 'night') return slot.hour >= 20 || slot.hour < 5;
    return true;
  });

  // Group slots by time of day
  const groupedSlots = useMemo(() => ({
    morning: timeSlots.filter(s => s.hour >= 5 && s.hour < 12),
    afternoon: timeSlots.filter(s => s.hour >= 12 && s.hour < 17),
    evening: timeSlots.filter(s => s.hour >= 17 && s.hour < 20),
    night: timeSlots.filter(s => s.hour >= 20 || s.hour < 5),
  }), [timeSlots]);

  const isSlotBooked = (time: string) => bookedSlots.includes(time);
  const isSlotSelected = (time: string) => selectedTime === time;

  const availableCount = filteredSlots.filter(s => !isSlotBooked(s.time12)).length;

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Select Time Slot
          </Label>
          <div className="flex items-center gap-3 text-xs">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Zap className="h-3 w-3 mr-1" />
              {availableCount} Available
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
              <Timer className="h-3 w-3 mr-1" />
              {serviceDuration}min slots
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-sm"></div>
              <span className="text-gray-600 font-medium">Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-br from-red-400 to-rose-500 rounded-full shadow-sm"></div>
              <span className="text-gray-600 font-medium">Booked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Period Filter */}
      <div className="flex gap-2 flex-wrap p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        {[
          { key: 'all', icon: Clock, label: 'All Day', count: timeSlots.length },
          { key: 'morning', icon: Sunrise, label: 'Morning', count: groupedSlots.morning.length },
          { key: 'afternoon', icon: Sun, label: 'Afternoon', count: groupedSlots.afternoon.length },
          { key: 'evening', icon: Sunset, label: 'Evening', count: groupedSlots.evening.length },
          { key: 'night', icon: Moon, label: 'Night', count: groupedSlots.night.length },
        ].map(({ key, icon: Icon, label, count }) => (
          <Button
            key={key}
            type="button"
            variant={selectedPeriod === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(key as any)}
            className={`gap-2 transition-all ${
              selectedPeriod === key 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md' 
                : 'hover:bg-white hover:shadow-sm'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
          </Button>
        ))}
      </div>

      {/* Time Slots Grid */}
      <div className="max-h-[420px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
        {selectedPeriod === 'all' ? (
          // Show grouped by time of day
          Object.entries(groupedSlots).map(([period, slots]) => {
            if (slots.length === 0) return null;
            return (
              <div key={period} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 capitalize sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10">
                  {getTimeOfDayIcon(slots[0]?.hour || 0)}
                  <span>{period}</span>
                  <span className="text-xs font-normal text-gray-500">({slots.length} slots)</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const isBooked = isSlotBooked(slot.time12);
                    const isSelected = isSlotSelected(slot.time12);
                    const isHovered = hoveredSlot === slot.time12;
                    
                    return (
                      <motion.button
                        key={slot.time12}
                        type="button"
                        onClick={() => !isBooked && onTimeSelect(slot.time12)}
                        disabled={isBooked}
                        onMouseEnter={() => setHoveredSlot(slot.time12)}
                        onMouseLeave={() => setHoveredSlot(null)}
                        whileHover={!isBooked ? { scale: 1.05, y: -2 } : {}}
                        whileTap={!isBooked ? { scale: 0.95 } : {}}
                        className={`
                          relative p-4 rounded-xl text-sm font-semibold transition-all duration-200
                          ${isSelected 
                            ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg ring-4 ring-indigo-200' 
                            : isBooked
                            ? 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                            : `bg-gradient-to-br ${getTimeOfDayColor(slot.hour)} border-2 ${getTimeOfDayBorder(slot.hour)} text-gray-700 hover:shadow-lg`
                          }
                        `}
                      >
                        {/* Shimmer effect on hover */}
                        {!isBooked && !isSelected && isHovered && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                          />
                        )}
                        
                        <div className="relative flex flex-col items-center gap-2">
                          <span className={`text-base font-bold ${isSelected ? 'text-white' : isBooked ? 'text-gray-400' : 'text-gray-800'}`}>
                            {slot.time12}
                          </span>
                          <div className="flex items-center gap-1">
                            {isSelected && <CheckCircle2 className="h-4 w-4 animate-pulse" />}
                            {isBooked && <XCircle className="h-4 w-4" />}
                            {!isBooked && !isSelected && (
                              <Timer className={`h-3 w-3 ${isHovered ? 'text-indigo-600' : 'text-gray-400'}`} />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          // Show filtered slots
          <div className="grid grid-cols-4 gap-3">
            {filteredSlots.map((slot) => {
              const isBooked = isSlotBooked(slot.time12);
              const isSelected = isSlotSelected(slot.time12);
              const isHovered = hoveredSlot === slot.time12;
              
              return (
                <motion.button
                  key={slot.time12}
                  type="button"
                  onClick={() => !isBooked && onTimeSelect(slot.time12)}
                  disabled={isBooked}
                  onMouseEnter={() => setHoveredSlot(slot.time12)}
                  onMouseLeave={() => setHoveredSlot(null)}
                  whileHover={!isBooked ? { scale: 1.05, y: -2 } : {}}
                  whileTap={!isBooked ? { scale: 0.95 } : {}}
                  className={`
                    relative p-4 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isSelected 
                      ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-lg ring-4 ring-indigo-200' 
                      : isBooked
                      ? 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      : `bg-gradient-to-br ${getTimeOfDayColor(slot.hour)} border-2 ${getTimeOfDayBorder(slot.hour)} text-gray-700 hover:shadow-lg`
                    }
                  `}
                >
                  {!isBooked && !isSelected && isHovered && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                  
                  <div className="relative flex flex-col items-center gap-2">
                    <span className={`text-base font-bold ${isSelected ? 'text-white' : isBooked ? 'text-gray-400' : 'text-gray-800'}`}>
                      {slot.time12}
                    </span>
                    <div className="flex items-center gap-1">
                      {isSelected && <CheckCircle2 className="h-4 w-4 animate-pulse" />}
                      {isBooked && <XCircle className="h-4 w-4" />}
                      {!isBooked && !isSelected && (
                        <Timer className={`h-3 w-3 ${isHovered ? 'text-indigo-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Time Display */}
      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-xl border-2 border-green-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700">Selected Time</p>
                  <p className="text-lg font-bold text-green-900">{selectedTime}</p>
                  <p className="text-xs text-green-600">Duration: {serviceDuration} minutes</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onTimeSelect('')}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
