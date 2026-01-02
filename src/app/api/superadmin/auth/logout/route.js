import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('superadmin-token')

    return NextResponse.json(
      { message: 'Sesión cerrada exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}