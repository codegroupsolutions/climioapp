import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';
import { arrayToCSV, formatDateForCSV, formatDateTimeForCSV } from '@/utils/csvExport';

// GET /api/export/[type] - Export data to CSV
export async function GET(request, context) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const type = params.type;

    let data = [];
    let filename = '';

    switch (type) {
      case 'clients':
        data = await exportClients(user.companyId);
        filename = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'products':
        data = await exportProducts(user.companyId);
        filename = `productos_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'quotes':
        data = await exportQuotes(user.companyId);
        filename = `cotizaciones_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'invoices':
        data = await exportInvoices(user.companyId);
        filename = `facturas_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'appointments':
        data = await exportAppointments(user.companyId);
        filename = `citas_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'inventory':
        data = await exportInventoryMovements(user.companyId);
        filename = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de exportación no válido' },
          { status: 400 }
        );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No hay datos para exportar' },
        { status: 404 }
      );
    }

    const csv = arrayToCSV(data);

    // Add BOM for Excel compatibility with UTF-8
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;

    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}

// Export functions for each data type

async function exportClients(companyId) {
  const clients = await prisma.client.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });

  return clients.map(client => ({
    'ID': client.id,
    'Nombre': client.firstName,
    'Apellido': client.lastName,
    'Empresa': client.companyName || '',
    'Email': client.email || '',
    'Teléfono': client.phone || '',
    'Dirección': client.address || '',
    'Ciudad': client.city || '',
    'Estado': client.state || '',
    'Código Postal': client.zipCode || '',
    'RFC': client.taxId || '',
    'Tipo': client.type,
    'Fecha de Creación': formatDateTimeForCSV(client.createdAt),
  }));
}

async function exportProducts(companyId) {
  const products = await prisma.product.findMany({
    where: { companyId },
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map(product => ({
    'ID': product.id,
    'Código': product.code,
    'Nombre': product.name,
    'Descripción': product.description || '',
    'Categoría': product.category?.name || '',
    'Precio': product.price,
    'Stock': product.stock,
    'Stock Mínimo': product.minStock || 0,
    'Unidad': product.unit || '',
    'Estado': product.status,
    'Fecha de Creación': formatDateTimeForCSV(product.createdAt),
  }));
}

async function exportQuotes(companyId) {
  const quotes = await prisma.quote.findMany({
    where: { companyId },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return quotes.map(quote => ({
    'Número': quote.number,
    'Cliente': `${quote.client.firstName} ${quote.client.lastName}`,
    'Empresa Cliente': quote.client.companyName || '',
    'Fecha': formatDateForCSV(quote.date),
    'Válida Hasta': formatDateForCSV(quote.validUntil),
    'Subtotal': quote.subtotal,
    'Descuento': quote.discount,
    'IVU': quote.tax,
    'Total': quote.total,
    'Estado': quote.status,
    'Creado Por': `${quote.user?.firstName || ''} ${quote.user?.lastName || ''}`,
    'Fecha de Creación': formatDateTimeForCSV(quote.createdAt),
  }));
}

async function exportInvoices(companyId) {
  const invoices = await prisma.invoice.findMany({
    where: { companyId },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invoices.map(invoice => ({
    'Número': invoice.number,
    'Cliente': `${invoice.client.firstName} ${invoice.client.lastName}`,
    'Empresa Cliente': invoice.client.companyName || '',
    'Tipo': invoice.type,
    'Fecha': formatDateForCSV(invoice.date),
    'Fecha Vencimiento': formatDateForCSV(invoice.dueDate),
    'Subtotal': invoice.subtotal,
    'Descuento': invoice.discount,
    'IVU': invoice.tax,
    'Total': invoice.total,
    'Monto Pagado': invoice.paidAmount || 0,
    'Saldo': invoice.total - (invoice.paidAmount || 0),
    'Estado': invoice.status,
    'Creado Por': `${invoice.user?.firstName || ''} ${invoice.user?.lastName || ''}`,
    'Fecha de Creación': formatDateTimeForCSV(invoice.createdAt),
  }));
}

async function exportAppointments(companyId) {
  const appointments = await prisma.appointment.findMany({
    where: { companyId },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      assignedTo: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { startTime: 'desc' },
  });

  return appointments.map(appointment => ({
    'ID': appointment.id,
    'Cliente': `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`,
    'Título': appointment.title,
    'Descripción': appointment.description || '',
    'Fecha y Hora Inicio': formatDateTimeForCSV(appointment.startTime),
    'Fecha y Hora Fin': formatDateTimeForCSV(appointment.endTime),
    'Ubicación': appointment.location || '',
    'Estado': appointment.status,
    'Asignado a': `${appointment.assignedTo?.firstName || ''} ${appointment.assignedTo?.lastName || ''}`,
    'Notas': appointment.notes || '',
    'Fecha de Creación': formatDateTimeForCSV(appointment.createdAt),
  }));
}

async function exportInventoryMovements(companyId) {
  const movements = await prisma.inventoryMovement.findMany({
    where: { companyId },
    include: {
      product: {
        select: {
          code: true,
          name: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return movements.map(movement => ({
    'ID': movement.id,
    'Producto Código': movement.product.code,
    'Producto Nombre': movement.product.name,
    'Tipo': movement.type,
    'Cantidad': movement.quantity,
    'Stock Anterior': movement.previousStock,
    'Stock Nuevo': movement.newStock,
    'Razón': movement.reason || '',
    'Usuario': `${movement.user?.firstName || ''} ${movement.user?.lastName || ''}`,
    'Fecha': formatDateTimeForCSV(movement.createdAt),
  }));
}
