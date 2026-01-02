import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/quotes - Get all quotes for the company
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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filters
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

    // Get quotes with pagination
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
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
              type: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Error al obtener cotizaciones" },
      { status: 500 }
    );
  }
}

// POST /api/quotes - Create a new quote
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
      validUntil,
      items,
      notes,
      discount = 0,
      taxRate = company?.taxRate || 16, // Use company tax rate or default to 16%
    } = body;

    // Validate required fields
    if (!clientId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Cliente y al menos un item son requeridos" },
        { status: 400 }
      );
    }

    // Verify client exists and belongs to company
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        companyId: user.companyId,
        active: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Calculate totals
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

    // Generate quote number
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

    // Create quote with items
    const quote = await prisma.quote.create({
      data: {
        number: quoteNumber,
        clientId,
        userId: user.id,
        companyId: user.companyId,
        validUntil: validUntil ? new Date(validUntil) : null,
        status: "DRAFT",
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

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Error al crear cotización" },
      { status: 500 }
    );
  }
}