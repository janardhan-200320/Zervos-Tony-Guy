import { generateAccessToken, generateRefreshToken, rotateRefreshToken } from "../auth";
import { storage } from "../storage";
import { InputValidation } from "../validation";
import type { Express } from "express";

export function registerAuthRoutes(app: Express) {
  // POST /api/auth/login - Login with username and password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const usernameValidation = InputValidation.sanitizeUsername(username);
      if (!usernameValidation.isValid) {
        return res.status(400).json({ error: usernameValidation.error });
      }

      if (typeof password !== "string" || password.length === 0) {
        return res.status(400).json({ error: "Password must be a non-empty string" });
      }

      const user = await storage.getUserByUsername(usernameValidation.value);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const isPasswordValid = await storage.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const accessToken = generateAccessToken({ userId: user.id, username: user.username });
      const refreshToken = generateRefreshToken({ userId: user.id, username: user.username });

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

      const usernameValidation = InputValidation.sanitizeUsername(username);
      if (!usernameValidation.isValid) {
        return res.status(400).json({ error: usernameValidation.error });
      }

      const passwordValidation = InputValidation.sanitizePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      const existingUser = await storage.getUserByUsername(usernameValidation.value);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const user = await storage.createUser({
        username: usernameValidation.value,
        password,
      });

      const accessToken = generateAccessToken({ userId: user.id, username: user.username });
      const refreshToken = generateRefreshToken({ userId: user.id, username: user.username });

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
  app.post("/api/auth/logout", (_req, res) => {
    return res.json({ success: true, message: "Logged out successfully" });
  });
}
