const express = require('express')
const router  = express.Router()
const { analizarPerfil } = require('../controllers/linkedinController')

router.post('/analizar', analizarPerfil)

module.exports = router
