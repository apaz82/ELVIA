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
