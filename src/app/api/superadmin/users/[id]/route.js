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

// DELETE /api/superadmin/users/[id] - Delete a user
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

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        company: true
      }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Check if it's the last admin of the company
    if (userToDelete.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          companyId: userToDelete.companyId,
          role: 'ADMIN',
          active: true
        }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede eliminar el último administrador de la compañía" },
          { status: 400 }
        );
      }
    }

    // Delete the user
    await prisma.user.delete({
      where: { id }
    });

    // Log the action
    await prisma.subscriptionHistory.create({
      data: {
        action: 'USER_DELETED',
        companyId: userToDelete.companyId,
        userId: user.id,
        notes: `Usuario ${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email}) eliminado por SuperAdmin`
      }
    });

    return NextResponse.json({
      message: "Usuario eliminado exitosamente",
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        name: `${userToDelete.firstName} ${userToDelete.lastName}`
      }
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}

// PUT /api/superadmin/users/[id] - Update a user
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
    const { firstName, lastName, email, role, active } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email }
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: "Ya existe otro usuario con ese email" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(role && { role }),
        ...(active !== undefined && { active })
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}