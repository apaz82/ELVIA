const Anthropic = require('@anthropic-ai/sdk');

// Inicialización segura para evitar crashes en producción si falta la llave
let client;
try {
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'fake-key-to-prevent-crash' });
} catch (error) {
  console.error('[Anthropic] CRITICAL: Error al inicializar cliente. ¿Falta ANTHROPIC_API_KEY?', error.message);
}

// ── Estrategia de modelos ─────────────────────────────────────
// Sonnet 4.6  → tasks que requieren escritura creativa de alta calidad:
//               optimizeCV, matchCVtoJob, analizarLinkedin, evaluarEntrevista
// Haiku 4.5   → tasks de extracción/clasificación/respuestas cortas:
//               generateChatResponse, generarPreguntasEntrevista, extractProfile
const MODELO        = 'claude-sonnet-4-6';
const MODELO_RAPIDO = 'claude-haiku-4-5-20251001';

// --- Instrucciones del sistema compartidas ---
const SISTEMA_BASE = `Eres un experto en recursos humanos y redacción de CV con 20 años de experiencia
en el mercado laboral de LATAM y USA. Tus análisis son objetivos, sin sesgos por edad, género u origen.

REGLAS ESTRICTAS:
- Nunca inventes información que no esté en el CV original
- Solo optimiza y reformula lo que ya existe
- Usa verbos de acción en los logros (lideré, implementé, aumenté, reduje, gestioné)
- Cuantifica logros solo si los datos ya están presentes en el CV

ESTRUCTURA HARVARD OBLIGATORIA (sigue este orden y formato exacto):

NOMBRE COMPLETO
Email | Teléfono | Ciudad, País | LinkedIn (si existe)
──────────────────────────────────────────────────────
RESUMEN PROFESIONAL
Párrafo de 3-4 líneas con propuesta de valor.
──────────────────────────────────────────────────────
EXPERIENCIA PROFESIONAL
Empresa — Cargo | Ciudad, País | Mes Año – Mes Año
• Logro o responsabilidad con verbo de acción
• Logro o responsabilidad con verbo de acción
──────────────────────────────────────────────────────
EDUCACIÓN
Institución — Título | Ciudad, País | Año
• Detalle relevante si aplica
──────────────────────────────────────────────────────
HABILIDADES
• Categoría: habilidad 1, habilidad 2, habilidad 3

REGLAS DE FORMATO:
- El nombre va en la primera línea, sin etiquetas
- Los datos de contacto van en la segunda línea, separados por |
- Los encabezados de sección van en MAYÚSCULAS
- Usa ── como divisor entre secciones (al menos 30 guiones)
- NO uses secciones como "Datos Personales", "Personal Details" o "Información Personal" — esa info va en el encabezado
- NO incluyas fecha de nacimiento, estado civil, ni nacionalidad (no es estándar Harvard)
- Los bullets van con • seguido de espacio`;

// --- Etiquetas de idioma para los prompts ---
const ETIQUETA_IDIOMA = {
  es: 'español',
  en: 'English',
  pt: 'português',
};

// --- Parser de respuestas con delimitadores XML ---
// Más robusto que JSON para textos largos con saltos de línea y caracteres especiales
const parsearRespuestaOptimize = (text) => {
  const cvMatch = text.match(/<CV>([\s\S]*?)<\/CV>/);
  const cambiosMatch = text.match(/<CAMBIOS>([\s\S]*?)<\/CAMBIOS>/);
  const recMatch = text.match(/<RECOMENDACIONES>([\s\S]*?)<\/RECOMENDACIONES>/);

  return {
    optimizedCV: cvMatch ? cvMatch[1].trim() : text.trim(),
    changes: cambiosMatch
      ? cambiosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
      : [],
    recommendations: recMatch
      ? recMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
      : [],
  };
};

