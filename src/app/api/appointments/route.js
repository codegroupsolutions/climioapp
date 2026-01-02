import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";
import { sendAppointmentCreatedEmail } from "@/lib/emailService";
import { formatDisplayDate } from "@/utils/dateUtils";

// GET /api/appointments - Get all appointments with filters
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
    const view = searchParams.get("view") || "list"; // list or calendar
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const technicianId = searchParams.get("technicianId");
    const clientId = searchParams.get("clientId");

    // Build where clause
    const where = {
      companyId: user.companyId,
      ...(status && { status }),
      ...(clientId && { clientId }),
    };

    // If user is a technician, only show their appointments
    if (user.role === 'TECHNICIAN') {
      where.technicianId = user.id;
    } else if (technicianId) {
      // For other users, apply the technician filter if provided
      where.technicianId = technicianId;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            address: true,
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
    });

    // For calendar view, also get technicians for assignment
    if (view === "calendar") {
      const technicians = await prisma.user.findMany({
        where: {
          companyId: user.companyId,
          role: "TECHNICIAN",
          active: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      return NextResponse.json({
        appointments,
        technicians,
      });
    }

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Error al obtener citas" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      clientId,
      title,
      description,
      startDate,
      endDate,
      type,
      status = "SCHEDULED",
      technicianId,
      location,
      notes,
    } = body;

    // Validate required fields
    if (!clientId || !title || !startDate || !type) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Validate that technician is available for the time slot
    if (technicianId) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          technicianId,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          OR: [
            {
              AND: [
                { startDate: { lte: new Date(startDate) } },
                { endDate: { gte: new Date(startDate) } },
              ],
            },
            {
              AND: [
                { startDate: { lte: new Date(endDate || startDate) } },
                { endDate: { gte: new Date(endDate || startDate) } },
              ],
            },
          ],
        },
      });

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: "El técnico ya tiene una cita programada en ese horario" },
          { status: 400 }
        );
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        type,
        status,
        address: location,
        notes,
        clientId,
        technicianId,
        companyId: user.companyId,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        technician: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send email notification to client
    if (appointment.client?.email) {
      try {
        const typeLabels = {
          SERVICE: 'Servicio',
          MAINTENANCE: 'Mantenimiento',
          INSTALLATION: 'Instalación',
          REPAIR: 'Reparación',
          INSPECTION: 'Inspección',
          CONSULTATION: 'Consulta',
        };

        const appointmentData = {
          clientName: appointment.client.companyName || `${appointment.client.firstName} ${appointment.client.lastName}`,
          title: appointment.title,
          type: typeLabels[appointment.type] || appointment.type,
          date: formatDisplayDate(appointment.startDate, false),
          time: formatDisplayDate(appointment.startDate, true).split(' ').slice(1).join(' '),
          endTime: appointment.endDate ? formatDisplayDate(appointment.endDate, true).split(' ').slice(1).join(' ') : null,
          technicianName: appointment.technician ? `${appointment.technician.firstName} ${appointment.technician.lastName}` : null,
          location: appointment.address,
          description: appointment.description,
        };

        await sendAppointmentCreatedEmail(appointment.client.email, appointmentData);
      } catch (emailError) {
        console.error('Error sending appointment creation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Error al crear cita" },
      { status: 500 }
    );
  }
}