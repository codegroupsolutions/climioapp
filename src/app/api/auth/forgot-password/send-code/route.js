import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/emailService'
import verificationCodeStore from '@/lib/verificationCodes'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rateLimit'

// Generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
  try {
    // Rate limiting - strict limit for password reset
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, 'forgot-password', RATE_LIMIT_PRESETS.strict)

    if (rateLimit.limited) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        { message: 'Si el correo existe, recibirás un código de verificación' },
        { status: 200 }
      )
    }

    // Generate verification code
    const code = generateCode()
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

    // Store code with expiration
    verificationCodeStore.set(email.toLowerCase(), {
      code,
      expiresAt,
      attempts: 0
    })

    // Code generated - do not log sensitive data in production

    // Send email with code
    try {
      await sendEmail({
        to: email,
        subject: 'Código de Recuperación de Contraseña - CLIMIO',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #000; color: #fff; padding: 30px 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 30px 20px; }
                .code-box { background-color: #fff; border: 2px solid #000; padding: 20px; text-align: center; margin: 20px 0; }
                .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>CLIMIO</h1>
                </div>
                <div class="content">
                  <h2>Recuperación de Contraseña</h2>
                  <p>Hola,</p>
                  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código de verificación:</p>

                  <div class="code-box">
                    <div class="code">${code}</div>
                  </div>

                  <p><strong>Este código expira en 15 minutos.</strong></p>

                  <div class="warning">
                    <strong>⚠️ Importante:</strong> Si no solicitaste este código, ignora este correo. Tu cuenta permanece segura.
                  </div>

                  <p>Por razones de seguridad, nunca compartas este código con nadie.</p>
                </div>
                <div class="footer">
                  <p>Este es un correo automático, por favor no respondas.</p>
                  <p>&copy; ${new Date().getFullYear()} CLIMIO. Todos los derechos reservados.</p>
                </div>
              </div>
            </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      return NextResponse.json(
        { error: 'Error al enviar el correo. Por favor intenta de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Código enviado a tu correo electrónico' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in send-code:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
