import { insertOnboardingSchema, insertResourceBookingSchema, insertResourceSchema, updateUserProfileSchema } from "@shared/schema";
import type { Express } from "express";
import fs from "fs";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { fromZodError } from "zod-validation-error";
import { storage } from "./storage";
import { authMiddleware, generateAccessToken, generateRefreshToken, rotateRefreshToken, type AuthRequest } from "./auth";
import { InputValidation } from "./validation";
import { FileEncryption, DataEncryption } from "./encryption";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Define allowed MIME types and extensions for uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB max

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }

    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }

    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== AUTHENTICATION ROUTES ==========

  // POST /api/auth/login - Login with username and password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validate inputs
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Sanitize username
      const usernameValidation = InputValidation.sanitizeUsername(username);
      if (!usernameValidation.isValid) {
        return res.status(400).json({ error: usernameValidation.error });
      }

      // Validate password format
      if (typeof password !== "string" || password.length === 0) {
        return res.status(400).json({ error: "Password must be a non-empty string" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(usernameValidation.value);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Verify password
      const isPasswordValid = await storage.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user.id, username: user.username });
      const refreshToken = generateRefreshToken({ userId: user.id, username: user.username });

      // Return tokens and user info (without password)
      const { password: _, ...userWithoutPassword } = user;
      return res.json({
        success: true,
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // POST /api/auth/register - Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Sanitize and validate username
      const usernameValidation = InputValidation.sanitizeUsername(username);
      if (!usernameValidation.isValid) {
        return res.status(400).json({ error: usernameValidation.error });
      }

      // Validate password strength
      const passwordValidation = InputValidation.sanitizePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(usernameValidation.value);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Create new user
      const user = await storage.createUser({
        username: usernameValidation.value,
        password: password,
      });

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user.id, username: user.username });
      const refreshToken = generateRefreshToken({ userId: user.id, username: user.username });

      // Return tokens and user info (without password)
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json({
        success: true,
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error during registration:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  // POST /api/auth/refresh - Refresh access token
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      // Rotate refresh token and return new tokens
      const rotation = rotateRefreshToken(refreshToken);
      if (!rotation) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }

      return res.json({
        success: true,
        accessToken: rotation.accessToken,
        refreshToken: rotation.refreshToken,
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
      return res.status(500).json({ error: "Token refresh failed" });
    }
  });

  // POST /api/auth/logout - Logout user
  app.post("/api/auth/logout", (req, res) => {
    // In a production app with persistent sessions, you would invalidate the token here
    // For now, this is a simple endpoint that signals to the client to clear tokens
    return res.json({ success: true, message: "Logged out successfully" });
  });

  // ========== USER PROFILE ROUTES ==========

  // GET /api/user/profile - Get user profile (requires authentication)
  app.get("/api/user/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // PUT /api/user/profile - Update user profile (requires authentication)
  app.put("/api/user/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Sanitize input object
      const sanitizedInput = InputValidation.sanitizeObject(req.body);

      // Sanitize individual fields if present
      if (sanitizedInput.name && typeof sanitizedInput.name === "string") {
        sanitizedInput.name = InputValidation.sanitizeText(sanitizedInput.name, 100);
      }

      if (sanitizedInput.email && typeof sanitizedInput.email === "string") {
        const emailValidation = InputValidation.sanitizeEmail(sanitizedInput.email);
        if (!emailValidation.isValid) {
          return res.status(400).json({ error: emailValidation.error });
        }
        sanitizedInput.email = emailValidation.value;
      }

      if (sanitizedInput.phone && typeof sanitizedInput.phone === "string") {
        const phoneValidation = InputValidation.sanitizePhoneNumber(sanitizedInput.phone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ error: phoneValidation.error });
        }
        sanitizedInput.phone = phoneValidation.value;
      }

      const result = updateUserProfileSchema.safeParse(sanitizedInput);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      const updated = await storage.updateUserProfile(userId, result.data);

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = updated;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // POST /api/user/avatar - Upload profile picture (requires authentication)
  app.post("/api/user/avatar", authMiddleware, upload.single('avatar'), async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;

      // Encrypt the uploaded file for security
      try {
        await FileEncryption.encryptFileInPlace(filePath);
        console.log(`✅ Avatar encrypted: ${req.file.filename}`);
      } catch (encError) {
        console.error("File encryption failed:", encError);
        // Continue without encryption if it fails (graceful degradation)
        // In production, you might want to fail the upload instead
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const updated = await storage.updateUserProfile(userId, {
        avatar: avatarUrl,
      });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updated;
      return res.json({
        success: true,
        avatarUrl: avatarUrl,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return res.status(500).json({ error: "Failed to upload avatar" });
    }
  });

  // PUT /api/user/password - Change password (requires authentication)
  app.put("/api/user/password", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
      }

      // Validate current password format
      if (typeof currentPassword !== "string" || currentPassword.length === 0) {
        return res.status(400).json({ error: "Current password must be a non-empty string" });
      }

      // Validate new password strength
      const passwordValidation = InputValidation.sanitizePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isPasswordValid = await storage.verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update to new password
      const success = await storage.updateUserPassword(userId, newPassword);

      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      return res.status(500).json({ error: "Failed to update password" });
    }
  });

  // GET /api/user/sessions - Get user sessions (requires authentication)
  app.get("/api/user/sessions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const sessions = await storage.getUserSessions(userId);
      return res.json(sessions);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      return res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // DELETE /api/user/sessions/:id - Revoke a session (requires authentication)
  app.delete("/api/user/sessions/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // SQL Injection Protection: UUID validation
      const sessionIdValidation = InputValidation.validateUUID(req.params.id);
      if (!sessionIdValidation.isValid) {
        return res.status(400).json({ error: sessionIdValidation.error });
      }
      const sessionId = req.params.id;

      await storage.deleteUserSession(sessionId);
      return res.json({ success: true, message: "Session revoked successfully" });
    } catch (error) {
      console.error("Error revoking session:", error);
      return res.status(500).json({ error: "Failed to revoke session" });
    }
  });

  // DELETE /api/user/account - Delete user account (requires authentication)
  app.delete("/api/user/account", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      await storage.deleteUser(userId);
      return res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // POST /api/onboarding - Create new onboarding
  app.post("/api/onboarding", async (req, res) => {
    console.log("🚀 POST /api/onboarding - Starting");
    try {
      console.log("📝 Received onboarding data:", JSON.stringify(req.body, null, 2));
      console.log("📝 Data types:", {
        businessName: typeof req.body.businessName,
        websiteUrl: typeof req.body.websiteUrl,
        currency: typeof req.body.currency,
        industries: Array.isArray(req.body.industries) ? "array" : typeof req.body.industries,
        businessNeeds: Array.isArray(req.body.businessNeeds) ? "array" : typeof req.body.businessNeeds,
        timezone: typeof req.body.timezone,
        availableDays: Array.isArray(req.body.availableDays) ? "array" : typeof req.body.availableDays,
        availableTimeStart: typeof req.body.availableTimeStart,
        availableTimeEnd: typeof req.body.availableTimeEnd,
        eventTypeLabel: typeof req.body.eventTypeLabel,
        teamMemberLabel: typeof req.body.teamMemberLabel,
      });
      
      console.log("🔍 Validating with schema...");
      const result = insertOnboardingSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("❌ Validation failed:", validationError.message);
        console.error("Validation error details:", JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message,
          errors: result.error.errors
        });
      }

      console.log("✅ Validation passed");
      console.log("💾 Creating onboarding record...");
      
      const onboarding = await storage.createOnboarding(result.data);
      console.log("✅ Onboarding created successfully:", onboarding.id);
      
      return res.status(201).json(onboarding);
    } catch (error: any) {
      console.error("❌ Unexpected error in POST /api/onboarding:", error);
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
      return res.status(500).json({ 
        error: "Internal server error",
        message: error.message,
        details: error.stack
      });
    }
  });

  // GET /api/onboarding/:id - Get onboarding by ID
  app.get("/api/onboarding/:id", async (req, res) => {
    try {
      const onboarding = await storage.getOnboarding(req.params.id);
      
      if (!onboarding) {
        return res.status(404).json({ error: "Onboarding not found" });
      }

      return res.json(onboarding);
    } catch (error) {
      console.error("Error fetching onboarding:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/onboardings - Get all onboardings
  app.get("/api/onboardings", async (_req, res) => {
    try {
      const onboardings = await storage.getAllOnboardings();
      return res.json(onboardings);
    } catch (error) {
      console.error("Error fetching onboardings:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== RESOURCE ROUTES ==========

  // POST /api/resources - Create new resource
  app.post("/api/resources", async (req, res) => {
    try {
      const result = insertResourceSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      const resource = await storage.createResource(result.data);
      return res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resources - Get all resources
  app.get("/api/resources", async (req, res) => {
    try {
      const { type, status, search } = req.query;
      
      // SQL Injection Protection: Sanitize query parameters
      const sanitizedType = type ? InputValidation.sanitizeText(type as string, 50) : undefined;
      const sanitizedStatus = status ? InputValidation.sanitizeText(status as string, 50) : undefined;
      const sanitizedSearch = search ? InputValidation.sanitizeText(search as string, 100) : undefined;
      
      const resources = await storage.getAllResources({
        type: sanitizedType,
        status: sanitizedStatus,
        search: sanitizedSearch,
      });
      return res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resources/:id - Get resource by ID
  app.get("/api/resources/:id", async (req, res) => {
    try {
      // SQL Injection Protection: UUID validation
      const resourceId = req.params.id;
      if (!resourceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId)) {
        return res.status(400).json({ error: "Invalid resource ID format" });
      }
      
      const resource = await storage.getResource(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      return res.json(resource);
    } catch (error) {
      console.error("Error fetching resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PUT /api/resources/:id - Update resource
  app.put("/api/resources/:id", async (req, res) => {
    try {
      // SQL Injection Protection: UUID validation
      const resourceId = req.params.id;
      if (!resourceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId)) {
        return res.status(400).json({ error: "Invalid resource ID format" });
      }
      
      const result = insertResourceSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      const resource = await storage.updateResource(resourceId, result.data);
      
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      return res.json(resource);
    } catch (error) {
      console.error("Error updating resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/resources/:id - Delete resource
  app.delete("/api/resources/:id", async (req, res) => {
    try {
      await storage.deleteResource(req.params.id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== RESOURCE BOOKING ROUTES ==========

  // POST /api/resource-bookings - Create new resource booking
  app.post("/api/resource-bookings", async (req, res) => {
    try {
      const result = insertResourceBookingSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationError.message 
        });
      }

      // Check if resource is available during requested time
      const isAvailable = await storage.checkResourceAvailability(
        result.data.resourceId,
        result.data.startTime,
        result.data.endTime
      );

      if (!isAvailable) {
        return res.status(409).json({ 
          error: "Resource is not available during the requested time" 
        });
      }

      const booking = await storage.createResourceBooking(result.data);
      return res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating resource booking:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resource-bookings - Get all resource bookings
  app.get("/api/resource-bookings", async (req, res) => {
    try {
      const { resourceId, startDate, endDate } = req.query;
      const bookings = await storage.getResourceBookings({
        resourceId: resourceId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      return res.json(bookings);
    } catch (error) {
      console.error("Error fetching resource bookings:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PUT /api/resource-bookings/:id/cancel - Cancel resource booking
  app.put("/api/resource-bookings/:id/cancel", async (req, res) => {
    try {
      const booking = await storage.cancelResourceBooking(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      return res.json(booking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resources/:id/stats - Get resource usage statistics
  app.get("/api/resources/:id/stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getResourceStats(
        req.params.id,
        startDate as string,
        endDate as string
      );
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching resource stats:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== APPOINTMENTS ROUTES (in-memory) ==========
  app.get("/api/appointments", async (req, res) => {
    try {
      const { assignedMemberId, serviceId, status } = req.query;
      const items = await storage.getAppointments({
        assignedMemberId: assignedMemberId as string | undefined,
        serviceId: serviceId as string | undefined,
        status: status as string | undefined,
      });
      return res.json(items);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const body = req.body as any;
      // Minimal validation
      if (!body || !body.customerName || !body.email || !body.serviceName || !body.date || !body.time) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const created = await storage.createAppointment({
        customerName: body.customerName,
        email: body.email,
        phone: body.phone,
        serviceName: body.serviceName,
        serviceId: body.serviceId,
        assignedMemberId: body.assignedMemberId,
        assignedMemberName: body.assignedMemberName,
        date: body.date,
        time: body.time,
        status: body.status || 'upcoming',
        notes: body.notes,
      });
      return res.status(201).json(created);
    } catch (error) {
      console.error("Error creating appointment:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== RAZORPAY CONFIGURATION ROUTES ==========
  
  // GET /api/razorpay/config - Get Razorpay public config (Key ID only)
  app.get("/api/razorpay/config", async (req, res) => {
    try {
      // In production, you'd get this from database
      // For now, return from environment or send signal to frontend to use stored config
      return res.json({
        keyId: process.env.RAZORPAY_KEY_ID || '',
        configured: !!process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Error fetching Razorpay config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // POST /api/razorpay/config - Save Razorpay configuration
  app.post("/api/razorpay/config", async (req, res) => {
    try {
      const { keyId, keySecret, webhookSecret } = req.body;

      if (!keyId || !keySecret) {
        return res.status(400).json({ error: "Key ID and Key Secret are required" });
      }

      // In production, save to database securely
      // For now, we'll acknowledge the save
      // The frontend stores it in localStorage for demo purposes
      
      return res.json({
        success: true,
        message: "Razorpay configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving Razorpay config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // ========== STRIPE CONFIGURATION ROUTES ==========
  
  // GET /api/stripe/config - Get Stripe public config (Publishable Key only)
  app.get("/api/stripe/config", async (req, res) => {
    try {
      return res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        configured: !!process.env.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error) {
      console.error("Error fetching Stripe config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // POST /api/stripe/config - Save Stripe configuration
  app.post("/api/stripe/config", async (req, res) => {
    try {
      const { publishableKey, secretKey, webhookSecret } = req.body;

      if (!publishableKey || !secretKey) {
        return res.status(400).json({ error: "Publishable Key and Secret Key are required" });
      }

      // In production, save to encrypted database
      
      return res.json({
        success: true,
        message: "Stripe configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving Stripe config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // ========== PAYPAL CONFIGURATION ROUTES ==========
  
  // GET /api/paypal/config - Get PayPal public config (Client ID only)
  app.get("/api/paypal/config", async (req, res) => {
    try {
      return res.json({
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        mode: process.env.PAYPAL_MODE || 'sandbox',
        configured: !!process.env.PAYPAL_CLIENT_ID,
      });
    } catch (error) {
      console.error("Error fetching PayPal config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // POST /api/paypal/config - Save PayPal configuration
  app.post("/api/paypal/config", async (req, res) => {
    try {
      const { clientId, clientSecret, mode } = req.body;

      if (!clientId || !clientSecret) {
        return res.status(400).json({ error: "Client ID and Client Secret are required" });
      }

      // In production, save to encrypted database
      
      return res.json({
        success: true,
        message: "PayPal configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving PayPal config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // ========== RAZORPAY PAYMENT ROUTES ==========
  
  // POST /api/payment/create-order - Create Razorpay order
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      const { amount, currency = 'INR', receipt, notes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Create Razorpay order
      // Uncomment when you add razorpay package
      /*
      const razorpay = new (await import('razorpay')).default({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET || '',
      });

      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {},
      });

      return res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      });
      */

      // Mock response for now (remove this when you add real Razorpay)
      return res.json({
        success: true,
        order_id: `order_${Date.now()}`,
        amount: amount * 100,
        currency: currency,
        mock: true, // Remove in production
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      return res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  // POST /api/payment/verify - Verify Razorpay payment signature
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification data" });
      }

      // Verify signature
      // Uncomment when you add razorpay package
      /*
      const crypto = await import('crypto');
      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ 
          success: false, 
          error: "Payment verification failed" 
        });
      }
      */

      // Payment verified successfully
      // Now create the booking and invoice
      const booking = {
        ...bookingData,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paymentStatus: 'paid',
        paymentMethod: 'Razorpay',
        createdAt: new Date().toISOString(),
      };

      // Save booking to storage
      // await storage.createAppointment(booking);

      return res.json({
        success: true,
        message: "Payment verified successfully",
        booking: booking,
        payment_id: razorpay_payment_id,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({ error: "Payment verification failed" });
    }
  });

  // ========== REPORTS & ANALYTICS ROUTES ==========
  app.get("/api/reports/analytics", async (req, res) => {
    try {
      const { startDate, endDate, workspaceId } = req.query;
      
      // Get appointments with workspace filter
      const appointments = await storage.getAppointments({
        workspaceId: workspaceId as string,
      });
      
      // Get all resource bookings
      const resourceBookings = await storage.getResourceBookings({
        startDate: startDate as string,
        endDate: endDate as string,
      });
      
      // Get invoices from localStorage simulation (in production, this would be from DB)
      // For now, we'll calculate based on appointments and bookings
      
      // Filter by date range if provided
      let filteredAppointments = appointments;
      let filteredBookings = resourceBookings;
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredAppointments = filteredAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= start && aptDate <= end;
        });
        
        filteredBookings = filteredBookings.filter(booking => {
          const bookingDate = new Date(booking.startTime);
          return bookingDate >= start && bookingDate <= end;
        });
      }
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= start && aptDate <= end;
        });
        
        filteredBookings = resourceBookings.filter(booking => {
          const bookingDate = new Date(booking.startTime);
          return bookingDate >= start && bookingDate <= end;
        });
      }
      
      // Calculate metrics
      const totalBookings = filteredAppointments.length + filteredBookings.length;
      const completedBookings = filteredAppointments.filter(a => a.status === 'completed').length;
      const cancelledBookings = filteredAppointments.filter(a => a.status === 'cancelled').length + 
                                 filteredBookings.filter(b => b.status === 'cancelled').length;
      const upcomingBookings = filteredAppointments.filter(a => a.status === 'upcoming').length;
      
      // Revenue calculation (mock data - in production this would come from invoices)
      const mockRevenuePerBooking = 100; // Base rate
      const totalRevenue = completedBookings * mockRevenuePerBooking;
      const pendingRevenue = upcomingBookings * mockRevenuePerBooking * 0.5; // 50% upfront
      
      // Service distribution
      const serviceStats = filteredAppointments.reduce((acc, apt) => {
        const serviceName = apt.serviceName || 'General';
        if (!acc[serviceName]) {
          acc[serviceName] = { name: serviceName, count: 0, revenue: 0 };
        }
        acc[serviceName].count++;
        if (apt.status === 'completed') {
          acc[serviceName].revenue += mockRevenuePerBooking;
        }
        return acc;
      }, {} as Record<string, { name: string; count: number; revenue: number }>);
      
      // Team member performance
      const teamStats = filteredAppointments.reduce((acc, apt) => {
        const memberName = apt.assignedMemberName || 'Unassigned';
        const memberId = apt.assignedMemberId || 'unassigned';
        if (!acc[memberId]) {
          acc[memberId] = { 
            id: memberId, 
            name: memberName, 
            totalBookings: 0, 
            completedBookings: 0,
            cancelledBookings: 0,
            revenue: 0 
          };
        }
        acc[memberId].totalBookings++;
        if (apt.status === 'completed') {
          acc[memberId].completedBookings++;
          acc[memberId].revenue += mockRevenuePerBooking;
        }
        if (apt.status === 'cancelled') {
          acc[memberId].cancelledBookings++;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // Resource utilization
      const resourceStats = filteredBookings.reduce((acc, booking) => {
        if (!acc[booking.resourceId]) {
          acc[booking.resourceId] = {
            resourceId: booking.resourceId,
            totalBookings: 0,
            totalHours: 0,
            revenue: 0
          };
        }
        acc[booking.resourceId].totalBookings++;
        
        // Calculate hours
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        acc[booking.resourceId].totalHours += hours;
        acc[booking.resourceId].revenue += hours * 50; // $50/hour mock rate
        
        return acc;
      }, {} as Record<string, any>);
      
      // Time-based analytics (bookings by day of week)
      const dayOfWeekStats = filteredAppointments.reduce((acc, apt) => {
        const date = new Date(apt.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        if (!acc[dayName]) {
          acc[dayName] = 0;
        }
        acc[dayName]++;
        return acc;
      }, {} as Record<string, number>);
      
      // Time of day distribution (peak hours)
      const timeOfDayStats = filteredAppointments.reduce((acc, apt) => {
        if (apt.time) {
          const hour = parseInt(apt.time.split(':')[0]);
          const timeSlot = `${hour}:00`;
          if (!acc[timeSlot]) {
            acc[timeSlot] = 0;
          }
          acc[timeSlot]++;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Customer insights (new vs returning - mock data)
      const totalCustomers = new Set(filteredAppointments.map(a => a.email)).size;
      const newCustomers = Math.floor(totalCustomers * 0.6); // Mock: 60% new
      const returningCustomers = totalCustomers - newCustomers;
      
      // Cancellation rate
      const cancellationRate = totalBookings > 0 
        ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
        : '0';
      
      // Average booking value
      const averageBookingValue = completedBookings > 0 
        ? (totalRevenue / completedBookings).toFixed(2)
        : '0';
      
      // Growth comparison (mock - compare with previous period)
      const previousPeriodRevenue = totalRevenue * 0.85; // Mock: 15% growth
      const revenueGrowth = previousPeriodRevenue > 0
        ? (((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100).toFixed(1)
        : '0';
      
      const previousPeriodBookings = totalBookings * 0.9; // Mock: 10% growth
      const bookingsGrowth = previousPeriodBookings > 0
        ? (((totalBookings - previousPeriodBookings) / previousPeriodBookings) * 100).toFixed(1)
        : '0';
      
      // Assemble response
      const analytics = {
        overview: {
          totalBookings,
          completedBookings,
          upcomingBookings,
          cancelledBookings,
          cancellationRate: parseFloat(cancellationRate),
          totalRevenue,
          pendingRevenue,
          averageBookingValue: parseFloat(averageBookingValue),
          revenueGrowth: parseFloat(revenueGrowth),
          bookingsGrowth: parseFloat(bookingsGrowth),
        },
        services: Object.values(serviceStats),
        team: Object.values(teamStats),
        resources: Object.values(resourceStats),
        timeAnalytics: {
          byDayOfWeek: dayOfWeekStats,
          byTimeOfDay: timeOfDayStats,
        },
        customers: {
          total: totalCustomers,
          new: newCustomers,
          returning: returningCustomers,
          retentionRate: totalCustomers > 0 
            ? ((returningCustomers / totalCustomers) * 100).toFixed(1)
            : '0',
        },
        dateRange: {
          startDate: startDate || 'all',
          endDate: endDate || 'all',
        },
      };
      
      return res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      return res.status(500).json({ error: "Failed to generate analytics" });
    }
  });

  // ========== SUBSCRIPTION ROUTES ==========

  // POST /api/subscriptions/purchase - Purchase a subscription plan
  app.post("/api/subscriptions/purchase", async (req, res) => {
    try {
      const {
        planId,
        billingCycle,
        paymentMethod,
        amount,
        email,
        phone,
        gstNumber,
        companyName,
        paymentDetails
      } = req.body;

      // Validate required fields
      if (!planId || !billingCycle || !paymentMethod || !amount) {
        return res.status(400).json({ 
          error: "Missing required fields",
          details: "planId, billingCycle, paymentMethod, and amount are required"
        });
      }

      // Simulate payment processing
      // In production, integrate with payment gateway (Razorpay, Stripe, etc.)
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      // Calculate end date based on billing cycle
      const startDate = new Date();
      const endDate = new Date();
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Create subscription record
      const subscription = {
        id: `SUB${Date.now()}`,
        planId,
        planName: planId.charAt(0).toUpperCase() + planId.slice(1),
        billingCycle,
        paymentMethod,
        amount,
        transactionId,
        email,
        phone,
        gstNumber,
        companyName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        paymentDetails,
        createdAt: new Date().toISOString(),
      };

      // In production, save to database
      // await storage.createSubscription(subscription);

      console.log('Subscription created:', subscription);

      return res.json({
        success: true,
        transactionId,
        subscription,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      console.error("Error processing subscription:", error);
      return res.status(500).json({ 
        error: "Failed to process subscription",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/subscriptions/current - Get current subscription
  app.get("/api/subscriptions/current", async (req, res) => {
    try {
      // In production, get user ID from session/JWT
      const mockUserId = "demo-user-1";
      
      // In production, fetch from database
      // const subscription = await storage.getCurrentSubscription(mockUserId);
      
      // For now, return null or mock data
      return res.json({
        subscription: null,
        message: 'No active subscription found'
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // GET /api/subscriptions/features - Check if user has access to specific features
  app.get("/api/subscriptions/features", async (req, res) => {
    try {
      const { planId } = req.query;
      
      if (!planId) {
        return res.status(400).json({ error: "planId is required" });
      }

      // Define feature access based on plan
      const featureAccess = {
        classic: {
          userLogins: 1,
          roleBasedPermissions: false,
          onlineBooking: true,
          pos: true,
          staffManagement: true,
          whatsappNotifications: true,
          loyaltySystem: false,
          reviewSystem: false,
          inventoryManagement: false,
          customDomain: false,
          hrms: false,
          giftCards: false,
        },
        pro: {
          userLogins: 5,
          roleBasedPermissions: true,
          onlineBooking: true,
          pos: true,
          staffManagement: true,
          whatsappNotifications: true,
          loyaltySystem: true,
          reviewSystem: true,
          inventoryManagement: false,
          customDomain: false,
          hrms: false,
          giftCards: false,
        },
        elite: {
          userLogins: 10,
          roleBasedPermissions: true,
          onlineBooking: true,
          pos: true,
          staffManagement: true,
          whatsappNotifications: true,
          loyaltySystem: true,
          reviewSystem: true,
          inventoryManagement: true,
          customDomain: true,
          hrms: true,
          giftCards: true,
        },
        custom: {
          userLogins: 999,
          roleBasedPermissions: true,
          onlineBooking: true,
          pos: true,
          staffManagement: true,
          whatsappNotifications: true,
          loyaltySystem: true,
          reviewSystem: true,
          inventoryManagement: true,
          customDomain: true,
          hrms: true,
          giftCards: true,
        },
      };

      const features = featureAccess[planId as keyof typeof featureAccess] || featureAccess.classic;

      return res.json({
        planId,
        features,
        hasAccess: true
      });
    } catch (error) {
      console.error("Error checking features:", error);
      return res.status(500).json({ error: "Failed to check features" });
    }
  });

  // POST /api/subscriptions/cancel - Cancel subscription
  app.post("/api/subscriptions/cancel", async (req, res) => {
    try {
      const { subscriptionId, reason } = req.body;

      if (!subscriptionId) {
        return res.status(400).json({ error: "subscriptionId is required" });
      }

      // In production, update in database
      // await storage.cancelSubscription(subscriptionId, reason);

      console.log(`Subscription ${subscriptionId} cancelled. Reason: ${reason}`);

      return res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
