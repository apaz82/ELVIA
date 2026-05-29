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

const sendHRWelcomeEmail = async (to, { hrNombre, companyName, hrUrl, setupLink }) => {
  if (!resend) {
    console.warn('[Resend] sendHRWelcomeEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe = escapeHtml(hrNombre || '')
  const companySafe = escapeHtml(companyName)
  const urlSafe = escapeHtml(hrUrl)
  const setupSafe = escapeHtml(setupLink)

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Tu acceso al panel HR de ${companySafe} en ELVIA`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #1e3a8a;">¡Hola${nombreSafe ? ` ${nombreSafe}` : ''}! 👋</h2>
        <p>Tu cuenta de administrador HR ha sido creada para <strong>${companySafe}</strong> en ELVIA.</p>

        <p>Para activarla, configura tu contraseña haciendo clic en el botón de abajo. El enlace es de un solo uso y expira en 1 hora.</p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${setupSafe}"
             style="background: #1e3a8a; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Configurar mi contraseña
          </a>
        </div>

        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #6b7280;">Tu portal HR (después de configurar):</p>
          <p style="margin: 0 0 16px;">
            <a href="${urlSafe}" style="color: #1e3a8a; font-weight: bold;">${urlSafe}</a>
          </p>
          <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">Email de acceso:</p>
          <p style="margin: 0; font-weight: bold;">${escapeHtml(to)}</p>
        </div>

        <p style="color: #6b7280; font-size: 13px;">
          Si no esperabas este email, ignóralo. El enlace expirará automáticamente.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} ELVIA · Plataforma de Outplacement</p>
      </div>
    `,
  })
}

/**
 * Email de activación para candidatos B2B invitados por HR Admin.
 * Incluye colores del tenant para branding consistente.
 */
const sendCandidatoInviteEmail = async (to, { nombre, apellido, companyName, primaryColor, activarUrl, hrUrl }) => {
  if (!resend) {
    console.warn('[Resend] sendCandidatoInviteEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe   = escapeHtml((nombre || '').trim())
  const companySafe  = escapeHtml(companyName)
  const color        = escapeHtml(primaryColor || '#14B8A6')
  const activarSafe  = escapeHtml(activarUrl)
  const hrSafe       = escapeHtml(hrUrl || '')

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Activa tu acceso al programa ${companySafe} en ELVIA®`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">

        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" style="height: 36px; width: auto;" />
        </div>

        <div style="background: ${color}; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 8px;">
          Hola${nombreSafe ? ` ${nombreSafe}` : ''}${apellido ? ` ${escapeHtml(apellido)}` : ''} 👋
        </h2>
        <p style="color: #475569; margin: 0 0 24px;">
          <strong>${companySafe}</strong> te ha dado acceso a <strong>ELVIA®</strong>,
          tu plataforma personal de acompañamiento en transición profesional.
        </p>

        <p style="color: #475569; margin: 0 0 8px;">
          Para empezar, activa tu cuenta creando una contraseña. El enlace es de un solo uso y válido por <strong>1 hora</strong>.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${activarSafe}"
             style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Activar mi cuenta
          </a>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8;">
            ¿Ya activaste tu cuenta? Inicia sesión aquí:
          </p>
          <a href="${hrSafe}" style="color: ${color}; font-weight: bold; word-break: break-all;">${hrSafe}</a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          Si no esperabas este email o tienes dudas, contáctanos en
          <a href="mailto:soporte@elvia.lat" style="color: ${color};">soporte@elvia.lat</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad
        </p>
      </div>
    `,
  })
}

/**
 * Email de bienvenida tras activación exitosa de cuenta B2B.
 * Incluye fecha de activación, fecha de caducidad y CTA a Autoconocimiento.
 */
