import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateQuotePDF(quote) {
  if (!quote) {
    throw new Error('No quote data provided')
  }

  const doc = new jsPDF({
    format: 'letter',
    orientation: 'portrait',
    unit: 'mm'
  })

  // Company header
  let headerStartY = 20

  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text(quote.company?.name || 'Mi Empresa', 20, headerStartY)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  let yPos = headerStartY + 7

  if (quote.company?.address) {
    doc.text(quote.company.address, 20, yPos)
    yPos += 5
  }
  if (quote.company?.city && quote.company?.state) {
    doc.text(`${quote.company.city}, ${quote.company.state}`, 20, yPos)
    yPos += 5
  }
  if (quote.company?.phone) {
    doc.text(`Tel: ${quote.company.phone}`, 20, yPos)
    yPos += 5
  }
  if (quote.company?.email) {
    doc.text(`Email: ${quote.company.email}`, 20, yPos)
    yPos += 5
  }

  // Quote title and number
  const quoteHeaderY = 20
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('COTIZACIÓN', 140, quoteHeaderY)

  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(quote.number, 140, quoteHeaderY + 8)

  doc.setFontSize(10)
  const date = new Date(quote.date).toLocaleDateString('es-PR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Fecha: ${date}`, 140, quoteHeaderY + 15)

  if (quote.validUntil) {
    const validUntil = new Date(quote.validUntil).toLocaleDateString('es-PR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    doc.text(`Válida hasta: ${validUntil}`, 140, quoteHeaderY + 22)
  }

  // Client information (adjust position based on company info)
  const clientHeaderY = Math.max(yPos + 5, 60)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('CLIENTE', 20, clientHeaderY)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  let clientYPos = clientHeaderY + 8
  if (quote.client) {
    doc.text(`${quote.client.firstName || ''} ${quote.client.lastName || ''}`, 20, clientYPos)
    clientYPos += 5
    if (quote.client.companyName) {
      doc.text(quote.client.companyName, 20, clientYPos)
      clientYPos += 5
    }
    if (quote.client.address) {
      doc.text(quote.client.address, 20, clientYPos)
      clientYPos += 5
    }
    if (quote.client.city && quote.client.state) {
      doc.text(`${quote.client.city}, ${quote.client.state}`, 20, clientYPos)
      clientYPos += 5
    }
    if (quote.client.phone) {
      doc.text(`Tel: ${quote.client.phone}`, 20, clientYPos)
      clientYPos += 5
    }
    if (quote.client.email) {
      doc.text(`Email: ${quote.client.email}`, 20, clientYPos)
    }
  }

  // Items table (start below client info)
  const tableStartY = clientYPos + 10
  const tableData = quote.items && quote.items.length > 0
    ? quote.items.map(item => [
        item.description || '',
        (item.quantity || 0).toString(),
        formatCurrency(item.unitPrice || 0),
        formatCurrency(item.total || 0)
      ])
    : [['Sin items', '', '', '']]

  autoTable(doc, {
    startY: tableStartY,
    head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  })

  // Totals
  const finalY = doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : 150

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')

  // Subtotal
  doc.text('Subtotal:', 140, finalY)
  doc.text(formatCurrency(quote.subtotal || 0), 185, finalY, { align: 'right' })

  // Discount
  if ((quote.discount || 0) > 0) {
    doc.text('Descuento:', 140, finalY + 7)
    doc.text(`-${formatCurrency(quote.discount || 0)}`, 185, finalY + 7, { align: 'right' })
  }

  // Tax
  doc.text('IVU (11.5%):', 140, finalY + 14)
  doc.text(formatCurrency(quote.tax || 0), 185, finalY + 14, { align: 'right' })

  // Total
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', 140, finalY + 24)
  doc.text(formatCurrency(quote.total || 0), 185, finalY + 24, { align: 'right' })

  // Notes
  if (quote.notes) {
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    doc.text('NOTAS:', 20, finalY + 35)
    doc.setFontSize(9)

    const splitNotes = doc.splitTextToSize(quote.notes, 170)
    doc.text(splitNotes, 20, finalY + 42)
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont(undefined, 'italic')
  doc.text('Gracias por su preferencia', 105, pageHeight - 20, { align: 'center' })
  if (quote.user) {
    doc.text(`Generado por ${quote.user.firstName || ''} ${quote.user.lastName || ''}`, 105, pageHeight - 15, { align: 'center' })
  }

  return doc
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-PR', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0)
}