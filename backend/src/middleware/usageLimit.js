// Middleware de control freemium — núcleo del modelo de negocio
// TODO: cambiar a 2 antes de ir a producción
const LIMITE_GRATUITO = 999;

const usageLimit = async (req, res, next) => {
  const userId = req.user.id;
  const db = req.supabase; // cliente autenticado con el JWT del usuario

  // Consultar el contador de usos del usuario en la tabla profiles
  const { data, error } = await db
    .from('profiles')
    .select('usage_count')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Error al verificar límite de uso' });
  }

  // Si el perfil no existe todavía, crearlo con usage_count = 0
  if (!data) {
    await db.from('profiles').insert({ id: userId, usage_count: 0 });
    req.usageCount = 0;
    return next();
  }

  if (data.usage_count >= LIMITE_GRATUITO) {
    return res.status(403).json({
      error: 'LIMIT_REACHED',
      mensaje: 'Agotaste tus 2 análisis gratuitos. Suscríbete para continuar.',
      usageCount: data.usage_count,
    });
  }

  req.usageCount = data.usage_count;
  next();
};

module.exports = usageLimit;
