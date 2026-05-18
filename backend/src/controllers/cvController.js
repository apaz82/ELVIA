// Orquesta los servicios para cada endpoint de CV
const { parseCV } = require('../utils/cvParser');
const { detectLanguage } = require('../utils/languageDetector');
const { 
  optimizeCV, 
  matchCVtoJob, 
  extraerDatosInfografia, 
  corregirProyectoLaboral, 
  generarCarta, 
  optimizarResumen: optimizarResumenService 
} = require('../services/claudeService');
const { generarPDF } = require('../services/pdfService');
const { generarWord } = require('../services/wordService');
const { incrementDailyCap } = require('../middleware/dailyCap');

// POST /api/cv/optimize
const optimize = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibio ningun archivo' });
    }

    // Validacion de tamano de archivo (MAX 50MB)
    const MAX_CV_SIZE = 50 * 1024 * 1024;
    if (req.file.size > MAX_CV_SIZE) {
      return res.status(413).json({
        error: 'El archivo es demasiado grande. Maximo 50MB permitido.',
        maxSize: MAX_CV_SIZE,
        receivedSize: req.file.size
      });
    }

    const db = req.supabase;
    const cvText = await parseCV(req.file.buffer, req.file.mimetype);

    // Validacion de longitud de texto (MAX 50K caracteres)
    const MAX_TEXT_LENGTH = 50000;
    if (cvText.length > MAX_TEXT_LENGTH) {
      return res.status(413).json({
        error: 'El CV contiene demasiado texto. Maximo 50,000 caracteres.',
        maxChars: MAX_TEXT_LENGTH,
        receivedChars: cvText.length
      });
    }

    // Validacion de Identidad del Onboarding + carga de datos verificados para anclar el prompt
    const { data: profile } = await db
      .from('profiles')
      .select('nombre1, apellido1, email_principal, telefono1, indicativo1, pais, ciudad, linkedin_url')
      .eq('id', req.user.id)
      .single();
    if (profile) {
      const cvTextNorm = cvText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const n1 = profile.nombre1 ? profile.nombre1.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
      const a1 = profile.apellido1 ? profile.apellido1.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';

      let faltan = false;
      const primerNombre = n1.split(' ')[0];
      const primerApellido = a1.split(' ')[0];

      if (primerNombre && !cvTextNorm.includes(primerNombre)) faltan = true;
      if (primerApellido && !cvTextNorm.includes(primerApellido)) faltan = true;

      if (faltan) {
        return res.status(400).json({ error: 'Este cv no concuerda con la informacion del onboarding.' });
      }
    }

    const verifiedProfile = profile ? {
      nombre1:      profile.nombre1,
      apellido1:    profile.apellido1,
      email:        profile.email_principal || req.user.email,
      telefono1:    profile.telefono1,
      indicativo1:  profile.indicativo1,
      pais:         profile.pais,
      ciudad:       profile.ciudad,
      linkedin_url: profile.linkedin_url,
    } : { email: req.user.email };

    const language = req.body.language || 'es';
    const resultado = await optimizeCV(cvText, language, verifiedProfile);

    // Incrementar contador diario de analisis (hard cap)
    if (req.dailyCapDate) {
      await incrementDailyCap(req.dailyCapDate);
    }

    // 1. Guardar el CV Original (para persistencia en Mis CVs)
    await db.from('cv_results').insert({
      user_id: req.user.id,
      tipo: 'original',
      contenido: cvText,
      metadata: { filename: req.file.originalname, language }
    });

    // 2. Guardar resultado optimizado en Supabase para la descarga posterior
    const { data: saved, error } = await db
      .from('cv_results')
      .insert({
        user_id: req.user.id,
        tipo: 'optimize',
        contenido: resultado.optimizedCV,
        metadata: { 
          changes: resultado.changes, 
          recommendations: resultado.recommendations, 
          language,
          subtipo: 'optimizacion_ia' 
        },
      })
      .select('id')
      .single();

    if (error) throw error;

    // Incrementar contadores de uso
    const nuevoOptimizerCount = (req.planInfo?.cv_optimizer_count || 0) + 1;
    const nuevoUsageCount     = (req.planInfo?.usage_count || 0) + 1;
    await db
      .from('profiles')
      .update({ cv_optimizer_count: nuevoOptimizerCount, usage_count: nuevoUsageCount })
      .eq('id', req.user.id);

    res.json({
      id: saved.id,
      optimizedCV: resultado.optimizedCV,
      changes: resultado.changes,
      recommendations: resultado.recommendations,
      language,
      usageCount: nuevoUsageCount,
      cv_optimizer_count: nuevoOptimizerCount,
      watermark: req.planInfo?.config?.watermark ?? false,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/cv/match
const matchToJob = async (req, res, next) => {
  try {
    if (!req.body.jobText) {
      return res.status(400).json({ error: 'Falta la descripcion de la vacante' });
    }

    // Limites de tamano
    const MAX_CV_SIZE = 50 * 1024 * 1024;
    const MAX_CV_TEXT = 50000;
    const MAX_JOB_TEXT = 10000;

    // Validar jobText
    if ((req.body.jobText || '').length > MAX_JOB_TEXT) {
      return res.status(413).json({
        error: 'La descripcion de la vacante es demasiado larga',
        maxChars: MAX_JOB_TEXT,
        receivedChars: req.body.jobText.length
      });
    }

    const db = req.supabase;
    let cvText;

    if (req.body.cvId) {
      // Usar CV ya optimizado guardado en Supabase
      const { data, error } = await db
        .from('cv_results')
        .select('contenido')
        .eq('id', req.body.cvId)
        .eq('user_id', req.user.id)
        .single();
      if (error || !data) return res.status(404).json({ error: 'CV base no encontrado' });
      cvText = data.contenido;
    } else if (req.file) {
      // Validar tamano de archivo
      if (req.file.size > MAX_CV_SIZE) {
        return res.status(413).json({
          error: 'El archivo es demasiado grande. Maximo 50MB permitido.',
          maxSize: MAX_CV_SIZE,
          receivedSize: req.file.size
        });
      }
      cvText = await parseCV(req.file.buffer, req.file.mimetype);
    } else {
      return res.status(400).json({ error: 'Se requiere un archivo CV o un cvId' });
    }

    // Validar longitud de CV
    if (cvText.length > MAX_CV_TEXT) {
      return res.status(413).json({
        error: 'El CV contiene demasiado texto. Maximo 50,000 caracteres.',
        maxChars: MAX_CV_TEXT,
        receivedChars: cvText.length
      });
    }

    // Cargar perfil verificado para anclar el prompt y prevenir alucinación de PII
    const { data: profileMatch } = await db
      .from('profiles')
      .select('nombre1, apellido1, email_principal, telefono1, indicativo1, pais, ciudad, linkedin_url')
      .eq('id', req.user.id)
      .single();
    const verifiedProfile = profileMatch ? {
      nombre1:      profileMatch.nombre1,
      apellido1:    profileMatch.apellido1,
      email:        profileMatch.email_principal || req.user.email,
      telefono1:    profileMatch.telefono1,
      indicativo1:  profileMatch.indicativo1,
      pais:         profileMatch.pais,
      ciudad:       profileMatch.ciudad,
      linkedin_url: profileMatch.linkedin_url,
    } : { email: req.user.email };

    const language = req.body.language || 'es';
    const resultado = await matchCVtoJob(cvText, req.body.jobText, language, verifiedProfile);

    // Incrementar contador diario de analisis (hard cap)
    if (req.dailyCapDate) {
      await incrementDailyCap(req.dailyCapDate);
    }

    const { data: saved, error } = await db
      .from('cv_results')
      .insert({
        user_id: req.user.id,
        tipo: 'match',
        contenido: resultado.tailoredCV,
        metadata: {
          changes: resultado.changes,
          matchScore: resultado.matchScore,
          analisis: resultado.analisis,
          jobData: resultado.jobData,
          keywords: resultado.keywords,
          dimensiones: resultado.dimensiones,
          language,
        },
      })
      .select('id')
      .single();

    if (error) throw error;

    // Incrementar contadores de uso
    const nuevoMatchCount = (req.planInfo?.cv_match_count || 0) + 1;
    const nuevoUsageCount = (req.planInfo?.usage_count || 0) + 1;
    await db
      .from('profiles')
      .update({ cv_match_count: nuevoMatchCount, usage_count: nuevoUsageCount })
      .eq('id', req.user.id);

    res.json({
      id: saved.id,
      tailoredCV: resultado.tailoredCV,
      matchScore: resultado.matchScore,
      analisis: resultado.analisis,
      changes: resultado.changes,
      jobData: resultado.jobData,
      keywords: resultado.keywords,
      dimensiones: resultado.dimensiones,
      language,
      usageCount: nuevoUsageCount,
      cv_match_count: nuevoMatchCount,
      watermark: req.planInfo?.config?.watermark ?? false,
    });
  } catch (err) {
    next(err);
  }
};

// Genera nombre de archivo con nomenclatura: "CV Optimizado - Nombre Apellido - MMDDAA"
const sanitizarNombre = (texto) => {
  // Remover acentos y caracteres especiales para compatibilidad con antivirus
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos)
    .replace(/[^a-zA-Z0-9\s\-]/g, '') // Solo alfanuméricos, espacios y guiones
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();
};

const generarNombreArchivo = (contenido, metadata, tipo, extension) => {
  let nombre = contenido?.split('\n')[0]?.trim() || 'Candidato';
  // Limpiar el nombre de caracteres que no deberian ir en un filename (ej: |)
  nombre = nombre.split('|')[0].trim();
  nombre = sanitizarNombre(nombre);

  const lang = metadata?.language || 'es';
  const ahora = new Date();
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  const aa = String(ahora.getFullYear()).slice(-2);
  const fecha = `${mm}${dd}${aa}`;

  // Formato: CV Adaptado - [Nombre Vacante] - [Nombre Usuario] - MMDDAA
  if (tipo === 'match') {
    let vacante = metadata?.jobData?.title || 'Vacante';
    vacante = sanitizarNombre(vacante);
    return `CV Adaptado - ${vacante} - ${nombre} - ${fecha}.${extension}`;
  }

  // Formato: CV_nombre apellido - original DDMMAA
  if (tipo === 'original') {
    const d = new Date();
    const ddmmaa = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
    return `CV_${nombre} - original ${ddmmaa}.${extension}`;
  }

  // Formato: CV Optimizado - Nombre Apellido - MMDDAA
  return `CV Optimizado - ${nombre} - ${fecha}.${extension}`;
};

// GET /api/cv/download/:id?format=pdf|word
const download = async (req, res, next) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'pdf';
    const db = req.supabase;

    const { data, error } = await db
      .from('cv_results')
      .select('contenido, metadata, tipo, user_id')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Resultado no encontrado' });
    }

    if (data.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso para acceder a este recurso' });
    }

    const watermark = req.planInfo?.config?.watermark ?? false;

    if (req.query.format === 'word') {
      const buffer = await generarWord(data.contenido, { watermark });
      const nombre = generarNombreArchivo(data.contenido, data.metadata, data.tipo, 'docx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(buffer);
    }

    const buffer = await generarPDF(data.contenido, { watermark });
    const nombre = generarNombreArchivo(data.contenido, data.metadata, data.tipo, 'pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// POST /api/cv/extract-profile
// Extrae datos del CV para pre-llenar el wizard de CVDesdeCero.
// Devuelve mismatch:true si el nombre/apellido del CV no coincide con el perfil registrado
// (en lugar de un 400) para que el frontend pueda gestionar el flujo de confirmacion.
const extractProfile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio ningun archivo' });

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('extractProfile: ANTHROPIC_API_KEY no configurada en Railway');
      return res.status(500).json({ error: 'Servicio de IA no configurado. Contacta soporte.' });
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let cvText;
    try {
      cvText = await parseCV(req.file.buffer, req.file.mimetype);
    } catch (parseErr) {
      console.error('extractProfile [parseCV]:', parseErr.message);
      return res.status(400).json({ error: 'No se pudo leer el archivo. Usa un PDF o Word sin contraseña.' });
    }
    if (!cvText || cvText.trim().length === 0) {
      return res.status(400).json({ error: 'No se pudo extraer texto del CV. Verifica que sea un PDF o Word valido.' });
    }

    const fragmento = cvText.substring(0, 4000);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Extract information from this resume/CV. Reply ONLY with valid JSON, no additional text. Use null or empty array when data is not found.

CRITICAL DISTINCTION — read carefully:
- "educacion" = academic degrees, diplomas, certifications from schools/universities. "titulo" is the NAME OF THE DEGREE (e.g. "Ingenieria Industrial", "Maestria en Finanzas", "Diplomado en Six Sigma"). NEVER put a job title or position in "titulo". A job title like "Auditor", "Gerente", "Analista" is NEVER an education entry.
- "experiencias" = jobs/work positions. "cargo" is the job title (e.g. "Auditor Interno", "Gerente de Ventas").

Rules:
- "pais" field: full country name in Spanish (e.g. "Mexico", "Colombia", "Espana"). Infer from city, address, phone code, or any context clue.
- "idiomas": CEFR level. "fluent/advanced" -> C1; "intermediate" -> B2; "basic" -> A2; "native/mother tongue" -> Nativo.
- "educacion": max 4 entries. ONLY real academic institutions (universities, schools, certification bodies). "nivel" must be one of: "Preparatoria / Bachillerato", "Tecnico / Tecnologo", "Universidad / Licenciatura", "Especializacion", "Maestria", "Doctorado", "Certificacion Profesional".
- IMPORTANT: Keep "resumen", "experiencias[].descripcion" and "habilidades" in the ORIGINAL LANGUAGE of the CV. Do NOT translate them.
- "experiencias": last 4 jobs. Keep descriptions in original language.
- "habilidades": up to 12 skills in original language of the CV.
- "resumen": profile/summary section from the beginning of the CV in original language, or null if not present.
- "cargo_actual": most recent job title in original language, or null.
- "edad": integer or null.

CV text:
${fragmento}

Return ONLY this JSON:
{
  "nombre1": "first name",
  "nombre2": "second name or null",
  "apellido1": "first surname",
  "apellido2": "second surname or null",
  "telefono1": "phone or null",
  "ciudad": "city or null",
  "pais": "country in Spanish or null",
  "edad": null,
  "cargo_actual": "most recent title (original language) or null",
  "resumen": "profile summary (original language) or null",
  "idiomas": [{ "idioma": "Ingles", "nivel": "B2" }],
  "educacion": [{ "nivel": "Universidad / Licenciatura", "titulo": "Ingenieria Industrial Administrativa", "institucion": "Universidad de Celaya", "anio": "2010" }],
  "experiencias": [{ "empresa": "...", "cargo": "...", "fecha_inicio": "...", "fecha_fin": "...", "descripcion": "..." }],
  "habilidades": ["Excel", "Leadership", "Power BI"]
}`,
      }],
    });

    if (!response.content || !response.content[0]) {
      return res.status(500).json({ error: 'Respuesta invalida de la IA. Intenta de nuevo.' });
    }

    let jsonText = response.content[0].text.trim();
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const perfil = JSON.parse(jsonText);

    if (!perfil.nombre1) {
      return res.status(400).json({ error: 'No se encontro nombre en el CV. Verifica que sea un CV valido.' });
    }

    // Asegurar arrays bien formados
    if (!Array.isArray(perfil.idiomas))      perfil.idiomas      = [];
    if (!Array.isArray(perfil.educacion))    perfil.educacion    = [];
    if (!Array.isArray(perfil.experiencias)) perfil.experiencias = [];
    if (!Array.isArray(perfil.habilidades))  perfil.habilidades  = [];

    // Invertir experiencias para que vayan de más reciente a más antigua (reverse-chronological)
    if (perfil.experiencias.length > 0) {
      perfil.experiencias = perfil.experiencias.reverse();
    }

    // Validacion de identidad: compara nombre/apellido extraido con el perfil registrado.
    // Devuelve mismatch:true (no 400) para que el frontend gestione el banner de confirmacion.
    const db = req.supabase;
    const { data: registeredProfile } = await db
      .from('profiles')
      .select('nombre1, apellido1')
      .eq('id', req.user.id)
      .maybeSingle();

    let mismatch = false;
    if (registeredProfile && (registeredProfile.nombre1 || registeredProfile.apellido1)) {
      const norm = (s) => (s || '').toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ')[0];
      const cvN  = norm(perfil.nombre1);
      const cvA  = norm(perfil.apellido1);
      const regN = norm(registeredProfile.nombre1);
      const regA = norm(registeredProfile.apellido1);
      if ((regN && cvN && regN !== cvN) || (regA && cvA && regA !== cvA)) {
        mismatch = true;
      }
    }

    // Guardar el CV original en cv_results para que aparezca en Mis CVs
    const { data: savedCV } = await db.from('cv_results').insert({
      user_id: req.user.id,
      tipo: 'optimize', // Forzar 'optimize' por compatibilidad con constraints de DB
      contenido: cvText,
      metadata: { filename: req.file.originalname, extracted: true, subtipo: 'original' }
    }).select('id').single();

    res.json({ ...perfil, mismatch, id: savedCV?.id });

  } catch (err) {
    console.error('extractProfile ERROR:', err.message, err.stack);
    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: 'No se pudo procesar la informacion del CV. Intenta con otro archivo.' });
    }
    if (err.status === 401 || err.status === 403) {
      console.error('extractProfile: Anthropic auth error - verificar ANTHROPIC_API_KEY');
      return res.status(500).json({ error: 'Error de autenticacion con servicio de IA.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Servicio de IA saturado. Intenta en unos segundos.' });
    }
    res.status(500).json({ error: 'Error al procesar el CV. Intenta de nuevo.' });
  }
};

// GET /api/cv/infografia/:id — extrae JSON estructurado para el componente visual
const generarInfografia = async (req, res, next) => {
  try {
    const { id } = req.params
    const db = req.supabase

    const { data, error } = await db
      .from('cv_results')
      .select('contenido, user_id')
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'CV no encontrado' })
    if (data.user_id !== req.user.id) return res.status(403).json({ error: 'Sin permiso' })

    const infografia = await extraerDatosInfografia(data.contenido)
    res.json(infografia)
  } catch (err) {
    next(err)
  }
}

// POST /api/cv/infografia-proyecto
// Genera una versión corregida ortográficamente del proyecto laboral y la guarda para visualización
const generarInfografiaProyecto = async (req, res, next) => {
  try {
    const db = req.supabase;
    const userId = req.user.id;

    const { data: profile, error } = await db
      .from('profiles')
      .select('job_search_profile, nombre1, apellido1')
      .eq('id', userId)
      .single();

    if (error || !profile || !profile.job_search_profile) {
      return res.status(400).json({ error: 'No se encontró el perfil de búsqueda laboral.' });
    }

    // 1. Corrección IA (Ortografía Hispanoamericana) con fallback robusto
    let proyectoCorregido;
    try {
      proyectoCorregido = await corregirProyectoLaboral(profile.job_search_profile);
    } catch (aiErr) {
      console.error('[generarInfografiaProyecto] AI Error:', aiErr.message);
      proyectoCorregido = profile.job_search_profile;
    }

    // Adjuntar nombre para la UI
    proyectoCorregido.nombreCandidato = `${profile.nombre1 || ''} ${profile.apellido1 || ''}`.trim() || 'Ejecutivo';

    // 2. Guardar en cv_results como registro persistente (Bypassing potential Enum constraints)
    const { data: savedRecord, error: dbError } = await db
      .from('cv_results')
      .insert({
        user_id: userId,
        tipo: 'infografia_proyecto', // Tipo diferente para no mezclar con CVs reales
        contenido: JSON.stringify(proyectoCorregido),
        metadata: {
          filename: `Plan de Carrera Ejecutivo.pdf`,
          frontend_pdf: true,
          subtipo: 'infografia_proyecto'
        }
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[generarInfografiaProyecto] DB Error:', dbError.message);
      throw dbError;
    }

    // 3. Devolver datos corregidos (Flattened para evitar errores de respData.data.id)
    res.json({ id: savedRecord.id, datosCorregidos: proyectoCorregido });
  } catch (err) {
    console.error('[generarInfografiaProyecto] Fatal Error:', err.message);
    next(err);
  }
};

// POST /api/cv/carta
const generarCartaPresentacion = async (req, res, next) => {
  try {
    const { empresa, cargo, descripcion, cvId, language } = req.body;
    if (!cargo && !descripcion) {
      return res.status(400).json({ error: 'Se requiere al menos el cargo o descripción de la vacante' });
    }

    let cvText = null;
    if (cvId) {
      const { data } = await req.supabase
        .from('cv_results')
        .select('contenido')
        .eq('id', cvId)
        .eq('user_id', req.user.id)
        .single();
      cvText = data?.contenido || null;
    }

    const carta = await generarCarta({ empresa, cargo, descripcion, cvText, language: language || 'es' });
    res.json({ carta });
  } catch (err) {
    next(err)
  }
};

const optimizarResumenController = async (req, res, next) => {
  const { texto, idioma } = req.body;
  if (!texto) return res.status(400).json({ error: 'Falta el texto a optimizar' });

  try {
    // Usamos el nombre diferenciado del servicio
    const optimizado = await optimizarResumenService(texto, idioma || 'es');
    
    const exito = !!optimizado && optimizado !== texto;
    
    return res.json({ 
      optimizado: optimizado || texto, 
      exito,
      mensaje: exito ? 'Optimizado con éxito' : 'Usando borrador original'
    });
  } catch (err) {
    console.error('[Controller] Error crítico capturado:', err.message);
    return res.json({ 
      optimizado: texto, 
      exito: false, 
      error: err.message,
      mensaje: 'Servicio de IA temporalmente indisponible' 
    });
  }
};

module.exports = { 
  optimize, 
  matchToJob, 
  download, 
  extractProfile, 
  generarInfografia, 
  generarInfografiaProyecto, 
  generarCartaPresentacion,
  optimizarResumen: optimizarResumenController
};
