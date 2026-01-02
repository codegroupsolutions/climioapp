import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";
import { sendAppointmentCreatedEmail } from "@/lib/emailService";
import { formatDisplayDate } from "@/utils/dateUtils";

// POST /api/service-contracts/[id]/schedule - Schedule a service appointment
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, technicianId, description, notes } = body;

    // Validate required fields
    if (!startDate || !endDate || !technicianId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Get contract details
    const contract = await prisma.serviceContract.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!contract || contract.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      );
    }

    // Check if contract is active
    if (contract.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: "El contrato no está activo" },
        { status: 400 }
      );
    }

    // Check if there's already a pending appointment
    const pendingAppointment = await prisma.appointment.findFirst({
      where: {
        serviceContractId: id,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (pendingAppointment) {
      return NextResponse.json(
        { error: "Ya existe una cita pendiente para este contrato" },
        { status: 400 }
      );
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        title: `${getServiceTypeLabel(contract.serviceType)} - ${contract.client.companyName || `${contract.client.firstName} ${contract.client.lastName}`}`,
        description: description || `Servicio programado según contrato ${contract.contractNumber}`,
        type: contract.serviceType === 'MAINTENANCE' ? 'MAINTENANCE' : 'SERVICE',
        status: 'SCHEDULED',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        address: contract.client.address,
        notes,
        companyId: user.companyId,
        clientId: contract.clientId,
        technicianId,
        serviceContractId: id,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            email: true,
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
        serviceContract: {
          select: {
            id: true,
            contractNumber: true,
            serviceType: true,
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
        console.log('Email sent successfully to client for service contract appointment');
      } catch (emailError) {
        console.error('Error sending appointment creation email from service contract:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error scheduling service:", error);
    return NextResponse.json(
      { error: "Error al programar servicio" },
      { status: 500 }
    );
  }
}

function getServiceTypeLabel(type) {
  const labels = {
    MAINTENANCE: 'Mantenimiento',
    SUPPORT: 'Soporte',
    FULL_SERVICE: 'Servicio Completo',
    INSPECTION: 'Inspección',
    CONSULTATION: 'Consultoría',
    CUSTOM: 'Servicio',
  };
  return labels[type] || 'Servicio';
}