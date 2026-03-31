const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// Eventos permitidos — evita que se inserte metadata arbitraria
const ALLOWED_EVENTS = new Set([
  'page_view',
  'waitlist_open',
  'waitlist_submit',
  'waitlist_success',
  'demo_start',
  'demo_complete',
  'cta_click',
]);

/**
 * POST /api/events/track
 * Tracks a custom event from the landing page
 */
router.post('/track', async (req, res) => {
  const { event_name, metadata } = req.body;

  if (!event_name || !ALLOWED_EVENTS.has(event_name)) {
    return res.status(400).json({ error: 'event_name inválido o no permitido' });
  }

  // Sanitizar metadata: solo guardar claves conocidas, nunca emails ni PII
  const safeMetadata = {};
  const ALLOWED_META_KEYS = ['section', 'button', 'source', 'step'];
  if (metadata && typeof metadata === 'object') {
    for (const key of ALLOWED_META_KEYS) {
      if (metadata[key] !== undefined) safeMetadata[key] = String(metadata[key]).slice(0, 100);
    }
  }

  try {
    const { error } = await supabase
      .from('landing_events')
      .insert([{ event_name, metadata: safeMetadata, created_at: new Date().toISOString() }]);

    if (error) throw error;

    res.status(201).json({ status: 'ok' });
  } catch (err) {
    console.error('Error tracking event:', err);
    // Silent fail para no romper UX
    res.status(200).json({ status: 'error' });
  }
});

module.exports = router;
