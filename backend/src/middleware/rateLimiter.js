// Rate limiting — protege endpoints de IA contra abuso y gasto excesivo
const rateLimit = require('express-rate-limit');
// ipKeyGenerator: resuelve IPv6 correctamente y satisface la validación de express-rate-limit v7
const { ipKeyGenerator } = rateLimit;

// Mensaje estándar de error para respuestas de rate limit
const mensaje429 = (tipo) => ({
  error:   'LIMITE_EXCEDIDO',
  mensaje: `Demasiadas solicitudes de ${tipo}. Espera unos minutos antes de continuar.`,
});

// ── CV Optimizer: máximo 5 análisis por usuario por 15 minutos ─
// Un usuario legítimo no necesita optimizar más de 5 CVs seguidos.
// Protege el mayor costo por request (~2000 tokens de salida con Sonnet).
const limiterOptimize = rateLimit({
  windowMs:          15 * 60 * 1000, // 15 minutos
  max:               5,
  standardHeaders:   true,
  legacyHeaders:     false,
  // validate.keyGeneratorIpFallback: false → desactiva la validación estricta de express-rate-limit v7
  // que detecta cuando el keyGenerator usa IP de forma "implícita". Nuestro fallback es intencional.
  validate:          { keyGeneratorIpFallback: false },
  keyGenerator:      (req) => req.user?.id || ipKeyGenerator(req),
  handler:           (_req, res) => res.status(429).json(mensaje429('optimización de CV')),
  skip:              (req) => req.planInfo?.isPaidPlan,
});

// ── CV Match: máximo 10 análisis por usuario por 15 minutos ────
// Permite más requests porque el match es parte del flujo iterativo.
const limiterMatch = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               10,
  standardHeaders:   true,
  legacyHeaders:     false,
  validate:          { keyGeneratorIpFallback: false },
  keyGenerator:      (req) => req.user?.id || ipKeyGenerator(req),
  handler:           (_req, res) => res.status(429).json(mensaje429('análisis de compatibilidad')),
  skip:              (req) => req.planInfo?.isPaidPlan,
});

// ── General API: protección global contra flood ────────────────
// Aplica a todos los endpoints — previene ataques de enumeración y scraping.
const limiterGeneral = rateLimit({
  windowMs:          60 * 1000,  // 1 minuto
  max:               60,          // 60 requests/min por IP es más que suficiente para un usuario normal
  standardHeaders:   true,
  legacyHeaders:     false,
  handler:           (_req, res) => res.status(429).json({
    error:   'LIMITE_EXCEDIDO',
    mensaje: 'Demasiadas solicitudes. Espera un momento.',
  }),
});

// ── Resumen Optimizer: máximo 10 sugerencias por usuario por 15 minutos ──
const limiterResumen = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               10,
  standardHeaders:   true,
  legacyHeaders:     false,
  validate:          { keyGeneratorIpFallback: false },
  keyGenerator:      (req) => req.user?.id || ipKeyGenerator(req),
  handler:           (_req, res) => res.status(429).json(mensaje429('sugerencias de resumen')),
  skip:              (req) => req.planInfo?.isPaidPlan,
});

module.exports = { limiterOptimize, limiterMatch, limiterResumen, limiterGeneral };
