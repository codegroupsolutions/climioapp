import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
const { sendWelcomeEmail } = require("@/lib/emailService");

// GET /api/superadmin/companies - Get all companies
export async function GET(request) {
  try {
    // Check superadmin authentication using JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('superadmin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    let user;
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }
      user = decoded;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const planType = searchParams.get("planType") || "";

    // Build where clause
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { subscriptionStatus: status }),
      ...(planType && {
        subscriptionPlan: {
          type: planType
        }
      }),
    };

    const companies = await prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            users: true,
            clients: true,
            invoices: true,
          }
        }
      }
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Error al obtener compañías" },
      { status: 500 }
    );
  }
}

// POST /api/superadmin/companies - Create a new company with admin user
export async function POST(request) {
  try {
    // Check superadmin authentication using JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('superadmin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    let user;
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }
      user = decoded;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      // Company data
      companyName,
      companyEmail,
      companyPhone,
      address,
      city,
      state,
      zipCode,
      taxId,
      // Admin user data
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      // Subscription data
      subscriptionPlanId
    } = body;

    // Validate required fields
    if (!companyName || !companyEmail || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check if company email already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email: companyEmail }
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Ya existe una compañía con ese email" },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 400 }
      );
    }

    // Get subscription plan details if provided
    let plan = null;
    if (subscriptionPlanId) {
      plan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscriptionPlanId }
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail,
          phone: companyPhone,
          address,
          city,
          state,
          zipCode,
          taxId,
          active: true,
          subscriptionPlanId,
          subscriptionStatus: subscriptionPlanId ? 'ACTIVE' : 'TRIAL',
          subscriptionStartDate: new Date(),
          maxUsers: plan ? plan.maxUsers : 2, // Default to 2 for free plan
        }
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: 'ADMIN',
          active: true,
          companyId: company.id,
          emailVerified: new Date() // Mark as verified since created by super admin
        }
      });

      // Create subscription history entry
      if (subscriptionPlanId) {
        await tx.subscriptionHistory.create({
          data: {
            action: 'CREATED',
            newPlan: plan?.name,
            amount: plan?.price || 0,
            companyId: company.id,
            planId: subscriptionPlanId,
            userId: user.id,
            notes: `Compañía creada por SuperAdmin con plan ${plan?.name}`
          }
        });
      }

      return { company, adminUser };
    });

    // Send welcome email to the admin
    await sendWelcomeEmail(
      adminEmail,
      companyName,
      `${adminFirstName} ${adminLastName}`
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Error al crear compañía" },
      { status: 500 }
    );
  }
}