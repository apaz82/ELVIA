const { generateChatResponse } = require('../services/claudeService');

const handleChat = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    let history = req.body.history || [];

    if (!message) {
      return res.status(400).json({ error: 'El campo message es requerido' });
    }

    const replyText = await generateChatResponse(message, history, context);

    return res.json({ reply: replyText });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleChat
};
