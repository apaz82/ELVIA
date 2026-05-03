// Servicio de envío de emails via Resend
// Límite gratuito: 3000 emails/mes

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'noreply@elvia.lat'; // Dominio verificado en Resend

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

const getWaitlistEmailTemplate = (nombre, situacion) => {
  const baseStyles = 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;';
  const nombre_escaped = escapeHtml(nombre);
  const template = WAITLIST_TEMPLATES[situacion] || WAITLIST_TEMPLATES['Sin empleo y en búsqueda activa'];
  const featuresHTML = template.features.map(f => `<li>${f}</li>`).join('');

  return `
    <div style="${baseStyles}">
      <h2 style="color: #E8541A;">¡Hola ${nombre_escaped}! ${template.emoji}</h2>
      <p>Gracias por unirte a la lista de espera de <strong>ELVIA</strong>.</p>
      <p>${template.intro}</p>
      <p><strong>Lo que tendrás cuando lancemos:</strong></p>
      <ul style="color: #374151;">
        ${featuresHTML}
      </ul>
      <p>${template.cta}</p>
      <p>¡Nos encanta escucharte! Si tienes sugerencias, responde este correo.</p>
      <p>Un saludo,<br/><strong>El equipo de ELVIA</strong></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">© 2026 ELVIA</p>
    </div>
  `;
};

const sendWelcomeWaitlistEmail = async (to, nombre, situacion) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  const html = getWaitlistEmailTemplate(nombre, situacion);

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Tu acceso al Sistema de Autogestión de ELVIA está cerca 🧭',
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

module.exports = {
  sendCVEmail,
  sendOTPEmail,
  sendWelcomeWaitlistEmail,
  sendInvitacionEmail,
};
