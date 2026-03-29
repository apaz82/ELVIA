// Bloquea la ruta para usuarios en plan gratuito — solo planes de pago pueden acceder
// Requiere que planContext se haya ejecutado antes en la cadena

const requirePaidPlan = (req, res, next) => {
  const { plan } = req.planInfo;

  if (plan === 'free') {
    return res.status(402).json({
      error: 'UPGRADE_REQUIRED',
      mensaje: 'Esta función es exclusiva de planes de pago. Suscríbete para acceder.',
    });
  }

  next();
};

module.exports = requirePaidPlan;
