// Middleware de control freemium — núcleo del modelo de negocio
const LIMITE_POR_PLAN = {
  free:        2,
  semanal:     Infinity,
  mensual:     Infinity,
  trimestral:  Infinity,
};

const usageLimit = async (req, res, next) => {
  const userId = req.user.id;
  const db = req.supabase; // cliente autenticado con el JWT del usuario

  // Consultar uso, plan y estado de suspensión
  const { data, error } = await db
    .from('profiles')
    .select('usage_count, plan, suspended')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Error al verificar límite de uso' });
  }

  // Si el perfil no existe todavía, crearlo con valores por defecto
  if (!data) {
    await db.from('profiles').insert({
      id: userId,
      usage_count: 0,
      plan: 'free',
      suspended: false,
      email_principal: req.user.email || null,
    });
    req.usageCount = 0;
    return next();
  }

  // Usuario suspendido por admin
  if (data.suspended) {
    return res.status(403).json({
      error: 'ACCOUNT_SUSPENDED',
      mensaje: 'Tu cuenta ha sido suspendida. Contacta a soporte.',
    });
  }

  const limite = LIMITE_POR_PLAN[data.plan] ?? LIMITE_POR_PLAN.free;

  if (data.usage_count >= limite) {
    return res.status(403).json({
      error: 'LIMIT_REACHED',
      mensaje: 'Agotaste tus análisis gratuitos. Suscríbete para continuar.',
      usageCount: data.usage_count,
    });
  }

  req.usageCount = data.usage_count;
  next();
};

module.exports = usageLimit;
