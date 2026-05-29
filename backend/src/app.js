// Configuración principal de Express
const express = require('express');
const cors = require('cors');

// --- Manejo de errores fatales del proceso ---
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  // En producción, podrías querer cerrar el servidor de forma elegante aquí
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
const helmet = require('helmet');

const { limiterGeneral } = require('./middleware/rateLimiter');
const cvRoutes = require('./routes/cv');
const jobsRoutes = require('./routes/jobs');
const emailRoutes = require('./routes/email');
const chatRoutes      = require('./routes/chat')
const interviewRoutes = require('./routes/interview')
const linkedinRoutes  = require('./routes/linkedin')
const codesRoutes     = require('./routes/codes')
const adminRoutes     = require('./routes/admin')
const waitlistRoutes  = require('./routes/waitlist')
const eventRoutes     = require('./routes/events')
const companyRoutes   = require('./routes/company')

const app = express();

// --- Configuración para Proxies (Railway/Render) ---
// Necesario para que express-rate-limit identifique IPs correctamente tras el balanceador
app.set('trust proxy', 1);


// --- CORS Configuración Segura ---
const PRODUCTION_ORIGINS = [
  'https://elvia.lat',
  'https://www.elvia.lat',
  'https://gestioncv.netlify.app',
];

// En desarrollo, permitir cualquier puerto localhost (Vite elige el puerto dinámicamente)
const IS_DEV = process.env.NODE_ENV !== 'production';
const LOCALHOST_REGEX = /^http:\/\/localhost:\d+$/;
// Netlify deploy previews y branch deploys (*.netlify.app)
const NETLIFY_PREVIEW_REGEX = /^https:\/\/[a-z0-9-]+\.netlify\.app$/;

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Producción: solo orígenes explícitos
    if (PRODUCTION_ORIGINS.includes(origin)) return callback(null, true);

    // Netlify previews y branch deploys
    if (NETLIFY_PREVIEW_REGEX.test(origin)) return callback(null, true);

    // Desarrollo: cualquier localhost
    if (IS_DEV && LOCALHOST_REGEX.test(origin)) return callback(null, true);

    console.warn(`[CORS Blocked] Origin: ${origin}`);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Lista unificada para el error handler (necesita saber si el origin es válido)
const isAllowedOrigin = (origin) =>
  !origin ||
  PRODUCTION_ORIGINS.includes(origin) ||
  NETLIFY_PREVIEW_REGEX.test(origin) ||
  (IS_DEV && LOCALHOST_REGEX.test(origin));

// --- Ruta de salud (health check) ---
// Se coloca aquí para que responda incluso si fallan otros middlewares pesados
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.anthropic.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
    },
  },
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(limiterGeneral);



// --- Rutas de la API ---
app.use('/api/cv', cvRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/chat',      chatRoutes)
app.use('/api/interview', interviewRoutes)
app.use('/api/linkedin',  linkedinRoutes)
app.use('/api/codes',     codesRoutes)
app.use('/api/admin',     adminRoutes)
app.use('/api/company',   companyRoutes)
app.use('/api/waitlist',  waitlistRoutes)
app.use('/api/events',    eventRoutes)

// --- Manejo global de errores ---
app.use((err, req, res, next) => {
  // Reportar a Sentry si está configurado (solo errores 5xx reales, no 4xx de negocio)
  if (process.env.SENTRY_DSN && (!err.status || err.status >= 500)) {
    const Sentry = require('@sentry/node');
    Sentry.captureException(err);
  }
  console.error(err.stack);

  // Asegurar que los errores mantengan headers CORS para que el browser los reciba
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
