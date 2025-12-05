import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Ban,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  User,
  Users,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface DayBreak {
  id: string;
  startTime: string;
  endTime: string;
}

interface Workflow {
  id: string;
  name?: string;
  bookingType?: string;
  description?: string;
  assignedSalespersons?: string[];
  availability?: Record<string, {
    enabled: boolean;
    start?: string;
    end?: string;
    startTime?: string;
    endTime?: string;
  }>;
  breaks?: Record<string, DayBreak[]>;
  duration?: {
    hours?: string;
    minutes?: string;
  };
  workspaceId?: string | null;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status?: string;
  serviceId?: string;
  serviceName?: string;
  customService?: string;
  customerName?: string;
  customerEmail?: string;
  assignedSalespersonId?: string;
  assignedMemberId?: string;
  assignedStaff?: string;
  appointmentStatus?: string;
  workspaceId?: string | null;
  notes?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email?: string;
}

interface BlockRecord {
  id: string;
  callId: string;
  date: string;
  startTime: string;
  endTime: string;
  workspaceId?: string | null;
}

interface CustomSlotRecord {
  id: string;
  callId: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
  workspaceId?: string | null;
}

type SlotStatus = 'available' | 'booked' | 'blocked';
type SlotSource = 'availability' | 'custom';

interface GeneratedSlot {
  id: string;
  callId: string;
  callName: string;
  bookingType?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: SlotStatus;
  assignedMemberId?: string;
  assignedMemberName?: string;
  source: SlotSource;
  booking?: Appointment | null;
}

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_BLOCK_STORAGE = 'zervos_slot_blocks';
const CUSTOM_SLOT_STORAGE = 'zervos_custom_slots';
const APPOINTMENTS_STORAGE = 'zervos_appointments';
const SALES_CALLS_STORAGE = 'zervos_sales_calls';

const getIsoDate = (date: Date) => date.toISOString().split('T')[0];

