import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/auth";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export async function POST(request) {
  try {
    // Rate limiting - prevent mass account creation
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'register', RATE_LIMIT_PRESETS.auth);

    if (rateLimit.limited) {
      return rateLimitResponse(rateLimit.resetIn);
    }

    const body = await request.json();
    const {
      // Company data
      companyName,
      // Admin user data
      adminName,
      adminEmail,
      adminPassword,
    } = body;

    // Validate required fields
    if (!companyName || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (adminPassword.length < 8 || !passwordRegex.test(adminPassword)) {
      return NextResponse.json(
        { error: "La contraseña debe incluir mayúscula, minúscula, número y símbolo y tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Parse admin name
    const nameParts = adminName.trim().split(' ');
    const firstName = nameParts[0] || adminName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if company name already exists
    const existingCompany = await prisma.company.findFirst({
      where: { name: companyName },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Ya existe una empresa con este nombre" },
        { status: 400 }
      );
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo electrónico" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(adminPassword);

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: adminEmail, // Use admin email as company email initially
          phone: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          taxId: null,
        },
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName,
          lastName,
          phone: null,
          role: "ADMIN",
          companyId: company.id,
        },
      });

      // Create default categories for the company
      await tx.category.createMany({
        data: [
          { name: "Equipos", description: "Aires acondicionados y equipos principales", companyId: company.id },
          { name: "Repuestos", description: "Partes y repuestos para equipos", companyId: company.id },
          { name: "Consumibles", description: "Materiales consumibles y accesorios", companyId: company.id },
          { name: "Herramientas", description: "Herramientas de trabajo", companyId: company.id },
        ],
      });

      return { company, adminUser };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Empresa y usuario administrador creados exitosamente",
        companyId: result.company.id,
        userId: result.adminUser.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering company:", error);
    return NextResponse.json(
      { error: "Error al registrar la empresa. Por favor intente nuevamente." },
      { status: 500 }
    );
  }
}
