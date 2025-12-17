import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerAppointmentRoutes } from "./routes/appointments";
import { registerAuthRoutes } from "./routes/auth";
import { registerOnboardingRoutes } from "./routes/onboarding";
import { registerPaymentRoutes } from "./routes/payments";
import { registerResourceRoutes } from "./routes/resources";
import { registerSubscriptionRoutes } from "./routes/subscriptions";
import { registerUserRoutes } from "./routes/user";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerOnboardingRoutes(app);
  registerResourceRoutes(app);
  registerAppointmentRoutes(app);
  registerPaymentRoutes(app);
  registerAnalyticsRoutes(app);
  registerSubscriptionRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
