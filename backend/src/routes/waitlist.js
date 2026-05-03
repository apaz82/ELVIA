const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');
const { sendWelcomeWaitlistEmail } = require('../services/resendService');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter estricto para POST /api/waitlist: 5 por hora por IP
const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  validate:     { keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler:      (req, res) => res.status(429).json({ error: 'Demasiados intentos. Intenta en una hora.' })
});

// Situaciones permitidas (validadas en servidor)
const SITUACIONES_PERMITIDAS = new Set([
  'Sin empleo y en búsqueda activa',
  'Con empleo y en búsqueda activa',
  'Quiero gestionar mi siguiente paso'
]);

// GET /api/waitlist — listar todos los leads (solo admins autenticados)
router.get('/', auth, async (req, res, next) => {
  try {
    // Verificar que el usuario autenticado sea admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Paginación: por defecto primeras 50, máximo 100
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const start = page * limit;
    const end = start + limit - 1;

    // Obtener total count
    const { count, error: countError } = await supabaseAdmin
      .from('waitlist_leads')
      .select('id', { count: 'exact', head: true });

    if (countError) throw countError;

    // Obtener datos paginados
    const { data, error } = await supabaseAdmin
      .from('waitlist_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return res.json({
      leads: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', waitlistLimiter, async (req, res, next) => {
  try {
    console.log('[Waitlist] New request body:', req.body);
    const { nombre, apellido, indicativo, telefono, pais, ciudad, email, situacion, aceptaPrivacidad } = req.body;

    if (!nombre || !apellido || !pais || !ciudad || !email || !situacion || !aceptaPrivacidad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Validación de longitud y trim
    if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 100) {
      return res.status(400).json({ error: 'Nombre debe tener 2-100 caracteres' });
    }
    if (typeof apellido !== 'string' || apellido.trim().length < 2 || apellido.length > 100) {
      return res.status(400).json({ error: 'Apellido debe tener 2-100 caracteres' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 150) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Validar situación contra whitelist
    if (!SITUACIONES_PERMITIDAS.has(situacion)) {
      return res.status(400).json({ error: 'Situación no válida' });
    }

    // Combinar indicativo + número para guardar teléfono completo
    const telefonoCompleto = indicativo && telefono ? `${indicativo} ${telefono}` : (telefono || '');

    // Use supabaseAdmin to bypass RLS for inserting leads
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('waitlist_leads')
      .insert([{ nombre, apellido, telefono: telefonoCompleto, pais: `${ciudad}, ${pais}`, email, situacion }])
      .select('id')
      .single();

    if (dbError) {
      console.error('[Waitlist] Database error:', dbError);
      if (dbError.code === '23505') { // Unique violation for email
        return res.status(400).json({ error: 'Este correo electrónico ya está registrado en la lista de espera' });
      }
      throw dbError;
    }

    // Try to send email (personalized by situacion)
    try {
      await sendWelcomeWaitlistEmail(email, nombre, situacion);
    } catch (emailError) {
      console.error('[Resend Error] Failed to send waitlist email:', emailError);
      // We don't fail the request if the email fails, we return success with a warning
      return res.status(201).json({
        message: 'Registrado con éxito a la lista de espera',
        warning: 'El email de bienvenida podría haberse retrasado'
      });
    }

    res.status(201).json({ message: 'Registrado con éxito a la lista de espera' });

  } catch (error) {
    next(error);
  }
});

// Analytics tracking — IP-based rate limiter (60/min by IP to prevent abuse)
const trackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 1,
  validate:     { keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler:      (req, res) => res.status(200).json({ success: false }) // silent fail para no romper UX
});

router.post('/track', trackLimiter, async (req, res, next) => {
  try {
    // RPC debe ser creado en Supabase (ver DB_MIGRATION_SQL.sql)
    const { error } = await supabaseAdmin.rpc('increment_landing_views');

    if (error) {
      // Log el error pero no falles (analytics no es crítico)
      console.warn('[Analytics] RPC error:', error.message);
      // Continuar de todos modos
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    // Silent fail para no romper UX — analytics no es crítico
    console.error('[Analytics] Track error:', error);
    res.status(200).json({ success: false });
  }
});

module.exports = router;
