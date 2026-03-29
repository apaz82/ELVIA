// Bloquea la ruta si el usuario free tiene el trial de 14 días expirado
// Requiere que planContext se haya ejecutado antes en la cadena

const requireActiveTrial = (req, res, next) => {
  const { trialExpired } = req.planInfo;

  if (trialExpired) {
    return res.status(403).json({
      error: 'TRIAL_EXPIRED',
      mensaje: 'Tu período de prueba de 14 días ha terminado. Invierte en tu carrera para continuar.',
    });
  }

  next();
};

module.exports = requireActiveTrial;
