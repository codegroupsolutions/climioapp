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

// GET /api/superadmin/reports - Get comprehensive reports data
export async function GET(request) {
  try {
    const user = await verifySuperAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch(range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Beginning of time for this system
        break;
    }

    // Get all companies with their data
    const companies = await prisma.company.findMany({
      include: {
        subscriptionPlan: true,
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

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        active: true,
        createdAt: true
      }
    });

    // Get invoices for revenue calculation
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        total: true,
        companyId: true,
        createdAt: true
      }
    });

    // Get recent subscription history
    const recentActivity = await prisma.subscriptionHistory.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        company: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate metrics
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.active && c.subscriptionStatus === 'ACTIVE').length;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.active).length;

    // Calculate revenue
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const monthlyRecurringRevenue = companies
      .filter(c => c.subscriptionPlan && c.active)
      .reduce((sum, c) => sum + (c.subscriptionPlan?.price || 0), 0);

    // Plan distribution
    const planDistribution = {
      FREE: companies.filter(c => !c.subscriptionPlan || c.subscriptionPlan.type === 'FREE').length,
      STANDARD: companies.filter(c => c.subscriptionPlan?.type === 'STANDARD').length,
      PREMIUM: companies.filter(c => c.subscriptionPlan?.type === 'PREMIUM').length,
      ENTERPRISE: companies.filter(c => c.subscriptionPlan?.type === 'ENTERPRISE').length
    };

    // Calculate growth metrics
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

    const newCompaniesThisMonth = companies.filter(c =>
      new Date(c.createdAt) >= lastMonthDate
    ).length;

    const newUsersThisMonth = users.filter(u =>
      new Date(u.createdAt) >= lastMonthDate
    ).length;

    // Revenue comparison
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const revenueThisMonth = invoices
      .filter(inv => new Date(inv.createdAt) >= thisMonthStart)
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const revenueLastMonth = invoices
      .filter(inv => {
        const date = new Date(inv.createdAt);
        return date >= lastMonthStart && date < thisMonthStart;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Calculate churn rate (companies that cancelled in the last 30 days)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const cancelledCompanies = companies.filter(c =>
      c.subscriptionStatus === 'CANCELLED' &&
      c.updatedAt && new Date(c.updatedAt) >= last30Days
    ).length;

    const churnRate = totalCompanies > 0
      ? (cancelledCompanies / totalCompanies) * 100
      : 0;

    // Calculate growth rate
    const growthRate = activeCompanies > 0 && newCompaniesThisMonth > 0
      ? (newCompaniesThisMonth / activeCompanies) * 100
      : 0;

    // Get top companies by revenue
    const companiesWithRevenue = companies.map(company => {
      const companyInvoices = invoices.filter(inv => inv.companyId === company.id);
      const totalRevenue = companyInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      return {
        ...company,
        totalRevenue
      };
    });

    const topCompanies = companiesWithRevenue
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Activity stats
    const totalInvoices = await prisma.invoice.count();
    const totalQuotes = await prisma.quote.count();
    const totalAppointments = await prisma.appointment.count();
    const totalClients = await prisma.client.count();

    // Format recent activity
    const formattedActivity = recentActivity.map(activity => ({
      id: activity.id,
      description: formatActivityDescription(activity),
      company: activity.company?.name || 'N/A',
      createdAt: activity.createdAt
    }));

    return NextResponse.json({
      // Overview Stats
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeUsers,
      totalRevenue,
      monthlyRecurringRevenue,
      averageRevenuePerCompany: activeCompanies > 0 ? monthlyRecurringRevenue / activeCompanies : 0,
      churnRate,
      growthRate,

      // Plan Distribution
      planDistribution,

      // Activity Stats
      totalInvoices,
      totalQuotes,
      totalAppointments,
      totalClients,

      // Time-based metrics
      newCompaniesThisMonth,
      newUsersThisMonth,
      revenueThisMonth,
      revenueLastMonth,

      // Top Companies
      topCompanies,

      // Recent Activity
      recentActivity: formattedActivity
    });

  } catch (error) {
    console.error("Error fetching report data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del reporte" },
      { status: 500 }
    );
  }
}

function formatActivityDescription(activity) {
  const actions = {
    'CREATED': 'Suscripción creada',
    'UPGRADED': 'Plan actualizado',
    'DOWNGRADED': 'Plan degradado',
    'CANCELLED': 'Suscripción cancelada',
    'RENEWED': 'Suscripción renovada',
    'SUSPENDED': 'Suscripción suspendida',
    'ACTIVATED': 'Cuenta activada',
    'CHANGED': 'Plan cambiado',
    'USER_DELETED': 'Usuario eliminado'
  };

  let description = actions[activity.action] || activity.action;

  if (activity.oldPlan && activity.newPlan) {
    description += `: ${activity.oldPlan} → ${activity.newPlan}`;
  } else if (activity.newPlan) {
    description += `: ${activity.newPlan}`;
  }

  if (activity.notes) {
    description += ` - ${activity.notes}`;
  }

  return description;
}