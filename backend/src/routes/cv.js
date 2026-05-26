// Rutas para operaciones de CV
const express = require('express');
const router = express.Router();

const auth                  = require('../middleware/auth');
const { planContext }       = require('../middleware/planContext');
const checkCvOptimizeLimit  = require('../middleware/checkCvOptimizeLimit');
const checkCvGenerarLimit   = require('../middleware/checkCvGenerarLimit');
const checkCvMatchLimit     = require('../middleware/checkCvMatchLimit');
const requireActiveTrial    = require('../middleware/requireActiveTrial');
const { dailyCap }          = require('../middleware/dailyCap');
const upload                = require('../middleware/upload');
const { limiterOptimize, limiterMatch, limiterResumen } = require('../middleware/rateLimiter');
const { optimize, matchToJob, download, extractProfile, generarInfografia, generarInfografiaProyecto, generarCartaPresentacion, optimizarResumen } = require('../controllers/cvController')
const { generarCV } = require('../controllers/cvGenerarController')

// Optimización de CV — orden de middlewares: validaciones de usuario PRIMERO,
// hard cap global del sistema AL FINAL (solo bumpea contador si todo lo demás pasó)
router.post('/optimize', auth, planContext, limiterOptimize, checkCvOptimizeLimit, dailyCap, upload.single('cv'), optimize);

// CV vs Vacante — mismo orden: usuario → rate → plan → dailyCap
router.post('/match', auth, planContext, limiterMatch, checkCvMatchLimit, dailyCap, upload.single('cv'), matchToJob);

// Descarga del resultado — no consume crédito, pero respeta watermark según plan
router.get('/download/:id', auth, planContext, download);

// Extrae datos personales del CV para pre-llenar el onboarding (no consume crédito)
router.post('/extract-profile', auth, upload.single('cv'), extractProfile);

// Genera CV desde formulario estructurado — dailyCap al final tras validaciones
router.post('/generar', auth, planContext, limiterOptimize, checkCvGenerarLimit, dailyCap, generarCV);

// Genera JSON estructurado para la vista infográfica (no consume crédito de análisis)
router.get('/infografia/:id', auth, planContext, generarInfografia);

// Genera la Infografía Visual del Proyecto Laboral (Corrección Ortográfica + DB Persist)
router.post('/infografia-proyecto', auth, generarInfografiaProyecto);

// Carta de presentación para una vacante (consume dailyCap, auth requerido)
router.post('/carta', auth, dailyCap, limiterMatch, generarCartaPresentacion);

// Optimiza el resumen profesional (tono humano, ortografía, estructura)
router.post('/optimizar-resumen', auth, limiterResumen, optimizarResumen);

module.exports = router;
