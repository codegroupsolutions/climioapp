import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";
import { sendAppointmentStatusEmail, sendAppointmentCompletedEmail } from "@/lib/emailService";
import { formatDisplayDate } from "@/utils/dateUtils";

// GET /api/appointments/[id] - Get a single appointment
export async function GET(request, context) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        client: true,
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        company: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Error al obtener cita" },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update an appointment
export async function PUT(request, context) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    const {
      title,
      description,
      startDate,
      endDate,
      type,
      status,
      technicianId,
      location,
      notes,
      tasks,
      pendingTasks,
    } = body;

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Validate technician availability if changing technician or time
    if (technicianId && (technicianId !== existingAppointment.technicianId ||
        startDate !== existingAppointment.startDate ||
        endDate !== existingAppointment.endDate)) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: params.id },
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

    // Detect if status is changing
    const statusChanged = status && status !== existingAppointment.status;
    const previousStatus = existingAppointment.status;

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(type && { type }),
        ...(status && { status }),
        ...(technicianId !== undefined && { technicianId }),
        ...(location !== undefined && { address: location }),
        ...(notes !== undefined && { notes }),
        ...(tasks !== undefined && { tasks }),
        ...(pendingTasks !== undefined && { pendingTasks }),
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
        serviceContract: true,
      },
    });

    // If appointment is linked to a contract and status changed to COMPLETED, update contract dates
    if (status === 'COMPLETED' && updatedAppointment.serviceContractId) {
      const contract = await prisma.serviceContract.findUnique({
        where: { id: updatedAppointment.serviceContractId },
      });

      if (contract) {
        // Calculate next service date based on frequency
        const calculateNextServiceDate = (lastDate, frequency, value) => {
          const date = new Date(lastDate);
          switch(frequency) {
            case 'WEEKLY':
              date.setDate(date.getDate() + (7 * value));
              break;
            case 'BIWEEKLY':
              date.setDate(date.getDate() + (14 * value));
              break;
            case 'MONTHLY':
              date.setMonth(date.getMonth() + value);
              break;
            case 'BIMONTHLY':
              date.setMonth(date.getMonth() + (2 * value));
              break;
            case 'QUARTERLY':
              date.setMonth(date.getMonth() + (3 * value));
              break;
            case 'SEMIANNUAL':
              date.setMonth(date.getMonth() + (6 * value));
              break;
            case 'ANNUAL':
              date.setFullYear(date.getFullYear() + value);
              break;
            default:
              return null;
          }
          return date;
        };

        const nextServiceDate = contract.serviceFrequency !== 'ONE_TIME'
          ? calculateNextServiceDate(updatedAppointment.startDate, contract.serviceFrequency, contract.frequencyValue)
          : null;

        // Update contract with last service date and next service date
        await prisma.serviceContract.update({
          where: { id: updatedAppointment.serviceContractId },
          data: {
            lastServiceDate: updatedAppointment.startDate,
            nextServiceDate,
          },
        });
      }
    }

    // Send email notifications when status changes
    if (statusChanged && updatedAppointment.client?.email) {
      try {
        const typeLabels = {
          SERVICE: 'Servicio',
          MAINTENANCE: 'Mantenimiento',
          INSTALLATION: 'Instalación',
          REPAIR: 'Reparación',
          INSPECTION: 'Inspección',
          CONSULTATION: 'Consulta',
        };

        const statusLabels = {
          SCHEDULED: 'Programado',
          IN_PROGRESS: 'En Progreso',
          COMPLETED: 'Completado',
          CANCELLED: 'Cancelado',
        };

        const statusColors = {
          SCHEDULED: '#e3f2fd',
          IN_PROGRESS: '#fff9c4',
          COMPLETED: '#c8e6c9',
          CANCELLED: '#ffebee',
        };

        const statusBorders = {
          SCHEDULED: '#2196F3',
          IN_PROGRESS: '#FFC107',
          COMPLETED: '#4CAF50',
          CANCELLED: '#F44336',
        };

        const appointmentData = {
          clientName: updatedAppointment.client.companyName || `${updatedAppointment.client.firstName} ${updatedAppointment.client.lastName}`,
          title: updatedAppointment.title,
          type: typeLabels[updatedAppointment.type] || updatedAppointment.type,
          date: formatDisplayDate(updatedAppointment.startDate, false),
          time: formatDisplayDate(updatedAppointment.startDate, true).split(' ').slice(1).join(' '),
          technicianName: updatedAppointment.technician ? `${updatedAppointment.technician.firstName} ${updatedAppointment.technician.lastName}` : null,
          statusText: statusLabels[status],
          statusColor: statusColors[status],
          statusBorder: statusBorders[status],
          notes: updatedAppointment.notes,
        };

        // If completed, send the detailed completion email with tasks
        if (status === 'COMPLETED') {
          appointmentData.tasks = updatedAppointment.tasks || [];
          appointmentData.pendingTasks = updatedAppointment.pendingTasks || [];

          // Format task dates
          if (appointmentData.tasks.length > 0) {
            appointmentData.tasks = appointmentData.tasks.map(task => ({
              ...task,
              completedAt: task.completedAt ? formatDisplayDate(task.completedAt, true) : null,
            }));
          }

          if (appointmentData.pendingTasks.length > 0) {
            appointmentData.pendingTasks = appointmentData.pendingTasks.map(task => ({
              ...task,
              createdAt: task.createdAt ? formatDisplayDate(task.createdAt, true) : null,
            }));
          }

          await sendAppointmentCompletedEmail(updatedAppointment.client.email, appointmentData);
        } else {
          // For other status changes, send the regular status update email
          await sendAppointmentStatusEmail(updatedAppointment.client.email, appointmentData);
        }
      } catch (emailError) {
        console.error('Error sending appointment status email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Error al actualizar cita" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
export async function DELETE(request, context) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const params = await context.params;

    // Check if appointment exists
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Don't allow deletion of completed appointments
    if (appointment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "No se puede eliminar una cita completada" },
        { status: 400 }
      );
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Error al eliminar cita" },
      { status: 500 }
    );
  }
}