// Rutas para operaciones de CV
const express = require('express');
const router = express.Router();

const auth                  = require('../middleware/auth');
const { planContext }       = require('../middleware/planContext');
const checkCvOptimizeLimit  = require('../middleware/checkCvOptimizeLimit');
const checkCvMatchLimit     = require('../middleware/checkCvMatchLimit');
const requireActiveTrial    = require('../middleware/requireActiveTrial');
const { dailyCap }          = require('../middleware/dailyCap');
const upload                = require('../middleware/upload');
const { limiterOptimize, limiterMatch } = require('../middleware/rateLimiter');
const { optimize, matchToJob, download, extractProfile, generarInfografia } = require('../controllers/cvController')
const { generarCV } = require('../controllers/cvGenerarController')

// Optimización de CV — hard cap + 1 análisis gratis + rate limit (5/15min)
router.post('/optimize', auth, dailyCap, planContext, limiterOptimize, checkCvOptimizeLimit, upload.single('cv'), optimize);

// CV vs Vacante — hard cap + 3 análisis gratis + rate limit (10/15min)
router.post('/match', auth, dailyCap, planContext, limiterMatch, checkCvMatchLimit, upload.single('cv'), matchToJob);

// Descarga del resultado — no consume crédito, pero respeta watermark según plan
router.get('/download/:id', auth, planContext, download);

// Extrae datos personales del CV para pre-llenar el onboarding (no consume crédito)
router.post('/extract-profile', auth, upload.single('cv'), extractProfile);

// Genera CV desde formulario estructurado (consume crédito de CV optimizer)
router.post('/generar', auth, dailyCap, planContext, limiterOptimize, checkCvOptimizeLimit, generarCV);

// Genera JSON estructurado para la vista infográfica (no consume crédito de análisis)
router.get('/infografia/:id', auth, planContext, generarInfografia);

module.exports = router;
