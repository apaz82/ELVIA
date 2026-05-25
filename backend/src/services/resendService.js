// Servicio de envío de emails via Resend
// Límite gratuito: 3000 emails/mes

const { Resend } = require('resend');

let resend = null;
const _resendKey = process.env.RESEND_API_KEY;
if (!_resendKey) {
  console.error('[Resend] RESEND_API_KEY no configurada — emails deshabilitados');
} else {
  try {
    resend = new Resend(_resendKey);
  } catch (err) {
    console.error('[Resend] Error al inicializar cliente:', err.message);
  }
}
const FROM_EMAIL = 'Equipo ELVIA <noreply@elvia.lat>'; // Dominio verificado en Resend

// Escapa caracteres HTML para evitar XSS en emails generados con template strings
const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

/**
 * Envía email con CV como adjunto
 * @param {string} to — Email del destinatario
 * @param {Buffer} attachment — Buffer del archivo (PDF o Word)
 * @param {string} filename — Nombre del archivo
 * @param {string} subject — Asunto del email
 */
const sendCVEmail = async (to, attachment, filename, subject = 'Tu CV Optimizado') => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: `<p>Adjunto encontrarás tu CV optimizado.</p><p>¡Mucho éxito en tu búsqueda laboral!</p>`,
    attachments: [
      {
        filename,
        content: attachment,
      },
    ],
  });
};

/**
 * Envía código OTP para operaciones sensibles (ej: borrado de usuario)
 * @param {string} to — Email del admin
 * @param {string} otp — Código OTP de 6 dígitos
 * @param {string} targetUserEmail — Email del usuario que será borrado (para referencia)
 */
