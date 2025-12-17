import { insertResourceSchema, insertResourceBookingSchema } from "@shared/schema";
import type { Express } from "express";
import { fromZodError } from "zod-validation-error";
import { authMiddleware } from "../auth";
import { storage } from "../storage";
import { InputValidation } from "../validation";

export function registerResourceRoutes(app: Express) {
  // POST /api/resources - Create new resource
  app.post("/api/resources", authMiddleware, async (req, res) => {
    try {
      const result = insertResourceSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: "Validation failed", details: validationError.message });
      }

      const resource = await storage.createResource(result.data);
      return res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resources - Get all resources
  app.get("/api/resources", authMiddleware, async (req, res) => {
    try {
      const { type, status, search } = req.query;
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
  app.get("/api/resources/:id", authMiddleware, async (req, res) => {
    try {
      const resourceId = req.params.id;
      if (!resourceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId)) {
        return res.status(400).json({ error: "Invalid resource ID format" });
      }

      const resource = await storage.getResource(resourceId);
      if (!resource) return res.status(404).json({ error: "Resource not found" });

      return res.json(resource);
    } catch (error) {
      console.error("Error fetching resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PUT /api/resources/:id - Update resource
  app.put("/api/resources/:id", authMiddleware, async (req, res) => {
    try {
      const resourceId = req.params.id;
      if (!resourceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId)) {
        return res.status(400).json({ error: "Invalid resource ID format" });
      }

      const result = insertResourceSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: "Validation failed", details: validationError.message });
      }

      const resource = await storage.updateResource(resourceId, result.data);
      if (!resource) return res.status(404).json({ error: "Resource not found" });

      return res.json(resource);
    } catch (error) {
      console.error("Error updating resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/resources/:id - Delete resource
  app.delete("/api/resources/:id", authMiddleware, async (req, res) => {
    try {
      await storage.deleteResource(req.params.id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting resource:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/resource-bookings - Create new resource booking
  app.post("/api/resource-bookings", authMiddleware, async (req, res) => {
    try {
      const result = insertResourceBookingSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: "Validation failed", details: validationError.message });
      }

      const isAvailable = await storage.checkResourceAvailability(
        result.data.resourceId,
        result.data.startTime,
        result.data.endTime,
      );

      if (!isAvailable) {
        return res.status(409).json({ error: "Resource is not available during the requested time" });
      }

      const booking = await storage.createResourceBooking(result.data);
      return res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating resource booking:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resource-bookings - Get all resource bookings
  app.get("/api/resource-bookings", authMiddleware, async (req, res) => {
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
  app.put("/api/resource-bookings/:id/cancel", authMiddleware, async (req, res) => {
    try {
      const booking = await storage.cancelResourceBooking(req.params.id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      return res.json(booking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/resources/:id/stats - Get resource usage statistics
  app.get("/api/resources/:id/stats", authMiddleware, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getResourceStats(req.params.id, startDate as string, endDate as string);
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching resource stats:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
