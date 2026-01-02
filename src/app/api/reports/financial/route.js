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
    const groupBy = searchParams.get("groupBy") || "month"; // day, week, month

    const companyId = user.companyId;

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      revenue: {},
      expenses: {},
      cashFlow: {},
      accounts: {},
      taxes: {}
    };

    // Get revenue data
    const [invoices, payments, pendingInvoices] = await Promise.all([
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
          payments: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }),

      // All payments in period
      prisma.payment.findMany({
        where: {
          invoice: {
            companyId
          },
          paidAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          invoice: {
            include: {
              client: {
                select: {
                  firstName: true,
                  lastName: true,
                  companyName: true
                }
              }
            }
          }
        },
        orderBy: {
          paidAt: "asc"
        }
      }),

      // Pending invoices (all time, not just in period)
      prisma.invoice.findMany({
        where: {
          companyId,
          status: "PENDING"
        },
        include: {
          payments: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true
            }
          }
        }
      })
    ]);

    // Calculate revenue metrics
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
    const totalPending = pendingInvoices.reduce((sum, i) => {
      const paid = i.payments.reduce((s, p) => s + p.amount, 0);
      return sum + (i.total - paid);
    }, 0);

    // Group revenue by period
    const revenueByPeriod = groupDataByPeriod(payments, "paidAt", "amount", groupBy);
    const invoicesByPeriod = groupDataByPeriod(invoices, "createdAt", "total", groupBy);

    // Calculate tax summary
    const taxData = calculateTaxSummary(invoices);

    // Payment methods distribution
    const paymentMethods = payments.reduce((acc, payment) => {
      if (!acc[payment.method]) {
        acc[payment.method] = {
          count: 0,
          total: 0
        };
      }
      acc[payment.method].count++;
      acc[payment.method].total += payment.amount;
      return acc;
    }, {});

    // Top clients by revenue
    const clientRevenue = {};
    payments.forEach(payment => {
      const clientKey = payment.invoice.clientId;
      if (!clientRevenue[clientKey]) {
        clientRevenue[clientKey] = {
          client: payment.invoice.client,
          total: 0,
          count: 0
        };
      }
      clientRevenue[clientKey].total += payment.amount;
      clientRevenue[clientKey].count++;
    });

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(item => ({
        name: item.client.companyName || `${item.client.firstName} ${item.client.lastName}`,
        revenue: item.total,
        transactions: item.count
      }));

    // Overdue invoices
    const overdueInvoices = pendingInvoices
      .filter(i => new Date(i.dueDate) < new Date())
      .map(i => {
        const paid = i.payments.reduce((sum, p) => sum + p.amount, 0);
        const daysOverdue = Math.floor((new Date() - new Date(i.dueDate)) / (1000 * 60 * 60 * 24));
        return {
          id: i.id,
          number: i.number,
          client: i.client.companyName || `${i.client.firstName} ${i.client.lastName}`,
          total: i.total,
          paid,
          pending: i.total - paid,
          dueDate: i.dueDate,
          daysOverdue
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Build report response
    report.revenue = {
      total: totalRevenue,
      invoiced: totalInvoiced,
      pending: totalPending,
      collected: totalRevenue,
      collectionRate: totalInvoiced > 0 ? (totalRevenue / totalInvoiced * 100).toFixed(1) : 0,
      byPeriod: revenueByPeriod,
      invoicesByPeriod: invoicesByPeriod,
      averageInvoiceValue: invoices.length > 0 ? totalInvoiced / invoices.length : 0,
      averagePaymentValue: payments.length > 0 ? totalRevenue / payments.length : 0
    };

    report.cashFlow = {
      income: {
        total: totalRevenue,
        byMethod: Object.entries(paymentMethods).map(([method, data]) => ({
          method,
          count: data.count,
          total: data.total,
          percentage: totalRevenue > 0 ? (data.total / totalRevenue * 100).toFixed(1) : 0
        }))
      },
      projectedIncome: totalPending,
      netFlow: totalRevenue // In future, subtract expenses when expense tracking is implemented
    };

    report.accounts = {
      receivable: {
        total: totalPending,
        count: pendingInvoices.length,
        overdue: {
          total: overdueInvoices.reduce((sum, i) => sum + i.pending, 0),
          count: overdueInvoices.length,
          invoices: overdueInvoices.slice(0, 10)
        },
        aging: calculateAging(pendingInvoices)
      },
      topClients
    };

    report.taxes = taxData;

    // Monthly comparison
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0, 23, 59, 59);

    const [currentMonthRevenue, lastMonthRevenue] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          invoice: { companyId },
          paidAt: {
            gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
            lte: currentMonth
          }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          invoice: { companyId },
          paidAt: {
            gte: lastMonth,
            lte: lastMonthEnd
          }
        },
        _sum: { amount: true }
      })
    ]);

    report.comparison = {
      currentMonth: currentMonthRevenue._sum.amount || 0,
      lastMonth: lastMonthRevenue._sum.amount || 0,
      growth: lastMonthRevenue._sum.amount > 0
        ? ((currentMonthRevenue._sum.amount - lastMonthRevenue._sum.amount) / lastMonthRevenue._sum.amount * 100).toFixed(1)
        : 0
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte financiero" },
      { status: 500 }
    );
  }
}

function groupDataByPeriod(data, dateField, valueField, groupBy) {
  const grouped = {};

  data.forEach(item => {
    const date = new Date(item[dateField]);
    let key;

    switch (groupBy) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        total: 0,
        count: 0
      };
    }

    grouped[key].total += item[valueField];
    grouped[key].count++;
  });

  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}

function calculateTaxSummary(invoices) {
  let totalSubtotal = 0;
  let totalTax = 0;
  let totalWithTax = 0;

  invoices.forEach(invoice => {
    const subtotal = invoice.subtotal || invoice.total / 1.16;
    const tax = invoice.tax || invoice.total - subtotal;

    totalSubtotal += subtotal;
    totalTax += tax;
    totalWithTax += invoice.total;
  });

  return {
    subtotal: totalSubtotal,
    tax: totalTax,
    total: totalWithTax,
    taxRate: 16,
    invoicesWithTax: invoices.length
  };
}

function calculateAging(invoices) {
  const aging = {
    current: { count: 0, total: 0 },
    "1-30": { count: 0, total: 0 },
    "31-60": { count: 0, total: 0 },
    "61-90": { count: 0, total: 0 },
    "90+": { count: 0, total: 0 }
  };

  const today = new Date();

  invoices.forEach(invoice => {
    const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const pending = invoice.total - paid;

    if (pending <= 0) return;

    const dueDate = new Date(invoice.dueDate);
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
      aging.current.count++;
      aging.current.total += pending;
    } else if (daysOverdue <= 30) {
      aging["1-30"].count++;
      aging["1-30"].total += pending;
    } else if (daysOverdue <= 60) {
      aging["31-60"].count++;
      aging["31-60"].total += pending;
    } else if (daysOverdue <= 90) {
      aging["61-90"].count++;
      aging["61-90"].total += pending;
    } else {
      aging["90+"].count++;
      aging["90+"].total += pending;
    }
  });

  return aging;
}