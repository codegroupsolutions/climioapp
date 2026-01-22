import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/quotes/[id] - Get a single quote
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
    const quote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        client: true,
        company: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            postalAddress: true,
            city: true,
            state: true,
            zipCode: true,
            logo: true,
          },
        },
        user: {
          select: {
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
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { error: "Error al obtener cotización" },
      { status: 500 }
    );
  }
}

// PUT /api/quotes/[id] - Update a quote
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

    // Get company tax rate
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { taxRate: true }
    });

    const {
      validUntil,
      items,
      notes,
      discount = 0,
      taxRate = company?.taxRate || 16, // Use company tax rate or default to 16%
    } = body;

    // Check if quote exists and belongs to the company
    const existingQuote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    // Only allow editing if quote is in DRAFT or SENT status
    if (existingQuote.status === "ACCEPTED" || existingQuote.status === "REJECTED") {
      return NextResponse.json(
        { error: "No se puede editar una cotización aceptada o rechazada" },
        { status: 400 }
      );
    }

    // Calculate new totals
    let subtotal = 0;
    const quoteItems = [];

    for (const item of items) {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;

      quoteItems.push({
        quantity: parseInt(item.quantity),
        description: item.description,
        unitPrice: parseFloat(item.unitPrice),
        total: itemTotal,
        productId: item.productId || null,
      });
    }

    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const tax = (subtotalAfterDiscount * taxRate) / 100;
    const total = subtotalAfterDiscount + tax;

    // Update quote in a transaction
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.quoteItem.deleteMany({
        where: { quoteId: params.id },
      });

      // Update quote and create new items
      return await tx.quote.update({
        where: { id: params.id },
        data: {
          validUntil: validUntil ? new Date(validUntil) : null,
          subtotal,
          tax,
          discount: discountAmount,
          total,
          notes,
          items: {
            create: quoteItems,
          },
        },
        include: {
          client: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Error al actualizar cotización" },
      { status: 500 }
    );
  }
}

// DELETE /api/quotes/[id] - Delete a quote
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

    // Check if quote exists and belongs to the company
    const quote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        invoice: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    // Don't allow deletion if quote has an invoice
    if (quote.invoice) {
      return NextResponse.json(
        { error: "No se puede eliminar una cotización que tiene una factura asociada" },
        { status: 400 }
      );
    }

    // Don't allow deletion of accepted quotes
    if (quote.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "No se puede eliminar una cotización aceptada" },
        { status: 400 }
      );
    }

    // Delete quote (items will be cascade deleted)
    await prisma.quote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Cotización eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { error: "Error al eliminar cotización" },
      { status: 500 }
    );
  }
}