const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const auth = require('../middleware/auth');

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/email/send
router.post('/send', auth, async (req, res) => {
  const { to, cvId, format = 'pdf' } = req.body;

  if (!to || !cvId) {
    return res.status(400).json({ error: 'Faltan datos: email o cvId' });
  }

  const db = req.supabase;

  try {
    // Obtener el CV
    const { data: cv, error } = await db
      .from('cv_results')
      .select('contenido, metadata, tipo')
      .eq('id', cvId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !cv) {
      return res.status(404).json({ error: 'CV no encontrado' });
    }

    // Generar el archivo
    let buffer, mimeType, extension;
    if (format === 'word') {
      const { generarWord } = require('../services/wordService');
      buffer = await generarWord(cv.contenido);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
    } else {
      const { generarPDF } = require('../services/pdfService');
      buffer = await generarPDF(cv.contenido);
      mimeType = 'application/pdf';
      extension = 'pdf';
    }

    // Nombre del archivo
    const nombre = cv.contenido?.split('\n')[0]?.trim() || 'CV';
    const lang = cv.metadata?.language || 'es';
    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
    const nombreArchivo = lang === 'en'
      ? `Optimized CV ${nombre} ${fecha}.${extension}`
      : `CV Optimizado ${nombre} ${fecha}.${extension}`;

    await resend.emails.send({
      from: 'CV Optimizer Pro <noreply@gestioncv.netlify.app>',
      to: [to],
      subject: lang === 'en' ? 'Your Optimized CV is ready' : 'Tu CV optimizado está listo',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1C1C1E;">Tu CV optimizado está listo</h2>
          <p style="color: #6b7280;">Adjunto encontrarás tu CV en formato ${format === 'word' ? 'Word' : 'PDF'}, listo para enviar a reclutadores.</p>
          <p style="color: #6b7280; font-size: 13px;">Generado con <strong>CV Optimizer Pro</strong> — sin inventar información, solo mejoramos lo que ya tienes.</p>
        </div>
      `,
      attachments: [
        {
          filename: nombreArchivo,
          content: buffer.toString('base64'),
        },
      ],
    });

    res.json({ ok: true, mensaje: 'Email enviado correctamente' });
  } catch (err) {
    console.error('[email/send]', err.message);
    res.status(500).json({ error: 'Error al enviar el email: ' + err.message });
  }
});

module.exports = router;
