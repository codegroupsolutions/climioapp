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

    const companyId = user.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Start of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all statistics in parallel
    const [
      totalClients,
      activeQuotes,
      pendingInvoices,
      todayAppointments,
      monthlyRevenue,
      inventoryAlerts,
      recentActivities,
      upcomingAppointments,
      monthlyStats
    ] = await Promise.all([
      // Total clients
      prisma.client.count({
        where: {
          companyId,
          active: true
        }
      }),

      // Active quotes (DRAFT and SENT status)
      prisma.quote.count({
        where: {
          companyId,
          status: {
            in: ["DRAFT", "SENT"]
          }
        }
      }),

      // Pending invoices
      prisma.invoice.count({
        where: {
          companyId,
          status: "PENDING"
        }
      }),

      // Today's appointments
      prisma.appointment.count({
        where: {
          companyId,
          startDate: {
            gte: today,
            lt: tomorrow
          },
          status: {
            in: ["SCHEDULED", "IN_PROGRESS"]
          }
        }
      }),

      // Monthly revenue (paid invoices)
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: "PAID",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          total: true
        }
      }),

      // Low stock alerts (products with stock <= minStock)
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "Product"
        WHERE "companyId" = ${companyId}
        AND "stock" <= "minStock"
        AND "active" = true
      `.then(result => Number(result[0]?.count || 0)),

      // Recent activities - combining different types
      getRecentActivities(companyId),

      // Today's appointments with details
      prisma.appointment.findMany({
        where: {
          companyId,
          startDate: {
            gte: today,
            lt: tomorrow
          },
          status: {
            in: ["SCHEDULED", "IN_PROGRESS"]
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
          technician: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          startDate: "asc"
        },
        take: 5
      }),

      // Get monthly statistics for comparison
      getMonthlyComparison(companyId, startOfMonth)
    ]);

    // Calculate pending invoices amount
    const pendingInvoicesAmount = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: "PENDING"
      },
      _sum: {
        total: true
      }
    });

    // Format response
    const stats = {
      totalClients,
      activeQuotes,
      pendingInvoices,
      pendingInvoicesAmount: pendingInvoicesAmount._sum.total || 0,
      todayAppointments,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      inventoryAlerts,
      recentActivities,
      upcomingAppointments: upcomingAppointments.map(apt => ({
        id: apt.id,
        client: apt.client.companyName || `${apt.client.firstName} ${apt.client.lastName}`,
        service: apt.title,
        type: apt.type,
        time: apt.startDate.toLocaleTimeString("es-PR", { hour: "2-digit", minute: "2-digit" }),
        technician: apt.technician ? `${apt.technician.firstName} ${apt.technician.lastName}` : "Sin asignar",
        status: apt.status
      })),
      monthlyStats
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}

async function getRecentActivities(companyId) {
  const activities = [];

  // Get recent quotes
  const recentQuotes = await prisma.quote.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 2,
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true
        }
      }
    }
  });

  recentQuotes.forEach(quote => {
    activities.push({
      id: `quote-${quote.id}`,
      type: "quote",
      description: `Nueva cotización ${quote.number} para ${quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`}`,
      time: getRelativeTime(quote.createdAt),
      timestamp: quote.createdAt,
      icon: "📄"
    });
  });

  // Get recent payments
  const recentPayments = await prisma.payment.findMany({
    where: {
      invoice: {
        companyId
      }
    },
    orderBy: { paidAt: "desc" },
    take: 2,
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
    }
  });

  recentPayments.forEach(payment => {
    activities.push({
      id: `payment-${payment.id}`,
      type: "payment",
      description: `Pago recibido de ${payment.invoice.client.companyName || `${payment.invoice.client.firstName} ${payment.invoice.client.lastName}`} - $${payment.amount.toLocaleString("es-PR")}`,
      time: getRelativeTime(payment.paidAt),
      timestamp: payment.paidAt,
      icon: "💰"
    });
  });

  // Get recent appointments
  const recentAppointments = await prisma.appointment.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 2,
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true
        }
      }
    }
  });

  recentAppointments.forEach(appointment => {
    activities.push({
      id: `appointment-${appointment.id}`,
      type: "appointment",
      description: `Cita programada con ${appointment.client.companyName || `${appointment.client.firstName} ${appointment.client.lastName}`}`,
      time: getRelativeTime(appointment.createdAt),
      timestamp: appointment.createdAt,
      icon: "📅"
    });
  });

  // Get recent clients
  const recentClients = await prisma.client.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 2
  });

  recentClients.forEach(client => {
    activities.push({
      id: `client-${client.id}`,
      type: "client",
      description: `Nuevo cliente registrado: ${client.companyName || `${client.firstName} ${client.lastName}`}`,
      time: getRelativeTime(client.createdAt),
      timestamp: client.createdAt,
      icon: "👤"
    });
  });

  // Sort by timestamp and return top 5
  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(({ timestamp, ...activity }) => activity);
}

async function getMonthlyComparison(companyId, startOfMonth) {
  // Get last month's dates
  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  const endOfLastMonth = new Date(startOfMonth);
  endOfLastMonth.setDate(0);

  // Get current and last month's stats
  const [currentMonthClients, lastMonthClients, currentMonthRevenue, lastMonthRevenue] = await Promise.all([
    // Current month new clients
    prisma.client.count({
      where: {
        companyId,
        createdAt: {
          gte: startOfMonth
        }
      }
    }),

    // Last month new clients
    prisma.client.count({
      where: {
        companyId,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    }),

    // Current month revenue
    prisma.invoice.aggregate({
      where: {
        companyId,
        status: "PAID",
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        total: true
      }
    }),

    // Last month revenue
    prisma.invoice.aggregate({
      where: {
        companyId,
        status: "PAID",
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      _sum: {
        total: true
      }
    })
  ]);

  const currentRevenue = currentMonthRevenue._sum.total || 0;
  const lastRevenue = lastMonthRevenue._sum.total || 0;

  return {
    clientGrowth: lastMonthClients > 0 ? ((currentMonthClients - lastMonthClients) / lastMonthClients * 100).toFixed(1) : 0,
    revenueGrowth: lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1) : 0,
    newClients: currentMonthClients
  };
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Hace ${days} día${days > 1 ? "s" : ""}`;
  if (hours > 0) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  return "Hace unos segundos";
}