const parsearRespuestaMatch = (text) => {
  const cvMatch = text.match(/<CV>([\s\S]*?)<\/CV>/);
  const scoreMatch = text.match(/<SCORE>([\s\S]*?)<\/SCORE>/);
  const analisisMatch = text.match(/<ANALISIS>([\s\S]*?)<\/ANALISIS>/);
  const cambiosMatch = text.match(/<CAMBIOS>([\s\S]*?)<\/CAMBIOS>/);
  const jobMatch = text.match(/<VACANTE>([\s\S]*?)<\/VACANTE>/);

  // Parsear análisis en secciones
  let analisis = null;
  if (analisisMatch) {
    const raw = analisisMatch[1].trim();
    const fortalezasMatch = raw.match(/FORTALEZAS:\s*([\s\S]*?)(?=BRECHAS:|$)/i);
    const brechasMatch    = raw.match(/BRECHAS:\s*([\s\S]*?)(?=CONCLUSION:|$)/i);
    const conclusionMatch = raw.match(/CONCLUSION:\s*([\s\S]*?)$/i);
    analisis = {
      fortalezas: fortalezasMatch
        ? fortalezasMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
        : [],
      brechas: brechasMatch
        ? brechasMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
        : [],
      conclusion: conclusionMatch ? conclusionMatch[1].trim() : '',
    };
  }

  let jobData = { title: '', location: '', country: '' };
  if (jobMatch) {
    const jobText = jobMatch[1].trim();
    const titleMatch    = jobText.match(/titulo:\s*(.+)/i);
    const locationMatch = jobText.match(/ubicacion:\s*(.+)/i);
    const countryMatch  = jobText.match(/pais:\s*(.+)/i);
    jobData = {
      title:    titleMatch    ? titleMatch[1].trim()    : '',
      location: locationMatch ? locationMatch[1].trim() : '',
      country:  countryMatch  ? countryMatch[1].trim()  : '',
    };
  }

  return {
    tailoredCV: cvMatch ? cvMatch[1].trim() : text.trim(),
    matchScore: scoreMatch ? parseInt(scoreMatch[1].trim(), 10) || 0 : 0,
    analisis,
    changes: cambiosMatch
      ? cambiosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
      : [],
    jobData,
  };
};

/**
 * Optimiza un CV al formato Harvard
 * @param {string} cvText   - Texto extraído del CV original
 * @param {string} language - Código de idioma: 'es' | 'en' | 'pt'
 */
