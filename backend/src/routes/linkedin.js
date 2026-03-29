const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/auth')
const { planContext }    = require('../middleware/planContext')
const requirePaidPlan    = require('../middleware/requirePaidPlan')
const { analizarPerfil } = require('../controllers/linkedinController')

// Solo usuarios de pago pueden usar LinkedIn Optimo
router.post('/analizar', auth, planContext, requirePaidPlan, analizarPerfil)

module.exports = router
