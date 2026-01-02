import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/clients - Get all clients for the company
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
    const type = searchParams.get("type");
    const technicianId = searchParams.get("technicianId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filters
    let where = {
      companyId: user.companyId,
      active: true,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { companyName: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(type && { type }),
    };

    // If technicianId is provided (for TECHNICIAN role), filter clients by assigned appointments
    if (technicianId) {
      where = {
        ...where,
        appointments: {
          some: {
            technicianId: technicianId
          }
        }
      };
    }

    // Get clients with pagination
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          quotes: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              number: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
          invoices: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              number: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
          appointments: {
            where: {
              startDate: {
                gte: new Date(),
              },
              ...(technicianId && { technicianId: technicianId }),
            },
            take: 3,
            orderBy: { startDate: "asc" },
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              status: true,
              technicianId: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
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
    const {
      firstName,
      lastName,
      email,
      phone,
      alternativePhone,
      type = "RESIDENTIAL",
      companyName,
      contactPerson,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      notes,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !address || !city || !state) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Validate phone format (Mexican format)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Formato de teléfono inválido" },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Formato de email inválido" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate client (same phone and company)
    const existingClient = await prisma.client.findFirst({
      where: {
        companyId: user.companyId,
        phone,
        active: true,
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Ya existe un cliente con este teléfono" },
        { status: 400 }
      );
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        alternativePhone,
        type,
        companyName,
        contactPerson,
        address,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        notes,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    );
  }
}