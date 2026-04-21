// Servicio para generar y validar códigos OTP
// Usado para operaciones sensibles (ej: borrado de usuario)

const crypto = require('crypto');

// Almacenamiento en memoria de OTP — IMPORTANTE: usar Redis en producción
const otpStore = new Map();
const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

/**
 * Genera un código OTP aleatorio de 6 dígitos
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Almacena un OTP para un usuario admin con expiración
 * @param {string} adminId — UUID del admin
 * @param {string} adminEmail — Email del admin
 * @returns {string} codigo OTP generado
 */
const createOTP = (adminId, adminEmail) => {
  const code = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

  otpStore.set(adminId, {
    code,
    email: adminEmail,
    expiresAt,
    attempts: 0,
  });

  return code;
};

/**
 * Valida un OTP
 * @param {string} adminId — UUID del admin
 * @param {string} code — Código OTP ingresado
 * @returns {object} { valid: boolean, error?: string }
 */
const validateOTP = (adminId, code) => {
  const stored = otpStore.get(adminId);

  if (!stored) {
    return { valid: false, error: 'OTP no solicitado o expirado' };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(adminId);
    return { valid: false, error: 'OTP expirado. Solicita uno nuevo.' };
  }

  stored.attempts++;
  if (stored.attempts > 5) {
    otpStore.delete(adminId);
    return { valid: false, error: 'Demasiados intentos. Solicita un nuevo OTP.' };
  }

  if (stored.code !== code) {
    return { valid: false, error: 'Código OTP incorrecto.' };
  }

  // OTP validado — borramos del almacén
  otpStore.delete(adminId);
  return { valid: true };
};

module.exports = {
  generateOTP,
  createOTP,
  validateOTP,
};
