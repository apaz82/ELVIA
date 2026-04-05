const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const auth    = require('../middleware/auth')
const { planContext }    = require('../middleware/planContext')
const requirePaidPlan    = require('../middleware/requirePaidPlan')
const { analizarPerfil, extraerPerfilPDF, extraerPerfilTexto } = require('../controllers/linkedinController')

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
router.post('/analizar', auth, planContext, requirePaidPlan, analizarPerfil)

// Endpoints de Extracción Mágica (PDF y Pegado)
router.post('/extraer-pdf', auth, planContext, requirePaidPlan, upload.single('pdf'), extraerPerfilPDF)
router.post('/extraer-texto', auth, planContext, requirePaidPlan, extraerPerfilTexto)

module.exports = router
