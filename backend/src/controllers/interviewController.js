const { generarPreguntasEntrevista, evaluarEntrevista } = require('../services/claudeService')

// POST /api/interview/preguntas
const generarPreguntas = async (req, res, next) => {
  try {
    const { empresa, cargo, entrevistador, descripcion, numPreguntas } = req.body
    if (!cargo) return res.status(400).json({ error: 'El campo cargo es requerido' })

    const preguntas = await generarPreguntasEntrevista({
      empresa: empresa || 'la empresa',
      cargo,
      entrevistador: entrevistador || 'HR',
      descripcion: descripcion || '',
      numPreguntas: Math.min(Math.max(parseInt(numPreguntas) || 10, 5), 20),
    })

    return res.json({ preguntas })
  } catch (err) {
    next(err)
  }
}

// POST /api/interview/evaluar
const evaluar = async (req, res, next) => {
  try {
    const { empresa, cargo, entrevistador, preguntas, respuestas, feedbackPorPregunta } = req.body
    if (!preguntas?.length || !respuestas?.length) {
      return res.status(400).json({ error: 'Faltan preguntas o respuestas' })
    }

    const resultado = await evaluarEntrevista({
      empresa: empresa || 'la empresa',
      cargo,
      entrevistador: entrevistador || 'HR',
      preguntas,
      respuestas,
      feedbackPorPregunta: !!feedbackPorPregunta,
    })

    return res.json(resultado)
  } catch (err) {
    next(err)
  }
}

module.exports = { generarPreguntas, evaluar }
