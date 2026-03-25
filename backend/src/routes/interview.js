const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/auth')
const { generarPreguntas, evaluar } = require('../controllers/interviewController')

router.post('/preguntas', auth, generarPreguntas)
router.post('/evaluar',   auth, evaluar)

module.exports = router
