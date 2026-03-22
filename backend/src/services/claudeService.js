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

module.exports = { optimizeCV, matchCVtoJob };
