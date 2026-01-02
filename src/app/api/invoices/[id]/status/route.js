import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// PATCH /api/invoices/[id]/status - Update invoice status
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
    const validStatuses = ["PENDING", "PAID", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // Check if invoice exists and belongs to the company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Handle inventory when cancelling an invoice
    let updatedInvoice;

    if (status === "CANCELLED" && invoice.status !== "CANCELLED") {
      // If cancelling invoice, restore inventory in a transaction
      updatedInvoice = await prisma.$transaction(async (tx) => {
        // Update invoice status
        const updated = await tx.invoice.update({
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

        // Restore inventory for items that have products
        for (const item of invoice.items) {
          if (item.productId) {
            // Get current product stock
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, name: true },
            });

            if (product) {
              const newStock = product.stock + item.quantity;

              // Update product stock
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: newStock },
              });

              // Create inventory movement record
              await tx.inventoryMovement.create({
                data: {
                  productId: item.productId,
                  quantity: item.quantity,
                  type: 'IN',
                  reason: `Cancelación de factura ${invoice.number}`,
                  previousStock: product.stock,
                  newStock: newStock,
                  userId: user.id,
                  companyId: user.companyId,
                },
              });
            }
          }
        }

        return updated;
      });
    } else {
      // Normal status update without inventory changes
      updatedInvoice = await prisma.invoice.update({
        where: { id: params.id },
        data: {
          status,
          // If marking as paid, set paidAmount to total
          ...(status === "PAID" && { paidAmount: invoice.total }),
        },
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
    }

    return NextResponse.json({
      invoice: updatedInvoice,
      message: `Factura marcada como ${status}`,
    });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de la factura" },
      { status: 500 }
    );
  }
}