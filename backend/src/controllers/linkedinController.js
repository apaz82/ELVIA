const { analizarLinkedin, extraerDatosLinkedin } = require('../services/claudeService')
const { extraerTextoPDF } = require('../utils/pdfParser')

// POST /api/linkedin/analizar
const analizarPerfil = async (req, res, next) => {
  try {
    const { titular, extracto, experiencia, habilidades, educacion } = req.body

    const camposRecibidos = [titular, extracto, experiencia, habilidades, educacion]
      .filter(v => v && v.trim().length > 0)

    if (camposRecibidos.length === 0) {
      return res.status(400).json({ error: 'Debes completar al menos una sección del perfil' })
    }

    const resultado = await analizarLinkedin({ titular, extracto, experiencia, habilidades, educacion })
    return res.json(resultado)
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

module.exports = { analizarPerfil, extraerPerfilPDF, extraerPerfilTexto }
