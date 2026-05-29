// Middleware central de plan — lee el estado completo del usuario y lo adjunta a req.planInfo
// Reemplaza usageLimit.js para lógica granular por funcionalidad

const PLAN_CONFIG = {
  free:       { cv_optimizer: 1,        cv_generar: 1,        cv_match: 3,        watermark: true,  proGate: true,  chat_limit: Infinity },
  mensual:    { cv_optimizer: Infinity, cv_generar: Infinity, cv_match: Infinity, watermark: false, proGate: false, chat_limit: Infinity },
  trimestral: { cv_optimizer: Infinity, cv_generar: Infinity, cv_match: Infinity, watermark: false, proGate: false, chat_limit: Infinity },
  b2b:        { cv_optimizer: Infinity, cv_generar: Infinity, cv_match: Infinity, watermark: false, proGate: false, chat_limit: Infinity },
};

const planContext = async (req, res, next) => {
  const userId = req.user.id;
  const db = req.supabase;

  const { data, error } = await db
    .from('profiles')
    .select('usage_count, cv_optimizer_count, cv_generar_count, cv_match_count, plan, suspended, plan_expires_at, free_trial_expires_at, company_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Error al verificar plan de usuario' });
  }

  // Perfil no existe — crear con trial de 7 días
  if (!data) {
    const trialExpires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const { error: insertErr } = await db.from('profiles').insert({
      id: userId,
      usage_count: 0,
      cv_optimizer_count: 0,
      cv_generar_count: 0,
      cv_match_count: 0,
      plan: 'free',
      suspended: false,
      free_trial_expires_at: trialExpires,
      email_principal: req.user.email || null,
    });

    if (insertErr) {
      return res.status(500).json({ error: 'Error al crear perfil de usuario' });
    }

    req.planInfo = {
      plan: 'free',
      config: PLAN_CONFIG.free,
      trialExpired: false,
      isPaidPlan: false,
      cv_optimizer_count: 0,
      cv_generar_count: 0,
      cv_match_count: 0,
      usage_count: 0,
      free_trial_expires_at: trialExpires,
    };
    return next();
  }

  // Usuario suspendido
  if (data.suspended) {
    return res.status(403).json({
      error: 'ACCOUNT_SUSPENDED',
      mensaje: 'Tu cuenta ha sido suspendida. Contacta a soporte.',
    });
  }

  // Usuarios B2B (pertenecen a un tenant) → plan b2b sin watermark ni límites
  let plan = data.company_id ? 'b2b' : (data.plan || 'free');
  if (!data.company_id && ['mensual', 'trimestral'].includes(plan) && data.plan_expires_at && new Date(data.plan_expires_at) < new Date()) {
    plan = 'free';
    // Actualizar en DB para mantener sincronía
    const { error: degradeErr } = await db
      .from('profiles')
      .update({ plan: 'free' })
      .eq('id', userId);
    if (degradeErr) {
      console.error('[planContext] Error degrading plan:', degradeErr);
    }
  }

  // Trial expirado: solo aplica a usuarios free sin plan de pago activo
  const trialExpired =
    plan === 'free' &&
    data.free_trial_expires_at !== null &&
    new Date(data.free_trial_expires_at) < new Date();

  const config = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;

  req.planInfo = {
    plan,
    config,
    trialExpired,
    isPaidPlan: ['mensual', 'trimestral', 'b2b'].includes(plan),
    cv_optimizer_count: data.cv_optimizer_count || 0,
    cv_generar_count:   data.cv_generar_count || 0,
    cv_match_count:     data.cv_match_count     || 0,
    usage_count:        data.usage_count        || 0,
    free_trial_expires_at: data.free_trial_expires_at,
    plan_expires_at:    data.plan_expires_at,
  };

  next();
};

module.exports = { planContext, PLAN_CONFIG };
