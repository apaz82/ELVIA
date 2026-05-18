const Anthropic = require('@anthropic-ai/sdk');

let client = null;
const _anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!_anthropicKey) {
  console.error('[Anthropic] ANTHROPIC_API_KEY no configurada — optimización de CV deshabilitada');
} else {
  try {
    client = new Anthropic({ apiKey: _anthropicKey });
  } catch (error) {
    console.error('[Anthropic] Error al inicializar cliente:', error.message);
  }
}

// Claude 4.x IDs. Fallback a 3.5 si la cuenta no tiene acceso a 4.x.
const MODELO = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const MODELO_RAPIDO = process.env.CLAUDE_MODEL_FAST || 'claude-haiku-4-5-20251001';

/**
 * Optimiza un resumen profesional con tono humano y ejecutivo.
 * @param {string} texto El resumen original del usuario.
 * @param {string} idioma Idioma destino ('es' o 'en').
 */
async function optimizarResumen(texto, idioma = 'es') {
  if (!texto || texto.trim().length < 10) return texto;
  
  try {
    const response = await client.messages.create({
      model: MODELO, // Cambiamos a Sonnet 3.5 para probar estabilidad
      max_tokens: 1000,
      temperature: 0.3, // Estable y sin divagaciones
      system: `Eres un Senior Career Coach experto en redacción profesional.
      Tu tarea es optimizar el resumen del usuario para que sea claro, ejecutivo y sin sesgos.

      REGLAS:
      1. REESCRITURA: Mejora la redacción, gramática y vocabulario.
      2. FIDELIDAD: No inventes datos. Usa solo la información proporcionada.
      3. ESTRUCTURA: [Trayectoria] + [Especialidad] + [Valor Diferencial].
      4. SÍNTESIS: Sé directo y profesional.
      5. PRIMERA PERSONA: Usa "yo", "mis", "mi" — escribe como si la persona hablara de sí misma.
      6. Responde únicamente con el párrafo optimizado en ${idioma === 'es' ? 'Español' : 'Inglés'}. Sin comillas ni explicaciones.`,
      messages: [{ role: 'user', content: `Optimiza este resumen profesional: "${texto}"` }]
    });

    const result = response.content[0].text.trim().replace(/^["'«]+|["'»]+$/g, '').trim();
    console.log('[Claude] Resumen optimizado con éxito.');
    return result;
  } catch (error) {
    console.error('[Claude] Error en optimizarResumen:', error.message);
    return texto;
  }
}

// --- Instrucciones del sistema compartidas ---
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

EJEMPLO DE ERROR CRÍTICO QUE NUNCA DEBES COMETER:
  Input: "Juan Pérez | +52 55 1234 5678 | Ciudad de México"
  ❌ MAL:  "Juan Pérez | juan.perez@gmail.com | +52 55 1234 5678 | Ciudad de México"
            (inventaste el email — esto es FALSIFICACIÓN, viola toda la regla #1)
  ✓ BIEN: "Juan Pérez | +52 55 1234 5678 | Ciudad de México"
            (sin email porque no había email en el original — CORRECTO)

LO QUE SÍ PUEDES HACER:
  ✓ Reescribir frases para mayor claridad y profesionalismo
  ✓ Cambiar voz pasiva a activa ("fui responsable de" → "lideré")
  ✓ Reordenar secciones según el formato Harvard
  ✓ Mejorar gramática, ortografía y vocabulario
  ✓ Agrupar habilidades sueltas en categorías lógicas
  ✓ Usar verbos de acción del banco autorizado: lideré, implementé, gestioné,
    optimicé, diseñé, coordiné, ejecuté, desarrollé, supervisé, analicé

ESTRUCTURA HARVARD OBLIGATORIA (sigue este orden y formato exacto):

NOMBRE COMPLETO
[Email solo si existe en el original] | [Teléfono solo si existe] | [Ciudad, País solo si existen] | [LinkedIn solo si existe]
──────────────────────────────────────────────────────
RESUMEN PROFESIONAL
Párrafo de 3-4 líneas con propuesta de valor (basado SOLO en lo que ya dice el CV).
──────────────────────────────────────────────────────
EXPERIENCIA PROFESIONAL
Empresa — Cargo | Ciudad, País | Mes Año – Mes Año
• Logro o responsabilidad con verbo de acción (sin inventar métricas)
• Logro o responsabilidad con verbo de acción (sin inventar métricas)
──────────────────────────────────────────────────────
EDUCACIÓN
Institución — Título | Ciudad, País | Año
• Detalle relevante si aplica (solo si está en el original)
──────────────────────────────────────────────────────
HABILIDADES
• Categoría: habilidad 1, habilidad 2, habilidad 3

REGLAS DE FORMATO:
- El nombre va en la primera línea, sin etiquetas
- Los datos de contacto van en la segunda línea, separados por | (OMITE los que falten — no dejes "Email: -" ni placeholders)
- Los encabezados de sección van en MAYÚSCULAS
- Usa ── como divisor entre secciones (al menos 30 guiones)
- NO uses secciones como "Datos Personales", "Personal Details" o "Información Personal" — esa info va en el encabezado
- NO incluyas fecha de nacimiento, estado civil, ni nacionalidad (no es estándar Harvard)
- Los bullets van con • seguido de espacio

CALIBRACIÓN POR SENIORITY (detecta el nivel y ajusta el tono):
- Junior (0-3 años): enfoca en formación, potencial, proyectos académicos, prácticas. Tono: prometedor, orientado a aprendizaje.
- Mid (4-9 años): balance entre logros concretos y proyección. Verbos de gestión + ejecución técnica.
- Senior/C-Level (10+ años): protagonismo estratégico, escala de equipos, impacto de negocio. Tono: ejecutivo, sin diminutivos.
NUNCA cambies datos para "ajustarte" al seniority. Solo cambia el TONO de la reescritura.`;

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

// ─── Validación anti-alucinación de datos de contacto ─────────────────────────
// Extrae todos los emails / teléfonos / URLs de un texto para poder comparar
// input vs output y detectar si el modelo inventó algún dato de contacto.

const _emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const _urlRegex   = /(https?:\/\/[^\s|<>"']+|(?:linkedin\.com|github\.com|behance\.net|dribbble\.com|medium\.com|notion\.so)\/[^\s|<>"']+)/gi;
// Teléfono: secuencias de ≥7 dígitos (con guiones/espacios/paréntesis/+ permitidos)
const _phoneRegex = /[+]?[\d][\d\s\-().]{6,}\d/g;

const extraerEmails = (text) => {
  if (!text) return new Set();
  return new Set((text.match(_emailRegex) || []).map(s => s.toLowerCase().trim()));
};

const extraerUrls = (text) => {
  if (!text) return new Set();
  return new Set((text.match(_urlRegex) || []).map(s => s.toLowerCase().trim().replace(/[.,;]$/, '')));
};

const extraerTelefonos = (text) => {
  if (!text) return new Set();
  // Normalizar: solo dígitos
  return new Set((text.match(_phoneRegex) || [])
    .map(s => s.replace(/\D/g, ''))
    .filter(s => s.length >= 7));
};

/**
 * Detecta y elimina datos de contacto alucinados en el CV optimizado.
 * Si el output contiene un email/teléfono/URL que NO está en el input ni en los
 * datos verificados del usuario, lo elimina del output (no inventamos PII jamás).
 * @returns {{ cv: string, hallucinated: string[] }}
 */
const sanitizarContactoAlucinado = (cvOptimizado, cvOriginal, perfilVerificado = {}) => {
  if (!cvOptimizado) return { cv: cvOptimizado, hallucinated: [] };

  const emailsPermitidos = extraerEmails(cvOriginal);
  if (perfilVerificado.email) emailsPermitidos.add(perfilVerificado.email.toLowerCase().trim());

  const urlsPermitidas = extraerUrls(cvOriginal);
  if (perfilVerificado.linkedin_url) urlsPermitidas.add(perfilVerificado.linkedin_url.toLowerCase().trim());

  const telefonosPermitidos = extraerTelefonos(cvOriginal);
  if (perfilVerificado.telefono1) {
    const t = String(perfilVerificado.telefono1).replace(/\D/g, '');
    if (t.length >= 7) telefonosPermitidos.add(t);
  }
  if (perfilVerificado.indicativo1 && perfilVerificado.telefono1) {
    const t = (String(perfilVerificado.indicativo1) + String(perfilVerificado.telefono1)).replace(/\D/g, '');
    if (t.length >= 7) telefonosPermitidos.add(t);
  }

  const hallucinated = [];
  let cv = cvOptimizado;

  // Emails: eliminar cualquiera que no esté permitido
  const emailsEnOutput = cvOptimizado.match(_emailRegex) || [];
  for (const email of emailsEnOutput) {
    if (!emailsPermitidos.has(email.toLowerCase().trim())) {
      hallucinated.push(`email:${email}`);
      // Eliminar el email del CV (incluyendo separadores adyacentes "|" si los hay)
      cv = cv.replace(new RegExp(`\\s*\\|\\s*${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|?\\s*`, 'gi'), '');
    }
  }

  // URLs: eliminar las no permitidas (LinkedIn, GitHub falsos, etc.)
  const urlsEnOutput = cvOptimizado.match(_urlRegex) || [];
  for (const url of urlsEnOutput) {
    const norm = url.toLowerCase().trim().replace(/[.,;]$/, '');
    let permitida = false;
    for (const ok of urlsPermitidas) {
      // Match flexible: el output puede tener http vs https, o trailing slash
      if (norm.includes(ok.replace(/^https?:\/\//, '')) || ok.includes(norm.replace(/^https?:\/\//, ''))) {
        permitida = true; break;
      }
    }
    if (!permitida) {
      hallucinated.push(`url:${url}`);
      cv = cv.replace(new RegExp(`\\s*\\|\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|?\\s*`, 'gi'), '');
    }
  }

  // Teléfonos: eliminar los no permitidos (solo si el output tiene MÁS teléfonos que el input)
  // Esto evita falsos positivos por reformateo (ej. "+52 55 1234 5678" → "(+52) 55-1234-5678")
  const telefonosEnOutput = (cvOptimizado.match(_phoneRegex) || []).map(s => s.replace(/\D/g, '')).filter(s => s.length >= 7);
  if (telefonosEnOutput.length > telefonosPermitidos.size) {
    for (const tel of telefonosEnOutput) {
      // Match parcial: el último 7 dígitos deben coincidir con algún permitido
      const ultimos7 = tel.slice(-7);
      let permitido = false;
      for (const ok of telefonosPermitidos) {
        if (ok.slice(-7) === ultimos7) { permitido = true; break; }
      }
      if (!permitido) hallucinated.push(`telefono:${tel}`);
    }
  }

  // Limpiar separadores duplicados que puedan quedar tras eliminar campos: "| |" → "|"
  cv = cv.replace(/\s*\|\s*\|\s*/g, ' | ').replace(/^\s*\|\s*/gm, '').replace(/\s*\|\s*$/gm, '');

  return { cv: cv.trim(), hallucinated };
};

// Construye el bloque de "DATOS VERIFICADOS" que se inyecta al prompt
const construirBloqueVerificado = (perfilVerificado = {}) => {
  const p = perfilVerificado;
  const lineas = [];
  if (p.nombre1 || p.apellido1) lineas.push(`- Nombre completo: ${[p.nombre1, p.apellido1].filter(Boolean).join(' ')}`);
  if (p.email)         lineas.push(`- Email: ${p.email}`);
  if (p.telefono1)     lineas.push(`- Teléfono: ${p.indicativo1 || ''} ${p.telefono1}`.trim());
  if (p.pais)          lineas.push(`- País: ${p.pais}`);
  if (p.ciudad)        lineas.push(`- Ciudad: ${p.ciudad}`);
  if (p.linkedin_url)  lineas.push(`- LinkedIn: ${p.linkedin_url}`);
  if (lineas.length === 0) return '';
  return `
═══════════════════════════════════════════════════════════════════
DATOS DE CONTACTO VERIFICADOS DEL USUARIO (registrados en su perfil):
${lineas.join('\n')}

REGLA: si alguno de estos datos aparece en el encabezado del CV, úsalo
TEXTUALMENTE. NO uses ningún email, teléfono, LinkedIn ni URL que no esté
en la lista de arriba ni en el CV original. Si un campo no está ni en
el CV ni en esta lista, OMÍTELO del encabezado por completo.
═══════════════════════════════════════════════════════════════════
`;
};

const parsearRespuestaMatch = (text) => {
  const cvMatch = text.match(/<CV>([\s\S]*?)<\/CV>/);
  const scoreMatch = text.match(/<SCORE>([\s\S]*?)<\/SCORE>/);
  const analisisMatch = text.match(/<ANALISIS>([\s\S]*?)<\/ANALISIS>/);
  const cambiosMatch = text.match(/<CAMBIOS>([\s\S]*?)<\/CAMBIOS>/);
  const jobMatch = text.match(/<VACANTE>([\s\S]*?)<\/VACANTE>/);
  const kwMatch = text.match(/<KEYWORDS>([\s\S]*?)<\/KEYWORDS>/);
  const dimMatch = text.match(/<DIMENSIONES>([\s\S]*?)<\/DIMENSIONES>/);

  // Parsear análisis en secciones
  let analisis = null;
  if (analisisMatch) {
    const raw = analisisMatch[1].trim();
    const fortalezasMatch = raw.match(/FORTALEZAS:\s*([\s\S]*?)(?=BRECHAS:|$)/i);
    const brechasMatch = raw.match(/BRECHAS:\s*([\s\S]*?)(?=CONCLUSION:|$)/i);
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
    const titleMatch = jobText.match(/titulo:\s*(.+)/i);
    const locationMatch = jobText.match(/ubicacion:\s*(.+)/i);
    const countryMatch = jobText.match(/pais:\s*(.+)/i);
    jobData = {
      title: titleMatch ? titleMatch[1].trim() : '',
      location: locationMatch ? locationMatch[1].trim() : '',
      country: countryMatch ? countryMatch[1].trim() : '',
    };
  }

  // Parsear keywords NLP
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
    changes: cambiosMatch
      ? cambiosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
      : [],
    jobData,
    keywords,
    dimensiones,
  };
};

/**
 * Optimiza un CV al formato Harvard
 * @param {string} cvText           - Texto extraído del CV original
 * @param {string} language         - Código de idioma: 'es' | 'en' | 'pt'
 * @param {object} verifiedProfile  - Datos verificados del perfil del usuario
 *   { nombre1, apellido1, email, telefono1, indicativo1, pais, ciudad, linkedin_url }
 */
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

  if (!client) throw new Error('Claude client no inicializado. Verifica ANTHROPIC_API_KEY en Railway.');

  const callClaude = async () => client.messages.create({
    model: MODELO,
    max_tokens: 8000,
    temperature: 0.2, // bajo para reducir alucinaciones; >0 permite reformulación
    system: [{ type: 'text', text: SISTEMA_BASE, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  });

  const t0 = Date.now();
  console.log(`[optimizeCV] Iniciando con modelo: ${MODELO}`);
  let response;
  try {
    response = await callClaude();
    // Retry una vez si la respuesta llegó sin el delimitador <CV> (parseo fallaría)
    if (!response.content?.[0]?.text || !/<CV>[\s\S]*<\/CV>/.test(response.content[0].text)) {
      console.warn('[optimizeCV] Respuesta sin delimitadores <CV>. Reintentando una vez...');
      response = await callClaude();
    }
  } catch (apiErr) {
    console.error(`[optimizeCV] Error de API Claude (modelo: ${MODELO}):`, apiErr.message, apiErr.status);
    throw apiErr;
  }
  console.log(`[optimizeCV] Claude tardó ${((Date.now() - t0) / 1000).toFixed(1)}s | cache: ${JSON.stringify(response.usage?.cache_read_input_tokens ?? 0)} tokens leídos de caché`);

  const parsed = parsearRespuestaOptimize(response.content[0].text);

  // ── Validación post-hoc anti-alucinación de PII ─────────────────────────────
  // Si Claude inventó un email/telefono/URL, lo eliminamos del CV antes de devolverlo.
  const { cv: cvSaneado, hallucinated } = sanitizarContactoAlucinado(
    parsed.optimizedCV, cvText, verifiedProfile
  );
  if (hallucinated.length > 0) {
    console.warn(`[optimizeCV] PII alucinada eliminada del output: ${hallucinated.join(', ')}`);
    parsed.optimizedCV = cvSaneado;
    parsed.recommendations = parsed.recommendations || [];
    parsed.recommendations.unshift(
      'Algunos datos de contacto se omitieron porque no estaban en tu CV original. ' +
      'Agrégalos manualmente si quieres incluirlos.'
    );
  }

  return parsed;
};

/**
 * Adapta un CV a una vacante específica y calcula el % de match
 * @param {string} cvText           - Texto del CV
 * @param {string} jobText          - Descripción de la vacante
 * @param {string} language         - Idioma de salida
 * @param {object} verifiedProfile  - Datos verificados del perfil del usuario
 */
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
</VACANTE>
<KEYWORDS>
CRITICAS_PRESENTES: [lista de máx 8 keywords/habilidades CRÍTICAS de la vacante que SÍ aparecen en el CV, separadas por coma]
CRITICAS_AUSENTES: [lista de máx 8 keywords/habilidades CRÍTICAS de la vacante que NO aparecen en el CV, separadas por coma]
COMPLEMENTARIAS_PRESENTES: [lista de máx 6 habilidades/herramientas complementarias que SÍ están en el CV, separadas por coma]
COMPLEMENTARIAS_AUSENTES: [lista de máx 6 habilidades/herramientas complementarias que faltan en el CV, separadas por coma]
</KEYWORDS>
<DIMENSIONES>
hard_skills: [0-100, qué tan bien coinciden las habilidades técnicas del CV con las requeridas]
soft_skills: [0-100, qué tan bien se evidencian habilidades blandas como liderazgo, comunicación, trabajo en equipo]
experiencia: [0-100, qué tan adecuado es el nivel y años de experiencia para el cargo]
formato_ats: [0-100, qué tan optimizado está el CV para superar filtros ATS: claridad, estructura, palabras clave]
</DIMENSIONES>`;

  const callClaude = async () => client.messages.create({
    model: MODELO,
    max_tokens: 8000,
    temperature: 0,
    system: [{ type: 'text', text: SISTEMA_BASE, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  });

  const t0 = Date.now();
  let response = await callClaude();
  if (!response.content?.[0]?.text || !/<CV>[\s\S]*<\/CV>/.test(response.content[0].text)) {
    console.warn('[matchCVtoJob] Respuesta sin delimitadores <CV>. Reintentando una vez...');
    response = await callClaude();
  }
  console.log(`[matchCVtoJob] Claude tardó ${((Date.now() - t0) / 1000).toFixed(1)}s | cache: ${JSON.stringify(response.usage?.cache_read_input_tokens ?? 0)} tokens leídos de caché`);

  const parsed = parsearRespuestaMatch(response.content[0].text);

  // Sanitizar PII alucinada en el CV adaptado
  const { cv: cvSaneado, hallucinated } = sanitizarContactoAlucinado(
    parsed.tailoredCV, cvText, verifiedProfile
  );
  if (hallucinated.length > 0) {
    console.warn(`[matchCVtoJob] PII alucinada eliminada del output: ${hallucinated.join(', ')}`);
    parsed.tailoredCV = cvSaneado;
  }

  return parsed;
};

/**
 * Genera respuesta conversacional para el AI Copilot
 */
const generateChatResponse = async (message, history, context) => {
  console.log('[Claude] Generando respuesta RAG Híbrida para:', message.substring(0, 50));

  let retrievedDocs = '';
  try {
    const { searchKnowledgeBase } = require('./geminiService');
    retrievedDocs = await searchKnowledgeBase(message);
    console.log('[Claude] Contexto RAG recuperado con éxito.');
  } catch (e) {
    console.error('[Claude] Error recuperando RAG (Gemini):', e.message);
  }

  const systemPrompt = `Eres "ELVIA", la asistente y mentora experta en crecimiento profesional y reclutamiento para la plataforma "ELVIA". Tu personalidad es empoderadora, profesional y cercana.

TEMAS QUE PUEDES RESPONDER:
- Uso de las funciones de ELVIA (CV Optimizer, CV vs Vacante, Gerente de Búsqueda, Biblioteca, etc.)
- Consejos de carrera: CV, carta de presentación, negociación salarial, LinkedIn
- Procesos de selección: entrevistas, qué buscan los reclutadores, cómo destacar

TEMAS PROHIBIDOS — responde exactamente:
- Política, religión, deportes, etc. → "Ese tema está fuera de mi especialidad."
- Generar código, scripts → "Eso está fuera de mis capacidades."

BASE DE CONOCIMIENTOS (Usa esta información para responder si es relevante):
${retrievedDocs ? retrievedDocs : 'No hay documentos específicos para esta pregunta.'}

Contexto actual del usuario: ${context || 'Navegando en la plataforma'}
`;

  const formattedHistory = (Array.isArray(history) ? history : [])
    .filter(msg => msg && (msg.content || msg.text || msg.message))
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: String(msg.content || msg.text || msg.message || '')
    }));

  formattedHistory.push({ role: 'user', content: message });

  try {
    const response = await client.messages.create({
      model: MODELO_RAPIDO, // Claude 3 Haiku
      max_tokens: 1000,
      temperature: 0.6,
      system: systemPrompt,
      messages: formattedHistory,
    });
    return response.content[0].text;
  } catch (error) {
    console.error('[Claude] Error generando respuesta de chat:', error);
    return "Lo siento, tengo un problema técnico al conectarme con mis servidores. ¿Podrías intentar tu pregunta de nuevo?";
  }
};


/**
 * Evalúa las respuestas de la entrevista y genera feedback
 */
const evaluarEntrevista = async ({ empresa, cargo, entrevistador, preguntas, respuestas, feedbackPorPregunta }) => {
  const pares = preguntas.map((p, i) => `P${i + 1} [${p.tipo}]: ${p.pregunta}\nR: ${respuestas[i] || '(sin respuesta)'}`).join('\n\n')

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
      "feedback": "<feedback específico de 2-3 oraciones>",
      "fortalezas": ["<fortaleza 1>", "<fortaleza 2>"],
      "areas_mejora": ["<mejora 1>", "<mejora 2>"]
    },
    {
      "titulo": "Habilidades Técnicas",
      "puntuacion": <0-10>,
      "feedback": "<feedback específico de 2-3 oraciones>",
      "fortalezas": ["<fortaleza 1>", "<fortaleza 2>"],
      "areas_mejora": ["<mejora 1>", "<mejora 2>"]
    },
    {
      "titulo": "Cierre y Preguntas",
      "puntuacion": <0-10>,
      "feedback": "<feedback específico de 2-3 oraciones>",
      "fortalezas": ["<fortaleza 1>", "<fortaleza 2>"],
      "areas_mejora": ["<mejora 1>", "<mejora 2>"]
    }
  ],
  "recomendaciones": ["<recomendación práctica 1>", "<recomendación 2>", "<recomendación 3>"],
  ${feedbackPorPregunta ? `"detalle": [
    { "id": <número>, "pregunta": "<pregunta>", "calificacion": <1-5>, "comentario": "<feedback específico>" }
  ]` : '"detalle": []'}
}`

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
const analizarLinkedin = async ({ titular, extracto, experiencia, habilidades, educacion, contextoLaboral }) => {
  const secciones = []
  if (titular?.trim()) secciones.push(`TITULAR:\n${titular}`)
  if (extracto?.trim()) secciones.push(`EXTRACTO:\n${extracto}`)
  if (experiencia?.trim()) secciones.push(`EXPERIENCIA:\n${experiencia}`)
  if (habilidades?.trim()) secciones.push(`HABILIDADES:\n${habilidades}`)
  if (educacion?.trim()) secciones.push(`EDUCACION:\n${educacion}`)

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

REGLAS ESTRICTAS DE ÉTICA Y CALIDAD (Anti-Alucinaciones y Anti-Bias):
1. NO inventes ni asumas experiencia laboral, títulos o habilidades que no estén explícitamente en el perfil o sean derivadas lógicas de su trabajo actual. Construye basándote SOLAMENTE en lo que hay.
2. Centra tu análisis estrictamente en el mérito profesional, propuestas de valor y métricas de negocio. Prohibido hacer referencias o sugerencias basadas en edad, género, raza u origen.
3. El campo "ejemplo" debe proveer una redacción lista para usar que respete el estilo y la verdad del candidato, optimizando **exclusivamente** las palabras clave y estructura.

Responde ÚNICAMENTE con un JSON con esta estructura exacta (sin texto extra):
{
  "puntaje_global": <número 0-100>,
  "resumen_global": "<2-3 oraciones evaluando el perfil frente a sus objetivos y su impacto visual en reclutadores>",
  "top_acciones": ["<acción prioritaria 1 enfocada al objetivo>", "<acción prioritaria 2>", "<acción prioritaria 3>"],
  "secciones": {
    "titular": {
      "puntaje": <0-100 o null si no fue enviada>,
      "diagnostico": "<1-2 oraciones de diagnóstico evaluando alineación al objetivo>",
      "fortalezas": ["<punto fuerte>"],
      "mejoras": ["<qué mejorar específicamente>"],
      "ejemplo": "<reescritura sugerida de esta sección optimizada>"
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

/**
 * Extrae datos estructurados de un texto "sucio" de LinkedIn (PDF o Copy-Paste)
 * Usa Haiku para velocidad y economía — es una tarea de extracción/formateo
 */
const extraerDatosLinkedin = async (rawText) => {
  // Truncar para ahorrar tokens si el texto es excesivo
  const fragmento = rawText.substring(0, 10000)

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
- En 'experiencia', trata de mantener el formato descriptivo original.`

  const response = await client.messages.create({
    model: MODELO_RAPIDO,
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  })

  let jsonText = response.content[0].text.trim()
  // Limpieza robusta de markdown
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const rawData = JSON.parse(jsonText)

    // Sanitizar: La IA a veces se pone creativa y devuelve objetos/arrays aunque pidas strings.
    // Convertimos todo a string plano para que los textareas del frontend no rompan.
    const formatEntry = (entry) => {
      if (typeof entry === 'string') return entry
      if (typeof entry === 'object' && entry !== null) {
        return Object.entries(entry)
          .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
          .join(' | ')
      }
      return String(entry)
    }

    const sanitized = {
      titular: typeof rawData.titular === 'string' ? rawData.titular : formatEntry(rawData.titular || ''),
      extracto: typeof rawData.extracto === 'string' ? rawData.extracto : formatEntry(rawData.extracto || ''),
      experiencia: Array.isArray(rawData.experiencia)
        ? rawData.experiencia.map(formatEntry).join('\n\n')
        : formatEntry(rawData.experiencia || ''),
      habilidades: Array.isArray(rawData.habilidades) ? rawData.habilidades.join(', ') : String(rawData.habilidades || ''),
      educacion: Array.isArray(rawData.educacion)
        ? rawData.educacion.map(formatEntry).join('\n\n')
        : formatEntry(rawData.educacion || '')
    }

    return sanitized
  } catch (error) {
    console.error('[extraerDatosLinkedin] Error al parsear/sanitizar JSON de la IA:', error.message)
    throw new Error('La IA no pudo estructurar los datos correctamente. Intenta con el pegado manual.')
  }
}

