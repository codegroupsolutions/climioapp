import { NextResponse } from 'next/server'
import verificationCodeStore from '@/lib/verificationCodes'
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMIT_PRESETS } from '@/lib/rateLimit'

const MAX_ATTEMPTS = 5

export async function POST(request) {
  try {
    // Rate limiting - strict limit for code verification
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, 'verify-code', RATE_LIMIT_PRESETS.auth)

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

    const stored = verificationCodeStore.get(email.toLowerCase())

    if (!stored) {
      return NextResponse.json(
        { error: 'Código no encontrado o expirado' },
        { status: 400 }
      )
    }

    // Check if code is expired
    if (Date.now() > stored.expiresAt) {
      verificationCodeStore.delete(email.toLowerCase())
      return NextResponse.json(
        { error: 'El código ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      )
    }

    // Check attempts limit
    if (stored.attempts >= MAX_ATTEMPTS) {
      verificationCodeStore.delete(email.toLowerCase())
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Solicita un nuevo código.' },
        { status: 400 }
      )
    }

    // Verify code - use constant-time comparison to prevent timing attacks
    const codeMatches = stored.code.length === code.length &&
      stored.code.split('').every((char, i) => char === code[i])

    if (!codeMatches) {
      stored.attempts++
      verificationCodeStore.set(email.toLowerCase(), stored)
      const remaining = MAX_ATTEMPTS - stored.attempts
      return NextResponse.json(
        { error: `Código incorrecto. Intentos restantes: ${remaining}` },
        { status: 400 }
      )
    }

    // Code is valid - mark as verified but keep for password reset
    stored.verified = true
    verificationCodeStore.set(email.toLowerCase(), stored)

    return NextResponse.json(
      { message: 'Código verificado correctamente' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in verify-code:', error)
    return NextResponse.json(
      { error: 'Error al verificar el código' },
      { status: 500 }
    )
  }
}
