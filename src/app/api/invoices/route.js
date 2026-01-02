import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";
import { parseInputDate } from "@/utils/dateUtils";

// GET /api/invoices - Get all invoices with pagination and filters
export async function GET(request) {
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
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const clientId = searchParams.get("clientId") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      companyId: user.companyId,
      ...(search && {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { client: { firstName: { contains: search, mode: "insensitive" } } },
          { client: { lastName: { contains: search, mode: "insensitive" } } },
          { client: { companyName: { contains: search, mode: "insensitive" } } },
        ],
      }),
      ...(status && { status }),
      ...(clientId && { clientId }),
    };

    // If user is a technician, only show invoices they created
    if (user.role === 'TECHNICIAN') {
      where.userId = user.id;
    }

    // Get total count
    const totalCount = await prisma.invoice.count({ where });

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
        quote: {
          select: {
            id: true,
            number: true,
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

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Error al obtener facturas" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Get company tax rate
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { taxRate: true }
    });

    const {
      clientId,
      quoteId,
      date,
      dueDate,
      items,
      notes,
      discount = 0,
      taxRate = company?.taxRate || 16, // Use company tax rate or default to 16%
      paymentTerms = 30,
      type = 'SERVICE',
    } = body;

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.number) {
      const match = lastInvoice.number.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(nextNumber).padStart(5, '0')}`;

    // Calculate totals
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

    // Calculate invoice date and due date using parseInputDate to avoid timezone issues
    const invoiceDate = date ? parseInputDate(date) : new Date();
    const calculatedDueDate = dueDate
      ? parseInputDate(dueDate)
      : new Date(invoiceDate.getTime() + paymentTerms * 24 * 60 * 60 * 1000);

    // Create invoice in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          type,
          clientId,
          userId: user.id,
          companyId: user.companyId,
          quoteId: quoteId || null,
          status: "PENDING",
          date: invoiceDate,
          subtotal,
          tax,
          discount: discountAmount,
          total,
          dueDate: calculatedDueDate,
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

      // If created from a quote, mark the quote as accepted
      if (quoteId) {
        await tx.quote.update({
          where: { id: quoteId },
          data: {
            status: "ACCEPTED", // Mark quote as accepted when invoice is created
          },
        });
      }

      // Deduct inventory for items that have products
      for (const item of invoiceItems) {
        if (item.productId) {
          // Get current product stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, name: true },
          });

          if (product) {
            const newStock = product.stock - item.quantity;

            // Check if we have enough stock
            if (newStock < 0) {
              throw new Error(`Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}, Requerido: ${item.quantity}`);
            }

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
                type: 'OUT',
                reason: `Factura ${invoiceNumber}`,
                previousStock: product.stock,
                newStock: newStock,
                userId: user.id,
                companyId: user.companyId,
              },
            });
          }
        }
      }

      return newInvoice;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Error al crear factura" },
      { status: 500 }
    );
  }
}