const sendOTPEmail = async (to, otp, targetUserEmail) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '🔐 Código OTP para confirmar borrado de usuario',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Confirmación de Operación Sensible</h2>

        <p>Se solicita borrar la cuenta de usuario: <strong>${escapeHtml(targetUserEmail)}</strong></p>

        <p style="color: #666; font-size: 14px;">Por razones de seguridad, requiere confirmación con código OTP.</p>

        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Tu código OTP es:</p>
          <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px;">${otp}</p>
          <p style="margin: 0; font-size: 12px; color: #999;">Válido por 10 minutos</p>
        </div>

        <p style="color: #dc2626; font-size: 12px; margin: 20px 0;">
          ⚠️ <strong>IMPORTANTE:</strong> Nunca compartas este código. Si no solicitaste esta operación, ignora este email.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">
          © 2026 ELVIA — Sistema de Gestión
        </p>
      </div>
    `,
  });
};

// Templates personalizados según situación del usuario — refactorizado para DRY
const WAITLIST_TEMPLATES = {
  'Sin empleo y en búsqueda activa': {
    emoji: '🌱',
    intro: 'Este momento de transición es, ante todo, una oportunidad para redescubrir tu valor profesional. ELVIA no es una aplicación más; es un sistema de autogestión diseñado para que tú tomes el control total de tu carrera, empezando por entender profundamente qué es lo que te hace único en el mercado actual.',
    features: [
      'Módulos de autoconocimiento para identificar tu oferta de valor real.',
      'Optimización de CV basada en tu esencia y metas (formato Harvard).',
      'Análisis de compatibilidad estratégica con vacantes reales.',
      'Sistema de gestión para que seas tu propio gerente de búsqueda laboral.'
    ],
    cta: 'Como pionero/a, tendrás acceso preferente a nuestro sistema. Estamos trabajando para que seas tú quien domine el proceso.'
  },
  'Con empleo y en búsqueda activa': {
    emoji: '🎯',
    intro: 'Evolucionar profesionalmente mientras trabajas requiere estrategia y una visión clara de ti mismo. ELVIA es tu sistema de autogestión silencioso, enfocado en ayudarte a identificar cuándo y dónde tu talento brillará más, preparándote para que el siguiente paso sea el correcto.',
    features: [
      'Herramientas de introspección para definir tu siguiente nivel profesional.',
      'CV dinámico que evoluciona con tus logros y visión.',
      'Gestión discreta y estratégica de oportunidades de mercado.',
      'Control total y autogestión de tu visibilidad ante empresas.'
    ],
    cta: 'Por ser parte de este grupo inicial, accederás a beneficios exclusivos. Es momento de gestionar tu carrera con intención.'
  },
  'Quiero gestionar mi siguiente paso': {
    emoji: '🧭',
    intro: 'La autogestión es la base de una carrera exitosa y duradera. En ELVIA creemos que antes de las herramientas viene la persona. Estamos creando un sistema que te acompaña a profundizar en tu perfil para que cada decisión laboral que tomes sea intencional, potente y alineada con quien eres.',
    features: [
      'Diagnóstico de perfil y diseño de tu propuesta de valor única.',
      'Sistema de gestión de hitos y metas profesionales a largo plazo.',
      'Análisis estratégico de empresas y culturas organizacionales.',
      'IA que actúa como un consultor de autoconocimiento permanente.'
    ],
    cta: 'Como pionero/a, serás de los primeros en experimentar este nuevo paradigma de gestión de carrera. El control es tuyo.'
  }
};

const getWaitlistEmailTemplate = (nombre, situacion, referralLink) => {
  const baseStyles = 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;';
  const nombre_escaped = escapeHtml(nombre);
  const template = WAITLIST_TEMPLATES[situacion] || WAITLIST_TEMPLATES['Sin empleo y en búsqueda activa'];
  const featuresHTML = template.features.map(f => `<li>${f}</li>`).join('');
  
  // Extraer código del link (asumimos formato ?ref=CODIGO)
  const referralCode = referralLink.split('ref=')[1] || '---';

  return `
    <div style="${baseStyles}">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://elvia.lat/elvia-logo-transparent.png" alt="ELVIA Logo" style="width: 140px; height: auto;" />
      </div>

      <h2 style="color: #E8541A;">¡Hola ${nombre_escaped}! ${template.emoji}</h2>
      <p>Gracias por unirte a la lista de espera de <strong>ELVIA</strong>.</p>
      <p>${template.intro}</p>
      
      <p><strong>Lo que obtendrás como pionero:</strong></p>
      <ul style="color: #374151;">
        ${featuresHTML}
      </ul>

      <div style="background: #F8FAFC; border: 2px solid #E2E8F0; padding: 32px; border-radius: 24px; margin: 32px 0; text-align: center;">
        <h3 style="color: #0F172A; margin-top: 0; font-size: 20px;">🎁 ¡Tu Recompensa Exclusiva!</h3>
        <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">
          Si <strong>5 personas</strong> se unen con tu link, te daremos un <strong>código de descuento exclusivo para tu plan</strong> cuando lancemos.
        </p>
        
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; font-weight: bold; margin-bottom: 8px;">Tu Código de Invitado:</p>
        <div style="background: #FFFFFF; padding: 16px; border-radius: 12px; border: 2px solid #E8541A; margin-bottom: 24px; font-family: monospace; font-size: 24px; font-weight: bold; color: #E8541A; letter-spacing: 2px;">
          ${referralCode}
        </div>

        <p style="font-size: 14px; color: #64748B; margin-bottom: 16px;">Comparte tu link personalizado:</p>
        
        <div style="margin-bottom: 24px;">
          <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Mira esto! Me acabo de unir a la lista de espera de ELVIA, un sistema de autogestión para la transición de carrera con herramientas de clase mundial. Únete con mi link: ${referralLink}`)}" 
             style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 4px;">
             WhatsApp
          </a>
          <a href="mailto:?subject=Te invito a conocer ELVIA - Sistema de Autogestión Laboral&body=${encodeURIComponent(`¡Hola!\n\nMe acabo de registrar en la lista de espera de ELVIA, una plataforma increíble que funciona como un sistema de autogestión para la transición de carrera.\n\nTienen herramientas muy potentes para optimizar tu perfil y encontrar mejores oportunidades.\n\nComo soy de los primeros, me dieron un enlace de invitado. Si te registras con mi link, ambos podremos acceder a beneficios exclusivos y descuentos cuando lancen.\n\nÚnete usando mi enlace único aquí:\n${referralLink}\n\n¡Espero que te sirva tanto como a mí!\n\n---\nELVIA | CONECTA TU PRESENTE CON EL FUTURO QUE QUIERES`)}" 
             style="display: inline-block; background: #64748B; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 4px;">
             Reenviar por Email
          </a>
        </div>
        
        <p style="font-size: 12px; color: #94A3B8;">O copia este link: <br/> <span style="color: #E8541A;">${referralLink}</span></p>
      </div>

      <p>${template.cta}</p>
      <p>¡Nos encanta escucharte! Si tienes sugerencias, responde este correo.</p>
      <p>Un saludo,<br/><strong>El equipo de ELVIA</strong></p>
      <p style="color: #E8541A; font-weight: bold; font-size: 14px; margin-top: 24px;">ELVIA | CONECTA TU PRESENTE CON EL FUTURO QUE QUIERES</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; margin-bottom: 8px;">© 2026 ELVIA · Sistema de Autogestión Laboral</p>
      <p style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
        Recibiste este correo ya que te inscribiste y aceptaste nuestra política de privacidad de datos en el portal oficial de ELVIA.
      </p>
    </div>
  `;
};

