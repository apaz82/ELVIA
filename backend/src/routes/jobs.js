const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const auth                = require('../middleware/auth');
const { planContext }     = require('../middleware/planContext');
const checkCvMatchLimit   = require('../middleware/checkCvMatchLimit');
const requireActiveTrial  = require('../middleware/requireActiveTrial');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Genera una clave única por usuario+vacante
const generarJobKey = (title, company) =>
  `${(title || '').toLowerCase().trim()}|${(company || '').toLowerCase().trim()}`;

// Dominios permitidos para fetch de vacantes (whitelist anti-SSRF)
const ALLOWED_JOB_DOMAINS = [
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'computrabajo.com',
  'occ.com.mx', 'bumeran.com', 'elempleo.com', 'trabajando.com',
  'infojobs.net', 'zonajobs.com.ar', 'laborum.com', 'multitrabajos.com',
  'hh.ru', 'monster.com', 'simplyhired.com', 'ziprecruiter.com',
  'angel.co', 'wellfound.com', 'greenhouse.io', 'lever.co',
  'workday.com', 'smartrecruiters.com', 'jobs.ashbyhq.com',
];

const isAllowedJobUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const hostname = parsed.hostname.replace(/^www\./, '');
    return ALLOWED_JOB_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

// POST /api/jobs/fetch-url — obtiene el texto de una página de vacante
router.post('/fetch-url', auth, async (req, res) => {
  const { url } = req.body;

  if (!url || !isAllowedJobUrl(url)) {
    return res.status(400).json({ error: 'URL inválida o dominio no permitido. Por favor pega la descripción manualmente.' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return res.status(403).json({
          error: 'Acceso bloqueado por el sitio web (Indeed/LinkedIn). Por seguridad, estos sitios bloquean lectores automáticos. Te recomendamos copiar y pegar la descripción manualmente en la otra pestaña.'
        });
      }
      return res.status(400).json({ error: `No se pudo acceder a la URL (Error ${response.status})` });
    }

    // Validar content-type (solo HTML o texto)
    const contentType = response.headers.get('content-type');
    if (!contentType || (!contentType.includes('text/html') && !contentType.includes('text/plain'))) {
      return res.status(400).json({
        error: 'La URL no devuelve HTML válido. Por favor pega la descripción manualmente.'
      });
    }

    // Validar tamaño de respuesta (no descargar >10MB)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      return res.status(413).json({
        error: 'La página es demasiado grande. Por favor pega la descripción manualmente.'
      });
    }

    const html = await response.text();

    // Extrae solo el texto relevante eliminando HTML
    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')   // elimina scripts
      .replace(/<style[\s\S]*?<\/style>/gi, '')      // elimina estilos
      .replace(/<[^>]+>/g, ' ')                      // elimina tags HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, '\n')                      // colapsa espacios múltiples
      .trim();

    // Limitar el texto crudo antes de enviarlo a Claude
    const textoRecortado = texto.length > 12000 ? texto.slice(0, 12000) : texto;

    // Usar Claude para extraer solo la descripción de la vacante
    const respuesta = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Del siguiente texto extraído de una página web de empleo, extrae ÚNICAMENTE la descripción de la vacante: título del puesto, empresa, ubicación, descripción del rol, requisitos y beneficios. Elimina navegación, menús, empleos similares, publicidad y cualquier otro contenido que no sea la oferta de trabajo en sí. Responde solo con el texto limpio de la vacante, sin explicaciones.\n\nTEXTO:\n${textoRecortado}`,
      }],
    });

    res.json({ text: respuesta.content[0].text.trim() });
  } catch (err) {
    console.error('[fetch-url]', err.message);
    res.status(500).json({ error: 'No se pudo obtener la página. Intenta pegar la descripción manualmente.' });
  }
});

// Busca en Jooble
const searchJooble = async ({ title, location, datecreated, employment_type, experience, radius, salary, page }) => {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];
  try {
    const body = { keywords: title, location: location || '', resultsOnPage: 15, page: parseInt(page) || 1 };
    if (datecreated)     body.datecreated     = datecreated;
    if (employment_type) body.employment_type = employment_type;
    if (experience)      body.experience      = experience;
    if (radius)          body.radius          = parseInt(radius);
    if (salary)          body.salary          = parseInt(salary);

    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map(j => ({
      id: `jooble-${j.id}`, title: j.title, company: j.company,
      location: j.location, salary: j.salary || null,
      snippet: j.snippet, link: j.link, updated: j.updated, fuente: 'Jooble',
    }));
  } catch { return []; }
};

// Busca en Google Jobs via SerpApi
const searchGoogleJobs = async ({ title, location, datecreated }) => {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({
      engine:   'google_jobs',
      q:        title,
      location: location || '',
      hl:       'es',
      api_key:  apiKey,
    });
    if (datecreated) {
      const chipMap = { '1': 'date_posted:today', '3': 'date_posted:3days', '7': 'date_posted:week', '30': 'date_posted:month' };
      if (chipMap[datecreated]) params.set('chips', chipMap[datecreated]);
    }

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs_results || []).map((j, i) => ({
      id:       `serp-${i}-${j.title}`,
      title:    j.title,
      company:  j.company_name,
      location: j.location,
      salary:   j.detected_extensions?.salary_range || null,
      snippet:  j.description?.slice(0, 300) || '',
      link:     j.apply_options?.[0]?.link || j.related_links?.[0]?.link || j.share_link || '',
      via:      j.apply_options?.[0]?.title || null,
      updated:  j.detected_extensions?.posted_at || null,
      fuente:   'Google Jobs',
    }));
  } catch { return []; }
};

// Expande el título del cargo con sinónimos usando Claude
const expandirCargo = async (title) => {
  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Para el cargo "${title}", genera una lista de 4-6 títulos sinónimos o equivalentes en el mercado laboral de LATAM y USA (en español e inglés). Responde SOLO con los títulos separados por comas, sin explicaciones. Ejemplo para "Country Manager": Director General, General Manager, Managing Director, CEO, Gerente General, Country Director`,
      }],
    });
    const sinonimos = resp.content[0].text.trim().split(',').map(s => s.trim()).filter(Boolean);
    // Combinar cargo original con sinónimos, máx 4 términos para no saturar la búsqueda
    return [title, ...sinonimos.slice(0, 3)].join(' OR ');
  } catch {
    return title;
  }
};

