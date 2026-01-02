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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");

    const companyId = user.companyId;

    // Parse dates for movements
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      currentStock: {},
      movements: {},
      alerts: {},
      valuation: {}
    };

    // Build where clause for products
    const productWhere = {
      companyId,
      ...(categoryId && { categoryId })
    };

    // Get current stock levels
    const [products, categories, movements] = await Promise.all([
      // All products with current stock
      prisma.product.findMany({
        where: productWhere,
        include: {
          category: true,
          _count: {
            select: {
              inventoryMovements: {
                where: {
                  createdAt: {
                    gte: start,
                    lte: end
                  }
                }
              }
            }
          }
        },
        orderBy: {
          stock: "asc"
        }
      }),

      // Categories summary
      prisma.category.findMany({
        where: {
          companyId,
          ...(categoryId && { id: categoryId })
        },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      }),

      // Stock movements in period
      prisma.inventoryMovement.findMany({
        where: {
          product: productWhere,
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          product: {
            select: {
              name: true,
              code: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 100
      })
    ]);

    // Calculate stock statistics
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    const overStockProducts = products.filter(p => p.maxStock && p.stock > p.maxStock);

    // Calculate total inventory value
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

    // Group movements by type
    const movementsByType = movements.reduce((acc, mov) => {
      if (!acc[mov.type]) {
        acc[mov.type] = {
          count: 0,
          totalQuantity: 0,
          items: []
        };
      }
      acc[mov.type].count++;
      acc[mov.type].totalQuantity += Math.abs(mov.quantity);
      if (acc[mov.type].items.length < 10) {
        acc[mov.type].items.push({
          id: mov.id,
          product: mov.product.name,
          code: mov.product.code,
          quantity: mov.quantity,
          type: mov.type,
          reference: mov.reference,
          notes: mov.notes,
          user: mov.user ? `${mov.user.firstName} ${mov.user.lastName}` : "Sistema",
          createdAt: mov.createdAt
        });
      }
      return acc;
    }, {});

    // Most moved products
    const productMovements = movements.reduce((acc, mov) => {
      const key = mov.productId;
      if (!acc[key]) {
        acc[key] = {
          product: mov.product,
          in: 0,
          out: 0,
          total: 0
        };
      }
      if (mov.quantity > 0) {
        acc[key].in += mov.quantity;
      } else {
        acc[key].out += Math.abs(mov.quantity);
      }
      acc[key].total++;
      return acc;
    }, {});

    const topMovedProducts = Object.values(productMovements)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(item => ({
        name: item.product.name,
        code: item.product.code,
        movements: item.total,
        inQuantity: item.in,
        outQuantity: item.out
      }));

    // Category distribution
    const categoryStats = categories.map(cat => {
      const categoryProducts = products.filter(p => p.categoryId === cat.id);
      const categoryValue = categoryProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
      const categoryStock = categoryProducts.reduce((sum, p) => sum + p.stock, 0);

      return {
        name: cat.name,
        productCount: cat._count.products,
        totalStock: categoryStock,
        totalValue: categoryValue,
        lowStockCount: categoryProducts.filter(p => p.stock <= p.minStock).length
      };
    });

    // Build report response
    report.currentStock = {
      totalProducts: products.length,
      totalItems: products.reduce((sum, p) => sum + p.stock, 0),
      totalValue,
      averageValue: products.length > 0 ? totalValue / products.length : 0,
      byCategory: categoryStats
    };

    report.movements = {
      total: movements.length,
      byType: movementsByType,
      topProducts: topMovedProducts,
      recentMovements: movements.slice(0, 20).map(mov => ({
        id: mov.id,
        product: mov.product.name,
        code: mov.product.code,
        quantity: mov.quantity,
        type: mov.type,
        reference: mov.reference,
        notes: mov.notes,
        user: mov.user ? `${mov.user.firstName} ${mov.user.lastName}` : "Sistema",
        createdAt: mov.createdAt
      }))
    };

    report.alerts = {
      lowStock: {
        count: lowStockProducts.length,
        products: lowStockProducts.slice(0, 20).map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          stock: p.stock,
          minStock: p.minStock,
          category: p.category?.name || "Sin categoría",
          value: p.stock * p.price
        }))
      },
      outOfStock: {
        count: outOfStockProducts.length,
        products: outOfStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          category: p.category?.name || "Sin categoría",
          lastMovement: p._count.inventoryMovements > 0 ? "Con movimientos" : "Sin movimientos"
        }))
      },
      overStock: {
        count: overStockProducts.length,
        products: overStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          stock: p.stock,
          maxStock: p.maxStock,
          excess: p.stock - p.maxStock,
          category: p.category?.name || "Sin categoría",
          value: p.stock * p.price
        }))
      }
    };

    report.valuation = {
      totalValue,
      byCategory: categoryStats.map(cat => ({
        category: cat.name,
        value: cat.totalValue,
        percentage: totalValue > 0 ? (cat.totalValue / totalValue * 100).toFixed(1) : 0
      })),
      topValueProducts: products
        .map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          stock: p.stock,
          unitPrice: p.price,
          totalValue: p.stock * p.price,
          category: p.category?.name || "Sin categoría"
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10)
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte de inventario" },
      { status: 500 }
    );
  }
}