import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";
import { generateQuotePDF } from "@/utils/generateQuotePDF";
import { jsPDF } from "jspdf";
const { sendQuoteEmail } = require("@/lib/emailService");

// POST /api/quotes/[id]/send - Send quote by email
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
    const body = await request.json();
    const { email, message } = body;

    // Get quote with all details
    const quote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        client: true,
        company: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    // Use client email if not provided
    const recipientEmail = email || quote.client.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "El cliente no tiene email configurado" },
        { status: 400 }
      );
    }

    // Format items for email template
    const formattedItems = quote.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: item.total
    }));

    // Generate PDF
    let pdfBuffer = null;
    try {
      // Generate the PDF document
      const doc = await generateQuotePDF(quote);

      // Convert PDF to buffer for email attachment
      const pdfOutput = doc.output('arraybuffer');
      pdfBuffer = Buffer.from(pdfOutput);
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      // Continue without PDF if generation fails
    }

    // Send email using centralized quote email function with PDF attachment
    const emailResult = await sendQuoteEmail(
      recipientEmail,
      quote.number,
      quote.client.name || `${quote.client.firstName} ${quote.client.lastName}`,
      quote.total.toFixed(2),
      new Date(quote.validUntil).toLocaleDateString('es-PR'),
      formattedItems,
      pdfBuffer
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Error al enviar email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    // Update quote status to SENT if it's currently DRAFT
    if (quote.status === "DRAFT") {
      await prisma.quote.update({
        where: { id: params.id },
        data: { status: "SENT" },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Cotización enviada exitosamente a ${recipientEmail}`,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error("Error sending quote:", error);
    return NextResponse.json(
      { error: "Error al enviar cotización" },
      { status: 500 }
    );
  }
}