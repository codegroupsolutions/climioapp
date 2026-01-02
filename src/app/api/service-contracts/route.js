import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/service-contracts - Get all service contracts
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
    const serviceType = searchParams.get("serviceType") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      companyId: user.companyId,
      ...(search && {
        OR: [
          { contractNumber: { contains: search, mode: "insensitive" } },
          { client: { firstName: { contains: search, mode: "insensitive" } } },
          { client: { lastName: { contains: search, mode: "insensitive" } } },
          { client: { companyName: { contains: search, mode: "insensitive" } } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(serviceType && { serviceType }),
    };

    // Get total count
    const totalCount = await prisma.serviceContract.count({ where });

    // Get contracts
    const contracts = await prisma.serviceContract.findMany({
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
            phone: true,
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
      contracts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Error al obtener contratos" },
      { status: 500 }
    );
  }
}

// POST /api/service-contracts - Create a new service contract
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
      clientId,
      serviceType,
      startDate,
      endDate,
      serviceFrequency = "MONTHLY",
      frequencyValue = 1,
      amount = 0,
      description,
      terms,
      notes,
      autoRenew = false,
    } = body;

    // Validate required fields
    if (!clientId || !serviceType || !startDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Generate contract number
    const lastContract = await prisma.serviceContract.findFirst({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      select: { contractNumber: true },
    });

    let nextNumber = 1;
    if (lastContract && lastContract.contractNumber) {
      const match = lastContract.contractNumber.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    const contractNumber = `CON-${new Date().getFullYear()}-${String(nextNumber).padStart(5, '0')}`;

    // Calculate next service date based on frequency
    const calculateNextServiceDate = (start, frequency, value) => {
      const date = new Date(start);
      switch(frequency) {
        case 'WEEKLY':
          date.setDate(date.getDate() + (7 * value));
          break;
        case 'BIWEEKLY':
          date.setDate(date.getDate() + (14 * value));
          break;
        case 'MONTHLY':
          date.setMonth(date.getMonth() + value);
          break;
        case 'BIMONTHLY':
          date.setMonth(date.getMonth() + (2 * value));
          break;
        case 'QUARTERLY':
          date.setMonth(date.getMonth() + (3 * value));
          break;
        case 'SEMIANNUAL':
          date.setMonth(date.getMonth() + (6 * value));
          break;
        case 'ANNUAL':
          date.setFullYear(date.getFullYear() + value);
          break;
        default:
          return null;
      }
      return date;
    };

    const nextServiceDate = serviceFrequency !== 'ONE_TIME'
      ? calculateNextServiceDate(startDate, serviceFrequency, frequencyValue)
      : null;

    // Create contract
    const contract = await prisma.serviceContract.create({
      data: {
        contractNumber,
        clientId,
        serviceType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        serviceFrequency,
        frequencyValue: parseInt(frequencyValue),
        nextServiceDate,
        amount: parseFloat(amount),
        description,
        terms,
        notes,
        autoRenew,
        status: "ACTIVE",
        userId: user.id,
        companyId: user.companyId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
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

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Error al crear contrato" },
      { status: 500 }
    );
  }
}