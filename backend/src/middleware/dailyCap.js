// Middleware para hard cap diario de análisis con Claude API
// Límite: 100 análisis/día (ajustable en Supabase)
// CRIT-3 fix: usa RPC atómica para evitar race condition en check + increment
const { supabaseAdmin } = require('../lib/supabase');

const dailyCap = async (req, res, next) => {
  if (!supabaseAdmin) {
    console.warn('[Daily Cap] Supabase no disponible, permitiendo análisis');
    return next();
  }

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Incremento atómico: la RPC hace check + insert/update en una sola transacción
    const { data, error } = await supabaseAdmin.rpc('increment_daily_cap', { p_date: today });

    if (error) {
      // Si la RPC no existe (ej. primer deploy), degradar con gracia
      console.error('[Daily Cap] RPC error — permitiendo análisis:', error.message);
      req.dailyCapDate = today;
      return next();
    }

    const result = data?.[0];

    if (!result?.allowed) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return res.status(429).json({
        error: `Se alcanzó el límite diario de ${result?.max_count ?? 100} análisis. Intenta mañana.`,
        retryAfter: tomorrow.toISOString().split('T')[0]
      });
    }

    req.dailyCapDate = today;
    next();
  } catch (err) {
    console.error('[Daily Cap] Middleware error:', err);
    // Graceful degradation: no bloquear al usuario si hay error inesperado
    next();
  }
};

// Mantenido por compatibilidad con controladores que lo llamen directamente.
// Con la RPC atómica el incremento ya ocurrió en el middleware — esta función es no-op.
const incrementDailyCap = async (_date) => {
  // No-op: el incremento se realiza atómicamente en dailyCap()
};

module.exports = { dailyCap, incrementDailyCap };
