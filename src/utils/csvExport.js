/**
 * Utility functions for CSV export
 */

/**
 * Converts an array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Optional array of header names
 * @returns {string} CSV formatted string
 */
export function arrayToCSV(data, headers = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const keys = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = keys.map(escapeCSVValue).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      return escapeCSVValue(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escapes a value for CSV format
 * @param {any} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to string
  let stringValue = String(value);

  // Check if value needs to be quoted
  const needsQuotes = stringValue.includes(',') ||
                      stringValue.includes('"') ||
                      stringValue.includes('\n') ||
                      stringValue.includes('\r');

  if (needsQuotes) {
    // Escape quotes by doubling them
    stringValue = stringValue.replace(/"/g, '""');
    return `"${stringValue}"`;
  }

  return stringValue;
}

/**
 * Formats a date for CSV export
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateForCSV(date) {
  if (!date) return '';

  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '';
  }
}

/**
 * Formats a datetime for CSV export
 * @param {Date|string} datetime - Datetime to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTimeForCSV(datetime) {
  if (!datetime) return '';

  try {
    const d = new Date(datetime);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return '';
  }
}

/**
 * Creates a CSV download response
 * @param {string} csvContent - CSV content
 * @param {string} filename - Filename for download
 * @returns {Response} Response object for download
 */
export function createCSVResponse(csvContent, filename) {
  // Add BOM for Excel compatibility with UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  return new Response(blob, {
    headers: {
      'Content-Type': 'text/csv;charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