const convertHHMMToMinutes = (time: string | undefined | null): number | null => {
  if (!time || typeof time !== 'string') return null;
  const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const minutesToHHMM = (minutes: number): string => {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const createSlotKey = (callId: string, date: string, startTime: string) => `${callId}__${date}__${startTime}`;

const convertBookingTimeTo24Hour = (time: string | undefined): string | null => {
  if (!time) return null;
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (match) {
    let hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const plain = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (plain) {
    const hours = Number.parseInt(plain[1], 10);
    const minutes = Number.parseInt(plain[2], 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return null;
};

const getWeekDateRange = (anchor: Date): string[] => {
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + mondayOffset);
  const dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    dates.push(getIsoDate(current));
  }
  return dates;
};

const summarizeSlots = (slots: GeneratedSlot[]) => {
  const total = slots.length;
  let booked = 0;
  let blocked = 0;
  slots.forEach((slot) => {
    if (slot.status === 'booked') booked += 1;
    else if (slot.status === 'blocked') blocked += 1;
  });
  const available = total - booked - blocked;
  return { total, booked, blocked, available };
};

const dedupeById = <T extends { id?: string; email?: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  items.forEach((item) => {
    const key = item.id || item.email;
    if (!key) return;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
};

const baseDurationMinutes = (workflow: Workflow | undefined | null): number => {
  if (!workflow) return 30;
  const rawHours = workflow.duration?.hours ?? '0';
  const rawMinutes = workflow.duration?.minutes ?? '30';
  const hours = Number.parseInt(rawHours, 10);
  const minutes = Number.parseInt(rawMinutes, 10);
  const total = (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes);
  return total > 0 ? total : 30;
};

const getBreakWindows = (workflow: Workflow | undefined, dayName: string): DayBreak[] => {
  if (!workflow?.breaks || !workflow.breaks[dayName]) return [];
  return workflow.breaks[dayName].map((entry) => ({
    id: entry.id,
    startTime: entry.startTime ?? (entry as any).start ?? '12:30',
    endTime: entry.endTime ?? (entry as any).end ?? '13:00',
  }));
};

const doesOverlapBreak = (startMinutes: number, durationMinutes: number, breaks: DayBreak[]): boolean => {
  const endMinutes = startMinutes + durationMinutes;
  return breaks.some((window) => {
    const breakStart = convertHHMMToMinutes(window.startTime);
    const breakEnd = convertHHMMToMinutes(window.endTime);
    if (breakStart === null || breakEnd === null) return false;
    return startMinutes < breakEnd && endMinutes > breakStart;
  });
};

const resolveAvailabilityWindow = (
  availability: Workflow['availability'],
  dayName: string,
): { enabled: boolean; start: string; end: string } | null => {
  if (!availability) return null;
  const entry = availability[dayName];
  if (!entry || entry.enabled === false) return null;
  const start = entry.start || entry.startTime || '09:00';
  const end = entry.end || entry.endTime || '17:00';
  if (!start || !end) return null;
  return { enabled: true, start, end };
};

const workspaceMatches = (recordWorkspace: string | null | undefined, workspaceId: string | null) => {
  const normalizedRecord = recordWorkspace ?? null;
  const normalizedWorkspace = workspaceId ?? null;
  return normalizedRecord === normalizedWorkspace;
};

const STORAGE_PREFIXES = ['zervos_sales_calls::', 'zervos_team_members::', 'zervos_salespersons::'];

const getKeysByPrefix = (prefix: string): string[] => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return [];
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(prefix)) keys.push(key);
  }
  return keys;
};

export default function TimeSlotsDashboard() {
  const { selectedWorkspace } = useWorkspace();
  const workspaceId = selectedWorkspace?.id ?? null;
  const { toast } = useToast();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [blockedRecords, setBlockedRecords] = useState<BlockRecord[]>([]);
  const [customRecords, setCustomRecords] = useState<CustomSlotRecord[]>([]);

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(() => getIsoDate(new Date()));
  const [callFilter, setCallFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SlotStatus>('all');
  const [memberFilter, setMemberFilter] = useState<'all' | 'unassigned' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    callId: '',
    date: getIsoDate(new Date()),
    startTime: '09:00',
    duration: 30,
    note: '',
  });

  useEffect(() => {
    setCustomForm((prev) => ({ ...prev, date: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    const load = () => {
      if (typeof window === 'undefined') return;
      const candidateKeys: string[] = [];
      if (workspaceId) candidateKeys.push(`${SALES_CALLS_STORAGE}::${workspaceId}`);
      candidateKeys.push(SALES_CALLS_STORAGE);
      for (const prefix of STORAGE_PREFIXES) {
        for (const key of getKeysByPrefix(prefix)) {
          if (!candidateKeys.includes(key)) candidateKeys.push(key);
        }
      }
      for (const key of candidateKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && key.startsWith(SALES_CALLS_STORAGE)) {
            setWorkflows(parsed as Workflow[]);
            return;
          }
        } catch {
          /* ignore parse errors */
        }
      }
      setWorkflows([]);
    };
    load();
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key.startsWith(SALES_CALLS_STORAGE)) load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [workspaceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadAppointments = () => {
      const raw = localStorage.getItem(APPOINTMENTS_STORAGE);
      if (!raw) {
        setAppointments([]);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        setAppointments(Array.isArray(parsed) ? parsed as Appointment[] : []);
      } catch {
        setAppointments([]);
      }
    };
    loadAppointments();
    const onStorage = (event: StorageEvent) => {
      if (event.key === APPOINTMENTS_STORAGE) loadAppointments();
    };
    const onAppointmentsUpdated = () => loadAppointments();
    window.addEventListener('storage', onStorage);
    window.addEventListener('appointments-updated', onAppointmentsUpdated);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('appointments-updated', onAppointmentsUpdated);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadMembers = () => {
      const candidateKeys: string[] = [];
      if (workspaceId) {
        candidateKeys.push(`zervos_team_members::${workspaceId}`);
        candidateKeys.push(`zervos_salespersons::${workspaceId}`);
      }
      candidateKeys.push('zervos_team_members');
      candidateKeys.push('zervos_salespersons');
      const prefixed = [
        ...getKeysByPrefix('zervos_team_members::'),
        ...getKeysByPrefix('zervos_salespersons::'),
      ];
      prefixed.forEach((key) => {
        if (!candidateKeys.includes(key)) candidateKeys.push(key);
      });
      const members: TeamMember[] = [];
      candidateKeys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (!item) return;
              const normalized: TeamMember = {
                id: item.id || item.email,
                name: item.name || item.displayName || item.email || 'Team Member',
                email: item.email,
              };
              if (!normalized.id) return;
              members.push(normalized);
            });
          }
        } catch {
          /* ignore parse errors */
        }
      });
      setTeamMembers(dedupeById(members));
    };
    loadMembers();
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key.includes('zervos_team_members') || event.key.includes('zervos_salespersons')) {
        loadMembers();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [workspaceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadBlocks = () => {
      const raw = localStorage.getItem(SLOT_BLOCK_STORAGE);
      if (!raw) {
        setBlockedRecords([]);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        setBlockedRecords(Array.isArray(parsed) ? parsed as BlockRecord[] : []);
      } catch {
        setBlockedRecords([]);
      }
    };
    const loadCustom = () => {
      const raw = localStorage.getItem(CUSTOM_SLOT_STORAGE);
      if (!raw) {
        setCustomRecords([]);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        setCustomRecords(Array.isArray(parsed) ? parsed as CustomSlotRecord[] : []);
      } catch {
        setCustomRecords([]);
      }
    };
    loadBlocks();
    loadCustom();
    const onStorage = (event: StorageEvent) => {
      if (event.key === SLOT_BLOCK_STORAGE) loadBlocks();
      if (event.key === CUSTOM_SLOT_STORAGE) loadCustom();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const workspaceBlocks = useMemo(
    () => blockedRecords.filter((record) => workspaceMatches(record.workspaceId, workspaceId)),
    [blockedRecords, workspaceId],
  );

  const workspaceCustom = useMemo(
    () => customRecords.filter((record) => workspaceMatches(record.workspaceId, workspaceId)),
    [customRecords, workspaceId],
  );

  const teamMemberMap = useMemo(() => {
    const map = new Map<string, TeamMember>();
    teamMembers.forEach((member) => {
      if (member.id) map.set(member.id, member);
      if (member.email && !map.has(member.email)) {
        map.set(member.email, { ...member, id: member.email });
      }
    });
    return map;
  }, [teamMembers]);

  const appointmentMap = useMemo(() => {
    const map = new Map<string, Appointment>();
    appointments.forEach((appointment) => {
      const normalizedTime = convertBookingTimeTo24Hour(appointment.time);
      if (!normalizedTime) return;

      let targetCallId = appointment.serviceId;
      if (!targetCallId && appointment.serviceName) {
        const targetName = appointment.serviceName.toLowerCase();
        const foundByName = workflows.find((wf) => (wf.name || '').toLowerCase() === targetName);
        if (foundByName) targetCallId = foundByName.id;
      }

      if (!targetCallId && appointment.assignedStaff) {
        const foundByStaff = workflows.find((wf) => wf.assignedSalespersons?.includes(appointment.assignedStaff!));
        if (foundByStaff) targetCallId = foundByStaff.id;
      }

      if (!targetCallId && appointment.assignedSalespersonId) {
        const foundByAssigned = workflows.find((wf) => wf.assignedSalespersons?.includes(appointment.assignedSalespersonId!));
        if (foundByAssigned) targetCallId = foundByAssigned.id;
      }

      if (!targetCallId) return;

      const key = createSlotKey(targetCallId, appointment.date, normalizedTime);
      const normalizedAppointment: Appointment = {
        ...appointment,
        serviceId: targetCallId,
        assignedSalespersonId: appointment.assignedSalespersonId || appointment.assignedMemberId || appointment.assignedStaff || undefined,
      };
      map.set(key, normalizedAppointment);
    });
    return map;
  }, [appointments, workflows]);

  const computeSlotsForDates = useCallback(
    (dates: string[]): GeneratedSlot[] => {
      const slots: GeneratedSlot[] = [];
      const blockedSet = new Set<string>();
      workspaceBlocks.forEach((record) => {
        blockedSet.add(createSlotKey(record.callId, record.date, record.startTime));
      });

      const customByKey = new Map<string, CustomSlotRecord>();
      workspaceCustom.forEach((record) => {
        customByKey.set(createSlotKey(record.callId, record.date, record.startTime), record);
      });

      workflows.forEach((workflow) => {
        const callName = workflow.name || 'Sales Call';
        dates.forEach((date) => {
          const dateObj = new Date(`${date}T00:00:00`);
          const dayName = WEEKDAY_LABELS[dateObj.getDay()] || 'Monday';
          const availability = resolveAvailabilityWindow(workflow.availability, dayName);
          if (!availability?.enabled) return;
          const startMinutes = convertHHMMToMinutes(availability.start);
          const endMinutes = convertHHMMToMinutes(availability.end);
          if (startMinutes === null || endMinutes === null) return;

          const durationMinutes = baseDurationMinutes(workflow);
          const breaks = getBreakWindows(workflow, dayName);
          const assignedMemberId = workflow.assignedSalespersons?.[0];
          const assignedMemberName = assignedMemberId
            ? teamMemberMap.get(assignedMemberId)?.name || assignedMemberId
            : undefined;

          for (let current = startMinutes; current + durationMinutes <= endMinutes; current += durationMinutes) {
            if (doesOverlapBreak(current, durationMinutes, breaks)) continue;
            const startTime = minutesToHHMM(current);
            const endTime = minutesToHHMM(current + durationMinutes);
            const slotKey = createSlotKey(workflow.id, date, startTime);
            const appointment = appointmentMap.get(slotKey);
            const isBlocked = blockedSet.has(slotKey);
            const isCancelled = appointment?.status === 'cancelled' || appointment?.appointmentStatus === 'cancelled';
            const isBooked = Boolean(appointment) && !isCancelled;
            const status: SlotStatus = isBooked ? 'booked' : (isBlocked ? 'blocked' : 'available');
            slots.push({
              id: slotKey,
              callId: workflow.id,
              callName,
              bookingType: workflow.bookingType,
              date,
              startTime,
              endTime,
              durationMinutes,
              status,
              assignedMemberId: assignedMemberId ?? appointment?.assignedSalespersonId ?? undefined,
              assignedMemberName: assignedMemberName || (appointment?.assignedSalespersonId
                ? teamMemberMap.get(appointment.assignedSalespersonId)?.name || appointment.assignedSalespersonId
                : undefined),
              source: 'availability',
              booking: appointment || null,
            });
          }
        });
      });

      workspaceCustom.forEach((record) => {
        const workflow = workflows.find((call) => call.id === record.callId);
        if (!workflow) return;
        const durationMinutes = (() => {
          const start = convertHHMMToMinutes(record.startTime);
          const end = convertHHMMToMinutes(record.endTime);
          if (start !== null && end !== null && end > start) return end - start;
          return baseDurationMinutes(workflow);
        })();
        const startMinutes = convertHHMMToMinutes(record.startTime);
        if (startMinutes === null) return;
        const endTime = record.endTime || minutesToHHMM(startMinutes + durationMinutes);
        const slotKey = createSlotKey(record.callId, record.date, record.startTime);
        const appointment = appointmentMap.get(slotKey);
        const isBlocked = blockedSet.has(slotKey);
        const isCancelled = appointment?.status === 'cancelled' || appointment?.appointmentStatus === 'cancelled';
        const status: SlotStatus = appointment && !isCancelled
          ? 'booked'
          : (isBlocked ? 'blocked' : 'available');

        const assignedMemberId = workflow.assignedSalespersons?.[0];
        const assignedMemberName = assignedMemberId
          ? teamMemberMap.get(assignedMemberId)?.name || assignedMemberId
          : undefined;

        const existingIndex = slots.findIndex((slot) => slot.id === slotKey);
        const baseSlot: GeneratedSlot = {
          id: slotKey,
          callId: record.callId,
          callName: workflow.name || 'Sales Call',
          bookingType: workflow.bookingType,
          date: record.date,
          startTime: record.startTime,
          endTime,
          durationMinutes,
          status,
          assignedMemberId: assignedMemberId ?? appointment?.assignedSalespersonId ?? undefined,
          assignedMemberName: assignedMemberName || (appointment?.assignedSalespersonId
            ? teamMemberMap.get(appointment.assignedSalespersonId)?.name || appointment.assignedSalespersonId
            : undefined),
          source: 'custom',
          booking: appointment || null,
        };
        if (existingIndex >= 0) {
          slots[existingIndex] = baseSlot;
        } else {
          slots.push(baseSlot);
        }
      });

      return slots.sort((a, b) => {
        if (a.date === b.date) {
          if (a.startTime === b.startTime) return a.callName.localeCompare(b.callName);
          return a.startTime.localeCompare(b.startTime);
        }
        return a.date.localeCompare(b.date);
      });
    },
    [appointmentMap, teamMemberMap, workflows, workspaceBlocks, workspaceCustom],
  );

  const visibleDates = useMemo(() => (
    viewMode === 'day'
      ? [selectedDate]
      : getWeekDateRange(new Date(selectedDate))
  ), [selectedDate, viewMode]);

  const visibleSlots = useMemo(
    () => computeSlotsForDates(visibleDates),
    [computeSlotsForDates, visibleDates],
  );

  const filteredSlots = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return visibleSlots.filter((slot) => {
      const matchesCall = callFilter === 'all' || slot.callId === callFilter;
      const matchesStatus = statusFilter === 'all' || slot.status === statusFilter;
      const matchesMember = (() => {
        if (memberFilter === 'all') return true;
        if (memberFilter === 'unassigned') return !slot.assignedMemberId;
        return slot.assignedMemberId === memberFilter;
      })();
      const matchesSearch = !search || [
        slot.callName,
        slot.booking?.customerName,
        slot.booking?.customerEmail,
        slot.assignedMemberName,
      ].some((value) => value && value.toLowerCase().includes(search));
      return matchesCall && matchesStatus && matchesMember && matchesSearch;
    });
  }, [callFilter, memberFilter, searchQuery, statusFilter, visibleSlots]);

  const slotsByCall = useMemo(() => {
    const map = new Map<string, { workflow: Workflow | undefined; slots: GeneratedSlot[] }>();
    filteredSlots.forEach((slot) => {
      const existing = map.get(slot.callId);
      if (existing) {
        existing.slots.push(slot);
      } else {
        map.set(slot.callId, {
          workflow: workflows.find((workflow) => workflow.id === slot.callId),
          slots: [slot],
        });
      }
    });
    return Array.from(map.entries()).map(([callId, payload]) => ({ callId, ...payload })).sort((a, b) => {
      const nameA = a.workflow?.name || 'Sales Call';
      const nameB = b.workflow?.name || 'Sales Call';
      return nameA.localeCompare(nameB);
    });
  }, [filteredSlots, workflows]);

  const todayIso = getIsoDate(new Date());
  const weekTodayRange = getWeekDateRange(new Date());

  const statsToday = useMemo(
    () => summarizeSlots(computeSlotsForDates([todayIso])),
    [computeSlotsForDates, todayIso],
  );

  const statsWeek = useMemo(
    () => summarizeSlots(computeSlotsForDates(weekTodayRange)),
    [computeSlotsForDates, weekTodayRange],
  );

  const handleToggleBlock = (slot: GeneratedSlot) => {
    if (slot.status === 'booked') {
      toast({
        title: 'Slot already booked',
        description: 'Cancel the appointment before blocking this slot.',
        variant: 'destructive',
      });
      return;
    }
    setBlockedRecords((previous) => {
      const exists = previous.find((record) => (
        record.callId === slot.callId
        && record.date === slot.date
        && record.startTime === slot.startTime
        && workspaceMatches(record.workspaceId, workspaceId)
      ));
      let next: BlockRecord[];
      if (exists) {
        next = previous.filter((record) => record.id !== exists.id);
        toast({ title: 'Slot unblocked', description: `${slot.callName} on ${slot.date} at ${slot.startTime} is now available.` });
      } else {
        const newRecord: BlockRecord = {
          id: `block-${Date.now()}`,
          callId: slot.callId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          workspaceId,
        };
        next = [...previous, newRecord];
        toast({ title: 'Slot blocked', description: `${slot.callName} on ${slot.date} at ${slot.startTime} is now blocked.` });
      }
      localStorage.setItem(SLOT_BLOCK_STORAGE, JSON.stringify(next));
      return next;
    });
  };

  const handleRemoveCustomSlot = (slot: GeneratedSlot) => {
    setCustomRecords((previous) => {
      const next = previous.filter((record) => !(
        record.callId === slot.callId
        && record.date === slot.date
        && record.startTime === slot.startTime
        && workspaceMatches(record.workspaceId, workspaceId)
      ));
      localStorage.setItem(CUSTOM_SLOT_STORAGE, JSON.stringify(next));
      toast({ title: 'Custom slot removed', description: `${slot.callName} on ${slot.date} at ${slot.startTime}` });
      return next;
    });
  };

  const handleCreateCustomSlot = () => {
    if (!customForm.callId) {
      toast({ title: 'Select a sales call', description: 'Choose the sales call that this custom slot belongs to.', variant: 'destructive' });
      return;
    }
    const start = convertHHMMToMinutes(customForm.startTime);
    if (start === null) {
      toast({ title: 'Invalid start time', description: 'Enter a valid start time for the custom slot.', variant: 'destructive' });
      return;
    }
    const duration = Number.isFinite(customForm.duration) && customForm.duration > 0 ? customForm.duration : 30;
    const endTime = minutesToHHMM(start + duration);
    const newRecord: CustomSlotRecord = {
      id: `custom-${Date.now()}`,
      callId: customForm.callId,
      date: customForm.date,
      startTime: customForm.startTime,
      endTime,
      note: customForm.note?.trim() || undefined,
      workspaceId,
    };
    setCustomRecords((previous) => {
      const next = [...previous, newRecord];
      localStorage.setItem(CUSTOM_SLOT_STORAGE, JSON.stringify(next));
      return next;
    });
    toast({ title: 'Custom slot added', description: 'The custom slot has been added to the schedule.' });
    setIsCustomDialogOpen(false);
    setCustomForm((prev) => ({ ...prev, startTime: '09:00', duration: 30, note: '' }));
  };

  const resetFilters = () => {
    setCallFilter('all');
    setStatusFilter('all');
    setMemberFilter('all');
    setSearchQuery('');
  };

  const callOptions = useMemo(() => workflows.map((workflow) => ({ value: workflow.id, label: workflow.name || 'Sales Call' })), [workflows]);

  const memberOptions = useMemo(() => teamMembers.map((member) => ({ value: member.id, label: member.name || member.email || member.id })), [teamMembers]);

  const uniqueStatusCount = useMemo(() => summarizeSlots(filteredSlots), [filteredSlots]);

  const handleDateAdjust = (direction: -1 | 1) => {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      date.setDate(date.getDate() + direction);
    } else {
      date.setDate(date.getDate() + direction * 7);
    }
    setSelectedDate(getIsoDate(date));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">Time Slot Operations</h1>
            <p className="text-sm text-slate-600">
              Review every sales-call slot, apply filters, block availability, and inject custom openings across your team.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={viewMode === 'day' ? 'default' : 'outline'} onClick={() => setViewMode('day')} size="sm">
              <Calendar className="mr-2 h-4 w-4" /> Day
            </Button>
            <Button variant={viewMode === 'week' ? 'default' : 'outline'} onClick={() => setViewMode('week')} size="sm">
              <Users className="mr-2 h-4 w-4" /> Week
            </Button>
            <Button onClick={() => setIsCustomDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Custom Slot
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Today's Slots</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{statsToday.total}</p>
            <p className="text-xs text-slate-500">Booked {statsToday.booked} • Available {statsToday.available}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Week Overview</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{statsWeek.total}</p>
            <p className="text-xs text-slate-500">Booked {statsWeek.booked} • Blocked {statsWeek.blocked}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Visible Range</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{filteredSlots.length}</p>
            <p className="text-xs text-slate-500">Matches current filters</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Status Mix</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{uniqueStatusCount.booked} booked</p>
            <p className="text-xs text-slate-500">Blocked {uniqueStatusCount.blocked} • Available {uniqueStatusCount.available}</p>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => handleDateAdjust(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-[160px]"
                />
                <Button variant="ghost" size="icon" onClick={() => handleDateAdjust(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                {viewMode === 'day' ? 'Single day view' : 'Week view (Mon - Sun)'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-slate-500">Sales Call</label>
              <Select value={callFilter === 'all' ? 'all' : callFilter} onValueChange={(value) => setCallFilter(value === 'all' ? 'all' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All sales calls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sales calls</SelectItem>
                  {callOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Status</label>
              <Select value={statusFilter} onValueChange={(value: SlotStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Assigned Member</label>
              <Select value={memberFilter} onValueChange={(value) => setMemberFilter(value as typeof memberFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {memberOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-1">
              <label className="text-xs font-medium text-slate-500">Search</label>
              <Input
                placeholder="Search by call, contact, member"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
        </Card>

        {slotsByCall.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center text-slate-500">
            <Ban className="h-8 w-8" />
            <div>
              <p className="text-lg font-semibold text-slate-800">No slots match your filters</p>
              <p className="text-sm">Adjust your filters or create a custom slot to populate this view.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {slotsByCall.map(({ callId, workflow, slots }) => {
              const primaryMemberId = workflow?.assignedSalespersons?.[0];
              const memberName = primaryMemberId
                ? teamMemberMap.get(primaryMemberId)?.name || primaryMemberId
                : 'Unassigned';
              const bookingType = workflow?.bookingType || 'One-on-one';
              return (
                <Card key={callId} className="p-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{workflow?.name || 'Sales Call'}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {memberName}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {bookingType}</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Duration {baseDurationMinutes(workflow)} mins</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 lg:mt-0">
                      <Badge variant="secondary">{slots.length} slots</Badge>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-xs uppercase text-slate-500">
                        <tr>
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Time</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Customer</th>
                          <th className="pb-2">Owner</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {slots.map((slot) => {
                          const isBlocked = slot.status === 'blocked';
                          const isBooked = slot.status === 'booked';
                          const canBlock = slot.status !== 'booked';
                          return (
                            <tr key={slot.id} className="align-top">
                              <td className="py-3">{slot.date}</td>
                              <td className="py-3">{slot.startTime} - {slot.endTime}</td>
                              <td className="py-3">
                                {slot.status === 'available' && <Badge className="bg-emerald-100 text-emerald-700" variant="secondary">Available</Badge>}
                                {slot.status === 'booked' && <Badge className="bg-red-100 text-red-700" variant="secondary">Booked</Badge>}
                                {slot.status === 'blocked' && <Badge className="bg-amber-100 text-amber-700" variant="secondary">Blocked</Badge>}
                                {slot.source === 'custom' && (
                                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Custom</span>
                                )}
                              </td>
                              <td className="py-3">
                                {slot.booking ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-800">{slot.booking.customerName || 'Booked'}</span>
                                    {slot.booking.customerEmail && (
                                      <span className="text-xs text-slate-500">{slot.booking.customerEmail}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">No booking</span>
                                )}
                              </td>
                              <td className="py-3">
                                {slot.assignedMemberName ? (
                                  <span className="flex items-center gap-1 text-sm"><User className="h-4 w-4 text-slate-400" /> {slot.assignedMemberName}</span>
                                ) : (
                                  <span className="text-xs text-slate-400">Unassigned</span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {canBlock && (
                                    <Button
                                      size="sm"
                                      variant={isBlocked ? 'outline' : 'secondary'}
                                      onClick={() => handleToggleBlock(slot)}
                                    >
                                      {isBlocked ? (
                                        <>
                                          <Check className="mr-2 h-4 w-4" /> Unblock
                                        </>
                                      ) : (
                                        <>
                                          <Ban className="mr-2 h-4 w-4" /> Block
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {slot.source === 'custom' && (
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveCustomSlot(slot)}>
                                      <X className="mr-2 h-4 w-4" /> Remove
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add custom slot</DialogTitle>
              <DialogDescription>
                Inject an ad-hoc slot for a specific sales call. Custom slots respect blocking rules and bookings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Sales Call</label>
                <Select value={customForm.callId} onValueChange={(value) => setCustomForm((prev) => ({ ...prev, callId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales call" />
                  </SelectTrigger>
                  <SelectContent>
                    {callOptions.length === 0 && (
                      <SelectItem value="no-sales-calls" disabled>No sales calls found</SelectItem>
                    )}
                    {callOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-500">Date</label>
                  <Input
                    type="date"
                    value={customForm.date}
                    onChange={(event) => setCustomForm((prev) => ({ ...prev, date: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Start time</label>
                  <Input
                    type="time"
                    value={customForm.startTime}
                    onChange={(event) => setCustomForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-500">Duration (minutes)</label>
                  <Input
                    type="number"
                    min={10}
                    max={480}
                    value={customForm.duration}
                    onChange={(event) => setCustomForm((prev) => ({ ...prev, duration: Number.parseInt(event.target.value, 10) || 30 }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Internal note (optional)</label>
                  <Input
                    placeholder="Visible to admins only"
                    value={customForm.note}
                    onChange={(event) => setCustomForm((prev) => ({ ...prev, note: event.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCustomSlot}>
                <Plus className="mr-2 h-4 w-4" /> Save custom slot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
