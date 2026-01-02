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

// GET /api/superadmin/reports/export - Export reports as CSV
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
    const format = searchParams.get('format') || 'csv';
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
        startDate = new Date(2020, 0, 1);
        break;
    }

    // Fetch all necessary data
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
      },
      orderBy: { createdAt: 'desc' }
    });

    const users = await prisma.user.findMany({
      include: {
        company: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        company: true,
        client: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Generate CSV content
      let csvContent = '';

      // Report header
      csvContent += `Reporte SuperAdmin CRM\n`;
      csvContent += `Fecha de generación: ${new Date().toLocaleString('es-PR')}\n`;
      csvContent += `Período: ${range}\n\n`;

      // Summary statistics
      csvContent += 'RESUMEN EJECUTIVO\n';
      csvContent += 'Métrica,Valor\n';
      csvContent += `Total de Compañías,${companies.length}\n`;
      csvContent += `Compañías Activas,${companies.filter(c => c.active).length}\n`;
      csvContent += `Total de Usuarios,${users.length}\n`;
      csvContent += `Usuarios Activos,${users.filter(u => u.active).length}\n`;
      csvContent += `Total de Facturas,${invoices.length}\n`;
      csvContent += `Ingresos Totales,${invoices.reduce((sum, inv) => sum + inv.total, 0)}\n\n`;

      // Companies section
      csvContent += 'COMPAÑÍAS\n';
      csvContent += 'ID,Nombre,Email,Plan,Estado,Usuarios,Clientes,Facturas,Fecha Registro\n';

      companies.forEach(company => {
        csvContent += `${company.id},`;
        csvContent += `"${company.name}",`;
        csvContent += `${company.email},`;
        csvContent += `${company.subscriptionPlan?.name || 'Gratis'},`;
        csvContent += `${company.subscriptionStatus},`;
        csvContent += `${company._count.users},`;
        csvContent += `${company._count.clients},`;
        csvContent += `${company._count.invoices},`;
        csvContent += `${new Date(company.createdAt).toLocaleDateString('es-PR')}\n`;
      });

      csvContent += '\n';

      // Users section
      csvContent += 'USUARIOS\n';
      csvContent += 'ID,Nombre,Email,Compañía,Rol,Estado,Fecha Registro\n';

      users.forEach(user => {
        csvContent += `${user.id},`;
        csvContent += `"${user.firstName} ${user.lastName}",`;
        csvContent += `${user.email},`;
        csvContent += `"${user.company?.name || 'N/A'}",`;
        csvContent += `${user.role},`;
        csvContent += `${user.active ? 'Activo' : 'Inactivo'},`;
        csvContent += `${new Date(user.createdAt).toLocaleDateString('es-PR')}\n`;
      });

      csvContent += '\n';

      // Revenue section
      csvContent += 'INGRESOS POR COMPAÑÍA\n';
      csvContent += 'Compañía,Plan,Precio Mensual,Total Facturas,Ingresos Totales\n';

      const companiesWithRevenue = companies.map(company => {
        const companyInvoices = invoices.filter(inv => inv.companyId === company.id);
        const totalRevenue = companyInvoices.reduce((sum, inv) => sum + inv.total, 0);
        return {
          ...company,
          invoiceCount: companyInvoices.length,
          totalRevenue
        };
      });

      companiesWithRevenue
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .forEach(company => {
          csvContent += `"${company.name}",`;
          csvContent += `${company.subscriptionPlan?.name || 'Gratis'},`;
          csvContent += `${company.subscriptionPlan?.price || 0},`;
          csvContent += `${company.invoiceCount},`;
          csvContent += `${company.totalRevenue}\n`;
        });

      // Convert to blob and send response
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const buffer = Buffer.from(await blob.arrayBuffer());

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="superadmin-report-${range}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // If format is not supported
    return NextResponse.json(
      { error: "Formato no soportado. Use 'csv'" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Error al exportar reporte" },
      { status: 500 }
    );
  }
}