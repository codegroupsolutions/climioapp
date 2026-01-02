/**
 * HTML Sanitization utilities for preventing XSS attacks
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string safe for HTML insertion
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') {
    return ''
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }

  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char])
}

/**
 * Sanitize string for use in email templates
 * Escapes HTML and preserves newlines as <br> tags
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeForEmail(str) {
  if (!str || typeof str !== 'string') {
    return ''
  }

  // First escape HTML, then convert newlines to <br>
  return escapeHtml(str).replace(/\n/g, '<br>')
}

/**
 * Sanitize object for email template
 * @param {object} data - Object with string values to sanitize
 * @returns {object} - Object with sanitized values
 */
export function sanitizeEmailData(data) {
  const sanitized = {}

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = escapeHtml(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Strip all HTML tags from a string
 * @param {string} str - String to strip tags from
 * @returns {string} - Plain text without HTML tags
 */
export function stripHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return ''
  }

  return str.replace(/<[^>]*>/g, '')
}
