import { type User, type InsertUser, type Onboarding, type InsertOnboarding, type Resource, type InsertResource, type ResourceBooking, type InsertResourceBooking, type UpdateUserProfile, type UserSession, type InsertUserSession, type BotFlow, type InsertBotFlow, type Conversation, type InsertConversation, type BotMessage, type InsertBotMessage, type BotAnalytics, type InsertBotAnalytics } from "@shared/schema";
import { randomUUID } from "crypto";

// Define missing types locally
export interface Appointment {
  id: string;
  [key: string]: any;
}

export type InsertAppointment = Omit<Appointment, 'id'>;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User | undefined>;
  updateUserPassword(userId: string, newPassword: string): Promise<boolean>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  deleteUserSession(sessionId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  createOnboarding(onboarding: InsertOnboarding): Promise<Onboarding>;
  getOnboarding(id: string): Promise<Onboarding | undefined>;
  getAllOnboardings(): Promise<Onboarding[]>;
  
  // Resource methods
  createResource(resource: InsertResource): Promise<Resource>;
  getResource(id: string): Promise<Resource | undefined>;
  getAllResources(filters?: { type?: string; status?: string; search?: string }): Promise<Resource[]>;
  updateResource(id: string, resource: InsertResource): Promise<Resource | undefined>;
  deleteResource(id: string): Promise<void>;
  
  // Resource booking methods
  createResourceBooking(booking: InsertResourceBooking): Promise<ResourceBooking>;
  getResourceBookings(filters?: { resourceId?: string; startDate?: string; endDate?: string }): Promise<ResourceBooking[]>;
  checkResourceAvailability(resourceId: string, startTime: string, endTime: string): Promise<boolean>;
  cancelResourceBooking(id: string): Promise<ResourceBooking | undefined>;
  getResourceStats(resourceId: string, startDate?: string, endDate?: string): Promise<any>;

  // Appointments (sales call bookings)
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointments(filters?: { assignedMemberId?: string; serviceId?: string; status?: string }): Promise<Appointment[]>;
  
  // Bot flow methods
  getBotFlows(): Promise<BotFlow[]>;
  getBotFlow(id: string): Promise<BotFlow | undefined>;
  createBotFlow(flow: InsertBotFlow): Promise<BotFlow>;
  updateBotFlow(id: string, flow: Partial<InsertBotFlow>): Promise<BotFlow | undefined>;
  deleteBotFlow(id: string): Promise<void>;
  
  // Conversation methods
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationMessages(conversationId: string): Promise<BotMessage[]>;
  closeConversation(id: string): Promise<void>;
  
  // Bot analytics methods
  getBotAnalytics(): Promise<any>;
  getFlowAnalytics(flowId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private onboardings: Map<string, Onboarding>;
  private resources: Map<string, Resource>;
  private resourceBookings: Map<string, ResourceBooking>;
  private appointments: Map<string, Appointment>;
  private userSessions: Map<string, UserSession>;
  private botFlows: Map<string, BotFlow>;
  private conversations: Map<string, Conversation>;
  private botMessages: Map<string, BotMessage>;
  private botAnalytics: Map<string, BotAnalytics>;

  constructor() {
    this.users = new Map();
    this.onboardings = new Map();
    this.resources = new Map();
    this.resourceBookings = new Map();
    this.appointments = new Map();
    this.userSessions = new Map();
    this.botFlows = new Map();
    this.conversations = new Map();
    this.botMessages = new Map();
    this.botAnalytics = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id,
      name: null,
      email: null,
      phone: null,
      timezone: "America/New_York",
      avatar: null,
      emailVerified: "false",
      twoFactorEnabled: "false",
      twoFactorSecret: null,
      notificationPreferences: { email: true, sms: true, push: false },
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) {
      return undefined;
    }

    const updated: User = {
      ...user,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(userId, updated);
    return updated;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const updated: User = {
      ...user,
      password: newPassword,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(userId, updated);
    return true;
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return Array.from(this.userSessions.values()).filter(
      session => session.userId === userId
    );
  }

  async createUserSession(insertSession: InsertUserSession): Promise<UserSession> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const session: UserSession = {
      ...insertSession,
      id,
      deviceInfo: insertSession.deviceInfo || null,
      ipAddress: insertSession.ipAddress || null,
      location: insertSession.location || null,
      lastActive: now,
      createdAt: now,
    };
    this.userSessions.set(id, session);
    return session;
  }

  async deleteUserSession(sessionId: string): Promise<void> {
    this.userSessions.delete(sessionId);
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
    // Also delete user's sessions
    const userSessions = await this.getUserSessions(userId);
    userSessions.forEach(session => this.userSessions.delete(session.id));
  }

  async createOnboarding(insertOnboarding: InsertOnboarding): Promise<Onboarding> {
    const id = randomUUID();
    const onboarding: Onboarding = { ...insertOnboarding, id };
    this.onboardings.set(id, onboarding);
    return onboarding;
  }

  async getOnboarding(id: string): Promise<Onboarding | undefined> {
    return this.onboardings.get(id);
  }

  async getAllOnboardings(): Promise<Onboarding[]> {
    return Array.from(this.onboardings.values());
  }

  // ========== RESOURCE METHODS ==========

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const resource: Resource = {
      ...insertResource,
      id,
      status: insertResource.status || 'available',
      description: insertResource.description || null,
      capacity: insertResource.capacity || null,
      assignedUsers: insertResource.assignedUsers || null,
      availabilitySchedule: insertResource.availabilitySchedule || null,
      createdAt: now,
      updatedAt: now,
    };
    this.resources.set(id, resource);
    return resource;
  }

  async getResource(id: string): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getAllResources(filters?: { 
    type?: string; 
    status?: string; 
    search?: string 
  }): Promise<Resource[]> {
    let resources = Array.from(this.resources.values());

    if (filters?.type) {
      resources = resources.filter(r => r.type === filters.type);
    }

    if (filters?.status) {
      resources = resources.filter(r => r.status === filters.status);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      resources = resources.filter(r => 
        r.name.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower)
      );
    }

    return resources;
  }

  async updateResource(id: string, insertResource: InsertResource): Promise<Resource | undefined> {
    const existing = this.resources.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Resource = {
      ...existing,
      ...insertResource,
      id,
      updatedAt: new Date().toISOString(),
    };

    this.resources.set(id, updated);
    return updated;
  }

  async deleteResource(id: string): Promise<void> {
    this.resources.delete(id);
    // Also delete associated bookings
    const bookingsToDelete = Array.from(this.resourceBookings.entries())
      .filter(([, booking]) => booking.resourceId === id)
      .map(([bookingId]) => bookingId);
    
    bookingsToDelete.forEach(bookingId => this.resourceBookings.delete(bookingId));
  }

  // ========== RESOURCE BOOKING METHODS ==========

  async createResourceBooking(insertBooking: InsertResourceBooking): Promise<ResourceBooking> {
    const id = randomUUID();
    const booking: ResourceBooking = {
      ...insertBooking,
      id,
      status: insertBooking.status || 'confirmed',
      notes: insertBooking.notes || null,
      createdAt: new Date().toISOString(),
    };
    this.resourceBookings.set(id, booking);
    return booking;
  }

  async getResourceBookings(filters?: {
    resourceId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ResourceBooking[]> {
    let bookings = Array.from(this.resourceBookings.values());

    if (filters?.resourceId) {
      bookings = bookings.filter(b => b.resourceId === filters.resourceId);
    }

    if (filters?.startDate && filters?.endDate) {
      bookings = bookings.filter(b => {
        const bookingStart = new Date(b.startTime);
        const bookingEnd = new Date(b.endTime);
        const filterStart = new Date(filters.startDate!);
        const filterEnd = new Date(filters.endDate!);
        
        return (bookingStart >= filterStart && bookingStart <= filterEnd) ||
               (bookingEnd >= filterStart && bookingEnd <= filterEnd) ||
               (bookingStart <= filterStart && bookingEnd >= filterEnd);
      });
    }

    return bookings.filter(b => b.status !== 'cancelled');
  }

  async checkResourceAvailability(
    resourceId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const resource = await this.getResource(resourceId);
    if (!resource) {
      return false;
    }

    // Check if resource is under maintenance
    if (resource.status === 'under_maintenance') {
      return false;
    }

    // Check for overlapping bookings
    const bookings = await this.getResourceBookings({ resourceId });
    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);

    const hasConflict = bookings.some(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      return (
        (requestStart >= bookingStart && requestStart < bookingEnd) ||
        (requestEnd > bookingStart && requestEnd <= bookingEnd) ||
        (requestStart <= bookingStart && requestEnd >= bookingEnd)
      );
    });

    return !hasConflict;
  }

  async cancelResourceBooking(id: string): Promise<ResourceBooking | undefined> {
    const booking = this.resourceBookings.get(id);
    if (!booking) {
      return undefined;
    }

    const cancelled: ResourceBooking = {
      ...booking,
      status: 'cancelled',
    };

    this.resourceBookings.set(id, cancelled);
    return cancelled;
  }

  async getResourceStats(
    resourceId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const bookings = await this.getResourceBookings({
      resourceId,
      startDate,
      endDate,
    });

    const totalBookings = bookings.length;
    const totalHours = bookings.reduce((sum, booking) => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    // Calculate utilization percentage (assuming 8 hours per day)
    const daysInPeriod = startDate && endDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30; // Default to 30 days if no range provided

    const availableHours = daysInPeriod * 8; // 8 hours per day
    const utilizationPercentage = availableHours > 0
      ? (totalHours / availableHours) * 100
      : 0;

    return {
      resourceId,
      totalBookings,
      totalHours: Math.round(totalHours * 100) / 100,
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      period: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString(),
      },
    };
  }

  // ========== APPOINTMENTS (Simple in-memory) ==========

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const apt: Appointment = { id, ...insertAppointment };
    this.appointments.set(id, apt);
    return apt;
  }

  async getAppointments(filters?: { assignedMemberId?: string; serviceId?: string; status?: string; workspaceId?: string }): Promise<Appointment[]> {
    let list = Array.from(this.appointments.values());
    if (filters?.assignedMemberId) {
      list = list.filter(a => a.assignedMemberId === filters.assignedMemberId);
    }
    if (filters?.serviceId) {
      list = list.filter(a => a.serviceId === filters.serviceId);
    }
    if (filters?.status) {
      list = list.filter(a => a.status === (filters.status as any));
    }
    if (filters?.workspaceId && filters.workspaceId !== 'all') {
      list = list.filter(a => a.workspaceId === filters.workspaceId);
    }
    return list;
  }
  
  // ========== BOT FLOW METHODS ==========
  
  async getBotFlows(): Promise<BotFlow[]> {
    return Array.from(this.botFlows.values());
  }
  
  async getBotFlow(id: string): Promise<BotFlow | undefined> {
    return this.botFlows.get(id);
  }
  
  async createBotFlow(flow: InsertBotFlow): Promise<BotFlow> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const botFlow: BotFlow = {
      id,
      ...flow,
      createdAt: now,
      updatedAt: now,
    };
    this.botFlows.set(id, botFlow);
    return botFlow;
  }
  
  async updateBotFlow(id: string, flow: Partial<InsertBotFlow>): Promise<BotFlow | undefined> {
    const existing = this.botFlows.get(id);
    if (!existing) return undefined;
    
    const updated: BotFlow = {
      ...existing,
      ...flow,
      updatedAt: new Date().toISOString(),
    };
    this.botFlows.set(id, updated);
    return updated;
  }
  
  async deleteBotFlow(id: string): Promise<void> {
    this.botFlows.delete(id);
  }
  
  // ========== CONVERSATION METHODS ==========
  
  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }
  
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getConversationMessages(conversationId: string): Promise<BotMessage[]> {
    return Array.from(this.botMessages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async closeConversation(id: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.status = "closed";
      this.conversations.set(id, conversation);
    }
  }
  
  // ========== BOT ANALYTICS METHODS ==========
  
  async getBotAnalytics(): Promise<any> {
    const analytics = Array.from(this.botAnalytics.values());
    const conversations = Array.from(this.conversations.values());
    const messages = Array.from(this.botMessages.values());
    
    const totalConversations = conversations.length;
    const activeConversations = conversations.filter(c => c.status === 'active').length;
    const completedConversations = conversations.filter(c => c.status === 'closed').length;
    const totalMessages = messages.length;
    const inboundMessages = messages.filter(m => m.direction === 'inbound').length;
    const outboundMessages = messages.filter(m => m.direction === 'outbound').length;
    
    // Flow performance
    const flowStats = Array.from(this.botFlows.values()).map(flow => {
      const flowAnalytics = analytics.filter(a => a.flowId === flow.id);
      const started = flowAnalytics.filter(a => a.eventType === 'flow_started').length;
      const completed = flowAnalytics.filter(a => a.eventType === 'flow_completed').length;
      const completionRate = started > 0 ? ((completed / started) * 100).toFixed(1) : '0';
      
      return {
        flowId: flow.id,
        flowName: flow.name,
        started,
        completed,
        completionRate: `${completionRate}%`,
      };
    });
    
    return {
      totalConversations,
      activeConversations,
      completedConversations,
      totalMessages,
      inboundMessages,
      outboundMessages,
      flowStats,
      recentActivity: analytics.slice(-10).reverse(),
    };
  }
  
  async getFlowAnalytics(flowId: string): Promise<any> {
    const analytics = Array.from(this.botAnalytics.values()).filter(a => a.flowId === flowId);
    const flow = this.botFlows.get(flowId);
    
    if (!flow) {
      return null;
    }
    
    const started = analytics.filter(a => a.eventType === 'flow_started').length;
    const completed = analytics.filter(a => a.eventType === 'flow_completed').length;
    const dropped = analytics.filter(a => a.eventType === 'user_dropped').length;
    const completionRate = started > 0 ? ((completed / started) * 100).toFixed(1) : '0';
    
    // Node analytics
    const nodeReached = analytics.filter(a => a.eventType === 'node_reached');
    const nodeStats = nodeReached.reduce((acc: any, item) => {
      const nodeId = (item.eventData as any)?.nodeId;
      if (nodeId) {
        acc[nodeId] = (acc[nodeId] || 0) + 1;
      }
      return acc;
    }, {});
    
    return {
      flowId,
      flowName: flow.name,
      started,
      completed,
      dropped,
      completionRate: `${completionRate}%`,
      nodeStats,
      timeline: analytics.slice(-20).reverse(),
    };
  }
}

export const storage = new MemStorage();

// Lightweight appointment types (in-memory only)

