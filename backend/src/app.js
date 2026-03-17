// Configuración principal de Express
const express = require('express');
const cors = require('cors');

const cvRoutes = require('./routes/cv');
const jobsRoutes = require('./routes/jobs');
const emailRoutes = require('./routes/email');

const app = express();

// --- Middlewares globales ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Ruta de salud (health check) ---
app.get('/', (req, res) => {
  res.json({ status: 'ok', producto: 'CV Optimizer Pro' });
});

// --- Rutas de la API ---
app.use('/api/cv', cvRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/email', emailRoutes);

// --- Manejo global de errores ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
