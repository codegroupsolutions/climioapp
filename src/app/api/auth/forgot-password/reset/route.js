import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import verificationCodeStore from '@/lib/verificationCodes'
import { validatePassword } from '@/lib/passwordValidation'

export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Strong password validation
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
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

    // Check if code was verified
    if (!stored.verified) {
      return NextResponse.json(
        { error: 'El código no ha sido verificado' },
        { status: 400 }
      )
    }

    // Verify code one more time for security
    if (stored.code !== code) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      verificationCodeStore.delete(email.toLowerCase())
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword }
    })

    // Clear verification code
    verificationCodeStore.delete(email.toLowerCase())

    return NextResponse.json(
      { message: 'Contraseña restablecida exitosamente' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in reset password:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    )
  }
}