// GET /api/jobs/similar
// Soporta dos modos:
//   ?title=  → búsqueda por cargo (expande con sinónimos)
//   ?keywords= → búsqueda por palabras clave/frases (sin expansión)
router.get('/similar', auth, async (req, res) => {
  const { title, keywords, location, datecreated, employment_type, experience, radius, salary, page } = req.query;

  const modoKeywords = !!keywords && !title;
  const queryOriginal = keywords || title;

  if (!queryOriginal) return res.status(400).json({ error: 'Se requiere el cargo o palabras clave' });

  try {
    // Modo cargo: expandir con sinónimos. Modo keywords: usar directo.
    const queryBusqueda = modoKeywords ? queryOriginal : await expandirCargo(title);
    console.log(`[jobs/similar] Modo: ${modoKeywords ? 'keywords' : 'cargo'} | Query: "${queryBusqueda}"`);

    const [joobleResults, googleResults] = await Promise.all([
      searchJooble({ title: queryBusqueda, location, datecreated, employment_type, experience, radius, salary, page }),
      searchGoogleJobs({ title: queryBusqueda, location, datecreated }),
    ]);

    console.log(`[jobs/similar] Jooble: ${joobleResults.length} | Google Jobs: ${googleResults.length}`);

    // Combinar y deduplicar
    const vistos = new Set();
    const rawVacantes = [...joobleResults, ...googleResults].filter(v => {
      const key = `${v.title?.toLowerCase().trim()}|${v.company?.toLowerCase().trim()}`;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });

    if (rawVacantes.length === 0) return res.json({ vacantes: [], total: 0 });

    // Filtrar con Claude según el modo de búsqueda
    const listaParaFiltrar = rawVacantes
      .map((v, i) => `${i}. ${v.title} | ${v.company || ''}`)
      .join('\n');

    const promptFiltro = modoKeywords
      ? `Se buscó con las palabras clave: "${queryOriginal}". De esta lista, devuelve los índices de vacantes que estén relacionadas con estas palabras clave. Incluye vacantes que coincidan aunque sea parcialmente. Responde únicamente con los índices separados por comas.\n\n${listaParaFiltrar}`
      : `Se buscó el cargo: "${title}". De esta lista, devuelve SOLO los índices de vacantes relevantes para ese cargo. Excluye solo las que sean de un área completamente distinta. Responde únicamente con los índices separados por comas.\n\n${listaParaFiltrar}`;

    const filtroResp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: promptFiltro }],
    });

    const indicesTexto = filtroResp.content[0].text.trim();
    const indicesValidos = new Set(
      indicesTexto.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    );

    const vacantes = indicesValidos.size > 0
      ? rawVacantes.filter((_, i) => indicesValidos.has(i))
      : rawVacantes;

    res.json({ vacantes, total: vacantes.length });
  } catch (err) {
    console.error('[jobs/similar]', err.message);
    res.status(500).json({ error: 'Error al buscar vacantes' });
  }
});

