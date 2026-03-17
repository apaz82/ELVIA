// Rutas para operaciones de CV
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const usageLimit = require('../middleware/usageLimit');
const upload = require('../middleware/upload');
const { optimize, matchToJob, download } = require('../controllers/cvController');

// Optimización de CV — requiere auth, verificación de límite y archivo adjunto
router.post('/optimize', auth, usageLimit, upload.single('cv'), optimize);

// CV vs Vacante — mismos middlewares
router.post('/match', auth, usageLimit, upload.single('cv'), matchToJob);

// Descarga del resultado — solo requiere auth (no consume uso)
router.get('/download/:id', auth, download);

module.exports = router;
