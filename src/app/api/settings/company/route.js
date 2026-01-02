import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Only admins can access company settings
    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta configuración" },
        { status: 403 }
      );
    }

    const company = await prisma.company.findUnique({
      where: {
        id: user.companyId
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración de la empresa" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Only admins can update company settings
    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      return NextResponse.json(
        { error: "No tienes permisos para modificar esta configuración" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "El nombre de la empresa es requerido" },
        { status: 400 }
      );
    }

    // Validate tax rate if provided
    if (body.taxRate !== undefined) {
      if (body.taxRate < 0 || body.taxRate > 100) {
        return NextResponse.json(
          { error: "La tasa de IVU debe estar entre 0 y 100" },
          { status: 400 }
        );
      }
    }

    const company = await prisma.company.update({
      where: {
        id: user.companyId
      },
      data: {
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        logo: body.logo || null,
        taxRate: body.taxRate !== undefined ? body.taxRate : undefined
      }
    });

    return NextResponse.json({
      message: "Configuración actualizada exitosamente",
      company
    });
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración de la empresa" },
      { status: 500 }
    );
  }
}