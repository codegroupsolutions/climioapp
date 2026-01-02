import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rateLimit'
const { sendVerificationEmail, generateVerificationCode } = require('@/lib/emailService')

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    // Rate limiting - strict limit for superadmin auth
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, 'superadmin-auth', RATE_LIMIT_PRESETS.strict)

    if (rateLimit.limited) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Check if superadmin exists
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    })

    if (!superAdmin || !superAdmin.active) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        { message: 'Si el email está registrado, recibirás un código de verificación.' },
        { status: 200 }
      )
    }

    // Generate verification code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save verification code
    await prisma.verificationCode.create({
      data: {
        code,
        email,
        expiresAt,
        superAdminId: superAdmin.id
      }
    })

    // Send email
    const emailSent = await sendVerificationEmail(email, code)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Error al enviar el correo. Por favor, intenta de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Código de verificación enviado a tu correo.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}