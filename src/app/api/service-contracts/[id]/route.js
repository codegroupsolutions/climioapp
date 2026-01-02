import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/service-contracts/[id] - Get a single service contract
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

    const contract = await prisma.serviceContract.findUnique({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        client: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: "Error al obtener contrato" },
      { status: 500 }
    );
  }
}

// PUT /api/service-contracts/[id] - Update a service contract
export async function PUT(request, { params }) {
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
    const {
      serviceType,
      status,
      startDate,
      endDate,
      serviceFrequency,
      frequencyValue,
      amount,
      description,
      terms,
      notes,
      autoRenew,
    } = body;

    // Verify contract exists and belongs to company
    const existingContract = await prisma.serviceContract.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!existingContract || existingContract.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      );
    }

    // Update contract
    const contract = await prisma.serviceContract.update({
      where: { id },
      data: {
        ...(serviceType && { serviceType }),
        ...(status && { status }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(serviceFrequency && { serviceFrequency }),
        ...(frequencyValue !== undefined && { frequencyValue: parseInt(frequencyValue) }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(terms !== undefined && { terms }),
        ...(notes !== undefined && { notes }),
        ...(autoRenew !== undefined && { autoRenew }),
      },
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
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { error: "Error al actualizar contrato" },
      { status: 500 }
    );
  }
}

// DELETE /api/service-contracts/[id] - Delete a service contract
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Only admins can delete contracts
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar contratos" },
        { status: 403 }
      );
    }

    // Verify contract exists and belongs to company
    const existingContract = await prisma.serviceContract.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!existingContract || existingContract.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      );
    }

    // Delete contract
    await prisma.serviceContract.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Contrato eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: "Error al eliminar contrato" },
      { status: 500 }
    );
  }
}