// Middleware para hard cap diario de análisis con Claude API
// Límite: 100 análisis/día (ajustable en Supabase)
const { supabaseAdmin } = require('../lib/supabase');

const dailyCap = async (req, res, next) => {
  try {
    if (!supabaseAdmin) {
      // Si Supabase no está configurado, permitir pero logear
      console.warn('[Daily Cap] Supabase no disponible, permitiendo análisis');
      return next();
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Obtener o crear registro de hoy
    const { data: capRecord, error: selectError } = await supabaseAdmin
      .from('daily_usage_cap')
      .select('*')
      .eq('date', today)
      .single();

    if (!selectError && capRecord) {
      // Registro existe
      if (capRecord.analyses_count >= capRecord.max_daily_analyses) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const retryDate = tomorrow.toISOString().split('T')[0];
        return res.status(429).json({
          error: `Se alcanzó el límite diario de ${capRecord.max_daily_analyses} análisis. Intenta mañana.`,
          retryAfter: retryDate
        });
      }
      // Permitir, el controlador incrementará el contador
    } else if (selectError?.code === 'PGRST116') {
      // No existe registro para hoy, crear uno
      await supabaseAdmin
        .from('daily_usage_cap')
        .insert([{ date: today, analyses_count: 0, max_daily_analyses: 100 }]);
    } else if (selectError) {
      // Error inesperado
      console.error('[Daily Cap] Error consultando cap:', selectError);
      // Permitir análisis pero logear (graceful degradation)
    }

    // Adjuntar info de cap al request para que el controlador la use
    req.dailyCapDate = today;
    next();
  } catch (err) {
    console.error('[Daily Cap] Middleware error:', err);
    // Graceful degradation: permitir análisis si hay error
    next();
  }
};

// Función auxiliar para incrementar contador (llamar desde el controlador tras analizar)
const incrementDailyCap = async (date) => {
  if (!supabaseAdmin) return;

  try {
    const { data, error } = await supabaseAdmin
      .from('daily_usage_cap')
      .select('analyses_count')
      .eq('date', date)
      .single();

    if (!error && data) {
      await supabaseAdmin
        .from('daily_usage_cap')
        .update({ analyses_count: data.analyses_count + 1 })
        .eq('date', date);
    }
  } catch (err) {
    console.error('[Daily Cap] Error incrementando contador:', err);
    // Silenciar para no romper UX
  }
};

module.exports = { dailyCap, incrementDailyCap };
