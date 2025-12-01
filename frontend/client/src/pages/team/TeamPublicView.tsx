import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  ClipboardList,
  Share2,
  ExternalLink,
  Edit as EditIcon,
  Users,
  User,
  UserCog,
  UserCheck,
  UsersRound,
  Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type TeamPermission = { module: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
type TeamRole = 'Super Admin' | 'Admin' | 'Manager' | 'Staff';
type BookingType = 'one-on-one' | 'group' | 'collective';
type ScheduleType = 'one-time' | 'recurring';
type PriceType = 'free' | 'paid';
type BookingTemplate = {
  type: BookingType;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultName: string;
  defaultMinutes: string;
};
type NewCallDetails = {
  name: string;
  duration: { hours: string; minutes: string };
  price: PriceType;
  priceAmount: string;
  meetingMode: string;
  description: string;
  repeatFrequency: 'daily' | 'weekly' | 'monthly';
  repeatEvery: string;
  repeatUnit: 'Day(s)' | 'Week(s)' | 'Month(s)';
  numberOfRecurrences: string;
};

const ROLE_PERMISSION_TEMPLATES: Record<TeamRole, TeamPermission[]> = {
  'Super Admin': [
    { module: 'Appointments', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Sales Calls', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Booking Pages', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Availability', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Team', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Settings', canView: true, canCreate: true, canEdit: true, canDelete: true },
  ],
  'Admin': [
    { module: 'Appointments', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Sales Calls', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Booking Pages', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Availability', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Team', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Settings', canView: true, canCreate: true, canEdit: true, canDelete: false },
  ],
  'Manager': [
    { module: 'Appointments', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Sales Calls', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Booking Pages', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Availability', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Team', canView: true, canCreate: false, canEdit: true, canDelete: false },
    { module: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
  ],
  'Staff': [
    { module: 'Appointments', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Sales Calls', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Booking Pages', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Availability', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Team', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
  ],
};

const generateLocalId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const clonePermissions = (perms: TeamPermission[]): TeamPermission[] => perms.map((perm) => ({ ...perm }));

const getRolePermissionTemplate = (role: TeamRole): TeamPermission[] =>
  clonePermissions(ROLE_PERMISSION_TEMPLATES[role] || ROLE_PERMISSION_TEMPLATES['Staff']);

const mergePermissionsWithRole = (role: TeamRole, existing?: TeamPermission[]): TeamPermission[] => {
  const template = getRolePermissionTemplate(role);
  if (!existing || existing.length === 0) return template;
  const byModule = new Map(template.map((perm) => [perm.module, perm]));
  for (const perm of existing) {
    if (!perm || !perm.module) continue;
    const current = byModule.get(perm.module);
    byModule.set(perm.module, current ? { ...current, ...perm } : { ...perm });
  }
  return Array.from(byModule.values());
};

interface Appointment {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

type SectionKey = 'appointments' | 'sales-calls' | 'booking-pages' | 'availability' | 'team-members' | 'profile';

const SECTION_CONFIG: Array<{ id: SectionKey; label: string; module?: string }> = [
  { id: 'appointments', label: 'Appointments', module: 'Appointments' },
  { id: 'sales-calls', label: 'Sales Calls', module: 'Sales Calls' },
  { id: 'booking-pages', label: 'Booking Pages', module: 'Booking Pages' },
  { id: 'availability', label: 'Availability', module: 'Availability' },
  { id: 'team-members', label: 'Team Members', module: 'Team' },
  { id: 'profile', label: 'Profile' },
];

const BOOKING_TYPE_CONFIG: BookingTemplate[] = [
  {
    type: 'one-on-one',
    title: 'One-on-One',
    description: 'Ideal for support calls, client meetings, and any one-to-one meetings.',
    icon: UserCheck,
    defaultName: 'One-on-One Meeting',
    defaultMinutes: '30',
  },
  {
    type: 'group',
    title: 'Group Booking',
    description: 'Ideal for workshops, webinars, and classes.',
    icon: Users,
    defaultName: 'Group Session',
    defaultMinutes: '45',
  },
  {
    type: 'collective',
    title: 'Collective Booking',
    description: 'Ideal for panel interviews, board meetings, and many-to-one meetings.',
    icon: UsersRound,
    defaultName: 'Collective Consultation',
    defaultMinutes: '60',
  },
];

const buildDefaultNewCallDetails = (template: BookingTemplate): NewCallDetails => ({
  name: template.defaultName,
  duration: { hours: '0', minutes: template.defaultMinutes },
  price: 'free',
  priceAmount: '0',
  meetingMode: '',
  description: '',
  repeatFrequency: 'daily',
  repeatEvery: '1',
  repeatUnit: 'Day(s)',
  numberOfRecurrences: '1',
});

export default function TeamPublicView() {
  const [, params] = useRoute('/team/public/:memberId');
  const memberId = params?.memberId || '';

  const [memberName, setMemberName] = useState('Team Member');
  const [memberRole, setMemberRole] = useState<TeamRole>('Staff');
  const [memberEmail, setMemberEmail] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<TeamPermission[]>([]);
  const [calls, setCalls] = useState<Array<{ id: string; name: string; workspace?: string }>>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [section, setSection] = useState<SectionKey>('appointments');
  const { workspaces } = useWorkspace();
  const [isCreateCallOpen, setIsCreateCallOpen] = useState(false);
  const [createCallStep, setCreateCallStep] = useState<1 | 2 | 3>(1);
  const [selectedBookingType, setSelectedBookingType] = useState<BookingType | null>(BOOKING_TYPE_CONFIG[0]?.type ?? null);
  const [selectedScheduleType, setSelectedScheduleType] = useState<ScheduleType | null>(null);
  const [newCallDetails, setNewCallDetails] = useState<NewCallDetails>(() => buildDefaultNewCallDetails(BOOKING_TYPE_CONFIG[0]));
  const [newCallWorkspaceId, setNewCallWorkspaceId] = useState<string | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<{ name: string; phone: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: TeamRole; email?: string }>>([]);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [inviteMember, setInviteMember] = useState<{ name: string; email: string; role: TeamRole; workspaceId: string | 'all' }>(
    { name: '', email: '', role: 'Staff', workspaceId: 'all' }
  );

  useEffect(() => {
    if (memberRole === 'Super Admin') {
      try {
        window.location.replace('/dashboard');
      } catch {}
    }
  }, [memberRole]);


  const loadTeamMembers = useCallback(() => {
    try {
      const raw = localStorage.getItem('zervos_salespersons');
      if (!raw) {
        setTeamMembers([]);
        return;
      }
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const mapped = arr
          .filter((m: any) => m)
          .map((m: any) => ({
            id: m.id || m.email || generateLocalId(),
            name: m.name || m.email || 'Team Member',
            role: (m.role as TeamRole) || 'Staff',
            email: m.email,
          }));
        setTeamMembers(mapped);
      } else {
        setTeamMembers([]);
      }
    } catch {
      setTeamMembers([]);
    }
  }, []);

  // Load member basic info
  useEffect(() => {
    try {
      const raw = localStorage.getItem('zervos_salespersons');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const m = arr.find((p: any) => p?.id === memberId || p?.email === memberId);
          if (m) {
            setMemberName(m.name || m.email || 'Team Member');
            setMemberRole((m.role as TeamRole) || 'Staff');
            setMemberEmail(m.email || null);
            // Merge role defaults so missing modules still appear
            setPermissions(mergePermissionsWithRole((m.role as TeamRole) || 'Staff', m.permissions));
          }
        }
      }
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'zervos_salespersons') {
        try {
          const raw2 = localStorage.getItem('zervos_salespersons');
          const arr2 = raw2 ? JSON.parse(raw2) : [];
          const m2 = Array.isArray(arr2) ? arr2.find((p: any) => p?.id === memberId || p?.email === memberId) : null;
          if (m2) {
            setMemberName(m2.name || m2.email || 'Team Member');
            setMemberRole((m2.role as TeamRole) || 'Staff');
            setMemberEmail(m2.email || null);
            setPermissions(mergePermissionsWithRole((m2.role as TeamRole) || 'Staff', m2.permissions));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [memberId]);

  // Load assigned calls across all workspaces
  const loadAssignedCalls = () => {
    if (!memberId) return;
    const getKeysByPrefix = (prefix: string) => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      return keys;
    };
    const callKeys = [...getKeysByPrefix('zervos_sales_calls::'), 'zervos_sales_calls'];
    const mine: Array<{ id: string; name: string; workspace?: string }> = [];
    for (const key of callKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const c of arr) {
            const assigned = Array.isArray(c?.assignedSalespersons) ? c.assignedSalespersons : [];
            const includesId = assigned.includes(memberId);
            const includesEmail = memberEmail ? assigned.includes(memberEmail) : false;
            const includesObjId = assigned.some((x: any) => x && typeof x === 'object' && (x.id === memberId || (memberEmail && x.email === memberEmail)));
            if (includesId || includesEmail || includesObjId) {
              mine.push({ id: c.id, name: c.name, workspace: key.includes('::') ? key.split('::')[1] : undefined });
            }
          }
        }
      } catch {}
    }
    setCalls(mine);
  };

  useEffect(() => {
    loadAssignedCalls();
    const onUpdated = () => loadAssignedCalls();
    const onStorage = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('zervos_sales_calls::') || e.key === 'zervos_sales_calls')) loadAssignedCalls();
    };
    window.addEventListener('sales-calls-updated', onUpdated as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('sales-calls-updated', onUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [memberId, memberEmail]);

  useEffect(() => {
    loadTeamMembers();
    const onTeamUpdated = () => loadTeamMembers();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'zervos_salespersons' || e.key.startsWith('zervos_team_members')) {
        loadTeamMembers();
      }
    };
    window.addEventListener('team-members-updated', onTeamUpdated as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('team-members-updated', onTeamUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [loadTeamMembers]);

  // Load member appointments
  useEffect(() => {
    if (!memberId) return;
    fetch(`/api/appointments?assignedMemberId=${encodeURIComponent(memberId)}`)
      .then(res => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(() => setAppointments([]));
  }, [memberId]);

  const filteredCalls = useMemo(() =>
    calls.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase())), [calls, searchQ]
  );

  const currentBookingTemplate = useMemo(
    () =>
      BOOKING_TYPE_CONFIG.find((config) => config.type === (selectedBookingType ?? BOOKING_TYPE_CONFIG[0].type)) ||
      BOOKING_TYPE_CONFIG[0],
    [selectedBookingType]
  );

  const can = useCallback((module: string, action: 'view'|'create'|'edit'|'delete') => {
    const perm = permissions.find(p => p.module === module);
    if (!perm) return false;
    if (action === 'view') return !!perm.canView;
    if (action === 'create') return !!perm.canCreate;
    if (action === 'edit') return !!perm.canEdit;
    if (action === 'delete') return !!perm.canDelete;
    return false;
  }, [permissions]);

  const visibleSectionConfigs = useMemo(
    () => SECTION_CONFIG.filter((config) => !config.module || can(config.module, 'view')),
    [can]
  );

  useEffect(() => {
    if (!visibleSectionConfigs.length) return;
    if (!visibleSectionConfigs.some((config) => config.id === section)) {
      setSection(visibleSectionConfigs[0].id);
    }
  }, [section, visibleSectionConfigs]);

  const teamLink = useMemo(() => {
    if (!memberId) return '';
    try {
      return `${window.location.origin}/team/public/${memberId}`;
    } catch {
      return `/team/public/${memberId}`;
    }
  }, [memberId]);

  const availableRolesForInvite: TeamRole[] = useMemo(() => {
    if (memberRole === 'Admin') return ['Admin', 'Manager', 'Staff'];
    if (memberRole === 'Manager') return ['Staff'];
    if (memberRole === 'Staff') return ['Staff'];
    return ['Super Admin', 'Admin', 'Manager', 'Staff'];
  }, [memberRole]);

  useEffect(() => {
    if (!availableRolesForInvite.includes(inviteMember.role)) {
      const fallback = availableRolesForInvite[0] || 'Staff';
      setInviteMember((prev) => ({ ...prev, role: fallback }));
    }
  }, [availableRolesForInvite, inviteMember.role]);

  const handleInviteMember = () => {
    try {
      const role = availableRolesForInvite.includes(inviteMember.role)
        ? inviteMember.role
        : availableRolesForInvite[0] || 'Staff';
      const id = generateLocalId();
      const baseMember = {
        id,
        name: inviteMember.name.trim() || inviteMember.email.trim() || 'New Team Member',
        email: inviteMember.email.trim() || undefined,
        role,
        permissions: getRolePermissionTemplate(role),
      };

      const salespersonsRaw = localStorage.getItem('zervos_salespersons');
      const salespersonsArr = salespersonsRaw ? JSON.parse(salespersonsRaw) : [];
      const updatedSalespersons = Array.isArray(salespersonsArr) ? [...salespersonsArr, baseMember] : [baseMember];
      localStorage.setItem('zervos_salespersons', JSON.stringify(updatedSalespersons));

      const teamRaw = localStorage.getItem('zervos_team_members');
      const teamArr = teamRaw ? JSON.parse(teamRaw) : [];
      const updatedTeam = Array.isArray(teamArr) ? [...teamArr, baseMember] : [baseMember];
      localStorage.setItem('zervos_team_members', JSON.stringify(updatedTeam));

      if (inviteMember.workspaceId === 'all') {
        workspaces.forEach((ws) => {
          const key = `zervos_team_members::${ws.id}`;
          const scopedRaw = localStorage.getItem(key);
          const scopedArr = scopedRaw ? JSON.parse(scopedRaw) : [];
          const updatedScoped = Array.isArray(scopedArr) ? [...scopedArr, baseMember] : [baseMember];
          localStorage.setItem(key, JSON.stringify(updatedScoped));
        });
      } else if (inviteMember.workspaceId) {
        const key = `zervos_team_members::${inviteMember.workspaceId}`;
        const scopedRaw = localStorage.getItem(key);
        const scopedArr = scopedRaw ? JSON.parse(scopedRaw) : [];
        const updatedScoped = Array.isArray(scopedArr) ? [...scopedArr, baseMember] : [baseMember];
        localStorage.setItem(key, JSON.stringify(updatedScoped));
      }

      window.dispatchEvent(new CustomEvent('team-members-updated'));
  setInviteMember({ name: '', email: '', role: availableRolesForInvite[0] || 'Staff', workspaceId: 'all' });
      setIsInviteMemberOpen(false);
      loadTeamMembers();
    } catch {}
  };

  const resetCreateCallFlow = useCallback(
    (workspaceId: string | null) => {
      const defaultTemplate = BOOKING_TYPE_CONFIG[0];
      setCreateCallStep(1);
      setSelectedBookingType(defaultTemplate.type);
      setSelectedScheduleType(null);
      setNewCallDetails(buildDefaultNewCallDetails(defaultTemplate));
      setNewCallWorkspaceId(workspaceId);
      setSelectedAssignees(memberId ? [memberId] : []);
      setAssigneeSearch('');
    },
    [memberId]
  );

  const handleOpenCreateCall = useCallback(() => {
    const defaultWorkspace = newCallWorkspaceId ?? workspaces[0]?.id ?? null;
    resetCreateCallFlow(defaultWorkspace);
    setIsCreateCallOpen(true);
  }, [newCallWorkspaceId, resetCreateCallFlow, workspaces]);

  const handleCreateCallDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetCreateCallFlow(newCallWorkspaceId ?? workspaces[0]?.id ?? null);
      }
      setIsCreateCallOpen(open);
    },
    [newCallWorkspaceId, resetCreateCallFlow, workspaces]
  );

  const handleBookingTypeSelect = useCallback(
    (type: BookingType) => {
      const targetTemplate = BOOKING_TYPE_CONFIG.find((config) => config.type === type) || BOOKING_TYPE_CONFIG[0];
      const previousTemplate = BOOKING_TYPE_CONFIG.find((config) => config.type === (selectedBookingType ?? targetTemplate.type));
      setSelectedBookingType(type);
      setNewCallDetails((prev) => {
        const shouldReplaceName = !prev.name || (previousTemplate && prev.name === previousTemplate.defaultName);
        const shouldReplaceDuration =
          prev.duration.hours === '0' && previousTemplate && prev.duration.minutes === previousTemplate.defaultMinutes;
        return {
          ...prev,
          name: shouldReplaceName ? targetTemplate.defaultName : prev.name,
          duration: {
            hours: shouldReplaceDuration ? '0' : prev.duration.hours,
            minutes: shouldReplaceDuration ? targetTemplate.defaultMinutes : prev.duration.minutes,
          },
        };
      });
      if (type === 'collective') {
        setSelectedScheduleType('one-time');
        setCreateCallStep(2);
      }
    },
    [selectedBookingType]
  );

  const handleScheduleTypeSelect = useCallback((type: ScheduleType) => {
    setSelectedScheduleType(type);
    setCreateCallStep(2);
  }, []);

  const handleContinueFromDetails = useCallback(() => {
    if (!newCallDetails.name.trim()) return;
    setCreateCallStep(3);
  }, [newCallDetails.name]);

  const handleBackToTypeSelection = useCallback(() => {
    setCreateCallStep(1);
  }, []);

  const handleBackToDetails = useCallback(() => {
    setCreateCallStep(2);
  }, []);

  const handleToggleAssignee = useCallback(
    (id: string) => {
      if (!id || id === memberId) return;
      setSelectedAssignees((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
    },
    [memberId]
  );

  const teamRoster = useMemo(() => {
    if (!memberId) return teamMembers;
    const exists = teamMembers.some((member) => member.id === memberId || (memberEmail && member.email === memberEmail));
    if (exists) return teamMembers;
    return [
      ...teamMembers,
      {
        id: memberId,
        name: memberName,
        role: memberRole,
        email: memberEmail || undefined,
      },
    ];
  }, [teamMembers, memberId, memberEmail, memberName, memberRole]);

  const filteredAssignees = useMemo(() => {
    const term = assigneeSearch.trim().toLowerCase();
    if (!term) return teamRoster;
    return teamRoster.filter((member) =>
      `${member.name} ${member.email ?? ''}`.toLowerCase().includes(term)
    );
  }, [assigneeSearch, teamRoster]);

  useEffect(() => {
    if (!memberId) return;
    setSelectedAssignees((prev) => (prev.includes(memberId) ? prev : [memberId, ...prev]));
  }, [memberId]);

  const handleCreateCall = useCallback(() => {
    try {
      const workspaceFallback = workspaces[0]?.id || null;
      const wsId = newCallWorkspaceId || workspaceFallback;
      const bookingType = selectedBookingType || BOOKING_TYPE_CONFIG[0].type;
      const scheduleType = selectedScheduleType || 'one-time';
      if (!wsId) return;

      const key = `zervos_sales_calls::${wsId}`;
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const id = Date.now().toString();
      const triggerType = bookingType === 'collective' ? 'collective' : bookingType === 'group' ? 'group' : 'one-on-one';
      const descriptionFallback =
        bookingType === 'one-on-one'
          ? 'Ideal for one-to-one meetings'
          : bookingType === 'group'
            ? 'Ideal for workshops and classes'
            : 'Ideal for panel and board meetings';

      const assigned = Array.from(
        new Set(
          [memberId, memberEmail, ...selectedAssignees].filter((value): value is string => Boolean(value && value.length))
        )
      );

      const wf = {
        id,
        name: newCallDetails.name.trim() || currentBookingTemplate.defaultName,
        trigger: triggerType,
        action: `${newCallDetails.duration.hours}h ${newCallDetails.duration.minutes}m`,
        isActive: true,
        runsCount: 0,
        description: newCallDetails.description.trim() || descriptionFallback,
        duration: newCallDetails.duration,
        price: newCallDetails.price,
        priceAmount: newCallDetails.price === 'paid' ? (newCallDetails.priceAmount || '0') : '0',
        meetingMode: newCallDetails.meetingMode,
        bookingType,
        scheduleType,
        assignedSalespersons: assigned,
        repeatFrequency: scheduleType === 'recurring' ? newCallDetails.repeatFrequency : undefined,
        repeatEvery: scheduleType === 'recurring' ? newCallDetails.repeatEvery : undefined,
        repeatUnit: scheduleType === 'recurring' ? newCallDetails.repeatUnit : undefined,
        numberOfRecurrences: scheduleType === 'recurring' ? newCallDetails.numberOfRecurrences : undefined,
      };

      const updated = Array.isArray(arr) ? [...arr, wf] : [wf];
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('sales-calls-updated', { detail: { workspaceId: wsId } }));
      loadAssignedCalls();
      setIsCreateCallOpen(false);
      resetCreateCallFlow(wsId);
    } catch {}
  }, [
    currentBookingTemplate.defaultName,
    loadAssignedCalls,
    memberEmail,
    memberId,
    newCallDetails,
    newCallWorkspaceId,
    resetCreateCallFlow,
    selectedAssignees,
    selectedBookingType,
    selectedScheduleType,
    workspaces,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950 p-4 gap-2">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Team Portal</div>
          {visibleSectionConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setSection(config.id)}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                section === config.id ? 'bg-white/10 text-white shadow-lg shadow-purple-900/40' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="font-medium">{config.label}</span>
              {config.module && config.module.toLowerCase() !== config.label.toLowerCase() && (
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                  {config.module}
                </span>
              )}
            </button>
          ))}
        </aside>

        <div className="flex-1 flex flex-col bg-gray-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Team Portal</div>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">{memberName}</h1>
                <p className="text-sm text-slate-500">
                  Role: {memberRole}
                  {memberEmail ? ` • ${memberEmail}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {teamLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigator.clipboard.writeText(teamLink)}
                  >
                    <Share2 size={14} />
                    Copy Team Link
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 space-y-6 md:px-8">
              {(can('Sales Calls','view') || can('Appointments','view') || can('Team','view')) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {can('Sales Calls','view') && (
                    <Card>
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div>
                          <div className="text-sm text-slate-500">Assigned Calls</div>
                          <div className="text-2xl font-semibold text-slate-900">{calls.length}</div>
                        </div>
                        <Users className="text-purple-600" />
                      </CardContent>
                    </Card>
                  )}
                  {can('Appointments','view') && (
                    <Card>
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div>
                          <div className="text-sm text-slate-500">Appointments</div>
                          <div className="text-2xl font-semibold text-slate-900">{appointments.length}</div>
                        </div>
                        <Calendar className="text-purple-600" />
                      </CardContent>
                    </Card>
                  )}
                  {can('Team','view') && (
                    <Card>
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div>
                          <div className="text-sm text-slate-500">Team Members</div>
                          <div className="text-2xl font-semibold text-slate-900">{teamMembers.length}</div>
                        </div>
                        <ClipboardList className="text-purple-600" />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <Tabs value={section} onValueChange={(value) => setSection(value as SectionKey)}>
                <TabsList className="mb-6 flex flex-wrap gap-2 md:hidden">
                  {visibleSectionConfigs.map((config) => (
                    <TabsTrigger key={config.id} value={config.id} className="px-5">
                      {config.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {can('Appointments','view') && (
                  <TabsContent value="appointments">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-3">
                          <Tabs defaultValue="upcoming">
                            <TabsList className="gap-2">
                              <TabsTrigger value="upcoming" className="px-6">Upcoming</TabsTrigger>
                              <TabsTrigger value="past" className="px-6">Past</TabsTrigger>
                              <TabsTrigger value="custom" className="px-6">Custom Date</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                        {can('Appointments','create') && (
                          <Button className="bg-indigo-600 hover:bg-indigo-700">
                            New Appointment
                          </Button>
                        )}
                      </div>

                      <Card>
                        <CardContent className="space-y-3 p-4">
                          {appointments.length === 0 ? (
                            <div className="py-16 text-center text-sm text-slate-500">No upcoming appointments</div>
                          ) : (
                            <div className="space-y-2">
                              {appointments.map((a) => (
                                <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                                  <div>
                                    <div className="font-medium text-slate-900">{a.customerName}</div>
                                    <div className="text-xs text-slate-500">{a.date} • {a.time}</div>
                                  </div>
                                  <div className="text-sm text-slate-700">{a.serviceName}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}

                {can('Sales Calls','view') && (
                  <TabsContent value="sales-calls">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="w-full md:w-80">
                          <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search calls" />
                        </div>
                        {can('Sales Calls','create') && (
                          <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleOpenCreateCall}
                          >
                            New Call
                          </Button>
                        )}
                      </div>
                      <Card>
                        <CardContent className="space-y-3 p-4">
                          {filteredCalls.length === 0 ? (
                            <div className="text-sm text-slate-500">No calls assigned</div>
                          ) : (
                            <div className="space-y-2">
                              {filteredCalls.map((c) => (
                                <div key={c.id} className="rounded-md border p-3">
                                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <div className="font-medium text-slate-900">{c.name}</div>
                                      {c.workspace && <div className="text-xs text-slate-500">Workspace: {c.workspace}</div>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button variant="outline" size="sm" onClick={() => window.open(`/book/${c.id}`, '_blank')} className="gap-1">
                                        <ExternalLink size={14} />Open Booking Page
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(window.location.origin + `/book/${c.id}`)} className="gap-1">
                                        <Share2 size={14} />Copy Link
                                      </Button>
                                      {memberRole === 'Super Admin' && can('Sales Calls','edit') && (
                                        <Button variant="outline" size="sm" onClick={() => { window.location.href = '/dashboard/callbacks'; }} className="gap-1">
                                          <EditIcon size={14} />Edit in Dashboard
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}

                {can('Booking Pages','view') && (
                  <TabsContent value="booking-pages">
                    <Card>
                      <CardContent className="space-y-2 p-4">
                        <div className="text-sm text-slate-600">Your booking page links for assigned calls</div>
                        {filteredCalls.length === 0 ? (
                          <div className="text-sm text-slate-500">No calls assigned</div>
                        ) : (
                          <div className="space-y-2">
                            {filteredCalls.map((c) => (
                              <div key={c.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                                <div className="text-sm font-medium text-slate-900">/book/{c.id}</div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => window.open(`/book/${c.id}`, '_blank')}>
                                    Open
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(window.location.origin + `/book/${c.id}`)}>
                                    Copy
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {can('Availability','view') && (
                  <TabsContent value="availability">
                    <Card>
                      <CardContent className="space-y-4 p-4">
                        <div className="text-sm text-slate-600">Weekly availability (read-only)</div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => (
                            <div key={day} className="flex items-center justify-between rounded-md border p-3">
                              <div className="font-medium text-slate-900">{day}</div>
                              <div className="text-xs text-slate-500">See Admin Center for details</div>
                            </div>
                          ))}
                        </div>
                        {memberRole === 'Super Admin' && can('Availability','edit') && (
                          <Button variant="outline" onClick={() => { window.location.href = '/dashboard/admin-center'; }}>
                            Edit Availability in Admin Center
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {can('Team','view') && (
                  <TabsContent value="team-members">
                    <div className="space-y-4">
                      {(can('Team','create') || can('Team','edit')) && (
                        <div className="flex justify-end">
                          <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => {
                              setInviteMember({ name: '', email: '', role: availableRolesForInvite[0] || 'Staff', workspaceId: 'all' });
                              setIsInviteMemberOpen(true);
                            }}
                          >
                            Invite Team Member
                          </Button>
                        </div>
                      )}
                      <Card>
                        <CardContent className="space-y-3 p-4">
                          {teamMembers.length === 0 ? (
                            <div className="text-sm text-slate-500">No team members yet</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-100">
                                <thead>
                                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    <th className="py-2 pr-4">Name</th>
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2">Role</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                  {teamMembers.map((member) => (
                                    <tr key={member.id}>
                                      <td className="py-3 pr-4 font-medium text-slate-900">{member.name}</td>
                                      <td className="py-3 pr-4 text-slate-500">{member.email || '—'}</td>
                                      <td className="py-3 text-slate-500">{member.role}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="profile">
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-xs text-slate-500">Name</Label>
                          <div className="text-sm font-medium text-slate-900">{memberName}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500">Role</Label>
                          <div className="text-sm font-medium text-slate-900">{memberRole}</div>
                        </div>
                      </div>
                      {(can('Team','edit') || can('Settings','edit')) && (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditProfile({ name: memberName, phone: '' });
                              setIsEditProfileOpen(true);
                            }}
                          >
                            Edit Profile
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Create Call Dialog */}
      <Dialog open={isCreateCallOpen} onOpenChange={handleCreateCallDialogChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {createCallStep === 1 && (
            <>
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-center text-2xl">Create New Consultation</DialogTitle>
                <DialogDescription className="text-center">
                  Choose how you want to meet with clients.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-6">
                {BOOKING_TYPE_CONFIG.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedBookingType === template.type;
                  return (
                    <div
                      key={template.type}
                      className={`cursor-pointer rounded-lg border-2 bg-white p-6 transition-all hover:border-indigo-300 ${
                        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                      }`}
                      onClick={() => {
                        handleBookingTypeSelect(template.type);
                        if (template.type === 'collective') {
                          handleScheduleTypeSelect('one-time');
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-purple-100 p-4">
                          <Icon size={28} className="text-purple-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{template.title}</h3>
                            <Info size={16} className="text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-600">{template.description}</p>
                          {template.type !== 'collective' && isSelected && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant={selectedScheduleType === 'one-time' ? 'default' : 'outline'}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleScheduleTypeSelect('one-time');
                                }}
                              >
                                One Time
                              </Button>
                              <Button
                                variant={selectedScheduleType === 'recurring' ? 'default' : 'outline'}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleScheduleTypeSelect('recurring');
                                }}
                              >
                                Recurring
                              </Button>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase text-indigo-700">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <p className="text-center text-xs text-slate-500">
                  Select a consultation type. For one-on-one and group formats, choose a schedule style to continue.
                </p>
              </div>
            </>
          )}

          {createCallStep === 2 && (
            <>
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-lg font-semibold text-slate-900">Consultation Details</DialogTitle>
                <DialogDescription>
                  {currentBookingTemplate.title} • {selectedScheduleType === 'recurring' ? 'Recurring' : 'One Time'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newCallDetails.name}
                    onChange={(e) => setNewCallDetails((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={currentBookingTemplate.defaultName}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newCallDetails.description}
                    onChange={(e) => setNewCallDetails((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Add an optional description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <Select
                      value={newCallDetails.duration.hours}
                      onValueChange={(value) =>
                        setNewCallDetails((prev) => ({
                          ...prev,
                          duration: { ...prev.duration, hours: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour} hours
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Minutes</Label>
                    <Select
                      value={newCallDetails.duration.minutes}
                      onValueChange={(value) =>
                        setNewCallDetails((prev) => ({
                          ...prev,
                          duration: { ...prev.duration, minutes: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="30" />
                      </SelectTrigger>
                      <SelectContent>
                        {['0', '15', '30', '45'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Price</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={newCallDetails.price === 'free' ? 'default' : 'outline'}
                      onClick={() => setNewCallDetails((prev) => ({ ...prev, price: 'free', priceAmount: '0' }))}
                      className="flex-1"
                    >
                      Free
                    </Button>
                    <Button
                      variant={newCallDetails.price === 'paid' ? 'default' : 'outline'}
                      onClick={() => setNewCallDetails((prev) => ({ ...prev, price: 'paid' }))}
                      className="flex-1"
                    >
                      Paid
                    </Button>
                  </div>
                  {newCallDetails.price === 'paid' && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border px-3 py-2 text-slate-500">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={newCallDetails.priceAmount}
                        onChange={(e) => setNewCallDetails((prev) => ({ ...prev, priceAmount: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Meeting Mode</Label>
                  <Select
                    value={newCallDetails.meetingMode}
                    onValueChange={(value) => setNewCallDetails((prev) => ({ ...prev, meetingMode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meeting mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Conference</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedScheduleType === 'recurring' && (
                  <div className="space-y-4 rounded-lg border border-dashed border-purple-200 bg-purple-50/40 p-4">
                    <div className="font-semibold text-slate-700">Recurring Information</div>
                    <div className="space-y-2">
                      <Label>Repeat frequency</Label>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            { id: 'daily', label: 'Daily', unit: 'Day(s)' },
                            { id: 'weekly', label: 'Weekly', unit: 'Week(s)' },
                            { id: 'monthly', label: 'Monthly', unit: 'Month(s)' },
                          ] as const
                        ).map((option) => (
                          <Button
                            key={option.id}
                            type="button"
                            variant={newCallDetails.repeatFrequency === option.id ? 'default' : 'outline'}
                            onClick={() =>
                              setNewCallDetails((prev) => ({
                                ...prev,
                                repeatFrequency: option.id,
                                repeatUnit: option.unit,
                              }))
                            }
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <Label>Repeat every</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newCallDetails.repeatEvery}
                          onChange={(e) => setNewCallDetails((prev) => ({ ...prev, repeatEvery: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Number of recurrences</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newCallDetails.numberOfRecurrences}
                          onChange={(e) => setNewCallDetails((prev) => ({ ...prev, numberOfRecurrences: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={handleBackToTypeSelection}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleCreateCallDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleContinueFromDetails} disabled={!newCallDetails.name.trim()}>
                    Continue
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {createCallStep === 3 && (
            <>
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-lg font-semibold text-slate-900">Assign &amp; Publish</DialogTitle>
                <DialogDescription>Select which team members can host this consultation.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Search Team</Label>
                  <Input
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    placeholder="Search by name or email"
                  />
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {filteredAssignees.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      No team members match your search.
                    </div>
                  ) : (
                    filteredAssignees.map((member) => {
                      const safeId = member.id || member.email || member.name;
                      const isYou = Boolean(
                        memberId && (member.id === memberId || (memberEmail && member.email === memberEmail))
                      );
                      const checked = isYou || selectedAssignees.includes(safeId);
                      return (
                        <label
                          key={safeId}
                          className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm hover:border-indigo-300"
                        >
                          <div>
                            <div className="font-medium text-slate-900">
                              {member.name}
                              {isYou ? ' (You)' : ''}
                            </div>
                            <div className="text-xs text-slate-500">{member.email || member.role}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isYou}
                            onChange={() => handleToggleAssignee(safeId)}
                            className="h-4 w-4 accent-indigo-600"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Workspace</Label>
                  <select
                    value={newCallWorkspaceId ?? ''}
                    onChange={(e) => setNewCallWorkspaceId(e.target.value ? e.target.value : null)}
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="" disabled>
                      Select workspace
                    </option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={handleBackToDetails}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleCreateCallDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCall}
                    disabled={!newCallWorkspaceId || !newCallDetails.name.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create Consultation
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your display name and phone</DialogDescription>
          </DialogHeader>
          {editProfile && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Name</Label>
                <Input value={editProfile.name} onChange={(e)=>setEditProfile({ ...editProfile, name: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editProfile.phone} onChange={(e)=>setEditProfile({ ...editProfile, phone: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={()=>{
              try {
                if (!editProfile) return;
                // Update admin unified store
                const raw = localStorage.getItem('zervos_salespersons');
                const arr = raw ? JSON.parse(raw) : [];
                const updated = Array.isArray(arr) ? arr.map((p:any)=>{
                  if (p?.id === memberId || p?.email === memberId) {
                    return { ...p, name: editProfile.name, phone: editProfile.phone };
                  }
                  return p;
                }) : arr;
                localStorage.setItem('zervos_salespersons', JSON.stringify(updated));
                // Update team members (global)
                const rawTM = localStorage.getItem('zervos_team_members');
                if (rawTM) {
                  try {
                    const arrTM = JSON.parse(rawTM);
                    const updTM = Array.isArray(arrTM) ? arrTM.map((m:any)=> (m?.id===memberId || m?.email===memberId) ? { ...m, name: editProfile.name, phone: editProfile.phone } : m) : arrTM;
                    localStorage.setItem('zervos_team_members', JSON.stringify(updTM));
                  } catch {}
                }
                // Update workspace-scoped team members
                for (let i=0;i<localStorage.length;i++){
                  const k = localStorage.key(i);
                  if (k && k.startsWith('zervos_team_members::')){
                    try {
                      const rawW = localStorage.getItem(k);
                      const arrW = rawW ? JSON.parse(rawW) : [];
                      const updW = Array.isArray(arrW) ? arrW.map((m:any)=> (m?.id===memberId || m?.email===memberId) ? { ...m, name: editProfile.name, phone: editProfile.phone } : m) : arrW;
                      localStorage.setItem(k, JSON.stringify(updW));
                    } catch {}
                  }
                }
                window.dispatchEvent(new CustomEvent('team-members-updated'));
                setMemberName(editProfile.name);
                setIsEditProfileOpen(false);
              } catch {}
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteMemberOpen} onOpenChange={setIsInviteMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Create a new teammate and assign a role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={inviteMember.name} onChange={(e) => setInviteMember((prev) => ({ ...prev, name: e.target.value }))} placeholder="Jordan Smith" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={inviteMember.email} onChange={(e) => setInviteMember((prev) => ({ ...prev, email: e.target.value }))} placeholder="jordan@example.com" />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={inviteMember.role}
                onChange={(e) => setInviteMember((prev) => ({ ...prev, role: e.target.value as TeamRole }))}
                className="w-full rounded-md border px-3 py-2"
              >
                {availableRolesForInvite.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>{roleOption}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Workspace Access</Label>
              <select
                value={inviteMember.workspaceId}
                onChange={(e) => {
                  const value = e.target.value;
                  setInviteMember((prev) => ({ ...prev, workspaceId: value === 'all' ? 'all' : value }));
                }}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="all">All Workspaces</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleInviteMember} disabled={!inviteMember.email.trim()}>Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
