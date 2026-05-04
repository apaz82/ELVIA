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

// Optimización de CV — hard cap + 1 análisis gratis + rate limit (5/15min)
router.post('/optimize', auth, dailyCap, planContext, limiterOptimize, checkCvOptimizeLimit, upload.single('cv'), optimize);

// CV vs Vacante — hard cap + 3 análisis gratis + rate limit (10/15min)
router.post('/match', auth, dailyCap, planContext, limiterMatch, checkCvMatchLimit, upload.single('cv'), matchToJob);

// Descarga del resultado — no consume crédito, pero respeta watermark según plan
router.get('/download/:id', auth, planContext, download);

// Extrae datos personales del CV para pre-llenar el onboarding (no consume crédito)
router.post('/extract-profile', auth, upload.single('cv'), extractProfile);

// Genera CV desde formulario estructurado (consume crédito de CV desde cero)
router.post('/generar', auth, dailyCap, planContext, limiterOptimize, checkCvGenerarLimit, generarCV);

// Genera JSON estructurado para la vista infográfica (no consume crédito de análisis)
router.get('/infografia/:id', auth, planContext, generarInfografia);

// Genera la Infografía Visual del Proyecto Laboral (Corrección Ortográfica + DB Persist)
router.post('/infografia-proyecto', auth, generarInfografiaProyecto);

// Carta de presentación para una vacante (consume dailyCap, auth requerido)
router.post('/carta', auth, dailyCap, limiterMatch, generarCartaPresentacion);

// Optimiza el resumen profesional (tono humano, ortografía, estructura)
router.post('/optimizar-resumen', auth, limiterResumen, optimizarResumen);

module.exports = router;
