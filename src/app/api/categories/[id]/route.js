import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// PUT /api/categories/[id] - Update a category
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Check if category exists and belongs to the company
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        active: true,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Check for duplicate name if name changed
    if (name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          companyId: user.companyId,
          name,
          active: true,
          NOT: { id: params.id },
        },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: "Ya existe otra categoría con este nombre" },
          { status: 400 }
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Error al actualizar categoría" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Soft delete a category
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Check if category exists and belongs to the company
    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
        active: true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Check if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar la categoría porque tiene productos asociados" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.category.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ message: "Categoría eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}