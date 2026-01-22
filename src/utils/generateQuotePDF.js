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

export async function generateQuotePDF(quote) {
  if (!quote) {
    throw new Error('No quote data provided')
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
  if (quote.company?.logo) {
    try {
      const apiResponse = await fetch(`/api/image-to-base64?url=${encodeURIComponent(quote.company.logo)}`)

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

  if (quote.client) {
    const clientName = `${quote.client.firstName || ''} ${quote.client.lastName || ''}`.trim()
    doc.text(`Nombre: ${clientName}`, 20, yPos)
    yPos += 6

    if (quote.client.companyName) {
      doc.text(`Empresa: ${quote.client.companyName}`, 20, yPos)
      yPos += 6
    }

    if (quote.client.address) {
      const fullAddress = quote.client.city && quote.client.state
        ? `${quote.client.address}, ${quote.client.city}, ${quote.client.state}`
        : quote.client.address
      doc.text(`Direccion: ${fullAddress}`, 20, yPos)
      yPos += 6
    }

    if (quote.client.email) {
      doc.text(`Mail: ${quote.client.email}`, 20, yPos)
      yPos += 6
    }

    if (quote.client.phone) {
      doc.text(`Telefono: ${quote.client.phone}`, 20, yPos)
      yPos += 6
    }
  }

  // ========== FECHA Y NUMERO DE COTIZACION ==========
  yPos += 6

  const issueDate = new Date(quote.date).toLocaleDateString('es-PR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  doc.setFont(undefined, 'bold')
  doc.text(`Fecha: ${issueDate}`, 20, yPos)

  // Numero de cotizacion a la derecha
  doc.text(`Cotizacion: ${quote.number}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6

  // Tipo de cotizacion
  const quoteType = quote.type === 'SERVICE' ? 'Servicio' : 'Equipo'
  doc.setFont(undefined, 'normal')
  doc.text(`Tipo: ${quoteType}`, pageWidth - 20, yPos, { align: 'right' })

  // Validez de la cotizacion
  if (quote.validUntil) {
    yPos += 6
    const validUntil = new Date(quote.validUntil).toLocaleDateString('es-PR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    doc.text(`Valida hasta: ${validUntil}`, pageWidth - 20, yPos, { align: 'right' })
  }

  // Estado de la cotizacion
  yPos += 6
  let statusText = ''
  let statusColor = [0, 0, 0]

  switch(quote.status) {
    case 'ACCEPTED':
      statusText = 'ACEPTADA'
      statusColor = [0, 128, 0]
      break
    case 'REJECTED':
      statusText = 'RECHAZADA'
      statusColor = [255, 0, 0]
      break
    case 'CONVERTED':
      statusText = 'CONVERTIDA'
      statusColor = [0, 0, 255]
      break
    default:
      statusText = 'PENDIENTE'
      statusColor = [255, 165, 0]
  }

  doc.setFont(undefined, 'bold')
  doc.setTextColor(...statusColor)
  doc.text(`Estado: ${statusText}`, pageWidth - 20, yPos, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  // ========== TABLA DE ITEMS ==========
  yPos += 12

  const tableData = quote.items && quote.items.length > 0
    ? quote.items.map(item => [
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

  // ========== SECCION DE TOTALES, NOTAS Y FOOTER (SECUENCIAL) ==========
  // Obtener posicion final de la tabla (compatible con diferentes versiones de jspdf-autotable)
  const tableFinalY = tableResult?.finalY || doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || yPos + 50
  yPos = tableFinalY + 15

  // Verificar si necesitamos nueva pagina antes de continuar
  if (yPos > pageHeight - 80) {
    doc.addPage()
    yPos = 20
  }

  // Totales (secuencial, alineados a la derecha)
  doc.setFontSize(10)
  const totalsX = 140
  const totalsValueX = pageWidth - 20

  // Subtotal
  doc.setFont(undefined, 'normal')
  doc.text('Subtotal', totalsX, yPos)
  doc.text(formatCurrency(quote.subtotal || 0), totalsValueX, yPos, { align: 'right' })
  yPos += 7

  // Descuento (si aplica)
  if ((quote.discount || 0) > 0) {
    doc.text('Descuento', totalsX, yPos)
    doc.text(`-${formatCurrency(quote.discount || 0)}`, totalsValueX, yPos, { align: 'right' })
    yPos += 7
  }

  // IVU
  doc.text('IVU 11.5%', totalsX, yPos)
  doc.text(formatCurrency(quote.tax || 0), totalsValueX, yPos, { align: 'right' })
  yPos += 8

  // Linea separadora antes del total
  doc.setDrawColor(...LIGHT_GRAY)
  doc.setLineWidth(0.5)
  doc.line(totalsX, yPos - 2, totalsValueX, yPos - 2)

  // Total
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text('Total', totalsX, yPos + 4)
  doc.text(formatCurrency(quote.total || 0), totalsValueX, yPos + 4, { align: 'right' })
  yPos += 12

  // Espacio antes de notas
  yPos += 10

  // Verificar si necesitamos nueva pagina para las notas
  if (yPos > pageHeight - 60) {
    doc.addPage()
    yPos = 20
  }

  // Notas (después de totales, completo)
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(0, 0, 0)

  // Notas
  if (quote.notes) {
    doc.setFont(undefined, 'bold')
    doc.text('Notas:', 20, yPos)
    doc.setFont(undefined, 'normal')
    yPos += 5

    // Dividir el texto en múltiples líneas según el ancho disponible
    const maxWidth = pageWidth - 40 // Margen izquierdo y derecho
    const splitNotes = doc.splitTextToSize(quote.notes, maxWidth)
    doc.text(splitNotes, 20, yPos)
    yPos += splitNotes.length * 4 + 5
  }

  // Espacio antes del footer
  yPos += 15

  // ========== FOOTER ==========
  // Calcular donde termina el contenido
  const contentEndY = yPos

  // Footer dinamico - se posiciona despues del contenido
  const minFooterSpace = 50
  let footerY = contentEndY

  // Si el footer excede la pagina, agregar nueva pagina
  if (footerY > pageHeight - minFooterSpace) {
    doc.addPage()
    footerY = 20
  }

  // Dibujar decoracion y contenido del footer
  drawBottomDecoration(doc, pageWidth, pageHeight)
  drawFooterContent(doc, quote, pageWidth, pageHeight, footerY)

  return doc
}

// Funcion para dibujar el contenido del footer
function drawFooterContent(doc, quote, pageWidth, pageHeight, footerY) {
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(0, 0, 0)

  if (quote.company?.name) {
    doc.text(quote.company.name, 20, footerY)
  }

  doc.setFont(undefined, 'normal')
  let companyInfoY = footerY + 5

  if (quote.company?.address) {
    doc.text(`Direccion Fisica: ${quote.company.address}`, 20, companyInfoY)
    companyInfoY += 4
  }
  if (quote.company?.postalAddress) {
    doc.text(`Direccion Postal: ${quote.company.postalAddress}`, 20, companyInfoY)
    companyInfoY += 4
  }
  if (quote.company?.email) {
    doc.text(`Mail: ${quote.company.email}`, 20, companyInfoY)
    companyInfoY += 4
  }
  if (quote.company?.phone) {
    doc.text(`Telefono: ${quote.company.phone}`, 20, companyInfoY)
    companyInfoY += 4
  }

  // Generado por (derecha)
  if (quote.user) {
    doc.setFont(undefined, 'normal')
    doc.text(`Generado por: ${quote.user.firstName || ''} ${quote.user.lastName || ''}`, pageWidth - 20, footerY, { align: 'right' })
  }

  // Mensaje de agradecimiento (centrado, por debajo de toda la informacion de la empresa)
  // Calcular la posicion Y mas baja entre la informacion de la empresa y el lado derecho
  const maxInfoY = Math.max(companyInfoY, footerY + 5)
  const thanksY = maxInfoY + 8 // Espacio adicional antes del mensaje
  
  doc.setFontSize(10)
  doc.setFont(undefined, 'italic')
  doc.text('Gracias por su preferencia', pageWidth / 2, thanksY, { align: 'center' })
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
