import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/service-contracts/[id]/appointments - Get all appointments for a contract
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verify contract exists and belongs to company
    const contract = await prisma.serviceContract.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!contract || contract.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      );
    }

    // Get all appointments for this contract
    const appointments = await prisma.appointment.findMany({
      where: {
        serviceContractId: id,
        companyId: user.companyId,
      },
      orderBy: { startDate: 'desc' },
      include: {
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

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching contract appointments:", error);
    return NextResponse.json(
      { error: "Error al obtener citas del contrato" },
      { status: 500 }
    );
  }
}