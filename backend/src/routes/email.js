const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

let resend = null;
const _resendKey = process.env.RESEND_API_KEY;
if (!_resendKey) {
  console.error('[Resend/email] RESEND_API_KEY no configurada — emails deshabilitados');
} else {
  try {
    resend = new Resend(_resendKey);
  } catch (err) {
    console.error('[Resend/email] Error al inicializar cliente:', err.message);
  }
}

// ── Rate limiter en memoria para endpoints públicos de email ──────────────────
// Evita abuso de relay de correo: máx 3 requests por IP cada 10 minutos
const emailRateMap = new Map();
const emailRateLimit = (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutos
  const maxReqs = 3;

  const entry = emailRateMap.get(ip) || { count: 0, firstRequest: now };
  if (now - entry.firstRequest > windowMs) {
    entry.count = 1;
    entry.firstRequest = now;
  } else {
    entry.count++;
  }
  emailRateMap.set(ip, entry);

  if (entry.count > maxReqs) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
  }
  next();
};

// ── Dominios permitidos para resetUrl ────────────────────────────────────────
const ALLOWED_RESET_ORIGINS = [
  process.env.FRONTEND_URL || 'https://gestioncv.netlify.app',
  'https://www.elvia.lat',
  'https://elvia.lat',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:4173',
];

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
      from: 'ELVIA <soporte@elvia.lat>',
      to: [to],
      subject: lang === 'en' ? 'Your Optimized CV is ready' : 'Tu CV optimizado está listo',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1C1C1E;">Tu CV optimizado está listo</h2>
          <p style="color: #6b7280;">Adjunto encontrarás tu CV en formato ${format === 'word' ? 'Word' : 'PDF'}, listo para enviar a reclutadores.</p>
          <p style="color: #6b7280; font-size: 13px;">Generado con <strong>ELVIA</strong> — sin inventar información, solo mejoramos lo que ya tienes.</p>
        </div>
      `,
      attachments: [
        {
          filename: nombreArchivo,
          content: buffer,
        },
      ],
    });

    res.json({ ok: true, mensaje: 'Email enviado correctamente' });
  } catch (err) {
    console.error('[email/send]', err.message);
    res.status(500).json({ error: 'Error al enviar el email: ' + err.message });
  }
});


// ── Template: email de bienvenida ─────────────────────────────────────────────
const htmlBienvenida = (email) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0A3D2A 0%,#0d5c3e 100%);padding:36px 40px 32px;text-align:center;">
            <img src="https://www.elvia.lat/elvia-logo-transparent.png" alt="ELVIA" height="52" style="height:52px;width:auto;display:block;margin:0 auto 12px;" />
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Tu carrera, optimizada</p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#111827;line-height:1.2;">¡Bienvenido/a a ELVIA! 🎉</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Tu cuenta ha sido creada con éxito.</p>

            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              Hola, nos alegra mucho tenerte en la plataforma. Con <strong style="color:#0A3D2A;">ELVIA</strong> vas a tener acceso a las herramientas de IA más avanzadas para destacar en el mercado laboral de LATAM y USA.
            </p>

            <!-- Beneficios -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr><td style="background:#f8fafc;border-radius:14px;padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Lo que puedes hacer hoy:</p>
                ${[
                  ['📄', 'CV Optimizer', 'Transforma tu CV al formato Harvard en segundos'],
                  ['🎯', 'CV vs Vacante', 'Mide tu % de compatibilidad con cualquier oferta'],
                  ['📊', 'Pipeline', 'Gestiona todas tus candidaturas en un tablero visual'],
                  ['🎤', 'Simulador de Entrevista', 'Practica con preguntas personalizadas para tu cargo'],
                ].map(([icon, titulo, desc]) => `
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                    <tr>
                      <td width="36" style="vertical-align:top;">
                        <div style="width:32px;height:32px;background:#e8f5ee;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">${icon}</div>
                      </td>
                      <td style="padding-left:12px;vertical-align:top;">
                        <p style="margin:0;font-size:13px;font-weight:700;color:#111827;">${titulo}</p>
                        <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${desc}</p>
                      </td>
                    </tr>
                  </table>
                `).join('')}
              </td></tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="text-align:center;">
                <a href="https://gestioncv.netlify.app/cv-optimizer"
                   style="display:inline-block;background:#E8541A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
                  Comenzar ahora →
                </a>
                <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">2 análisis gratuitos incluidos. Sin tarjeta de crédito.</p>
              </td></tr>
            </table>

            <!-- Créditos gratis -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border:1px solid #fde68a;border-radius:12px;padding:16px 20px;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                  <strong>🎁 2 créditos gratuitos</strong> activados en tu cuenta. Cada análisis de CV usa 1 crédito.
                  Cuando los uses, puedes obtener más con nuestros planes Pro.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
              Este correo fue enviado a <strong style="color:#6b7280;">${email}</strong>
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">
              © ${new Date().getFullYear()} ELVIA · Todos los derechos reservados ·
              <a href="https://gestioncv.netlify.app/privacidad" style="color:#9ca3af;text-decoration:underline;">Política de Privacidad</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

// ── Template: email de recuperación de contraseña ────────────────────────────
const htmlRecuperacion = (email, resetUrl) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <img src="https://www.elvia.lat/optima_logo_v3_clean_1.png" alt="ELVIA" height="48" style="height:48px;width:auto;display:block;margin:0 auto 8px;" />
            <p style="margin:0;color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Seguridad de cuenta</p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <!-- Ícono de candado -->
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:64px;height:64px;background:#f1f5f9;border-radius:50%;line-height:64px;font-size:30px;">🔐</div>
            </div>

            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;text-align:center;line-height:1.2;">Solicitud de cambio de contraseña</h1>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;text-align:center;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

            <!-- Aviso -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 10px 10px 0;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
                  Si <strong>tú</strong> realizaste esta solicitud, haz clic en el botón de abajo para crear tu nueva contraseña.
                  El enlace es válido por <strong>60 minutos</strong>.
                </p>
              </td></tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="text-align:center;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#0A3D2A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
                  Restablecer contraseña
                </a>
              </td></tr>
            </table>

            <!-- Seguridad -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr><td style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;">
                <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
                  <strong>⚠️ No reconozco esta solicitud</strong><br>
                  Si no solicitaste cambiar tu contraseña, ignora este email. Tu cuenta está segura.
                  Si crees que alguien intenta acceder a tu cuenta, contáctanos a
                  <a href="mailto:privacidad@elvia.lat" style="color:#991b1b;font-weight:700;">privacidad@elvia.lat</a>.
                </p>
              </td></tr>
            </table>

            <!-- Enlace de respaldo -->
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.7;">
              ¿El botón no funciona? Copia y pega este enlace en tu navegador:<br>
              <span style="color:#6b7280;word-break:break-all;">${resetUrl}</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
              Solicitud generada para <strong style="color:#6b7280;">${email}</strong>
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">
              © ${new Date().getFullYear()} ELVIA · Todos los derechos reservados ·
              <a href="https://gestioncv.netlify.app/privacidad" style="color:#9ca3af;text-decoration:underline;">Política de Privacidad</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

// ── POST /api/email/bienvenida — rate-limited, sin auth (se llama post-registro) ──
router.post('/bienvenida', emailRateLimit, async (req, res) => {
  const { email } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }

  try {
    await resend.emails.send({
      from: 'ELVIA <soporte@elvia.lat>',
      to: [email],
      subject: '¡Bienvenido/a a ELVIA! 🎉 Tu cuenta está lista',
      html: htmlBienvenida(email),
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('[email/bienvenida]', err.message)
    res.status(500).json({ error: 'No se pudo enviar el email de bienvenida' })
  }
})

// ── POST /api/email/recuperacion — rate-limited, valida dominio del resetUrl ──
router.post('/recuperacion', emailRateLimit, async (req, res) => {
  const { email, resetUrl } = req.body
  if (!email || !resetUrl) return res.status(400).json({ error: 'Faltan datos' })

  // Validar que resetUrl pertenezca a un origen permitido (anti-phishing)
  const origenPermitido = ALLOWED_RESET_ORIGINS.some(origin => resetUrl.startsWith(origin))
  if (!origenPermitido) {
    console.warn('[email/recuperacion] resetUrl bloqueada:', resetUrl)
    return res.status(400).json({ error: 'URL de restablecimiento inválida' })
  }

  try {
    // Generar el link real de recuperación de Supabase (con el token de seguridad)
    // Usamos el cliente admin para obtener este link sin enviar el correo por separado de Supabase
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: { redirectTo: resetUrl }
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error('[email/recuperacion] Error generating link:', linkErr?.message);
      
      // Si el usuario no existe en Supabase Auth o no hay vínculo
      const msg = linkErr?.message?.toLowerCase() || '';
      if (msg.includes('user not found') || msg.includes('not found') || linkErr?.status === 422) {
        return res.status(404).json({ 
          error: 'No encontramos ninguna cuenta vinculada a este correo.',
          code: 'USER_NOT_FOUND'
        });
      }

      return res.status(500).json({ error: 'No se pudo generar el enlace de seguridad' });
    }

    const actionLink = linkData.properties.action_link;

    const { data: resendData, error: resendErr } = await resend.emails.send({
      from: 'ELVIA <soporte@elvia.lat>',
      to: [email],
      subject: 'Restablece tu contraseña de ELVIA',
      html: htmlRecuperacion(email, actionLink),
    })

    if (resendErr) {
      console.error('[email/recuperacion] Resend API error:', resendErr);
      return res.status(500).json({ error: `Fallo de Resend API: ${resendErr.message}` });
    }

    res.json({ ok: true, data: resendData })

  } catch (err) {
    console.error('[email/recuperacion] Catch error:', err.message)
    res.status(500).json({ error: 'No se pudo enviar el email de recuperación' })
  }
})


// ── Template: email de invitación a empresa B2B ─────────────────────────────
const htmlInvitacion = (email, nombre, companyName, inviteUrl, expiresAt) => {
  const beneficios = [
    { icon: '📄', titulo: 'CV Optimizer', desc: 'Transforma tu CV al formato Harvard' },
    { icon: '🎯', titulo: 'CV vs Vacante', desc: 'Mide compatibilidad con ofertas' },
    { icon: '🎤', titulo: 'Simulador de Entrevista', desc: 'Practica preguntas de tu rol' },
    { icon: '📊', titulo: 'Pipeline', desc: 'Gestiona candidaturas en tablero' },
  ]

  const beneficiosHtml = beneficios.map(({ icon, titulo, desc }) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
      <tr>
        <td width="36" style="vertical-align:top;">
          <div style="width:32px;height:32px;background:#eff6ff;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">${icon}</div>
        </td>
        <td style="padding-left:12px;vertical-align:top;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#111827;">${titulo}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${desc}</p>
        </td>
      </tr>
    </table>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%);padding:36px 40px 32px;text-align:center;">
            <img src="https://www.elvia.lat/elvia-logo-transparent.png" alt="ELVIA" height="52" style="height:52px;width:auto;display:block;margin:0 auto 12px;" />
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Invitación B2B</p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.2;">Te invitaron a ${companyName}</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Tu equipo ya está usando ELVIA para optimizar candidaturas.</p>

            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              Hola ${nombre || 'usuario'},
            </p>

            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              Alguien de tu empresa (<strong style="color:#1e40af;">${companyName}</strong>) te ha invitado a unirte a ELVIA.
              Accede a toda la plataforma de optimización de CV, análisis de compatibilidad y más herramientas de IA para destacar.
            </p>

            <!-- Beneficios -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr><td style="background:#f8fafc;border-radius:14px;padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Acceso incluido:</p>
                ${beneficiosHtml}
              </td></tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td style="text-align:center;">
                <a href="${inviteUrl}"
                   style="display:inline-block;background:#1e40af;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
                  Aceptar invitación →
                </a>
              </td></tr>
            </table>

            <!-- Aviso de expiración -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;">
                <p style="margin:0;font-size:12px;color:#92400e;">
                  <strong>⏰ Válido hasta:</strong> ${expiresAt}
                </p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
              Invitación para <strong style="color:#6b7280;">${email}</strong>
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">
              © ${new Date().getFullYear()} ELVIA · Todos los derechos reservados
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `
}