const sendBienvenidaActivacionEmail = async (to, { nombre, apellido, companyName, primaryColor, loginUrl, activatedAt, licenseExpiresAt }) => {
  if (!resend) {
    console.warn('[Resend] sendBienvenidaActivacionEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe   = escapeHtml((nombre || '').trim())
  const apellidoSafe = escapeHtml((apellido || '').trim())
  const companySafe  = escapeHtml(companyName)
  const color        = escapeHtml(primaryColor || '#14B8A6')
  const loginSafe    = escapeHtml(loginUrl)

  const fmtDate = (d) => new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })
  const activacionStr  = fmtDate(activatedAt)
  const caducidadStr   = fmtDate(licenseExpiresAt)

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: `¡Bienvenido/a a ELVIA®, ${nombreSafe || 'participante'}! Tu acceso está listo 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">

        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>

        <div style="background: ${color}; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 6px;">
          ¡Bienvenido/a${nombreSafe ? `, ${nombreSafe}${apellidoSafe ? ` ${apellidoSafe}` : ''}` : ''}! 🎉
        </h2>
        <p style="color: #475569; margin: 0 0 24px;">
          Tu cuenta en <strong>${companySafe}</strong> a través de <strong>ELVIA®</strong> está activa y lista para usar.
        </p>

        <!-- Datos de licencia -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 0 0 28px;">
          <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #64748b;">
            Información de tu acceso
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #64748b; width: 50%;">Fecha de activación</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: bold; color: #0f172a;">${activacionStr}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Fecha de caducidad</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: bold; color: ${color};">${caducidadStr}</td>
            </tr>
          </table>
        </div>

        <!-- Primer paso recomendado -->
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 0 0 28px;">
          <p style="margin: 0 0 6px; font-weight: bold; color: #92400e;">⭐ Por dónde empezar</p>
          <p style="margin: 0; font-size: 14px; color: #78350f;">
            Para activar <strong>todas las funcionalidades</strong> de la plataforma, incluyendo el Gerente de Búsqueda y el análisis de compatibilidad con vacantes, es indispensable que primero completes la sección de <strong>Autoconocimiento</strong>. Es el primer paso de tu Proyecto Laboral.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginSafe}"
             style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ir a la plataforma
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center;">
          ¿Tienes dudas? Escríbenos a
          <a href="mailto:soporte@elvia.lat" style="color: ${color};">soporte@elvia.lat</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad
        </p>
      </div>
    `,
  })
}

/**
 * Correo 1: Oferta de Valor Completada (Hito de Autoconocimiento)
 */