// POST /api/jobs/compatibility — score rápido CV vs vacante (con cache por usuario)
router.post('/compatibility', auth, planContext, checkCvMatchLimit, async (req, res) => {
  const { cvText, jobTitle, jobCompany, jobSnippet, jobLink, jobLocation, jobVia } = req.body;

  // Límites de tamaño
  const MAX_CV_TEXT = 50000;
  const MAX_JOB_TEXT = 10000;

  // Validar datos básicos
  if (!cvText || !jobTitle) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  // Validar tamaños
  if (cvText.length > MAX_CV_TEXT) {
    return res.status(413).json({
      error: 'El CV es demasiado largo para analizar',
      maxChars: MAX_CV_TEXT
    });
  }

  if ((jobSnippet || '').length > MAX_JOB_TEXT) {
    return res.status(413).json({
      error: 'La descripción de la vacante es demasiado larga',
      maxChars: MAX_JOB_TEXT
    });
  }

  const db = req.supabase;
  const jobKey = generarJobKey(jobTitle, jobCompany);

  try {
    // 1. Verificar cache — si ya fue analizado, devolver sin cobrar crédito
    const { data: cached } = await db
      .from('job_checks')
      .select('score, motivos')
      .eq('job_key', jobKey)
      .maybeSingle();

    if (cached) {
      console.log(`[compatibility] Cache hit: ${jobKey}`);
      return res.json({ score: cached.score, motivos: cached.motivos, fromCache: true });
    }

    // 2. Llamar a Claude (los límites ya fueron verificados por checkCvMatchLimit)
    const respuesta = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analiza la compatibilidad entre este CV y la vacante. Responde ÚNICAMENTE en este formato exacto:

SCORE: [número 0-100]
MOTIVOS:
- [motivo positivo o negativo breve en español]
- [motivo positivo o negativo breve en español]
- [motivo positivo o negativo breve en español]

CV:
${cvText.slice(0, 2000)}

VACANTE: ${jobTitle}
${jobSnippet || ''}`,
      }],
    });

    const texto = respuesta.content[0].text.trim();
    const scoreMatch  = texto.match(/SCORE:\s*(\d+)/i);
    const motivosMatch = texto.match(/MOTIVOS:\s*([\s\S]+)/i);

    const score   = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const motivos = motivosMatch
      ? motivosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
      : [];

    // 3. Guardar en cache (con datos de la vacante) e incrementar contadores
    const jobData = {
      title: jobTitle, company: jobCompany || '',
      location: jobLocation || '', link: jobLink || '', via: jobVia || '',
      snippet: jobSnippet || '',
    };
    const nuevoMatchCount = (req.planInfo.cv_match_count || 0) + 1;
    const nuevoUsageCount = (req.planInfo.usage_count   || 0) + 1;
    await Promise.all([
      db.from('job_checks').insert({ user_id: req.user.id, job_key: jobKey, score, motivos, job_data: jobData }),
      db.from('profiles').update({ cv_match_count: nuevoMatchCount, usage_count: nuevoUsageCount }).eq('id', req.user.id),
    ]);

    res.json({ score, motivos, fromCache: false });
  } catch (err) {
    console.error('[compatibility]', err.message);
    res.status(500).json({ error: 'Error al calcular compatibilidad' });
  }
});

module.exports = router;
