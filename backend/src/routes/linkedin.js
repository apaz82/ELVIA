const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const auth    = require('../middleware/auth')
const { planContext }    = require('../middleware/planContext')
const requirePaidPlan    = require('../middleware/requirePaidPlan')
const { limiterOptimize } = require('../middleware/rateLimiter')
const { analizarPerfil, extraerPerfilPDF, getHistorial, guardarReporte, getUsoMes, getUltimoAnalisis } = require('../controllers/linkedinController')

// Configuración de Multer para recibir PDF en memoria
const storage = multer.memoryStorage()
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Solo se permiten archivos PDF'))
  }
})

// Solo usuarios de pago pueden usar LinkedIn Optimo
router.post('/analizar',      auth, planContext, requirePaidPlan, limiterOptimize, analizarPerfil)

// Historial de análisis del usuario (solo requiere auth, no plan de pago)
router.get('/historial',      auth, planContext, getHistorial)

// Uso del mes — para mostrar contador "X de 5 análisis restantes este mes" antes de gastar tokens
router.get('/uso-mes',        auth, planContext, getUsoMes)

// Extracción de PDF de LinkedIn
router.post('/extraer-pdf',   auth, planContext, requirePaidPlan, limiterOptimize, upload.single('pdf'), extraerPerfilPDF)

// Guardar reporte LinkedIn en Mis Documentos — UPSERT (un registro por usuario)
router.post('/guardar-reporte', auth, planContext, requirePaidPlan, guardarReporte)

// Último análisis guardado — para precargar el formulario
router.get('/ultimo-analisis', auth, planContext, getUltimoAnalisis)

module.exports = router
