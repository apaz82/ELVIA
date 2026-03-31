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

const app = express();

// --- Configuración para Proxies (Railway/Render) ---
// Necesario para que express-rate-limit identifique IPs correctamente tras el balanceador
app.set('trust proxy', 1);


// --- CORS Configuración Segura ---
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'https://gestioncv.netlify.app',
  'https://optimacv.cv',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// --- Ruta de salud (health check) ---
// Se coloca aquí para que responda incluso si fallan otros middlewares pesados
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
