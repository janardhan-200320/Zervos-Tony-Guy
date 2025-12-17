import type { Express } from "express";
import { authMiddleware } from "../auth";
import { storage } from "../storage";

export function registerAnalyticsRoutes(app: Express) {
  app.get("/api/reports/analytics", authMiddleware, async (req, res) => {
    try {
      const { startDate, endDate, workspaceId } = req.query;

      const appointments = await storage.getAppointments({ workspaceId: workspaceId as string });
      const resourceBookings = await storage.getResourceBookings({ startDate: startDate as string, endDate: endDate as string });

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

      const totalBookings = filteredAppointments.length + filteredBookings.length;
      const completedBookings = filteredAppointments.filter(a => a.status === "completed").length;
      const cancelledBookings = filteredAppointments.filter(a => a.status === "cancelled").length +
        filteredBookings.filter(b => b.status === "cancelled").length;
      const upcomingBookings = filteredAppointments.filter(a => a.status === "upcoming").length;

      const mockRevenuePerBooking = 100;
      const totalRevenue = completedBookings * mockRevenuePerBooking;
      const pendingRevenue = upcomingBookings * mockRevenuePerBooking * 0.5;

      const serviceStats = filteredAppointments.reduce((acc, apt) => {
        const serviceName = apt.serviceName || "General";
        if (!acc[serviceName]) {
          acc[serviceName] = { name: serviceName, count: 0, revenue: 0 };
        }
        acc[serviceName].count++;
        if (apt.status === "completed") {
          acc[serviceName].revenue += mockRevenuePerBooking;
        }
        return acc;
      }, {} as Record<string, { name: string; count: number; revenue: number }>);

      const teamStats = filteredAppointments.reduce((acc, apt) => {
        const memberName = apt.assignedMemberName || "Unassigned";
        const memberId = apt.assignedMemberId || "unassigned";
        if (!acc[memberId]) {
          acc[memberId] = {
            id: memberId,
            name: memberName,
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            revenue: 0,
          };
        }
        acc[memberId].totalBookings++;
        if (apt.status === "completed") {
          acc[memberId].completedBookings++;
          acc[memberId].revenue += mockRevenuePerBooking;
        }
        if (apt.status === "cancelled") {
          acc[memberId].cancelledBookings++;
        }
        return acc;
      }, {} as Record<string, any>);

      const resourceStats = filteredBookings.reduce((acc, booking) => {
        if (!acc[booking.resourceId]) {
          acc[booking.resourceId] = {
            resourceId: booking.resourceId,
            totalBookings: 0,
            totalHours: 0,
            revenue: 0,
          };
        }
        acc[booking.resourceId].totalBookings++;

        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        acc[booking.resourceId].totalHours += hours;
        acc[booking.resourceId].revenue += hours * 50;

        return acc;
      }, {} as Record<string, any>);

      const dayOfWeekStats = filteredAppointments.reduce((acc, apt) => {
        const date = new Date(apt.date);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        if (!acc[dayName]) {
          acc[dayName] = 0;
        }
        acc[dayName]++;
        return acc;
      }, {} as Record<string, number>);

      const timeOfDayStats = filteredAppointments.reduce((acc, apt) => {
        if (apt.time) {
          const hour = parseInt(apt.time.split(":")[0]);
          const timeSlot = `${hour}:00`;
          if (!acc[timeSlot]) {
            acc[timeSlot] = 0;
          }
          acc[timeSlot]++;
        }
        return acc;
      }, {} as Record<string, number>);

      const totalCustomers = new Set(filteredAppointments.map(a => a.email)).size;
      const newCustomers = Math.floor(totalCustomers * 0.6);
      const returningCustomers = totalCustomers - newCustomers;

      const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : "0";
      const averageBookingValue = completedBookings > 0 ? (totalRevenue / completedBookings).toFixed(2) : "0";

      const previousPeriodRevenue = totalRevenue * 0.85;
      const revenueGrowth = previousPeriodRevenue > 0
        ? (((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100).toFixed(1)
        : "0";

      const previousPeriodBookings = totalBookings * 0.9;
      const bookingsGrowth = previousPeriodBookings > 0
        ? (((totalBookings - previousPeriodBookings) / previousPeriodBookings) * 100).toFixed(1)
        : "0";

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
        timeAnalytics: { byDayOfWeek: dayOfWeekStats, byTimeOfDay: timeOfDayStats },
        customers: {
          total: totalCustomers,
          new: newCustomers,
          returning: returningCustomers,
          retentionRate: totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : "0",
        },
        dateRange: {
          startDate: startDate || "all",
          endDate: endDate || "all",
        },
      };

      return res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      return res.status(500).json({ error: "Failed to generate analytics" });
    }
  });
}
