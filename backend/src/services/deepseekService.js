/**
 * deepseekService.js
 * Cliente DeepSeek V3 para tareas de extracción, clasificación y chat.
 * API compatible con OpenAI — ~70% más barato que claude-haiku-4-5.
 *
 * Estrategia:
 *  deepseek-chat  → extracción JSON, clasificación, preguntas, chat ELVIA
 *  Claude Sonnet  → escritura creativa de alta calidad (optimizeCV, matchCVtoJob, etc.)
 */

const OpenAI = require('openai');

let deepseek = null;
const _deepseekKey = process.env.DEEPSEEK_API_KEY;
if (!_deepseekKey) {
  console.error('[DeepSeek] DEEPSEEK_API_KEY no configurada — extracción vía DeepSeek deshabilitada');
} else {
  try {
    deepseek = new OpenAI({ apiKey: _deepseekKey, baseURL: 'https://api.deepseek.com/v1' });
  } catch (error) {
    console.error('[DeepSeek] Error al inicializar cliente:', error.message);
  }
}

const MODELO_DS = 'deepseek-chat'; // DeepSeek V3

// ─────────────────────────────────────────────────────────────────────────────
// Chat ELVIA — Reemplaza generateChatResponse (Claude Haiku)
// ─────────────────────────────────────────────────────────────────────────────
const generateChatResponse = async (message, history, context) => {
  const systemPrompt = `Eres "ELVIA", la asistente y mentora experta en crecimiento profesional y reclutamiento para la plataforma "ELVIA". Tu personalidad es empoderadora, profesional y cercana.

TEMAS QUE PUEDES RESPONDER:
- Uso de las funciones de ELVIA (CV Optimizer, CV vs Vacante, Gerente de Búsqueda, Pipeline, Biblioteca, etc.)
- Consejos de carrera: CV, carta de presentación, negociación salarial, LinkedIn
- Procesos de selección: entrevistas, qué buscan los reclutadores, cómo destacar
- Estrategias de búsqueda de empleo en LATAM y USA hispanohablante
- Bienestar durante la búsqueda: manejo del estrés, motivación, organización

TEMAS PROHIBIDOS — responde exactamente con la frase indicada, sin agregar más:
- Política, religión, ideologías, noticias, entretenimiento, deportes → responde: "Ese tema está fuera de mi especialidad. ¿Te puedo ayudar con algo de tu carrera o con el uso de la app?"
- Precios, cobros, facturación, reembolsos → responde: "Para temas de suscripción y pagos, escríbenos a soporte@elvia.lat"
- Información interna de la empresa, estrategia, métricas, datos de otros usuarios → responde: "No tengo acceso a esa información."
- Documentos internos, archivos, políticas no públicas → responde: "Esa información está disponible en la sección Biblioteca de la app para usuarios con acceso."
- Generar código, scripts, o cualquier contenido dañino → responde: "Eso está fuera de mis capacidades como mentora de carrera."

FORMATO:
- Usa Markdown (negritas, listas) para respuestas fáciles de leer
- Máximo 3-4 párrafos o 5-6 bullets — respuestas concisas
- Si el usuario está en /dashboard, recuérdale al final que completar el Gerente de Búsqueda desbloquea todas las herramientas

Contexto actual: ${context || 'Navegando en la plataforma'}`;

  const formattedHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  formattedHistory.push({ role: 'user', content: message });

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 600,
    messages: [{ role: 'system', content: systemPrompt }, ...formattedHistory],
  });

  return response.choices[0].message.content;
};

// ─────────────────────────────────────────────────────────────────────────────
// Generar preguntas de entrevista — Reemplaza generarPreguntasEntrevista (Haiku)
// ─────────────────────────────────────────────────────────────────────────────
const generarPreguntasEntrevista = async ({ empresa, cargo, entrevistador, descripcion, numPreguntas }) => {
  const tecnicas = Math.ceil(numPreguntas * 0.5);
  const soft = numPreguntas - tecnicas;

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
]`;

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No se pudo parsear las preguntas');
  return JSON.parse(jsonMatch[0]);
};

// ─────────────────────────────────────────────────────────────────────────────
// Extrae datos del CV para infografía visual — Reemplaza extraerDatosInfografia (Haiku)
// ─────────────────────────────────────────────────────────────────────────────
const extraerDatosInfografia = async (cvText) => {
  const fragmento = cvText.substring(0, 6000);

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
- Si no encuentras un dato, usa null o array vacío`;

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  let jsonText = response.choices[0].message.content.trim();
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(jsonText);
};

