import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const technicianId = searchParams.get("technicianId");

    const companyId = user.companyId;

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      appointments: {},
      technicians: {},
      services: {},
      performance: {}
    };

    // Build where clause
    const appointmentWhere = {
      companyId,
      startDate: {
        gte: start,
        lte: end
      },
      ...(technicianId && { technicianId })
    };

    // Get appointments data
    const [appointments, technicians, appointmentsByStatus, appointmentsByType] = await Promise.all([
      // All appointments in period
      prisma.appointment.findMany({
        where: appointmentWhere,
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true
            }
          },
          technician: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          startDate: "asc"
        }
      }),

      // All technicians with appointment counts
      prisma.user.findMany({
        where: {
          companyId,
          active: true
        },
        include: {
          _count: {
            select: {
              appointments: {
                where: {
                  startDate: {
                    gte: start,
                    lte: end
                  }
                }
              }
            }
          }
        }
      }),

      // Appointments grouped by status
      prisma.appointment.groupBy({
        by: ["status"],
        where: appointmentWhere,
        _count: true
      }),

      // Appointments grouped by type
      prisma.appointment.groupBy({
        by: ["type"],
        where: appointmentWhere,
        _count: true
      })
    ]);

    // Calculate appointment metrics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === "COMPLETED").length;
    const cancelledAppointments = appointments.filter(a => a.status === "CANCELLED").length;
    const pendingAppointments = appointments.filter(a => a.status === "SCHEDULED").length;
    const inProgressAppointments = appointments.filter(a => a.status === "IN_PROGRESS").length;

    // Calculate completion rate
    const completionRate = totalAppointments > 0
      ? (completedAppointments / totalAppointments * 100).toFixed(1)
      : 0;

    // Calculate average duration
    const completedWithDuration = appointments.filter(a =>
      a.status === "COMPLETED" && a.endDate && a.startDate
    );
    const averageDuration = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, a) => {
          const duration = new Date(a.endDate) - new Date(a.startDate);
          return sum + duration;
        }, 0) / completedWithDuration.length / (1000 * 60) // Convert to minutes
      : 0;

    // Technician performance
    const technicianPerformance = technicians.map(tech => {
      const techAppointments = appointments.filter(a => a.technicianId === tech.id);
      const completed = techAppointments.filter(a => a.status === "COMPLETED").length;
      const cancelled = techAppointments.filter(a => a.status === "CANCELLED").length;
      const total = techAppointments.length;

      return {
        id: tech.id,
        name: `${tech.firstName} ${tech.lastName}`,
        role: tech.role,
        totalAppointments: total,
        completed,
        cancelled,
        pending: techAppointments.filter(a => a.status === "SCHEDULED").length,
        inProgress: techAppointments.filter(a => a.status === "IN_PROGRESS").length,
        completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0,
        cancellationRate: total > 0 ? (cancelled / total * 100).toFixed(1) : 0
      };
    }).filter(tech => tech.totalAppointments > 0)
      .sort((a, b) => b.totalAppointments - a.totalAppointments);

    // Service type analysis
    const serviceTypeAnalysis = appointmentsByType.map(type => {
      const typeAppointments = appointments.filter(a => a.type === type.type);
      const completed = typeAppointments.filter(a => a.status === "COMPLETED").length;

      return {
        type: type.type,
        count: type._count,
        completed,
        completionRate: type._count > 0 ? (completed / type._count * 100).toFixed(1) : 0,
        percentage: totalAppointments > 0 ? (type._count / totalAppointments * 100).toFixed(1) : 0
      };
    });

    // Daily appointment distribution
    const appointmentsByDay = {};
    appointments.forEach(apt => {
      const day = new Date(apt.startDate).toISOString().split("T")[0];
      if (!appointmentsByDay[day]) {
        appointmentsByDay[day] = {
          date: day,
          total: 0,
          completed: 0,
          cancelled: 0
        };
      }
      appointmentsByDay[day].total++;
      if (apt.status === "COMPLETED") appointmentsByDay[day].completed++;
      if (apt.status === "CANCELLED") appointmentsByDay[day].cancelled++;
    });

    const dailyDistribution = Object.values(appointmentsByDay)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Hour distribution (for scheduling insights)
    const hourDistribution = Array(24).fill(0);
    appointments.forEach(apt => {
      const hour = new Date(apt.startDate).getHours();
      hourDistribution[hour]++;
    });

    const peakHours = hourDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Client satisfaction (based on repeat appointments)
    const clientAppointments = {};
    appointments.forEach(apt => {
      if (!clientAppointments[apt.clientId]) {
        clientAppointments[apt.clientId] = {
          client: apt.client,
          count: 0,
          statuses: []
        };
      }
      clientAppointments[apt.clientId].count++;
      clientAppointments[apt.clientId].statuses.push(apt.status);
    });

    const repeatClients = Object.values(clientAppointments)
      .filter(c => c.count > 1)
      .length;

    const repeatRate = Object.keys(clientAppointments).length > 0
      ? (repeatClients / Object.keys(clientAppointments).length * 100).toFixed(1)
      : 0;

    // Top clients by appointments
    const topClients = Object.values(clientAppointments)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(c => ({
        name: c.client.companyName || `${c.client.firstName} ${c.client.lastName}`,
        appointments: c.count,
        completed: c.statuses.filter(s => s === "COMPLETED").length
      }));

    // Build report response
    report.appointments = {
      total: totalAppointments,
      completed: completedAppointments,
      pending: pendingAppointments,
      inProgress: inProgressAppointments,
      cancelled: cancelledAppointments,
      completionRate,
      cancellationRate: totalAppointments > 0 ? (cancelledAppointments / totalAppointments * 100).toFixed(1) : 0,
      averageDuration: Math.round(averageDuration),
      byStatus: appointmentsByStatus.map(s => ({
        status: s.status,
        count: s._count,
        percentage: totalAppointments > 0 ? (s._count / totalAppointments * 100).toFixed(1) : 0
      })),
      byDay: dailyDistribution,
      peakHours
    };

    report.technicians = {
      total: technicians.length,
      active: technicians.filter(t => t._count.appointments > 0).length,
      performance: technicianPerformance,
      topPerformer: technicianPerformance[0] || null,
      averageAppointmentsPerTech: technicianPerformance.length > 0
        ? (totalAppointments / technicianPerformance.length).toFixed(1)
        : 0
    };

    report.services = {
      byType: serviceTypeAnalysis,
      mostRequested: serviceTypeAnalysis.sort((a, b) => b.count - a.count)[0] || null,
      diversity: serviceTypeAnalysis.length
    };

    report.performance = {
      efficiency: {
        completionRate,
        cancellationRate: totalAppointments > 0 ? (cancelledAppointments / totalAppointments * 100).toFixed(1) : 0,
        averageDuration: Math.round(averageDuration),
        appointmentsPerDay: dailyDistribution.length > 0
          ? (totalAppointments / dailyDistribution.length).toFixed(1)
          : 0
      },
      clientSatisfaction: {
        repeatRate,
        totalClients: Object.keys(clientAppointments).length,
        repeatClients,
        topClients
      },
      scheduling: {
        peakHours,
        busiestDay: dailyDistribution.sort((a, b) => b.total - a.total)[0] || null,
        averageAppointmentsPerDay: dailyDistribution.length > 0
          ? (totalAppointments / dailyDistribution.length).toFixed(1)
          : 0
      }
    };

    // Recent appointments
    report.recentAppointments = appointments
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .slice(0, 10)
      .map(apt => ({
        id: apt.id,
        client: apt.client.companyName || `${apt.client.firstName} ${apt.client.lastName}`,
        technician: apt.technician ? `${apt.technician.firstName} ${apt.technician.lastName}` : "Sin asignar",
        type: apt.type,
        status: apt.status,
        date: apt.startDate,
        address: apt.address
      }));

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating services report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte de servicios" },
      { status: 500 }
    );
  }
}