import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper function to verify superadmin
async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('superadmin-token')?.value;

  if (!token || !process.env.NEXTAUTH_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    if (decoded.role !== 'SUPER_ADMIN') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/superadmin/companies/[id] - Get company details
export async function GET(request, { params }) {
  try {
    const user = await verifySuperAdmin();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        subscriptionPlan: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            active: true,
            createdAt: true
          }
        },
        subscriptionHistories: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            plan: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true,
            clients: true,
            invoices: true,
            quotes: true,
            appointments: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: "Compañía no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Error al obtener compañía" },
      { status: 500 }
    );
  }
}

// PUT /api/superadmin/companies/[id] - Update company
export async function PUT(request, { params }) {
  try {
    const user = await verifySuperAdmin();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      taxId,
      active,
      subscriptionPlanId,
      subscriptionStatus,
      maxUsers
    } = body;

    // Get current company data
    const currentCompany = await prisma.company.findUnique({
      where: { id },
      include: {
        subscriptionPlan: true
      }
    });

    if (!currentCompany) {
      return NextResponse.json(
        { error: "Compañía no encontrada" },
        { status: 404 }
      );
    }

    // Check if plan is changing
    const planChanged = subscriptionPlanId && subscriptionPlanId !== currentCompany.subscriptionPlanId;

    let newPlan = null;
    if (planChanged) {
      newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscriptionPlanId }
      });
    }

    // Update company
    const updatedCompany = await prisma.$transaction(async (tx) => {
      const company = await tx.company.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(zipCode !== undefined && { zipCode }),
          ...(taxId !== undefined && { taxId }),
          ...(active !== undefined && { active }),
          ...(subscriptionPlanId !== undefined && { subscriptionPlanId }),
          ...(subscriptionStatus && { subscriptionStatus }),
          ...(maxUsers !== undefined && { maxUsers: parseInt(maxUsers) }),
          ...(planChanged && {
            subscriptionStartDate: new Date(),
            maxUsers: newPlan?.maxUsers || maxUsers
          })
        },
        include: {
          subscriptionPlan: true
        }
      });

      // Create subscription history if plan changed
      if (planChanged) {
        await tx.subscriptionHistory.create({
          data: {
            action: currentCompany.subscriptionPlanId ? 'UPGRADED' : 'CREATED',
            previousPlan: currentCompany.subscriptionPlan?.name,
            newPlan: newPlan?.name,
            amount: newPlan?.price || 0,
            companyId: id,
            planId: subscriptionPlanId,
            userId: user.id,
            notes: `Plan cambiado por SuperAdmin`
          }
        });
      }

      // Create history if status changed
      if (subscriptionStatus && subscriptionStatus !== currentCompany.subscriptionStatus) {
        await tx.subscriptionHistory.create({
          data: {
            action: subscriptionStatus,
            companyId: id,
            userId: user.id,
            notes: `Estado de suscripción cambiado a ${subscriptionStatus}`
          }
        });
      }

      return company;
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Error al actualizar compañía" },
      { status: 500 }
    );
  }
}

// DELETE /api/superadmin/companies/[id] - Delete company
export async function DELETE(request, { params }) {
  try {
    const user = await verifySuperAdmin();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Delete company (cascade will delete all related data)
    await prisma.company.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Compañía eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Error al eliminar compañía" },
      { status: 500 }
    );
  }
}