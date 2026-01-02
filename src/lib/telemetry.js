// src/lib/telemetry.js
// Utilidad centralizada para telemetría y eventos de negocio
// Este módulo proporciona tracking automático basado en rutas de API

let appInsightsClient = null;

// Inicialización lazy del cliente de Application Insights
async function getClient() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  if (!appInsightsClient && process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    try {
      const appInsights = await import('applicationinsights');

      // Configurar el cliente
      appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoCollectRequests(false) // Ya lo hace instrumentation.js con OpenTelemetry
        .setAutoCollectPerformance(false) // Ya lo hace OpenTelemetry
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(false) // Ya lo hace OpenTelemetry
        .setAutoCollectConsole(false)
        .setUseDiskRetryCaching(true)
        .start();

      appInsightsClient = appInsights.defaultClient;
    } catch (error) {
      console.error('[Telemetry] Failed to initialize Application Insights client:', error);
    }
  }

  return appInsightsClient;
}

// Mapeo centralizado de rutas a eventos de negocio
// Usa wildcards (*) para IDs dinámicos
const BUSINESS_EVENT_MAP = {
  // ============ Autenticación ============
  'POST /api/auth/login': { name: 'User_Login', category: 'Auth' },
  'POST /api/auth/register': { name: 'User_Register', category: 'Auth' },
  'POST /api/companies/register': { name: 'Company_Registered', category: 'Onboarding' },
  'POST /api/forgot-password': { name: 'Password_Reset_Requested', category: 'Auth' },
  'POST /api/reset-password': { name: 'Password_Reset_Completed', category: 'Auth' },

  // ============ Cotizaciones (Quotes) ============
  'POST /api/quotes': { name: 'Quote_Created', category: 'Sales' },
  'PUT /api/quotes/*': { name: 'Quote_Updated', category: 'Sales' },
  'DELETE /api/quotes/*': { name: 'Quote_Deleted', category: 'Sales' },
  'POST /api/quotes/*/send': { name: 'Quote_Sent', category: 'Sales' },
  'PUT /api/quotes/*/status': { name: 'Quote_StatusChanged', category: 'Sales' },
  'POST /api/quotes/*/convert': { name: 'Quote_ConvertedToInvoice', category: 'Sales' },

  // ============ Facturas (Invoices) ============
  'POST /api/invoices': { name: 'Invoice_Created', category: 'Sales' },
  'PUT /api/invoices/*': { name: 'Invoice_Updated', category: 'Sales' },
  'DELETE /api/invoices/*': { name: 'Invoice_Deleted', category: 'Sales' },
  'POST /api/invoices/*/payments': { name: 'Payment_Received', category: 'Finance' },
  'PUT /api/invoices/*/status': { name: 'Invoice_StatusChanged', category: 'Finance' },
  'POST /api/invoices/*/send': { name: 'Invoice_Sent', category: 'Finance' },

  // ============ Citas (Appointments) ============
  'POST /api/appointments': { name: 'Appointment_Scheduled', category: 'Operations' },
  'PUT /api/appointments/*': { name: 'Appointment_Updated', category: 'Operations' },
  'DELETE /api/appointments/*': { name: 'Appointment_Cancelled', category: 'Operations' },
  'POST /api/appointments/*/complete-task': { name: 'Task_Completed', category: 'Operations' },
  'PUT /api/appointments/*/status': { name: 'Appointment_StatusChanged', category: 'Operations' },

  // ============ Clientes (Clients) ============
  'POST /api/clients': { name: 'Client_Created', category: 'CRM' },
  'PUT /api/clients/*': { name: 'Client_Updated', category: 'CRM' },
  'DELETE /api/clients/*': { name: 'Client_Deleted', category: 'CRM' },

  // ============ Productos (Products) ============
  'POST /api/products': { name: 'Product_Created', category: 'Inventory' },
  'PUT /api/products/*': { name: 'Product_Updated', category: 'Inventory' },
  'DELETE /api/products/*': { name: 'Product_Deleted', category: 'Inventory' },

  // ============ Inventario ============
  'POST /api/inventory/movements': { name: 'Inventory_Movement', category: 'Inventory' },
  'PUT /api/inventory/adjust': { name: 'Stock_Adjusted', category: 'Inventory' },

  // ============ Categorías ============
  'POST /api/categories': { name: 'Category_Created', category: 'Admin' },
  'PUT /api/categories/*': { name: 'Category_Updated', category: 'Admin' },
  'DELETE /api/categories/*': { name: 'Category_Deleted', category: 'Admin' },

  // ============ Contratos de Servicio ============
  'POST /api/service-contracts': { name: 'Contract_Created', category: 'Operations' },
  'PUT /api/service-contracts/*': { name: 'Contract_Updated', category: 'Operations' },
  'POST /api/service-contracts/*/schedule': { name: 'Contract_Scheduled', category: 'Operations' },

  // ============ Usuarios ============
  'POST /api/users': { name: 'User_Created', category: 'Admin' },
  'PUT /api/users/*': { name: 'User_Updated', category: 'Admin' },
  'DELETE /api/users/*': { name: 'User_Deleted', category: 'Admin' },

  // ============ Reportes ============
  'GET /api/reports/*': { name: 'Report_Generated', category: 'Analytics' },
  'POST /api/reports/export': { name: 'Report_Exported', category: 'Analytics' },

  // ============ Configuración ============
  'PUT /api/settings/*': { name: 'Settings_Updated', category: 'Admin' },
  'PUT /api/companies/*': { name: 'Company_Updated', category: 'Admin' },
};