// ─────────────────────────────────────────────────────────────────────────────
// Extrae datos de LinkedIn — Reemplaza extraerDatosLinkedin (Haiku)
// ─────────────────────────────────────────────────────────────────────────────
const extraerDatosLinkedin = async (rawText) => {
  const fragmento = rawText.substring(0, 10000);

  const prompt = `Analiza el siguiente texto extraído de un perfil de LinkedIn (puede ser de un PDF o de un copiado-pegado de la web) y extrae las secciones principales de forma estructurada.
Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.

TEXTO DEL PERFIL:
${fragmento}

Devuelve exactamente esta estructura:
{
  "titular": "Frase debajo del nombre",
  "extracto": "Sección 'Acerca de' completa",
  "experiencia": "Lista detallada de cargos, empresas, fechas y logros",
  "habilidades": "Lista de habilidades separadas por coma",
  "educacion": "Instituciones y títulos obtenidos"
}

REGLAS:
- Si una sección no se encuentra o está vacía, usa string vacío "".
- Limpia ruidos del PDF (como 'Página 1 de 2', 'LinkedIn', etc.) pero mantén el contenido profesional intacto.
- En 'experiencia', trata de mantener el formato descriptivo original.`;

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  let jsonText = response.choices[0].message.content.trim();
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const rawData = JSON.parse(jsonText);
    const formatEntry = (entry) => {
      if (typeof entry === 'string') return entry;
      if (typeof entry === 'object' && entry !== null) {
        return Object.entries(entry).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(' | ');
      }
      return String(entry);
    };
    return {
      titular:    typeof rawData.titular    === 'string' ? rawData.titular    : formatEntry(rawData.titular    || ''),
      extracto:   typeof rawData.extracto   === 'string' ? rawData.extracto   : formatEntry(rawData.extracto   || ''),
      experiencia: Array.isArray(rawData.experiencia) ? rawData.experiencia.map(formatEntry).join('\n\n') : formatEntry(rawData.experiencia || ''),
      habilidades: Array.isArray(rawData.habilidades) ? rawData.habilidades.join(', ') : String(rawData.habilidades || ''),
      educacion:  Array.isArray(rawData.educacion) ? rawData.educacion.map(formatEntry).join('\n\n') : formatEntry(rawData.educacion || ''),
    };
  } catch (error) {
    console.error('[DeepSeek][extraerDatosLinkedin] Error al parsear JSON:', error.message);
    throw new Error('La IA no pudo estructurar los datos correctamente. Intenta con el pegado manual.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Corregir proyecto laboral — Reemplaza corregirProyectoLaboral (Haiku)
// ─────────────────────────────────────────────────────────────────────────────
const corregirProyectoLaboral = async (proyectoData) => {
  const prompt = `Actúa como un corrector de estilo corporativo experto en el mercado de América Latina.
Revisa el siguiente JSON que contiene la configuración del "Proyecto Laboral" de un profesional.
Tu tarea es corregir la ortografía, la gramática y mejorar sutilmente la redacción para que suene como un perfil ejecutivo de alto nivel, utilizando español hispanoamericano estándar (neutro, sin modismos locales).

No cambies la intención ni las variables, solo mejora los textos (por ej. 'objetivoLaboral', 'empresasMock', etc). Si hay arrays de strings, corrígelos también.

JSON ORIGINAL:
${JSON.stringify(proyectoData, null, 2)}

Devuelve ÚNICAMENTE el JSON estructurado con las mismas llaves, pero con el texto corregido. Valida que el JSON es 100% válido sintácticamente.`;

  if (!deepseek) return proyectoData;
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  let jsonText = response.choices[0].message.content.trim();
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('[DeepSeek][corregirProyectoLaboral] Error:', error.message);
    return proyectoData; // fallback al original
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Extrae perfil desde PDF de CV — Reemplaza extractProfile en cvController (Haiku)
// ─────────────────────────────────────────────────────────────────────────────
const extractProfileFromCV = async (cvText) => {
  const fragmento = cvText; // el controlador ya limita el tamaño

  const prompt = `Eres un extractor de datos estructurados de CVs. Tu única tarea es leer el CV y devolver un JSON con los datos exactamente como aparecen, sin inventar, traducir ni interpretar.

REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE JSON válido, sin texto extra, sin explicaciones, sin markdown.
2. Extrae los datos TAL COMO ESTÁN en el CV (no traduzcas nombres, empresas ni títulos).
3. Si un campo no existe, usa null. Arrays vacíos [] si no hay datos.
4. Para "idioma_cv": detecta el idioma principal del documento ("es", "en", "pt", "fr", "de", u otro código ISO 639-1).
5. Para "telefono1": extrae el número tal como aparece, incluyendo indicativo si existe.
6. Para "experiencias": extrae TODAS las entradas de experiencia laboral en orden cronológico (la más antigua primero). Usa los campos exactos del schema.
7. Para "educacion": extrae TODA la formación académica.
8. "fecha_inicio" y "fecha_fin" deben ser strings como "2019-03", "2022" o "Actualidad"/"Present".

CV A PROCESAR:
${fragmento}

Devuelve este JSON (respeta los nombres de campo exactamente):
{
  "idioma_cv": "es",
  "nombre1": "primer nombre",
  "nombre2": "segundo nombre o null",
  "apellido1": "primer apellido",
  "apellido2": "segundo apellido o null",
  "email": "email o null",
  "telefono1": "teléfono completo con indicativo o null",
  "ciudad": "ciudad o null",
  "pais": "país o null",
  "linkedin": "URL de LinkedIn o null",
  "cargo_actual": "cargo o título profesional principal o null",
  "resumen": "texto del resumen/perfil profesional copiado del CV o null",
  "años_experiencia": número entero estimado o null,
  "industria": "industria principal o null",
  "habilidades": ["habilidad1", "habilidad2"],
  "idiomas": ["Español", "Inglés"],
  "educacion": [{ "titulo": "título exacto", "institucion": "institución exacta", "anio": "año de graduación o null" }],
  "experiencias": [{ "empresa": "empresa exacta", "cargo": "cargo exacto", "fecha_inicio": "YYYY-MM o YYYY", "fecha_fin": "YYYY-MM o YYYY o Actualidad", "descripcion": "descripción de responsabilidades y logros" }]
}`;

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 2500,
    temperature: 0.1,
    messages: [{ role: 'user', content: prompt }],
  });

  let jsonText = response.choices[0].message.content.trim();
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(jsonText);
};

// ─────────────────────────────────────────────────────────────────────────────
// Analiza el perfil LinkedIn — Migrado desde claudeService (Claude no disponible)
// ─────────────────────────────────────────────────────────────────────────────
const analizarLinkedin = async ({ titular, extracto, experiencia, habilidades, educacion, contextoLaboral }) => {
  const secciones = []
  if (titular?.trim())    secciones.push(`TITULAR:\n${titular}`)
  if (extracto?.trim())   secciones.push(`EXTRACTO:\n${extracto}`)
  if (experiencia?.trim()) secciones.push(`EXPERIENCIA:\n${experiencia}`)
  if (habilidades?.trim()) secciones.push(`HABILIDADES:\n${habilidades}`)
  if (educacion?.trim())  secciones.push(`EDUCACION:\n${educacion}`)

  const prompt = `Eres un experto en personal branding y LinkedIn para el mercado laboral de LATAM 2026.
Analiza las siguientes secciones del perfil LinkedIn de un profesional y devuelve un análisis detallado.

PERFIL A ANALIZAR:
${secciones.join('\n\n')}

${contextoLaboral ? `CONTEXTO DEL PROYECTO LABORAL DEL USUARIO:
${JSON.stringify({
  objetivo: contextoLaboral.objetivoLaboral,
  industrias: contextoLaboral.sectoresInteres,
  ciudades: contextoLaboral.ciudadesDestino,
  esquemas: contextoLaboral.esquemasTrabajo,
  empresasTarget: contextoLaboral.empresasMock
}, null, 2)}
` : ''}

CRITERIOS DE EVALUACIÓN 2026:
- Alineación Estratégica: Si hay CONTEXTO DEL PROYECTO LABORAL, todas las sugerencias deben orientarse a posicionar al profesional para ese objetivo, industria y ciudades específicas.
- Titular: debe contener cargo (alineado al objetivo si hay), industria/nicho, propuesta de valor, keywords de ATS. Máx 220 chars.
- Extracto: primera línea con gancho, historia profesional acorde al objetivo, logros cuantificados, CTA. Debe tener 3+ párrafos.
- Experiencia: verbos de acción, logros con métricas, descripciones enfocadas en habilidades transferibles al rol objetivo.
- Habilidades: mix de hard skills + soft skills, priorizando las relevantes para el sector objetivo.

REGLAS ESTRICTAS DE ÉTICA Y CALIDAD:
1. NO inventes ni asumas experiencia laboral, títulos o habilidades que no estén explícitamente en el perfil.
2. Centra tu análisis en el mérito profesional. Prohibido mencionar edad, género, raza u origen.
3. El campo "ejemplo" debe proveer una redacción lista para usar que respete el estilo y la verdad del candidato.

Responde ÚNICAMENTE con un JSON con esta estructura exacta (sin texto extra):
{
  "puntaje_global": <número 0-100>,
  "resumen_global": "<2-3 oraciones evaluando el perfil frente a sus objetivos>",
  "top_acciones": ["<acción prioritaria 1>", "<acción prioritaria 2>", "<acción prioritaria 3>"],
  "secciones": {
    "titular": {
      "puntaje": <0-100 o null si no fue enviada>,
      "diagnostico": "<1-2 oraciones de diagnóstico>",
      "fortalezas": ["<punto fuerte>"],
      "mejoras": ["<qué mejorar>"],
      "ejemplo": "<reescritura sugerida optimizada>"
    },
    "extracto": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "experiencia": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "habilidades": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "educacion": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." }
  }
}

Para secciones no enviadas, devuelve null en el campo puntaje y strings vacíos en los demás campos.`

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada')
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  let jsonText = response.choices[0].message.content.trim()
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo parsear el análisis de LinkedIn')
  return JSON.parse(jsonMatch[0])
}

// ─────────────────────────────────────────────────────────────────────────────
// optimizarResumen — Migrado desde claudeService
// ─────────────────────────────────────────────────────────────────────────────
const optimizarResumen = async (texto, idioma = 'es') => {
  if (!texto || texto.trim().length < 10) return texto;
  if (!deepseek) return texto;

  try {
    const response = await deepseek.chat.completions.create({
      model: MODELO_DS,
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        { role: 'system', content: `Eres un Senior Career Coach experto en redacción profesional.
Tu tarea es optimizar el resumen del usuario para que sea claro, ejecutivo y sin sesgos.

REGLAS:
1. REESCRITURA: Mejora la redacción, gramática y vocabulario.
2. FIDELIDAD: No inventes datos. Usa solo la información proporcionada.
3. ESTRUCTURA: [Trayectoria] + [Especialidad] + [Valor Diferencial].
4. SÍNTESIS: Sé directo y profesional.
5. PRIMERA PERSONA: Usa "yo", "mis", "mi" — escribe como si la persona hablara de sí misma.
6. Responde únicamente con el párrafo optimizado en ${idioma === 'es' ? 'Español' : 'Inglés'}. Sin comillas ni explicaciones.` },
        { role: 'user', content: `Optimiza este resumen profesional: "${texto}"` }
      ],
    });

    const result = response.choices[0].message.content.trim().replace(/^["'«]+|["'»]+$/g, '').trim();
    console.log('[DeepSeek] Resumen optimizado con éxito.');
    return result;
  } catch (error) {
    console.error('[DeepSeek] Error en optimizarResumen:', error.message);
    return texto;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// generarCarta — Migrado desde claudeService
// ─────────────────────────────────────────────────────────────────────────────
const ETIQUETA_IDIOMA = { es: 'español', en: 'English', pt: 'português' };

const generarCarta = async ({ empresa, cargo, descripcion, cvText, language = 'es' }) => {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';
  const cvSeccion = cvText ? `\nPERFIL DEL CANDIDATO (extraído de su CV):\n${cvText.slice(0, 3000)}` : '';

  const prompt = `Eres un experto en redacción de cartas de presentación para el mercado hispanoamericano.
Escribe una carta de presentación profesional, auténtica y persuasiva, en ${idioma}.

VACANTE:
Empresa: ${empresa || 'la empresa'}
Cargo: ${cargo || 'el puesto'}
Descripción: ${descripcion || 'no proporcionada'}
${cvSeccion}

INSTRUCCIONES:
- 3 párrafos: apertura impactante, cuerpo con 2-3 logros/competencias concretas alineadas a la vacante, cierre con llamada a la acción
- Tono profesional pero humano, sin clichés corporativos
- Si hay CV, usa datos reales del candidato; si no, usa [NOMBRE], [LOGRO] como placeholders
- Sin encabezado formal de carta (solo el cuerpo del texto)
- Máximo 250 palabras

Responde ÚNICAMENTE con el texto de la carta, sin explicaciones adicionales.`;

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 800,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message.content.trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// evaluarEntrevista — Migrado desde claudeService
// ─────────────────────────────────────────────────────────────────────────────
const evaluarEntrevista = async ({ empresa, cargo, entrevistador, preguntas, respuestas, feedbackPorPregunta }) => {
  const pares = preguntas.map((p, i) => `P${i + 1} [${p.tipo}]: ${p.pregunta}\nR: ${respuestas[i] || '(sin respuesta)'}`).join('\n\n');

  const prompt = `Eres un experto evaluador de entrevistas en LATAM. Evalúa las respuestas de esta entrevista y estructura el feedback en 4 secciones:

Cargo: ${cargo} en ${empresa}
Tipo de entrevistador: ${entrevistador}

PREGUNTAS Y RESPUESTAS:
${pares}

Evalúa las respuestas en estas 4 áreas:
- SECCIÓN 1: PRESENTACIÓN PERSONAL (¿El candidato se presentó bien? ¿Comunicó con claridad?)
- SECCIÓN 2: CASOS Y LOGROS (¿Usó ejemplos concretos y métricas? ¿Demostró impacto?)
- SECCIÓN 3: HABILIDADES TÉCNICAS (¿Demostró competencias para el cargo? ¿Profundidad técnica?)
- SECCIÓN 4: CIERRE Y PREGUNTAS (¿Cerró bien la entrevista? ¿Hizo preguntas inteligentes?)

Responde ÚNICAMENTE con este JSON (sin texto adicional):
{
  "puntuacion": <0-100>,
  "resumen": "<párrafo de 2-3 oraciones con evaluación general>",
  "secciones": [
    {
      "titulo": "Presentación Personal",
      "puntuacion": <0-10>,
      "feedback": "<feedback específico de 2-3 oraciones>",
      "fortalezas": ["<fortaleza 1>", "<fortaleza 2>"],
      "areas_mejora": ["<mejora 1>", "<mejora 2>"]
    },
    {
      "titulo": "Casos y Logros",
      "puntuacion": <0-10>,
      "feedback": "<feedback>",
      "fortalezas": [],
      "areas_mejora": []
    },
    {
      "titulo": "Habilidades Técnicas",
      "puntuacion": <0-10>,
      "feedback": "<feedback>",
      "fortalezas": [],
      "areas_mejora": []
    },
    {
      "titulo": "Cierre y Preguntas",
      "puntuacion": <0-10>,
      "feedback": "<feedback>",
      "fortalezas": [],
      "areas_mejora": []
    }
  ],
  "recomendaciones": ["<recomendación práctica 1>", "<recomendación 2>", "<recomendación 3>"],
  ${feedbackPorPregunta ? `"detalle": [
    { "id": <número>, "pregunta": "<pregunta>", "calificacion": <1-5>, "comentario": "<feedback específico>" }
  ]` : '"detalle": []'}
}`;

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');
  const response = await deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  let text = response.choices[0].message.content.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se pudo parsear la evaluación');
  return JSON.parse(jsonMatch[0]);
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers compartidos para optimizeCV y matchCVtoJob
// ─────────────────────────────────────────────────────────────────────────────

const SISTEMA_BASE = `Eres un experto en recursos humanos y redacción de CV con 20 años de experiencia
en el mercado laboral de LATAM y USA. Tus análisis son objetivos, sin sesgos por edad, género u origen.

╔══════════════════════════════════════════════════════════════════════════╗
║  REGLA #1 (ABSOLUTA, NO NEGOCIABLE): CERO INVENCIÓN DE DATOS             ║
║  Tu trabajo es REFORMULAR y REORGANIZAR únicamente. Nada más.            ║
╚══════════════════════════════════════════════════════════════════════════╝

PROHIBIDO ABSOLUTAMENTE inventar, deducir, completar o "rellenar":
  ✗ Emails (jamás generes uno; ni siquiera "nombre@email.com" como placeholder)
  ✗ Teléfonos, indicativos de país o números de contacto
  ✗ URLs de LinkedIn, GitHub, portafolios, sitios web
  ✗ Fechas (de inicio, fin, graduación) — si no están en el CV, OMITE la fecha
  ✗ Métricas o cifras (%, $, K, número de personas, año, equipos) — si no están, NO las pongas
  ✗ Empresas, cargos o instituciones que no aparezcan en el texto original
  ✗ Certificaciones, premios o títulos no mencionados
  ✗ Ciudades, países o ubicaciones no presentes en el CV
  ✗ Idiomas o niveles CEFR no declarados

REGLA DE OMISIÓN: si un campo del formato Harvard NO existe en el CV original,
OMITE ese campo por completo. Es preferible un CV sin email a un CV con un email falso.

LO QUE SÍ PUEDES HACER:
  ✓ Reescribir frases para mayor claridad y profesionalismo
  ✓ Cambiar voz pasiva a activa ("fui responsable de" → "lideré")
  ✓ Reordenar secciones según el formato Harvard
  ✓ Mejorar gramática, ortografía y vocabulario
  ✓ Agrupar habilidades sueltas en categorías lógicas
  ✓ Usar verbos de acción: lideré, implementé, gestioné, optimicé, diseñé, coordiné, ejecuté, desarrollé, supervisé, analicé

ESTRUCTURA HARVARD OBLIGATORIA:

NOMBRE COMPLETO
[Email solo si existe en el original] | [Teléfono solo si existe] | [Ciudad, País solo si existen] | [LinkedIn solo si existe]
──────────────────────────────────────────────────────
RESUMEN PROFESIONAL
Párrafo de 3-4 líneas con propuesta de valor (basado SOLO en lo que ya dice el CV).
──────────────────────────────────────────────────────
EXPERIENCIA PROFESIONAL
Empresa — Cargo | Ciudad, País | Mes Año – Mes Año
• Logro o responsabilidad con verbo de acción (sin inventar métricas)
──────────────────────────────────────────────────────
EDUCACIÓN
Institución — Título | Ciudad, País | Año
──────────────────────────────────────────────────────
HABILIDADES
• Categoría: habilidad 1, habilidad 2, habilidad 3

REGLAS DE FORMATO:
- El nombre va en la primera línea, sin etiquetas
- Los datos de contacto van en la segunda línea, separados por | (OMITE los que falten)
- Los encabezados de sección van en MAYÚSCULAS
- Usa ── como divisor entre secciones
- NO uses secciones como "Datos Personales"
- NO incluyas fecha de nacimiento, estado civil, ni nacionalidad
- Los bullets van con • seguido de espacio

CALIBRACIÓN POR SENIORITY:
- Junior (0-3 años): enfoca en formación, potencial. Tono: prometedor.
- Mid (4-9 años): balance entre logros y proyección.
- Senior/C-Level (10+ años): protagonismo estratégico, impacto de negocio.
NUNCA cambies datos para "ajustarte" al seniority. Solo cambia el TONO.`;

// --- Parsers XML (portados de claudeService) ---
const parsearRespuestaOptimize = (text) => {
  const cvMatch = text.match(/<CV>([\s\S]*?)<\/CV>/);
  const cambiosMatch = text.match(/<CAMBIOS>([\s\S]*?)<\/CAMBIOS>/);
  const recMatch = text.match(/<RECOMENDACIONES>([\s\S]*?)<\/RECOMENDACIONES>/);
  return {
    optimizedCV: cvMatch ? cvMatch[1].trim() : text.trim(),
    changes: cambiosMatch ? cambiosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
    recommendations: recMatch ? recMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
  };
};

const parsearRespuestaMatch = (text) => {
  const cvMatch = text.match(/<CV>([\s\S]*?)<\/CV>/);
  const scoreMatch = text.match(/<SCORE>([\s\S]*?)<\/SCORE>/);
  const analisisMatch = text.match(/<ANALISIS>([\s\S]*?)<\/ANALISIS>/);
  const cambiosMatch = text.match(/<CAMBIOS>([\s\S]*?)<\/CAMBIOS>/);
  const jobMatch = text.match(/<VACANTE>([\s\S]*?)<\/VACANTE>/);
  const kwMatch = text.match(/<KEYWORDS>([\s\S]*?)<\/KEYWORDS>/);
  const dimMatch = text.match(/<DIMENSIONES>([\s\S]*?)<\/DIMENSIONES>/);

  let analisis = null;
  if (analisisMatch) {
    const raw = analisisMatch[1].trim();
    const fortalezasMatch = raw.match(/FORTALEZAS:\s*([\s\S]*?)(?=BRECHAS:|$)/i);
    const brechasMatch = raw.match(/BRECHAS:\s*([\s\S]*?)(?=CONCLUSION:|$)/i);
    const conclusionMatch = raw.match(/CONCLUSION:\s*([\s\S]*?)$/i);
    analisis = {
      fortalezas: fortalezasMatch ? fortalezasMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
      brechas: brechasMatch ? brechasMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
      conclusion: conclusionMatch ? conclusionMatch[1].trim() : '',
    };
  }

  let jobData = { title: '', location: '', country: '' };
  if (jobMatch) {
    const jobText = jobMatch[1].trim();
    const titleMatch = jobText.match(/titulo:\s*(.+)/i);
    const locationMatch = jobText.match(/ubicacion:\s*(.+)/i);
    const countryMatch = jobText.match(/pais:\s*(.+)/i);
    jobData = {
      title: titleMatch ? titleMatch[1].trim() : '',
      location: locationMatch ? locationMatch[1].trim() : '',
      country: countryMatch ? countryMatch[1].trim() : '',
    };
  }

  let keywords = null;
  if (kwMatch) {
    const raw = kwMatch[1].trim();
    const parseKwList = (pattern) => {
      const m = raw.match(pattern);
      if (!m) return [];
      return m[1].split(',').map(s => s.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, '')).filter(Boolean);
    };
    keywords = {
      criticas: { presentes: parseKwList(/CRITICAS_PRESENTES:\s*\[([^\]]*)\]/i), ausentes: parseKwList(/CRITICAS_AUSENTES:\s*\[([^\]]*)\]/i) },
      complementarias: { presentes: parseKwList(/COMPLEMENTARIAS_PRESENTES:\s*\[([^\]]*)\]/i), ausentes: parseKwList(/COMPLEMENTARIAS_AUSENTES:\s*\[([^\]]*)\]/i) },
    };
  }

  let dimensiones = null;
  if (dimMatch) {
    const raw = dimMatch[1];
    const parseDim = (key) => {
      const m = raw.match(new RegExp(`${key}:\\s*(\\d+)`, 'i'));
      return m ? Math.min(100, Math.max(0, parseInt(m[1], 10))) : null;
    };
    dimensiones = {
      hard_skills: parseDim('hard_skills'),
      soft_skills: parseDim('soft_skills'),
      experiencia: parseDim('experiencia'),
      formato_ats: parseDim('formato_ats'),
    };
  }

  return {
    tailoredCV: cvMatch ? cvMatch[1].trim() : text.trim(),
    matchScore: scoreMatch ? parseInt(scoreMatch[1].trim(), 10) || 0 : 0,
    analisis,
    changes: cambiosMatch ? cambiosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
    jobData,
    keywords,
    dimensiones,
  };
};

// --- Anti-hallucination PII (portado de claudeService) ---
const _emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const _urlRegex = /(https?:\/\/[^\s|<>"']+|(?:linkedin\.com|github\.com|behance\.net|dribbble\.com|medium\.com|notion\.so)\/[^\s|<>"']+)/gi;
const _phoneRegex = /[+]?[\d][\d\s\-().]{6,}\d/g;

const extraerEmails = (text) => { if (!text) return new Set(); return new Set((text.match(_emailRegex) || []).map(s => s.toLowerCase().trim())); };
const extraerUrls = (text) => { if (!text) return new Set(); return new Set((text.match(_urlRegex) || []).map(s => s.toLowerCase().trim().replace(/[.,;]$/, ''))); };
const extraerTelefonos = (text) => { if (!text) return new Set(); return new Set((text.match(_phoneRegex) || []).map(s => s.replace(/\D/g, '')).filter(s => s.length >= 7)); };

const sanitizarContactoAlucinado = (cvOptimizado, cvOriginal, perfilVerificado = {}) => {
  if (!cvOptimizado) return { cv: cvOptimizado, hallucinated: [] };
  const emailsPermitidos = extraerEmails(cvOriginal);
  if (perfilVerificado.email) emailsPermitidos.add(perfilVerificado.email.toLowerCase().trim());
  const urlsPermitidas = extraerUrls(cvOriginal);
  if (perfilVerificado.linkedin_url) urlsPermitidas.add(perfilVerificado.linkedin_url.toLowerCase().trim());
  const telefonosPermitidos = extraerTelefonos(cvOriginal);
  if (perfilVerificado.telefono1) { const t = String(perfilVerificado.telefono1).replace(/\D/g, ''); if (t.length >= 7) telefonosPermitidos.add(t); }
  if (perfilVerificado.indicativo1 && perfilVerificado.telefono1) { const t = (String(perfilVerificado.indicativo1) + String(perfilVerificado.telefono1)).replace(/\D/g, ''); if (t.length >= 7) telefonosPermitidos.add(t); }

  const hallucinated = [];
  let cv = cvOptimizado;
  const emailsEnOutput = cvOptimizado.match(_emailRegex) || [];
  for (const email of emailsEnOutput) {
    if (!emailsPermitidos.has(email.toLowerCase().trim())) {
      hallucinated.push(`email:${email}`);
      cv = cv.replace(new RegExp(`\\s*\\|\\s*${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|?\\s*`, 'gi'), '');
    }
  }
  const urlsEnOutput = cvOptimizado.match(_urlRegex) || [];
  for (const url of urlsEnOutput) {
    const norm = url.toLowerCase().trim().replace(/[.,;]$/, '');
    let permitida = false;
    for (const ok of urlsPermitidas) { if (norm.includes(ok.replace(/^https?:\/\//, '')) || ok.includes(norm.replace(/^https?:\/\//, ''))) { permitida = true; break; } }
    if (!permitida) {
      hallucinated.push(`url:${url}`);
      cv = cv.replace(new RegExp(`\\s*\\|\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|?\\s*`, 'gi'), '');
    }
  }
  cv = cv.replace(/\s*\|\s*\|\s*/g, ' | ').replace(/^\s*\|\s*/gm, '').replace(/\s*\|\s*$/gm, '');
  return { cv: cv.trim(), hallucinated };
};

const construirBloqueVerificado = (perfilVerificado = {}) => {
  const p = perfilVerificado;
  const lineas = [];
  if (p.nombre1 || p.apellido1) lineas.push(`- Nombre completo: ${[p.nombre1, p.apellido1].filter(Boolean).join(' ')}`);
  if (p.email) lineas.push(`- Email: ${p.email}`);
  if (p.telefono1) lineas.push(`- Teléfono: ${p.indicativo1 || ''} ${p.telefono1}`.trim());
  if (p.pais) lineas.push(`- País: ${p.pais}`);
  if (p.ciudad) lineas.push(`- Ciudad: ${p.ciudad}`);
  if (p.linkedin_url) lineas.push(`- LinkedIn: ${p.linkedin_url}`);
  if (lineas.length === 0) return '';
  return `\n═══════════════════════════════════════════════════════════════════\nDATOS DE CONTACTO VERIFICADOS DEL USUARIO:\n${lineas.join('\n')}\n\nREGLA: usa estos datos TEXTUALMENTE si aparecen en el CV. NO uses ningún dato que no esté aquí ni en el CV original. Si falta, OMÍTELO.\n═══════════════════════════════════════════════════════════════════\n`;
};

// ─────────────────────────────────────────────────────────────────────────────
// optimizeCV — Migrado desde claudeService
// ─────────────────────────────────────────────────────────────────────────────
const optimizeCV = async (cvText, language = 'es', verifiedProfile = {}) => {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';
  const bloqueVerificado = construirBloqueVerificado(verifiedProfile);

  const prompt = `Analiza el siguiente CV y optimízalo al formato Harvard.
IMPORTANTE: El CV, los cambios realizados y las recomendaciones deben estar TODOS en ${idioma}.
RECORDATORIO ABSOLUTO: NO inventes emails, teléfonos, URLs ni datos que no estén en el CV original
o en los datos verificados de abajo. Si un campo falta, OMÍTELO del encabezado — no uses placeholders.
${bloqueVerificado}
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

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');

  const t0 = Date.now();
  console.log(`[optimizeCV] Iniciando con DeepSeek V3`);

  const callDS = async () => deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 8000,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SISTEMA_BASE },
      { role: 'user', content: prompt },
    ],
  });

  let response = await callDS();
  let text = response.choices[0].message.content;
  if (!text || !/<CV>[\s\S]*<\/CV>/.test(text)) {
    console.warn('[optimizeCV] Respuesta sin delimitadores <CV>. Reintentando...');
    response = await callDS();
    text = response.choices[0].message.content;
  }
  console.log(`[optimizeCV] DeepSeek tardó ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const parsed = parsearRespuestaOptimize(text);

  // Validación post-hoc anti-alucinación de PII
  const { cv: cvSaneado, hallucinated } = sanitizarContactoAlucinado(parsed.optimizedCV, cvText, verifiedProfile);
  if (hallucinated.length > 0) {
    console.warn(`[optimizeCV] PII alucinada eliminada: ${hallucinated.join(', ')}`);
    parsed.optimizedCV = cvSaneado;
    parsed.recommendations = parsed.recommendations || [];
    parsed.recommendations.unshift('Algunos datos de contacto se omitieron porque no estaban en tu CV original. Agrégalos manualmente si quieres incluirlos.');
  }

  return parsed;
};

// ─────────────────────────────────────────────────────────────────────────────
// matchCVtoJob — Migrado desde claudeService
// ─────────────────────────────────────────────────────────────────────────────
const matchCVtoJob = async (cvText, jobText, language = 'es', verifiedProfile = {}) => {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';
  const bloqueVerificado = construirBloqueVerificado(verifiedProfile);

  const prompt = `Analiza el CV y la vacante. Adapta el CV específicamente para esta vacante.
IMPORTANTE: El CV y los cambios realizados deben estar TODOS en ${idioma}.
RECORDATORIO ABSOLUTO: NO inventes emails, teléfonos, URLs ni habilidades/experiencias
que no estén en el CV original. Adaptar = reordenar y reformular lo existente.
${bloqueVerificado}
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
BRECHAS:
- [habla directamente al candidato en segunda persona]
CONCLUSION:
[2-3 oraciones en segunda persona al candidato]
</ANALISIS>
<CAMBIOS>
- ajuste realizado 1 (en ${idioma})
</CAMBIOS>
<VACANTE>
titulo: [cargo detectado]
ubicacion: [ciudad o región]
pais: [país]
</VACANTE>
<KEYWORDS>
CRITICAS_PRESENTES: [lista de máx 8 keywords CRÍTICAS que SÍ aparecen en el CV]
CRITICAS_AUSENTES: [lista de máx 8 keywords CRÍTICAS que NO aparecen en el CV]
COMPLEMENTARIAS_PRESENTES: [lista de máx 6 complementarias que SÍ están]
COMPLEMENTARIAS_AUSENTES: [lista de máx 6 complementarias que faltan]
</KEYWORDS>
<DIMENSIONES>
hard_skills: [0-100]
soft_skills: [0-100]
experiencia: [0-100]
formato_ats: [0-100]
</DIMENSIONES>`;

  if (!deepseek) throw new Error('[DeepSeek] DEEPSEEK_API_KEY no configurada');

  const t0 = Date.now();
  const callDS = async () => deepseek.chat.completions.create({
    model: MODELO_DS,
    max_tokens: 8000,
    temperature: 0,
    messages: [
      { role: 'system', content: SISTEMA_BASE },
      { role: 'user', content: prompt },
    ],
  });

  let response = await callDS();
  let text = response.choices[0].message.content;
  if (!text || !/<CV>[\s\S]*<\/CV>/.test(text)) {
    console.warn('[matchCVtoJob] Respuesta sin delimitadores <CV>. Reintentando...');
    response = await callDS();
    text = response.choices[0].message.content;
  }
  console.log(`[matchCVtoJob] DeepSeek tardó ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const parsed = parsearRespuestaMatch(text);

  // Sanitizar PII alucinada
  const { cv: cvSaneado, hallucinated } = sanitizarContactoAlucinado(parsed.tailoredCV, cvText, verifiedProfile);
  if (hallucinated.length > 0) {
    console.warn(`[matchCVtoJob] PII alucinada eliminada: ${hallucinated.join(', ')}`);
    parsed.tailoredCV = cvSaneado;
  }

  return parsed;
};

module.exports = {
  generateChatResponse,
  generarPreguntasEntrevista,
  extraerDatosInfografia,
  extraerDatosLinkedin,
  analizarLinkedin,
  corregirProyectoLaboral,
  extractProfileFromCV,
  // Migrados desde claudeService:
  optimizarResumen,
  generarCarta,
  evaluarEntrevista,
  optimizeCV,
  matchCVtoJob,
};
