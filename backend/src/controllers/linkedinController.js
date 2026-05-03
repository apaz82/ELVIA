const { analizarLinkedin, extraerDatosLinkedin } = require('../services/claudeService')
const { extraerTextoPDF } = require('../utils/pdfParser')

// POST /api/linkedin/analizar
const analizarPerfil = async (req, res, next) => {
  try {
    const { titular, extracto, experiencia, habilidades, educacion, contextoLaboral } = req.body

    const camposRecibidos = [titular, extracto, experiencia, habilidades, educacion]
      .filter(v => v && v.trim().length > 0)

    if (camposRecibidos.length === 0) {
      return res.status(400).json({ error: 'Debes completar al menos una sección del perfil' })
    }

    const resultado = await analizarLinkedin({ titular, extracto, experiencia, habilidades, educacion, contextoLaboral })

    // Persistir análisis para historial (best-effort — no bloquea la respuesta si falla)
    if (req.supabase && req.user?.id) {
      const camposUsados = Object.entries({ titular, extracto, experiencia, habilidades, educacion })
        .filter(([, v]) => v && v.trim().length > 0)
        .map(([k]) => k)
      req.supabase.from('linkedin_analyses').insert({
        user_id: req.user.id,
        puntaje_global: resultado.puntaje_global,
        resumen_global: resultado.resumen_global,
        top_acciones: resultado.top_acciones ?? [],
        secciones: resultado.secciones ?? {},
        campos_analizados: camposUsados,
      }).then(({ error }) => { if (error) console.error('[linkedin/analizar] save error:', error.message) })
    }

    return res.json(resultado)
  } catch (err) {
    next(err)
  }
}

// GET /api/linkedin/historial
const getHistorial = async (req, res, next) => {
  try {
    const db = req.supabase
    const { data, error } = await db
      .from('linkedin_analyses')
      .select('id, puntaje_global, resumen_global, top_acciones, secciones, campos_analizados, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return res.json(data || [])
  } catch (err) {
    next(err)
  }
}

// POST /api/linkedin/extraer-pdf
const extraerPerfilPDF = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' })
    }

    // 1. Extraer texto plano del PDF
    const rawText = await extraerTextoPDF(req.file.buffer)

    // 2. Estructurar con IA
    const data = await extraerDatosLinkedin(rawText)

    return res.json(data)
  } catch (err) {
    next(err)
  }
}

// POST /api/linkedin/extraer-texto
const extraerPerfilTexto = async (req, res, next) => {
  try {
    const { blob } = req.body
    if (!blob || blob.trim().length < 50) {
      return res.status(400).json({ error: 'El texto proporcionado es demasiado corto' })
    }

    // Estructurar con IA
    const data = await extraerDatosLinkedin(blob)

    return res.json(data)
  } catch (err) {
    next(err)
  }
}

module.exports = { analizarPerfil, extraerPerfilPDF, extraerPerfilTexto, getHistorial }
