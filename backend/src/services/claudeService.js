// Integración con Claude API — motor de análisis de CV
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODELO = 'claude-sonnet-4-6';

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
    system: SISTEMA_BASE,
    messages: [{ role: 'user', content: prompt }],
  });
  console.log(`[optimizeCV] Claude tardó ${((Date.now() - t0) / 1000).toFixed(1)}s`);

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

  const response = await client.messages.create({
    model: MODELO,
    max_tokens: 4096,
    temperature: 0,
    system: SISTEMA_BASE,
    messages: [{ role: 'user', content: prompt }],
  });

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
    model: 'claude-haiku-4-5-20251001',
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
    model: 'claude-haiku-4-5-20251001',
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

module.exports = { optimizeCV, matchCVtoJob, generateChatResponse, generarPreguntasEntrevista, evaluarEntrevista };