/**
 * Corrige y estructura los datos del Proyecto Laboral para la Infografía PDF.
 * Asegura redacción ejecutiva y ortografía hispanoamericana perfecta.
 */
const corregirProyectoLaboral = async (proyectoData) => {
  const prompt = `Actúa como un corrector de estilo corporativo experto en el mercado de América Latina.
Revisa el siguiente JSON que contiene la configuración del "Proyecto Laboral" de un profesional.
Tu tarea es corregir la ortografía, la gramática y mejorar sutilmente la redacción para que suene como un perfil ejecutivo de alto nivel, utilizando español hispanoamericano estándar (neutro, sin modismos locales).

No cambies la intención ni las variables, solo mejora los textos (por ej. 'objetivoLaboral', 'empresasMock', etc). Si hay arrays de strings, corrígelos también.

JSON ORIGINAL:
${JSON.stringify(proyectoData, null, 2)}

Devuelve ÚNICAMENTE el JSON estructurado con las mismas llaves, pero con el texto corregido. Valida que el JSON es 100% válido sintácticamente.`

  if (!client) {
    console.warn('[corregirProyectoLaboral] Anthropic client not initialized. Returning raw data.');
    return proyectoData;
  }

  const response = await client.messages.create({
    model: MODELO_RAPIDO,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  let jsonText = response.content[0].text.trim()
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    return JSON.parse(jsonText)
  } catch (error) {
    console.error('[corregirProyectoLaboral] Error:', error.message)
    // Fallback: devolver el original si la IA falla
    return proyectoData
  }
}

/**
 * Genera una carta de presentación para una vacante específica
 */
const generarCarta = async ({ empresa, cargo, descripcion, cvText, language = 'es' }) => {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';

  const cvSeccion = cvText
    ? `\nPERFIL DEL CANDIDATO (extraído de su CV):\n${cvText.slice(0, 3000)}`
    : '';

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

  const response = await client.messages.create({
    model: MODELO,
    max_tokens: 800,
    temperature: 0.7,
    system: [{ type: 'text', text: SISTEMA_BASE, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
};



module.exports = {
  // ── Escritura creativa → Claude Sonnet 4.6 (calidad premium) ──────────────
  optimizeCV,
  matchCVtoJob,
  evaluarEntrevista,
  analizarLinkedin,
  generarCarta,
  optimizarResumen,
  // ── Bot de Chat ELVIA (RAG Híbrido: Claude lee Gemini) ─────────────────────
  generateChatResponse,
  // ── Extracción con PII → Claude Haiku (PII permanece en Anthropic/LGPD) ───
  extraerDatosInfografia,
  extraerDatosLinkedin,
  corregirProyectoLaboral,
  // ── Sin PII → DeepSeek V3 (~70% más barato) ──────────────────────────────
  generarPreguntasEntrevista: require('./deepseekService').generarPreguntasEntrevista,
};
