// Punto de entrada del servidor Express
require('dotenv').config();

// Sentry debe inicializarse antes de importar app para instrumentar todas las rutas
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Muestreo al 10% en prod para no saturar cuota gratuita
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
  console.log('[Sentry] inicializado');
}

const app = require('./src/app');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);

  // Self-ping cada 14 minutos para evitar cold start en Render (plan gratuito)
  // Solo en producción para no interferir en desarrollo local
  if (process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.RENDER_EXTERNAL_URL;
    setInterval(async () => {
      try {
        await fetch(url);
        console.log('[keep-alive] ping ok');
      } catch (err) {
        console.warn('[keep-alive] ping fallido:', err.message);
      }
    }, 14 * 60 * 1000);
    console.log(`[keep-alive] activo → ${url}`);
  }
});
