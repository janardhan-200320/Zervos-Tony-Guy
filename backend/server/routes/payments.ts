import type { Express } from "express";
import { authMiddleware } from "../auth";
// import crypto from "crypto"; // uncomment when implementing real verification

export function registerPaymentRoutes(app: Express) {
  // RAZORPAY CONFIG
  app.get("/api/razorpay/config", authMiddleware, async (_req, res) => {
    try {
      return res.json({
        keyId: process.env.RAZORPAY_KEY_ID || "",
        configured: !!process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Error fetching Razorpay config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/razorpay/config", authMiddleware, async (req, res) => {
    try {
      const { keyId, keySecret } = req.body;
      if (!keyId || !keySecret) {
        return res.status(400).json({ error: "Key ID and Key Secret are required" });
      }
      return res.json({ success: true, message: "Razorpay configuration saved successfully" });
    } catch (error) {
      console.error("Error saving Razorpay config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // STRIPE CONFIG
  app.get("/api/stripe/config", authMiddleware, async (_req, res) => {
    try {
      return res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
        configured: !!process.env.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error) {
      console.error("Error fetching Stripe config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/stripe/config", authMiddleware, async (req, res) => {
    try {
      const { publishableKey, secretKey } = req.body;
      if (!publishableKey || !secretKey) {
        return res.status(400).json({ error: "Publishable Key and Secret Key are required" });
      }
      return res.json({ success: true, message: "Stripe configuration saved successfully" });
    } catch (error) {
      console.error("Error saving Stripe config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // PAYPAL CONFIG
  app.get("/api/paypal/config", authMiddleware, async (_req, res) => {
    try {
      return res.json({
        clientId: process.env.PAYPAL_CLIENT_ID || "",
        mode: process.env.PAYPAL_MODE || "sandbox",
        configured: !!process.env.PAYPAL_CLIENT_ID,
      });
    } catch (error) {
      console.error("Error fetching PayPal config:", error);
      return res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/paypal/config", authMiddleware, async (req, res) => {
    try {
      const { clientId, clientSecret } = req.body;
      if (!clientId || !clientSecret) {
        return res.status(400).json({ error: "Client ID and Client Secret are required" });
      }
      return res.json({ success: true, message: "PayPal configuration saved successfully" });
    } catch (error) {
      console.error("Error saving PayPal config:", error);
      return res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // RAZORPAY PAYMENT ROUTES (mocked)
  app.post("/api/payment/create-order", authMiddleware, async (req, res) => {
    try {
      const { amount, currency = "INR", receipt, notes } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // TODO: integrate real Razorpay SDK and remove mock response
      return res.json({
        success: true,
        order_id: `order_${Date.now()}`,
        amount: amount * 100,
        currency,
        mock: true,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      return res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  app.post("/api/payment/verify", authMiddleware, async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification data" });
      }

      // TODO: verify signature with real gateway
      const booking = {
        ...bookingData,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paymentStatus: "paid",
        paymentMethod: "Razorpay",
        createdAt: new Date().toISOString(),
      };

      // await storage.createAppointment(booking);
      return res.json({ success: true, message: "Payment verified successfully", booking, payment_id: razorpay_payment_id });
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({ error: "Payment verification failed" });
    }
  });
}
