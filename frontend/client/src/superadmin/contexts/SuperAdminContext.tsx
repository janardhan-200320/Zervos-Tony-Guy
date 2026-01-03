import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Super Admin credentials
export const SUPER_ADMIN_EMAIL = 'superadmin@zervos.com';
export const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2025';

interface SuperAdminStats {
  totalClients: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingTickets: number;
  monthlyGrowth: number;
  newClientsThisMonth: number;
  churnRate: number;
  avgRevenuePerClient: number;
}

interface Client {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  plan: 'classic' | 'pro' | 'elite' | 'custom';
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  subscriptionStart: string;
  subscriptionEnd: string;
  monthlyRevenue: number;
  workspaces: number;
  lastActive: string;
  healthScore: number;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  description: string;
  category: 'billing' | 'technical' | 'feature-request' | 'bug' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'waiting-response' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  sender: 'client' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    users: number;
    workspaces: number;
    storage: string;
    apiCalls: number;
  };
  isActive: boolean;
  color: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  targetPlans: string[];
  isActive: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userId?: string;
  userEmail?: string;
  entityType: 'client' | 'ticket' | 'plan' | 'system' | 'payment';
  entityId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  severity?: 'info' | 'warning' | 'critical';
  ipAddress?: string;
}

// Feature Flags
export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  isGlobal: boolean;
  defaultValue: boolean;
  enabledPlans: string[];
  enabledClients: string[];
  disabledClients: string[];
  createdAt: string;
  updatedAt: string;
}

// Invoices & Billing
export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled' | 'refunded';
  amount: number;
  tax: number;
  total: number;
  dueDate: string;
  paidAt?: string;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  clientName: string;
  amount: number;
  method: 'card' | 'upi' | 'bank_transfer' | 'wallet';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transactionId: string;
  processedAt: string;
}

