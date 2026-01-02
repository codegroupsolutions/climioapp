import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// GET /api/superadmin/subscription-plans - Get all subscription plans
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

    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { companies: true }
        }
      }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Error al obtener planes de suscripción" },
      { status: 500 }
    );
  }
}

// POST /api/superadmin/subscription-plans - Create a new subscription plan
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

    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, type, description, price, maxUsers, features } = body;

    // Validate required fields
    if (!name || !type || maxUsers === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Check if plan name already exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { name }
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: "Ya existe un plan con ese nombre" },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        type,
        description,
        price: parseFloat(price) || 0,
        maxUsers: parseInt(maxUsers),
        features: features || [],
        isActive: true
      }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return NextResponse.json(
      { error: "Error al crear plan de suscripción" },
      { status: 500 }
    );
  }
}

// PUT /api/superadmin/subscription-plans - Update a subscription plan
export async function PUT(request) {
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

    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, type, description, price, maxUsers, features, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID del plan requerido" },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(maxUsers !== undefined && { maxUsers: parseInt(maxUsers) }),
        ...(features !== undefined && { features }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return NextResponse.json(
      { error: "Error al actualizar plan de suscripción" },
      { status: 500 }
    );
  }
}