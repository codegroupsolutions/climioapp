import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";
import { parseInputDate } from "@/utils/dateUtils";

// POST /api/invoices/[id]/payments - Record a payment for an invoice
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
    const { amount, method = 'CASH', paidAt, notes } = body;

    // Check if invoice exists and belongs to the company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Calculate what has been paid so far
    const currentlyPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const paymentAmount = parseFloat(amount);
    const totalPaid = currentlyPaid + paymentAmount;
    const remainingBalance = invoice.total - currentlyPaid;

    // Check if payment exceeds remaining balance (with small tolerance for floating-point)
    const tolerance = 0.01; // Allow 1 cent tolerance
    if (paymentAmount > remainingBalance + tolerance) {
      return NextResponse.json(
        { error: `El pago excede el saldo pendiente de ${new Intl.NumberFormat('es-PR', { style: 'currency', currency: 'USD' }).format(remainingBalance)}` },
        { status: 400 }
      );
    }

    // Create payment and update invoice in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          amount: parseFloat(amount),
          method: method,
          paidAt: paidAt ? parseInputDate(paidAt) : new Date(),
          notes,
          status: "COMPLETED",
          invoiceId: params.id,
        },
      });

      // Update invoice paidAmount and status
      const updatedInvoice = await tx.invoice.update({
        where: { id: params.id },
        data: {
          paidAmount: totalPaid,
          // Mark as paid if fully paid (with tolerance for floating-point)
          status: Math.abs(totalPaid - invoice.total) < 0.01 || totalPaid >= invoice.total ? "PAID" : "PENDING",
        },
        include: {
          payments: {
            orderBy: { paidAt: "desc" },
          },
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Error al registrar el pago" },
      { status: 500 }
    );
  }
}