// Impersonation
export interface ImpersonationSession {
  isActive: boolean;
  clientId: string;
  clientName: string;
  startedAt: string;
  previousPath: string;
}

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  setIsSuperAdmin: (value: boolean) => void;
  stats: SuperAdminStats;
  clients: Client[];
  tickets: SupportTicket[];
  plans: SubscriptionPlan[];
  announcements: Announcement[];
  activityLogs: ActivityLog[];
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (value: 'light' | 'dark') => void;
  refreshData: () => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  updateClientStatus: (clientId: string, status: Client['status']) => void;
  updatePlan: (planId: string, updates: Partial<SubscriptionPlan>) => void;
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Feature Flags
  featureFlags: FeatureFlag[];
  createFeatureFlag: (flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFeatureFlag: (flagId: string, updates: Partial<FeatureFlag>) => void;
  toggleFeatureFlagForClient: (flagKey: string, clientId: string, enabled: boolean) => void;
  isFeatureEnabled: (flagKey: string, clientId: string, clientPlan: string) => boolean;
  // Billing
  invoices: Invoice[];
  payments: Payment[];
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => void;
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => void;
  processRefund: (invoiceId: string, amount: number, reason: string) => void;
  applyCredit: (clientId: string, amount: number, note: string) => void;
  // Impersonation
  impersonationSession: ImpersonationSession | null;
  startImpersonation: (clientId: string, clientName: string) => void;
  endImpersonation: () => void;
  // Audit
  addAuditLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

// Mock data for demonstration
const mockStats: SuperAdminStats = {
  totalClients: 1247,
  activeSubscriptions: 1189,
  totalRevenue: 4567890,
  pendingTickets: 23,
  monthlyGrowth: 12.5,
  newClientsThisMonth: 89,
  churnRate: 2.3,
  avgRevenuePerClient: 3662,
};

const mockClients: Client[] = [
  {
    id: '1',
    businessName: 'Glamour Salon & Spa',
    email: 'glamour@example.com',
    phone: '+91 98765 43210',
    plan: 'elite',
    status: 'active',
    subscriptionStart: '2024-01-15',
    subscriptionEnd: '2025-01-15',
    monthlyRevenue: 5000,
    workspaces: 3,
    lastActive: '2024-12-31T10:30:00Z',
    healthScore: 95,
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    businessName: 'Urban Style Barbers',
    email: 'urban@example.com',
    phone: '+91 87654 32109',
    plan: 'pro',
    status: 'active',
    subscriptionStart: '2024-03-01',
    subscriptionEnd: '2025-03-01',
    monthlyRevenue: 2500,
    workspaces: 1,
    lastActive: '2024-12-30T15:45:00Z',
    healthScore: 78,
    createdAt: '2024-02-28',
  },
  {
    id: '3',
    businessName: 'Beauty Corner',
    email: 'beauty@example.com',
    phone: '+91 76543 21098',
    plan: 'classic',
    status: 'trial',
    subscriptionStart: '2024-12-15',
    subscriptionEnd: '2025-01-15',
    monthlyRevenue: 1500,
    workspaces: 1,
    lastActive: '2024-12-29T09:15:00Z',
    healthScore: 65,
    createdAt: '2024-12-10',
  },
  {
    id: '4',
    businessName: 'Elite Wellness Center',
    email: 'elite@example.com',
    phone: '+91 65432 10987',
    plan: 'custom',
    status: 'active',
    subscriptionStart: '2024-06-01',
    subscriptionEnd: '2025-06-01',
    monthlyRevenue: 15000,
    workspaces: 8,
    lastActive: '2024-12-31T14:00:00Z',
    healthScore: 98,
    createdAt: '2024-05-20',
  },
  {
    id: '5',
    businessName: 'Trendy Cuts Studio',
    email: 'trendy@example.com',
    phone: '+91 54321 09876',
    plan: 'pro',
    status: 'inactive',
    subscriptionStart: '2024-02-01',
    subscriptionEnd: '2024-12-01',
    monthlyRevenue: 0,
    workspaces: 2,
    lastActive: '2024-11-15T11:30:00Z',
    healthScore: 25,
    createdAt: '2024-01-25',
  },
];

const mockTickets: SupportTicket[] = [
  {
    id: 't1',
    clientId: '1',
    clientName: 'Glamour Salon & Spa',
    clientEmail: 'glamour@example.com',
    subject: 'Unable to process payments',
    description: 'Getting error when trying to process customer payments through POS',
    category: 'technical',
    priority: 'high',
    status: 'open',
    createdAt: '2024-12-30T10:00:00Z',
    updatedAt: '2024-12-30T10:00:00Z',
    messages: [
      {
        id: 'm1',
        sender: 'client',
        senderName: 'Glamour Admin',
        message: 'Getting error when trying to process customer payments through POS. Error says "Payment gateway timeout"',
        timestamp: '2024-12-30T10:00:00Z',
      },
    ],
  },
  {
    id: 't2',
    clientId: '2',
    clientName: 'Urban Style Barbers',
    clientEmail: 'urban@example.com',
    subject: 'Feature Request: Multi-currency support',
    description: 'Would love to have multi-currency support for international customers',
    category: 'feature-request',
    priority: 'medium',
    status: 'in-progress',
    assignedTo: 'Support Team',
    createdAt: '2024-12-28T14:30:00Z',
    updatedAt: '2024-12-29T09:15:00Z',
    messages: [
      {
        id: 'm2',
        sender: 'client',
        senderName: 'Urban Admin',
        message: 'We have many international customers visiting. Multi-currency would be great!',
        timestamp: '2024-12-28T14:30:00Z',
      },
      {
        id: 'm3',
        sender: 'admin',
        senderName: 'Support Team',
        message: 'Thank you for your suggestion! We are considering this for our Q1 roadmap.',
        timestamp: '2024-12-29T09:15:00Z',
      },
    ],
  },
  {
    id: 't3',
    clientId: '3',
    clientName: 'Beauty Corner',
    clientEmail: 'beauty@example.com',
    subject: 'Billing inquiry - Invoice not received',
    description: 'Did not receive invoice for December subscription',
    category: 'billing',
    priority: 'low',
    status: 'waiting-response',
    createdAt: '2024-12-29T16:45:00Z',
    updatedAt: '2024-12-30T08:00:00Z',
    messages: [
      {
        id: 'm4',
        sender: 'client',
        senderName: 'Beauty Admin',
        message: 'I did not receive the invoice for December. Can you please resend?',
        timestamp: '2024-12-29T16:45:00Z',
      },
      {
        id: 'm5',
        sender: 'admin',
        senderName: 'Billing Team',
        message: 'Invoice has been resent to your registered email. Please check spam folder if not received.',
        timestamp: '2024-12-30T08:00:00Z',
      },
    ],
  },
  {
    id: 't4',
    clientId: '4',
    clientName: 'Elite Wellness Center',
    clientEmail: 'elite@example.com',
    subject: 'Critical: System down for 2 hours',
    description: 'Entire system is not accessible for our team',
    category: 'technical',
    priority: 'critical',
    status: 'resolved',
    assignedTo: 'Tech Lead',
    createdAt: '2024-12-25T08:00:00Z',
    updatedAt: '2024-12-25T10:30:00Z',
    messages: [
      {
        id: 'm6',
        sender: 'client',
        senderName: 'Elite Admin',
        message: 'URGENT: None of our staff can login. System shows 503 error.',
        timestamp: '2024-12-25T08:00:00Z',
      },
      {
        id: 'm7',
        sender: 'admin',
        senderName: 'Tech Lead',
        message: 'We identified the issue - server overload during peak hours. Scaling up resources now.',
        timestamp: '2024-12-25T09:00:00Z',
      },
      {
        id: 'm8',
        sender: 'admin',
        senderName: 'Tech Lead',
        message: 'Issue resolved. System is back online. We apologize for the inconvenience.',
        timestamp: '2024-12-25T10:30:00Z',
      },
    ],
  },
];

const mockPlans: SubscriptionPlan[] = [
  {
    id: 'classic',
    name: 'Classic Salon',
    tagline: 'Perfect for small salons',
    monthlyPrice: 1500,
    annualPrice: 15000,
    features: [
      'Single-user login access',
      'Booking System',
      'Point of Sale (POS)',
      'Staff Member Assignment',
      'Products & Services Management',
      'Customer profile management',
      'Service duration & package builder',
      'Appointment reminders (SMS/WhatsApp)',
      'Vendor management',
      'Basic reports',
    ],
    limits: {
      users: 1,
      workspaces: 1,
      storage: '5GB',
      apiCalls: 1000,
    },
    isActive: true,
    color: 'slate',
  },
  {
    id: 'pro',
    name: 'Pro Salon',
    tagline: 'For growing salons',
    monthlyPrice: 2500,
    annualPrice: 25000,
    features: [
      '5-user login access',
      'Role-based permissions',
      'Online Booking System',
      'Point of Sale (POS)',
      'WhatsApp Notifications',
      'Loyalty & Membership System',
      'Advanced Reports',
      'Review & rating system',
      'Discount & promo codes',
    ],
    limits: {
      users: 5,
      workspaces: 3,
      storage: '25GB',
      apiCalls: 5000,
    },
    isActive: true,
    color: 'blue',
  },
  {
    id: 'elite',
    name: 'Elite Salon',
    tagline: 'For premium salons',
    monthlyPrice: 5000,
    annualPrice: 50000,
    features: [
      'Unlimited users',
      'All Pro features',
      'White-label branding',
      'Priority support',
      'Custom integrations',
      'API access',
      'Dedicated account manager',
      'Custom analytics dashboard',
    ],
    limits: {
      users: -1,
      workspaces: 10,
      storage: '100GB',
      apiCalls: -1,
    },
    isActive: true,
    color: 'purple',
  },
];

const mockAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: 'New Year Maintenance Window',
    content: 'Scheduled maintenance on January 1st, 2025 from 2 AM to 4 AM IST. Services may be temporarily unavailable.',
    type: 'warning',
    targetPlans: ['classic', 'pro', 'elite'],
    isActive: true,
    scheduledAt: '2024-12-30T00:00:00Z',
    expiresAt: '2025-01-02T00:00:00Z',
    createdAt: '2024-12-28T10:00:00Z',
  },
  {
    id: 'a2',
    title: 'New WhatsApp Bot Feature Released!',
    content: 'Exciting news! The new WhatsApp Bot Flow Builder is now available for Pro and Elite plans.',
    type: 'success',
    targetPlans: ['pro', 'elite'],
    isActive: true,
    createdAt: '2024-12-20T14:00:00Z',
  },
];

