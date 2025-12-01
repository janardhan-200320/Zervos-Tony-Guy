import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Appointment {
  id: string;
  customerName: string;
  service: string;
  startTime: string;
  endTime: string;
  day: number; // 0-6 for Mon-Sun
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

export default function CalendarPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    customerName: '',
    service: '',
  });

  // Sample appointments
  const appointments: Appointment[] = [
    { id: '1', customerName: 'John Doe', service: 'Technical Interview', startTime: '10:00', endTime: '10:30', day: 1, status: 'confirmed' },
    { id: '2', customerName: 'Jane Smith', service: 'HR Screening', startTime: '14:00', endTime: '14:30', day: 2, status: 'pending' },
    { id: '3', customerName: 'Robert Brown', service: 'Final Round', startTime: '11:00', endTime: '12:00', day: 3, status: 'completed' },
    { id: '4', customerName: 'Alice Johnson', service: 'Phone Screen', startTime: '15:00', endTime: '15:30', day: 4, status: 'confirmed' },
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getAppointmentsForSlot = (day: number, time: string) => {
    return appointments.filter(apt => {
      const slotHour = parseInt(time.split(':')[0]);
      const aptStartHour = parseInt(apt.startTime.split(':')[0]);
      return apt.day === day && aptStartHour === slotHour;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500 border-green-600 text-white';
      case 'pending': return 'bg-yellow-400 border-yellow-500 text-gray-900';
      case 'completed': return 'bg-blue-500 border-blue-600 text-white';
      case 'cancelled': return 'bg-gray-400 border-gray-500 text-white';
      default: return 'bg-gray-300 border-gray-400 text-gray-900';
    }
  };

  const handleSlotClick = (day: number, time: string) => {
    setSelectedSlot({ day, time });
    setIsNewAppointmentOpen(true);
  };

  const handleCreateAppointment = () => {
    // Here you would create the appointment
    console.log('Creating appointment:', { ...newAppointment, ...selectedSlot });
    setIsNewAppointmentOpen(false);
    setNewAppointment({ customerName: '', service: '' });
    setSelectedSlot(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header with Week Navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
            <p className="text-gray-600 mt-1">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft size={18} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-3 border-r border-gray-200 bg-gray-50"></div>
              {weekDays.map((day, index) => (
                <div key={day} className="p-3 text-center border-r border-gray-200 bg-gray-50 last:border-r-0">
                  <div className="font-semibold text-gray-900">{day}</div>
                  <div className="text-sm text-gray-600">{weekDates[index].getDate()}</div>
                </div>
              ))}
            </div>

            {/* Time Slots Grid */}
            {timeSlots.map((time, timeIndex) => (
              <div key={time} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0">
                {/* Time Label */}
                <div className="p-3 border-r border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
                  {time}
                </div>

                {/* Day Columns */}
                {weekDays.map((_, dayIndex) => {
                  const slotAppointments = getAppointmentsForSlot(dayIndex, time);
                  
                  return (
                    <div
                      key={dayIndex}
                      className="p-2 border-r border-gray-200 last:border-r-0 min-h-[80px] hover:bg-gray-50 cursor-pointer transition-colors relative"
                      onClick={() => handleSlotClick(dayIndex, time)}
                    >
                      {slotAppointments.map(apt => (
                        <div
                          key={apt.id}
                          className={`p-2 rounded border-l-4 mb-1 ${getStatusColor(apt.status)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-xs font-semibold truncate">{apt.customerName}</div>
                          <div className="text-xs truncate">{apt.service}</div>
                          <div className="text-xs mt-1">{apt.startTime} - {apt.endTime}</div>
                        </div>
                      ))}
                      {slotAppointments.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Plus size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-600"></div>
            <span className="text-sm text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400 border-2 border-yellow-500"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400 border-2 border-gray-500"></div>
            <span className="text-sm text-gray-600">Cancelled</span>
          </div>
        </div>

        {/* New Appointment Modal */}
        <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Appointment</DialogTitle>
              <DialogDescription>
                {selectedSlot && `${weekDays[selectedSlot.day]} at ${selectedSlot.time}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  value={newAppointment.customerName}
                  onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Input
                  id="service"
                  placeholder="Technical Interview"
                  value={newAppointment.service}
                  onChange={(e) => setNewAppointment({ ...newAppointment, service: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAppointment}
                disabled={!newAppointment.customerName || !newAppointment.service}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
