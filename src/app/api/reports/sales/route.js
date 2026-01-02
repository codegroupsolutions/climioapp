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
    const type = searchParams.get("type") || "all"; // all, quotes, invoices

    const companyId = user.companyId;

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      quotes: {},
      invoices: {},
      summary: {}
    };

    // Get quotes data
    if (type === "all" || type === "quotes") {
      const [quotes, quotesStats, topQuotedProducts] = await Promise.all([
        // All quotes in period
        prisma.quote.findMany({
          where: {
            companyId,
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    code: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }),

        // Quote statistics by status
        prisma.quote.groupBy({
          by: ["status"],
          where: {
            companyId,
            createdAt: {
              gte: start,
              lte: end
            }
          },
          _count: true,
          _sum: {
            total: true
          }
        }),

        // Top quoted products
        prisma.$queryRaw`
          SELECT
            qi."productId",
            SUM(qi."quantity")::int as quantity,
            SUM(qi."total")::float as total
          FROM "QuoteItem" qi
          INNER JOIN "Quote" q ON qi."quoteId" = q."id"
          WHERE q."companyId" = ${companyId}
            AND q."createdAt" >= ${start}
            AND q."createdAt" <= ${end}
            AND qi."productId" IS NOT NULL
          GROUP BY qi."productId"
        `
      ]);

      // Get product details for top products
      const productDetails = await prisma.product.findMany({
        where: {
          id: {
            in: topQuotedProducts.map(p => p.productId).filter(Boolean)
          }
        },
        select: {
          id: true,
          name: true,
          code: true
        }
      });

      const productMap = Object.fromEntries(
        productDetails.map(p => [p.id, p])
      );

      // Sort top products by total and take top 10
      const sortedTopProducts = topQuotedProducts
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .slice(0, 10);

      report.quotes = {
        total: quotes.length,
        totalAmount: quotes.reduce((sum, q) => sum + q.total, 0),
        byStatus: quotesStats.map(stat => ({
          status: stat.status,
          count: stat._count,
          total: stat._sum.total || 0
        })),
        topProducts: sortedTopProducts.map(item => ({
          product: productMap[item.productId] || { name: "Unknown", code: "" },
          quantity: item.quantity,
          total: item.total
        })),
        recentQuotes: quotes.slice(0, 10).map(q => ({
          id: q.id,
          number: q.number,
          client: q.client.companyName || `${q.client.firstName} ${q.client.lastName}`,
          date: q.createdAt,
          total: q.total,
          status: q.status
        }))
      };
    }

    // Get invoices data
    if (type === "all" || type === "invoices") {
      const [invoices, invoicesStats, paymentStats] = await Promise.all([
        // All invoices in period
        prisma.invoice.findMany({
          where: {
            companyId,
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true
              }
            },
            payments: true,
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    code: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }),

        // Invoice statistics by status
        prisma.invoice.groupBy({
          by: ["status"],
          where: {
            companyId,
            createdAt: {
              gte: start,
              lte: end
            }
          },
          _count: true,
          _sum: {
            total: true
          }
        }),

        // Payment statistics
        prisma.payment.aggregate({
          where: {
            invoice: {
              companyId,
              createdAt: {
                gte: start,
                lte: end
              }
            }
          },
          _sum: {
            amount: true
          },
          _count: true
        })
      ]);

      report.invoices = {
        total: invoices.length,
        totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
        totalPaid: paymentStats._sum.amount || 0,
        totalPending: invoices
          .filter(i => i.status === "PENDING")
          .reduce((sum, i) => sum + i.total, 0),
        byStatus: invoicesStats.map(stat => ({
          status: stat.status,
          count: stat._count,
          total: stat._sum.total || 0
        })),
        paymentMethods: await getPaymentMethodStats(companyId, start, end),
        recentInvoices: invoices.slice(0, 10).map(i => ({
          id: i.id,
          number: i.number,
          client: i.client.companyName || `${i.client.firstName} ${i.client.lastName}`,
          date: i.createdAt,
          dueDate: i.dueDate,
          total: i.total,
          status: i.status,
          paidAmount: i.payments.reduce((sum, p) => sum + p.amount, 0)
        }))
      };
    }

    // Calculate summary
    report.summary = {
      totalRevenue: report.invoices?.totalPaid || 0,
      pendingRevenue: report.invoices?.totalPending || 0,
      quotesConverted: await getConversionRate(companyId, start, end),
      averageQuoteValue: report.quotes?.total > 0
        ? report.quotes.totalAmount / report.quotes.total
        : 0,
      averageInvoiceValue: report.invoices?.total > 0
        ? report.invoices.totalAmount / report.invoices.total
        : 0
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating sales report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte de ventas" },
      { status: 500 }
    );
  }
}

async function getPaymentMethodStats(companyId, start, end) {
  const payments = await prisma.payment.groupBy({
    by: ["method"],
    where: {
      invoice: {
        companyId,
        createdAt: {
          gte: start,
          lte: end
        }
      }
    },
    _sum: {
      amount: true
    },
    _count: true
  });

  return payments.map(p => ({
    method: p.method,
    count: p._count,
    total: p._sum.amount || 0
  }));
}

async function getConversionRate(companyId, start, end) {
  const quotesWithInvoices = await prisma.quote.count({
    where: {
      companyId,
      createdAt: {
        gte: start,
        lte: end
      },
      invoice: {
        isNot: null
      }
    }
  });

  const totalQuotes = await prisma.quote.count({
    where: {
      companyId,
      createdAt: {
        gte: start,
        lte: end
      }
    }
  });

  return totalQuotes > 0 ? (quotesWithInvoices / totalQuotes * 100).toFixed(1) : 0;
}