const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log1',
    action: 'client_signup',
    description: 'New client registration',
    userEmail: 'newclient@example.com',
    entityType: 'client',
    entityId: '6',
    metadata: { plan: 'classic', source: 'website' },
    timestamp: '2024-12-31T09:30:00Z',
    severity: 'info',
  },
  {
    id: 'log2',
    action: 'subscription_upgrade',
    description: 'Plan upgraded from Classic to Pro',
    userEmail: 'beauty@example.com',
    entityType: 'client',
    entityId: '3',
    metadata: { oldPlan: 'classic', newPlan: 'pro' },
    timestamp: '2024-12-31T08:15:00Z',
    severity: 'info',
  },
  {
    id: 'log3',
    action: 'payment_received',
    description: 'Monthly subscription payment',
    userEmail: 'elite@example.com',
    entityType: 'payment',
    entityId: 'pay_123',
    metadata: { amount: 15000, currency: 'INR' },
    timestamp: '2024-12-30T23:00:00Z',
    severity: 'info',
  },
  {
    id: 'log4',
    action: 'ticket_created',
    description: 'New support ticket created',
    userEmail: 'glamour@example.com',
    entityType: 'ticket',
    entityId: 't1',
    metadata: { priority: 'high', category: 'technical' },
    timestamp: '2024-12-30T10:00:00Z',
    severity: 'warning',
  },
  {
    id: 'log5',
    action: 'login_failed',
    description: 'Multiple failed login attempts detected',
    userEmail: 'unknown@example.com',
    entityType: 'system',
    metadata: { attempts: 5, blocked: true },
    timestamp: '2024-12-30T08:45:00Z',
    severity: 'critical',
    ipAddress: '192.168.1.100',
  },
];