const sendWelcomeWaitlistEmail = async (to, nombre, situacion, referralLink) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  const html = getWaitlistEmailTemplate(nombre, situacion, referralLink);

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'hola@elvia.lat',
    subject: 'Tu acceso a ELVIA está confirmado 🚀',
    html,
  });
};

const sendInvitacionEmail = async (to, nombre, companyName, inviteUrl) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const nombreSafe = escapeHtml(nombre || '');
  const companySafe = escapeHtml(companyName);

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Invitación: Únete a ${companySafe} en ELVIA`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #E8541A;">¡Hola${nombreSafe ? ` ${nombreSafe}` : ''}! 👋</h2>
        <p>Fuiste invitado/a a unirte a <strong>${companySafe}</strong> en ELVIA.</p>
        <p>Haz clic en el botón para crear tu cuenta y acceder a la plataforma:</p>
        <div style="text-align:center; margin: 32px 0;">
          <a href="${escapeHtml(inviteUrl)}" style="background:#E8541A;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            Aceptar invitación
          </a>
        </div>
        <p style="font-size:13px;color:#6b7280;">Este enlace expira el ${expiresAt}.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} ELVIA · Todos los derechos reservados</p>
      </div>
    `,
  });
};

const sendHRWelcomeEmail = async (to, { hrNombre, companyName, hrUrl, tempPassword }) => {
  if (!resend) {
    console.warn('[Resend] sendHRWelcomeEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe = escapeHtml(hrNombre || '')
  const companySafe = escapeHtml(companyName)
  const urlSafe = escapeHtml(hrUrl)
  const pwSafe = escapeHtml(tempPassword)

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Tu acceso al panel HR de ${companySafe} en ELVIA`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #1e3a8a;">¡Hola${nombreSafe ? ` ${nombreSafe}` : ''}! 👋</h2>
        <p>Tu cuenta de administrador HR ha sido creada para <strong>${companySafe}</strong> en ELVIA.</p>

        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #6b7280;">Tu portal HR:</p>
          <p style="margin: 0 0 16px;">
            <a href="${urlSafe}" style="color: #1e3a8a; font-weight: bold;">${urlSafe}</a>
          </p>
          <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">Email de acceso:</p>
          <p style="margin: 0 0 12px; font-weight: bold;">${escapeHtml(to)}</p>
          <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">Contraseña temporal:</p>
          <p style="margin: 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px;">${pwSafe}</p>
        </div>

        <p style="color: #dc2626; font-size: 13px;">
          ⚠️ Por seguridad, cambia tu contraseña al iniciar sesión por primera vez.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${urlSafe}"
             style="background: #1e3a8a; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Acceder al panel HR
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} ELVIA · Plataforma de Outplacement</p>
      </div>
    `,
  })
}

module.exports = {
  sendCVEmail,
  sendOTPEmail,
  sendWelcomeWaitlistEmail,
  sendInvitacionEmail,
  sendHRWelcomeEmail,
};
