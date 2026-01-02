// Google Analytics Utilities
// Configuración y funciones helper para Google Analytics 4

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Verificar si GA está disponible
const isGAAvailable = () => {
  return typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID;
};

// Registrar una vista de página
export const pageview = (url) => {
  if (!isGAAvailable()) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Registrar un evento personalizado
export const event = ({ action, category, label, value }) => {
  if (!isGAAvailable()) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Eventos predefinidos para el CRM

// Evento de inicio de sesión
export const trackLogin = (method = 'email') => {
  event({
    action: 'login',
    category: 'authentication',
    label: method,
  });
};

// Evento de registro
export const trackSignUp = (method = 'email') => {
  event({
    action: 'sign_up',
    category: 'authentication',
    label: method,
  });
};

// Evento de creación de cotización
export const trackQuoteCreated = (quoteId, total) => {
  event({
    action: 'quote_created',
    category: 'quotes',
    label: quoteId,
    value: total,
  });
};

// Evento de cotización aceptada
export const trackQuoteAccepted = (quoteId, total) => {
  event({
    action: 'quote_accepted',
    category: 'quotes',
    label: quoteId,
    value: total,
  });
};

// Evento de factura creada
export const trackInvoiceCreated = (invoiceId, total) => {
  event({
    action: 'invoice_created',
    category: 'invoices',
    label: invoiceId,
    value: total,
  });
};

// Evento de pago recibido
export const trackPaymentReceived = (invoiceId, amount) => {
  event({
    action: 'payment_received',
    category: 'payments',
    label: invoiceId,
    value: amount,
  });
};

// Evento de cita agendada
export const trackAppointmentScheduled = (appointmentId, type) => {
  event({
    action: 'appointment_scheduled',
    category: 'appointments',
    label: type,
  });
};

// Evento de cliente creado
export const trackClientCreated = (clientType) => {
  event({
    action: 'client_created',
    category: 'clients',
    label: clientType,
  });
};

// Evento de producto agregado
export const trackProductAdded = (productId, category) => {
  event({
    action: 'product_added',
    category: 'inventory',
    label: category,
  });
};

// Evento de búsqueda
export const trackSearch = (searchTerm, resultsCount) => {
  event({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
    value: resultsCount,
  });
};

// Evento de exportación de PDF
export const trackPDFExport = (documentType) => {
  event({
    action: 'pdf_export',
    category: 'documents',
    label: documentType,
  });
};

// Evento de error
export const trackError = (errorType, errorMessage) => {
  event({
    action: 'error',
    category: 'errors',
    label: `${errorType}: ${errorMessage}`,
  });
};