const optimizeCV = async (cvText, language = 'es') => {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';

  const prompt = `Analiza el siguiente CV y optimízalo al formato Harvard.
IMPORTANTE: El CV, los cambios realizados y las recomendaciones deben estar TODOS en ${idioma}.

CV ORIGINAL:
${cvText}

Responde usando exactamente estos delimitadores (sin texto fuera de ellos):

<CV>
[CV completo optimizado en formato Harvard, en ${idioma}]
</CV>
<CAMBIOS>
- cambio realizado 1 (en ${idioma})
- cambio realizado 2 (en ${idioma})
</CAMBIOS>
<RECOMENDACIONES>
- recomendación adicional 1 (en ${idioma})
- recomendación adicional 2 (en ${idioma})
</RECOMENDACIONES>`;

  const t0 = Date.now();
  const response = await client.messages.create({
    model: MODELO,
    max_tokens: 4096,
    // cache_control en el system prompt: Anthropic reutiliza el prompt cacheado
    // durante 5 min — ahorra ~90% del costo de tokens de entrada en requests repetidos.
    // Requiere ≥1024 tokens para activarse; por debajo de eso no se aplica pero tampoco rompe.
    system: [{ type: 'text', text: SISTEMA_BASE, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  });
  console.log(`[optimizeCV] Claude tardó ${((Date.now() - t0) / 1000).toFixed(1)}s | cache: ${JSON.stringify(response.usage?.cache_read_input_tokens ?? 0)} tokens leídos de caché`);

  return parsearRespuestaOptimize(response.content[0].text);
};

/**
 * Adapta un CV a una vacante específica y calcula el % de match
 * @param {string} cvText   - Texto del CV
 * @param {string} jobText  - Descripción de la vacante
 * @param {string} language - Idioma de salida
 */
const matchCVtoJob = async (cvText, jobText, language = 'es') => {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';

  const prompt = `Analiza el CV y la vacante. Adapta el CV específicamente para esta vacante.
IMPORTANTE: El CV y los cambios realizados deben estar TODOS en ${idioma}.

CV ORIGINAL:
${cvText}

DESCRIPCIÓN DE LA VACANTE:
${jobText}

Responde usando exactamente estos delimitadores (sin texto fuera de ellos):

<CV>
[CV completo adaptado para esta vacante, en ${idioma}]
</CV>
<SCORE>
[número del 0 al 100 que representa el % de compatibilidad]
</SCORE>
<ANALISIS>
FORTALEZAS:
- [punto fuerte del candidato que coincide con la vacante]
- [otro punto fuerte]
BRECHAS:
- [habla directamente al candidato en segunda persona, suaviza el lenguaje: en vez de "no tiene experiencia" di "no cuentas explícitamente con experiencia en X", en vez de "el candidato carece de" di "aún no evidencias"]
- [otra brecha en segunda persona, sin juicios duros]
CONCLUSION:
[2-3 oraciones en segunda persona dirigidas directamente al candidato: explica qué sube el score, qué lo baja, y qué podrías mejorar para aumentar tu compatibilidad]
</ANALISIS>
<CAMBIOS>
- ajuste realizado 1 (en ${idioma})
- ajuste realizado 2 (en ${idioma})
</CAMBIOS>
<VACANTE>
titulo: [cargo detectado]
ubicacion: [ciudad o región]
pais: [país]
</VACANTE>`;

  const t0 = Date.now();
  const response = await client.messages.create({
    model: MODELO,
    max_tokens: 4096,
    temperature: 0,
    system: [{ type: 'text', text: SISTEMA_BASE, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  });
  console.log(`[matchCVtoJob] Claude tardó ${((Date.now() - t0) / 1000).toFixed(1)}s | cache: ${JSON.stringify(response.usage?.cache_read_input_tokens ?? 0)} tokens leídos de caché`);

  return parsearRespuestaMatch(response.content[0].text);
};

/**
 * Genera respuesta conversacional para el AI Copilot
 */
const generateChatResponse = async (message, history, context) => {
  const systemPrompt = `Eres "OPTIMA", la asistente y mentora experta en crecimiento profesional y reclutamiento para la plataforma "OPTIMA-CV".

Tu personalidad es empoderadora, profesional y cercana. Tu objetivo es guiar a los usuarios en su carrera.

REGLAS DE INTERACCIÓN:
1. Responde siempre con entusiasmo pero manteniendo el profesionalismo de una experta en RRHH.
2. Si un usuario usa un botón de acción rápida:
   - "Preguntas sobre la app": Explica brevemente que pueden optimizar CVs en la sección "CV Optimizer", comparar vacantes en "CV vs Vacante" o buscar empleos en "Buscar Vacantes". Menciona que pueden ver su historial en "Mis CVs".
   - "Sobre procesos de selección": Da consejos clave sobre cómo prepararse para una entrevista, qué buscan los reclutadores en LinkedIn o cómo manejar negociaciones salariales.
   - "Quieres una frase motivadora": Genera una frase corta e inspiradora relacionada con el éxito profesional o la perseverancia.
3. Mantén el enfoque: No hables de temas ajenos a la carrera profesional o el uso de la app.
4. Usa formato Markdown (negritas, listas) para que tus respuestas sean fáciles de leer.

Contexto actual: ${context || 'Navegando en la plataforma'}
`;

  const formattedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  formattedHistory.push({ role: 'user', content: message });

  const response = await client.messages.create({
    model: MODELO_RAPIDO,
    max_tokens: 600,
    system: systemPrompt,
    messages: formattedHistory,
  });

  return response.content[0].text;
};

/**
 * Genera preguntas de entrevista mixtas (técnicas + soft skills)
 */
const generarPreguntasEntrevista = async ({ empresa, cargo, entrevistador, descripcion, numPreguntas }) => {
  const tecnicas = Math.ceil(numPreguntas * 0.5)
  const soft     = numPreguntas - tecnicas

  const prompt = `Eres un experto en procesos de selección en LATAM. Genera exactamente ${numPreguntas} preguntas de entrevista para el siguiente perfil:

Empresa: ${empresa}
Cargo: ${cargo}
Tipo de entrevistador: ${entrevistador}
Descripción de la vacante: ${descripcion || 'No proporcionada'}

DISTRIBUCIÓN OBLIGATORIA:
- ${tecnicas} preguntas técnicas (conocimientos, experiencia, habilidades del cargo)
- ${soft} preguntas de soft skills (liderazgo, trabajo en equipo, manejo de conflictos, etc.)

REGLAS:
- Las preguntas deben ser abiertas (no sí/no)
- Adapta la dificultad al nivel del cargo
- Si el entrevistador es Headhunter, enfócate más en logros y propuesta de valor
- Si es HR, incluye preguntas de cultura y motivación
- Si es Hiring Manager, enfócate en habilidades técnicas y casos prácticos
- Las preguntas deben ser en español

Responde ÚNICAMENTE con un JSON array con este formato exacto (sin texto extra):
[
  { "id": 1, "pregunta": "...", "tipo": "tecnica" },
  { "id": 2, "pregunta": "...", "tipo": "soft" }
]`

  const response = await client.messages.create({
    model: MODELO_RAPIDO,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text.trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No se pudo parsear las preguntas')
  return JSON.parse(jsonMatch[0])
}

/**
 * Evalúa las respuestas de la entrevista y genera feedback
 */
const evaluarEntrevista = async ({ empresa, cargo, entrevistador, preguntas, respuestas, feedbackPorPregunta }) => {
  const pares = preguntas.map((p, i) => `P${i + 1} [${p.tipo}]: ${p.pregunta}\nR: ${respuestas[i] || '(sin respuesta)'}`).join('\n\n')

  const prompt = `Eres un experto evaluador de entrevistas en LATAM. Evalúa las respuestas de esta entrevista:

Cargo: ${cargo} en ${empresa}
Tipo de entrevistador: ${entrevistador}

PREGUNTAS Y RESPUESTAS:
${pares}

Genera una evaluación profesional y constructiva. Responde con un JSON con esta estructura exacta:
{
  "puntuacion": <número 0-100>,
  "resumen": "<párrafo de 2-3 oraciones con evaluación general>",
  "fortalezas": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "areas_mejora": ["<área 1>", "<área 2>", "<área 3>"],
  "recomendaciones": ["<recomendación práctica 1>", "<recomendación 2>", "<recomendación 3>"],
  ${feedbackPorPregunta ? `"detalle": [
    { "id": <número>, "pregunta": "<pregunta>", "calificacion": <1-5>, "comentario": "<feedback específico>" }
  ]` : '"detalle": []'}
}

CRITERIOS DE PUNTUACIÓN:
- Relevancia y profundidad de las respuestas
- Uso de ejemplos concretos y métricas
- Estructura y claridad de la comunicación
- Alineación con el cargo y la empresa
- Deducir puntos por respuestas vacías o muy cortas`

  const response = await client.messages.create({
    model: MODELO,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo parsear la evaluación')
  return JSON.parse(jsonMatch[0])
}

/**
 * Analiza secciones del perfil LinkedIn y devuelve puntajes y recomendaciones por sección
 */
const analizarLinkedin = async ({ titular, extracto, experiencia, habilidades, educacion }) => {
  const secciones = []
  if (titular?.trim())    secciones.push(`TITULAR:\n${titular}`)
  if (extracto?.trim())   secciones.push(`EXTRACTO:\n${extracto}`)
  if (experiencia?.trim()) secciones.push(`EXPERIENCIA:\n${experiencia}`)
  if (habilidades?.trim()) secciones.push(`HABILIDADES:\n${habilidades}`)
  if (educacion?.trim())   secciones.push(`EDUCACION:\n${educacion}`)

  const prompt = `Eres un experto en personal branding y LinkedIn para el mercado laboral de LATAM 2026.
Analiza las siguientes secciones del perfil LinkedIn de un profesional y devuelve un análisis detallado.

PERFIL A ANALIZAR:
${secciones.join('\n\n')}

CRITERIOS DE EVALUACIÓN 2026:
- Titular: debe contener cargo, industria/nicho, propuesta de valor, keywords de ATS. Máx 220 chars.
- Extracto: primera línea con gancho, historia profesional, logros cuantificados, CTA al final. Debe tener 3+ párrafos.
- Experiencia: verbos de acción, logros con métricas, keywords del sector, fechas exactas.
- Habilidades: mix de hard skills + soft skills, relevantes para el sector, al menos 15-20 skills.
- Educación: institución relevante, actividades extracurriculares, logros académicos si aplican.

Responde ÚNICAMENTE con un JSON con esta estructura exacta (sin texto extra):
{
  "puntaje_global": <número 0-100>,
  "resumen_global": "<2-3 oraciones evaluando el perfil general y su impacto en reclutadores>",
  "top_acciones": ["<acción prioritaria 1>", "<acción prioritaria 2>", "<acción prioritaria 3>"],
  "secciones": {
    "titular": {
      "puntaje": <0-100 o null si no fue enviada>,
      "diagnostico": "<1-2 oraciones de diagnóstico general de esta sección>",
      "fortalezas": ["<punto fuerte>"],
      "mejoras": ["<qué mejorar específicamente>"],
      "ejemplo": "<reescritura sugerida de esta sección>"
    },
    "extracto": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "experiencia": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "habilidades": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "educacion": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." }
  }
}

Para secciones no enviadas, devuelve null en el campo puntaje y strings vacíos en los demás campos.`

  const response = await client.messages.create({
    model: MODELO,
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo parsear el análisis de LinkedIn')
  return JSON.parse(jsonMatch[0])
}

/**
 * Extrae datos estructurados de un CV para generar la infografía visual
 * Usa Haiku (rápido y barato) — es extracción, no escritura creativa
 */
const extraerDatosInfografia = async (cvText) => {
  const fragmento = cvText.substring(0, 6000)

  const prompt = `Analiza el siguiente CV y extrae los datos estructurados para generar una infografía visual profesional.
Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.

CV:
${fragmento}

Devuelve exactamente esta estructura:
{
  "nombre": "Nombre completo",
  "cargo": "Cargo o título profesional principal",
  "resumen": "Resumen profesional de 2-3 oraciones",
  "contacto": {
    "email": "email o null",
    "telefono": "teléfono o null",
    "ciudad": "Ciudad, País o null",
    "linkedin": "URL o usuario de LinkedIn o null"
  },
  "experiencia": [
    {
      "empresa": "Nombre empresa",
      "cargo": "Cargo",
      "periodo": "Ene 2021 – Actual",
      "bullets": ["logro 1 con verbo de acción", "logro 2"]
    }
  ],
  "educacion": [
    { "titulo": "MBA Marketing", "institucion": "Universidad X", "anio": "2021" }
  ],
  "habilidades": [
    { "nombre": "Nombre habilidad", "nivel": 90 }
  ],
  "idiomas": [
    { "idioma": "Español", "nivel": "Nativo", "puntos": 5 },
    { "idioma": "Inglés", "nivel": "C1", "puntos": 4 }
  ],
  "logros": [
    { "numero": "+43%", "descripcion": "Descripción breve del logro" }
  ],
  "diferenciadores": [
    "Frase corta que describe qué hace único a este candidato",
    "Otro diferenciador clave"
  ],
  "herramientas": ["Herramienta 1", "Herramienta 2"]
}

REGLAS:
- habilidades: máximo 6, con nivel del 0 al 100 estimado por el contexto del CV
- logros: máximo 3, extraer solo los que tengan números o métricas concretas
- diferenciadores: exactamente 3, frases cortas y específicas (no genéricas como "profesional comprometido")
- herramientas: máximo 8
- experiencia: máximo 3 entradas más recientes, máximo 3 bullets cada una
- Si no encuentras un dato, usa null o array vacío`

  const response = await client.messages.create({
    model: MODELO_RAPIDO,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  let jsonText = response.content[0].text.trim()
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(jsonText)
}

module.exports = { optimizeCV, matchCVtoJob, generateChatResponse, generarPreguntasEntrevista, evaluarEntrevista, analizarLinkedin, extraerDatosInfografia };
