// Configuración principal de Express
const express = require('express');
const cors = require('cors');

const cvRoutes = require('./routes/cv');
const jobsRoutes = require('./routes/jobs');
const emailRoutes = require('./routes/email');
const chatRoutes      = require('./routes/chat')
const interviewRoutes = require('./routes/interview')
const linkedinRoutes  = require('./routes/linkedin')

const app = express();

// --- Middlewares globales ---
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// --- Manejo global de errores ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
