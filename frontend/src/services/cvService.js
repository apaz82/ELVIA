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
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = format === 'word' ? 'cv-optimizado.docx' : 'cv-optimizado.pdf'
  link.click()
  URL.revokeObjectURL(url)
}
