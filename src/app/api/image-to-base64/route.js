import { NextResponse } from 'next/server'

const FETCH_TIMEOUT_MS = 10000 // 10 seconds
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

// Whitelist of allowed domains for image fetching (SSRF protection)
const ALLOWED_DOMAINS = [
  // Azure Blob Storage
  'blob.core.windows.net',
  // Common CDNs and image services
  'cloudinary.com',
  'res.cloudinary.com',
  'images.unsplash.com',
  'cdn.pixabay.com',
  'i.imgur.com',
  'storage.googleapis.com',
  // Add your own domains here
]

// Block private/internal IP ranges
function isPrivateOrInternalHost(hostname) {
  // Block localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true
  }

  // Block private IP ranges
  const privateRanges = [
    /^10\./,                          // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,                    // 192.168.0.0/16
    /^169\.254\./,                    // Link-local
    /^0\./,                           // 0.0.0.0/8
    /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-7])\./, // Carrier-grade NAT
  ]

  return privateRanges.some(range => range.test(hostname))
}

// Check if domain is in whitelist
function isDomainAllowed(hostname) {
  return ALLOWED_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  )
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de imagen no proporcionada' },
        { status: 400 }
      )
    }

    // Validate URL format
    let parsedUrl
    try {
      parsedUrl = new URL(imageUrl)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json(
        { error: 'URL de imagen inválida' },
        { status: 400 }
      )
    }

    // SSRF Protection: Block private/internal addresses
    if (isPrivateOrInternalHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Acceso a direcciones internas no permitido' },
        { status: 403 }
      )
    }

    // SSRF Protection: Only allow whitelisted domains
    if (!isDomainAllowed(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'Dominio no permitido. Solo se permiten imágenes de CDNs autorizados.' },
        { status: 403 }
      )
    }

    // Fetch with timeout using AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response
    try {
      response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Air-CRM-Portal/1.0'
        }
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      throw new Error(`Error al obtener la imagen: ${response.statusText}`)
    }

    // Check Content-Length header before downloading
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Imagen demasiado grande. Máximo permitido: ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    // Validate content type
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'La URL no corresponde a una imagen válida' },
        { status: 400 }
      )
    }

    const arrayBuffer = await response.arrayBuffer()

    // Double-check size after download (in case Content-Length was missing/wrong)
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Imagen demasiado grande. Máximo permitido: ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(arrayBuffer)

    // Convert to base64
    const base64 = buffer.toString('base64')
    const mimeType = contentType.split(';')[0] || 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`

    return NextResponse.json({
      dataUrl,
      mimeType,
      size: arrayBuffer.byteLength
    })
  } catch (error) {
    // Handle abort error specifically
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Tiempo de espera agotado al obtener la imagen' },
        { status: 504 }
      )
    }

    console.error('Error converting image to base64:', error)
    return NextResponse.json(
      { error: error.message || 'Error al convertir la imagen' },
      { status: 500 }
    )
  }
}
