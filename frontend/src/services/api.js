// Cliente HTTP base — adjunta el JWT de Supabase automáticamente
import { supabase } from './authService'

const BASE_URL = import.meta.env.VITE_API_URL

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

export const api = {
  async get(path) {
    const headers = await getHeaders()
    const res = await fetch(`${BASE_URL}${path}`, { headers })
    return res.json()
  },

  async post(path, body) {
    const headers = await getHeaders()
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      let msg = `Error ${res.status}`
      try { const body = await res.json(); msg = body.mensaje || body.error || msg } catch {}
      throw new Error(msg)
    }
    return res.json()
  },

  // Para multipart/form-data (subida de archivos) — sin Content-Type para que el browser lo genere
  async postForm(path, formData) {
    const { data: { session } } = await supabase.auth.getSession()
    const headers = {}
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    })
    if (!res.ok) {
      let msg = `Error ${res.status}`
      try { const body = await res.json(); msg = body.mensaje || body.error || msg } catch {}
      throw new Error(msg)
    }
    return res.json()
  },

  // Para descargar archivos binarios (PDF, Word)
  async download(path) {
    const { data: { session } } = await supabase.auth.getSession()
    const headers = {}
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    const res = await fetch(`${BASE_URL}${path}`, { headers })
    return res
  },
}
