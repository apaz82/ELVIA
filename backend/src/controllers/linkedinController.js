const { analizarLinkedin } = require('../services/claudeService')

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

module.exports = { analizarPerfil }
