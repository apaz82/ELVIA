// Bloquea la ruta si el usuario free ya usó su 1 análisis de CV Optimizer
// Requiere que planContext se haya ejecutado antes en la cadena

const checkCvOptimizeLimit = (req, res, next) => {
  const { plan, config, cv_optimizer_count, trialExpired } = req.planInfo;

  if (trialExpired) {
    return res.status(403).json({
      error: 'TRIAL_EXPIRED',
      mensaje: 'Tu período de prueba de 14 días ha terminado. Invierte en tu carrera para continuar.',
    });
  }

  if (plan === 'free' && cv_optimizer_count >= config.cv_optimizer) {
    return res.status(403).json({
      error: 'OPTIMIZER_LIMIT_REACHED',
      mensaje: 'Ya utilizaste tu análisis gratuito de CV Optimizer. Suscríbete para generar más.',
      cv_optimizer_count,
    });
  }

  next();
};

module.exports = checkCvOptimizeLimit;
