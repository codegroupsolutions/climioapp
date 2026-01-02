// Shared in-memory storage for verification codes with TTL
// In production, use Redis or a database table

const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const MAX_CODES = 1000 // Maximum codes to store (prevent memory leak)
const CLEANUP_INTERVAL_MS = 60 * 1000 // Clean up every minute

class VerificationCodeStore {
  constructor() {
    if (VerificationCodeStore.instance) {
      return VerificationCodeStore.instance
    }
    this.codes = new Map()
    this.startCleanupInterval()
    VerificationCodeStore.instance = this
  }

  set(email, data) {
    const key = email.toLowerCase()

    // Enforce maximum size limit
    if (this.codes.size >= MAX_CODES && !this.codes.has(key)) {
      // Remove oldest entries if at capacity
      this.removeOldestEntries(Math.floor(MAX_CODES * 0.1)) // Remove 10%
    }

    this.codes.set(key, {
      ...data,
      createdAt: Date.now()
    })
  }

  get(email) {
    const key = email.toLowerCase()
    const entry = this.codes.get(key)

    if (!entry) {
      return undefined
    }

    // Check if entry has expired
    if (Date.now() - entry.createdAt > CODE_TTL_MS) {
      this.codes.delete(key)
      return undefined
    }

    return entry
  }

  delete(email) {
    this.codes.delete(email.toLowerCase())
  }

  has(email) {
    const entry = this.get(email) // This also checks expiration
    return entry !== undefined
  }

  // Remove oldest entries
  removeOldestEntries(count) {
    const entries = Array.from(this.codes.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)

    for (let i = 0; i < count && i < entries.length; i++) {
      this.codes.delete(entries[i][0])
    }
  }

  // Clean up expired codes
  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.codes.entries()) {
      if (now - value.createdAt > CODE_TTL_MS) {
        this.codes.delete(key)
      }
    }
  }

  // Start automatic cleanup interval
  startCleanupInterval() {
    // Only start if not already running
    if (this.cleanupIntervalId) {
      return
    }

    this.cleanupIntervalId = setInterval(() => {
      this.cleanup()
    }, CLEANUP_INTERVAL_MS)

    // Don't prevent Node from exiting
    if (this.cleanupIntervalId.unref) {
      this.cleanupIntervalId.unref()
    }
  }

  // Get current size (for monitoring)
  get size() {
    return this.codes.size
  }
}

// Create singleton instance
const verificationCodeStore = new VerificationCodeStore()

export default verificationCodeStore
