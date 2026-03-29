// Configuración principal de Express
const express = require('express');
const cors = require('cors');
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

const app = express();

// --- Middlewares globales ---
app.use(helmet());
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'https://gestioncv.netlify.app',
  'https://optimacv.cv',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, Railway health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado: ${origin}`));
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiterGeneral);

// --- Ruta de salud (health check) ---
app.get('/', (req, res) => {
  res.json({ status: 'ok', producto: 'OPTIMA-CV' });
});

// --- Rutas de la API ---
app.use('/api/cv', cvRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/chat',      chatRoutes)
app.use('/api/interview', interviewRoutes)
app.use('/api/linkedin',  linkedinRoutes)
app.use('/api/codes',     codesRoutes)
app.use('/api/admin',     adminRoutes)

// --- Manejo global de errores ---
app.use((err, req, res, next) => {
  // Reportar a Sentry si está configurado (solo errores 5xx reales, no 4xx de negocio)
  if (process.env.SENTRY_DSN && (!err.status || err.status >= 500)) {
    const Sentry = require('@sentry/node');
    Sentry.captureException(err);
  }
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
