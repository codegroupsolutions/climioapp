import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rateLimit'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    // Rate limiting - strict limit for superadmin verification
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, 'superadmin-verify', RATE_LIMIT_PRESETS.strict)

    if (rateLimit.limited) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email y código son requeridos' },
        { status: 400 }
      )
    }

    // Find valid verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        superAdmin: true
      }
    })

    if (!verificationCode || !verificationCode.superAdmin) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 401 }
      )
    }

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true }
    })

    // Create JWT token
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET is not configured');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        id: verificationCode.superAdmin.id,
        email: verificationCode.superAdmin.email,
        name: verificationCode.superAdmin.name,
        role: 'SUPER_ADMIN'
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '24h' }
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('superadmin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/'
    })

    return NextResponse.json(
      {
        message: 'Autenticación exitosa',
        user: {
          id: verificationCode.superAdmin.id,
          email: verificationCode.superAdmin.email,
          name: verificationCode.superAdmin.name
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Error al verificar el código' },
      { status: 500 }
    )
  }
}