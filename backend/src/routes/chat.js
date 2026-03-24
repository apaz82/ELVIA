const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatRateLimit = require('../middleware/chatRateLimit');
const chatController = require('../controllers/chatController');

// POST /api/chat - Interactuar con el IA Copilot
router.post('/', auth, chatRateLimit, chatController.handleChat);

module.exports = router;
