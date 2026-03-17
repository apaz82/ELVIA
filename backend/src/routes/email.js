// Rutas de email — implementación en siguiente fase
const express = require('express');
const router = express.Router();

// POST /api/email/send
router.post('/send', (req, res) => {
  res.json({ mensaje: 'Envío de email — próximamente' });
});

module.exports = router;
