const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/auth')
const { planContext }  = require('../middleware/planContext')
const requirePaidPlan  = require('../middleware/requirePaidPlan')
const { limiterOptimize } = require('../middleware/rateLimiter')
const { generarPreguntas, evaluar } = require('../controllers/interviewController')

// Solo usuarios de pago pueden usar Entrevista
router.post('/preguntas', auth, planContext, requirePaidPlan, limiterOptimize, generarPreguntas)
router.post('/evaluar',   auth, planContext, requirePaidPlan, limiterOptimize, evaluar)

module.exports = router
