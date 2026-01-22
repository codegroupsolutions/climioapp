import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/utils/auth";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";
const { sendInvoiceEmail } = require("@/lib/emailService");

// POST /api/invoices/[id]/send - Send invoice by email (ADMIN only)
export async function POST(request, context) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Only ADMIN can send invoices by email
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Solo administradores pueden enviar facturas por email" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    const { email } = body;

    // Get invoice with all details
    const invoice = await prisma.invoice.findFirst({
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

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Use client email if not provided
    const recipientEmail = email || invoice.client.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "El cliente no tiene email configurado" },
        { status: 400 }
      );
    }

    // Prepare CC emails: user email and company email
    const ccEmails = [];
    if (user.email) {
      ccEmails.push(user.email);
    }
    if (invoice.company.email && invoice.company.email !== user.email) {
      ccEmails.push(invoice.company.email);
    }

    // Log for debugging
    console.log('Invoice email recipients:', {
      to: recipientEmail,
      cc: ccEmails,
      userEmail: user.email,
      companyEmail: invoice.company.email
    });

    // Generate PDF
    let pdfBuffer = null;
    try {
      const doc = await generateInvoicePDF(invoice);
      const pdfOutput = doc.output('arraybuffer');
      pdfBuffer = Buffer.from(pdfOutput);
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      // Continue without PDF if generation fails
    }

    // Send email
    const clientName = invoice.client.name || `${invoice.client.firstName} ${invoice.client.lastName}`;
    const emailResult = await sendInvoiceEmail(
      recipientEmail,
      invoice.number,
      clientName,
      invoice.total.toFixed(2),
      pdfBuffer,
      ccEmails
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Error al enviar email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    const ccMessage = ccEmails.length > 0 
      ? ` Copias enviadas a: ${ccEmails.join(', ')}`
      : '';

    return NextResponse.json({
      success: true,
      message: `Factura enviada exitosamente a ${recipientEmail}.${ccMessage}`,
      messageId: emailResult.messageId,
      sentTo: recipientEmail,
      cc: ccEmails
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json(
      { error: "Error al enviar factura" },
      { status: 500 }
    );
  }
}
