// Orquesta los servicios para cada endpoint de CV
const { parseCV } = require('../utils/cvParser');
const { detectLanguage } = require('../utils/languageDetector');
const { optimizeCV, matchCVtoJob } = require('../services/claudeService');
const { generarPDF } = require('../services/pdfService');
const { generarWord } = require('../services/wordService');

// POST /api/cv/optimize
const optimize = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const db = req.supabase;
    const cvText = await parseCV(req.file.buffer, req.file.mimetype);
    const language = req.body.language || 'es';
    const resultado = await optimizeCV(cvText, language);

    // Guardar resultado en Supabase para la descarga posterior
    const { data: saved, error } = await db
      .from('cv_results')
      .insert({
        user_id: req.user.id,
        tipo: 'optimize',
        contenido: resultado.optimizedCV,
        metadata: { changes: resultado.changes, recommendations: resultado.recommendations, language },
      })
      .select('id')
      .single();

    if (error) throw error;

    // Incrementar usage_count solo si todo fue exitoso
    await db
      .from('profiles')
      .update({ usage_count: req.usageCount + 1 })
      .eq('id', req.user.id);

    res.json({
      id: saved.id,
      optimizedCV: resultado.optimizedCV,
      changes: resultado.changes,
      recommendations: resultado.recommendations,
      language,
      usageCount: req.usageCount + 1,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/cv/match
const matchToJob = async (req, res, next) => {
  try {
    if (!req.body.jobText) {
      return res.status(400).json({ error: 'Falta la descripción de la vacante' });
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
      cvText = await parseCV(req.file.buffer, req.file.mimetype);
    } else {
      return res.status(400).json({ error: 'Se requiere un archivo CV o un cvId' });
    }

    const language = req.body.language || 'es';
    const resultado = await matchCVtoJob(cvText, req.body.jobText, language);

    const { data: saved, error } = await db
      .from('cv_results')
      .insert({
        user_id: req.user.id,
        tipo: 'match',
        contenido: resultado.tailoredCV,
        metadata: {
          changes: resultado.changes,
          matchScore: resultado.matchScore,
          jobData: resultado.jobData,
          language,
        },
      })
      .select('id')
      .single();

    if (error) throw error;

    await db
      .from('profiles')
      .update({ usage_count: req.usageCount + 1 })
      .eq('id', req.user.id);

    res.json({
      id: saved.id,
      tailoredCV: resultado.tailoredCV,
      matchScore: resultado.matchScore,
      analisis: resultado.analisis,
      changes: resultado.changes,
      jobData: resultado.jobData,
      language,
      usageCount: req.usageCount + 1,
    });
  } catch (err) {
    next(err);
  }
};

// Genera nombre de archivo con nomenclatura: "CV Optimizado - Nombre Apellido - MMDDAA"
const generarNombreArchivo = (contenido, metadata, tipo, extension) => {
  let nombre = contenido?.split('\n')[0]?.trim() || 'Candidato';
  // Limpiar el nombre de caracteres que no deberían ir en un filename (ej: |)
  nombre = nombre.split('|')[0].trim();
  
  const lang = metadata?.language || 'es';
  const ahora = new Date();
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  const aa = String(ahora.getFullYear()).slice(-2);
  const fecha = `${mm}${dd}${aa}`;

  // Formato: CV Adaptado - [Nombre Vacante] - [Nombre Usuario] - MMDDAA
  if (tipo === 'match') {
    const vacante = metadata?.jobData?.title || 'Vacante';
    return `CV Adaptado - ${vacante} - ${nombre} - ${fecha}.${extension}`;
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

    if (req.query.format === 'word') {
      const buffer = await generarWord(data.contenido);
      const nombre = generarNombreArchivo(data.contenido, data.metadata, data.tipo, 'docx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      // RFC 6266 for UTF-8 filenames
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`);
      return res.send(buffer);
    }

    const buffer = await generarPDF(data.contenido);
    const nombre = generarNombreArchivo(data.contenido, data.metadata, data.tipo, 'pdf');
    res.setHeader('Content-Type', 'application/pdf');
    // RFC 6266 for UTF-8 filenames
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// POST /api/cv/extract-profile — extrae datos personales del CV para pre-llenar onboarding
const extractProfile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic();

    const cvText = await parseCV(req.file.buffer, req.file.mimetype);
    const fragmento = cvText.substring(0, 4000);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Extrae la siguiente información del CV. Responde SOLO con JSON válido, sin texto adicional. Si no encuentras un dato, usa null o array vacío según corresponda.

Para el campo "pais", devuelve el nombre completo del país en español (ej: "México", "Colombia", "Argentina", "España"). Infiere el país a partir de la ciudad, dirección, código de área telefónico, o cualquier otra pista en el CV.

Para "idiomas": extrae todos los idiomas mencionados con su nivel CEFR (A1,A2,B1,B2,C1,C2,Nativo). Si el CV dice "fluido", "avanzado" → C1; "intermedio" → B2; "básico" → A2; "nativo" o idioma materno → Nativo.

Para "educacion": extrae todas las entradas de educación (máximo 4). El campo "nivel" debe ser uno de: "Preparatoria / Bachillerato", "Técnico / Tecnólogo", "Universidad / Licenciatura", "Especialización", "Maestría", "Doctorado", "Certificación Profesional".

CV:
${fragmento}

Formato de respuesta:
{
  "nombre1": "primer nombre",
  "nombre2": "segundo nombre o null",
  "apellido1": "primer apellido",
  "apellido2": "segundo apellido o null",
  "telefono1": "teléfono principal o null",
  "ciudad": "ciudad de residencia o null",
  "pais": "país inferido en español o null",
  "edad": número entero o null,
  "idiomas": [{ "idioma": "Inglés", "nivel": "B2" }],
  "educacion": [{ "nivel": "Universidad / Licenciatura", "titulo": "Ingeniería Industrial", "institucion": "UNAM", "anio": "2018" }]
}`,
      }],
    });

    let jsonText = response.content[0].text.trim();
    // Limpiar markdown si Claude lo envuelve en ```json ... ```
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const perfil = JSON.parse(jsonText);
    // Garantizar arrays aunque Claude devuelva null
    if (!Array.isArray(perfil.idiomas))   perfil.idiomas   = [];
    if (!Array.isArray(perfil.educacion)) perfil.educacion = [];
    res.json(perfil);
  } catch (err) {
    console.error('Error en extractProfile:', err.message);
    res.json({ nombre1: null, nombre2: null, apellido1: null, apellido2: null, telefono1: null, ciudad: null, pais: null, edad: null, idiomas: [], educacion: [] });
  }
};

module.exports = { optimize, matchToJob, download, extractProfile };
