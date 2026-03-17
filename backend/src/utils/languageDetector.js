// Detecta el idioma dominante de un texto
// franc devuelve código ISO 639-3 — lo convertimos a ISO 639-1
const { franc } = require('franc');

// Solo los idiomas relevantes para el producto (LATAM + USA hispano)
const IDIOMAS_SOPORTADOS = {
  spa: 'es', // Español
  eng: 'en', // Inglés
  por: 'pt', // Portugués
};

/**
 * @param {string} text - Texto del CV o vacante
 * @returns {string} Código de idioma: 'es' | 'en' | 'pt' (default: 'es')
 */
const detectLanguage = (text) => {
  // franc necesita al menos ~20 chars para ser confiable
  if (!text || text.trim().length < 20) return 'es';

  const codigoIso3 = franc(text, { only: Object.keys(IDIOMAS_SOPORTADOS) });

  return IDIOMAS_SOPORTADOS[codigoIso3] || 'es';
};

module.exports = { detectLanguage };
