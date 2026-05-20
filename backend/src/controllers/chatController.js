const { generateChatResponse } = require('../services/deepseekService');

const handleChat = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    let history = req.body.history || [];

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El campo message es requerido' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Mensaje demasiado largo (máximo 2000 caracteres)' });
    }

    history = Array.isArray(history) ? history.slice(-10) : [];

    const replyText = await generateChatResponse(message, history, context);

    return res.json({ reply: replyText });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleChat
};
