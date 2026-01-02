import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";
import bcrypt from "bcryptjs";

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const profile = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Error al obtener perfil de usuario" },
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

    const body = await request.json();

    // Build update data
    const updateData = {};

    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.email) updateData.email = body.email;

    // Check if email is already taken by another user
    if (body.email && body.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: body.email
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "El correo electrónico ya está en uso" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        active: true
      }
    });

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil de usuario" },
      { status: 500 }
    );
  }
}

// Change password endpoint
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

    // Validate required fields
    if (!body.currentPassword || !body.newPassword || !body.confirmPassword) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validate new passwords match
    if (body.newPassword !== body.confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas nuevas no coinciden" },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: {
        id: user.id
      }
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      body.currentPassword,
      userWithPassword.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: hashedPassword
      }
    });

    return NextResponse.json({
      message: "Contraseña actualizada exitosamente"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Error al cambiar la contraseña" },
      { status: 500 }
    );
  }
}