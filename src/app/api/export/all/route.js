import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';
import { arrayToCSV, formatDateForCSV, formatDateTimeForCSV } from '@/utils/csvExport';
import JSZip from 'jszip';

// Pagination settings to prevent memory issues
const BATCH_SIZE = 1000;
const MAX_RECORDS_PER_EXPORT = 10000;

// GET /api/export/all - Export all data as ZIP with multiple CSVs
export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const zip = new JSZip();
    const bom = '\uFEFF'; // BOM for Excel compatibility

    // Export all data types with pagination
    const exports = [
      { name: 'clientes', fn: exportClients },
      { name: 'productos', fn: exportProducts },
      { name: 'cotizaciones', fn: exportQuotes },
      { name: 'facturas', fn: exportInvoices },
      { name: 'citas', fn: exportAppointments },
      { name: 'movimientos_inventario', fn: exportInventoryMovements },
    ];

    for (const exp of exports) {
      try {
        const data = await exp.fn(user.companyId);
        if (data && data.length > 0) {
          const csv = arrayToCSV(data);
          zip.file(`${exp.name}.csv`, bom + csv);
        }
      } catch (error) {
        console.error(`Error exporting ${exp.name}:`, error);
        // Continue with other exports even if one fails
      }
    }

    // Generate ZIP file with compression
    const zipBlob = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const filename = `backup_completo_${new Date().toISOString().split('T')[0]}.zip`;

    return new Response(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting all data:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}

// Helper to fetch data in batches
async function fetchInBatches(model, where, include, orderBy, mapFn) {
  const results = [];
  let skip = 0;

  while (skip < MAX_RECORDS_PER_EXPORT) {
    const batch = await model.findMany({
      where,
      include,
      orderBy,
      take: BATCH_SIZE,
      skip,
    });

    if (batch.length === 0) break;

    // Map and add to results
    for (const item of batch) {
      results.push(mapFn(item));
    }

    skip += BATCH_SIZE;

    // If we got less than BATCH_SIZE, we've reached the end
    if (batch.length < BATCH_SIZE) break;
  }

  return results;
}

// Export functions with pagination

async function exportClients(companyId) {
  return fetchInBatches(
    prisma.client,
    { companyId },
    undefined,
    { createdAt: 'desc' },
    (client) => ({
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
      'Tipo': client.type,
      'Fecha de Creación': formatDateTimeForCSV(client.createdAt),
    })
  );
}

async function exportProducts(companyId) {
  return fetchInBatches(
    prisma.product,
    { companyId },
    { category: { select: { name: true } } },
    { createdAt: 'desc' },
    (product) => ({
      'ID': product.id,
      'Código': product.code,
      'Nombre': product.name,
      'Descripción': product.description || '',
      'Categoría': product.category?.name || '',
      'Precio': product.price,
      'Stock': product.stock,
      'Stock Mínimo': product.minStock || 0,
      'Unidad': product.unit || '',
      'Activo': product.active ? 'Sí' : 'No',
      'Fecha de Creación': formatDateTimeForCSV(product.createdAt),
    })
  );
}

async function exportQuotes(companyId) {
  return fetchInBatches(
    prisma.quote,
    { companyId },
    {
      client: { select: { firstName: true, lastName: true, companyName: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    { createdAt: 'desc' },
    (quote) => ({
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
    })
  );
}

async function exportInvoices(companyId) {
  return fetchInBatches(
    prisma.invoice,
    { companyId },
    {
      client: { select: { firstName: true, lastName: true, companyName: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    { createdAt: 'desc' },
    (invoice) => ({
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
    })
  );
}

async function exportAppointments(companyId) {
  return fetchInBatches(
    prisma.appointment,
    { companyId },
    {
      client: { select: { firstName: true, lastName: true } },
      technician: { select: { firstName: true, lastName: true } },
    },
    { startDate: 'desc' },
    (appointment) => ({
      'ID': appointment.id,
      'Cliente': `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`,
      'Título': appointment.title,
      'Descripción': appointment.description || '',
      'Tipo': appointment.type,
      'Fecha Inicio': formatDateTimeForCSV(appointment.startDate),
      'Fecha Fin': formatDateTimeForCSV(appointment.endDate),
      'Dirección': appointment.address || '',
      'Estado': appointment.status,
      'Técnico': `${appointment.technician?.firstName || ''} ${appointment.technician?.lastName || ''}`,
      'Notas': appointment.notes || '',
      'Fecha de Creación': formatDateTimeForCSV(appointment.createdAt),
    })
  );
}

async function exportInventoryMovements(companyId) {
  return fetchInBatches(
    prisma.inventoryMovement,
    { companyId },
    {
      product: { select: { code: true, name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    { createdAt: 'desc' },
    (movement) => ({
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
    })
  );
}
