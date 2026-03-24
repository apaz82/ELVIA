/**
 * Rate Limiter en memoria para el endpoint de Chat (AI Copilot)
 * Evita el abuso de la API de Anthropic/OpenAI por usuario autenticado.
 * Límite: 15 mensajes por minuto por usuario.
 */
const userRequests = new Map();

const chatRateLimit = (req, res, next) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const now = Date.now();
  const userData = userRequests.get(userId) || { count: 0, firstRequest: now };

  // Reiniciar la ventana de tiempo cada 60 segundos
  if (now - userData.firstRequest > 60000) {
    userData.count = 1;
    userData.firstRequest = now;
  } else {
    userData.count++;
  }

  userRequests.set(userId, userData);

  // Límite de 15 peticiones por minuto
  if (userData.count > 15) {
    return res.status(429).json({ 
      error: 'Too Many Requests',
      reply: 'Has enviado demasiados mensajes muy rápido. Por favor, espera un minuto para continuar chateando.' 
    });
  }

  next();
};

module.exports = chatRateLimit;