const sendOfertaValorCompletadaEmail = async (to, nombre) => {
  if (!resend) {
    console.warn('[Resend] sendOfertaValorCompletadaEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe = escapeHtml((nombre || '').trim())
  const loginUrl = process.env.FRONTEND_URL || 'https://elvia.lat/login'

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: '🌟 ¡Muy bien hecho! Tu Autoconocimiento está listo en ELVIA®',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: #002650; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 16px;">
          ¡Muy bien hecho${nombreSafe ? `, ${nombreSafe}` : ''}! 🌟
        </h2>
        <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">
          Has finalizado con éxito la sección de <strong>Autoconocimiento</strong> y definido tu <strong>Oferta de Valor Profesional</strong>. ¡Este es el pilar fundamental de tu Proyecto Laboral!
        </p>
        <p style="color: #475569; margin: 0 0 24px; font-size: 15px;">
          Ahora estás a solo un paso de desbloquear todas las herramientas inteligentes de la plataforma. Solo falta que generes y confirmes tu **CV optimizado** para activar el Simulador de Entrevistas, el Análisis de LinkedIn y el Match de Vacantes.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}"
             style="display: inline-block; background: #002650; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,38,80,0.15);">
            Optimizar mi CV ahora
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          El control total de tu carrera está en tus manos. Si tienes dudas o comentarios sobre tu oferta de valor, escríbenos a
          <a href="mailto:soporte@elvia.lat" style="color: #002650;">soporte@elvia.lat</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0 0 8px;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad
        </p>
        <p style="font-size: 10px; color: #cbd5e1; text-align: center; line-height: 1.4; margin: 0;">
          Recibes este correo porque estás registrado en la plataforma ELVIA® de optimización y aceleración profesional. Tu privacidad es de máxima importancia para nosotros. Tratamos todos tus datos personales de manera estrictamente confidencial de acuerdo con nuestras Políticas de Privacidad y el disclaimer de privacidad de datos.
        </p>
      </div>
    `,
  })
}

/**
 * Correo 2: Infografía Descargada/Generada
 */
const sendInfografiaGeneradaEmail = async (to, nombre) => {
  if (!resend) {
    console.warn('[Resend] sendInfografiaGeneradaEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe = escapeHtml((nombre || '').trim())
  const docsUrl = `${process.env.FRONTEND_URL || 'https://elvia.lat'}/mis-cvs`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: '📊 Has descargado tu Infografía Profesional en ELVIA®',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: #002650; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 16px;">
          ¡Hola${nombreSafe ? `, ${nombreSafe}` : ''}! 👋
        </h2>
        <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">
          Hemos detectado que has generado o descargado tu **Infografía Profesional**. En ella podrás ver un mapa visual consolidado de tu perfil: tu propuesta de valor, ritmo de búsqueda semanal, propósito Ikigai y repertorio de competencias clave.
        </p>
        <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">
          Si tuviste algún inconveniente al descargar el documento en tu dispositivo, no te preocupes: tu reporte visual se encuentra guardado de forma permanente y segura en tu sección de <strong>Mis documentos</strong> en la plataforma.
        </p>
        <p style="color: #475569; margin: 0 0 24px; font-size: 15px; font-style: italic;">
          *Recuerda que para visualizar este reporte consolidado y descargar tu infografía, es necesario haber generado también tu CV optimizado estilo Harvard en la suite.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${docsUrl}"
             style="display: inline-block; background: #002650; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,38,80,0.15);">
            Ir a Mis documentos
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          ¿Deseas actualizar tu infografía? Puedes hacerlo editando los pilares de tu Proyecto Laboral en cualquier momento. Si necesitas soporte, escríbenos a
          <a href="mailto:soporte@elvia.lat" style="color: #002650;">soporte@elvia.lat</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0 0 8px;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad
        </p>
        <p style="font-size: 10px; color: #cbd5e1; text-align: center; line-height: 1.4; margin: 0;">
          Recibes este correo porque estás registrado en la plataforma ELVIA® de optimización y aceleración profesional. Tu privacidad es de máxima importancia para nosotros. Tratamos todos tus datos personales de manera estrictamente confidencial de acuerdo con nuestras Políticas de Privacidad y el disclaimer de privacidad de datos.
        </p>
      </div>
    `,
  })
}

/**
 * Correo 3: CV Optimizado Generado (Desbloqueo Total)
 */
