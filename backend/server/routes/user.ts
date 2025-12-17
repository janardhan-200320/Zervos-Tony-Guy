import fs from "fs";
import multer from "multer";
import path from "path";
import { fromZodError } from "zod-validation-error";
import type { Express } from "express";
import { authMiddleware, type AuthRequest } from "../auth";
import { FileEncryption } from "../encryption";
import { storage } from "../storage";
import { InputValidation } from "../validation";
import { updateUserProfileSchema } from "@shared/schema";

const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const storageMulter = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storageMulter,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`));
    }
    cb(null, true);
  },
});

export function registerUserRoutes(app: Express) {
  // GET /api/user/profile
  app.get("/api/user/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "User not authenticated" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // PUT /api/user/profile
  app.put("/api/user/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "User not authenticated" });

      const sanitizedInput = InputValidation.sanitizeObject(req.body);

      if (sanitizedInput.name && typeof sanitizedInput.name === "string") {
        sanitizedInput.name = InputValidation.sanitizeText(sanitizedInput.name, 100);
      }

      if (sanitizedInput.email && typeof sanitizedInput.email === "string") {
        const emailValidation = InputValidation.sanitizeEmail(sanitizedInput.email);
        if (!emailValidation.isValid) return res.status(400).json({ error: emailValidation.error });
        sanitizedInput.email = emailValidation.value;
      }

      if (sanitizedInput.phone && typeof sanitizedInput.phone === "string") {
        const phoneValidation = InputValidation.sanitizePhoneNumber(sanitizedInput.phone);
        if (!phoneValidation.isValid) return res.status(400).json({ error: phoneValidation.error });
        sanitizedInput.phone = phoneValidation.value;
      }

      const result = updateUserProfileSchema.safeParse(sanitizedInput);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: "Validation failed", details: validationError.message });
      }

      const updated = await storage.updateUserProfile(userId, result.data);
      if (!updated) return res.status(404).json({ error: "User not found" });

      const { password: _, ...userWithoutPassword } = updated;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // POST /api/user/avatar
  app.post("/api/user/avatar", authMiddleware, upload.single("avatar"), async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "User not authenticated" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const filePath = req.file.path;
      try {
        await FileEncryption.encryptFileInPlace(filePath);
        console.log(`✅ Avatar encrypted: ${req.file.filename}`);
      } catch (encError) {
        console.error("File encryption failed:", encError);
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updated = await storage.updateUserProfile(userId, { avatar: avatarUrl });
      if (!updated) return res.status(404).json({ error: "User not found" });

      const { password: _, ...userWithoutPassword } = updated;
      return res.json({ success: true, avatarUrl, user: userWithoutPassword });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return res.status(500).json({ error: "Failed to upload avatar" });
    }
  });

  // PUT /api/user/password
  app.put("/api/user/password", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "User not authenticated" });

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
      }
      if (typeof currentPassword !== "string" || currentPassword.length === 0) {
        return res.status(400).json({ error: "Current password must be a non-empty string" });
      }

      const passwordValidation = InputValidation.sanitizePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isPasswordValid = await storage.verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: "Current password is incorrect" });

      const success = await storage.updateUserPassword(userId, newPassword);
      if (!success) return res.status(404).json({ error: "User not found" });

      return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      return res.status(500).json({ error: "Failed to update password" });
    }
  });

  // GET /api/user/sessions
  app.get("/api/user/sessions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "User not authenticated" });

      const sessions = await storage.getUserSessions(userId);
      return res.json(sessions);
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      return res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // DELETE /api/user/sessions/:id
  app.delete("/api/user/sessions/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "User not authenticated" });

      const sessionIdValidation = InputValidation.validateUUID(req.params.id);
      if (!sessionIdValidation.isValid) {
        return res.status(400).json({ error: sessionIdValidation.error });
      }

      await storage.deleteUserSession(req.params.id);
      return res.json({ success: true, message: "Session revoked successfully" });
    } catch (error) {
      console.error("Error revoking session:", error);
      return res.status(500).json({ error: "Failed to revoke session" });
    }
  });

  // DELETE /api/user/account
  app.delete("/api/user/account", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "User not authenticated" });

      await storage.deleteUser(userId);
      return res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  });
}
