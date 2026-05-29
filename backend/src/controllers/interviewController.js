const { generarPreguntasEntrevista, evaluarEntrevista } = require('../services/deepseekService')

// POST /api/interview/preguntas
const generarPreguntas = async (req, res, next) => {
  try {
    const { empresa, cargo, entrevistador, descripcion, numPreguntas, cv_base } = req.body
    if (!cargo) return res.status(400).json({ error: 'El campo cargo es requerido' })

    const preguntas = await generarPreguntasEntrevista({
      empresa: empresa || 'la empresa',
      cargo,
      entrevistador: entrevistador || 'HR',
      descripcion: descripcion || '',
      numPreguntas: Math.min(Math.max(parseInt(numPreguntas) || 10, 5), 20),
      cv_base: cv_base || '',
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

    // Guardar reporte en cv_results con TTL soft de 14 días
    // Solo para evaluaciones finales (no feedback por pregunta)
    if (!feedbackPorPregunta && req.user?.id) {
      try {
        const db = req.supabase
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

        await db.from('cv_results').insert({
          user_id: req.user.id,
          tipo: 'optimize',
          contenido: JSON.stringify({ resultado, preguntas, respuestas }),
          metadata: {
            subtipo: 'entrevista_simulada',
            cargo,
            empresa: empresa || '',
            entrevistador: entrevistador || 'HR',
            puntuacion: resultado.puntuacion,
            resumen: resultado.resumen,
            expires_at: expiresAt,
            filename: `Entrevista ${cargo}${empresa ? ' — ' + empresa : ''} ${new Date().toISOString().slice(0, 10)}`,
          },
        })
      } catch (saveErr) {
        // No bloquear la respuesta si falla el guardado
        console.error('[interviewController] Error guardando reporte:', saveErr)
      }
    }

    return res.json(resultado)
  } catch (err) {
    next(err)
  }
}

module.exports = { generarPreguntas, evaluar }
