const { analizarLinkedin, extraerDatosLinkedin } = require('../services/deepseekService')
const { extraerTextoPDF } = require('../utils/pdfParser')

// Extrae narrativa del CV optimizado guardado en cv_results.contenido (JSON serializado).
// Tolerante a distintas formas históricas: string, objeto con `cargo_objetivo`/`titular`/`headline`, etc.
const extraerTitularDeCV = (cvRow) => {
  if (!cvRow?.contenido) return ''
  try {
    const c = typeof cvRow.contenido === 'string' ? JSON.parse(cvRow.contenido) : cvRow.contenido
    return c?.cargo_objetivo || c?.titular || c?.headline || ''
  } catch { return '' }
}
const extraerResumenDeCV = (cvRow) => {
  if (!cvRow?.contenido) return ''
  try {
    const c = typeof cvRow.contenido === 'string' ? JSON.parse(cvRow.contenido) : cvRow.contenido
    return c?.resumen || c?.extracto || c?.about || ''
  } catch { return '' }
}

// Límite mensual de análisis IA por usuario.
// Contamos en la tabla linkedin_analyses (se inserta automáticamente en cada análisis).
// Esto cuenta consumo de tokens DeepSeek, no descargas de PDF.
const LIMITE_ANALISIS_MES = 10

const contarAnalisisMes = async (supabase, userId) => {
  const inicio = new Date()
  inicio.setDate(1)
  inicio.setHours(0, 0, 0, 0)
  const { count, error } = await supabase
    .from('linkedin_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', inicio.toISOString())
  if (error) {
    console.warn('[linkedin/uso-mes] no se pudo contar análisis:', error.message)
    return 0
  }
  return count || 0
}

// Primer día del próximo mes en ISO — usado para mensajes de "tu contador se reinicia el ..."
const fechaResetMes = () => {
  const ahora = new Date()
  return new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1).toISOString()
}

