import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  Users,
  Globe,
  Share2,
  Palette,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Video,
  MapPin,
  User,
  Settings,
  BarChart3,
  TrendingUp,
  Eye,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  Filter,
  Download,
  QrCode,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface BookingSession {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  price: number; // in cents
  category: string;
  color: string;
  isActive: boolean;
  bookingType: 'individual' | 'group';
  maxParticipants?: number;
  location: 'online' | 'office' | 'client-location';
  meetingLink?: string;
  requirements?: string;
  tags: string[];
  createdAt: string;
  assignedStaff: string[];
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

interface Booking {
  id: string;
  sessionId: string;
  sessionTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  bookedDate: string;
  bookedTime: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  createdAt: string;
  assignedStaff?: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  specializations: string[];
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  isActive: boolean;
}

const SESSION_CATEGORIES = [
  { value: 'consultation', label: 'Consultation', icon: User, color: 'blue' },
  { value: 'spa-service', label: 'Spa Service', icon: Star, color: 'pink' },
  { value: 'beauty-treatment', label: 'Beauty Treatment', icon: Palette, color: 'purple' },
  { value: 'massage', label: 'Massage Therapy', icon: Zap, color: 'green' },
  { value: 'wellness', label: 'Wellness Session', icon: CheckCircle, color: 'teal' },
  { value: 'skincare', label: 'Skincare Treatment', icon: Star, color: 'amber' },
  { value: 'hair-service', label: 'Hair Service', icon: Palette, color: 'red' },
  { value: 'fitness', label: 'Fitness Session', icon: TrendingUp, color: 'orange' },
];

const STAFF_ROLES = [
  { value: 'therapist', label: 'Therapist' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'beautician', label: 'Beautician' },
  { value: 'masseuse', label: 'Masseuse' },
];

const WEEK_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function BookingPagesPage() {
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  
  // State management
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState<BookingSession[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Dialog states
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<BookingSession | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  // Form states
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    duration: 60,
    price: 0,
    category: 'consultation',
    color: '#3B82F6',
    isActive: true,
    bookingType: 'individual' as 'individual' | 'group',
    maxParticipants: 1,
    location: 'office' as 'online' | 'office' | 'client-location',
    meetingLink: '',
    requirements: '',
    tags: [] as string[],
    assignedStaff: [] as string[],
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
    },
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'therapist',
    specializations: [] as string[],
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
    },
    isActive: true,
  });

  const [bookingForm, setBookingForm] = useState({
    sessionId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookedDate: new Date().toISOString().split('T')[0],
    bookedTime: '10:00',
    notes: '',
    assignedStaff: '',
  });

  // Storage keys
  const storageKeyBookingSessions = selectedWorkspace 
    ? `zervos_booking_sessions_${selectedWorkspace.id}`
    : 'zervos_booking_sessions';
  const storageKeyBookings = selectedWorkspace 
    ? `zervos_bookings_${selectedWorkspace.id}`
    : 'zervos_bookings';
  const storageKeyBookingStaff = selectedWorkspace 
    ? `zervos_booking_staff_${selectedWorkspace.id}`
    : 'zervos_booking_staff';

  // Load data
  useEffect(() => {
    loadData();
  }, [selectedWorkspace]);

  const loadData = () => {
    // Load sessions
    const storedSessions = localStorage.getItem(storageKeyBookingSessions);
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }

    // Load bookings
    const storedBookings = localStorage.getItem(storageKeyBookings);
    if (storedBookings) {
      setBookings(JSON.parse(storedBookings));
    }

    // Load staff
    const storedStaff = localStorage.getItem(storageKeyBookingStaff);
    if (storedStaff) {
      setStaff(JSON.parse(storedStaff));
    }
  };

  const saveSessions = (data: BookingSession[]) => {
    localStorage.setItem(storageKeyBookingSessions, JSON.stringify(data));
    setSessions(data);
  };

  const saveBookings = (data: Booking[]) => {
    localStorage.setItem(storageKeyBookings, JSON.stringify(data));
    setBookings(data);
  };

  const saveStaff = (data: Staff[]) => {
    localStorage.setItem(storageKeyBookingStaff, JSON.stringify(data));
    setStaff(data);
  };

  // Session CRUD
  const handleAddSession = () => {
    if (!sessionForm.title || !sessionForm.description) {
      toast({
        title: 'Missing Information',
        description: 'Session title and description are required',
        variant: 'destructive',
      });
      return;
    }

    const newSession: BookingSession = {
      id: `session-${Date.now()}`,
      ...sessionForm,
      price: sessionForm.price * 100, // Convert to cents
      createdAt: new Date().toISOString(),
    };

    saveSessions([newSession, ...sessions]);
    toast({ title: 'Session Created', description: `${newSession.title} added successfully` });
    resetSessionForm();
    setIsSessionDialogOpen(false);
  };

  const handleUpdateSession = () => {
    if (!editingSession) return;

    const updated = sessions.map(s =>
      s.id === editingSession.id 
        ? { ...s, ...sessionForm, price: sessionForm.price * 100 }
        : s
    );

    saveSessions(updated);
    toast({ title: 'Session Updated', description: 'Changes saved successfully' });
    resetSessionForm();
    setIsSessionDialogOpen(false);
    setEditingSession(null);
  };

  const handleDeleteSession = (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    saveSessions(sessions.filter(s => s.id !== id));
    toast({ title: 'Session Deleted', description: 'Session removed successfully' });
  };

  const openEditSession = (session: BookingSession) => {
    setEditingSession(session);
    setSessionForm({
      ...session,
      price: session.price / 100, // Convert from cents
    });
    setIsSessionDialogOpen(true);
  };

  const resetSessionForm = () => {
    setSessionForm({
      title: '',
      description: '',
      duration: 60,
      price: 0,
      category: 'consultation',
      color: '#3B82F6',
      isActive: true,
      bookingType: 'individual',
      maxParticipants: 1,
      location: 'office',
      meetingLink: '',
      requirements: '',
      tags: [],
      assignedStaff: [],
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00',
        endTime: '17:00',
      },
    });
  };

  // Staff CRUD
  const handleAddStaff = () => {
    if (!staffForm.name || !staffForm.email) {
      toast({
        title: 'Missing Information',
        description: 'Staff name and email are required',
        variant: 'destructive',
      });
      return;
    }

    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      ...staffForm,
      avatar: staffForm.name.split(' ').map(n => n[0]).join('').toUpperCase(),
    };

    saveStaff([newStaff, ...staff]);
    toast({ title: 'Staff Added', description: `${newStaff.name} added successfully` });
    resetStaffForm();
    setIsStaffDialogOpen(false);
  };

  const handleUpdateStaff = () => {
    if (!editingStaff) return;

    const updated = staff.map(s =>
      s.id === editingStaff.id ? { ...s, ...staffForm } : s
    );

    saveStaff(updated);
    toast({ title: 'Staff Updated', description: 'Changes saved successfully' });
    resetStaffForm();
    setIsStaffDialogOpen(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    
    saveStaff(staff.filter(s => s.id !== id));
    toast({ title: 'Staff Removed', description: 'Staff member removed successfully' });
  };

  const openEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setStaffForm(staffMember);
    setIsStaffDialogOpen(true);
  };

  const resetStaffForm = () => {
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      role: 'therapist',
      specializations: [],
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00',
        endTime: '17:00',
      },
      isActive: true,
    });
  };

  // Booking management
  const handleAddBooking = () => {
    if (!bookingForm.sessionId || !bookingForm.customerName || !bookingForm.customerEmail) {
      toast({
        title: 'Missing Information',
        description: 'Session, customer name, and email are required',
        variant: 'destructive',
      });
      return;
    }

    const session = sessions.find(s => s.id === bookingForm.sessionId);
    if (!session) return;

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      ...bookingForm,
      sessionTitle: session.title,
      amount: session.price,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    saveBookings([newBooking, ...bookings]);
    toast({ title: 'Booking Created', description: `Booking for ${newBooking.customerName} confirmed` });
    resetBookingForm();
    setIsBookingDialogOpen(false);
  };

  const resetBookingForm = () => {
    setBookingForm({
      sessionId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      bookedDate: new Date().toISOString().split('T')[0],
      bookedTime: '10:00',
      notes: '',
      assignedStaff: '',
    });
  };

  // Filtering and searching
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || session.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && session.isActive) ||
      (filterStatus === 'inactive' && !session.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && member.isActive) ||
      (filterStatus === 'inactive' && !member.isActive);

    return matchesSearch && matchesStatus;
  });

  // Analytics
  const totalRevenue = bookings
    .filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);
  
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  const getStatusBadge = (status: string, type: 'session' | 'booking' | 'staff' = 'session') => {
    if (type === 'session' || type === 'staff') {
      return status === 'active' || status === true ? 
        <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge> :
        <Badge className="bg-red-100 text-red-700 border-red-300">Inactive</Badge>;
    }

    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryInfo = (category: string) => {
    return SESSION_CATEGORIES.find(c => c.value === category) || SESSION_CATEGORIES[0];
  };

  const copyBookingLink = (sessionId: string) => {
    const link = `${window.location.origin}/book/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link Copied', description: 'Booking link copied to clipboard' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Booking Management</h1>
            <p className="text-slate-600 mt-1">Manage sessions, bookings, and staff schedules</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              onClick={() => {
                setActiveTab('sessions');
                resetSessionForm();
                setIsSessionDialogOpen(true);
              }}
              className="bg-gradient-to-r from-brand-500 to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </div>
        </motion.div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
                <p className="text-xs text-slate-500 mt-1">From completed bookings</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{sessions.filter(s => s.isActive).length}</div>
                <p className="text-xs text-slate-500 mt-1">Available for booking</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{confirmedBookings}</div>
                <p className="text-xs text-slate-500 mt-1">Ready to proceed</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <Users className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{staff.filter(s => s.isActive).length}</div>
                <p className="text-xs text-slate-500 mt-1">Available for assignments</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {SESSION_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => {
                      resetSessionForm();
                      setIsSessionDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-brand-500 to-purple-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Sessions Grid */}
            {filteredSessions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No sessions found</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {sessions.length === 0
                    ? 'Create your first booking session'
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredSessions.map((session, index) => {
                    const categoryInfo = getCategoryInfo(session.category);
                    const Icon = categoryInfo.icon;
                    
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center">
                              <Icon className="h-6 w-6 text-brand-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{session.title}</h3>
                              <p className="text-xs text-slate-500">{categoryInfo.label}</p>
                            </div>
                          </div>
                          {getStatusBadge(session.isActive, 'session')}
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-slate-600 line-clamp-2">{session.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{session.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-green-600">{formatPrice(session.price)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4" />
                            <span className="capitalize">{session.location.replace('-', ' ')}</span>
                          </div>
                          {session.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {session.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyBookingLink(session.id)}
                            className="flex-1"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditSession(session)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => {
                      resetBookingForm();
                      setIsBookingDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-brand-500 to-purple-600"
                    disabled={sessions.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Bookings Table */}
            {filteredBookings.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No bookings found</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {bookings.length === 0
                    ? 'Start accepting bookings from customers'
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Session</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{booking.customerName}</div>
                              <div className="text-sm text-slate-500">{booking.customerEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{booking.sessionTitle}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(booking.bookedDate).toLocaleDateString()} at {booking.bookedTime}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">
                            {formatPrice(booking.amount)}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(booking.status, 'booking')}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-4">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => {
                      resetStaffForm();
                      setIsStaffDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-brand-500 to-purple-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Staff Grid */}
            {filteredStaff.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Users className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No staff found</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {staff.length === 0
                    ? 'Add your first staff member'
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredStaff.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {member.avatar || member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{member.name}</h3>
                            <p className="text-xs text-slate-500 capitalize">{member.role.replace('-', ' ')}</p>
                          </div>
                        </div>
                        {getStatusBadge(member.isActive, 'staff')}
                      </div>

                      <div className="space-y-2 mb-4">
                        {member.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="h-4 w-4" />
                          <span>{member.availability.startTime} - {member.availability.endTime}</span>
                        </div>
                        {member.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {member.specializations.slice(0, 3).map(spec => (
                              <Badge key={spec} variant="outline" className="text-xs">{spec}</Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditStaff(member)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {/* Booking Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Booking Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Confirmed</span>
                    <span className="text-sm font-bold">{confirmedBookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <span className="text-sm font-bold">{pendingBookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed</span>
                    <span className="text-sm font-bold">{completedBookings}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Revenue</span>
                    <span className="text-sm font-bold text-green-600">{formatPrice(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Session Price</span>
                    <span className="text-sm font-bold">
                      {sessions.length > 0 
                        ? formatPrice(sessions.reduce((sum, s) => sum + s.price, 0) / sessions.length)
                        : '₹0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Payments</span>
                    <span className="text-sm font-bold text-amber-600">
                      {formatPrice(bookings
                        .filter(b => b.paymentStatus === 'pending')
                        .reduce((sum, b) => sum + b.amount, 0)
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Session Dialog */}
        <Dialog open={isSessionDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsSessionDialogOpen(false);
            setEditingSession(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Edit Session' : 'Create New Session'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Session Title *</Label>
                  <Input
                    id="title"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={sessionForm.category} onValueChange={(value) => setSessionForm({ ...sessionForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={sessionForm.duration}
                    onChange={(e) => setSessionForm({ ...sessionForm, duration: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={sessionForm.price}
                    onChange={(e) => setSessionForm({ ...sessionForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="bookingType">Booking Type</Label>
                  <Select value={sessionForm.bookingType} onValueChange={(value: 'individual' | 'group') => setSessionForm({ ...sessionForm, bookingType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sessionForm.bookingType === 'group' && (
                <div>
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={sessionForm.maxParticipants}
                    onChange={(e) => setSessionForm({ ...sessionForm, maxParticipants: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={sessionForm.location} onValueChange={(value: 'online' | 'office' | 'client-location') => setSessionForm({ ...sessionForm, location: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="client-location">Client Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <Select value={sessionForm.isActive ? 'active' : 'inactive'} onValueChange={(value) => setSessionForm({ ...sessionForm, isActive: value === 'active' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sessionForm.location === 'online' && (
                <div>
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input
                    id="meetingLink"
                    value={sessionForm.meetingLink}
                    onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}

              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={sessionForm.requirements}
                  onChange={(e) => setSessionForm({ ...sessionForm, requirements: e.target.value })}
                  rows={2}
                  placeholder="Any special requirements or preparations needed..."
                />
              </div>

              <div>
                <Label>Availability</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="startTime" className="text-sm">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={sessionForm.availability.startTime}
                      onChange={(e) => setSessionForm({ 
                        ...sessionForm, 
                        availability: { ...sessionForm.availability, startTime: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-sm">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={sessionForm.availability.endTime}
                      onChange={(e) => setSessionForm({ 
                        ...sessionForm, 
                        availability: { ...sessionForm.availability, endTime: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Working Days</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {WEEK_DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = sessionForm.availability.days.includes(day)
                              ? sessionForm.availability.days.filter(d => d !== day)
                              : [...sessionForm.availability.days, day];
                            setSessionForm({ 
                              ...sessionForm, 
                              availability: { ...sessionForm.availability, days }
                            });
                          }}
                          className={`px-2 py-1 text-xs rounded border ${
                            sessionForm.availability.days.includes(day)
                              ? 'bg-brand-100 text-brand-700 border-brand-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsSessionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingSession ? handleUpdateSession : handleAddSession}>
                {editingSession ? 'Update Session' : 'Create Session'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Staff Dialog */}
        <Dialog open={isStaffDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsStaffDialogOpen(false);
            setEditingStaff(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staffName">Full Name *</Label>
                  <Input
                    id="staffName"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="staffEmail">Email *</Label>
                  <Input
                    id="staffEmail"
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staffPhone">Phone</Label>
                  <Input
                    id="staffPhone"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="staffRole">Role</Label>
                  <Select value={staffForm.role} onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Availability</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="staffStartTime" className="text-sm">Start Time</Label>
                    <Input
                      id="staffStartTime"
                      type="time"
                      value={staffForm.availability.startTime}
                      onChange={(e) => setStaffForm({ 
                        ...staffForm, 
                        availability: { ...staffForm.availability, startTime: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="staffEndTime" className="text-sm">End Time</Label>
                    <Input
                      id="staffEndTime"
                      type="time"
                      value={staffForm.availability.endTime}
                      onChange={(e) => setStaffForm({ 
                        ...staffForm, 
                        availability: { ...staffForm.availability, endTime: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Working Days</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {WEEK_DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = staffForm.availability.days.includes(day)
                              ? staffForm.availability.days.filter(d => d !== day)
                              : [...staffForm.availability.days, day];
                            setStaffForm({ 
                              ...staffForm, 
                              availability: { ...staffForm.availability, days }
                            });
                          }}
                          className={`px-2 py-1 text-xs rounded border ${
                            staffForm.availability.days.includes(day)
                              ? 'bg-brand-100 text-brand-700 border-brand-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="staffStatus">Status</Label>
                <Select value={staffForm.isActive ? 'active' : 'inactive'} onValueChange={(value) => setStaffForm({ ...staffForm, isActive: value === 'active' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingStaff ? handleUpdateStaff : handleAddStaff}>
                {editingStaff ? 'Update Staff' : 'Add Staff'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Dialog */}
        <Dialog open={isBookingDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsBookingDialogOpen(false);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="sessionSelect">Session *</Label>
                <Select value={bookingForm.sessionId} onValueChange={(value) => setBookingForm({ ...bookingForm, sessionId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.filter(s => s.isActive).map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title} - {formatPrice(session.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Customer Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={bookingForm.customerEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bookedDate">Date *</Label>
                  <Input
                    id="bookedDate"
                    type="date"
                    value={bookingForm.bookedDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookedDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bookedTime">Time *</Label>
                  <Input
                    id="bookedTime"
                    type="time"
                    value={bookingForm.bookedTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookedTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assignedStaffSelect">Assign Staff</Label>
                <Select value={bookingForm.assignedStaff} onValueChange={(value) => setBookingForm({ ...bookingForm, assignedStaff: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No staff assigned</SelectItem>
                    {staff.filter(s => s.isActive).map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bookingNotes">Notes</Label>
                <Textarea
                  id="bookingNotes"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Any special notes or requests..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBooking}>
                Create Booking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
