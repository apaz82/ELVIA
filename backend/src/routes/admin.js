const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase, supabaseAdmin } = require('../lib/supabase');
const Anthropic = require('@anthropic-ai/sdk');
const { createOTP, validateOTP } = require('../services/otpService');
const { sendOTPEmail } = require('../services/resendService');

// Middleware
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireAdmin');

/**
 * GET /api/admin/system-status
 * Realiza un chequeo de salud de todas las integraciones externas
 */
router.get('/system-status', auth, requireRole('super_admin'), async (req, res) => {

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
router.post('/users/delete-otp-request/:id', auth, requireRole('super_admin'), async (req, res) => {

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
router.delete('/users/:id', auth, requireRole('super_admin'), async (req, res) => {
  const { data: profile } = await req.supabase
    .from('profiles')
    .select('email_principal')
    .eq('id', req.user.id)
    .single();

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
    // Hash SHA256 del email (GDPR compliance)
    const emailHash = crypto
      .createHash('sha256')
      .update(targetUser.email)
      .digest('hex');
    const emailDomain = targetUser.email.split('@')[1];

    // Crear entrada en audit log ANTES de borrar (en caso de que falle)
    const { error: auditError } = await supabaseAdmin
      .from('deletion_audit_log')
      .insert({
        deleted_user_id: targetId,
        deleted_user_email_hash: emailHash,
        deleted_user_email_domain: emailDomain,
        admin_id: req.user.id,
        admin_email: profile.email_principal,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

    if (auditError) {
      console.error('[Admin] Error registrando audit log:', auditError.message);
      return res.status(500).json({
        error: 'Error al procesar solicitud. Contacta a soporte.',
        errorCode: 'AUDIT_LOG_FAILED'
      });
    }

    // Borrar usuario (cascade a profiles por FK)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId);

    if (deleteError) {
      console.error('[Admin] Error eliminando usuario:', deleteError.message);
      console.error('[Admin] Full error:', deleteError);
      // Actualizar audit log con el error
      await supabaseAdmin
        .from('deletion_audit_log')
        .update({ status: 'failed' })
        .eq('deleted_user_id', targetId)
        .catch(err => console.error('[Admin] Error updating audit log:', err));

      return res.status(500).json({
        error: 'Error al eliminar usuario. Contacta a soporte.',
        errorCode: 'DELETE_USER_FAILED'
      });
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
router.post('/config', auth, requireRole('super_admin'), async (req, res) => {

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

/**
 * GET /api/admin/companies
 * Lista todas las empresas B2B (solo super_admin)
 */
router.get('/companies', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select('*, created_by')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ companies: companies || [] });
  } catch (err) {
    console.error('[Admin] Error listando empresas:', err.message);
    res.status(500).json({ error: 'Error listando empresas' });
  }
});

/**
 * POST /api/admin/companies
 * Crea una nueva empresa B2B (solo super_admin)
 */
router.post('/companies', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .insert({
        name,
        email,
        created_by: req.user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ company });
  } catch (err) {
    console.error('[Admin] Error creando empresa:', err.message);
    res.status(500).json({ error: 'Error creando empresa' });
  }
});

/**
 * POST /api/admin/companies/:id/admins
 * Asigna un company_admin a una empresa (crea user + profile)
 * Body: { nombre, email, apellido? }
 */
router.post('/companies/:id/admins', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const companyId = req.params.id;
    const { nombre, email, apellido } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }

    // Verificar que la empresa existe
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Crear usuario en auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: crypto.randomBytes(16).toString('hex'), // contraseña temporal
      email_confirm: true,
      user_metadata: { nombre, apellido: apellido || '' }
    });

    if (authError) {
      console.error('[Admin] Error creando user en auth:', authError.message);
      return res.status(400).json({ error: 'Error creando usuario. ¿El email ya existe?' });
    }

    // Crear profile con role='company_admin'
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email_principal: email,
        nombre1: nombre,
        apellido1: apellido || '',
        role: 'company_admin',
        company_id: companyId,
        plan: 'business',
        is_admin: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('[Admin] Error creando profile:', profileError.message);
      // Limpiar el usuario de auth si falla el profile
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id).catch(err =>
        console.error('[Admin] Error deletando user fallido:', err)
      );
      return res.status(500).json({ error: 'Error creando perfil de administrador' });
    }

    // TODO: Enviar email de bienvenida con instrucciones de reset de password
    console.log(`[Admin] Company admin ${email} asignado a empresa ${companyId}`);

    res.status(201).json({ admin: profile });
  } catch (err) {
    console.error('[Admin] Error asignando company_admin:', err.message);
    res.status(500).json({ error: 'Error asignando administrador' });
  }
});

