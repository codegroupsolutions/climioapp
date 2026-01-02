import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/utils/auth'
import { uploadImage, deleteImage, isStorageConfigured } from '@/lib/azureStorage'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only admins can upload company logo
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'No tienes permisos para subir el logo de la empresa' },
        { status: 403 }
      )
    }

    // Check if Azure Storage is configured
    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: 'Almacenamiento no configurado. Por favor contacta al administrador.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Usa JPG, PNG, WEBP o GIF.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es muy grande. Tamaño máximo: 5MB' },
        { status: 400 }
      )
    }

    // Get current company to retrieve old logo
    const currentCompany = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { logo: true }
    })

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate filename with company prefix
    const fileName = `logo-${user.companyId}-${file.name}`

    // Upload to Azure Blob Storage
    const imageUrl = await uploadImage(buffer, fileName, file.type)

    // Update company logo in database
    await prisma.company.update({
      where: { id: user.companyId },
      data: { logo: imageUrl }
    })

    // Delete old logo from Azure if exists
    if (currentCompany?.logo && currentCompany.logo.startsWith('http')) {
      try {
        await deleteImage(currentCompany.logo)
      } catch (err) {
        // Log but don't fail the request - old logo deletion is not critical
        console.error('Error deleting old logo:', err)
      }
    }

    return NextResponse.json({
      message: 'Logo subido y guardado exitosamente',
      url: imageUrl
    })

  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir el logo' },
      { status: 500 }
    )
  }
}
