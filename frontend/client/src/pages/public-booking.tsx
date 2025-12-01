import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  User, 
  Mail, 
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  Globe,
  Building2,
  Download,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  generateGoogleCalendarUrl, 
  generateOutlookCalendarUrl, 
  downloadICalFile,
  createEventDate,
  type CalendarEvent 
} from '@/lib/calendar-utils';

interface BookingPageSettings {
  businessName: string;
  bookingUrl: string;
  welcomeMessage: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  showLogo: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  socialImage: string;
}

type DynamicFieldType = 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
interface LoginField {
  id: string;
  name: string;
  type: DynamicFieldType;
  required: boolean;
  placeholder?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  durationMinutes: number;
  locationType: 'in-person' | 'phone' | 'video' | 'custom';
  hostName: string;
  color: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilitySchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface BookingPayload {
  customerName: string;
  email: string;
  phone: string;
  serviceName: string;
  serviceId: string;
  assignedMemberId: string;
  assignedMemberName: string;
  date: string;
  time: string;
  status: 'upcoming';
  notes: string;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeBreakMap = (input: any): Record<string, Array<{ startTime: string; endTime: string }>> => {
  const map: Record<string, Array<{ startTime: string; endTime: string }>> = {};
  WEEK_DAYS.forEach(day => {
    const entries = Array.isArray(input?.[day]) ? input[day] : [];
    map[day] = entries
      .map((entry: any) => ({
        startTime: typeof entry?.startTime === 'string' ? entry.startTime : '',
        endTime: typeof entry?.endTime === 'string' ? entry.endTime : '',
      }))
      .filter(b => b.startTime && b.endTime);
  });
  return map;
};

const convertHHMMToMinutes = (time24?: string) => {
  if (!time24 || typeof time24 !== 'string') return null;
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

export default function PublicBookingPage() {
  const [, params] = useRoute('/book/:serviceId');
  const serviceId = params?.serviceId;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [callData, setCallData] = useState<any | null>(null);
  // Dynamic booking form fields driven by Admin Center -> Customer Login Preferences
  const [loginFields, setLoginFields] = useState<LoginField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [orgSchedule, setOrgSchedule] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({});
  const [specialHours, setSpecialHours] = useState<Array<{ date: string; startTime: string; endTime: string }>>([]);
  const [unavailability, setUnavailability] = useState<Array<{ startDate: string; endDate: string }>>([]);
  const [bookingSettings, setBookingSettings] = useState<BookingPageSettings | null>(null);
  const [orgBreaks, setOrgBreaks] = useState<Record<string, Array<{ startTime: string; endTime: string }>>>({});
  const [callBreaks, setCallBreaks] = useState<Record<string, Array<{ startTime: string; endTime: string }>>>({});
  const [memberSchedule, setMemberSchedule] = useState<Record<string, { enabled: boolean; start: string; end: string }> | null>(null);
  const [assignedMemberId, setAssignedMemberId] = useState<string | null>(null);
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);
  const [useManagedTimeSlots, setUseManagedTimeSlots] = useState(false);

  const persistAppointmentLocally = useCallback((appointment: BookingPayload) => {
    const record = {
      id: `apt-${Date.now()}`,
      ...appointment,
      assignedSalespersonId: appointment.assignedMemberId,
      workspaceId: (callData as any)?.workspaceId ?? null,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingRaw = localStorage.getItem('zervos_appointments');
      const parsed = existingRaw ? JSON.parse(existingRaw) : [];
      const next = Array.isArray(parsed) ? [...parsed, record] : [record];
      localStorage.setItem('zervos_appointments', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('appointments-updated', { detail: { workspaceId: record.workspaceId } }));
      window.dispatchEvent(new CustomEvent('timeslots-updated'));
    } catch (error) {
      console.warn('Failed to persist appointment locally:', error);
    }
  }, [callData]);

  // Listen for time slot updates
  useEffect(() => {
    const handleSlotsUpdate = () => {
      setSlotsRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('timeslots-updated', handleSlotsUpdate);
    return () => window.removeEventListener('timeslots-updated', handleSlotsUpdate);
  }, []);

  // Load booking form field configuration
  useEffect(() => {
    // Helper to load organization defaults
    const loadOrgDefaults = () => {
      try {
        const raw = localStorage.getItem('zervos_login_prefs');
        if (raw) {
          const prefs = JSON.parse(raw);
          const fields: LoginField[] = Array.isArray(prefs.loginFields) ? prefs.loginFields : [];
          setLoginFields(fields);
          const init: Record<string, string> = {};
          fields.forEach((f) => { init[f.id] = ''; });
          setFormData((prev) => ({ ...init, ...prev }));
          return;
        }
      } catch {}
      // Default fields when none configured or on error
      const defaults: LoginField[] = [
        { id: 'full_name', name: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
        { id: 'email', name: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
        { id: 'phone', name: 'Contact Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567' },
        { id: 'notes', name: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Anything we should know?' },
      ];
      setLoginFields(defaults);
      const init: Record<string, string> = {};
      defaults.forEach((f) => { init[f.id] = ''; });
      setFormData((prev) => ({ ...init, ...prev }));
    };

    // Prefer per-call custom fields when explicitly set
    if (callData && callData.useOrgFormFields === false && Array.isArray(callData.customFormFields) && callData.customFormFields.length > 0) {
      const fields: LoginField[] = callData.customFormFields;
      setLoginFields(fields);
      const init: Record<string, string> = {};
      fields.forEach((f) => { init[f.id] = ''; });
      setFormData((prev) => ({ ...init, ...prev }));
    } else {
      loadOrgDefaults();
    }
  }, [callData]);

  // Decide whether managed time slots should override business hours
  useEffect(() => {
    const determineTimeSlotMode = () => {
      try {
        // Per-call preference takes highest priority
        const callPref = callData?.useManagedTimeSlots === true
          || callData?.timeSlotStrategy === 'managed'
          || callData?.schedulingMode === 'time-slots';

        if (callPref) {
          setUseManagedTimeSlots(true);
          return;
        }

        // Organization-wide toggle stored in localStorage (set from Admin > Time Slots)
        const settingsRaw = localStorage.getItem('zervos_timeslot_settings');
        if (settingsRaw) {
          const settings = JSON.parse(settingsRaw);
          if (settings?.applyToPublicBooking === true || settings?.enabled === true) {
            setUseManagedTimeSlots(true);
            return;
          }
        }

        // Legacy toggle key
        const legacyToggle = localStorage.getItem('zervos_timeslots_enabled');
        if (legacyToggle === 'true') {
          setUseManagedTimeSlots(true);
          return;
        }
      } catch (err) {
        console.warn('Failed to determine time slot mode:', err);
      }

      setUseManagedTimeSlots(false);
    };

    determineTimeSlotMode();
  }, [callData]);

  // Load organization business hours
  useEffect(() => {
    try {
      const raw = localStorage.getItem('zervos_business_hours');
      console.log('📋 Loading business hours from localStorage:', raw);
      if (raw) {
        const data = JSON.parse(raw);
        console.log('📋 Parsed business hours data:', data);
        const scheduleArr = Array.isArray(data?.schedule) ? data.schedule : [];
        const map: Record<string, { enabled: boolean; start: string; end: string }> = {};
        const byDay: Record<string, any> = {};
        scheduleArr.forEach((d: any) => { byDay[d.day] = d; });
        WEEK_DAYS.forEach(day => {
          const entry = byDay[day];
          if (entry) {
            map[day] = { enabled: !!entry.enabled, start: entry.startTime || '09:00', end: entry.endTime || '17:00' };
          }
        });
        console.log('📋 Processed organization schedule:', map);
        const breaksData = data?.breaks && typeof data.breaks === 'object' ? data.breaks : {};
        const breakMap = normalizeBreakMap(breaksData);
        setOrgSchedule(map);
        setOrgBreaks(breakMap);
        setSpecialHours(Array.isArray(data?.specialHours) ? data.specialHours : []);
        setUnavailability(Array.isArray(data?.unavailability) ? data.unavailability : []);
      } else {
        console.log('⚠️ No business hours found in localStorage');
      }
    } catch (err) {
      console.error('❌ Error loading business hours:', err);
    }
  }, []);

  // Load booking page settings (branding/SEO)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('zervos_booking_page');
      if (raw) {
        const s: BookingPageSettings = JSON.parse(raw);
        setBookingSettings(s);
        if (s.metaTitle) document.title = s.metaTitle;
        if (s.metaDescription) {
          let tag = document.querySelector('meta[name="description"]');
          if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('name', 'description');
            document.head.appendChild(tag);
          }
          tag.setAttribute('content', s.metaDescription);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!callData) {
      setCallBreaks(normalizeBreakMap(undefined));
      return;
    }
    setCallBreaks(normalizeBreakMap((callData as any)?.breaks));
  }, [callData]);

  // Load service data dynamically from localStorage (workspace-aware)
  useEffect(() => {
    try {
      if (!serviceId) return;

      // Helper: get all localStorage keys that match prefix
      const getKeysByPrefix = (prefix: string) => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) keys.push(k);
        }
        return keys;
      };

      // 1) First check if it's a service from the Services page
      const serviceKeys = [
        ...getKeysByPrefix('zervos_services_'),
      ];

      let foundService: any | null = null;
      for (const key of serviceKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const svc = arr.find((s: any) => s?.id === serviceId && s?.isEnabled);
            if (svc) {
              foundService = svc;
              break;
            }
          }
        } catch {}
      }

      // If found a service from Services page, use it
      if (foundService) {
        // Parse duration to extract minutes
        const durationMatch = foundService.duration.match(/(\d+)/);
        const durationMinutes = durationMatch ? parseInt(durationMatch[0]) : 30;
        
        setService({
          id: foundService.id,
          name: foundService.name,
          description: foundService.description || 'Book your appointment for this service',
          duration: foundService.duration,
          durationMinutes: durationMinutes,
          locationType: 'in-person',
          hostName: 'Service Provider',
          color: 'from-purple-500 to-pink-500'
        });
        // Store service data with price and currency for booking confirmation
        setCallData({
          ...foundService,
          price: foundService.price,
          currency: foundService.currency
        });
        return;
      }

      // 2) Otherwise, find the sales call by id across all workspace-scoped keys
      const callKeys = [
        ...getKeysByPrefix('zervos_sales_calls::'),
        'zervos_sales_calls'
      ];

      let salesCall: any | null = null;
      let workspaceIdForCall: string | null = null;
      for (const key of callKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const found = arr.find((c: any) => c?.id === serviceId);
            if (found) {
              salesCall = found;
              workspaceIdForCall = key.includes('::') ? key.split('::')[1] : null;
              break;
            }
          }
        } catch {}
      }

