// Servicio de envío de emails via Resend
// Límite gratuito: 3000 emails/mes

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'noreply@optimacv.cv'; // Verificar dominio en Resend

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

        <p>Se solicita borrar la cuenta de usuario: <strong>${targetUserEmail}</strong></p>

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
          © 2026 OPTIMA-CV — Sistema de Gestión
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendCVEmail,
  sendOTPEmail,
};
