import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const distribution = await prisma.distribution.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!distribution) {
      return NextResponse.json(
        { error: "Distribución no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(distribution);
  } catch (error) {
    console.error("Error al obtener distribución:", error);
    return NextResponse.json(
      { error: "Error al obtener distribución" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden actualizar distribuciones
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No tiene permisos para actualizar distribuciones" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    const distribution = await prisma.distribution.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        items: true,
      },
    });

    if (!distribution) {
      return NextResponse.json(
        { error: "Distribución no encontrada" },
        { status: 404 }
      );
    }

    // Si se incluyen items, actualizar los items de la distribución
    if (data.items !== undefined) {
      // Obtener IDs de items existentes y nuevos
      const existingItemIds = distribution.items.map(item => item.id);
      const updatedItemIds = data.items.filter(item => item.id).map(item => item.id);

      // Items a eliminar
      const itemsToDelete = existingItemIds.filter(id => !updatedItemIds.includes(id));

      // Eliminar items que ya no están
      if (itemsToDelete.length > 0) {
        await prisma.distributionItem.deleteMany({
          where: {
            id: { in: itemsToDelete },
            distributionId: id,
          },
        });
      }

      // Actualizar o crear items
      for (const item of data.items) {
        if (item.id) {
          // Actualizar item existente
          await prisma.distributionItem.update({
            where: { id: item.id },
            data: {
              quantity: item.quantity,
              returned: item.returned || 0,
              notes: item.notes,
            },
          });
        } else if (item.productId) {
          // Crear nuevo item
          await prisma.distributionItem.create({
            data: {
              distributionId: id,
              productId: item.productId,
              quantity: item.quantity,
              returned: item.returned || 0,
              notes: item.notes,
            },
          });
        }
      }
    }

    // Actualizar la distribución principal
    const updatedDistribution = await prisma.distribution.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        ...(data.employeeId && { employeeId: data.employeeId }),
        ...(data.date && { date: new Date(data.date) }),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                unit: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedDistribution);
  } catch (error) {
    console.error("Error al actualizar distribución:", error);
    return NextResponse.json(
      { error: "Error al actualizar distribución" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden eliminar distribuciones
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar distribuciones" },
        { status: 403 }
      );
    }

    const { id } = params;

    const distribution = await prisma.distribution.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!distribution) {
      return NextResponse.json(
        { error: "Distribución no encontrada" },
        { status: 404 }
      );
    }

    await prisma.distribution.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Distribución eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar distribución:", error);
    return NextResponse.json(
      { error: "Error al eliminar distribución" },
      { status: 500 }
    );
  }
}