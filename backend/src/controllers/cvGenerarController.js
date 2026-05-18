// Generador de CV desde cero — formulario estructurado → Claude → Harvard
const { supabaseAdmin } = require('../lib/supabase')

const generarCV = async (req, res, next) => {
  try {
    const { datos, language = 'es' } = req.body
    const userId = req.user.id

    // Validar campos mínimos
    if (!datos || !datos.nombre || !datos.apellido) {
      return res.status(400).json({ error: 'Nombre y apellido son requeridos' })
    }

    // Al menos un campo de contenido (resumen O experiencia)
    const tieneResumen = datos.resumen && datos.resumen.trim().length > 20
    const tieneExp = Array.isArray(datos.experiencias) && datos.experiencias.some(e => e.empresa && e.cargo)
    if (!tieneResumen && !tieneExp) {
      return res.status(400).json({ error: 'Completa al menos el resumen o una experiencia laboral' })
    }

    // Construir texto estructurado para enviar a Claude
    const nombreCompleto = [datos.nombre, datos.nombre2, datos.apellido, datos.apellido2]
      .filter(Boolean).join(' ').trim()

    const contacto = [
      datos.email,
      datos.telefono ? `${datos.indicativo || '+1'} ${datos.telefono}` : null,
      datos.ciudad && datos.pais ? `${datos.ciudad}, ${datos.pais}` : (datos.ciudad || datos.pais || null)
    ].filter(Boolean).join(' • ')

    const experienciasFormato = (Array.isArray(datos.experiencias) && datos.experiencias.length > 0)
      ? datos.experiencias
          .filter(e => e.empresa || e.cargo)
          .map(e => `${e.empresa || 'Empresa'} | ${e.cargo || 'Cargo'} (${e.fecha_inicio || 'Inicio'} - ${e.fecha_fin || 'Presente'})\n${e.descripcion || ''}`)
          .join('\n\n')
      : 'No proporcionada'

    const educacionFormato = (Array.isArray(datos.educacion) && datos.educacion.length > 0)
      ? datos.educacion
          .filter(e => e.institucion || e.titulo)
          .map(e => `${e.institucion || 'Institución'} | ${e.titulo || 'Título'} (${e.anio || 'Año'})`)
          .join('\n')
      : 'No proporcionada'

    const habilidadesFormato = (Array.isArray(datos.habilidades) && datos.habilidades.length > 0)
      ? datos.habilidades.join(', ')
      : 'No proporcionadas'

    const idiomasFormato = (Array.isArray(datos.idiomas) && datos.idiomas.length > 0)
      ? datos.idiomas.map(i => `${i.idioma || 'Idioma'} - ${i.nivel || 'N/A'}`).join(', ')
      : 'No proporcionados'

    const idiomaLabel = language === 'en' ? 'ENGLISH' : language === 'pt' ? 'PORTUGUES' : 'ESPANOL'

    // Sistema base endurecido contra alucinación
    const SISTEMA_CV = `Eres un experto en recursos humanos y redaccion de CV con 20 anos de experiencia
en el mercado laboral de LATAM y USA. Tus analisis son objetivos.

╔══════════════════════════════════════════════════════════════════════════╗
║  REGLA #1 (ABSOLUTA): CERO INVENCION DE DATOS                            ║
║  Construye SOLO con lo que el usuario llenó en el formulario.            ║
╚══════════════════════════════════════════════════════════════════════════╝

PROHIBIDO ABSOLUTAMENTE inventar, deducir o "rellenar":
  ✗ Emails, teléfonos o URLs que no están en los datos del candidato
  ✗ Fechas, métricas, cifras o años que no aparezcan en el input
  ✗ Empresas, cargos, instituciones o títulos no listados
  ✗ Certificaciones, premios o idiomas no declarados
  ✗ Ciudades, países o ubicaciones no mencionadas
  ✗ Logros con números (%, $, equipos, personas) si no estaban en la descripción original

REGLA DE OMISION: si un campo viene como "No proporcionado", "No especificado" o vacio,
OMITELO por completo del CV. No uses placeholders.

LO QUE SI PUEDES HACER:
  ✓ Reescribir frases para mas claridad y profesionalismo
  ✓ Cambiar voz pasiva a activa
  ✓ Usar verbos de accion: lidere, implemente, gestione, optimice, diseñe, coordine
  ✓ Agrupar habilidades sueltas en categorias logicas

ESTRUCTURA HARVARD OBLIGATORIA:
NOMBRE COMPLETO
[Email solo si fue provisto] | [Telefono solo si fue provisto] | [Ciudad, Pais solo si fueron provistos]
───────────────────────────────────────────
RESUMEN PROFESIONAL
Parrafo de 3-4 lineas con propuesta de valor (basado SOLO en el resumen y experiencias provistas).
───────────────────────────────────────────
EXPERIENCIA PROFESIONAL
Empresa — Cargo | Ciudad, Pais | Mes Año – Mes Año
• Logro o responsabilidad con verbo de accion (sin inventar metricas)
───────────────────────────────────────────
EDUCACION
Institucion — Titulo | Año
───────────────────────────────────────────
HABILIDADES
• Habilidades clave
───────────────────────────────────────────
IDIOMAS
• Idioma - Nivel`

    // Migrado de DeepSeek a Claude Haiku (mismo modelo que extractProfile)
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('generarCV: ANTHROPIC_API_KEY no configurada en Railway')
      return res.status(500).json({ error: 'Servicio de IA no configurado. Contacta soporte.' })
    }
    const Anthropic = require('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const userPrompt = `Construye un CV profesional en formato Harvard a partir de los siguientes datos estructurados.

REGLAS CRITICAS (no negociables):
- USA SOLO la informacion provista. NO inventes datos ni logros
- Si un campo dice "No proporcionado" o "No especificado", OMITELO del CV
- NO inventes emails, telefonos, URLs ni metricas
- Sigue el formato Harvard estrictamente
- Todo el CV DEBE estar en ${idiomaLabel}
- Usa bullets con "•" y lineas divisoras "──────────────────────────────────────────────"
- NO incluyas fecha de nacimiento, estado civil, ni foto

DATOS DEL CANDIDATO:
Nombre: ${nombreCompleto}
Cargo objetivo: ${datos.cargo_objetivo || 'No especificado'}
Contacto: ${contacto || 'No proporcionado'}
Resumen profesional: ${datos.resumen || 'No proporcionado'}

EXPERIENCIA LABORAL:
${experienciasFormato}

EDUCACION:
${educacionFormato}

HABILIDADES:
${habilidadesFormato}

IDIOMAS:
${idiomasFormato}

Responde EXACTAMENTE con estos delimitadores XML (sin texto fuera de ellos):
<CV>[CV completo optimizado en formato Harvard]</CV>
<CAMBIOS>- mejora aplicada 1\n- mejora 2</CAMBIOS>
<RECOMENDACIONES>- recomendacion 1\n- recomendacion 2</RECOMENDACIONES>`

    const callClaude = async () => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      temperature: 0.2,
      system: SISTEMA_CV,
      messages: [{ role: 'user', content: userPrompt }],
    })

    let response = await callClaude()
    if (!response.content?.[0]?.text || !/<CV>[\s\S]*<\/CV>/.test(response.content[0].text)) {
      console.warn('[generarCV] Respuesta sin delimitadores <CV>. Reintentando una vez...')
      response = await callClaude()
    }
    const text = response.content[0].text

    // Parsear respuesta con delimitadores XML
    const cvMatch  = text.match(/<CV>([\s\S]*?)<\/CV>/)
    const cambiosMatch = text.match(/<CAMBIOS>([\s\S]*?)<\/CAMBIOS>/)
    const recMatch = text.match(/<RECOMENDACIONES>([\s\S]*?)<\/RECOMENDACIONES>/)

    const cvText = cvMatch ? cvMatch[1].trim() : text.trim()
    const cambios = cambiosMatch
      ? cambiosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
      : []
    const recomendaciones = recMatch
      ? recMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
      : []

    if (!cvText) {
      return res.status(500).json({ error: 'No se pudo generar la CV. Intenta de nuevo.' })
    }

    // Guardar en cv_results — no bloquea la respuesta si falla
    const supabase = req.supabase
    let savedId = null
    const { data: savedCV, error: errorSave } = await supabase.from('cv_results').insert({
      user_id: userId,
      tipo: 'desde_cero',
      contenido: cvText,
      metadata: { datos_originales: datos, cambios, recomendaciones, language, subtipo: 'desde_cero' }
    }).select('id').single()

    if (errorSave) {
      // Fallback: intentar con service role (evita problemas de RLS)
      console.warn('cv_results insert con usuario falló, intentando con admin:', errorSave.message)
      const { data: adminSaved, error: adminErr } = await supabaseAdmin.from('cv_results').insert({
        user_id: userId,
        tipo: 'desde_cero',
        contenido: cvText,
        metadata: { datos_originales: datos, cambios, recomendaciones, language, subtipo: 'desde_cero' }
      }).select('id').single()
      if (adminErr) {
        console.error('Error guardando cv_results (admin fallback):', adminErr.message)
        // No bloquear — la CV ya fue generada, devolver igual
      } else {
        savedId = adminSaved?.id
      }
    } else {
      savedId = savedCV?.id
    }

    // Incrementar contadores
    const { data: profileData } = await supabaseAdmin.from('profiles')
      .select('cv_generar_count, usage_count, plan')
      .eq('id', userId)
      .single()

    await supabaseAdmin.from('profiles').update({
      cv_generar_count: (profileData?.cv_generar_count || 0) + 1,
      usage_count:      (profileData?.usage_count || 0) + 1
    }).eq('id', userId)

    const isPaidPlan = profileData && ['mensual', 'trimestral'].includes(profileData.plan)

    res.json({
      id: savedId,
      optimizedCV: cvText,
      changes: cambios,
      recommendations: recomendaciones,
      language,
      usageCount: (profileData?.usage_count || 0) + 1,
      cv_generar_count: (profileData?.cv_generar_count || 0) + 1,
      watermark: !isPaidPlan
    })
  } catch (err) {
    console.error('Error en generarCV:', err.message, err.stack)
    res.status(500).json({
      error: 'Error al generar la CV. Intenta de nuevo.'
    })
  }
}

module.exports = { generarCV }
