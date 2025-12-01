import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DaySchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface DayBreak {
  id: string;
  startTime: string;
  endTime: string;
}

interface SpecialHours {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

interface Unavailability {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const createInitialBreaks = (): Record<string, DayBreak[]> => {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as Record<string, DayBreak[]>);
};

const createBreakId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function BusinessHours() {
  const { toast } = useToast();
  const [workingHoursOpen, setWorkingHoursOpen] = useState(false);
  const [specialHoursOpen, setSpecialHoursOpen] = useState(false);
  const [unavailabilityOpen, setUnavailabilityOpen] = useState(false);
  
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Friday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Saturday', enabled: false, startTime: '09:00', endTime: '17:00' },
    { day: 'Sunday', enabled: false, startTime: '09:00', endTime: '17:00' },
  ]);

  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
  const [unavailability, setUnavailability] = useState<Unavailability[]>([]);
  const [breaks, setBreaks] = useState<Record<string, DayBreak[]>>(createInitialBreaks());
  
  const [newSpecialHour, setNewSpecialHour] = useState<Omit<SpecialHours, 'id'>>({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    reason: ''
  });

  const [newUnavailability, setNewUnavailability] = useState<Omit<Unavailability, 'id'>>({
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('zervos_business_hours');
    if (saved) {
      const data = JSON.parse(saved);
      setSchedule(data.schedule || schedule);
      setSpecialHours(data.specialHours || []);
      setUnavailability(data.unavailability || []);
      const normalizedBreaks = createInitialBreaks();
      if (data.breaks && typeof data.breaks === 'object') {
        WEEK_DAYS.forEach((day) => {
          const entries = Array.isArray(data.breaks[day]) ? data.breaks[day] : [];
          normalizedBreaks[day] = entries.map((entry: any, index: number) => ({
            id: entry?.id || createBreakId(),
            startTime: entry?.startTime || '13:00',
            endTime: entry?.endTime || '14:00',
          }));
        });
      }
      setBreaks(normalizedBreaks);
    }
  }, []);

  const saveToLocalStorage = (
    updatedSchedule: DaySchedule[],
    updatedSpecial: SpecialHours[],
    updatedUnavail: Unavailability[],
    updatedBreaks: Record<string, DayBreak[]> = breaks
  ) => {
    localStorage.setItem('zervos_business_hours', JSON.stringify({
      schedule: updatedSchedule,
      specialHours: updatedSpecial,
      unavailability: updatedUnavail,
      breaks: updatedBreaks
    }));
  };

  const handleSaveWorkingHours = () => {
    saveToLocalStorage(schedule, specialHours, unavailability, breaks);
    setWorkingHoursOpen(false);
    toast({
      title: "Success",
      description: "Working hours updated successfully",
    });
  };

  const handleAddSpecialHours = () => {
    const newItem: SpecialHours = {
      id: Date.now().toString(),
      ...newSpecialHour
    };
    const updated = [...specialHours, newItem];
    setSpecialHours(updated);
    saveToLocalStorage(schedule, updated, unavailability, breaks);
    setSpecialHoursOpen(false);
    setNewSpecialHour({ date: '', startTime: '09:00', endTime: '17:00', reason: '' });
    toast({
      title: "Success",
      description: "Special hours added successfully",
    });
  };

  const handleDeleteSpecialHours = (id: string) => {
  const updated = specialHours.filter(item => item.id !== id);
  setSpecialHours(updated);
  saveToLocalStorage(schedule, updated, unavailability, breaks);
    toast({
      title: "Success",
      description: "Special hours deleted",
    });
  };

  const handleAddUnavailability = () => {
    const newItem: Unavailability = {
      id: Date.now().toString(),
      ...newUnavailability
    };
  const updated = [...unavailability, newItem];
  setUnavailability(updated);
  saveToLocalStorage(schedule, specialHours, updated, breaks);
    setUnavailabilityOpen(false);
    setNewUnavailability({ startDate: '', endDate: '', reason: '' });
    toast({
      title: "Success",
      description: "Unavailability added successfully",
    });
  };

  const handleDeleteUnavailability = (id: string) => {
    const updated = unavailability.filter(item => item.id !== id);
    setUnavailability(updated);
    saveToLocalStorage(schedule, specialHours, updated, breaks);
    toast({
      title: "Success",
      description: "Unavailability deleted",
    });
  };

  const updateSchedule = (index: number, field: keyof DaySchedule, value: any) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const addBreak = (day: string) => {
    setBreaks((prev) => {
      const next = { ...prev };
      const existing = next[day] || [];
      next[day] = [...existing, { id: createBreakId(), startTime: '13:00', endTime: '14:00' }];
      return next;
    });
  };

  const updateBreak = (day: string, breakId: string, field: 'startTime' | 'endTime', value: string) => {
    setBreaks((prev) => {
      const dayBreaks = prev[day] || [];
      const updated = dayBreaks.map((item) => (item.id === breakId ? { ...item, [field]: value } : item));
      return { ...prev, [day]: updated };
    });
  };

  const deleteBreak = (day: string, breakId: string) => {
    setBreaks((prev) => {
      const dayBreaks = prev[day] || [];
      const updated = dayBreaks.filter((item) => item.id !== breakId);
      return { ...prev, [day]: updated };
    });
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Business Hours</h1>
        <p className="text-gray-600 mt-1">Configure your business operating hours and availability</p>
      </div>

      {/* Working Hours Section */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={20} />
            <div>
              <h3 className="font-semibold text-gray-900">Working Hours</h3>
              <p className="text-sm text-gray-600">Set your business's weekly operating days and hours.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setWorkingHoursOpen(true)}>
            <Edit size={16} className="mr-2" />
            Customize working hours
          </Button>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            {schedule.map((day) => {
              const dayBreaks = breaks[day.day] || [];
              return (
                <div key={day.day} className="flex items-start justify-between py-2 border-b last:border-0">
                  <span className="font-medium text-sm w-24">{day.day}</span>
                  {day.enabled ? (
                    <div className="flex flex-col items-end text-sm text-gray-600">
                      <span>{day.startTime} - {day.endTime}</span>
                      {dayBreaks.length > 0 && (
                        <span className="text-xs text-gray-500">
                          Breaks: {dayBreaks.map((b) => `${b.startTime} - ${b.endTime}`).join(', ')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Special Working Hours Section */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="text-green-600" size={20} />
            <div>
              <h3 className="font-semibold text-gray-900">Special Working Hours</h3>
              <p className="text-sm text-gray-600">Add extra available days or hours.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setSpecialHoursOpen(true)}>
            <Plus size={16} />
            Add
          </Button>
        </div>
        {specialHours.length > 0 && (
          <div className="p-6">
            <div className="space-y-3">
              {specialHours.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{new Date(item.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-600">{item.startTime} - {item.endTime}</p>
                    {item.reason && <p className="text-xs text-gray-500 mt-1">{item.reason}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSpecialHours(item.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Unavailability Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="text-red-600" size={20} />
            <div>
              <h3 className="font-semibold text-gray-900">Unavailability</h3>
              <p className="text-sm text-gray-600">Add extra unavailable days or hours.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setUnavailabilityOpen(true)}>
            <Plus size={16} />
            Add
          </Button>
        </div>
        {unavailability.length > 0 && (
          <div className="p-6">
            <div className="space-y-3">
              {unavailability.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </p>
                    {item.reason && <p className="text-xs text-gray-500 mt-1">{item.reason}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteUnavailability(item.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Working Hours Modal */}
      <Dialog open={workingHoursOpen} onOpenChange={setWorkingHoursOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Working Hours</DialogTitle>
            <DialogDescription>Set your weekly business hours</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {schedule.map((day, index) => {
              const dayBreaks = breaks[day.day] || [];
              return (
                <div key={day.day} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={day.enabled}
                      onCheckedChange={(checked) => updateSchedule(index, 'enabled', checked)}
                    />
                    <span className="font-medium w-24">{day.day}</span>
                  </div>
                  {day.enabled && (
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Breaks</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => addBreak(day.day)}
                          >
                            <Plus size={14} />
                            Add break
                          </Button>
                        </div>
                        {dayBreaks.length === 0 ? (
                          <p className="text-xs text-gray-500">No breaks for this day</p>
                        ) : (
                          dayBreaks.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={item.startTime}
                                onChange={(e) => updateBreak(day.day, item.id, 'startTime', e.target.value)}
                                className="w-32"
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={item.endTime}
                                onChange={(e) => updateBreak(day.day, item.id, 'endTime', e.target.value)}
                                className="w-32"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteBreak(day.day, item.id)}
                                aria-label="Remove break"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkingHoursOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWorkingHours}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Special Hours Modal */}
      <Dialog open={specialHoursOpen} onOpenChange={setSpecialHoursOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Special Working Hours</DialogTitle>
            <DialogDescription>Add extra available days or extended hours</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newSpecialHour.date}
                onChange={(e) => setNewSpecialHour({ ...newSpecialHour, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newSpecialHour.startTime}
                  onChange={(e) => setNewSpecialHour({ ...newSpecialHour, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newSpecialHour.endTime}
                  onChange={(e) => setNewSpecialHour({ ...newSpecialHour, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Reason (Optional)</Label>
              <Input
                value={newSpecialHour.reason}
                onChange={(e) => setNewSpecialHour({ ...newSpecialHour, reason: e.target.value })}
                placeholder="e.g., Extended holiday hours"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecialHoursOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSpecialHours} disabled={!newSpecialHour.date}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unavailability Modal */}
      <Dialog open={unavailabilityOpen} onOpenChange={setUnavailabilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Unavailability</DialogTitle>
            <DialogDescription>Mark dates when you're unavailable</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newUnavailability.startDate}
                onChange={(e) => setNewUnavailability({ ...newUnavailability, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={newUnavailability.endDate}
                onChange={(e) => setNewUnavailability({ ...newUnavailability, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Reason (Optional)</Label>
              <Input
                value={newUnavailability.reason}
                onChange={(e) => setNewUnavailability({ ...newUnavailability, reason: e.target.value })}
                placeholder="e.g., Vacation, Holiday"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnavailabilityOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUnavailability} disabled={!newUnavailability.startDate || !newUnavailability.endDate}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
