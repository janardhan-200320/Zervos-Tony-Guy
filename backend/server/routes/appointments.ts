import type { Express } from "express";
import { authMiddleware } from "../auth";
import { storage } from "../storage";

export function registerAppointmentRoutes(app: Express) {
  // GET /api/appointments
  app.get("/api/appointments", authMiddleware, async (req, res) => {
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

  // POST /api/appointments
  app.post("/api/appointments", authMiddleware, async (req, res) => {
    try {
      const body = req.body as any;
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
        status: body.status || "upcoming",
        notes: body.notes,
      });
      return res.status(201).json(created);
    } catch (error) {
      console.error("Error creating appointment:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
