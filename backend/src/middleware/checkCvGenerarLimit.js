// Bloquea el endpoint de CV Desde Cero si el usuario free ya usó su 1 crédito
// Requiere que planContext se haya ejecutado antes en la cadena

const checkCvGenerarLimit = (req, res, next) => {
  const { plan, config, cv_generar_count, trialExpired } = req.planInfo;

  if (trialExpired) {
    return res.status(403).json({
      error: 'TRIAL_EXPIRED',
      mensaje: 'Tu período de prueba de 7 días ha terminado. Invierte en tu carrera para continuar.',
    });
  }

  if (plan === 'free' && cv_generar_count >= config.cv_generar) {
    return res.status(403).json({
      error: 'GENERAR_LIMIT_REACHED',
      mensaje: 'Ya utilizaste tu CV gratuito desde cero. Suscríbete para generar más.',
      cv_generar_count,
    });
  }

  next();
};

module.exports = checkCvGenerarLimit;
