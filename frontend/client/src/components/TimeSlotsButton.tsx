import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface TimeSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  maxBookings: number;
  currentBookings: number;
}

const TimeSlotsButton = () => {
  const [, setLocation] = useLocation();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadSlots = () => {
      const slots = localStorage.getItem('zervos_timeslots');
      if (slots) {
        setTimeSlots(JSON.parse(slots));
      }
    };

    loadSlots();
    
    // Listen for timeslot updates
    const handleUpdate = () => loadSlots();
    window.addEventListener('timeslots-updated', handleUpdate);
    
    return () => window.removeEventListener('timeslots-updated', handleUpdate);
  }, []);

  const activeSlots = timeSlots.filter(s => s.isActive).length;
  const totalBooked = timeSlots.reduce((sum, s) => sum + s.currentBookings, 0);
  const totalCapacity = timeSlots.reduce((sum, s) => sum + s.maxBookings, 0);

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setLocation('/dashboard/time-slots')}
        className="relative rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 p-2 text-white shadow-lg transition-all hover:shadow-xl"
      >
        <Clock className="h-5 w-5" />
        
        {/* Badge for active slots */}
        {activeSlots > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
          >
            {activeSlots}
          </motion.span>
        )}
      </motion.button>

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 p-2">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Time Slots</h3>
                <p className="text-xs text-slate-600">Quick Overview</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-2">
                <span className="text-sm text-slate-700">Active Slots</span>
                <span className="font-semibold text-blue-600">{activeSlots}</span>
              </div>
              
              <div className="flex items-center justify-between rounded-lg bg-purple-50 p-2">
                <span className="text-sm text-slate-700">Total Booked</span>
                <span className="font-semibold text-purple-600">
                  {totalBooked}/{totalCapacity}
                </span>
              </div>

              {totalCapacity > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Utilization</span>
                    <span className="font-semibold text-slate-900">
                      {((totalBooked / totalCapacity) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(totalBooked / totalCapacity) * 100}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation('/dashboard/time-slots')}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              Manage Slots
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TimeSlotsButton;
