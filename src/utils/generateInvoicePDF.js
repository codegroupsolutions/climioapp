import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Colores del PDF
const PRIMARY_COLOR = [204, 204, 204] // #ccc - gris para bandas decorativas
const DARK_GRAY = [51, 51, 51]
const LIGHT_GRAY = [229, 229, 229]

// Funcion para comprimir imagen manteniendo transparencia
function compressImage(dataUrl, maxWidth = 300, maxHeight = 200) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Redimensionar si es muy grande
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Exportar como PNG para mantener transparencia
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUrl) // Si falla, usar original
    img.src = dataUrl
  })
}

export async function generateInvoicePDF(invoice) {
  if (!invoice) {
    throw new Error('No invoice data provided')
  }

  const doc = new jsPDF({
    format: 'letter',
    orientation: 'portrait',
    unit: 'mm'
  })
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // ========== HEADER CON CURVA DECORATIVA ==========
  drawTopDecoration(doc, pageWidth)

  // Posicion Y dinamica - empieza despues de la decoracion superior
  let yPos = 20

  // Logo y nombre de empresa (derecha)
  if (invoice.company?.logo) {
    try {
      const apiResponse = await fetch(`/api/image-to-base64?url=${encodeURIComponent(invoice.company.logo)}`)

      if (apiResponse.ok) {
        const { dataUrl } = await apiResponse.json()

        // Comprimir imagen para reducir tamano del PDF
        const compressedImage = await compressImage(dataUrl, 300, 200, 0.6)

        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = compressedImage
        })

        const maxLogoWidth = 75
        const maxLogoHeight = 40
        const aspectRatio = img.width / img.height
        let logoWidth, logoHeight

        if (img.width > img.height) {
          logoWidth = Math.min(maxLogoWidth, img.width)
          logoHeight = logoWidth / aspectRatio
        } else {
          logoHeight = Math.min(maxLogoHeight, img.height)
          logoWidth = logoHeight * aspectRatio
        }

        // Logo alineado a la derecha (PNG para mantener transparencia)
        doc.addImage(compressedImage, 'PNG', pageWidth - 10 - logoWidth, 18, logoWidth, logoHeight)

        // Actualizar yPos si el logo es mas alto
        const logoEndY = 18 + logoHeight + 5
        yPos = Math.max(yPos, logoEndY)
      }
    } catch (error) {
      console.error('Error loading company logo:', error)
    }
  }

  // Asegurar espacio minimo despues del header
  yPos = Math.max(yPos, 35)

  // ========== DATOS DEL CLIENTE (izquierda) ==========
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(...DARK_GRAY)
  doc.text('DATOS DEL CLIENTE', 20, yPos)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(0, 0, 0)
  yPos += 8

  if (invoice.client) {
    const clientName = `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim()
    doc.text(`Nombre: ${clientName}`, 20, yPos)
    yPos += 6

    if (invoice.client.address) {
      const fullAddress = invoice.client.city && invoice.client.state
        ? `${invoice.client.address}, ${invoice.client.city}, ${invoice.client.state}`
        : invoice.client.address
      doc.text(`Direccion: ${fullAddress}`, 20, yPos)
      yPos += 6
    }

    if (invoice.client.email) {
      doc.text(`Mail: ${invoice.client.email}`, 20, yPos)
      yPos += 6
    }

    if (invoice.client.phone) {
      doc.text(`Telefono: ${invoice.client.phone}`, 20, yPos)
      yPos += 6
    }
  }

  // ========== FECHA Y NUMERO DE FACTURA ==========
  yPos += 6

  const issueDate = new Date(invoice.date).toLocaleDateString('es-PR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  doc.setFont(undefined, 'bold')
  doc.text(`Fecha: ${issueDate}`, 20, yPos)

  // Numero de factura y tipo a la derecha de la fecha
  doc.text(`Factura: ${invoice.number}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6

  const invoiceType = invoice.type === 'SERVICE' ? 'Servicio' : 'Equipo'
  doc.setFont(undefined, 'normal')
  doc.text(`Tipo: ${invoiceType}`, pageWidth - 20, yPos, { align: 'right' })

  // Estado de la factura
  yPos += 6
  let statusText = ''
  let statusColor = [0, 0, 0]

  switch(invoice.status) {
    case 'PAID':
      statusText = 'PAGADA'
      statusColor = [0, 128, 0]
      break
    case 'CANCELLED':
      statusText = 'CANCELADA'
      statusColor = [128, 128, 128]
      break
    default:
      statusText = 'PENDIENTE'
      statusColor = [255, 165, 0]
  }

  // Check if overdue
  if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID') {
    statusText = 'VENCIDA'
    statusColor = [255, 0, 0]
  }

  doc.setFont(undefined, 'bold')
  doc.setTextColor(...statusColor)
  doc.text(`Estado: ${statusText}`, pageWidth - 20, yPos, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  // ========== TABLA DE ITEMS ==========
  yPos += 12

  const tableData = invoice.items && invoice.items.length > 0
    ? invoice.items.map(item => [
        item.description || '',
        (item.quantity || 0).toString(),
        formatCurrency(item.unitPrice || 0),
        formatCurrency(item.total || 0)
      ])
    : [['Sin items', '', '', '']]

  const tableResult = autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Cantidad', 'Precio', 'Total']],
    body: tableData,
    theme: 'plain',
    margin: { left: 20, right: 20 },
    tableWidth: 'auto',
    headStyles: {
      fillColor: DARK_GRAY,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      lineColor: LIGHT_GRAY,
      lineWidth: 0.5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
    styles: {
      cellPadding: 4,
    },
    tableLineColor: LIGHT_GRAY,
    tableLineWidth: 0.5,
  })

  // ========== SECCION DE TOTALES Y NOTAS ==========
  // Obtener posicion final de la tabla (compatible con diferentes versiones de jspdf-autotable)
  const tableFinalY = tableResult?.finalY || doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || yPos + 50
  yPos = tableFinalY + 10

  // Notas y forma de pago (izquierda)
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(0, 0, 0)

  let leftColumnY = yPos

  // Forma de pago (si hay pagos registrados)
  if (invoice.payments && invoice.payments.length > 0) {
    const lastPayment = invoice.payments[invoice.payments.length - 1]
    const paymentMethods = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'TRANSFER': 'Transferencia',
      'STRIPE': 'Stripe'
    }
    doc.text(`Forma de pago: ${paymentMethods[lastPayment.method] || lastPayment.method}`, 20, leftColumnY)
    leftColumnY += 6
  }

  // Notas
  if (invoice.notes) {
    doc.text(`Nota: ${invoice.notes.substring(0, 80)}${invoice.notes.length > 80 ? '...' : ''}`, 20, leftColumnY)
    leftColumnY += 6
  }

  // Vencimiento
  if (invoice.dueDate) {
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('es-PR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    doc.text(`Vencimiento: ${dueDate}`, 20, leftColumnY)
    leftColumnY += 6
  }

  // Totales (derecha)
  doc.setFontSize(10)
  const totalsX = 140
  const totalsValueX = pageWidth - 20
  let totalsY = yPos

  // Subtotal
  doc.setFont(undefined, 'normal')
  doc.text('Subtotal', totalsX, totalsY)
  doc.text(formatCurrency(invoice.subtotal || 0), totalsValueX, totalsY, { align: 'right' })
  totalsY += 7

  // Descuento (si aplica)
  if ((invoice.discount || 0) > 0) {
    doc.text('Descuento', totalsX, totalsY)
    doc.text(`-${formatCurrency(invoice.discount || 0)}`, totalsValueX, totalsY, { align: 'right' })
    totalsY += 7
  }

  // IVU
  doc.text('IVU 11.5%', totalsX, totalsY)
  doc.text(formatCurrency(invoice.tax || 0), totalsValueX, totalsY, { align: 'right' })
  totalsY += 8

  // Linea separadora antes del total
  doc.setDrawColor(...LIGHT_GRAY)
  doc.setLineWidth(0.5)
  doc.line(totalsX, totalsY - 2, totalsValueX, totalsY - 2)

  // Total
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text('Total', totalsX, totalsY + 4)
  doc.text(formatCurrency(invoice.total || 0), totalsValueX, totalsY + 4, { align: 'right' })
  totalsY += 4

  // Pagado y Saldo (si aplica)
  if (invoice.status !== 'CANCELLED' && invoice.paidAmount > 0) {
    totalsY += 8
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    doc.text('Pagado', totalsX, totalsY)
    doc.setTextColor(0, 128, 0)
    doc.text(formatCurrency(invoice.paidAmount || 0), totalsValueX, totalsY, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    const balance = (invoice.total || 0) - (invoice.paidAmount || 0)
    if (balance > 0) {
      totalsY += 7
      doc.setFont(undefined, 'bold')
      doc.text('Saldo', totalsX, totalsY)
      doc.setTextColor(255, 0, 0)
      doc.text(formatCurrency(balance), totalsValueX, totalsY, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }
  }

  // ========== FOOTER ==========
  // Calcular donde termina el contenido
  const contentEndY = Math.max(leftColumnY, totalsY) + 15

  // Footer dinamico - se posiciona despues del contenido con espacio minimo
  // Si hay espacio, usa la parte inferior de la pagina; si no, continua despues del contenido
  const minFooterSpace = 50 // Espacio minimo necesario para el footer
  const footerY = Math.max(contentEndY, pageHeight - minFooterSpace)

  // Si el footer excede la pagina, agregar nueva pagina
  if (footerY > pageHeight - 20) {
    doc.addPage()
    // Primero la decoracion, luego el texto encima
    drawBottomDecoration(doc, pageWidth, pageHeight)
    const newPageFooterY = 20
    drawFooterContent(doc, invoice, pageWidth, pageHeight, newPageFooterY)
  } else {
    // Primero la decoracion, luego el texto encima
    drawBottomDecoration(doc, pageWidth, pageHeight)
    drawFooterContent(doc, invoice, pageWidth, pageHeight, footerY)
  }

  return doc
}

// Funcion para dibujar el contenido del footer
function drawFooterContent(doc, invoice, pageWidth, pageHeight, footerY) {
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(0, 0, 0)

  if (invoice.company?.name) {
    doc.text(invoice.company.name, 20, footerY)
  }

  doc.setFont(undefined, 'normal')
  let companyInfoY = footerY + 5

  if (invoice.company?.address) {
    doc.text(`Direccion: ${invoice.company.address}`, 20, companyInfoY)
    companyInfoY += 4
  }
  if (invoice.company?.email) {
    doc.text(`Mail: ${invoice.company.email}`, 20, companyInfoY)
    companyInfoY += 4
  }
  if (invoice.company?.phone) {
    doc.text(`Telefono: ${invoice.company.phone}`, 20, companyInfoY)
  }

  // Generado por (derecha)
  if (invoice.user) {
    doc.setFont(undefined, 'normal')
    doc.text(`Generado por: ${invoice.user.firstName || ''} ${invoice.user.lastName || ''}`, pageWidth - 20, footerY, { align: 'right' })
  }

  // Referencia de cotizacion
  if (invoice.quote) {
    doc.text(`Cotizacion: ${invoice.quote.number}`, pageWidth - 20, footerY + 5, { align: 'right' })
  }

  // Mensaje de agradecimiento (centrado, por encima de la decoracion)
  doc.setFontSize(10)
  doc.setFont(undefined, 'italic')
  doc.text('Gracias por su preferencia', pageWidth / 2, pageHeight - 45, { align: 'center' })
}

// Funcion para dibujar la decoracion superior
function drawTopDecoration(doc, pageWidth) {
  doc.setFillColor(...PRIMARY_COLOR)

  // Banda decorativa superior con curva
  doc.rect(0, 0, pageWidth, 12, 'F')

  // Triangulo/curva decorativa
  doc.setFillColor(...PRIMARY_COLOR)
  doc.triangle(pageWidth - 80, 0, pageWidth, 0, pageWidth, 40, 'F')
}

// Funcion para dibujar la decoracion inferior
function drawBottomDecoration(doc, pageWidth, pageHeight) {
  doc.setFillColor(...PRIMARY_COLOR)

  // Banda decorativa inferior
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')

  // Triangulo decorativo inferior izquierdo (pequeno para no tapar el footer)
  doc.triangle(0, pageHeight, 40, pageHeight, 0, pageHeight - 20, 'F')
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-PR', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0)
}