/**
 * PATCH /api/admin/companies/:id
 * Activa/desactiva una empresa (soft delete)
 * Body: { is_active: boolean }
 */
router.patch('/companies/:id', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const companyId = req.params.id;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active debe ser boolean' });
    }

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .update({ is_active })
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;

    res.json({ company });
  } catch (err) {
    console.error('[Admin] Error actualizando empresa:', err.message);
    res.status(500).json({ error: 'Error actualizando empresa' });
  }
});

/**
 * POST /api/admin/knowledge/upload
 * Sube un documento (PDF o TXT) y lo procesa automáticamente a Supabase pgvector
 */
const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
const pdfParse = require('pdf-parse');

router.post('/knowledge/upload', auth, requireRole('super_admin'), upload.single('file'), async (req, res) => {
  console.log('[KnowledgeUpload] Inicio de proceso para archivo:', req.file?.originalname);
  
  if (!req.file) {
    return res.status(400).json({ error: 'Debes enviar un archivo (file).' });
  }

  try {
    const file = req.file;
    let text = '';

    console.log('[KnowledgeUpload] Extrayendo texto...');
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      text = data.text;
    } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
      text = file.buffer.toString('utf-8');
    } else {
      console.error('[KnowledgeUpload] Formato no soportado:', file.mimetype);
      return res.status(400).json({ error: 'Formato no soportado. Sube PDF o TXT.' });
    }

    if (!text || !text.trim()) {
      console.error('[KnowledgeUpload] Texto extraído vacío.');
      return res.status(400).json({ error: 'El archivo está vacío o no se pudo extraer texto.' });
    }

    console.log(`[KnowledgeUpload] Texto extraído con éxito (${text.length} caracteres).`);

    // Dividir texto en chunks de ~1000 caracteres
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';
    for (const p of paragraphs) {
      if ((currentChunk.length + p.length) > 1000 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += p + '\n\n';
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());

    console.log(`[KnowledgeUpload] Chunks generados: ${chunks.length}`);

    console.log('[KnowledgeUpload] Iniciando inserción en Supabase (Búsqueda de Texto)...');
    
    // Insertar chunks de forma masiva para mayor velocidad
    const rows = chunks.map((chunk, i) => ({
      content: chunk,
      metadata: { filename: file.originalname, chunk_index: i }
      // El embedding se queda nulo/vacío ya que usaremos búsqueda de texto
    }));

    const { error: insertError } = await supabaseAdmin.from('elvia_knowledge').insert(rows);

    if (insertError) {
      console.error('[KnowledgeUpload] Error al insertar:', insertError.message);
      throw new Error('Error al guardar los fragmentos en la base de datos.');
    }

    insertCount = chunks.length;
    console.log(`[KnowledgeUpload] Proceso finalizado. Insertados: ${insertCount} fragmentos.`);

    console.log(`[KnowledgeUpload] Proceso finalizado. Insertados: ${insertCount}/${chunks.length}`);
    
    // Registrar en el log de historial
    await supabaseAdmin.from('knowledge_logs').insert({
      filename: file.originalname,
      file_size_bytes: file.size,
      total_chunks: insertCount
    });

    res.json({ ok: true, message: `Documento procesado. ${insertCount} fragmentos agregados a la IA.` });

  } catch (err) {
    console.error('[KnowledgeUpload] ERROR CRÍTICO:', err);
    res.status(500).json({ error: `Error procesando el documento: ${err.message}` });
  }
});

/**
 * GET /api/admin/knowledge/logs
 * Obtiene el historial de documentos cargados
 */
router.get('/knowledge/logs', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('knowledge_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[Admin] Error listando logs de conocimiento:', err.message);
    res.status(500).json({ error: 'Error al obtener el historial.' });
  }
});

module.exports = router;
