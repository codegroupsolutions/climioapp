// src/instrumentation.js
// Archivo de instrumentación para Azure Application Insights
// Next.js 15 ejecuta este archivo automáticamente al iniciar el servidor

export async function register() {
  // Solo ejecutar en servidor Node.js (no en Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Solo habilitar en producción
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Telemetry] Skipping - not in production environment');
      return;
    }

    // Verificar que exista la connection string
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (!connectionString) {
      console.warn('[Telemetry] APPLICATIONINSIGHTS_CONNECTION_STRING not configured');
      return;
    }

    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { useAzureMonitor } = await import('@azure/monitor-opentelemetry');

      // eslint-disable-next-line react-hooks/rules-of-hooks
      useAzureMonitor({
        azureMonitorExporterOptions: {
          connectionString,
        },
        instrumentationOptions: {
          // Captura automática de requests HTTP entrantes y salientes
          http: { enabled: true },
          // Captura llamadas a servicios de Azure (Storage, etc.)
          azureSdk: { enabled: true },
        },
        // Ratio de muestreo (1.0 = 100% de las requests)
        samplingRatio: parseFloat(process.env.TELEMETRY_SAMPLING_RATIO || '1.0'),
        // Habilitar métricas en tiempo real
        enableLiveMetrics: true,
        // Habilitar métricas estándar de performance
        enableStandardMetrics: true,
      });

      console.log('[Telemetry] Azure Application Insights initialized successfully');
    } catch (error) {
      console.error('[Telemetry] Failed to initialize Azure Application Insights:', error);
    }
  }

  // Edge runtime tiene soporte limitado
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('[Telemetry] Edge runtime detected - limited telemetry available');
  }
}

// Captura automática de errores en requests
export function onRequestError({ err, request, context }) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Los errores son capturados automáticamente por OpenTelemetry
  // Este hook es para logging adicional si es necesario
  console.error('[Request Error]', {
    error: err.message,
    url: request?.url,
    method: request?.method,
  });
}
