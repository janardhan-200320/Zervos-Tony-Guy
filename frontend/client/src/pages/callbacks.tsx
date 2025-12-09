import { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Zap, Search, MoreVertical, Play, Pause, Trash2, Share2, Copy, ExternalLink, Users, UserCheck, UsersRound, Camera, Info, X, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun?: string;
  runsCount: number;
  // Additional booking details
  description?: string;
  duration?: {
    hours: string;
    minutes: string;
  };
  price?: string;
  priceAmount?: string;
  meetingMode?: string;
  bookingType?: string;
  scheduleType?: string;
  assignedSalespersons?: string[];
  availability?: Record<string, {
    enabled: boolean;
    start: string;
    end: string;
  }>;
  useOrgFormFields?: boolean;
  customFormFields?: LoginField[];
  limits?: Limits;
  breaks?: Record<string, DayBreak[]>;
  workspaceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface DayBreak {
  id: string;
  startTime: string;
  endTime: string;
}

interface Salesperson {
  id: string;
  name: string;
  email?: string;
  avatar: string;
}

type DynamicFieldType = 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
interface LoginField {
  id: string;
  name: string;
  type: DynamicFieldType;
  required: boolean;
  placeholder?: string;
}

interface Limits {
  maxPerDay?: number | null;
  maxPerWeek?: number | null;
  maxPerMonth?: number | null;
  minNoticeHours?: number; // Minimum scheduling notice
  bookingWindowDays?: number; // How far into the future
  bufferBeforeMins?: number;
  bufferAfterMins?: number;
  maxPerCustomer?: number | null;
}

type BookingType = 'one-on-one' | 'group' | 'collective' | null;
type ScheduleType = 'one-time' | 'recurring' | null;

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const generateBreakId = () => `break-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyBreakMap = (): Record<string, DayBreak[]> => {
  const map: Record<string, DayBreak[]> = {};
  WEEK_DAYS.forEach(day => { map[day] = []; });
  return map;
};

const normalizeBreakMap = (input?: Record<string, any>): Record<string, DayBreak[]> => {
  const base = createEmptyBreakMap();
  if (!input || typeof input !== 'object') return base;
  WEEK_DAYS.forEach(day => {
    const rows = Array.isArray(input[day]) ? input[day] : [];
    base[day] = rows.map((entry: any) => ({
      id: entry?.id || generateBreakId(),
      startTime: typeof entry?.startTime === 'string' ? entry.startTime : '13:00',
      endTime: typeof entry?.endTime === 'string' ? entry.endTime : '14:00',
    }));
  });
  return base;
};

export default function WorkflowsPage() {
  const { selectedWorkspace } = useWorkspace();
  const [company, setCompany] = useState<any>(null);
  const { toast } = useToast();

  // Compute workspace-scoped storage key
  const salesCallsStorageKey = useMemo(() => {
    return selectedWorkspace ? `zervos_sales_calls::${selectedWorkspace.id}` : null;
  }, [selectedWorkspace]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('zervos_company');
      if (raw) setCompany(JSON.parse(raw));
    } catch {}
  }, []);

  // Load saved sales calls when workspace changes
  useEffect(() => {
    if (!salesCallsStorageKey) {
      // No workspace selected, clear in-memory list to avoid cross-leakage
      setWorkflows([]);
      return;
    }
    try {
      const savedCalls = localStorage.getItem(salesCallsStorageKey);
      if (savedCalls) {
        setWorkflows(JSON.parse(savedCalls));
      } else {
        // Keep defaults if no saved data for this workspace
        setWorkflows(defaultWorkflowsRef.current);
      }
    } catch {}
  }, [salesCallsStorageKey]);

  // Fixed labels
  const eventTypeLabel = 'Appointment';
  const eventTypeSingular = 'Appointment';
  const teamMemberLabel = 'Staff';

  // Default examples (used when a workspace has no saved data yet)
  const defaultWorkflowsRef = useRef<Workflow[]>([
    {
      id: '1',
      name: 'Send Reminder 1 Day Before',
      trigger: '1 day before appointment',
      action: 'Send Email Reminder',
      isActive: true,
      lastRun: '2 hours ago',
      runsCount: 45,
      availability: defaultAvailability(),
      useOrgFormFields: true,
      customFormFields: [],
      limits: {
        maxPerDay: null,
        maxPerWeek: null,
        maxPerMonth: null,
        minNoticeHours: 0,
        bookingWindowDays: 60,
        bufferBeforeMins: 0,
        bufferAfterMins: 0,
        maxPerCustomer: null,
      },
      breaks: createEmptyBreakMap(),
      workspaceId: selectedWorkspace?.id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Welcome New Booking',
      trigger: 'After booking created',
      action: 'Send WhatsApp Message',
      isActive: true,
      lastRun: '5 mins ago',
      runsCount: 128
    },
    {
      id: '3',
      name: 'Follow-up Completed Appointment',
      trigger: 'After appointment completed',
      action: 'Send Feedback Form',
      isActive: false,
      lastRun: '1 day ago',
      runsCount: 32
    },
  ]);

  const [workflows, setWorkflows] = useState<Workflow[]>(defaultWorkflowsRef.current);

  const [searchQuery, setSearchQuery] = useState('');
  const [isNewWorkflowOpen, setIsNewWorkflowOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [bookingType, setBookingType] = useState<BookingType>(null);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(null);
  const [searchSalespersons, setSearchSalespersons] = useState('');
  const [selectedSalespersons, setSelectedSalespersons] = useState<string[]>([]);
  
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    duration: { hours: '0', minutes: '30' },
    price: 'free',
    priceAmount: '0',
    meetingMode: '',
    description: '',
    repeatFrequency: 'daily',
    repeatEvery: '1',
    repeatUnit: 'Day(s)',
    numberOfRecurrences: '1',
  });

  // ===== Edit workflow state =====
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [editTab, setEditTab] = useState<'details' | 'assign' | 'availability' | 'form' | 'limits'>('details');
  const [editSelectedSalespersons, setEditSelectedSalespersons] = useState<string[]>([]);
  const [editLoginFields, setEditLoginFields] = useState<LoginField[]>([]);
  const [editSearchSalespersons, setEditSearchSalespersons] = useState('');

  const mutateBreaks = (day: string, mutator: (breaks: DayBreak[]) => DayBreak[]) => {
    setEditingWorkflow(prev => {
      if (!prev) return prev;
      const source = prev.breaks ?? createEmptyBreakMap();
      const next: Record<string, DayBreak[]> = { ...source };
      const updated = mutator([...(source[day] || [])]);
      next[day] = updated;
      return { ...prev, breaks: next };
    });
  };

  const handleAddBreak = (day: string) => {
    mutateBreaks(day, list => [...list, { id: generateBreakId(), startTime: '13:00', endTime: '14:00' }]);
  };

  const handleUpdateBreak = (day: string, id: string, field: 'startTime' | 'endTime', value: string) => {
    mutateBreaks(day, list => list.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleDeleteBreak = (day: string, id: string) => {
    mutateBreaks(day, list => list.filter(b => b.id !== id));
  };

  // Load salespersons from localStorage (supports multiple keys + workspace scope)
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);

  const loadTeamMembers = () => {
    try {
      // Try workspace-scoped keys first
      const candidates: string[] = [];
      if (selectedWorkspace) {
        candidates.push(`zervos_team_members::${selectedWorkspace.id}`);
        candidates.push(`zervos_salespersons::${selectedWorkspace.id}`);
      }
      // Fallback global keys
      candidates.push('zervos_team_members');
      candidates.push('zervos_salespersons');

      let found: any[] | null = null;
      for (const key of candidates) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length >= 0) {
              found = parsed;
              break;
            }
          } catch {}
        }
      }

      if (found) {
        const formatted = found.map((member: any) => ({
          id: member.id ?? member.email ?? String(Date.now()),
          name: member.name ?? member.email ?? 'Member',
          email: member.email ?? '',
          avatar: (member.name || member.email || 'M')
            .toString()
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        }));
        setSalespersons(formatted);
      } else {
        // Defaults if nothing saved yet
        setSalespersons([
          { id: '1', name: 'Bharath Reddy', email: 'bharathreddyn6@gmail.com', avatar: 'BR' },
          { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', avatar: 'SJ' },
          { id: '3', name: 'Mike Williams', email: 'mike@company.com', avatar: 'MW' },
        ]);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  // Initial load and when workspace changes
  useEffect(() => {
    loadTeamMembers();
  }, [selectedWorkspace]);

  // Refresh when opening assignment step
  useEffect(() => {
    if (isNewWorkflowOpen && createStep === 3) {
      loadTeamMembers();
    }
  }, [isNewWorkflowOpen, createStep]);

  // Listen to storage changes from other tabs/pages
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.includes('zervos_team_members') || e.key.includes('zervos_salespersons')) {
        loadTeamMembers();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Combined search: match by workflow fields OR assigned team member names/emails
  const filteredWorkflows = workflows.filter((wf) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    // Basic fields
    const basicMatch = (
      wf.name?.toLowerCase().includes(q) ||
      wf.trigger?.toLowerCase().includes(q) ||
      wf.description?.toLowerCase().includes(q) ||
      wf.action?.toLowerCase().includes(q) ||
      wf.bookingType?.toLowerCase().includes(q) ||
      wf.scheduleType?.toLowerCase().includes(q)
    );

    // Assigned team members (IDs -> names/emails)
    const assignedIds = wf.assignedSalespersons || [];
    const assignedMembers = assignedIds
      .map(id => salespersons.find(sp => sp.id === id))
      .filter((m): m is Salesperson => !!m);
    const memberMatch = assignedMembers.some(m =>
      m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );

    return basicMatch || memberMatch;
  });

  const filteredSalespersons = salespersons.filter(sp =>
    sp.name.toLowerCase().includes(searchSalespersons.toLowerCase())
  );

  const persistWorkflows = (items: Workflow[]) => {
    setWorkflows(items);
    if (salesCallsStorageKey) {
      try {
        localStorage.setItem(salesCallsStorageKey, JSON.stringify(items));
        // Notify other views (e.g., Admin > Salespersons) that sales calls changed
        window.dispatchEvent(new CustomEvent('sales-calls-updated', {
          detail: { workspaceId: selectedWorkspace?.id }
        }));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  };

  function defaultAvailability(): Record<string, { enabled: boolean; start: string; end: string }> {
    try {
      const raw = localStorage.getItem('zervos_business_hours');
      if (raw) {
        const data = JSON.parse(raw);
        const schedule = Array.isArray(data?.schedule) ? data.schedule : [];
        const map: Record<string, { enabled: boolean; start: string; end: string }> = {};
        const byDay: Record<string, any> = {};
        schedule.forEach((d: any) => { byDay[d.day] = d; });
        WEEK_DAYS.forEach(day => {
          const entry = byDay[day];
          if (entry) {
            map[day] = {
              enabled: !!entry.enabled,
              start: entry.startTime || '09:00',
              end: entry.endTime || '17:00'
            };
          } else {
            map[day] = { enabled: day !== 'Saturday' && day !== 'Sunday', start: '09:00', end: '17:00' };
          }
        });
        return map;
      }
    } catch {}
    return {
      Monday: { enabled: true, start: '09:00', end: '17:00' },
      Tuesday: { enabled: true, start: '09:00', end: '17:00' },
      Wednesday: { enabled: true, start: '09:00', end: '17:00' },
      Thursday: { enabled: true, start: '09:00', end: '17:00' },
      Friday: { enabled: true, start: '09:00', end: '17:00' },
      Saturday: { enabled: false, start: '09:00', end: '13:00' },
      Sunday: { enabled: false, start: '09:00', end: '13:00' },
    };
  }

  // Open edit dialog for a workflow
  const handleOpenEdit = (wf: Workflow) => {
    setEditingWorkflow({
      ...wf,
      availability: wf.availability || defaultAvailability(),
      useOrgFormFields: wf.useOrgFormFields !== false ? true : false,
      customFormFields: wf.customFormFields || [],
      limits: wf.limits || {
        maxPerDay: null,
        maxPerWeek: null,
        maxPerMonth: null,
        minNoticeHours: 0,
        bookingWindowDays: 60,
        bufferBeforeMins: 0,
        bufferAfterMins: 0,
        maxPerCustomer: null,
      },
      breaks: normalizeBreakMap(wf.breaks)
    });
    setEditSelectedSalespersons(wf.assignedSalespersons || []);
    setEditLoginFields(wf.customFormFields || []);
    setEditTab('details');
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingWorkflow) return;
    const updated = workflows.map(w => w.id === editingWorkflow.id ? {
      ...editingWorkflow,
      assignedSalespersons: editSelectedSalespersons,
      customFormFields: editingWorkflow.useOrgFormFields ? [] : editLoginFields,
    } : w);
    persistWorkflows(updated);
    setIsEditOpen(false);
    toast({ title: 'Updated', description: `${eventTypeSingular} updated successfully` });
  };

  const handleCreateWorkflow = () => {
    if (!selectedWorkspace || !salesCallsStorageKey) {
      toast({ title: 'Select a workspace', description: 'Please select a workspace from My Space to create sessions.' });
      return;
    }
    const newWf: Workflow = {
      id: Date.now().toString(),
      name: newWorkflow.name,
      trigger: bookingType || 'one-on-one',
      action: `${newWorkflow.duration.hours}h ${newWorkflow.duration.minutes}m`,
      isActive: true,
      runsCount: 0,
      description: newWorkflow.description || `Ideal for ${bookingType === 'one-on-one' ? 'one-to-one meetings' : bookingType === 'group' ? 'workshops and classes' : 'panel meetings'}`,
      duration: newWorkflow.duration,
      price: newWorkflow.price,
      priceAmount: newWorkflow.priceAmount,
      meetingMode: newWorkflow.meetingMode,
      bookingType: bookingType || 'one-on-one',
      scheduleType: scheduleType || 'one-time',
      assignedSalespersons: selectedSalespersons,
      availability: defaultAvailability(),
      useOrgFormFields: true,
      customFormFields: [],
      limits: {
        maxPerDay: null,
        maxPerWeek: null,
        maxPerMonth: null,
        minNoticeHours: 0,
        bookingWindowDays: 60,
        bufferBeforeMins: 0,
        bufferAfterMins: 0,
        maxPerCustomer: null,
      },
      breaks: createEmptyBreakMap(),
    };
    
    const updatedWorkflows = [...workflows, newWf];
    persistWorkflows(updatedWorkflows);
    
    handleCloseModal();
    toast({
      title: 'Success!',
      description: `${eventTypeSingular} created successfully`,
    });
  };

  const handleCloseModal = () => {
    setIsNewWorkflowOpen(false);
    setCreateStep(1);
    setBookingType(null);
    setScheduleType(null);
    setSelectedSalespersons([]);
    setSearchSalespersons('');
    setNewWorkflow({
      name: '',
      duration: { hours: '0', minutes: '30' },
      price: 'free',
      priceAmount: '0',
      meetingMode: '',
      description: '',
      repeatFrequency: 'daily',
      repeatEvery: '1',
      repeatUnit: 'Day(s)',
      numberOfRecurrences: '1',
    });
  };

  const handleSelectBookingType = (type: BookingType) => {
    setBookingType(type);
  };

  const handleSelectScheduleType = (type: ScheduleType) => {
    setScheduleType(type);
    setCreateStep(2);
  };

  const handleNextToAssign = () => {
    if (newWorkflow.name) {
      setCreateStep(3);
    }
  };

  const handleToggleSalesperson = (id: string) => {
    setSelectedSalespersons(prev =>
      prev.includes(id) ? prev.filter(spId => spId !== id) : [...prev, id]
    );
  };

  const handleSelectAllSalespersons = () => {
    if (selectedSalespersons.length === salespersons.length) {
      setSelectedSalespersons([]);
    } else {
      setSelectedSalespersons(salespersons.map(sp => sp.id));
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = workflows.map(wf =>
      wf.id === id ? { ...wf, isActive: !wf.isActive } : wf
    );
    persistWorkflows(updated);
  };

  const handleDeleteWorkflow = (id: string) => {
    const updated = workflows.filter(wf => wf.id !== id);
    persistWorkflows(updated);
  };

  const handleShareBookingLink = (workflowId: string, workflowName: string) => {
    const bookingUrl = `${window.location.origin}/book/${workflowId}`;
    navigator.clipboard.writeText(bookingUrl);
    toast({
      title: "Link Copied!",
      description: `Booking link for "${workflowName}" copied to clipboard`,
    });
  };

  const handleOpenBookingPage = (workflowId: string) => {
    window.open(`/book/${workflowId}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Workspace guard */}
        {!selectedWorkspace && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            Please select a workspace from the "My Space" dropdown to manage your {eventTypeLabel.toLowerCase()}.
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-yellow-500" size={28} />
              {eventTypeLabel}
            </h1>
            <p className="text-gray-600 mt-1">Manage your {eventTypeLabel.toLowerCase()} and automation</p>
          </div>
          <Button onClick={() => setIsNewWorkflowOpen(true)} className="gap-2" disabled={!selectedWorkspace}>
            <Plus size={18} />
            New {eventTypeSingular}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder={`Search ${eventTypeLabel.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Workflows List */}
        {filteredWorkflows.length > 0 ? (
          <div className="grid gap-4">
            {filteredWorkflows.map((wf) => (
              <div key={wf.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${wf.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Zap className={wf.isActive ? 'text-green-600' : 'text-gray-400'} size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{wf.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          wf.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {wf.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Trigger:</span> {wf.trigger}</p>
                        <p><span className="font-medium">Action:</span> {wf.action}</p>
                      </div>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        {wf.lastRun && <span>Last run: {wf.lastRun}</span>}
                        <span>Total runs: {wf.runsCount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareBookingLink(wf.id, wf.name)}
                      className="gap-2"
                    >
                      <Share2 size={16} />
                      Share
                    </Button>
                    <Switch
                      checked={wf.isActive}
                      onCheckedChange={() => handleToggleActive(wf.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(wf)}>
                          <Edit size={16} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenBookingPage(wf.id)}>
                          <ExternalLink size={16} className="mr-2" />
                          Open Booking Page
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareBookingLink(wf.id, wf.name)}>
                          <Copy size={16} className="mr-2" />
                          Copy Booking Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(wf.id)}>
                          {wf.isActive ? (
                            <><Pause size={16} className="mr-2" />Pause</>
                          ) : (
                            <><Play size={16} className="mr-2" />Activate</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteWorkflow(wf.id)}
                          className="text-red-600"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Zap size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {eventTypeLabel.toLowerCase()} found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Try adjusting your search'
                : `Create your first ${eventTypeSingular.toLowerCase()} to get started`}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsNewWorkflowOpen(true)} className="gap-2">
                <Plus size={18} />
                Create {eventTypeSingular}
              </Button>
            )}
          </div>
        )}

        {/* New Sales Call Modal - Multi-Step */}
  <Dialog open={isNewWorkflowOpen && !!selectedWorkspace} onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* STEP 1: Choose Booking Type */}
            {createStep === 1 && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl">Create New {eventTypeSingular}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-6">
                  {/* One-on-One */}
                  <div 
                    className={`bg-white border-2 rounded-lg p-6 cursor-pointer transition-all hover:border-purple-300 ${
                      bookingType === 'one-on-one' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleSelectBookingType('one-on-one')}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-purple-100 rounded-lg">
                        <UserCheck size={32} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">One-on-One</h3>
                          <Info size={16} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Ideal for support calls, client meetings, and any one-to-one meetings
                        </p>
                        {bookingType === 'one-on-one' && (
                          <div className="flex gap-2">
                            <Button
                              variant={scheduleType === 'one-time' ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectScheduleType('one-time');
                              }}
                            >
                              One Time
                            </Button>
                            <Button
                              variant={scheduleType === 'recurring' ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectScheduleType('recurring');
                              }}
                            >
                              Recurring
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Group Booking */}
                  <div 
                    className={`bg-white border-2 rounded-lg p-6 cursor-pointer transition-all hover:border-purple-300 ${
                      bookingType === 'group' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleSelectBookingType('group')}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-purple-100 rounded-lg">
                        <Users size={32} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">Group Booking</h3>
                          <Info size={16} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Ideal for workshops, webinars, and classes
                        </p>
                        {bookingType === 'group' && (
                          <div className="flex gap-2">
                            <Button
                              variant={scheduleType === 'one-time' ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectScheduleType('one-time');
                              }}
                            >
                              One Time
                            </Button>
                            <Button
                              variant={scheduleType === 'recurring' ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectScheduleType('recurring');
                              }}
                            >
                              Recurring
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Collective Booking */}
                  <div 
                    className={`bg-white border-2 rounded-lg p-6 cursor-pointer transition-all hover:border-purple-300 ${
                      bookingType === 'collective' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      handleSelectBookingType('collective');
                      handleSelectScheduleType('one-time'); // Auto select one-time for collective
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-purple-100 rounded-lg">
                        <UsersRound size={32} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">Collective Booking</h3>
                          <Info size={16} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600">
                          Ideal for panel interviews, board meetings, and any many-to-one meetings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: Sales Call Details */}
            {createStep === 2 && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Camera size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">{newWorkflow.name || 'testing'}</h3>
                      <p className="text-sm text-gray-600">
                        {bookingType === 'one-on-one' ? 'One-on-One' : bookingType === 'group' ? 'Group Booking' : 'Collective Booking'}
                      </p>
                    </div>
                  </div>
                  <div className="border-l-4 border-purple-600 pl-4">
                    <DialogTitle className="text-lg">{eventTypeSingular.toUpperCase()} DETAILS</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="salesCallName">
                      {eventTypeSingular} Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="salesCallName"
                      placeholder="testing"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Select 
                        value={newWorkflow.duration.hours} 
                        onValueChange={(val) => setNewWorkflow({ ...newWorkflow, duration: { ...newWorkflow.duration, hours: val } })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                            <SelectItem key={h} value={h.toString()}>{h} Hours</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={newWorkflow.duration.minutes} 
                        onValueChange={(val) => setNewWorkflow({ ...newWorkflow, duration: { ...newWorkflow.duration, minutes: val } })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['0', '15', '30', '45'].map(m => (
                            <SelectItem key={m} value={m}>{m} Minutes</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Price</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={newWorkflow.price === 'free' ? 'default' : 'outline'}
                        onClick={() => setNewWorkflow({ ...newWorkflow, price: 'free', priceAmount: '0' })}
                        className="flex-1"
                      >
                        Free
                      </Button>
                      <Button
                        type="button"
                        variant={newWorkflow.price === 'paid' ? 'default' : 'outline'}
                        onClick={() => setNewWorkflow({ ...newWorkflow, price: 'paid' })}
                        className="flex-1"
                      >
                        Paid
                      </Button>
                    </div>
                    {newWorkflow.price === 'paid' && (
                      <div className="flex gap-2 mt-2">
                        <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                          <span className="text-gray-600">₹</span>
                        </div>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newWorkflow.priceAmount}
                          onChange={(e) => setNewWorkflow({ ...newWorkflow, priceAmount: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetingMode">Meeting Mode</Label>
                    <Select 
                      value={newWorkflow.meetingMode} 
                      onValueChange={(val) => setNewWorkflow({ ...newWorkflow, meetingMode: val })}
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

                  {/* Recurring Information Section */}
                  {scheduleType === 'recurring' && (
                    <>
                      <div className="border-l-4 border-purple-600 pl-4 mt-6">
                        <h3 className="text-lg font-semibold text-gray-700">RECURRING INFORMATION</h3>
                      </div>

                      <div className="space-y-2">
                        <Label>Repeat frequency</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={newWorkflow.repeatFrequency === 'daily' ? 'default' : 'outline'}
                            onClick={() => setNewWorkflow({ ...newWorkflow, repeatFrequency: 'daily', repeatUnit: 'Day(s)' })}
                            className="w-full"
                          >
                            Daily
                          </Button>
                          <Button
                            type="button"
                            variant={newWorkflow.repeatFrequency === 'weekly' ? 'default' : 'outline'}
                            onClick={() => setNewWorkflow({ ...newWorkflow, repeatFrequency: 'weekly', repeatUnit: 'Week(s)' })}
                            className="w-full"
                          >
                            Weekly
                          </Button>
                          <Button
                            type="button"
                            variant={newWorkflow.repeatFrequency === 'monthly' ? 'default' : 'outline'}
                            onClick={() => setNewWorkflow({ ...newWorkflow, repeatFrequency: 'monthly', repeatUnit: 'Month(s)' })}
                            className="w-full"
                          >
                            Monthly
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Repeat Every</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <Select 
                            value={newWorkflow.repeatEvery} 
                            onValueChange={(val) => setNewWorkflow({ ...newWorkflow, repeatEvery: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center px-3 py-2 border rounded-md bg-gray-50">
                            <span className="text-gray-700">{newWorkflow.repeatUnit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>No. of Recurrences</Label>
                        <Select 
                          value={newWorkflow.numberOfRecurrences} 
                          onValueChange={(val) => setNewWorkflow({ ...newWorkflow, numberOfRecurrences: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 50].map(n => (
                              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleNextToAssign}
                    disabled={!newWorkflow.name}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Next
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* STEP 3: Assign Salespersons */}
            {createStep === 3 && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Camera size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">{newWorkflow.name}</h3>
                      <p className="text-sm text-gray-600">
                        {bookingType === 'one-on-one' ? 'One-on-One' : bookingType === 'group' ? 'Group Booking' : 'Collective Booking'}
                      </p>
                    </div>
                  </div>
                  <div className="border-l-4 border-purple-600 pl-4">
                    <DialogTitle className="text-lg">ASSIGN {teamMemberLabel.toUpperCase()}</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        type="text"
                        placeholder={`Search ${teamMemberLabel}`}
                        value={searchSalespersons}
                        onChange={(e) => setSearchSalespersons(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSalespersons}
                    >
                      <Checkbox
                        checked={selectedSalespersons.length === salespersons.length}
                        className="mr-2"
                      />
                      Select All
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredSalespersons.map((sp) => (
                      <div
                        key={sp.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => handleToggleSalesperson(sp.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                            {sp.avatar}
                          </div>
                          <span className="font-medium text-gray-900">{sp.name}</span>
                        </div>
                        <Checkbox checked={selectedSalespersons.includes(sp.id)} />
                      </div>
                    ))}
                  </div>

                  {selectedSalespersons.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        {teamMemberLabel} Assigned: <span className="font-semibold">{selectedSalespersons.length}</span>
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleCreateWorkflow}
                    disabled={selectedSalespersons.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create {eventTypeSingular}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Sales Call Modal */}
        <Dialog open={isEditOpen && !!editingWorkflow} onOpenChange={(open) => setIsEditOpen(open)}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            <DialogHeader>
              <DialogTitle className="text-2xl">Edit {eventTypeSingular}</DialogTitle>
              <DialogDescription>Update details, assignment, availability, and form fields</DialogDescription>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex gap-2 mt-2">
              {(['details','assign','availability','form','limits'] as const).map(t => (
                <Button key={t} variant={editTab===t? 'default':'outline'} size="sm" onClick={() => setEditTab(t)}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </Button>
              ))}
            </div>

            <div className="py-4 space-y-4">
              {/* DETAILS TAB */}
              {editTab === 'details' && editingWorkflow && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editingWorkflow.name}
                      onChange={(e)=> setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editingWorkflow.description || ''}
                      onChange={(e)=> setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration Hours</Label>
                      <Select
                        value={editingWorkflow.duration?.hours || '0'}
                        onValueChange={(val)=> setEditingWorkflow({ ...editingWorkflow, duration: { ...(editingWorkflow.duration||{hours:'0',minutes:'30'}), hours: val }})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0,1,2,3,4,5,6,7,8].map(h => (
                            <SelectItem key={h} value={h.toString()}>{h} Hours</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration Minutes</Label>
                      <Select
                        value={editingWorkflow.duration?.minutes || '30'}
                        onValueChange={(val)=> setEditingWorkflow({ ...editingWorkflow, duration: { ...(editingWorkflow.duration||{hours:'0',minutes:'30'}), minutes: val }})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['0','15','30','45'].map(m => (
                            <SelectItem key={m} value={m}>{m} Minutes</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Meeting Mode</Label>
                    <Select
                      value={editingWorkflow.meetingMode || ''}
                      onValueChange={(val)=> setEditingWorkflow({ ...editingWorkflow, meetingMode: val })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select meeting mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video Conference</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="in-person">In Person</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* ASSIGN TAB */}
              {editTab === 'assign' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      type="text"
                      placeholder={`Search ${teamMemberLabel}`}
                      value={editSearchSalespersons}
                      onChange={(e)=> setEditSearchSalespersons(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {salespersons
                      .filter(sp=> sp.name.toLowerCase().includes(editSearchSalespersons.toLowerCase()))
                      .map(sp => (
                        <div key={sp.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">{sp.avatar}</div>
                            <div>
                              <div className="font-medium text-gray-900">{sp.name}</div>
                              <div className="text-xs text-gray-500">{sp.email}</div>
                            </div>
                          </div>
                          <Checkbox
                            checked={editSelectedSalespersons.includes(sp.id)}
                            onCheckedChange={() => setEditSelectedSalespersons(prev => prev.includes(sp.id) ? prev.filter(id=>id!==sp.id) : [...prev, sp.id])}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* AVAILABILITY TAB */}
              {editTab === 'availability' && editingWorkflow && (
                <div className="space-y-4">
                  {Object.entries(editingWorkflow.availability || {}).map(([day, cfg]) => {
                    const dayBreaks = editingWorkflow.breaks?.[day] || [];
                    return (
                      <div key={day} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3">
                          <div className="font-medium text-gray-800 w-28">{day}</div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={cfg.enabled}
                              onCheckedChange={(checked)=> setEditingWorkflow({
                                ...editingWorkflow,
                                availability: {
                                  ...(editingWorkflow.availability||{}),
                                  [day]: { ...cfg, enabled: !!checked }
                                }
                              })}
                            />
                            <Input
                              type="time"
                              value={cfg.start}
                              disabled={!cfg.enabled}
                              onChange={(e)=> setEditingWorkflow({
                                ...editingWorkflow,
                                availability: { ...(editingWorkflow.availability||{}), [day]: { ...cfg, start: e.target.value } }
                              })}
                              className="w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="time"
                              value={cfg.end}
                              disabled={!cfg.enabled}
                              onChange={(e)=> setEditingWorkflow({
                                ...editingWorkflow,
                                availability: { ...(editingWorkflow.availability||{}), [day]: { ...cfg, end: e.target.value } }
                              })}
                              className="w-32"
                            />
                          </div>
                        </div>
                        <div className="bg-gray-50 border-t p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Breaks</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={()=> handleAddBreak(day)}
                              disabled={!cfg.enabled}
                            >
                              <Plus size={14} className="mr-1" /> Add break
                            </Button>
                          </div>
                          {dayBreaks.length === 0 && (
                            <p className="text-sm text-gray-500">No breaks configured for this day.</p>
                          )}
                          {dayBreaks.map(breakItem => (
                            <div key={breakItem.id} className="flex items-center gap-3">
                              <Input
                                type="time"
                                value={breakItem.startTime}
                                disabled={!cfg.enabled}
                                onChange={(e)=> handleUpdateBreak(day, breakItem.id, 'startTime', e.target.value)}
                                className="w-32"
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={breakItem.endTime}
                                disabled={!cfg.enabled}
                                onChange={(e)=> handleUpdateBreak(day, breakItem.id, 'endTime', e.target.value)}
                                className="w-32"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={()=> handleDeleteBreak(day, breakItem.id)}
                                className="text-red-500"
                                disabled={!cfg.enabled}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* FORM TAB */}
              {editTab === 'form' && editingWorkflow && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Use organization default booking form</div>
                      <div className="text-sm text-gray-500">Turn off to customize fields for this {eventTypeSingular.toLowerCase()}</div>
                    </div>
                    <Switch
                      checked={editingWorkflow.useOrgFormFields !== false}
                      onCheckedChange={(checked)=> {
                        const useOrg = !!checked;
                        setEditingWorkflow({ ...editingWorkflow, useOrgFormFields: useOrg });
                      }}
                    />
                  </div>

                  {editingWorkflow.useOrgFormFields === false && (
                    <div className="space-y-3">
                      {/* Simple fields editor */}
                      {editLoginFields.map((f, idx) => (
                        <div key={f.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-lg">
                          <Input className="col-span-3" value={f.name} onChange={(e)=> {
                            const arr = [...editLoginFields]; arr[idx] = { ...arr[idx], name: e.target.value }; setEditLoginFields(arr);
                          }} />
                          <Select value={f.type} onValueChange={(val)=> { const arr=[...editLoginFields]; arr[idx] = { ...arr[idx], type: val as DynamicFieldType }; setEditLoginFields(arr); }}>
                            <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['text','email','tel','date','number','textarea'].map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <Input className="col-span-5" placeholder="Placeholder" value={f.placeholder || ''} onChange={(e)=> { const arr=[...editLoginFields]; arr[idx] = { ...arr[idx], placeholder: e.target.value }; setEditLoginFields(arr); }} />
                          <div className="col-span-1 flex items-center justify-center">
                            <Switch checked={!!f.required} onCheckedChange={(checked)=> { const arr=[...editLoginFields]; arr[idx] = { ...arr[idx], required: !!checked }; setEditLoginFields(arr); }} />
                          </div>
                          <Button variant="ghost" size="icon" className="col-span-1" onClick={()=> setEditLoginFields(editLoginFields.filter((_,i)=> i!==idx))}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </div>
                      ))}

                      {/* Add field */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={()=> setEditLoginFields([...editLoginFields, { id: Date.now().toString(), name: 'New Field', type: 'text', required: false, placeholder: '' }])}
                      >
                        <Plus size={16} className="mr-2" /> Add Field
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* LIMITS TAB */}
              {editTab === 'limits' && editingWorkflow && (
                <div className="space-y-6">
                  <div>
                    <Label className="block mb-2">Daily appointment limit</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={editingWorkflow.limits?.maxPerDay ?? ''}
                        onChange={(e)=> setEditingWorkflow({
                          ...editingWorkflow,
                          limits: { ...(editingWorkflow.limits||{}), maxPerDay: e.target.value === '' ? null : Number(e.target.value) }
                        })}
                      />
                      <div className="text-sm text-gray-500 self-center">Leave empty for unlimited</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block mb-2">Weekly appointment limit</Label>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={editingWorkflow.limits?.maxPerWeek ?? ''}
                        onChange={(e)=> setEditingWorkflow({
                          ...editingWorkflow,
                          limits: { ...(editingWorkflow.limits||{}), maxPerWeek: e.target.value === '' ? null : Number(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label className="block mb-2">Monthly appointment limit</Label>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={editingWorkflow.limits?.maxPerMonth ?? ''}
                        onChange={(e)=> setEditingWorkflow({
                          ...editingWorkflow,
                          limits: { ...(editingWorkflow.limits||{}), maxPerMonth: e.target.value === '' ? null : Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block mb-2">Minimum scheduling notice</Label>
                      <Select
                        value={String(editingWorkflow.limits?.minNoticeHours ?? 0)}
                        onValueChange={(val)=> setEditingWorkflow({
                          ...editingWorkflow,
                          limits: { ...(editingWorkflow.limits||{}), minNoticeHours: Number(val) }
                        })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0,1,2,4,8,12,24,48,72,168].map(h => (
                            <SelectItem key={h} value={String(h)}>{h} hour{h===1?'':'s'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block mb-2">Booking window</Label>
                      <Select
                        value={String(editingWorkflow.limits?.bookingWindowDays ?? 60)}
                        onValueChange={(val)=> setEditingWorkflow({
                          ...editingWorkflow,
                          limits: { ...(editingWorkflow.limits||{}), bookingWindowDays: Number(val) }
                        })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[7,14,30,60,90,180,365].map(d => (
                            <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block mb-2">Buffer before</Label>
                      <Select
                        value={String(editingWorkflow.limits?.bufferBeforeMins ?? 0)}
                        onValueChange={(val)=> setEditingWorkflow({
                          ...editingWorkflow,
                          limits: { ...(editingWorkflow.limits||{}), bufferBeforeMins: Number(val) }
                        })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0,5,10,15,30,45,60].map(m => (
                            <SelectItem key={m} value={String(m)}>{m} mins</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block mb-2">Buffer after</Label>
                      <Select
                        value={String(editingWorkflow.limits?.bufferAfterMins ?? 0)}
                        onValueChange={(val)=> setEditingWorkflow({
                          ...editingWorkflow,
                          limits: { ...(editingWorkflow.limits||{}), bufferAfterMins: Number(val) }
                        })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0,5,10,15,30,45,60].map(m => (
                            <SelectItem key={m} value={String(m)}>{m} mins</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="block mb-2">Max bookings per customer</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={editingWorkflow.limits?.maxPerCustomer ?? ''}
                      onChange={(e)=> setEditingWorkflow({
                        ...editingWorkflow,
                        limits: { ...(editingWorkflow.limits||{}), maxPerCustomer: e.target.value === '' ? null : Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={()=> setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Edit dialog UI appended below component return above would be preferred, but keeping inside file scope
