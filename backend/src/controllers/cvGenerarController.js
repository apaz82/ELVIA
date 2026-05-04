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

    // Sistema base (inline — no depende del export de claudeService)
    const SISTEMA_CV = `Eres un experto en recursos humanos y redaccion de CV con 20 anos de experiencia
en el mercado laboral de LATAM y USA. Tus analisis son objetivos.

REGLAS ESTRICTAS:
- Nunca inventes informacion que no este en los datos provistos
- Solo optimiza y reformula lo que ya existe
- Usa verbos de accion en los logros (lidere, implemente, aumente, reduje, gestioné)
- Cuantifica logros solo si los datos ya estan presentes

ESTRUCTURA HARVARD OBLIGATORIA:
NOMBRE COMPLETO
Email | Telefono | Ciudad, Pais
───────────────────────────────────────────
RESUMEN PROFESIONAL
Parrafo de 3-4 lineas con propuesta de valor.
───────────────────────────────────────────
EXPERIENCIA PROFESIONAL
Empresa — Cargo | Ciudad, Pais | Mes Año – Mes Año
• Logro o responsabilidad con verbo de accion
───────────────────────────────────────────
EDUCACION
Institucion — Titulo | Año
───────────────────────────────────────────
HABILIDADES
• Habilidades clave
───────────────────────────────────────────
IDIOMAS
• Idioma - Nivel`

    // Llamar a DeepSeek V3 (compatible con OpenAI API — más económico que Haiku)
    const OpenAI = require('openai')
    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    })

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: SISTEMA_CV },
        {
          role: 'user',
          content: `Construye un CV profesional en formato Harvard a partir de los siguientes datos estructurados.

REGLAS CRITICAS:
- USA SOLO la informacion provista. NO inventes datos ni logros
- Aplica verbos de impacto y cuantifica logros cuando hay numeros en los datos
- Sigue el formato Harvard estrictamente
- Todo el CV DEBE estar en ${idiomaLabel}
- Usa bullets con "•" y lineas divisoras "──────────────────────────────────────────────"
- NO incluyas fecha de nacimiento, estado civil, ni foto

DATOS DEL CANDIDATO:
Nombre: ${nombreCompleto}
Cargo objetivo: ${datos.cargo_objetivo || 'No especificado'}
Contacto: ${contacto}
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
        }
      ]
    })

    const text = response.choices[0].message.content

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
      tipo: 'optimize',
      contenido: cvText,
      metadata: { datos_originales: datos, cambios, recomendaciones, language, subtipo: 'desde_cero' }
    }).select('id').single()

    if (errorSave) {
      // Fallback: intentar con service role (evita problemas de RLS)
      console.warn('cv_results insert con usuario falló, intentando con admin:', errorSave.message)
      const { data: adminSaved, error: adminErr } = await supabaseAdmin.from('cv_results').insert({
        user_id: userId,
        tipo: 'optimize',
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
