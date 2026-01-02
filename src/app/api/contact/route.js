import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emailService'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rateLimit'
import { escapeHtml, sanitizeForEmail } from '@/lib/sanitize'

export async function POST(request) {
  try {
    // Rate limiting - prevent spam on contact form
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, 'contact', RATE_LIMIT_PRESETS.public)

    if (rateLimit.limited) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validar campos requeridos
    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El correo electrónico no es válido' },
        { status: 400 }
      )
    }

    // Obtener el email de destino desde las variables de entorno
    const emailTo = process.env.EMAIL_TO || 'soporte@climiocrm.com'

    // Mapear el asunto a texto legible
    const subjectMap = {
      'informacion': 'Información General',
      'demo': 'Solicitud de Demostración',
      'precios': 'Consulta de Precios',
      'soporte': 'Soporte Técnico',
      'integracion': 'Integración y Migración',
      'otro': 'Otro'
    }

    const readableSubject = subjectMap[subject] || escapeHtml(subject)

    // Sanitize user input to prevent XSS in emails
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safePhone = escapeHtml(phone)
    const safeMessage = sanitizeForEmail(message)

    // Crear el HTML del email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; padding: 10px; background-color: white; border-left: 3px solid #007bff; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Nuevo Mensaje de Contacto</h2>
              <p>Recibido desde el formulario de contacto del sitio web</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nombre:</div>
                <div class="value">${safeName}</div>
              </div>
              <div class="field">
                <div class="label">Correo Electrónico:</div>
                <div class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
              </div>
              <div class="field">
                <div class="label">Teléfono:</div>
                <div class="value"><a href="tel:${safePhone}">${safePhone}</a></div>
              </div>
              <div class="field">
                <div class="label">Asunto:</div>
                <div class="value">${readableSubject}</div>
              </div>
              <div class="field">
                <div class="label">Mensaje:</div>
                <div class="value">${safeMessage}</div>
              </div>
              <div class="field">
                <div class="label">Fecha y Hora:</div>
                <div class="value">${new Date().toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' })}</div>
              </div>
            </div>
            <div class="footer">
              <p>Este mensaje fue enviado desde el formulario de contacto de CLIMIO CRM</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Enviar el email
    await sendEmail({
      to: emailTo,
      subject: `[CLIMIO CRM] Nuevo Contacto: ${readableSubject} - ${name}`,
      html: emailHtml,
      text: `
        Nuevo mensaje de contacto recibido:

        Nombre: ${safeName}
        Email: ${safeEmail}
        Teléfono: ${safePhone}
        Asunto: ${readableSubject}

        Mensaje:
        ${message}

        Fecha: ${new Date().toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' })}
      `
    })

    console.log('Email de contacto enviado exitosamente a:', emailTo)

    return NextResponse.json(
      {
        success: true,
        message: 'Mensaje enviado exitosamente'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error procesando el formulario de contacto:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}