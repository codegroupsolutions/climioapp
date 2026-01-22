import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/utils/auth";
import { parseInputDate } from "@/utils/dateUtils";

// GET /api/invoices/[id] - Get a single invoice
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
    const invoice = await prisma.invoice.findFirst({
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
        quote: {
          select: {
            id: true,
            number: true,
          },
        },
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Error al obtener factura" },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update an invoice
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
      date,
      dueDate,
      items,
      notes,
      discount = 0,
      taxRate = company?.taxRate || 16, // Use company tax rate or default to 16%
      type,
    } = body;

    // Check if invoice exists and belongs to the company
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Only allow editing if invoice is PENDING, unless user is ADMIN
    const userIsAdmin = isAdmin(user);
    if (existingInvoice.status !== "PENDING" && !userIsAdmin) {
      return NextResponse.json(
        { error: "Solo se pueden editar facturas pendientes" },
        { status: 400 }
      );
    }

    // Calculate new totals
    let subtotal = 0;
    const invoiceItems = [];

    for (const item of items) {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;

      invoiceItems.push({
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

    // Update invoice in a transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      });

      // Update invoice and create new items
      return await tx.invoice.update({
        where: { id: params.id },
        data: {
          type: type || undefined,
          date: date ? parseInputDate(date) : undefined,
          dueDate: dueDate ? parseInputDate(dueDate) : undefined,
          subtotal,
          tax,
          discount: discountAmount,
          total,
          notes,
          items: {
            create: invoiceItems,
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

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Error al actualizar factura" },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
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

    // Check if invoice exists and belongs to the company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        payments: true,
        quote: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Don't allow deletion if invoice has payments
    if (invoice.payments && invoice.payments.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una factura con pagos registrados" },
        { status: 400 }
      );
    }

    // Don't allow deletion of paid invoices
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "No se puede eliminar una factura pagada" },
        { status: 400 }
      );
    }

    // Delete invoice in a transaction
    await prisma.$transaction(async (tx) => {
      // If invoice was created from a quote, revert quote status
      if (invoice.quoteId) {
        await tx.quote.update({
          where: { id: invoice.quoteId },
          data: {
            // Optionally revert quote status to SENT
            status: "SENT",
          },
        });
      }

      // If invoice was not cancelled, restore inventory
      if (invoice.status !== "CANCELLED") {
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
                  reason: `Eliminación de factura ${invoice.number}`,
                  previousStock: product.stock,
                  newStock: newStock,
                  userId: user.id,
                  companyId: user.companyId,
                },
              });
            }
          }
        }
      }

      // Delete invoice (items will be cascade deleted)
      await tx.invoice.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ message: "Factura eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Error al eliminar factura" },
      { status: 500 }
    );
  }
}