/**
 * Password validation utilities
 */

// Common weak passwords to reject
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'monkey', 'master', 'dragon',
  'letmein', 'login', 'welcome', 'admin', 'admin123',
  'root', 'toor', 'pass', 'test', 'guest',
  'password1', 'qwerty123', 'iloveyou', 'sunshine', 'princess',
  'football', 'baseball', 'soccer', 'hockey', 'batman',
  'trustno1', 'superman', 'hello', 'charlie', 'donald',
  'passw0rd', 'shadow', 'ashley', 'michael', 'ninja',
  '1234567', '654321', '666666', '121212', '000000',
  'contraseña', 'clave', 'usuario', 'administrador'
])

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, errors: string[] }} - Validation result
 */
export function validatePassword(password) {
  const errors = []

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['La contraseña es requerida'] }
  }

  // Minimum length
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }

  // Maximum length (prevent DoS with very long passwords)
  if (password.length > 128) {
    errors.push('La contraseña no puede tener más de 128 caracteres')
  }

  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula')
  }

  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula')
  }

  // Must contain at least one number
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  }

  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)')
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Esta contraseña es muy común. Por favor elige una más segura')
  }

  // Check for repeating characters (e.g., 'aaaaaa')
  if (/(.)\1{3,}/.test(password)) {
    errors.push('La contraseña no puede tener más de 3 caracteres repetidos consecutivos')
  }

  // Check for sequential characters (e.g., '123456', 'abcdef')
  if (hasSequentialChars(password, 4)) {
    errors.push('La contraseña no puede contener secuencias de 4 o más caracteres consecutivos')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check if password contains sequential characters
 */
function hasSequentialChars(str, minLength) {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    'QWERTYUIOP',
    'ASDFGHJKL',
    'ZXCVBNM'
  ]

  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - minLength; i++) {
      const subseq = seq.substring(i, i + minLength)
      if (str.includes(subseq)) {
        return true
      }
      // Also check reverse
      const reverseSubseq = subseq.split('').reverse().join('')
      if (str.includes(reverseSubseq)) {
        return true
      }
    }
  }

  return false
}

/**
 * Get password strength score (0-100)
 * @param {string} password - Password to check
 * @returns {number} - Strength score
 */
export function getPasswordStrength(password) {
  if (!password) return 0

  let score = 0

  // Length score
  score += Math.min(password.length * 4, 40)

  // Character variety
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 10
  if (/[0-9]/.test(password)) score += 10
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20

  // Penalties
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score -= 50
  if (/^[a-zA-Z]+$/.test(password)) score -= 10
  if (/^[0-9]+$/.test(password)) score -= 20

  return Math.max(0, Math.min(100, score))
}
