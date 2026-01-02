import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function verifySuperAdminToken(request) {
  const token = request.cookies.get('superadmin-token')?.value

  if (!token || !process.env.NEXTAUTH_SECRET) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    return decoded
  } catch (error) {
    return null
  }
}

export function withSuperAdminAuth(handler) {
  return async (request, context) => {
    const user = verifySuperAdminToken(request)

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Add user to request for use in handler
    request.superAdminUser = user
    return handler(request, context)
  }
}