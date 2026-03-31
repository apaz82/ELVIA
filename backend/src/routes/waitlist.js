const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');
const { sendWelcomeWaitlistEmail } = require('../services/resendService');
const auth = require('../middleware/auth');

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

    const { data, error } = await supabaseAdmin
      .from('waitlist_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ leads: data || [] });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { nombre, apellido, indicativo, telefono, pais, email, situacion, aceptaPrivacidad } = req.body;

    if (!nombre || !apellido || !pais || !email || !situacion || !aceptaPrivacidad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Email format validation broadly
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Combinar indicativo + número para guardar teléfono completo
    const telefonoCompleto = indicativo && telefono ? `${indicativo} ${telefono}` : (telefono || '');

    // Use supabaseAdmin to bypass RLS for inserting leads
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('waitlist_leads')
      .insert([{ nombre, apellido, telefono: telefonoCompleto, pais, email, situacion }])
      .select('id')
      .single();

    if (dbError) {
      if (dbError.code === '23505') { // Unique violation for email
        return res.status(400).json({ error: 'Este correo electrónico ya está registrado en la lista de espera' });
      }
      throw dbError;
    }

    // Try to send email
    try {
      await sendWelcomeWaitlistEmail(email, nombre);
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

// Analytics tracking endpoint
router.post('/track', async (req, res, next) => {
  try {
    const { data: sData } = await supabaseAdmin.from('landing_stats').select('views').eq('id', 1).single();
    if (sData) {
      await supabaseAdmin.from('landing_stats').update({ views: sData.views + 1 }).eq('id', 1);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
