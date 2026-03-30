// Configuración principal de Express
const express = require('express');
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

// --- CORS manual — bypassea el paquete cors para máxima compatibilidad con proxies ---
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'https://gestioncv.netlify.app',
  'https://optimacv.cv',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  }
  // Preflight OPTIONS — responder inmediatamente con 204
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(helmet());

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
