import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth";

// GET /api/products - Get all products for the company
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
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const lowStock = searchParams.get("lowStock") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build filters
    const where = {
      companyId: user.companyId,
      active: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(lowStock && {
        stock: {
          lte: prisma.raw("minStock"),
        },
      }),
    };

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              inventoryMovements: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Check for low stock alerts
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      alerts: {
        lowStock: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          stock: p.stock,
          minStock: p.minStock,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
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
      code,
      name,
      description,
      categoryId,
      cost,
      price,
      stock = 0,
      minStock = 0,
      unit = "pza",
      imageUrl,
    } = body;

    // Validate required fields
    if (!name || !categoryId || cost === undefined || price === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Validate numeric values
    if (cost < 0 || price < 0 || stock < 0 || minStock < 0) {
      return NextResponse.json(
        { error: "Los valores numéricos deben ser positivos" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        companyId: user.companyId,
        active: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 400 }
      );
    }

    // Check for duplicate product code
    if (code) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          companyId: user.companyId,
          code,
          active: true,
        },
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: "Ya existe un producto con este código" },
          { status: 400 }
        );
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        code,
        name,
        description,
        categoryId,
        cost: parseFloat(cost),
        price: parseFloat(price),
        stock: parseInt(stock),
        minStock: parseInt(minStock),
        unit,
        imageUrl,
        companyId: user.companyId,
      },
      include: {
        category: true,
      },
    });

    // Create initial inventory movement if stock > 0
    if (stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          type: "IN",
          quantity: parseInt(stock),
          reason: "Inventario inicial",
          previousStock: 0,
          newStock: parseInt(stock),
          productId: product.id,
          companyId: user.companyId,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}