      if (!salesCall) {
        // Fallback default if not found
        setService({
          id: serviceId,
          name: 'Lead Qualification Session',
          description: 'Initial consultation to understand your needs and see how we can help',
          duration: '30 mins',
          durationMinutes: 30,
          locationType: 'video',
          hostName: 'Bharath Reddy',
          color: 'from-purple-500 to-pink-500'
        });
        return;
      }

      // 2) Resolve host name from assignedSalespersons via workspace/global member lists
      const primaryAssigneeId = Array.isArray(salesCall.assignedSalespersons) && salesCall.assignedSalespersons.length > 0
        ? salesCall.assignedSalespersons[0]
        : null;

      const resolveMemberName = (id: string | null): string => {
        if (!id) return 'Team Member';
        const candidateKeys: string[] = [];
        if (workspaceIdForCall) {
          candidateKeys.push(`zervos_team_members::${workspaceIdForCall}`);
          candidateKeys.push(`zervos_salespersons::${workspaceIdForCall}`);
        }
        // Add globals
        candidateKeys.push('zervos_team_members');
        candidateKeys.push('zervos_salespersons');
        // As a last resort, scan all potential team member keys across all workspaces
        const allMemberKeys = [
          ...getKeysByPrefix('zervos_team_members::'),
          ...getKeysByPrefix('zervos_salespersons::')
        ];
        for (const k of allMemberKeys) if (!candidateKeys.includes(k)) candidateKeys.push(k);

        for (const key of candidateKeys) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const m = arr.find((x: any) => x?.id === id || x?.email === id);
              if (m) return m.name || m.email || 'Team Member';
            }
          } catch {}
        }
        return 'Team Member';
      };

  const hostName = resolveMemberName(primaryAssigneeId);

      // 3) Map meeting mode to location type
      let locationType: 'in-person' | 'phone' | 'video' | 'custom' = 'video';
      if (salesCall.meetingMode === 'phone') locationType = 'phone';
      else if (salesCall.meetingMode === 'in-person') locationType = 'in-person';
      else if (salesCall.meetingMode === 'custom') locationType = 'custom';
      else if (salesCall.meetingMode === 'video') locationType = 'video';

      // 4) Format duration and compute minutes
      const hours = parseInt(salesCall.duration?.hours || '0');
      const minutes = parseInt(salesCall.duration?.minutes || '30');
      const totalMinutes = (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
      let durationText = '';
      if ((hours || 0) > 0) durationText += `${hours} hour${hours > 1 ? 's' : ''}`;
      if ((minutes || 0) > 0) durationText += `${hours > 0 ? ' ' : ''}${minutes} mins`;
      if (!durationText) durationText = '30 mins';

      // 5) Set service and expose raw call data
      setService({
        id: salesCall.id,
        name: salesCall.name,
        description: salesCall.description || 'Book your appointment for this service',
        duration: durationText,
        durationMinutes: totalMinutes || 30,
        locationType,
        hostName,
        color: 'from-purple-500 to-pink-500'
      });
      setCallData(salesCall);

      // 5b) Resolve primary assignee weekly schedule from Admin Salespersons
        const resolveMemberSchedule = (id: string | null) => {
        if (!id) return null;
        try {
          const raw = localStorage.getItem('zervos_salespersons');
          if (!raw) return null;
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) return null;
          const person = arr.find((p: any) => p?.id === id || p?.email === id);
          const schedule: AvailabilitySchedule[] | undefined = person?.availabilitySchedule;
          if (!schedule || !Array.isArray(schedule)) return null;
          const map: Record<string, { enabled: boolean; start: string; end: string }> = {};
          for (const d of schedule) {
            map[d.day] = { enabled: !!d.enabled, start: d.startTime || '09:00', end: d.endTime || '17:00' };
          }
          return map;
        } catch { return null; }
      };
  setMemberSchedule(resolveMemberSchedule(primaryAssigneeId));
  setAssignedMemberId(primaryAssigneeId);
    } catch (error) {
      // Fallback to default on error
      setService({
        id: serviceId || '1',
        name: 'Lead Qualification Session',
        description: 'Initial consultation to understand your needs and see how we can help',
        duration: '30 mins',
        durationMinutes: 30,
        locationType: 'video',
        hostName: 'Bharath Reddy',
        color: 'from-purple-500 to-pink-500'
      });
      setCallData(null);
    }
  }, [serviceId]);

  // Refresh member schedule if admin data changes in another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'zervos_salespersons' && callData && Array.isArray(callData.assignedSalespersons) && callData.assignedSalespersons[0]) {
        try {
          const raw = localStorage.getItem('zervos_salespersons');
          if (!raw) return;
          const arr = JSON.parse(raw);
          const person = Array.isArray(arr) ? arr.find((p: any) => p?.id === callData.assignedSalespersons[0] || p?.email === callData.assignedSalespersons[0]) : null;
          const schedule: AvailabilitySchedule[] | undefined = person?.availabilitySchedule;
          if (schedule && Array.isArray(schedule)) {
            const map: Record<string, { enabled: boolean; start: string; end: string }> = {};
            for (const d of schedule) {
              map[d.day] = { enabled: !!d.enabled, start: d.startTime || '09:00', end: d.endTime || '17:00' };
            }
            setMemberSchedule(map);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [callData]);

  // Generate calendar days for current month
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 35; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const slotDurationMinutes = useMemo(() => {
    if (callData?.duration) {
      const hours = parseInt(callData.duration.hours || '0', 10) || 0;
      const minutes = parseInt(callData.duration.minutes || '0', 10) || 0;
      const total = hours * 60 + minutes;
      if (total > 0) return total;
    }
    if (service?.durationMinutes) return service.durationMinutes;
    return 60;
  }, [callData, service]);

  const getBreaksForDay = useCallback((dayName: string) => {
    const callDayBreaks = callBreaks?.[dayName];
    if (callDayBreaks && callDayBreaks.length > 0) return callDayBreaks;
    return orgBreaks[dayName] || [];
  }, [callBreaks, orgBreaks]);

  // Dynamic time slots from Time Slot Management
  const timeSlots: TimeSlot[] = useMemo(() => {
    if (!selectedDate) return [];

    try {
      const slots = useManagedTimeSlots ? localStorage.getItem('zervos_timeslots') : null;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDayName = dayNames[selectedDate.getDay()];

      const breaksForDay = getBreaksForDay(selectedDayName);

      const overlapsBreak = (slotStartMinutes: number, durationMinutes: number, breaks: Array<{ startTime: string; endTime: string }>) => {
        const slotEndMinutes = slotStartMinutes + durationMinutes;
        return breaks.some(breakWindow => {
          const breakStart = convertHHMMToMinutes(breakWindow?.startTime);
          const breakEnd = convertHHMMToMinutes(breakWindow?.endTime);
          if (breakStart === null || breakEnd === null) return false;
          return slotStartMinutes < breakEnd && slotEndMinutes > breakStart;
        });
      };

      // Convert 24h time to 12h format
      const formatTime = (time24: string) => {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
      };

      // Generate time slots from a time range using meeting duration as interval
      const generateSlotsFromRange = (startTime: string, endTime: string, intervalMinutes: number, breaks: Array<{ startTime: string; endTime: string }> = []) => {
        const slots: TimeSlot[] = [];
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        // Convert times to minutes for easier calculation
        const startTotalMinutes = startHour * 60 + startMin;
        const endTotalMinutes = endHour * 60 + endMin;
        
        if (intervalMinutes <= 0) return slots;

        // Only supply start times whose meeting end is still within the available window
        for (let currentMinutes = startTotalMinutes; currentMinutes + intervalMinutes <= endTotalMinutes; currentMinutes += intervalMinutes) {
          const currentHour = Math.floor(currentMinutes / 60);
          const currentMin = currentMinutes % 60;

          const time24 = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
          if (!overlapsBreak(currentMinutes, intervalMinutes, breaks)) {
            slots.push({ time: formatTime(time24), available: true });
          } else {
            console.log(`⛔ Skipping slot ${time24} due to break window`, breaks);
          }
        }
        
        return slots;
      };

      // If time slots are configured in Time Slot Management, use those
      if (slots) {
        const parsedSlots = JSON.parse(slots);
        const daySlots = parsedSlots.filter((slot: any) => 
          slot.dayOfWeek === selectedDayName && slot.isActive
        );

        if (daySlots.length > 0) {
          const filteredSlots = daySlots.filter((slot: any) => {
            if (breaksForDay.length === 0) return true;
            const startMinutes = convertHHMMToMinutes(slot?.startTime ?? '');
            const endMinutes = convertHHMMToMinutes(slot?.endTime ?? '');
            if (startMinutes === null) return true;
            const duration = endMinutes !== null && endMinutes > startMinutes
              ? endMinutes - startMinutes
              : slotDurationMinutes;
            return !overlapsBreak(startMinutes, duration, breaksForDay);
          });

          return filteredSlots.map((slot: any) => ({
            time: formatTime(slot.startTime),
            available: slot.currentBookings < slot.maxBookings,
          })).sort((a: TimeSlot, b: TimeSlot) => {
            return a.time.localeCompare(b.time);
          });
        }
      }

      // Fallback: Generate slots from organization business hours
      console.log('📅 Generating time slots for', selectedDayName);
      console.log('🔍 All available schedules:', { 
        memberSchedule: memberSchedule, 
        callDataAvailability: callData?.availability,
        orgSchedule: orgSchedule,
        selectedDay: {
          member: memberSchedule?.[selectedDayName], 
          call: callData?.availability?.[selectedDayName],
          org: orgSchedule[selectedDayName]
        }
      });
      
      // Priority 1: Check member schedule first (highest priority for assigned salesperson)
      if (memberSchedule && memberSchedule[selectedDayName]) {
        const daySchedule = memberSchedule[selectedDayName];
        console.log('🔍 Checking member schedule for', selectedDayName, ':', daySchedule);
        if (daySchedule.enabled && daySchedule.start && daySchedule.end) {
          console.log('✅ Using member schedule:', daySchedule.start, 'to', daySchedule.end);
          const generatedSlots = generateSlotsFromRange(daySchedule.start, daySchedule.end, slotDurationMinutes, breaksForDay);
          console.log('📋 Generated', generatedSlots.length, 'slots:', generatedSlots.map(s => s.time).join(', '));
          return generatedSlots;
        } else {
          console.log('❌ Member schedule exists but day is disabled or incomplete:', daySchedule);
        }
      } else {
        console.log('ℹ️ No member schedule for', selectedDayName);
      }

      // Priority 2: Check call-specific availability
      if (callData?.availability && callData.availability[selectedDayName]) {
        const daySchedule = callData.availability[selectedDayName];
        console.log('🔍 Checking call availability for', selectedDayName, ':', daySchedule);
        if (daySchedule.enabled && daySchedule.start && daySchedule.end) {
          console.log('✅ Using call-specific availability:', daySchedule.start, 'to', daySchedule.end);
          const generatedSlots = generateSlotsFromRange(daySchedule.start, daySchedule.end, slotDurationMinutes, breaksForDay);
          console.log('📋 Generated', generatedSlots.length, 'slots:', generatedSlots.map(s => s.time).join(', '));
          return generatedSlots;
        } else {
          console.log('❌ Call availability exists but day is disabled or incomplete:', daySchedule);
        }
      } else {
        console.log('ℹ️ No call-specific availability for', selectedDayName);
      }

      // Priority 3: Fallback to organization schedule
      console.log('🔍 Checking organization schedule for', selectedDayName);
      console.log('🔍 orgSchedule object:', orgSchedule);
      console.log('🔍 orgSchedule keys:', Object.keys(orgSchedule));
      
      if (Object.keys(orgSchedule).length > 0 && orgSchedule[selectedDayName]) {
        const daySchedule = orgSchedule[selectedDayName];
        console.log('🔍 Found org schedule for', selectedDayName, ':', daySchedule);
        if (daySchedule.enabled && daySchedule.start && daySchedule.end) {
          console.log('✅ Using organization schedule:', daySchedule.start, 'to', daySchedule.end);
          const generatedSlots = generateSlotsFromRange(daySchedule.start, daySchedule.end, slotDurationMinutes, breaksForDay);
          console.log('📋 Generated', generatedSlots.length, 'slots:', generatedSlots.map(s => s.time).join(', '));
          return generatedSlots;
        } else {
          console.log('❌ Organization schedule exists but day is disabled or incomplete:', daySchedule);
          return []; // Return empty if org schedule has this day but it's disabled
        }
      } else {
        console.log('⚠️ No organization schedule found for', selectedDayName);
      }

    console.log('⚠️ No schedule found for', selectedDayName, '- using default 9 AM to 5 PM slots');
    // Final fallback if no schedule is configured
    const defaultSlots = generateSlotsFromRange('09:00', '17:00', slotDurationMinutes, breaksForDay);
      console.log('📋 Generated default slots:', defaultSlots.map(s => s.time).join(', '));
      return defaultSlots;

    } catch (error) {
      console.error('Error loading time slots:', error);
      // Error fallback
      return [
        { time: '09:00 AM', available: true },
        { time: '10:00 AM', available: true },
        { time: '11:00 AM', available: true },
        { time: '01:00 PM', available: true },
        { time: '02:00 PM', available: true },
        { time: '03:00 PM', available: true },
        { time: '04:00 PM', available: true },
      ];
    }
  }, [selectedDate, slotsRefreshKey, memberSchedule, callData, orgSchedule, useManagedTimeSlots, service, slotDurationMinutes, getBreaksForDay]);

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Not in the past
    if (date < today) return false;

    // Enforce booking window if set
    const bookingWindowDays = callData?.limits?.bookingWindowDays;
    if (typeof bookingWindowDays === 'number' && bookingWindowDays > 0) {
      const lastDate = new Date(today);
      lastDate.setDate(lastDate.getDate() + bookingWindowDays);
      if (date > lastDate) return false;
    }

    // Unavailability overrides (org-wide)
    for (const u of unavailability) {
      if (!u.startDate || !u.endDate) continue;
      const start = new Date(u.startDate); start.setHours(0,0,0,0);
      const end = new Date(u.endDate); end.setHours(23,59,59,999);
      if (date >= start && date <= end) return false;
    }

    const dayName = dayNames[date.getDay()];

    // Member schedule must allow the day if present
    if (memberSchedule) {
      const m = memberSchedule[dayName];
      if (!m || m.enabled === false) {
        console.log(`🚫 Date ${date.toDateString()} (${dayName}) blocked by member schedule:`, m);
        return false;
      }
    }

    // Per-call availability (if present) must also allow the day
    if (callData?.availability) {
      const cfg = callData.availability[dayName];
      if (!cfg || cfg.enabled === false) {
        console.log(`🚫 Date ${date.toDateString()} (${dayName}) blocked by call availability:`, cfg);
        return false;
      }
      return true;
    }

    // Fallback to organization schedule (if set)
    const org = orgSchedule[dayName];
    if (org) {
      const isEnabled = !!org.enabled;
      if (!isEnabled) {
        console.log(`🚫 Date ${date.toDateString()} (${dayName}) blocked by org schedule:`, org);
      }
      return isEnabled;
    }

    // Default allow if no specific restrictions
    console.log(`✅ Date ${date.toDateString()} (${dayName}) allowed by default (no schedule configured)`);
    return true;
  };

  // Helper to format date to YYYY-MM-DD without timezone issues
  const formatDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseTimeToDate = (date: Date, time12: string) => {
    // time like '09:30 AM'
    const [timePart, meridian] = time12.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    let hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const isSlotWithinAvailability = (date: Date, slot: string) => {
    const dayName = dayNames[date.getDay()];
    const slotDate = parseTimeToDate(date, slot);
    const within = (startHHMM?: string, endHHMM?: string, enabled?: boolean) => {
      if (enabled === false) return false;
      if (!startHHMM || !endHHMM) return true;
      const [sH, sM] = startHHMM.split(':').map((n: string) => parseInt(n, 10));
      const [eH, eM] = endHHMM.split(':').map((n: string) => parseInt(n, 10));
      const start = new Date(date); start.setHours(sH || 0, sM || 0, 0, 0);
      const end = new Date(date); end.setHours(eH || 0, eM || 0, 0, 0);
      return slotDate >= start && slotDate <= end;
    };

    // Special hours intersect: if exists for this date, the slot must be within special hours
    // Use local date format to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateISO = `${year}-${month}-${day}`;
    const special = specialHours.find(sh => sh.date === dateISO);
    const allowedBySpecial = special ? within(special.startTime, special.endTime, true) : true;

    // Call-specific window
    let allowedByCall = true;
    if (callData?.availability) {
      const cfg = callData.availability[dayName];
      if (!cfg || cfg.enabled === false) {
        console.log(`🚫 Slot ${slot} on ${dayName} blocked by call availability`, cfg);
        return false; // if call disables day, slot is not allowed
      }
      allowedByCall = within(cfg.start, cfg.end, cfg.enabled !== false);
    }

    // Org schedule (only used when call availability is absent)
    let allowedByOrg = true;
    if (!callData?.availability) {
      const org = orgSchedule[dayName];
      if (!org || org.enabled === false) {
        console.log(`🚫 Slot ${slot} on ${dayName} blocked by org schedule`, org);
        return false;
      }
      allowedByOrg = within(org.start, org.end, org.enabled);
    }

    // Member schedule must also allow
    let allowedByMember = true;
    if (memberSchedule) {
      const m = memberSchedule[dayName];
      if (!m || m.enabled === false) {
        console.log(`🚫 Slot ${slot} on ${dayName} blocked by member schedule`, m);
        return false;
      }
      allowedByMember = within(m.start, m.end, m.enabled);
    }

    if (slotDurationMinutes > 0) {
      const breaksForDay = getBreaksForDay(dayName);
      if (breaksForDay.length > 0) {
        const slotStartMinutes = slotDate.getHours() * 60 + slotDate.getMinutes();
        const slotEndMinutes = slotStartMinutes + slotDurationMinutes;
        const conflicts = breaksForDay.some(window => {
          const start = convertHHMMToMinutes(window?.startTime);
          const end = convertHHMMToMinutes(window?.endTime);
          if (start === null || end === null) return false;
          return slotStartMinutes < end && slotEndMinutes > start;
        });
        if (conflicts) {
          console.log(`🚫 Slot ${slot} on ${dayName} blocked by break window`, breaksForDay);
          return false;
        }
      }
    }

    const result = allowedBySpecial && allowedByCall && allowedByOrg && allowedByMember;
    if (!result) {
      console.log(`🚫 Slot ${slot} on ${dayName} (${dateISO}) blocked - special: ${allowedBySpecial}, call: ${allowedByCall}, org: ${allowedByOrg}, member: ${allowedByMember}`);
    }
    return result;
  };

  const passesMinNotice = (date: Date, slot: string) => {
    const minNoticeHours = callData?.limits?.minNoticeHours || 0;
    if (!minNoticeHours) return true;
    const now = new Date();
    const minDateTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
    const slotDate = parseTimeToDate(date, slot);
    return slotDate >= minDateTime;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDateSelect = (date: Date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinue = async () => {
    if (step === 1 && selectedDate && selectedTime) {
      setStep(2);
    } else if (step === 2) {
      // Validate required dynamic fields
      const allValid = loginFields.every((f) => !f.required || (formData[f.id] && formData[f.id].trim().length > 0));
      if (!allValid) return;

      // Check if this is a paid service
      const isPaidService = callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0;
      
      if (isPaidService) {
        // Go to payment step
        setStep(3);
        return;
      }

      // For free services, proceed directly

      // Persist appointment to backend
      const emailField = loginFields.find(f => f.type === 'email');
      const nameField = loginFields.find(f => f.name.toLowerCase().includes('name'));
      const phoneField = loginFields.find(f => f.type === 'tel');

      const payload = {
        customerName: (nameField && formData[nameField.id]) || formData['full_name'] || 'Customer',
        email: (emailField && formData[emailField.id]) || '',
        phone: (phoneField && formData[phoneField.id]) || formData['phone'] || '',
        serviceName: service?.name || 'Service',
        serviceId: callData?.id || serviceId || '',
        assignedMemberId: assignedMemberId || '',
        assignedMemberName: service?.hostName || '',
        date: selectedDate ? formatDateISO(selectedDate) : '',
        time: selectedTime || '',
        status: 'upcoming' as const,
        notes: (() => {
          // Concatenate non-standard fields as notes
          const exclude = new Set([emailField?.id, nameField?.id, phoneField?.id, 'full_name', 'email', 'phone'].filter(Boolean) as string[]);
          const parts = Object.entries(formData)
            .filter(([k, v]) => !exclude.has(k) && (v ?? '').toString().trim().length > 0)
            .map(([k, v]) => `${k}: ${v}`);
          return parts.join('\n');
        })(),
      };

      fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => { /* ignore for now */ });

      persistAppointmentLocally({
        ...payload,
        assignedMemberId: assignedMemberId || '',
      });

      // Generate invoice if this is a paid booking
      if (callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0) {
        const { createInvoice } = await import('@/lib/invoice-utils');
        const companySettings = JSON.parse(localStorage.getItem('zervos_company') || '{}');
        const orgSettings = JSON.parse(localStorage.getItem('zervos_organization_settings') || '{}');
        
        const invoice = createInvoice({
          bookingId: payload.serviceId + '-' + Date.now(),
          customer: {
            name: payload.customerName,
            email: payload.email,
            phone: payload.phone,
          },
          service: {
            name: payload.serviceName,
            duration: callData.duration ? `${callData.duration.hours}h ${callData.duration.minutes}m` : service?.duration || '30 mins',
            price: parseFloat(callData.priceAmount),
          },
          amount: parseFloat(callData.priceAmount),
          paymentMethod: 'Online Payment',
          currency: '₹',
          status: 'Paid',
          company: {
            name: companySettings.name || orgSettings.organizationName || 'Zervos',
            email: companySettings.email || orgSettings.email || '',
            logo: orgSettings.logo || '',
            brandColor: orgSettings.brandColor || '#6366f1',
          },
          bookingDate: payload.date,
          bookingTime: payload.time,
          subtotal: parseFloat(callData.priceAmount),
          notes: 'Thank you for your booking!',
        });

        // Show toast notification
        setTimeout(() => {
          const toastEvent = new CustomEvent('show-toast', {
            detail: {
              title: 'Invoice Generated',
              description: `Invoice ${invoice.invoiceId} created successfully`,
            }
          });
          window.dispatchEvent(toastEvent);
        }, 1000);
      }

      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleAddToGoogleCalendar = () => {
    if (!selectedDate || !selectedTime || !service) return;
    
    const { start, end} = createEventDate(
      formatDateISO(selectedDate),
      selectedTime,
      service?.durationMinutes || 30 // Use actual duration
    );

    const event: CalendarEvent = {
      title: service.name,
      description: `Meeting with ${service.hostName}`,
      location: getLocationText(),
      startTime: start,
      endTime: end,
      url: window.location.href
    };

    window.open(generateGoogleCalendarUrl(event), '_blank');
  };

  const handleAddToOutlook = () => {
    if (!selectedDate || !selectedTime || !service) return;
    
    const { start, end } = createEventDate(
      formatDateISO(selectedDate),
      selectedTime,
      service?.durationMinutes || 30
    );

    const event: CalendarEvent = {
      title: service.name,
      description: `Meeting with ${service.hostName}`,
      location: getLocationText(),
      startTime: start,
      endTime: end,
      url: window.location.href
    };

    window.open(generateOutlookCalendarUrl(event), '_blank');
  };

  const handleDownloadICal = () => {
    if (!selectedDate || !selectedTime || !service) return;
    
    const { start, end } = createEventDate(
      formatDateISO(selectedDate),
      selectedTime,
      service?.durationMinutes || 30
    );

    const event: CalendarEvent = {
      title: service.name,
      description: `Meeting with ${service.hostName}`,
      location: getLocationText(),
      startTime: start,
      endTime: end,
      url: window.location.href
    };

    downloadICalFile(event, `${service.name.replace(/\s+/g, '_')}.ics`);
  };

  const getLocationIcon = () => {
    if (!service) return null;
    switch (service.locationType) {
      case 'video': return <Video size={16} className="text-purple-600" />;
      case 'phone': return <Phone size={16} className="text-purple-600" />;
      case 'in-person': return <MapPin size={16} className="text-purple-600" />;
      default: return <Globe size={16} className="text-purple-600" />;
    }
  };

  const getLocationText = () => {
    if (!service) return '';
    switch (service.locationType) {
      case 'video': return 'Video Conference';
      case 'phone': return 'Phone Call';
      case 'in-person': return 'In Person';
      default: return 'Custom Location';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Show loading state while service is being loaded
  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header (reflects Admin Booking Page colors) */}
        <div className="mb-8 text-center">
          <div
            className="inline-block rounded-xl px-6 py-5"
            style={bookingSettings ? { backgroundColor: bookingSettings.backgroundColor, color: bookingSettings.textColor } : undefined}
          >
            <div className="flex items-center justify-center gap-2 mb-2" style={bookingSettings ? { color: bookingSettings.textColor } : undefined}>
              <Building2 size={32} />
              <h1 className="text-3xl font-bold">{bookingSettings?.businessName || 'Zervos Bookings'}</h1>
            </div>
            <p>
              {bookingSettings?.welcomeMessage || 'Book your appointment in a few simple steps'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle2 size={16} /> : '1'}
              </div>
              <span className="font-medium hidden sm:inline">Select Time</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                {step > 2 ? <CheckCircle2 size={16} /> : '2'}
              </div>
              <span className="font-medium hidden sm:inline">Your Details</span>
            </div>
            {/* Show Payment step only for paid services */}
            {callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0 && (
              <>
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                    {step > 3 ? <CheckCircle2 size={16} /> : '3'}
                  </div>
                  <span className="font-medium hidden sm:inline">Payment</span>
                </div>
              </>
            )}
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step >= (callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0 ? 4 : 3) ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= (callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0 ? 4 : 3) ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                {step > (callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0 ? 4 : 3) ? <CheckCircle2 size={16} /> : (callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0 ? '4' : '3')}
              </div>
              <span className="font-medium hidden sm:inline">Confirmed</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Service Info (Sticky) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                {/* Service Icon (use brand color) */}
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center font-bold text-2xl mx-auto"
                  style={bookingSettings ? { backgroundColor: bookingSettings.backgroundColor, color: bookingSettings.textColor || '#ffffff' } : undefined}
                >
                  {service.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>

                {/* Service Details */}
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">{service.name}</h2>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <Clock size={16} className="text-purple-600" />
                  <span>{service.duration}</span>
                </div>

                {/* Host */}
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <User size={16} className="text-purple-600" />
                  <span>{service.hostName}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {getLocationIcon()}
                  <span>{getLocationText()}</span>
                </div>

                {/* Price - Show if it's a paid service or from Services page */}
                {((callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0) || 
                  (callData?.price && callData?.currency)) && (
                  <div className="flex items-center justify-between text-sm bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <span className="font-semibold text-gray-900">Price:</span>
                    <span className="text-xl font-bold text-purple-600">
                      {callData?.currency === 'INR' && '₹'}
                      {callData?.currency === 'USD' && '$'}
                      {callData?.currency === 'EUR' && '€'}
                      {callData?.currency === 'GBP' && '£'}
                      {callData?.currency === 'JPY' && '¥'}
                      {callData?.currency === 'AUD' && 'A$'}
                      {callData?.currency === 'CAD' && 'C$'}
                      {callData?.currency === 'CHF' && 'CHF '}
                      {callData?.currency === 'CNY' && '¥'}
                      {callData?.currency === 'AED' && 'د.إ'}
                      {!callData?.currency && '₹'}
                      {callData?.price || callData?.priceAmount}
                    </span>
                  </div>
                )}

                {/* Selected Date/Time */}
                {selectedDate && selectedTime && (
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Selected Slot:</h3>
                    <div className="bg-purple-50 p-3 rounded-lg space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-purple-600" />
                        <span className="font-medium">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-purple-600" />
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Booking Steps */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* STEP 1: Select Date & Time */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Select Date & Time</h2>

                    {/* Calendar */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Button variant="outline" size="sm" onClick={previousMonth}>
                          ← Previous
                        </Button>
                        <h3 className="text-lg font-semibold">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <Button variant="outline" size="sm" onClick={nextMonth}>
                          Next →
                        </Button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                        {calendarDays.map((date, index) => {
                          const isAvailable = isDateAvailable(date);
                          const isSelected = selectedDate && isSameDay(date, selectedDate);
                          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

                          return (
                            <button
                              key={index}
                              onClick={() => handleDateSelect(date)}
                              disabled={!isAvailable}
                              className={`
                                aspect-square p-2 rounded-lg text-sm font-medium transition-all
                                ${!isCurrentMonth ? 'text-gray-300' : ''}
                                ${isAvailable && isCurrentMonth
                                  ? 'hover:bg-purple-100 text-gray-900 cursor-pointer'
                                  : 'text-gray-300 cursor-not-allowed'
                                }
                                ${isSelected ? 'text-white' : ''}
                              `}
                              style={isSelected && bookingSettings ? { backgroundColor: bookingSettings.backgroundColor, borderColor: bookingSettings.backgroundColor } : undefined}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Available Times</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {timeSlots.length === 0 ? (
                            <p className="col-span-full text-center text-gray-500 py-4">
                              No time slots available for this date. Please select another date.
                            </p>
                          ) : (
                            timeSlots
                              .filter((s) => passesMinNotice(selectedDate, s.time))
                              .map((slot) => (
                                <Button
                                  key={slot.time}
                                  variant={selectedTime === slot.time ? 'default' : 'outline'}
                                  disabled={!slot.available}
                                  onClick={() => handleTimeSelect(slot.time)}
                                  className={`
                                    ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
                                  `}
                                  style={selectedTime === slot.time && bookingSettings ? { backgroundColor: bookingSettings.backgroundColor, borderColor: bookingSettings.backgroundColor, color: bookingSettings.buttonColor || '#ffffff' } : undefined}
                                >
                                  {slot.time}
                                </Button>
                              ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Continue Button */}
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleContinue}
                        disabled={!selectedDate || !selectedTime}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="lg"
                        style={bookingSettings ? { backgroundColor: bookingSettings.backgroundColor, borderColor: bookingSettings.backgroundColor, color: bookingSettings.buttonColor || '#ffffff' } : undefined}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
                {/* STEP 2: Enter Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" onClick={handleBack}>
                        <ArrowLeft size={18} />
                      </Button>
                      <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
                    </div>

                    <div className="space-y-4">
                      {loginFields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id}>
                            {field.name} {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          {field.type === 'textarea' ? (
                            <Textarea
                              id={field.id}
                              placeholder={field.placeholder || ''}
                              value={formData[field.id] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                              rows={4}
                            />
                          ) : (
                            <Input
                              id={field.id}
                              type={field.type}
                              placeholder={field.placeholder || ''}
                              value={formData[field.id] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handleBack}>
                        Back
                      </Button>
                      <Button
                        onClick={handleContinue}
                        disabled={!loginFields.every((f) => !f.required || (formData[f.id] && formData[f.id].trim().length > 0))}
                        className="bg-purple-600 hover:bg-purple-700"
                        style={bookingSettings ? { backgroundColor: bookingSettings.backgroundColor, borderColor: bookingSettings.backgroundColor, color: bookingSettings.buttonColor || '#ffffff' } : undefined}
                        size="lg"
                      >
                        Book Appointment
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Payment (Only for paid services) */}
                {step === 3 && callData?.price === 'paid' && callData?.priceAmount && parseFloat(callData.priceAmount) > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                        <ArrowLeft size={18} />
                      </Button>
                      <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
                    </div>

                    {/* Payment Summary */}
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Service:</span>
                          <span className="font-semibold">{service.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Duration:</span>
                          <span className="font-semibold">{service.duration}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t-2 border-purple-300">
                          <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                          <span className="text-2xl font-bold text-purple-600">
                            ₹{parseFloat(callData.priceAmount).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Options */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Payment Method</h3>
                      
                      <div className="grid gap-3">
                        {/* Credit/Debit Card */}
                        <div className="border-2 border-purple-200 rounded-lg p-4 bg-white hover:border-purple-400 cursor-pointer transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <DollarSign size={20} className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">Credit / Debit Card</div>
                              <div className="text-sm text-gray-600">Pay securely with your card</div>
                            </div>
                          </div>
                        </div>

                        {/* UPI */}
                        <div className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-purple-400 cursor-pointer transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Phone size={20} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">UPI</div>
                              <div className="text-sm text-gray-600">Google Pay, PhonePe, Paytm</div>
                            </div>
                          </div>
                        </div>

                        {/* Net Banking */}
                        <div className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-purple-400 cursor-pointer transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Building2 size={20} className="text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">Net Banking</div>
                              <div className="text-sm text-gray-600">Pay via your bank account</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                        <p className="text-yellow-800">
                          <strong>Note:</strong> This is a demo payment page. In production, integrate a real payment gateway like Razorpay, Stripe, or PayPal.
                        </p>
                      </div>
                    </div>

                    {/* Proceed Button */}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button
                        onClick={handleContinue}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="lg"
                      >
                        Complete Payment
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 4 or 3: Confirmation */}
                {((step === 4 && callData?.price === 'paid') || (step === 3 && callData?.price !== 'paid')) && (
                  <div className="space-y-6 text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={40} className="text-green-600" />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                      <p className="text-gray-600">
                        Your appointment has been successfully scheduled
                      </p>
                    </div>

                    {/* Booking Summary */}
                    <Card className="max-w-md mx-auto">
                      <CardHeader>
                        <CardTitle className="text-lg">Appointment Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-left">
                        <div className="flex items-start gap-3">
                          <Calendar size={18} className="text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{selectedDate && formatDate(selectedDate)}</p>
                            <p className="text-sm text-gray-600">{selectedTime}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <User size={18} className="text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">with {service.hostName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail size={18} className="text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Confirmation Sent</p>
                            <p className="text-sm text-gray-600">{
                              (loginFields.find(f => f.type === 'email') && formData[loginFields.find(f => f.type === 'email')!.id]) || ''
                            }</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Add to Calendar */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Add to your calendar:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleAddToGoogleCalendar}
                          className="gap-2"
                        >
                          <ExternalLink size={14} />
                          Google Calendar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleAddToOutlook}
                          className="gap-2"
                        >
                          <ExternalLink size={14} />
                          Outlook
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleDownloadICal}
                          className="gap-2"
                        >
                          <Download size={14} />
                          Apple Calendar (.ics)
                        </Button>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()}
                      >
                        Book Another Appointment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
