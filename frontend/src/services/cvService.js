// Llamadas al backend para operaciones de CV
import { api } from './api'

// Optimizar CV (Página 1)
export const optimizarCV = async (archivo, language) => {
  const formData = new FormData()
  formData.append('cv', archivo)
  if (language) formData.append('language', language)
  return api.postForm('/api/cv/optimize', formData)
}

// Adaptar CV a vacante (Página 2)
// cvOArchivo puede ser un File (subida nueva) o un string UUID (CV ya optimizado)
export const matchCVVacante = async (cvOArchivo, jobText, language) => {
  const formData = new FormData()
  if (typeof cvOArchivo === 'string') {
    formData.append('cvId', cvOArchivo)   // ID del CV optimizado en Supabase
  } else {
    formData.append('cv', cvOArchivo)     // Archivo nuevo
  }
  formData.append('jobText', jobText)
  if (language) formData.append('language', language)
  return api.postForm('/api/cv/match', formData)
}

// Obtener datos estructurados para la vista infográfica
export const obtenerInfografia = async (id) => {
  return api.get(`/api/cv/infografia/${id}`)
}

// Extraer datos del perfil del CV para pre-llenar el onboarding
export const extractarPerfilCV = async (archivo) => {
  const formData = new FormData()
  formData.append('cv', archivo)
  return api.postForm('/api/cv/extract-profile', formData)
}

// Generar CV desde formulario estructurado
export const generarCVDesdeCero = async (datos, language = 'es') => {
  return api.post('/api/cv/generar', { datos, language })
}

// Optimizar resumen profesional con IA
export const optimizarResumenIA = async (texto, idioma = 'es', contextoGerente = null) => {
  return api.post('/api/cv/optimizar-resumen', { texto, idioma, ...(contextoGerente ? { contextoGerente } : {}) })
}

// Optimizar descripción de experiencia laboral con IA (STAR + verbos de acción)
export const optimizarExpIA = async (texto, cargo, empresa, idioma = 'es', contextoGerente = null) => {
  return api.post('/api/cv/optimizar-experiencia', { texto, cargo, empresa, idioma, ...(contextoGerente ? { contextoGerente } : {}) })
}

// Path A — Fusionar resumen del CV original + Mi Oferta de Valor en un resumen único ATS-optimizado
export const fusionarResumenIA = async (cvResumen, ofertaValor, idioma = 'es') => {
  return api.post('/api/cv/fusionar-resumen', { cv_resumen: cvResumen, oferta_valor: ofertaValor, idioma })
}

// Descargar CV generado como PDF o Word
export const descargarCV = async (id, format = 'pdf') => {
  const res = await api.download(`/api/cv/download/${id}?format=${format}`)
  
  // Extraer nombre de archivo del header de backend
  const contentDisposition = res.headers.get('content-disposition')
  let filename = format === 'word' ? 'cv-optimizado.docx' : 'cv-optimizado.pdf'
  
  if (contentDisposition) {
    // RFC 6266: Priorizar filename* que soporta UTF-8
    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^"';\s]+)/i)
    if (filenameStarMatch && filenameStarMatch[1]) {
      filename = decodeURIComponent(filenameStarMatch[1])
    } else {
      // Fallback a filename estándar
      const filenameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/i)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].trim()
      }
    }
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