// GET /api/linkedin/uso-mes
// Devuelve cuántos análisis lleva el usuario este mes y cuántos le quedan.
const getUsoMes = async (req, res, next) => {
  try {
    if (!req.supabase || !req.user?.id) {
      return res.json({ usados: 0, restantes: LIMITE_ANALISIS_MES, limite: LIMITE_ANALISIS_MES, fecha_reset: fechaResetMes() })
    }
    const usados = await contarAnalisisMes(req.supabase, req.user.id)
    return res.json({
      usados,
      restantes: Math.max(0, LIMITE_ANALISIS_MES - usados),
      limite: LIMITE_ANALISIS_MES,
      fecha_reset: fechaResetMes(),
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/linkedin/analizar
const analizarPerfil = async (req, res, next) => {
  try {
    const { titular, extracto, experiencia, habilidades, idiomas, educacion, contextoLaboral } = req.body

    const camposRecibidos = [titular, extracto, experiencia, habilidades, idiomas, educacion]
      .filter(v => v && v.trim().length > 0)

    if (camposRecibidos.length === 0) {
      return res.status(400).json({ error: 'Debes completar al menos una sección del perfil' })
    }

    // Verificar límite mensual ANTES de gastar tokens en DeepSeek.
    if (req.supabase && req.user?.id) {
      const usados = await contarAnalisisMes(req.supabase, req.user.id)
      if (usados >= LIMITE_ANALISIS_MES) {
        return res.status(429).json({
          error: `Ya usaste tus ${LIMITE_ANALISIS_MES} análisis de IA este mes. El contador se reinicia el 1º del próximo mes.`,
          codigo: 'limite_mensual_alcanzado',
          usados,
          limite: LIMITE_ANALISIS_MES,
          fecha_reset: fechaResetMes(),
        })
      }
    }

    // Enriquecimiento opcional con datos del Gerente de Proyecto y CV optimizado.
    // Si la BD falla o no hay datos, el análisis sigue funcionando sin enriquecer.
    let gerenteContext = null
    let cvOptimo = null
    if (req.supabase && req.user?.id) {
      try {
        const { data: prof } = await req.supabase
          .from('profiles')
          .select('job_search_profile')
          .eq('id', req.user.id)
          .maybeSingle()
        const jp = prof?.job_search_profile || {}
        const auto = jp.autoconocimiento || {}
        const oferta = jp.oferta || {}
        gerenteContext = {
          oferta_valor: oferta.oferta_valor || '',
          hard_skills: Array.isArray(auto.hard_skills) ? auto.hard_skills : [],
          // BD mantiene "soft_skills" aunque la UI muestra "Power Skills" (decisión documentada).
          soft_skills: Array.isArray(auto.soft_skills) ? auto.soft_skills : [],
        }

        const { data: cvRows } = await req.supabase
          .from('cv_results')
          .select('contenido, metadata, created_at')
          .eq('user_id', req.user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        const cvRow = (cvRows || []).find(r => {
          let meta = r.metadata
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta) } catch { meta = null }
          }
          const subtipo = meta?.subtipo
          return subtipo !== 'infografia_proyecto' && subtipo !== 'linkedin_analysis'
        })
        if (cvRow) {
          cvOptimo = {
            titular: extraerTitularDeCV(cvRow),
            extracto: extraerResumenDeCV(cvRow),
          }
        }
      } catch (e) {
        console.warn('[linkedin/analizar] enriquecimiento opcional falló, continuando sin contexto:', e.message)
      }
    }

    const resultado = await analizarLinkedin({
      titular, extracto, experiencia, habilidades, idiomas, educacion,
      contextoLaboral,
      gerenteContext,
      cvOptimo,
    })

    // Persistir análisis para historial (best-effort — no bloquea la respuesta si falla)
    if (req.supabase && req.user?.id) {
      const camposUsados = Object.entries({ titular, extracto, experiencia, habilidades, idiomas, educacion })
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

    // 2. Validar identidad: el PDF debe pertenecer al usuario autenticado.
    // Comparamos primer nombre + primer apellido (normalizados sin acentos) contra el texto del PDF.
    // Patrón replicado de cvController.optimize — evita que se analicen perfiles de terceros.
    if (req.supabase && req.user?.id) {
      const { data: profile } = await req.supabase
        .from('profiles')
        .select('nombre1, apellido1')
        .eq('id', req.user.id)
        .single()

      if (profile) {
        const norm = (s) => (s || '')
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .toLowerCase()
          .trim()
        const txt = norm(rawText)
        const primerNombre   = norm(profile.nombre1).split(' ')[0]
        const primerApellido = norm(profile.apellido1).split(' ')[0]

        const faltaNombre   = primerNombre   && !txt.includes(primerNombre)
        const faltaApellido = primerApellido && !txt.includes(primerApellido)
        if (faltaNombre || faltaApellido) {
          return res.status(400).json({
            error: 'Este perfil de LinkedIn no coincide con tu información de registro. Asegúrate de descargar TU propio PDF: entra a tu perfil principal, haz clic en "Recursos" y selecciona "Guardar en PDF".'
          })
        }
      }
    }

    // 3. Estructurar con IA
    const data = await extraerDatosLinkedin(rawText)

    return res.json(data)
  } catch (err) {
    next(err)
  }
}

// GET /api/linkedin/ultimo-analisis
// Devuelve el análisis LinkedIn más reciente del usuario (para precargar el formulario).
const getUltimoAnalisis = async (req, res, next) => {
  try {
    if (!req.supabase || !req.user?.id) return res.json({ analisis: null })
    const { data, error } = await req.supabase
      .from('cv_results')
      .select('id, contenido, metadata, created_at')
      .eq('user_id', req.user.id)
      .filter('metadata->>subtipo', 'eq', 'linkedin_analysis')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return res.json({ analisis: null })
    let payload = {}
    try { payload = typeof data.contenido === 'string' ? JSON.parse(data.contenido) : (data.contenido || {}) } catch { /* vacío */ }
    return res.json({
      id: data.id,
      created_at: data.created_at,
      analisis:  payload.analisis  || null,
      editables: payload.editables || null,
      original:  payload.original  || null,
    })
  } catch (err) { next(err) }
}

// POST /api/linkedin/guardar-reporte
// UPSERT: elimina el análisis anterior y guarda el nuevo — un solo registro por usuario.
const guardarReporte = async (req, res, next) => {
  try {
    if (!req.supabase || !req.user?.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }
    const { analisis, editables, original, filename } = req.body || {}
    if (!analisis || typeof analisis !== 'object') {
      return res.status(400).json({ error: 'Falta el análisis a guardar' })
    }

    // Borrar análisis anterior (best-effort)
    await req.supabase
      .from('cv_results')
      .delete()
      .eq('user_id', req.user.id)
      .filter('metadata->>subtipo', 'eq', 'linkedin_analysis')

    const payload = {
      analisis,
      editables: editables || null,
      original:  original  || null,
      version:   'linkedin_pro_v2',
    }

    const { data, error } = await req.supabase
      .from('cv_results')
      .insert({
        user_id: req.user.id,
        tipo: 'optimize',
        contenido: JSON.stringify(payload),
        metadata: {
          filename: filename || `Analisis LinkedIn ${new Date().toISOString().slice(0,10)}`,
          frontend_pdf: true,
          subtipo: 'linkedin_analysis',
          puntaje_global: analisis.puntaje_global ?? null,
        },
      })
      .select('id')
      .single()

    if (error) {
      console.error('[linkedin/guardar-reporte] insert error:', error.message)
      return res.status(500).json({ error: 'No se pudo guardar el reporte' })
    }
    return res.json({ id: data?.id, ok: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { analizarPerfil, extraerPerfilPDF, getHistorial, guardarReporte, getUsoMes, getUltimoAnalisis }
