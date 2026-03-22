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

// Genera nombre de archivo con nomenclatura: "CV Optimizado Nombre MMDDAA" o "Optimized CV Name MMDDAA"
const generarNombreArchivo = (contenido, metadata, tipo, extension) => {
  const nombre = contenido?.split('\n')[0]?.trim() || 'CV';
  const lang = metadata?.language || 'es';
  const ahora = new Date();
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  const aa = String(ahora.getFullYear()).slice(-2);
  const fecha = `${mm}${dd}${aa}`;

  if (tipo === 'match') {
    const vacante = metadata?.jobData?.title || 'Vacante';
    return lang === 'en'
      ? `CV ${nombre} – Opt ${vacante} ${fecha}.${extension}`
      : `CV ${nombre} – Opt ${vacante} ${fecha}.${extension}`;
  }

  return lang === 'en'
    ? `Optimized CV ${nombre} ${fecha} Eng.${extension}`
    : `CV Optimizado ${nombre} ${fecha} Esp.${extension}`;
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

    if (format === 'word') {
      const buffer = await generarWord(data.contenido);
      const nombre = generarNombreArchivo(data.contenido, data.metadata, data.tipo, 'docx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
      return res.send(buffer);
    }

    const buffer = await generarPDF(data.contenido);
    const nombre = generarNombreArchivo(data.contenido, data.metadata, data.tipo, 'pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { optimize, matchToJob, download };