const mockFeatureFlags: FeatureFlag[] = [
  {
    id: 'ff1',
    name: 'WhatsApp Bot Builder',
    key: 'whatsapp_bot_builder',
    description: 'Enable the visual WhatsApp bot flow builder',
    isGlobal: false,
    defaultValue: false,
    enabledPlans: ['pro', 'elite'],
    enabledClients: [],
    disabledClients: [],
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'ff2',
    name: 'Advanced Analytics',
    key: 'advanced_analytics',
    description: 'Access to detailed analytics and custom reports',
    isGlobal: false,
    defaultValue: false,
    enabledPlans: ['elite'],
    enabledClients: ['2'], // Beta access for Urban Style
    disabledClients: [],
    createdAt: '2024-10-15T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
  },
  {
    id: 'ff3',
    name: 'Multi-Location Support',
    key: 'multi_location',
    description: 'Manage multiple business locations from one account',
    isGlobal: false,
    defaultValue: false,
    enabledPlans: ['pro', 'elite'],
    enabledClients: [],
    disabledClients: [],
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 'ff4',
    name: 'Maintenance Mode',
    key: 'maintenance_mode',
    description: 'Put the entire system into maintenance mode',
    isGlobal: true,
    defaultValue: false,
    enabledPlans: [],
    enabledClients: [],
    disabledClients: [],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'ff5',
    name: 'Beta Features',
    key: 'beta_features',
    description: 'Access to experimental beta features',
    isGlobal: false,
    defaultValue: false,
    enabledPlans: [],
    enabledClients: ['1', '4'], // Selected beta testers
    disabledClients: [],
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-20T00:00:00Z',
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    clientId: '1',
    clientName: 'Glamour Salon & Spa',
    clientEmail: 'glamour@example.com',
    invoiceNumber: 'INV-2024-0001',
    status: 'paid',
    amount: 5000,
    tax: 900,
    total: 5900,
    dueDate: '2024-12-15',
    paidAt: '2024-12-14T10:30:00Z',
    items: [
      { description: 'Elite Salon - Monthly Subscription', quantity: 1, unitPrice: 5000, total: 5000 },
    ],
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'inv2',
    clientId: '2',
    clientName: 'Urban Style Barbers',
    clientEmail: 'urban@example.com',
    invoiceNumber: 'INV-2024-0002',
    status: 'pending',
    amount: 2500,
    tax: 450,
    total: 2950,
    dueDate: '2025-01-15',
    items: [
      { description: 'Pro Salon - Monthly Subscription', quantity: 1, unitPrice: 2500, total: 2500 },
    ],
    createdAt: '2024-12-30T00:00:00Z',
  },
  {
    id: 'inv3',
    clientId: '3',
    clientName: 'Beauty Corner',
    clientEmail: 'beauty@example.com',
    invoiceNumber: 'INV-2024-0003',
    status: 'overdue',
    amount: 1500,
    tax: 270,
    total: 1770,
    dueDate: '2024-12-25',
    items: [
      { description: 'Classic Salon - Monthly Subscription', quantity: 1, unitPrice: 1500, total: 1500 },
    ],
    createdAt: '2024-12-10T00:00:00Z',
  },
  {
    id: 'inv4',
    clientId: '4',
    clientName: 'Elite Wellness Center',
    clientEmail: 'elite@example.com',
    invoiceNumber: 'INV-2024-0004',
    status: 'paid',
    amount: 15000,
    tax: 2700,
    total: 17700,
    dueDate: '2024-12-20',
    paidAt: '2024-12-18T14:20:00Z',
    items: [
      { description: 'Custom Plan - Monthly Subscription', quantity: 1, unitPrice: 12000, total: 12000 },
      { description: 'Additional API Calls Package', quantity: 1, unitPrice: 3000, total: 3000 },
    ],
    createdAt: '2024-12-05T00:00:00Z',
  },
];

