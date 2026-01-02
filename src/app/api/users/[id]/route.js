import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/utils/auth";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

// GET /api/users/[id] - Get a single user
export async function GET(request, context) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const user = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId: currentUser.companyId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request, context) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      active,
      password,
    } = body;

    // Check if user exists and belongs to the company
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId: currentUser.companyId,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Only admins can update users (except own profile)
    if (currentUser.role !== "ADMIN" && currentUser.id !== params.id) {
      return NextResponse.json(
        { error: "Sin permisos para actualizar este usuario" },
        { status: 403 }
      );
    }

    // If email is being changed, check if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(active !== undefined && { active }),
    };

    // Only admins can change roles
    if (role !== undefined && currentUser.role === "ADMIN") {
      updateData.role = role;
    }

    // Handle password update
    if (password) {
      if (password.length < 8 || !passwordRegex.test(password)) {
        return NextResponse.json(
          { error: "La contraseña debe incluir mayúscula, minúscula, número y símbolo y tener al menos 8 caracteres" },
          { status: 400 }
        );
      }

      // Hash the password using the same function as registration
      const hashedPassword = await hashPassword(password);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        active: true,
      },
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

// DELETE /api/users/[id] - Delete (deactivate) a user
export async function DELETE(request, context) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Only admins can delete users
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sin permisos para eliminar usuarios" },
        { status: 403 }
      );
    }

    const params = await context.params;

    // Check if user exists and belongs to the company
    const user = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId: currentUser.companyId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Don't allow deleting yourself
    if (user.id === currentUser.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 400 }
      );
    }

    // Soft delete (deactivate) the user
    await prisma.user.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ message: "Usuario desactivado correctamente" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
