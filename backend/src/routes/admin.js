const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../lib/supabase');
const Anthropic = require('@anthropic-ai/sdk');
const { createOTP, validateOTP } = require('../services/otpService');
const { sendOTPEmail } = require('../services/resendService');

// El middleware de auth debe ser admin
const auth = require('../middleware/auth');

/**
 * GET /api/admin/system-status
 * Realiza un chequeo de salud de todas las integraciones externas
 */
router.get('/system-status', auth, async (req, res) => {
  // Solo administradores pueden ver esto
  // (El middleware 'auth' ya debería cargar el req.user, pero verificamos perfil)
  const { data: profile } = await req.supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();

  if (!profile?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const results = {
    database: { name: 'Supabase DB', status: 'unknown', details: '' },
    auth:     { name: 'Supabase Auth', status: 'unknown', details: '' },
    ai:       { name: 'Anthropic (Claude)', status: 'unknown', details: '' },
    email:    { name: 'Resend (Email)', status: 'unknown', details: '' },
    sentry:   { name: 'Sentry (Error Monitoring)', status: 'unknown', details: '' },
  };

  // 1. Checar Supabase (DB)
  try {
    const t0 = Date.now();
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    results.database.status = 'active';
    results.database.details = `Latency: ${Date.now() - t0}ms`;
  } catch (err) {
    results.database.status = 'error';
    results.database.details = err.message;
  }

  // 2. Checar Anthropic
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      results.ai.status = 'configured';
      results.ai.details = 'API Key present';
      // No hacemos una llamada real para no gastar dinero, pero validamos el formato si se quiere
    } else {
      results.ai.status = 'inactive';
      results.ai.details = 'Missing API Key';
    }
  } catch (err) {
    results.ai.status = 'error';
  }

  // 3. Checar Resend
  try {
    if (process.env.RESEND_API_KEY) {
      results.email.status = 'configured';
      results.email.details = 'API Key present';
    } else {
      results.email.status = 'inactive';
      results.email.details = 'Missing API Key';
    }
  } catch (err) {
    results.email.status = 'error';
  }

  // 4. Checar Sentry (basado en si el SDK está inicializado)
  try {
    if (process.env.SENTRY_DSN) {
      results.sentry.status = 'active';
      results.sentry.details = 'DSN configured';
    } else {
      results.sentry.status = 'inactive';
      results.sentry.details = 'No Sentry DSN provided';
    }
  } catch (err) {
    results.sentry.status = 'error';
  }

  res.json(results);
});

/**
 * DELETE /api/admin/users/:id
 * Elimina un usuario permanentemente de auth.users (cascade a profiles)
 * Solo accesible por admins
 */
/**
 * POST /api/admin/users/delete-otp-request/:id
 * Solicita un código OTP para borrar un usuario
 * Envía el OTP al email del admin que solicita
 */
router.post('/users/delete-otp-request/:id', auth, async (req, res) => {
  // Verificar que quien llama es admin
  const { data: adminProfile } = await req.supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();

  if (!adminProfile?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const targetId = req.params.id;

  // Evitar que un admin se borre a sí mismo
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde el admin.' });
  }

  // Verificar que el usuario a borrar existe
  const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetId);
  if (userError || !targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Generar OTP
  const otp = createOTP(req.user.id, req.user.email);

  // Enviar OTP al email del admin
  try {
    await sendOTPEmail(req.user.email, otp, targetUser.user_metadata?.email || 'Usuario desconocido');
    res.json({
      ok: true,
      message: 'Código OTP enviado a tu email. Válido por 10 minutos.',
      targetEmail: targetUser.user_metadata?.email || 'Usuario desconocido'
    });
  } catch (err) {
    console.error('[Admin] Error enviando OTP:', err.message);
    res.status(500).json({ error: 'No se pudo enviar el OTP. Intenta de nuevo.' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Borra un usuario (requiere OTP válido en request body)
 * Registra en audit_log para compliance legal
 */
router.delete('/users/:id', auth, async (req, res) => {
  // Verificar que quien llama es admin
  const { data: profile } = await req.supabase
    .from('profiles')
    .select('is_admin, email_principal')
    .eq('id', req.user.id)
    .single();

  if (!profile?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const targetId = req.params.id;
  const { otp } = req.body;

  // Evitar que un admin se borre a sí mismo
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde el admin.' });
  }

  // Validar OTP
  const otpValidation = validateOTP(req.user.id, otp);
  if (!otpValidation.valid) {
    return res.status(403).json({ error: otpValidation.error });
  }

  // Obtener datos del usuario a borrar (para audit log)
  const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetId);
  if (userError || !targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  try {
    // Crear entrada en audit log ANTES de borrar (en caso de que falle)
    const { error: auditError } = await supabaseAdmin
      .from('deletion_audit_log')
      .insert({
        deleted_user_id: targetId,
        deleted_user_email: targetUser.email,
        admin_id: req.user.id,
        admin_email: profile.email_principal,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

    if (auditError) {
      console.error('[Admin] Error registrando audit log:', auditError.message);
      return res.status(500).json({ error: 'Error registrando operación en logs' });
    }

    // Borrar usuario (cascade a profiles por FK)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId);

    if (deleteError) {
      console.error('[Admin] Error eliminando usuario:', deleteError.message);
      // Actualizar audit log con el error
      await supabaseAdmin
        .from('deletion_audit_log')
        .update({ status: 'failed', error_message: deleteError.message })
        .eq('deleted_user_id', targetId);

      return res.status(500).json({ error: deleteError.message });
    }

    console.log(`[Admin] Usuario ${targetId} eliminado por ${req.user.id}`);
    res.json({ ok: true, deleted: targetId, audited: true });
  } catch (err) {
    console.error('[Admin] Error en proceso de eliminación:', err.message);
    res.status(500).json({ error: 'Error inesperado durante la eliminación' });
  }
});

/**
 * POST /api/admin/config
 * Actualiza o crea una configuración del sistema (SEO, copy, etc.)
 */
router.post('/config', auth, async (req, res) => {
  const { data: profile } = await req.supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();

  if (!profile?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const { config_key, config_value } = req.body;

  if (!config_key) {
    return res.status(400).json({ error: 'config_key es requerido' });
  }

  try {
    const { error } = await supabase
      .from('landing_config')
      .upsert({ config_key, config_value, updated_at: new Date().toISOString() }, { onConflict: 'config_key' });

    if (error) throw error;
    res.json({ ok: true, message: `Configuración '${config_key}' actualizada.` });
  } catch (err) {
    console.error('[Admin] Error actualizando config:', err.message);
    res.status(500).json({ error: 'Error actualizando configuración' });
  }
});

module.exports = router;
