// Bloquea la ruta si el usuario free agotó sus 3 análisis de CV vs Vacante / compatibilidad
// Requiere que planContext se haya ejecutado antes en la cadena

const checkCvMatchLimit = (req, res, next) => {
  const { plan, config, cv_match_count, trialExpired } = req.planInfo;

  if (trialExpired) {
    return res.status(403).json({
      error: 'TRIAL_EXPIRED',
      mensaje: 'Llegaste al límite de tu período de prueba. Elige un plan para continuar.',
    });
  }

  if (plan === 'free' && cv_match_count >= config.cv_match) {
    return res.status(403).json({
      error: 'MATCH_LIMIT_REACHED',
      mensaje: 'Llegaste al límite de tus créditos. Elige un plan para continuar analizando vacantes.',
      cv_match_count,
    });
  }

  next();
};

module.exports = checkCvMatchLimit;
