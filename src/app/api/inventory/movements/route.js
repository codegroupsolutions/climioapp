import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/inventory/movements - Get all inventory movements for the company
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
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");
    const productId = searchParams.get("productId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build filters
    const where = {
      companyId: user.companyId,
      ...(type && { type }),
      ...(productId && { productId }),
      ...(search && {
        OR: [
          { product: { name: { contains: search, mode: "insensitive" } } },
          { product: { code: { contains: search, mode: "insensitive" } } },
          { reason: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate + 'T23:59:59.999Z') }),
        },
      }),
    };

    // Get movements with pagination
    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    // Get summary statistics
    const stats = await prisma.inventoryMovement.groupBy({
      by: ['type'],
      where: {
        companyId: user.companyId,
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate + 'T23:59:59.999Z') }),
          },
        }),
      },
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
    });

    const statsMap = {
      IN: { count: 0, quantity: 0 },
      OUT: { count: 0, quantity: 0 },
      ADJUSTMENT: { count: 0, quantity: 0 },
    };

    stats.forEach(stat => {
      statsMap[stat.type] = {
        count: stat._count.id,
        quantity: stat._sum.quantity || 0,
      };
    });

    return NextResponse.json({
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statsMap,
    });
  } catch (error) {
    console.error("Error fetching movements:", error);
    return NextResponse.json(
      { error: "Error al obtener movimientos" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/movements - Create a manual inventory movement
export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Only admins can create manual movements
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productId, type, quantity, reason, notes } = body;

    // Validate required fields
    if (!productId || !type || quantity === undefined || !reason) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Parse quantity
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity === 0) {
      return NextResponse.json(
        { error: "Cantidad inválida" },
        { status: 400 }
      );
    }

    // Get current product stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        stock: true,
        name: true,
        companyId: true
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verify product belongs to user's company
    if (product.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Producto no pertenece a tu compañía" },
        { status: 403 }
      );
    }

    // Calculate new stock based on movement type
    let newStock;
    let actualQuantity = Math.abs(parsedQuantity); // Always store positive quantity

    if (type === 'IN') {
      newStock = product.stock + actualQuantity;
    } else if (type === 'OUT') {
      newStock = product.stock - actualQuantity;
      if (newStock < 0) {
        return NextResponse.json(
          { error: `Stock insuficiente. Stock actual: ${product.stock}` },
          { status: 400 }
        );
      }
    } else if (type === 'ADJUSTMENT') {
      // For adjustments, quantity can be positive or negative
      newStock = product.stock + parsedQuantity;
      actualQuantity = Math.abs(parsedQuantity);
      if (newStock < 0) {
        return NextResponse.json(
          { error: `El ajuste resulta en stock negativo. Stock actual: ${product.stock}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Tipo de movimiento inválido" },
        { status: 400 }
      );
    }

    // Create movement and update product stock in a transaction
    const movement = await prisma.$transaction(async (tx) => {
      // Create inventory movement
      const newMovement = await tx.inventoryMovement.create({
        data: {
          productId,
          type,
          quantity: actualQuantity,
          reason,
          notes: notes || null,
          reference: `Manual-${type}`,
          previousStock: product.stock,
          newStock,
          userId: user.id,
          companyId: user.companyId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
              category: {
                select: {
                  name: true,
                },
              },
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

      // Update product stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      return newMovement;
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("Error creating movement:", error);
    return NextResponse.json(
      { error: "Error al crear movimiento" },
      { status: 500 }
    );
  }
}