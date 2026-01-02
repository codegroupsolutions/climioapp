import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/clients/[id] - Get a single client
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const {id} = await params;

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        companyId: user.companyId,
        active: true,
      },
      include: {
        quotes: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        appointments: {
          orderBy: { startDate: "desc" },
          include: {
            technician: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(request, { params }) {
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
      firstName,
      lastName,
      email,
      phone,
      alternativePhone,
      type,
      companyName,
      contactPerson,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      notes,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !address || !city || !state) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check if client exists and belongs to the company
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        active: true,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Check for duplicate phone if changed
    if (phone !== existingClient.phone) {
      const duplicateClient = await prisma.client.findFirst({
        where: {
          companyId: user.companyId,
          phone,
          active: true,
          NOT: { id: params.id },
        },
      });

      if (duplicateClient) {
        return NextResponse.json(
          { error: "Ya existe otro cliente con este teléfono" },
          { status: 400 }
        );
      }
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        alternativePhone,
        type,
        companyName,
        contactPerson,
        address,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        notes,
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Soft delete a client
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Check if client exists and belongs to the company
    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        active: true,
      },
      include: {
        quotes: { where: { status: "ACCEPTED" } },
        invoices: { where: { status: "PENDING" } },
        appointments: { where: { status: "SCHEDULED" } },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Check for active relationships
    if (client.quotes.length > 0 || client.invoices.length > 0 || client.appointments.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el cliente porque tiene cotizaciones, facturas o citas activas" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.client.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    );
  }
}