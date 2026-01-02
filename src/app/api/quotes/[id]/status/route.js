import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// PATCH /api/quotes/[id]/status - Update quote status
export async function PATCH(request, context) {
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
    const { status } = body;

    // Validate status
    const validStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // Check if quote exists and belongs to the company
    const quote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    // Validate status transitions
    const currentStatus = quote.status;
    const invalidTransitions = {
      ACCEPTED: ["DRAFT"], // Can't go back to draft from accepted
      REJECTED: ["DRAFT", "ACCEPTED"], // Can't change rejected quotes
    };

    if (invalidTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${currentStatus} a ${status}` },
        { status: 400 }
      );
    }

    // Update quote status
    const updatedQuote = await prisma.quote.update({
      where: { id: params.id },
      data: { status },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    // If quote is accepted, you could trigger additional actions here
    // like sending a confirmation email or creating a follow-up task

    return NextResponse.json({
      quote: updatedQuote,
      message: `Cotización marcada como ${status}`,
    });
  } catch (error) {
    console.error("Error updating quote status:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de la cotización" },
      { status: 500 }
    );
  }
}