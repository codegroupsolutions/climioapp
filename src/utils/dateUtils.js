/**
 * Utilidades para manejo de fechas con timezone de Puerto Rico
 * Timezone: America/Puerto_Rico (AST - Atlantic Standard Time, UTC-4)
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';

// Timezone de Puerto Rico
export const PR_TIMEZONE = 'America/Puerto_Rico';

/**
 * Convierte una fecha UTC a timezone de Puerto Rico
 * @param {Date|string} date - Fecha en UTC
 * @returns {Date} Fecha en timezone de Puerto Rico
 */
export function toPuertoRicoTime(date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, PR_TIMEZONE);
}

/**
 * Convierte una fecha de Puerto Rico a UTC
 * @param {Date} date - Fecha en timezone de Puerto Rico
 * @returns {Date} Fecha en UTC
 */
export function fromPuertoRicoTime(date) {
  return fromZonedTime(date, PR_TIMEZONE);
}

/**
 * Formatea una fecha en timezone de Puerto Rico
 * @param {Date|string} date - Fecha a formatear
 * @param {string} formatStr - Formato de salida (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns {string} Fecha formateada
 */
export function formatPuertoRicoDate(date, formatStr = 'yyyy-MM-dd HH:mm:ss') {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, PR_TIMEZONE, formatStr);
}

/**
 * Convierte una fecha a formato datetime-local para inputs HTML
 * Ajustado al timezone de Puerto Rico
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha en formato 'yyyy-MM-ddTHH:mm'
 */
export function toDatetimeLocalString(date) {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, PR_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Convierte un string de datetime-local a Date UTC
 * Asumiendo que el input está en timezone de Puerto Rico
 * @param {string} datetimeLocal - String en formato 'yyyy-MM-ddTHH:mm'
 * @returns {Date} Fecha en UTC
 */
export function fromDatetimeLocalString(datetimeLocal) {
  if (!datetimeLocal) return null;

  // Parsear el string manualmente para crear una fecha en timezone de PR
  // El input viene en formato: 2025-10-06T14:30
  const [datePart, timePart] = datetimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  // Crear fecha interpretada como Puerto Rico timezone
  // Usamos fromZonedTime para indicar que estos componentes son en PR timezone
  const prDate = new Date(year, month - 1, day, hour, minute, 0);

  // Convertir a UTC
  return fromZonedTime(prDate, PR_TIMEZONE);
}

/**
 * Obtiene la fecha y hora actual en Puerto Rico
 * @returns {Date} Fecha actual en timezone de Puerto Rico
 */
export function getCurrentPuertoRicoTime() {
  return toZonedTime(new Date(), PR_TIMEZONE);
}

/**
 * Formatea una fecha para mostrar (formato legible)
 * @param {Date|string} date - Fecha a formatear
 * @param {boolean} includeTime - Si incluir la hora (default: true)
 * @returns {string} Fecha formateada
 */
export function formatDisplayDate(date, includeTime = true) {
  if (!date) return '';
  const formatStr = includeTime ? 'dd/MM/yyyy hh:mm a' : 'dd/MM/yyyy';
  return formatPuertoRicoDate(date, formatStr);
}

/**
 * Verifica si una fecha está en Puerto Rico timezone
 * y la ajusta si es necesario para datetime-local inputs
 * @param {string|Date} date - Fecha del query string o Date object
 * @returns {string} Fecha ajustada en formato datetime-local
 */
export function prepareDateForInput(date) {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return toDatetimeLocalString(dateObj);
  } catch (error) {
    return '';
  }
}

/**
 * Convierte una fecha ISO/UTC a formato de input date (YYYY-MM-DD)
 * Evita problemas de timezone extrayendo solo la parte de la fecha
 * @param {string|Date} date - Fecha en formato ISO o Date object
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatDateForInput(date) {
  if (!date) return '';

  try {
    // Si es string ISO, extraer solo la parte de la fecha
    if (typeof date === 'string') {
      // Si tiene formato ISO completo (YYYY-MM-DDTHH:mm:ss.sssZ)
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      // Si ya está en formato YYYY-MM-DD
      return date;
    }

    // Si es Date object, usar UTC para evitar timezone shifts
    const dateObj = date;
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}

/**
 * Convierte un string de input date (YYYY-MM-DD) a Date
 * Usa mediodía UTC (12:00:00) para evitar problemas de timezone
 * Esto asegura que la fecha se mantenga correcta independientemente del timezone local
 * @param {string} dateString - String en formato YYYY-MM-DD
 * @returns {Date|null} Date object o null si inválido
 */
export function parseInputDate(dateString) {
  if (!dateString) return null;

  try {
    // Usar mediodía UTC (12:00:00) en lugar de medianoche
    // Esto evita que al convertir a timezone local retroceda un día
    // Por ejemplo, 2025-01-15T12:00:00.000Z en Puerto Rico (UTC-4) = 2025-01-15 08:00 AM
    return new Date(`${dateString}T12:00:00.000Z`);
  } catch (error) {
    console.error('Error parsing input date:', error);
    return null;
  }
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (fecha local sin timezone)
 * @returns {string} Fecha actual en formato YYYY-MM-DD
 */
export function getTodayInputDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Agrega días a una fecha de input
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @param {number} days - Número de días a agregar
 * @returns {string} Nueva fecha en formato YYYY-MM-DD
 */
export function addDaysToInputDate(dateString, days) {
  if (!dateString) return '';

  try {
    const date = parseInputDate(dateString);
    if (!date) return '';

    date.setUTCDate(date.getUTCDate() + days);
    return formatDateForInput(date);
  } catch (error) {
    console.error('Error adding days to date:', error);
    return '';
  }
}
