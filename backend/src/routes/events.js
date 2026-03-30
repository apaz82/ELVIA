const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * POST /api/events/track
 * Tracks a custom event from the landing page
 */
router.post('/track', async (req, res) => {
  const { event_name, metadata } = req.body;

  if (!event_name) {
    return res.status(400).json({ error: 'event_name is required' });
  }

  try {
    const { error } = await supabase
      .from('landing_events')
      .insert([
        { 
          event_name, 
          metadata: metadata || {},
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    res.status(201).json({ status: 'ok' });
  } catch (err) {
    console.error('Error tracking event:', err);
    // Silent fail for analytics to not break UX
    res.status(200).json({ status: 'error', message: 'tracked internally with errors' });
  }
});

module.exports = router;
