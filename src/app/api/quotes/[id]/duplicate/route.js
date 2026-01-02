import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// POST /api/quotes/[id]/duplicate - Duplicate a quote
export async function POST(request, context) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const params = await context.params;

    // Get original quote
    const originalQuote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        items: true,
      },
    });

    if (!originalQuote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    // Generate new quote number
    const lastQuote = await prisma.quote.findFirst({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });

    let nextNumber = 1;
    if (lastQuote && lastQuote.number) {
      const match = lastQuote.number.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    const quoteNumber = `COT-${new Date().getFullYear()}-${String(nextNumber).padStart(5, '0')}`;

    // Create duplicate quote with items
    const duplicateQuote = await prisma.quote.create({
      data: {
        number: quoteNumber,
        clientId: originalQuote.clientId,
        userId: user.id,
        companyId: user.companyId,
        status: "DRAFT",
        subtotal: originalQuote.subtotal,
        tax: originalQuote.tax,
        discount: originalQuote.discount,
        total: originalQuote.total,
        notes: originalQuote.notes,
        validUntil: null, // Reset valid until date
        items: {
          create: originalQuote.items.map(item => ({
            quantity: item.quantity,
            description: item.description,
            unitPrice: item.unitPrice,
            total: item.total,
            productId: item.productId,
          })),
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
        items: true,
      },
    });

    return NextResponse.json({
      quote: duplicateQuote,
      message: "Cotización duplicada exitosamente",
    });
  } catch (error) {
    console.error("Error duplicating quote:", error);
    return NextResponse.json(
      { error: "Error al duplicar cotización" },
      { status: 500 }
    );
  }
}