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
  const fragmento = cvText.substring(0, 4000);

  const prompt = `Extrae los datos personales y profesionales principales de este CV.
Responde ÚNICAMENTE con JSON válido (sin texto extra):

CV:
${fragmento}

Estructura requerida:
{
  "nombre1": "primer nombre",
  "nombre2": "segundo nombre o null",
  "apellido1": "primer apellido",
  "apellido2": "segundo apellido o null",
  "email": "email o null",
  "telefono": "teléfono o null",
  "ciudad": "ciudad o null",
  "pais": "país o null",
  "linkedin": "URL de LinkedIn o null",
  "cargo_actual": "cargo o título profesional o null",
  "resumen": "resumen profesional de 2-3 oraciones o null",
  "años_experiencia": número estimado o null,
  "industria": "industria principal o null",
  "idiomas": ["Español", "Inglés"],
  "habilidades": ["habilidad1", "habilidad2"],
  "educacion": [{ "titulo": "...", "institucion": "...", "anio": "..." }],
  "experiencia": [{ "empresa": "...", "cargo": "...", "periodo": "...", "descripcion": "..." }]
}

Si un campo no existe en el CV, usa null. Arrays vacíos si no hay datos.`;

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

module.exports = {
  generateChatResponse,
  generarPreguntasEntrevista,
  extraerDatosInfografia,
  extraerDatosLinkedin,
  corregirProyectoLaboral,
  extractProfileFromCV,
};
