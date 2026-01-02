import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/products/[id] - Get a single product
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

    const product = await prisma.product.findFirst({
      where: {
        id: id,
        companyId: user.companyId,
        active: true,
      },
      include: {
        category: true,
        inventoryMovements: {
          take: 10,
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
        quoteItems: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            quote: {
              select: {
                id: true,
                number: true,
                date: true,
                status: true,
                client: {
                  select: {
                    firstName: true,
                    lastName: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
        invoiceItems: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            invoice: {
              select: {
                id: true,
                number: true,
                date: true,
                status: true,
                client: {
                  select: {
                    firstName: true,
                    lastName: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product
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
      code,
      name,
      description,
      categoryId,
      cost,
      price,
      minStock,
      unit,
      imageUrl,
    } = body;

    // Validate required fields
    if (!name || !categoryId || cost === undefined || price === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check if product exists and belongs to the company
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        active: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Check for duplicate code if changed
    if (code && code !== existingProduct.code) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          companyId: user.companyId,
          code,
          active: true,
          NOT: { id: params.id },
        },
      });

      if (duplicateProduct) {
        return NextResponse.json(
          { error: "Ya existe otro producto con este código" },
          { status: 400 }
        );
      }
    }

    // Update product (not updating stock here - use stock adjustment endpoint)
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        code,
        name,
        description,
        categoryId,
        cost: parseFloat(cost),
        price: parseFloat(price),
        minStock: parseInt(minStock),
        unit,
        imageUrl,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Soft delete a product
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Check if product exists and belongs to the company
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        active: true,
      },
      include: {
        _count: {
          select: {
            quoteItems: true,
            invoiceItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Check for active relationships
    if (product._count.quoteItems > 0 || product._count.invoiceItems > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el producto porque está en uso en cotizaciones o facturas" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.product.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}