/**
 * Hace match de una ruta con wildcards
 * Ejemplo: 'PUT /api/quotes/123' matchea con 'PUT /api/quotes/*'
 */
function matchRoute(method, pathname) {
  const key = `${method} ${pathname}`;

  // Buscar match exacto primero
  if (BUSINESS_EVENT_MAP[key]) {
    return BUSINESS_EVENT_MAP[key];
  }

  // Buscar match con wildcards
  for (const [pattern, eventConfig] of Object.entries(BUSINESS_EVENT_MAP)) {
    // Convertir patrón a regex: '*' -> '[^/]+'
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escapar caracteres especiales
      .replace(/\\\*/g, '[^/]+'); // Reemplazar \* con [^/]+

    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(key)) {
      return eventConfig;
    }
  }

  return null;
}

/**
 * Trackea un evento de negocio basado en la request HTTP
 * Se llama automáticamente desde el middleware
 */
export async function trackBusinessEvent(request, response, context = {}) {
  if (process.env.NODE_ENV !== 'production') {
    // En desarrollo, solo log
    const url = new URL(request.url);
    const eventConfig = matchRoute(request.method, url.pathname);
    if (eventConfig) {
      console.log(`[BusinessEvent] ${eventConfig.name}`, {
        category: eventConfig.category,
        path: url.pathname,
        status: response.status,
      });
    }
    return;
  }

  try {
    const client = await getClient();
    if (!client) return;

    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    const eventConfig = matchRoute(method, pathname);

    // Solo trackear si hay un evento configurado y la respuesta fue exitosa
    if (eventConfig && response.status >= 200 && response.status < 300) {
      client.trackEvent({
        name: eventConfig.name,
        properties: {
          category: eventConfig.category,
          method,
          path: pathname,
          statusCode: response.status.toString(),
          companyId: context.companyId || 'unknown',
          userRole: context.userRole || 'unknown',
          duration: context.duration?.toString() || '0',
        },
      });
    }

    // Trackear errores del servidor (5xx)
    if (response.status >= 500) {
      client.trackException({
        exception: new Error(`Server Error: ${response.status} on ${method} ${pathname}`),
        properties: {
          method,
          path: pathname,
          statusCode: response.status.toString(),
          companyId: context.companyId || 'unknown',
        },
      });
    }
  } catch (error) {
    console.error('[Telemetry] Error tracking business event:', error);
  }
}

/**
 * Trackea un evento personalizado manualmente
 * Usar cuando necesitas tracking específico fuera del flujo automático
 */
export async function trackCustomEvent(eventName, properties = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[CustomEvent] ${eventName}`, properties);
    return;
  }

  try {
    const client = await getClient();
    if (!client) return;

    client.trackEvent({
      name: eventName,
      properties: sanitizeProperties(properties),
    });
  } catch (error) {
    console.error('[Telemetry] Error tracking custom event:', error);
  }
}

/**
 * Trackea una excepción/error manualmente
 */
export async function trackException(error, properties = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Exception]', error, properties);
    return;
  }

  try {
    const client = await getClient();
    if (!client) return;

    client.trackException({
      exception: error,
      properties: sanitizeProperties(properties),
    });
  } catch (err) {
    console.error('[Telemetry] Error tracking exception:', err);
  }
}

/**
 * Trackea una métrica personalizada
 */
export async function trackMetric(name, value, properties = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Metric] ${name}: ${value}`, properties);
    return;
  }

  try {
    const client = await getClient();
    if (!client) return;

    client.trackMetric({
      name,
      value,
      properties: sanitizeProperties(properties),
    });
  } catch (error) {
    console.error('[Telemetry] Error tracking metric:', error);
  }
}

/**
 * Sanitiza propiedades para evitar enviar datos PII
 */
function sanitizeProperties(props) {
  const sanitized = {};
  const piiFields = [
    'email', 'phone', 'password', 'name', 'firstName', 'lastName',
    'address', 'token', 'secret', 'key', 'ssn', 'creditCard',
  ];

  for (const [key, value] of Object.entries(props)) {
    // Excluir campos que puedan contener PII
    const lowerKey = key.toLowerCase();
    if (piiFields.some(field => lowerKey.includes(field))) {
      continue;
    }

    // Convertir valores a strings (Application Insights requiere strings)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = String(value);
    } else if (value !== null && value !== undefined) {
      sanitized[key] = JSON.stringify(value);
    }
  }

  return sanitized;
}

// Exportar constantes de eventos para uso directo si es necesario
export const BusinessEvents = {
  // Auth
  USER_LOGIN: 'User_Login',
  USER_REGISTER: 'User_Register',
  COMPANY_REGISTERED: 'Company_Registered',

  // Sales
  QUOTE_CREATED: 'Quote_Created',
  QUOTE_SENT: 'Quote_Sent',
  QUOTE_CONVERTED: 'Quote_ConvertedToInvoice',
  INVOICE_CREATED: 'Invoice_Created',
  PAYMENT_RECEIVED: 'Payment_Received',

  // Operations
  APPOINTMENT_SCHEDULED: 'Appointment_Scheduled',
  TASK_COMPLETED: 'Task_Completed',
  CONTRACT_CREATED: 'Contract_Created',

  // CRM
  CLIENT_CREATED: 'Client_Created',

  // Inventory
  PRODUCT_CREATED: 'Product_Created',
  STOCK_ADJUSTED: 'Stock_Adjusted',
};

const telemetry = {
  trackBusinessEvent,
  trackCustomEvent,
  trackException,
  trackMetric,
  BusinessEvents,
};

export default telemetry;
