import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const technicianId = searchParams.get("technicianId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get all appointments with pending tasks
    const where = {
      companyId: user.companyId,
      pendingTasks: {
        not: null,
      },
    };

    // If user is a technician, only show their tasks
    if (user.role === 'TECHNICIAN') {
      where.technicianId = user.id;
    } else if (technicianId) {
      // For other users, apply the technician filter if provided
      where.technicianId = technicianId;
    }

    // Add date range filter for appointment dates
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        // Add 23:59:59 to endDate to include the whole day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.startDate.lte = end;
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Process appointments to extract pending tasks
    const pendingTasksList = [];

    appointments.forEach((appointment) => {
      if (appointment.pendingTasks && Array.isArray(appointment.pendingTasks)) {
        appointment.pendingTasks.forEach((task) => {
          // Apply search filter if provided
          if (search) {
            const searchLower = search.toLowerCase();
            const matchTask = task.description?.toLowerCase().includes(searchLower);
            const matchClient =
              appointment.client.firstName?.toLowerCase().includes(searchLower) ||
              appointment.client.lastName?.toLowerCase().includes(searchLower) ||
              appointment.client.companyName?.toLowerCase().includes(searchLower);
            const matchAppointment = appointment.title?.toLowerCase().includes(searchLower);

            if (!matchTask && !matchClient && !matchAppointment) {
              return; // Skip this task if no match
            }
          }

          pendingTasksList.push({
            task,
            appointmentId: appointment.id,
            appointment: {
              id: appointment.id,
              title: appointment.title,
              type: appointment.type,
              status: appointment.status,
              startDate: appointment.startDate,
              endDate: appointment.endDate,
            },
            client: appointment.client,
            technician: appointment.technician,
          });
        });
      }
    });

    // Sort by task creation date (newest first)
    pendingTasksList.sort((a, b) => {
      const dateA = new Date(a.task.createdAt || 0);
      const dateB = new Date(b.task.createdAt || 0);
      return dateB - dateA;
    });

    return NextResponse.json(pendingTasksList);
  } catch (error) {
    console.error("Error fetching pending tasks:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas pendientes" },
      { status: 500 }
    );
  }
}