import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const search = searchParams.get("search");

    // Construir filtros
    const where = {
      companyId: session.user.companyId,
    };

    // Filtro de rango de fechas
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        // Agregar 23:59:59 al endDate para incluir todo el día
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Filtro por estado
    if (status && status !== "all") {
      where.status = status;
    }

    // Filtro por empleado
    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Filtro de búsqueda (por nombre de empleado)
    if (search) {
      where.employee = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const distributions = await prisma.distribution.findMany({
      where,
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
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(distributions);
  } catch (error) {
    console.error("Error al obtener distribuciones:", error);
    return NextResponse.json(
      { error: "Error al obtener distribuciones" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden crear distribuciones
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No tiene permisos para crear distribuciones" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { employeeId, date, notes, items } = data;

    if (!employeeId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // Verificar que el empleado pertenece a la misma compañía
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        companyId: session.user.companyId,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Empleado no válido" },
        { status: 400 }
      );
    }

    // Crear la distribución
    const distribution = await prisma.distribution.create({
      data: {
        companyId: session.user.companyId,
        employeeId,
        date: date ? new Date(date) : new Date(),
        notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json(distribution);
  } catch (error) {
    console.error("Error al crear distribución:", error);
    return NextResponse.json(
      { error: "Error al crear distribución" },
      { status: 500 }
    );
  }
}