const sendCVOptimizadoCompletadaEmail = async (to, nombre) => {
  if (!resend) {
    console.warn('[Resend] sendCVOptimizadoCompletadaEmail — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe = escapeHtml((nombre || '').trim())
  const dashboardUrl = `${process.env.FRONTEND_URL || 'https://elvia.lat'}/dashboard`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: '🎉 ¡Felicitaciones! Has desbloqueado todo el poder de ELVIA®',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: #002650; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 16px;">
          ¡Felicidades${nombreSafe ? `, ${nombreSafe}` : ''}! 🎉
        </h2>
        <p style="color: #475569; margin: 0 0 16px; font-size: 15px;">
          ¡Has confirmado y finalizado la optimización de tu CV Inicial! Con esto, has <strong>desbloqueado el 100% de las funcionalidades avanzadas</strong> de la plataforma ELVIA®.
        </p>
        <p style="color: #475569; margin: 0 0 24px; font-size: 15px;">
          Es momento de materializar y poner en acción toda la planeación que estructuraste en tu sección de Autoconocimiento. Tu Centro de Control ya está activo para que simules entrevistas personalizadas con IA, audites tu perfil de LinkedIn y busques vacantes de manera inteligente.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}"
             style="display: inline-block; background: #002650; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,38,80,0.15);">
            Ir a mi Centro de Control
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          El camino hacia tu siguiente gran paso profesional está listo. Estamos muy orgullosos de acompañarte. Si necesitas asistencia, contáctanos en
          <a href="mailto:soporte@elvia.lat" style="color: #002650;">soporte@elvia.lat</a>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0 0 8px;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad
        </p>
        <p style="font-size: 10px; color: #cbd5e1; text-align: center; line-height: 1.4; margin: 0;">
          Recibes este correo porque estás registrado en la plataforma ELVIA® de optimización y aceleración profesional. Tu privacidad es de máxima importancia para nosotros. Tratamos todos tus datos personales de manera estrictamente confidencial de acuerdo con nuestras Políticas de Privacidad y el disclaimer de privacidad de datos.
        </p>
      </div>
    `,
  })
}

/**
 * Engagement Day+1: si Gerente < 30% al día siguiente de activación.
 * "Tu primer paso: 7 min para destrabar tu carrera"
 */
const sendOnboarding1Email = async (to, { nombre, companyName, primaryColor, loginUrl, diasRestantes }) => {
  if (!resend) {
    console.warn('[Resend] sendOnboarding1Email — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe  = escapeHtml((nombre || '').trim())
  const companySafe = escapeHtml(companyName || 'tu empresa')
  const color       = escapeHtml(primaryColor || '#019DF4')
  const loginSafe   = escapeHtml(loginUrl || 'https://elvia.lat')
  const dias        = Number(diasRestantes) || 9

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: `⚡ Tu primer paso: 7 min para destrabar tu búsqueda`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">

        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: ${color}; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 8px;">
          Hola${nombreSafe ? ` ${nombreSafe}` : ''} 👋
        </h2>
        <p style="color: #475569; margin: 0 0 20px; font-size: 15px;">
          Ayer activaste tu acceso al programa de <strong>${companySafe}</strong> en ELVIA®. ¡Bien hecho!
        </p>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 10px 10px 0; padding: 18px 20px; margin: 0 0 28px;">
          <p style="margin: 0 0 6px; font-weight: bold; color: #92400e; font-size: 15px;">
            ⏱️ Hay un paso que desbloquea todo lo demás
          </p>
          <p style="margin: 0; font-size: 14px; color: #78350f;">
            En solo <strong>7 minutos</strong> puedes completar las primeras secciones de tu Gerente de Proyecto Laboral. Eso activa el CV optimizado, la simulación de entrevistas y el match con vacantes.
          </p>
        </div>

        <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">
          <strong>¿Por dónde empezar?</strong>
        </p>
        <ol style="color: #475569; font-size: 14px; padding-left: 20px; margin: 0 0 28px;">
          <li style="margin-bottom: 8px;">Entra a la plataforma con tu correo y contraseña.</li>
          <li style="margin-bottom: 8px;">Ve a <strong>"Autoconocimiento – Gerente de proyecto laboral"</strong> (primer ítem del menú).</li>
          <li>Completa tu <strong>Perfil</strong> y <strong>Competencias</strong>. Son las secciones más cortas y desbloquean lo demás.</li>
        </ol>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginSafe}"
             style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Empezar ahora →
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Tienes <strong>${dias} días</strong> de acceso en este programa. Aprovecha al máximo cada herramienta.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad<br/>
          <span style="font-size: 10px; color: #cbd5e1;">
            Recibes este correo por ser participante del programa ${companySafe}.
            Si tienes dudas escríbenos a <a href="mailto:soporte@elvia.lat" style="color: #94a3b8;">soporte@elvia.lat</a>
          </span>
        </p>
      </div>
    `,
  })
}

