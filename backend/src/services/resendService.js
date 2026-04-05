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
    emoji: '🚀',
    intro: 'Sabemos que esta es una etapa crucial en tu carrera. Por eso estamos afinando los últimos detalles de nuestra plataforma potenciada por IA para ayudarte a destacar en el mercado laboral y superar todos los filtros corporativos.',
    features: [
      'CV optimizado en formato Harvard en segundos',
      'Análisis de compatibilidad con cada vacante (% de match real)',
      'Herramientas de búsqueda sin horas perdidas en portales',
      'Pipeline visual para gestionar tu proceso de selección'
    ],
    cta: 'Por ser pionero, recibirás <strong>descuentos exclusivos</strong> cuando lancemos. Muy pronto estaremos live.'
  },
  'Con empleo y en búsqueda activa': {
    emoji: '👋',
    intro: 'Estamos construyendo la plataforma para profesionales como tú que buscan dar el siguiente paso en su carrera sin prisa, pero sin pausa. Nuestra IA te ayudará a destacar cuando llegue la oportunidad correcta.',
    features: [
      'CV siempre listo y optimizado para nuevas oportunidades',
      'Análisis rápido de compatibilidad antes de postularte',
      'Gestión de candidaturas en un solo lugar',
      'Herramientas para negociar desde una posición de poder'
    ],
    cta: 'Por ser pionero, accederás a beneficios exclusivos cuando lancemos. Prepárate para tu siguiente proyecto.'
  },
  'Quiero gestionar mi siguiente paso': {
    emoji: '🎯',
    intro: 'Te felicitamos por ser intencional con tu carrera. Estamos construyendo la plataforma que te ayudará a ser tu propio gerente de proyecto laboral: desde el autoconocimiento hasta la ejecución perfecta.',
    features: [
      'Módulo de autoconocimiento: descubre tu oferta de valor real',
      'CV optimizado para el mercado que buscas',
      'Análisis estratégico de vacantes y empresas',
      'Pipeline completo: seguimiento, control y tranquilidad',
      'Acompañamiento de IA a tu ritmo'
    ],
    cta: 'Por ser pionero, serás de los primeros en probar nuestra solución completa. Gestiona tu carrera con las herramientas correctas.'
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
    subject: '¡Bienvenido a la tribu pionera de ELVIA! 🚀',
    html,
  });
};

module.exports = {
  sendCVEmail,
  sendOTPEmail,
  sendWelcomeWaitlistEmail,
};