const mockPayments: Payment[] = [
  {
    id: 'pay1',
    invoiceId: 'inv1',
    clientId: '1',
    clientName: 'Glamour Salon & Spa',
    amount: 5900,
    method: 'card',
    status: 'completed',
    transactionId: 'TXN_123456789',
    processedAt: '2024-12-14T10:30:00Z',
  },
  {
    id: 'pay2',
    invoiceId: 'inv4',
    clientId: '4',
    clientName: 'Elite Wellness Center',
    amount: 17700,
    method: 'bank_transfer',
    status: 'completed',
    transactionId: 'TXN_987654321',
    processedAt: '2024-12-18T14:20:00Z',
  },
  {
    id: 'pay3',
    invoiceId: 'inv2',
    clientId: '2',
    clientName: 'Urban Style Barbers',
    amount: 2950,
    method: 'upi',
    status: 'pending',
    transactionId: 'TXN_456789123',
    processedAt: '2024-12-30T09:00:00Z',
  },
];

export const SuperAdminProvider = ({ children }: { children: ReactNode }) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [stats, setStats] = useState<SuperAdminStats>(mockStats);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(mockPlans);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New state for features
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(mockFeatureFlags);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null);

  // Check if user is super admin on mount
  useEffect(() => {
    const savedSuperAdmin = localStorage.getItem('zervos_superadmin');
    if (savedSuperAdmin === 'true') {
      setIsSuperAdmin(true);
    }
  }, []);

  // Save super admin status
  useEffect(() => {
    localStorage.setItem('zervos_superadmin', String(isSuperAdmin));
  }, [isSuperAdmin]);

  const refreshData = () => {
    // In production, fetch fresh data from API
    setStats(mockStats);
    setClients(mockClients);
    setTickets(mockTickets);
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status, updatedAt: new Date().toISOString() } 
          : ticket
      )
    );
  };

  const updateClientStatus = (clientId: string, status: Client['status']) => {
    setClients(prev => 
      prev.map(client => 
        client.id === clientId ? { ...client, status } : client
      )
    );
  };

  const updatePlan = (planId: string, updates: Partial<SubscriptionPlan>) => {
    setPlans(prev => 
      prev.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      )
    );
  };

  const createAnnouncement = (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  // Feature Flag Functions
  const createFeatureFlag = (flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newFlag: FeatureFlag = {
      ...flag,
      id: `ff${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFeatureFlags(prev => [...prev, newFlag]);
    addAuditLog({
      action: 'feature_flag_created',
      description: `Feature flag "${flag.name}" created`,
      entityType: 'system',
      metadata: { flagKey: flag.key },
    });
  };

  const updateFeatureFlag = (flagId: string, updates: Partial<FeatureFlag>) => {
    setFeatureFlags(prev =>
      prev.map(flag =>
        flag.id === flagId
          ? { ...flag, ...updates, updatedAt: new Date().toISOString() }
          : flag
      )
    );
  };

  const toggleFeatureFlagForClient = (flagKey: string, clientId: string, enabled: boolean) => {
    setFeatureFlags(prev =>
      prev.map(flag => {
        if (flag.key !== flagKey) return flag;
        
        let enabledClients = [...flag.enabledClients];
        let disabledClients = [...flag.disabledClients];
        
        if (enabled) {
          if (!enabledClients.includes(clientId)) {
            enabledClients = [...enabledClients, clientId];
          }
          disabledClients = disabledClients.filter(id => id !== clientId);
        } else {
          if (!disabledClients.includes(clientId)) {
            disabledClients = [...disabledClients, clientId];
          }
          enabledClients = enabledClients.filter(id => id !== clientId);
        }
        
        return { ...flag, enabledClients, disabledClients, updatedAt: new Date().toISOString() };
      })
    );
  };

  const isFeatureEnabled = (flagKey: string, clientId: string, clientPlan: string): boolean => {
    const flag = featureFlags.find(f => f.key === flagKey);
    if (!flag) return false;
    if (flag.disabledClients.includes(clientId)) return false;
    if (flag.enabledClients.includes(clientId)) return true;
    if (flag.enabledPlans.includes(clientPlan)) return true;
    return flag.defaultValue;
  };

  // Billing Functions
  const createInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    setInvoices(prev => [...prev, newInvoice]);
    addAuditLog({
      action: 'invoice_created',
      description: `Invoice ${invoiceNumber} created for ${invoice.clientName}`,
      entityType: 'payment',
      entityId: newInvoice.id,
      metadata: { amount: invoice.total },
    });
  };

  const updateInvoiceStatus = (invoiceId: string, status: Invoice['status']) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId
          ? { ...inv, status, paidAt: status === 'paid' ? new Date().toISOString() : inv.paidAt }
          : inv
      )
    );
  };

  const processRefund = (invoiceId: string, amount: number, reason: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    updateInvoiceStatus(invoiceId, 'refunded');
    
    const refundPayment: Payment = {
      id: `pay${Date.now()}`,
      invoiceId,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      amount: -amount,
      method: 'bank_transfer',
      status: 'completed',
      transactionId: `REF_${Date.now()}`,
      processedAt: new Date().toISOString(),
    };
    setPayments(prev => [...prev, refundPayment]);
    
    addAuditLog({
      action: 'refund_processed',
      description: `Refund of ₹${amount} processed for ${invoice.clientName}`,
      entityType: 'payment',
      entityId: invoiceId,
      metadata: { amount, reason },
      severity: 'warning',
    });
  };

  const applyCredit = (clientId: string, amount: number, note: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    addAuditLog({
      action: 'credit_applied',
      description: `Credit of ₹${amount} applied to ${client.businessName}`,
      entityType: 'payment',
      metadata: { amount, note },
    });
  };

  // Impersonation Functions
  const startImpersonation = (clientId: string, clientName: string) => {
    setImpersonationSession({
      isActive: true,
      clientId,
      clientName,
      startedAt: new Date().toISOString(),
      previousPath: window.location.pathname,
    });
    addAuditLog({
      action: 'impersonation_started',
      description: `Started impersonation of ${clientName}`,
      entityType: 'client',
      entityId: clientId,
      severity: 'warning',
    });
  };

  const endImpersonation = () => {
    if (impersonationSession) {
      addAuditLog({
        action: 'impersonation_ended',
        description: `Ended impersonation of ${impersonationSession.clientName}`,
        entityType: 'client',
        entityId: impersonationSession.clientId,
      });
    }
    setImpersonationSession(null);
  };

  // Audit Functions
  const addAuditLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: `log${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: log.severity || 'info',
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  return (
    <SuperAdminContext.Provider
      value={{
        isSuperAdmin,
        setIsSuperAdmin,
        stats,
        clients,
        tickets,
        plans,
        announcements,
        activityLogs,
        sidebarCollapsed,
        setSidebarCollapsed,
        theme,
        setTheme,
        refreshData,
        updateTicketStatus,
        updateClientStatus,
        updatePlan,
        createAnnouncement,
        searchQuery,
        setSearchQuery,
        // Feature Flags
        featureFlags,
        createFeatureFlag,
        updateFeatureFlag,
        toggleFeatureFlagForClient,
        isFeatureEnabled,
        // Billing
        invoices,
        payments,
        createInvoice,
        updateInvoiceStatus,
        processRefund,
        applyCredit,
        // Impersonation
        impersonationSession,
        startImpersonation,
        endImpersonation,
        // Audit
        addAuditLog,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  }
  return context;
};

export type { 
  SuperAdminStats, 
  Client, 
  SupportTicket, 
  TicketMessage, 
  SubscriptionPlan, 
  Announcement, 
  ActivityLog,
};
