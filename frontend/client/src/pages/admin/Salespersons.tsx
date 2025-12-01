import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Users, Edit, Trash2, Mail, Phone, Briefcase, Upload, Calendar, Award, Copy, Eye, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface AvailabilitySchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Super Admin' | 'Admin' | 'Staff' | 'Manager';
  workspace: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  availability?: string;
  workload?: string;
  profilePicture?: string;
  permissions?: Permission[];
  availabilitySchedule?: AvailabilitySchedule[];
  timezone?: string;
  totalBookings?: number;
  averageRating?: number;
  bookingLink?: string;
  teamViewLink?: string;
  notes?: string;
}

const ROLE_PERMISSION_TEMPLATES: Record<Salesperson['role'], Permission[]> = {
  'Super Admin': [
    { module: 'Dashboard', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Appointments', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Customers', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Services', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Settings', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Workflows', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Team', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Sales Calls', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Availability', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Booking Pages', canView: true, canCreate: true, canEdit: true, canDelete: true },
  ],
  'Admin': [
    { module: 'Dashboard', canView: true, canCreate: false, canEdit: true, canDelete: false },
    { module: 'Appointments', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'Customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Services', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Settings', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Workflows', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Team', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Sales Calls', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Availability', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Booking Pages', canView: true, canCreate: true, canEdit: true, canDelete: false },
  ],
  'Manager': [
    { module: 'Dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Appointments', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Services', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Workflows', canView: true, canCreate: true, canEdit: false, canDelete: false },
    { module: 'Team', canView: true, canCreate: false, canEdit: true, canDelete: false },
    { module: 'Sales Calls', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Availability', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Booking Pages', canView: true, canCreate: true, canEdit: true, canDelete: false },
  ],
  'Staff': [
    { module: 'Dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Appointments', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'Customers', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Services', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Reports', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Workflows', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Team', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Sales Calls', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Availability', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'Booking Pages', canView: true, canCreate: false, canEdit: false, canDelete: false },
  ],
};

const clonePermissions = (perms: Permission[]): Permission[] =>
  perms.map((perm) => ({ ...perm }));

const getRolePermissionTemplate = (role: Salesperson['role']): Permission[] =>
  clonePermissions(ROLE_PERMISSION_TEMPLATES[role] || ROLE_PERMISSION_TEMPLATES['Staff']);

const mergePermissionsWithRole = (role: Salesperson['role'], existing?: Permission[]): Permission[] => {
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

// Default permissions template per staff member
const DEFAULT_PERMISSIONS: Permission[] = getRolePermissionTemplate('Staff');

// Default weekly schedule
const DEFAULT_SCHEDULE: AvailabilitySchedule[] = [
  { day: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Friday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Saturday', enabled: false, startTime: '09:00', endTime: '17:00' },
  { day: 'Sunday', enabled: false, startTime: '09:00', endTime: '17:00' },
];

const cloneSchedule = (schedule?: AvailabilitySchedule[]): AvailabilitySchedule[] => {
  const base = schedule && schedule.length ? schedule : DEFAULT_SCHEDULE;
  return base.map((entry) => ({ ...entry }));
};

const ensurePersonShape = (person: Salesperson): Salesperson => ({
  ...person,
  permissions: mergePermissionsWithRole(person.role, person.permissions),
  availabilitySchedule: cloneSchedule(person.availabilitySchedule),
  teamViewLink: person.teamViewLink || `/team/public/${person.id}`,
});

const createBlankPerson = (): Omit<Salesperson, 'id'> => ({
  name: '',
  email: '',
  phone: '',
  role: 'Staff',
  workspace: 'bharath',
  status: 'Active',
  availability: 'Full Time',
  workload: 'Low',
  profilePicture: '',
  permissions: getRolePermissionTemplate('Staff'),
  availabilitySchedule: cloneSchedule(),
  timezone: 'Asia/Kolkata',
  totalBookings: 0,
  averageRating: 0,
  notes: '',
});

// Helper function to generate booking link
const generateBookingLink = (name: string, id: string): string => {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `/book/team/${slug}-${id}`;
};

export default function Salespersons() {
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  // Dynamic labels from organization/company profile
  interface Company { teamMemberLabel?: string }
  const [company, setCompany] = useState<Company | null>(null);
  const [orgLabels, setOrgLabels] = useState<{ teamMemberLabel?: string } | null>(null);
  // Helpers to normalize data across pages
  const formatTime12h = (hhmm: string) => {
    if (!hhmm || typeof hhmm !== 'string') return '';
    const [hStr, mStr] = hhmm.split(':');
    let h = Number(hStr);
    const m = Number(mStr || 0);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return m === 0 ? `${h} ${ampm}` : `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const scheduleToLabel = (schedule?: AvailabilitySchedule[]) => {
    const daysOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const sch = (schedule && schedule.length) ? schedule : DEFAULT_SCHEDULE;
    const enabledDays = sch.filter(d => d.enabled).map(d => d.day);
    const allSameTimes = sch.filter(d => d.enabled).every(d => d.startTime === sch.find(s => s.enabled)?.startTime && d.endTime === sch.find(s => s.enabled)?.endTime);
    const firstEnabled = sch.find(s => s.enabled);
    const start = firstEnabled ? formatTime12h(firstEnabled.startTime) : '';
    const end = firstEnabled ? formatTime12h(firstEnabled.endTime) : '';

    // Daily same hours
    if (enabledDays.length === 7 && allSameTimes) return `Daily, ${start} - ${end}`;
    // Mon-Fri same hours
    const monFri = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    const satSun = ['Saturday','Sunday'];
    const monFriEnabled = monFri.every(d => enabledDays.includes(d));
    const satSunDisabled = satSun.every(d => !enabledDays.includes(d));
    if (monFriEnabled && satSunDisabled && allSameTimes) return `Mon-Fri, ${start} - ${end}`;

    // Single day same hours
    if (enabledDays.length === 1) return `${enabledDays[0]}, ${start} - ${end}`;

    // Generic fallback
    return 'Custom';
  };
  const normalizeFromTeamMembers = (items: any[]): Salesperson[] => {
    // Map simpler sidebar team member shape to the richer admin salesperson shape
    return (items || []).map((m) => {
      const id = m.id || `${Date.now()}-${Math.random()}`;
      // Map roles: sidebar uses Salesperson/Admin/Super Admin/Viewer -> map Salesperson -> Staff
      let role: Salesperson['role'] = 'Staff';
      if (m.role === 'Admin' || m.role === 'Super Admin' || m.role === 'Manager') role = m.role;
      // Default workspace if absent
      const workspace = m.workspace || 'bharath';
      const base: Salesperson = {
        id,
        name: m.name || '',
        email: m.email || '',
        phone: m.phone || '',
        role,
        workspace,
        status: (m.status as Salesperson['status']) || 'Active',
        availability: m.availability || 'Full Time',
        workload: m.workload || 'Low',
        profilePicture: m.profilePicture || undefined,
        permissions: Array.isArray(m.permissions) ? m.permissions : undefined,
        availabilitySchedule: Array.isArray(m.availabilitySchedule) ? m.availabilitySchedule : undefined,
        timezone: m.timezone || 'Asia/Kolkata',
        totalBookings: m.appointmentsCount || 0,
        averageRating: typeof m.averageRating === 'number' ? m.averageRating : 0,
        bookingLink: m.bookingLink || generateBookingLink(m.name || 'member', id),
        teamViewLink: m.teamViewLink || `/team/public/${id}`,
        notes: m.notes || '',
      };
      return ensurePersonShape(base);
    });
  };

  const toTeamMembersFormat = (items: Salesperson[]) => {
    // Convert rich admin salesperson shape back to sidebar list shape
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-yellow-500 to-orange-500',
    ];
    const pickColor = () => colors[Math.floor(Math.random() * colors.length)];
    return (items || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role === 'Staff' ? 'Salesperson' : p.role,
      color: (p as any).color || pickColor(),
      phone: p.phone || '',
      appointmentsCount: p.totalBookings || 0,
      availability: p.availability || scheduleToLabel(p.availabilitySchedule),
      workspace: p.workspace || 'bharath',
      status: p.status || 'Active',
      bookingLink: p.bookingLink,
      notes: p.notes || ''
    }));
  };

  // Compute assigned bookings count for each member from sales calls of current workspace
  const applyAssignedCounts = (people: Salesperson[]): Salesperson[] => {
    try {
      if (!selectedWorkspace) return people;
      const callsRaw = localStorage.getItem(`zervos_sales_calls::${selectedWorkspace.id}`);
      const calls = callsRaw ? JSON.parse(callsRaw) : [];
      return people.map(p => {
        const count = Array.isArray(calls)
          ? calls.filter((c: any) => Array.isArray(c?.assignedSalespersons) && c.assignedSalespersons.includes(p.id)).length
          : 0;
        return { ...p, totalBookings: count };
      });
    } catch {
      return people;
    }
  };

  // Helper to (re)load and merge from both storages
  const reloadSalespersons = () => {
    try {
      const workspaceKey = selectedWorkspace ? `zervos_team_members::${selectedWorkspace.id}` : null;
      const sidebarRaw = workspaceKey ? (localStorage.getItem(workspaceKey) || localStorage.getItem('zervos_team_members')) : localStorage.getItem('zervos_team_members');
      const adminRaw = localStorage.getItem('zervos_salespersons');
      const sidebarList = sidebarRaw ? normalizeFromTeamMembers(JSON.parse(sidebarRaw)) : [];
      const adminListRaw = adminRaw ? JSON.parse(adminRaw) : [];
      const adminList: Salesperson[] = Array.isArray(adminListRaw)
        ? adminListRaw.map((entry: Salesperson) => ensurePersonShape(entry))
        : [];
      const byEmail = new Map<string, Salesperson>();
      for (const p of sidebarList) if (p.email) byEmail.set(p.email.toLowerCase(), p);
      for (const p of adminList) if (p.email) byEmail.set(p.email.toLowerCase(), { ...byEmail.get(p.email.toLowerCase()), ...p });
      let merged = Array.from(byEmail.values()).map(ensurePersonShape);
      // Apply assigned counts from current workspace sales calls
      merged = applyAssignedCounts(merged);
      if (merged.length > 0) {
        setSalespersons(merged);
      } else if (adminList.length > 0) {
        setSalespersons(applyAssignedCounts(adminList));
      }
    } catch {}
  };

  useEffect(() => {
    // Load company/org label sources
    const savedCompany = localStorage.getItem('zervos_company');
    if (savedCompany) setCompany(JSON.parse(savedCompany));

    const orgSettingsRaw = localStorage.getItem('zervos_organization_settings');
    if (orgSettingsRaw) {
      try {
        const orgSettings = JSON.parse(orgSettingsRaw);
        const tm = orgSettings?.labels?.teamMemberLabel || orgSettings?.teamMemberLabel;
        if (tm) setOrgLabels({ teamMemberLabel: tm });
      } catch {}
    }

  reloadSalespersons();

    // Listen for updates from other pages
  const onUpdated = () => reloadSalespersons();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'zervos_team_members' || e.key === 'zervos_salespersons' || (selectedWorkspace && e.key === `zervos_team_members::${selectedWorkspace.id}`) || (selectedWorkspace && e.key === `zervos_sales_calls::${selectedWorkspace.id}`)) reloadSalespersons();
    };
    window.addEventListener('team-members-updated', onUpdated as EventListener);
    window.addEventListener('sales-calls-updated', onUpdated as EventListener);
    window.addEventListener('storage', onStorage);

    const t = setTimeout(() => setLoading(false), 300);
    return () => {
      clearTimeout(t);
      window.removeEventListener('team-members-updated', onUpdated as EventListener);
      window.removeEventListener('sales-calls-updated', onUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [selectedWorkspace?.id]);
  const teamMemberLabel = orgLabels?.teamMemberLabel || company?.teamMemberLabel || 'Salespersons';
  const teamMemberLabelSingular = teamMemberLabel.endsWith('s') ? teamMemberLabel.slice(0, -1) : teamMemberLabel;
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Salesperson | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Salesperson | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingAppointments, setViewingAppointments] = useState<Array<{ id: string; customerName: string; date: string; time: string; serviceName: string; status: 'upcoming' | 'completed' | 'cancelled'; }>>([]);
  const [assignedCalls, setAssignedCalls] = useState<Array<{ id: string; name: string }>>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [salespersons, setSalespersons] = useState<Salesperson[]>([
    ensurePersonShape({
      id: '1',
      name: 'Bharath Reddy',
      email: 'bharathreddyn6@gmail.com',
      phone: '+1 (555) 123-4567',
      role: 'Super Admin',
      workspace: 'bharath',
      status: 'Active',
      availability: 'Full Time',
      workload: 'Medium',
      permissions: getRolePermissionTemplate('Super Admin'),
      availabilitySchedule: cloneSchedule(),
      timezone: 'Asia/Kolkata',
    })
  ]);

  const [newPerson, setNewPerson] = useState<Omit<Salesperson, 'id'>>(createBlankPerson());

  const saveToLocalStorage = (data: Salesperson[]) => {
    const normalized = data.map(ensurePersonShape);
    // Persist to both admin and sidebar storages to keep pages in sync
    try {
      localStorage.setItem('zervos_salespersons', JSON.stringify(normalized));
      const sidebarShape = toTeamMembersFormat(normalized);
      localStorage.setItem('zervos_team_members', JSON.stringify(sidebarShape));
      // Also persist to workspace-specific key if applicable
      if (selectedWorkspace) {
        localStorage.setItem(`zervos_team_members::${selectedWorkspace.id}`, JSON.stringify(sidebarShape));
      }
    } catch {}
    setSalespersons(normalized);
    // Notify other views to refresh
    window.dispatchEvent(new CustomEvent('team-members-updated'));
    window.dispatchEvent(new Event('localStorageChanged'));
  };

  const handleAddPerson = () => {
    const id = Date.now().toString();
    const base: Salesperson = {
      id,
      ...newPerson,
      bookingLink: generateBookingLink(newPerson.name, id),
      teamViewLink: `/team/public/${id}`,
    } as Salesperson;
    const person = ensurePersonShape(base);
    const updated = [...salespersons, person];
    saveToLocalStorage(updated);
    setAddModalOpen(false);
    setNewPerson(createBlankPerson());
    toast({
      title: "Success",
      description: `${teamMemberLabelSingular} added successfully`,
    });
  };

  const handleEditPerson = () => {
    if (!editingPerson) return;
    const normalized = ensurePersonShape({
      ...editingPerson,
      teamViewLink: editingPerson.teamViewLink || `/team/public/${editingPerson.id}`,
    } as Salesperson);
    const updated = salespersons.map(p => p.id === normalized.id ? normalized : p);
    saveToLocalStorage(updated);
    setEditModalOpen(false);
    setEditingPerson(null);
    toast({
      title: "Success",
      description: `${teamMemberLabelSingular} updated successfully`,
    });
  };

  const handleDeletePerson = (id: string) => {
    const updated = salespersons.filter(p => p.id !== id);
    saveToLocalStorage(updated);
    toast({
      title: "Success",
      description: `${teamMemberLabelSingular} removed`,
    });
  };

  const handleToggleStatus = (id: string) => {
    const person = salespersons.find(p => p.id === id);
    if (!person) return;
    
    const statuses: ('Active' | 'Inactive' | 'On Leave')[] = ['Active', 'Inactive', 'On Leave'];
    const currentIndex = statuses.indexOf(person.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    const updated = salespersons.map(p => 
      p.id === id ? { ...p, status: nextStatus } : p
    );
    saveToLocalStorage(updated);
    toast({
      title: "Success",
      description: "Status updated",
    });
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEditing && editingPerson) {
        setEditingPerson({ ...editingPerson, profilePicture: base64String });
      } else {
        setNewPerson({ ...newPerson, profilePicture: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyBookingLink = (link: string) => {
    navigator.clipboard.writeText(window.location.origin + link);
    toast({
      title: "Success",
      description: "Booking link copied to clipboard",
    });
  };

  const filteredSalespersons = salespersons.filter(sp =>
    sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load details (appointments + assigned calls) when opening view modal
  useEffect(() => {
    const loadDetails = async () => {
      if (!viewDetailsOpen || !viewingPerson) return;
      setDetailsLoading(true);
      try {
        // Fetch appointments assigned to this member from backend
        const res = await fetch(`/api/appointments?assignedMemberId=${encodeURIComponent(viewingPerson.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setViewingAppointments(data);
          }
        }
      } catch {}

      try {
        // Get assigned calls from workspace-scoped sales calls
        const workspaceKey = selectedWorkspace ? `zervos_sales_calls::${selectedWorkspace.id}` : 'zervos_sales_calls';
        const raw = localStorage.getItem(workspaceKey) || localStorage.getItem('zervos_sales_calls');
        const calls = raw ? JSON.parse(raw) : [];
        if (Array.isArray(calls)) {
          const mine = calls.filter((c: any) => Array.isArray(c?.assignedSalespersons) && c.assignedSalespersons.includes(viewingPerson.id))
                           .map((c: any) => ({ id: c.id, name: c.name }));
          setAssignedCalls(mine);
        } else {
          setAssignedCalls([]);
        }
      } catch {
        setAssignedCalls([]);
      }
      setDetailsLoading(false);
    };
    loadDetails();
  }, [viewDetailsOpen, viewingPerson, selectedWorkspace?.id]);
  
  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{teamMemberLabel}</h1>
          <Badge variant="secondary" className="text-sm">
            {salespersons.length} Total
          </Badge>
          <Badge variant="secondary" className="text-sm bg-green-100 text-green-700">
            {salespersons.filter(p => p.status === 'Active').length} Active
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search by name, email, or role"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
          <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} />
            {`Add ${teamMemberLabelSingular}`}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {teamMemberLabelSingular.toUpperCase()}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CONTACT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROLE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                WORKSPACE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AVAILABILITY
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
            filteredSalespersons.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {person.profilePicture ? (
                      <img src={person.profilePicture} alt={person.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{person.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {person.totalBookings !== undefined && (
                          <span>{person.totalBookings} bookings</span>
                        )}
                        {person.averageRating !== undefined && person.averageRating > 0 && (
                          <span>⭐ {person.averageRating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} />
                      {person.email}
                    </div>
                    {person.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        {person.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge 
                    variant="secondary" 
                    className={
                      person.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                      person.role === 'Admin' ? 'bg-blue-100 text-blue-700' :
                      person.role === 'Manager' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }
                  >
                    {person.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700">
                    <Briefcase size={12} className="mr-1" />
                    {person.workspace}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{person.availability || 'Full Time'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(person.id)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      person.status === 'Active' ? 'bg-green-500' : 
                      person.status === 'On Leave' ? 'bg-yellow-500' : 
                      'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-900">{person.status}</span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="View Details"
                      onClick={() => {
                        setViewingPerson(person);
                        setViewDetailsOpen(true);
                      }}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Edit"
                      onClick={() => {
                        setEditingPerson(ensurePersonShape(person));
                        setEditModalOpen(true);
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    {person.bookingLink && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Copy Booking Link"
                        onClick={() => handleCopyBookingLink(person.bookingLink!)}
                      >
                        <Copy size={16} />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Copy Team View Link"
                      onClick={() => handleCopyBookingLink(person.teamViewLink || `/team/public/${person.id}`)}
                    >
                      <Copy size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Delete"
                      onClick={() => handleDeletePerson(person.id)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
        
        {filteredSalespersons.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">No {teamMemberLabel.toLowerCase()} found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first team member to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setAddModalOpen(true)} className="gap-2">
                <Plus size={16} />
                {`Add ${teamMemberLabelSingular}`}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{`Add New ${teamMemberLabelSingular}`}</DialogTitle>
            <DialogDescription>{`Add a new ${teamMemberLabelSingular.toLowerCase()} with permissions and availability`}</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {newPerson.profilePicture ? (
                    <img src={newPerson.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="text-gray-400" size={32} />
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('add-profile-upload')?.click()}>
                  Upload Photo
                </Button>
                <input
                  id="add-profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleProfilePictureUpload(e, false)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={newPerson.name}
                    onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Role *</Label>
                      <Select
                        value={newPerson.role}
                        onValueChange={(value: Salesperson['role']) =>
                          setNewPerson((prev) => ({
                            ...prev,
                            role: value,
                            permissions: getRolePermissionTemplate(value),
                          }))
                        }
                      >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select value={newPerson.timezone} onValueChange={(value: any) => setNewPerson({ ...newPerson, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Workspace</Label>
                  <Input
                    value={newPerson.workspace}
                    onChange={(e) => setNewPerson({ ...newPerson, workspace: e.target.value })}
                    placeholder="bharath"
                  />
                </div>
                <div>
                  <Label>Availability Type</Label>
                  <Select value={newPerson.availability} onValueChange={(value: any) => setNewPerson({ ...newPerson, availability: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Time">Full Time</SelectItem>
                      <SelectItem value="Part Time">Part Time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newPerson.notes}
                    onChange={(e) => setNewPerson({ ...newPerson, notes: e.target.value })}
                    placeholder="Additional notes about this team member..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="availability" className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Set weekly working hours for this team member</p>
              {newPerson.availabilitySchedule?.map((schedule, index) => (
                <div key={schedule.day} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 w-32">
                    <Switch
                      checked={schedule.enabled}
                      onCheckedChange={(checked) => {
                        const updated = [...(newPerson.availabilitySchedule || [])];
                        updated[index].enabled = checked;
                        setNewPerson({ ...newPerson, availabilitySchedule: updated });
                      }}
                    />
                    <Label className="font-medium">{schedule.day}</Label>
                  </div>
                  {schedule.enabled && (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => {
                            const updated = [...(newPerson.availabilitySchedule || [])];
                            updated[index].startTime = e.target.value;
                            setNewPerson({ ...newPerson, availabilitySchedule: updated });
                          }}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => {
                            const updated = [...(newPerson.availabilitySchedule || [])];
                            updated[index].endTime = e.target.value;
                            setNewPerson({ ...newPerson, availabilitySchedule: updated });
                          }}
                          className="w-32"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Configure module access permissions</p>
              <div className="space-y-2">
                {newPerson.permissions?.map((perm, index) => (
                  <div key={perm.module} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={16} className="text-indigo-600" />
                      <span className="font-medium">{perm.module}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 ml-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={perm.canView}
                          onCheckedChange={(checked) => {
                            const updated = [...(newPerson.permissions || [])];
                            updated[index].canView = checked;
                            setNewPerson({ ...newPerson, permissions: updated });
                          }}
                        />
                        <Label className="text-sm">View</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={perm.canCreate}
                          onCheckedChange={(checked) => {
                            const updated = [...(newPerson.permissions || [])];
                            updated[index].canCreate = checked;
                            setNewPerson({ ...newPerson, permissions: updated });
                          }}
                        />
                        <Label className="text-sm">Create</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={perm.canEdit}
                          onCheckedChange={(checked) => {
                            const updated = [...(newPerson.permissions || [])];
                            updated[index].canEdit = checked;
                            setNewPerson({ ...newPerson, permissions: updated });
                          }}
                        />
                        <Label className="text-sm">Edit</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={perm.canDelete}
                          onCheckedChange={(checked) => {
                            const updated = [...(newPerson.permissions || [])];
                            updated[index].canDelete = checked;
                            setNewPerson({ ...newPerson, permissions: updated });
                          }}
                        />
                        <Label className="text-sm">Delete</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPerson} disabled={!newPerson.name || !newPerson.email}>
              {`Add ${teamMemberLabelSingular}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal - Similar to Add but with existing data */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{`Edit ${teamMemberLabelSingular}`}</DialogTitle>
            <DialogDescription>{`Update ${teamMemberLabelSingular.toLowerCase()} information, permissions, and availability`}</DialogDescription>
          </DialogHeader>
          {editingPerson && (
            <>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {editingPerson.profilePicture ? (
                        <img src={editingPerson.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-white font-bold bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center text-2xl">
                          {editingPerson.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('edit-profile-upload')?.click()}>
                      Change Photo
                    </Button>
                    <input
                      id="edit-profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleProfilePictureUpload(e, true)}
                    />
                  </div>
                  
                  {editingPerson.bookingLink && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-indigo-600" />
                        <span className="font-medium text-indigo-900">Booking Link:</span>
                        <code className="bg-white px-2 py-1 rounded text-xs">{editingPerson.bookingLink}</code>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleCopyBookingLink(editingPerson.bookingLink!)}>
                        <Copy size={14} />
                      </Button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={editingPerson.name}
                        onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email Address *</Label>
                      <Input
                        type="email"
                        value={editingPerson.email}
                        onChange={(e) => setEditingPerson({ ...editingPerson, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        type="tel"
                        value={editingPerson.phone || ''}
                        onChange={(e) => setEditingPerson({ ...editingPerson, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Role *</Label>
                      <Select
                        value={editingPerson.role}
                        onValueChange={(value: Salesperson['role']) =>
                          setEditingPerson((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  role: value,
                                  permissions: getRolePermissionTemplate(value),
                                }
                              : prev
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Staff">Staff</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Super Admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Timezone</Label>
                      <Select value={editingPerson.timezone || 'Asia/Kolkata'} onValueChange={(value: any) => setEditingPerson({ ...editingPerson, timezone: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                          <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Workspace</Label>
                      <Input
                        value={editingPerson.workspace}
                        onChange={(e) => setEditingPerson({ ...editingPerson, workspace: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Availability Type</Label>
                      <Select value={editingPerson.availability} onValueChange={(value: any) => setEditingPerson({ ...editingPerson, availability: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full Time">Full Time</SelectItem>
                          <SelectItem value="Part Time">Part Time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={editingPerson.notes || ''}
                        onChange={(e) => setEditingPerson({ ...editingPerson, notes: e.target.value })}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="availability" className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Manage weekly working hours</p>
                  {(editingPerson.availabilitySchedule || DEFAULT_SCHEDULE).map((schedule, index) => (
                    <div key={schedule.day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex items-center gap-2 w-32">
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={(checked) => {
                            const updated = [...(editingPerson.availabilitySchedule || DEFAULT_SCHEDULE)];
                            updated[index] = { ...updated[index], enabled: checked };
                            setEditingPerson({ ...editingPerson, availabilitySchedule: updated });
                          }}
                        />
                        <Label className="font-medium">{schedule.day}</Label>
                      </div>
                      {schedule.enabled && (
                        <>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => {
                              const updated = [...(editingPerson.availabilitySchedule || DEFAULT_SCHEDULE)];
                              updated[index] = { ...updated[index], startTime: e.target.value };
                              setEditingPerson({ ...editingPerson, availabilitySchedule: updated });
                            }}
                            className="w-32"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => {
                              const updated = [...(editingPerson.availabilitySchedule || DEFAULT_SCHEDULE)];
                              updated[index] = { ...updated[index], endTime: e.target.value };
                              setEditingPerson({ ...editingPerson, availabilitySchedule: updated });
                            }}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Manage module access permissions</p>
                  {(editingPerson.permissions || DEFAULT_PERMISSIONS).map((perm, index) => (
                    <div key={perm.module} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield size={16} className="text-indigo-600" />
                        <span className="font-medium">{perm.module}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 ml-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={perm.canView}
                            onCheckedChange={(checked) => {
                              const updated = [...(editingPerson.permissions || DEFAULT_PERMISSIONS)];
                              updated[index] = { ...updated[index], canView: checked };
                              setEditingPerson({ ...editingPerson, permissions: updated });
                            }}
                          />
                          <Label className="text-sm">View</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={perm.canCreate}
                            onCheckedChange={(checked) => {
                              const updated = [...(editingPerson.permissions || DEFAULT_PERMISSIONS)];
                              updated[index] = { ...updated[index], canCreate: checked };
                              setEditingPerson({ ...editingPerson, permissions: updated });
                            }}
                          />
                          <Label className="text-sm">Create</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={perm.canEdit}
                            onCheckedChange={(checked) => {
                              const updated = [...(editingPerson.permissions || DEFAULT_PERMISSIONS)];
                              updated[index] = { ...updated[index], canEdit: checked };
                              setEditingPerson({ ...editingPerson, permissions: updated });
                            }}
                          />
                          <Label className="text-sm">Edit</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={perm.canDelete}
                            onCheckedChange={(checked) => {
                              const updated = [...(editingPerson.permissions || DEFAULT_PERMISSIONS)];
                              updated[index] = { ...updated[index], canDelete: checked };
                              setEditingPerson({ ...editingPerson, permissions: updated });
                            }}
                          />
                          <Label className="text-sm">Delete</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEditPerson}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      {viewingPerson && (
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{`${teamMemberLabelSingular} Details`}</DialogTitle>
            </DialogHeader>
            {detailsLoading && (
              <div className="p-3 text-sm text-gray-500">Loading assignments…</div>
            )}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {viewingPerson.profilePicture ? (
                  <img src={viewingPerson.profilePicture} alt={viewingPerson.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {viewingPerson.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{viewingPerson.name}</h3>
                  <p className="text-gray-600">{viewingPerson.email}</p>
                  <Badge className="mt-2">{viewingPerson.role}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <Calendar className="mx-auto mb-2 text-blue-600" size={24} />
                  <p className="text-2xl font-bold">{viewingAppointments.length}</p>
                  <p className="text-sm text-gray-600">Appointments</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Award className="mx-auto mb-2 text-yellow-600" size={24} />
                  <p className="text-2xl font-bold">{(viewingPerson.averageRating || 0).toFixed(1)} ⭐</p>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Users className="mx-auto mb-2 text-green-600" size={24} />
                  <p className="text-2xl font-bold">{assignedCalls.length}</p>
                  <p className="text-sm text-gray-600">Assigned Calls</p>
                </div>
              </div>

              {/* Assigned Calls List */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Assigned Calls</Label>
                {assignedCalls.length === 0 ? (
                  <p className="text-sm text-gray-500">No calls assigned</p>
                ) : (
                  <ul className="text-sm text-gray-800 list-disc pl-5 space-y-1">
                    {assignedCalls.slice(0, 6).map(c => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                    {assignedCalls.length > 6 && (
                      <li className="text-gray-500">+{assignedCalls.length - 6} more…</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Appointments List */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Appointments</Label>
                {viewingAppointments.length === 0 ? (
                  <p className="text-sm text-gray-500">No appointments found</p>
                ) : (
                  <div className="space-y-2">
                    {viewingAppointments.slice(0, 8).map(a => (
                      <div key={a.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                        <div>
                          <div className="font-medium">{a.customerName}</div>
                          <div className="text-gray-500">{a.date} • {a.time}</div>
                        </div>
                        <div className="text-gray-600">{a.serviceName}</div>
                      </div>
                    ))}
                    {viewingAppointments.length > 8 && (
                      <div className="text-xs text-gray-500">+{viewingAppointments.length - 8} more…</div>
                    )}
                  </div>
                )}
              </div>

              {viewingPerson.bookingLink && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-sm font-medium mb-2 block">Booking Link</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">
                      {window.location.origin}{viewingPerson.bookingLink}
                    </code>
                    <Button size="sm" onClick={() => handleCopyBookingLink(viewingPerson.bookingLink!)}>
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Public Team View Link */}
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-sm font-medium mb-2 block">Team View Link</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">
                    {window.location.origin}/team/public/{viewingPerson.id}
                  </code>
                  <Button size="sm" onClick={() => handleCopyBookingLink(`/team/public/${viewingPerson.id}`)}>
                    <Copy size={14} />
                  </Button>
                </div>
              </div>

              {viewingPerson.notes && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Notes</Label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{viewingPerson.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setViewDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