// ── POST /api/email/invitacion — enviar invitación a empresa B2B ──
router.post('/invitacion', auth, async (req, res) => {
  const { email, nombre, companyName, token, inviteUrl } = req.body

  if (!email || !companyName || !inviteUrl) {
    return res.status(400).json({ error: 'Faltan datos: email, companyName, inviteUrl' })
  }

  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    await resend.emails.send({
      from: 'ELVIA <soporte@elvia.lat>',
      to: [email],
      subject: `Invitación: Únete a ${companyName} en ELVIA`,
      html: htmlInvitacion(email, nombre, companyName, inviteUrl, expiresAt),
    })

    res.json({ ok: true, message: 'Invitación enviada exitosamente' })
  } catch (err) {
    console.error('[email/invitacion]', err.message)
    res.status(500).json({ error: 'No se pudo enviar la invitación' })
  }
})

// ── POST /api/email/contacto-comercial — formulario "Quiero más información" ──
// Público, rate-limited (3/10min por IP)
const escapeHtml = (str) => String(str || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

router.post('/contacto-comercial', emailRateLimit, async (req, res) => {
  const { nombre, empresa, email, telefono, mensaje } = req.body || {}

  if (!nombre || !empresa || !email) {
    return res.status(400).json({ error: 'Faltan datos: nombre, empresa y email son requeridos' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }

  if (!resend) {
    console.warn('[email/contacto-comercial] Resend no configurado')
    return res.status(503).json({ error: 'Servicio de email no disponible' })
  }

  try {
    const nombreSafe   = escapeHtml(nombre)
    const empresaSafe  = escapeHtml(empresa)
    const emailSafe    = escapeHtml(email)
    const telefonoSafe = escapeHtml(telefono || 'No proporcionado')
    const mensajeSafe  = escapeHtml(mensaje || 'Sin mensaje').replace(/\n/g, '<br/>')
    const fecha        = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })

    await resend.emails.send({
      from: 'ELVIA Web <noreply@elvia.lat>',
      to: ['comercial@elvia.lat'],
      reply_to: email,
      subject: `🎯 Nueva solicitud comercial: ${empresaSafe}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
          <h2 style="color:#E8541A;margin-bottom:8px;">Nueva solicitud desde elvia.lat</h2>
          <p style="color:#64748b;font-size:13px;margin-top:0;">${fecha}</p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#64748b;width:30%;">Nombre</td><td style="padding:6px 0;font-weight:bold;">${nombreSafe}</td></tr>
              <tr style="border-top:1px solid #e2e8f0;"><td style="padding:6px 0;color:#64748b;">Empresa</td><td style="padding:6px 0;font-weight:bold;">${empresaSafe}</td></tr>
              <tr style="border-top:1px solid #e2e8f0;"><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;"><a href="mailto:${emailSafe}" style="color:#E8541A;">${emailSafe}</a></td></tr>
              <tr style="border-top:1px solid #e2e8f0;"><td style="padding:6px 0;color:#64748b;">Teléfono</td><td style="padding:6px 0;">${telefonoSafe}</td></tr>
            </table>
          </div>

          <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;">
            <p style="margin:0 0 6px;font-weight:bold;color:#92400e;font-size:13px;">Mensaje:</p>
            <p style="margin:0;font-size:14px;color:#78350f;">${mensajeSafe}</p>
          </div>

          <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
            Responde directamente a este email para contactar a ${nombreSafe}.
          </p>
        </div>
      `,
    })

    res.json({ ok: true, message: 'Solicitud enviada' })
  } catch (err) {
    console.error('[email/contacto-comercial]', err.message)
    res.status(500).json({ error: 'No se pudo enviar la solicitud' })
  }
})

module.exports = router;
