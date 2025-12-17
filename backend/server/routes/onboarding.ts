import { insertOnboardingSchema } from "@shared/schema";
import type { Express } from "express";
import { fromZodError } from "zod-validation-error";
import { storage } from "../storage";

export function registerOnboardingRoutes(app: Express) {
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
          errors: result.error.errors,
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
        details: error.stack,
      });
    }
  });

  // GET /api/onboarding/:id - Get onboarding by ID
  app.get("/api/onboarding/:id", async (req, res) => {
    try {
      const onboarding = await storage.getOnboarding(req.params.id);
      if (!onboarding) return res.status(404).json({ error: "Onboarding not found" });
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
}
