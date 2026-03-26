const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/auth')
const { analizarPerfil } = require('../controllers/linkedinController')

router.post('/analizar', auth, analizarPerfil)

module.exports = router
