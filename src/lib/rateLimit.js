/**
 * Simple in-memory rate limiter for API routes
 * Note: For production with multiple instances, use Redis instead
 */

// Store for rate limit data: Map<identifier, { count, resetTime }>
const rateLimitStore = new Map()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

/**
 * Rate limit configuration presets
 */
export const RATE_LIMIT_PRESETS = {
  // Very strict - for sensitive operations like password reset
  strict: { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 requests per 15 minutes

  // Authentication endpoints
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes

  // Standard API endpoints
  standard: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute

  // Public endpoints (contact forms, etc)
  public: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
}

/**
 * Check if a request should be rate limited
 * @param {string} identifier - Unique identifier (IP address, user ID, etc.)
 * @param {string} routeKey - Route identifier for separate limits
 * @param {object} options - Rate limit options
 * @returns {{ limited: boolean, remaining: number, resetIn: number }}
 */
export function checkRateLimit(identifier, routeKey, options = RATE_LIMIT_PRESETS.standard) {
  const { maxRequests, windowMs } = options
  const key = `${routeKey}:${identifier}`
  const now = Date.now()

  let record = rateLimitStore.get(key)

  // If no record or window expired, create new record
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs
    }
    rateLimitStore.set(key, record)
    return {
      limited: false,
      remaining: maxRequests - 1,
      resetIn: Math.ceil(windowMs / 1000)
    }
  }

  // Increment count
  record.count++
  rateLimitStore.set(key, record)

  const remaining = Math.max(0, maxRequests - record.count)
  const resetIn = Math.ceil((record.resetTime - now) / 1000)

  return {
    limited: record.count > maxRequests,
    remaining,
    resetIn
  }
}

/**
 * Get client identifier from request
 * @param {Request} request
 * @returns {string}
 */
export function getClientIdentifier(request) {
  // Try to get real IP from common headers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a hash of user-agent + some request data
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `ua-${hashString(userAgent)}`
}

/**
 * Simple string hash function
 */
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Rate limit response helper
 * @param {number} resetIn - Seconds until reset
 * @returns {Response}
 */
export function rateLimitResponse(resetIn) {
  return new Response(
    JSON.stringify({
      error: 'Demasiadas solicitudes. Por favor espera antes de intentar de nuevo.',
      retryAfter: resetIn
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetIn)
      }
    }
  )
}
