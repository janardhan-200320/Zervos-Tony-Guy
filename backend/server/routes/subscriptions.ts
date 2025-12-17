import type { Express } from "express";
import { authMiddleware } from "../auth";

export function registerSubscriptionRoutes(app: Express) {
  // POST /api/subscriptions/purchase - Purchase a subscription plan
  app.post("/api/subscriptions/purchase", authMiddleware, async (req, res) => {
    try {
      const { planId, billingCycle, paymentMethod, amount, email, phone, gstNumber, companyName, paymentDetails } = req.body;

      if (!planId || !billingCycle || !paymentMethod || !amount) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "planId, billingCycle, paymentMethod, and amount are required",
        });
      }

      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;

      const startDate = new Date();
      const endDate = new Date();
      if (billingCycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

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
        status: "active",
        paymentDetails,
        createdAt: new Date().toISOString(),
      };

      // await storage.createSubscription(subscription);

      console.log("Subscription created:", subscription);

      return res.json({ success: true, transactionId, subscription, message: "Payment processed successfully" });
    } catch (error) {
      console.error("Error processing subscription:", error);
      return res.status(500).json({ error: "Failed to process subscription", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // GET /api/subscriptions/current - Get current subscription
  app.get("/api/subscriptions/current", authMiddleware, async (_req, res) => {
    try {
      return res.json({ subscription: null, message: "No active subscription found" });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // GET /api/subscriptions/features - Check if user has access to specific features
  app.get("/api/subscriptions/features", authMiddleware, async (req, res) => {
    try {
      const { planId } = req.query;
      if (!planId) return res.status(400).json({ error: "planId is required" });

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
      } as const;

      const features = featureAccess[planId as keyof typeof featureAccess] || featureAccess.classic;
      return res.json({ planId, features, hasAccess: true });
    } catch (error) {
      console.error("Error checking features:", error);
      return res.status(500).json({ error: "Failed to check features" });
    }
  });

  // POST /api/subscriptions/cancel - Cancel subscription
  app.post("/api/subscriptions/cancel", authMiddleware, async (req, res) => {
    try {
      const { subscriptionId, reason } = req.body;
      if (!subscriptionId) return res.status(400).json({ error: "subscriptionId is required" });

      console.log(`Subscription ${subscriptionId} cancelled. Reason: ${reason}`);
      return res.json({ success: true, message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });
}
