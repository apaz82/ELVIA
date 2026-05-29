// Orquesta los servicios para cada endpoint de CV
const { parseCV } = require('../utils/cvParser');
const { detectLanguage } = require('../utils/languageDetector');
const {
  optimizeCV,
  matchCVtoJob,
  extraerDatosInfografia,
  corregirProyectoLaboral,
  generarCarta,
  optimizarResumen: optimizarResumenService,
  fusionarResumen: fusionarResumenService,
  optimizarDescripcionExp,
  extractProfileFromCV,
} = require('../services/deepseekService');
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
          weakBullets: resultado.weakBullets || [],
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
      weakBullets: resultado.weakBullets || [],
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
      .select('nombre1, apellido1, email_principal, telefono1, indicativo1, pais, ciudad, linkedin_url, job_search_profile')
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

    // Construir contexto de ubicación para el análisis (no afecta el score)
    const jsp = profileMatch?.job_search_profile || {};
    const ciudadActual = profileMatch?.ciudad || '';
    const paisActual = profileMatch?.pais || '';
    // busca_otras_ciudades y ciudades_preferidas se guardan en job_search_profile.perfil
    const buscaReloc = jsp.perfil?.busca_otras_ciudades ?? false;
    const ciudadesDestino = Array.isArray(jsp.perfil?.ciudades_preferidas)
      ? jsp.perfil.ciudades_preferidas.filter(Boolean)
      : [];
    const contextoUbicacion = {
      ciudadActual,
      paisActual,
      buscaReloc,
      ciudadesDestino,
    };

    const language = req.body.language || 'es';
    const resultado = await matchCVtoJob(cvText, req.body.jobText, language, verifiedProfile, contextoUbicacion);

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
          jobText: (req.body.jobText || '').slice(0, 5000),
          job_fingerprint: (req.body.jobText || '').trim().toLowerCase().slice(0, 300),
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

    // Extraer perfil usando DeepSeek. Pasamos hasta 8000 chars para no perder experiencia/formación.
    const perfil = await extractProfileFromCV(cvText.substring(0, 8000));

    if (!perfil.nombre1) {
      return res.status(400).json({ error: 'No se encontro nombre en el CV. Verifica que sea un CV valido.' });
    }

    // Normalizar aliases defensivos: el modelo a veces devuelve nombres distintos
    if (!perfil.telefono1 && perfil.telefono) perfil.telefono1 = perfil.telefono;
    if (!Array.isArray(perfil.experiencias) && Array.isArray(perfil.experiencia)) {
      perfil.experiencias = perfil.experiencia;
    }

    // Asegurar arrays bien formados
    if (!Array.isArray(perfil.idiomas))      perfil.idiomas      = [];
    if (!Array.isArray(perfil.educacion))    perfil.educacion    = [];
    if (!Array.isArray(perfil.experiencias)) perfil.experiencias = [];
    if (!Array.isArray(perfil.habilidades))  perfil.habilidades  = [];

    // El modelo extrae las experiencias en el orden que aparecen en el CV
    // (normalmente más reciente primero). No se invierte — se respeta el orden original.

    // Validacion de identidad
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

    // Guardar el CV original en cv_results
    const { data: savedCV } = await db.from('cv_results').insert({
      user_id: req.user.id,
      tipo: 'optimize',
      contenido: cvText,
      metadata: { filename: req.file.originalname, extracted: true, subtipo: 'original' }
    }).select('id').single();

    res.json({ ...perfil, mismatch, id: savedCV?.id });

  } catch (err) {
    console.error('extractProfile ERROR:', err.message, err.stack);
    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: 'No se pudo procesar la informacion del CV. Intenta con otro archivo.' });
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

    // Buscar infografía existente del usuario para reemplazarla (upsert por usuario)
    const { data: existingInfografias } = await db
      .from('cv_results')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo', 'optimize')
      .filter('metadata->>subtipo', 'eq', 'infografia_proyecto')
      .order('created_at', { ascending: false })
      .limit(1);

    const existingId = existingInfografias?.[0]?.id || null;

    const { data: profile, error } = await db
      .from('profiles')
      .select('job_search_profile, nombre1, apellido1, salario_esperado, experiencia_anos')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(400).json({ error: 'No se encontró el perfil de búsqueda laboral.' });
    }

    // Si job_search_profile es null (usuario no ha guardado el Gerente aún),
    // se usa un objeto vacío para que la infografía se genere con los datos disponibles.
    if (!profile.job_search_profile) {
      profile.job_search_profile = {};
    }

    // Enriquecer perfil del job_search_profile con campos que se guardan en columnas directas
    // (salario_esperado, años de experiencia, etc. no fluyen automáticamente al JSONB)
    const jspEnriquecido = {
      ...profile.job_search_profile,
      perfil: {
        ...(profile.job_search_profile.perfil || {}),
        ...(profile.salario_esperado ? { salario_esperado: profile.salario_esperado } : {}),
        ...(profile.experiencia_anos ? { experiencia_anios: profile.experiencia_anos } : {}),
      },
    };

    // 1. Corrección IA (Ortografía Hispanoamericana) con fallback robusto
    let proyectoCorregido;
    try {
      proyectoCorregido = await corregirProyectoLaboral(jspEnriquecido);
    } catch (aiErr) {
      console.error('[generarInfografiaProyecto] AI Error:', aiErr.message);
      proyectoCorregido = jspEnriquecido;
    }

    // Adjuntar nombre para la UI
    proyectoCorregido.nombreCandidato = `${profile.nombre1 || ''} ${profile.apellido1 || ''}`.trim() || 'Ejecutivo';

    // 2. Guardar en cv_results — reemplazar si ya existe, insertar si no
    const infografiaPayload = {
      user_id: userId,
      tipo: 'optimize',
      contenido: JSON.stringify(proyectoCorregido),
      metadata: {
        filename: 'Infografia Autoconocimiento.pdf',
        frontend_pdf: true,
        subtipo: 'infografia_proyecto'
      }
    };

    let savedRecord, dbError;
    if (existingId) {
      ({ data: savedRecord, error: dbError } = await db
        .from('cv_results')
        .update({ contenido: infografiaPayload.contenido, metadata: infografiaPayload.metadata })
        .eq('id', existingId)
        .select('id')
        .single());
    } else {
      ({ data: savedRecord, error: dbError } = await db
        .from('cv_results')
        .insert(infografiaPayload)
        .select('id')
        .single());
    }

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
  const { texto, idioma, contextoGerente } = req.body;
  if (!texto) return res.status(400).json({ error: 'Falta el texto a optimizar' });

  try {
    // Usamos el nombre diferenciado del servicio
    const optimizado = await optimizarResumenService(texto, idioma || 'es', contextoGerente || null);

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

// Path A — fusión del resumen extraído del CV + Mi Oferta de Valor (Gerente de Proyecto).
// Devuelve un único resumen profesional optimizado para ATS, sin alucinaciones.
const fusionarResumenController = async (req, res) => {
  const { cv_resumen, oferta_valor, idioma } = req.body || {};
  const cv = String(cv_resumen || '').trim();
  const ov = String(oferta_valor || '').trim();

  if (!cv && !ov) {
    return res.status(400).json({ error: 'Se requiere al menos uno de los textos para fusionar' });
  }

  try {
    const fusionado = await fusionarResumenService(cv, ov, idioma || 'es');
    return res.json({
      fusionado,
      exito: !!fusionado,
      mensaje: 'Resumen fusionado con éxito'
    });
  } catch (err) {
    console.error('[Controller] Error en fusionarResumen:', err.message);
    return res.status(500).json({
      error: err.message,
      mensaje: 'No pudimos fusionar el resumen. Intenta de nuevo en un momento.'
    });
  }
};

const optimizarExpController = async (req, res) => {
  const { texto, cargo, empresa, idioma, contextoGerente } = req.body;
  if (!texto) return res.status(400).json({ error: 'Falta el texto a optimizar' });

  try {
    const optimizado = await optimizarDescripcionExp({ texto, cargo, empresa, idioma: idioma || 'es', contextoGerente: contextoGerente || null });
    const exito = !!optimizado && optimizado !== texto;
    return res.json({
      optimizado: optimizado || texto,
      exito,
      mensaje: exito ? 'Optimizado con éxito' : 'Usando descripción original',
    });
  } catch (err) {
    console.error('[Controller] optimizarExpController:', err.message);
    return res.json({
      optimizado: texto,
      exito: false,
      mensaje: 'Servicio de IA temporalmente indisponible',
    });
  }
};

// POST /api/cv/oferta-valor-ia
const generarOfertaValorIA = async (req, res) => {
  try {
    const { ikigai_amas, ikigai_bueno, ikigai_necesita, ikigai_pagar, hard_skills, soft_skills, niveles_cargo, areas, cultura } = req.body

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Servicio de IA no configurado.' })
    }

    const Anthropic = require('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const culturaStr = Array.isArray(cultura) && cultura.length > 0
      ? cultura.join(', ')
      : null

    const userPrompt = `Eres un experto en branding personal y CVs Harvard ATS-friendly para el mercado latinoamericano.

Información del profesional:
- Lo que AMAS hacer: ${ikigai_amas || 'No especificado'}
- En qué eres MUY BUENO/A: ${ikigai_bueno || 'No especificado'}
- Lo que el MUNDO NECESITA de ti: ${ikigai_necesita || 'No especificado'}
- Por qué podrían PAGARTE: ${ikigai_pagar || 'No especificado'}
- Hard Skills: ${(hard_skills || []).join(', ') || 'No especificadas'}
- Power Skills: ${(soft_skills || []).join(', ') || 'No especificadas'}
- Nivel de cargo objetivo: ${(niveles_cargo || []).join(', ') || 'No especificado'}
- Área funcional: ${(areas || []).join(', ') || 'No especificada'}${culturaStr ? `\n- Cultura y valores de trabajo: ${culturaStr}` : ''}

Redacta una "Oferta de Valor" profesional de 3-4 oraciones (~80-120 palabras) para incluir al inicio de un CV Harvard.
Requisitos:
- Primera persona, voz activa, tono profesional y cercano — que suene a una persona real, no a un manual corporativo
- Usa vocabulario natural del español latinoamericano; evita neologismos y palabras poco usadas (por ejemplo, usa "impulsar" no "impulsionar", "potenciar" no "potencializar")
- FIDELIDAD AL IKIGAI: cada afirmación debe estar respaldada por algo concreto que el profesional escribió; si mencionó una actividad, logro o habilidad específica, úsala literal o parafraseada — nunca la reemplaces por abstracciones genéricas como "lidero proyectos" o "genero impacto"; prohibido inventar logros o atributos que no estén en la información entregada
- Evita frases cliché que no dicen nada: "apasionado por", "orientado a resultados", "pensamiento estratégico", "soluciones innovadoras", "desafíos complejos" — si el dato concreto no está, no lo pongas
- Integra skills y nivel de cargo de forma natural, sin listar${culturaStr ? '\n- Refleja el estilo y cultura de trabajo del profesional de forma auténtica, mencionándolo con naturalidad' : ''}
- Refleja el propósito y diferencial único del profesional
- Lista para copiar-pegar en un CV de élite
Responde ÚNICAMENTE con el texto de la oferta, sin introducción ni etiquetas.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const oferta_valor = response.content[0]?.text?.trim() || ''
    res.json({ oferta_valor })
  } catch (err) {
    console.error('generarOfertaValorIA error:', err.message)
    res.status(500).json({ error: 'Error generando la oferta de valor.' })
  }
}

module.exports = {
  optimize,
  matchToJob,
  download,
  extractProfile,
  generarInfografia,
  generarInfografiaProyecto,
  generarCartaPresentacion,
  optimizarResumen: optimizarResumenController,
  optimizarExp: optimizarExpController,
  fusionarResumen: fusionarResumenController,
  generarOfertaValorIA,
};
