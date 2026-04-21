// Rutas de códigos de acceso — redención de usuarios y CRUD de admins
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');

// Días que otorga cada plan
const DIAS_POR_PLAN = {
  semanal:    7,
  mensual:    30,
  trimestral: 90,
  anual:      365,
};


// ── POST /api/codes/redeem — canjear un código de acceso ──────
// Requiere JWT. El frontend llama esto al iniciar sesión si hay
// un código pendiente en localStorage.
router.post('/redeem', auth, async (req, res) => {
  const { code } = req.body;
  const db       = req.supabase;
  const userId   = req.user.id;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Código requerido' });
  }

  const codigoNorm = code.trim().toUpperCase();

  // 1. Buscar el código
  const { data: codeRow, error: codeErr } = await db
    .from('access_codes')
    .select('id, plan, max_uses, uses_count, expires_at, is_active')
    .eq('code', codigoNorm)
    .maybeSingle();

  if (codeErr || !codeRow) {
    return res.status(404).json({ error: 'CODIGO_NO_ENCONTRADO', mensaje: 'Código inválido o no existe.' });
  }

  if (!codeRow.is_active) {
    return res.status(400).json({ error: 'CODIGO_INACTIVO', mensaje: 'Este código ya no está activo.' });
  }

  if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
    return res.status(400).json({ error: 'CODIGO_VENCIDO', mensaje: 'Este código ha expirado.' });
  }

  if (codeRow.uses_count >= codeRow.max_uses) {
    return res.status(400).json({ error: 'CODIGO_AGOTADO', mensaje: 'Este código ya alcanzó el límite de usos.' });
  }

  // 2. Verificar que el usuario no haya canjeado este código antes
  const { data: existente } = await db
    .from('code_redemptions')
    .select('id')
    .eq('user_id', userId)
    .eq('code_id', codeRow.id)
    .maybeSingle();

  if (existente) {
    return res.status(400).json({ error: 'YA_CANJEADO', mensaje: 'Ya usaste este código.' });
  }

  // 3. Registrar la redención (el trigger incrementa uses_count automáticamente)
  const { error: redeemErr } = await db
    .from('code_redemptions')
    .insert({ code_id: codeRow.id, user_id: userId, plan_granted: codeRow.plan });

  if (redeemErr) {
    return res.status(500).json({ error: 'Error al registrar la redención' });
  }

  // 3.5. Incrementar usos_count manualmente (garantiza que Admin lo vea)
  await db
    .from('access_codes')
    .update({ uses_count: codeRow.uses_count + 1 })
    .eq('id', codeRow.id);

  // 4. Aplicar el plan al perfil del usuario
  const diasPlan      = DIAS_POR_PLAN[codeRow.plan] || 30;
  const planExpiresAt = new Date(Date.now() + diasPlan * 24 * 3600 * 1000).toISOString();

  const { error: profileErr } = await db
    .from('profiles')
    .update({ plan: codeRow.plan, plan_expires_at: planExpiresAt })
    .eq('id', userId);

  if (profileErr) {
    return res.status(500).json({ error: 'Error al actualizar el plan' });
  }

  return res.json({
    ok:          true,
    plan:        codeRow.plan,
    expiresAt:   planExpiresAt,
    mensaje:     `¡Código canjeado! Tu plan ${codeRow.plan} está activo.`,
  });
});

// ── GET /api/codes — listar códigos (solo admins) ─────────────
router.get('/', auth, async (req, res) => {
  const db = req.supabase;

  // Verificar que el usuario es admin
  const { data: perfil } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .maybeSingle();

  if (!perfil?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { data, error } = await db
    .from('access_codes')
    .select('*, code_redemptions(count)')
    .order('created_at', { ascending: false });

  if (error) { console.error('[codes] DB error:', error.message); return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' }); }
  return res.json(data);
});

// ── POST /api/codes — crear código (solo admins) ──────────────
router.post('/', auth, async (req, res) => {
  const db = req.supabase;

  const { data: perfil } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .maybeSingle();

  if (!perfil?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { code, plan, max_uses = 1, expires_at = null, notes = null } = req.body;

  if (!code || !plan) {
    return res.status(400).json({ error: 'code y plan son requeridos' });
  }

  if (!DIAS_POR_PLAN[plan]) {
    return res.status(400).json({ error: 'Plan inválido. Usa: semanal, mensual, trimestral o anual' });
  }

  const { data, error } = await db
    .from('access_codes')
    .insert({
      code:      code.trim().toUpperCase(),
      plan,
      max_uses:  Math.max(1, parseInt(max_uses) || 1),
      expires_at: expires_at || null,
      notes:     notes || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un código con ese nombre' });
    }
    console.error('[codes] DB error creating code:', error.message);
    return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' });
  }

  return res.status(201).json(data);
});

// ── DELETE /api/codes/:id — desactivar código (solo admins) ───
router.delete('/:id', auth, async (req, res) => {
  const db = req.supabase;

  const { data: perfil } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .maybeSingle();

  if (!perfil?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { error } = await db
    .from('access_codes')
    .update({ is_active: false })
    .eq('id', req.params.id);

  if (error) { console.error('[codes] DB error:', error.message); return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' }); }
  return res.json({ ok: true });
});

// ── GET /api/codes/redemptions — estadísticas (solo admins) ───
router.get('/redemptions', auth, async (req, res) => {
  const db = req.supabase;

  const { data: perfil } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .maybeSingle();

  if (!perfil?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { data, error } = await db
    .from('code_redemptions')
    .select('*, access_codes(code, plan), profiles(email_principal)')
    .order('redeemed_at', { ascending: false })
    .limit(50);

  if (error) { console.error('[codes] DB error:', error.message); return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' }); }
  return res.json(data);
});

module.exports = router;
