import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// POST /api/products/[id]/stock - Adjust product stock
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, quantity, reason, notes, reference } = body;

    // Validate required fields
    if (!type || quantity === undefined) {
      return NextResponse.json(
        { error: "Tipo y cantidad son requeridos" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["IN", "OUT", "ADJUSTMENT"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de movimiento inválido" },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity <= 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor a 0" },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        active: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Calculate new stock
    let newStock;
    if (type === "IN") {
      newStock = product.stock + quantity;
    } else if (type === "OUT") {
      if (product.stock < quantity) {
        return NextResponse.json(
          { error: "Stock insuficiente" },
          { status: 400 }
        );
      }
      newStock = product.stock - quantity;
    } else { // ADJUSTMENT
      newStock = quantity;
    }

    // Create transaction to update stock and create movement record
    const result = await prisma.$transaction(async (tx) => {
      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: { stock: newStock },
      });

      // Create inventory movement
      const movement = await tx.inventoryMovement.create({
        data: {
          type,
          quantity: type === "ADJUSTMENT" ? Math.abs(newStock - product.stock) : quantity,
          reason,
          notes,
          reference,
          previousStock: product.stock,
          newStock,
          productId: params.id,
          companyId: user.companyId,
          userId: user.id,
        },
        include: {
          product: {
            select: {
              name: true,
              code: true,
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

      return { product: updatedProduct, movement };
    });

    // Check if stock is below minimum
    if (result.product.stock <= result.product.minStock) {
      // Could trigger an alert here (email, notification, etc.)
      console.warn(`Low stock alert for product ${result.product.name}: ${result.product.stock}/${result.product.minStock}`);
    }

    return NextResponse.json({
      ...result,
      alert: result.product.stock <= result.product.minStock ? {
        type: "LOW_STOCK",
        message: `Stock bajo: ${result.product.stock} unidades (mínimo: ${result.product.minStock})`,
      } : null,
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Error al ajustar inventario" },
      { status: 500 }
    );
  }
}

// GET /api/products/[id]/stock - Get stock movements history
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const {id} = await params;

    // Check product exists
    const product = await prisma.product.findFirst({
      where: {
        id: id,
        companyId: user.companyId,
        active: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Get movements with pagination
    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where: {
          productId: id,
          companyId: user.companyId,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.inventoryMovement.count({
        where: {
          productId: id,
          companyId: user.companyId,
        },
      }),
    ]);

    return NextResponse.json({
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      currentStock: product.stock,
      minStock: product.minStock,
    });
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Error al obtener movimientos de inventario" },
      { status: 500 }
    );
  }
}