/**
 * Engagement Day+3: si Gerente < 60% al tercer día.
 * "Te falta poco para desbloquear tu CV"
 */
const sendOnboarding3Email = async (to, { nombre, companyName, primaryColor, loginUrl, progreso, diasRestantes }) => {
  if (!resend) {
    console.warn('[Resend] sendOnboarding3Email — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe  = escapeHtml((nombre || '').trim())
  const companySafe = escapeHtml(companyName || 'tu empresa')
  const color       = escapeHtml(primaryColor || '#019DF4')
  const loginSafe   = escapeHtml(loginUrl || 'https://elvia.lat')
  const pct         = Math.round(Number(progreso) || 0)
  const dias        = Number(diasRestantes) || 7

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: `🎯 ${pct}% completado — te falta poco para desbloquear tu CV`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">

        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: ${color}; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 8px;">
          ¡Hola${nombreSafe ? ` ${nombreSafe}` : ''}! Ya llevas un ${pct}% 💪
        </h2>
        <p style="color: #475569; margin: 0 0 20px; font-size: 15px;">
          Vas bien. Y estás más cerca de lo que crees de tener tu <strong>CV optimizado estilo Harvard</strong> y todas las herramientas activas.
        </p>

        <!-- Barra de progreso visual -->
        <div style="background: #f1f5f9; border-radius: 99px; height: 12px; margin: 0 0 6px; overflow: hidden;">
          <div style="background: ${color}; width: ${pct}%; height: 100%; border-radius: 99px;"></div>
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0 0 28px; text-align: right;">${pct}% completado</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin: 0 0 28px;">
          <p style="margin: 0 0 10px; font-weight: bold; color: #14532d; font-size: 14px;">
            ✅ ¿Qué desbloqueas al llegar al 100%?
          </p>
          <ul style="margin: 0; padding-left: 18px; color: #166534; font-size: 14px;">
            <li style="margin-bottom: 6px;"><strong>CV optimizado</strong> con formato Harvard + ATS-friendly</li>
            <li style="margin-bottom: 6px;"><strong>Simulador de entrevistas</strong> con IA personalizada a tu perfil</li>
            <li style="margin-bottom: 6px;"><strong>Análisis de LinkedIn®</strong> con sugerencias concretas</li>
            <li><strong>Match de vacantes</strong> con score de compatibilidad</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginSafe}"
             style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Continuar donde lo dejé →
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Quedan <strong>${dias} días</strong> en tu programa. ¡Tú puedes!
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad<br/>
          <span style="font-size: 10px; color: #cbd5e1;">
            Recibes este correo por ser participante del programa ${companySafe}.
            <a href="mailto:soporte@elvia.lat" style="color: #94a3b8;">soporte@elvia.lat</a>
          </span>
        </p>
      </div>
    `,
  })
}

/**
 * Engagement Day+7: recap de mitad de programa (siempre se envía).
 * Muestra progreso real + urgencia (X días restantes).
 */
const sendRecap7Email = async (to, { nombre, companyName, primaryColor, loginUrl, progreso, cvGenerado, vacantesAnalizadas, entrevistasSimuladas, diasRestantes }) => {
  if (!resend) {
    console.warn('[Resend] sendRecap7Email — email deshabilitado (sin API key)')
    return
  }
  const nombreSafe  = escapeHtml((nombre || '').trim())
  const companySafe = escapeHtml(companyName || 'tu empresa')
  const color       = escapeHtml(primaryColor || '#019DF4')
  const loginSafe   = escapeHtml(loginUrl || 'https://elvia.lat')
  const pct         = Math.round(Number(progreso) || 0)
  const dias        = Number(diasRestantes) || 3
  const cvOk        = !!cvGenerado
  const vacantes    = Number(vacantesAnalizadas) || 0
  const entrevistas = Number(entrevistasSimuladas) || 0

  // Mensaje de urgencia según días restantes
  const urgenciaMsg = dias <= 3
    ? `⚠️ Solo quedan <strong>${dias} días</strong> de acceso. Aprovecha ahora.`
    : `Quedan <strong>${dias} días</strong> en tu programa.`

  // Ítem de logro dinámico
  const logros = []
  if (pct >= 100) logros.push('✅ Autoconocimiento completado al 100%')
  else logros.push(`📊 Autoconocimiento: <strong>${pct}%</strong> completado`)
  if (cvOk) logros.push('✅ CV optimizado generado')
  else logros.push('⬜ CV optimizado: pendiente')
  if (vacantes > 0) logros.push(`✅ ${vacantes} vacante${vacantes > 1 ? 's' : ''} analizada${vacantes > 1 ? 's' : ''}`)
  else logros.push('⬜ Análisis de vacantes: pendiente')
  if (entrevistas > 0) logros.push(`✅ ${entrevistas} simulación${entrevistas > 1 ? 'es' : ''} de entrevista completada${entrevistas > 1 ? 's' : ''}`)
  else logros.push('⬜ Simulaciones de entrevista: pendiente')

  const logrosHTML = logros.map(l => `<li style="margin-bottom: 10px; font-size: 14px;">${l}</li>`).join('')

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    reply_to: 'soporte@elvia.lat',
    subject: `📊 Llevas 7 días en ELVIA® — esto has logrado`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">

        <div style="text-align: center; padding: 32px 0 16px;">
          <img src="https://elvia.lat/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" style="height: 36px; width: auto;" />
        </div>
        <div style="background: ${color}; height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>

        <h2 style="color: #0f172a; margin: 0 0 8px;">
          ${nombreSafe ? `${nombreSafe}, llevas` : 'Llevas'} 7 días en el programa 🎉
        </h2>
        <p style="color: #475569; margin: 0 0 20px; font-size: 15px;">
          Aquí está tu resumen. Cada acción que tomaste en la plataforma es un paso real hacia tu próxima oportunidad.
        </p>

        <!-- Resumen de logros -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 0 0 28px;">
          <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #64748b;">
            Tu progreso hasta hoy
          </p>
          <ul style="margin: 0; padding-left: 0; list-style: none; color: #1e293b;">
            ${logrosHTML}
          </ul>
        </div>

        <!-- Barra de progreso -->
        <div style="background: #f1f5f9; border-radius: 99px; height: 10px; margin: 0 0 6px; overflow: hidden;">
          <div style="background: ${color}; width: ${pct}%; height: 100%; border-radius: 99px;"></div>
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0 0 28px; text-align: right;">${pct}% del Autoconocimiento completado</p>

        <!-- Urgencia -->
        <div style="background: #fff7ed; border-left: 4px solid #f97316; border-radius: 0 10px 10px 0; padding: 16px 20px; margin: 0 0 28px;">
          <p style="margin: 0; font-size: 14px; color: #7c2d12;">
            ${urgenciaMsg} Las herramientas avanzadas — CV, entrevistas, análisis LinkedIn® — requieren completar el Autoconocimiento. No dejes pasar el tiempo.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginSafe}"
             style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 40px;
                    border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Ir a la plataforma →
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} ELVIA® · Plataforma de Outplacement y Empleabilidad<br/>
          <span style="font-size: 10px; color: #cbd5e1;">
            Recibes este correo por ser participante del programa ${companySafe}.
            <a href="mailto:soporte@elvia.lat" style="color: #94a3b8;">soporte@elvia.lat</a>
          </span>
        </p>
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
  sendCandidatoInviteEmail,
  sendBienvenidaActivacionEmail,
  sendOfertaValorCompletadaEmail,
  sendInfografiaGeneradaEmail,
  sendCVOptimizadoCompletadaEmail,
  sendOnboarding1Email,
  sendOnboarding3Email,
  sendRecap7Email,
};
