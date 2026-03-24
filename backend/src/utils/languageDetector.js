// Detecta el idioma dominante de un texto
// Detección simple por palabras frecuentes — sin dependencia ESM

const PALABRAS = {
  es: ['experiencia','trabajo','empresa','cargo','años','habilidades','educación','conocimientos','logros','responsabilidades','gestión','desarrollo','equipo','proyecto'],
  en: ['experience','work','company','position','years','skills','education','knowledge','achievements','responsibilities','management','development','team','project'],
  pt: ['experiência','trabalho','empresa','cargo','anos','habilidades','educação','conhecimentos','conquistas','responsabilidades','gestão','desenvolvimento','equipe','projeto'],
}

/**
 * @param {string} text - Texto del CV o vacante
 * @returns {string} Código de idioma: 'es' | 'en' | 'pt' (default: 'es')
 */
const detectLanguage = (text) => {
  if (!text || text.trim().length < 20) return 'es'

  const lower = text.toLowerCase()
  const scores = {}

  for (const [lang, words] of Object.entries(PALABRAS)) {
    scores[lang] = words.filter(w => lower.includes(w)).length
  }

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'es'
}

module.exports = { detectLanguage }
