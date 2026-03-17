const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const auth = require('../middleware/auth');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Genera una clave única por usuario+vacante
const generarJobKey = (title, company) =>
  `${(title || '').toLowerCase().trim()}|${(company || '').toLowerCase().trim()}`;

// POST /api/jobs/fetch-url — obtiene el texto de una página de vacante
router.post('/fetch-url', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Simula un browser para evitar bloqueos de bots
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      return res.status(400).json({ error: `No se pudo acceder a la URL (${response.status})` });
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

// GET /api/jobs/similar
router.get('/similar', async (req, res) => {
  const { title, location, datecreated, employment_type, experience, radius, salary, page } = req.query;

  if (!title) return res.status(400).json({ error: 'Se requiere el título del cargo' });

  try {
    // Buscar en ambas fuentes en paralelo
    const [joobleResults, googleResults] = await Promise.all([
      searchJooble({ title, location, datecreated, employment_type, experience, radius, salary, page }),
      searchGoogleJobs({ title, location, datecreated }),
    ]);

    console.log(`[jobs/similar] Jooble: ${joobleResults.length} | Google Jobs: ${googleResults.length}`);

    // Combinar y deduplicar por título+empresa
    const vistos = new Set();
    const rawVacantes = [...joobleResults, ...googleResults].filter(v => {
      const key = `${v.title?.toLowerCase().trim()}|${v.company?.toLowerCase().trim()}`;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });

    if (rawVacantes.length === 0) return res.json({ vacantes: [], total: 0 });

    // Filtrar con Claude: eliminar irrelevantes
    const listaParaFiltrar = rawVacantes
      .map((v, i) => `${i}. ${v.title} | ${v.company || ''}`)
      .join('\n');

    const filtroResp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Se buscó el cargo: "${title}". De esta lista, devuelve SOLO los índices de vacantes relevantes para ese cargo. Excluye solo las que sean de un área completamente distinta. Si la mayoría aplican, inclúyelas todas. Responde únicamente con los índices separados por comas.\n\n${listaParaFiltrar}`,
      }],
    });

    const indicesTexto = filtroResp.content[0].text.trim();
    console.log(`[jobs/similar] Claude filtró: "${indicesTexto}"`);

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
router.post('/compatibility', auth, async (req, res) => {
  const { cvText, jobTitle, jobCompany, jobSnippet, jobLink, jobLocation, jobVia } = req.body;
  if (!cvText || !jobTitle) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const db = req.supabase;
  const jobKey = generarJobKey(jobTitle, jobCompany);

  try {
    // 1. Verificar cache — si ya fue analizado, devolver sin cobrar
    const { data: cached } = await db
      .from('job_checks')
      .select('score, motivos')
      .eq('job_key', jobKey)
      .maybeSingle();

    if (cached) {
      console.log(`[compatibility] Cache hit: ${jobKey}`);
      return res.json({ score: cached.score, motivos: cached.motivos, fromCache: true });
    }

    // 2. Verificar créditos disponibles
    const { data: perfil } = await db
      .from('profiles')
      .select('usage_count')
      .eq('id', req.user.id)
      .maybeSingle();

    const LIMITE = 999; // Cambiar a 2 en producción
    if (perfil && perfil.usage_count >= LIMITE) {
      return res.status(403).json({ error: 'LIMIT_REACHED' });
    }

    // 3. Llamar a Claude
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

    // 4. Guardar en cache (con datos de la vacante) y cobrar crédito
    const jobData = {
      title: jobTitle, company: jobCompany || '',
      location: jobLocation || '', link: jobLink || '', via: jobVia || '',
      snippet: jobSnippet || '',
    };
    await Promise.all([
      db.from('job_checks').insert({ user_id: req.user.id, job_key: jobKey, score, motivos, job_data: jobData }),
      db.from('profiles').update({ usage_count: (perfil?.usage_count || 0) + 1 }).eq('id', req.user.id),
    ]);

    res.json({ score, motivos, fromCache: false });
  } catch (err) {
    console.error('[compatibility]', err.message);
    res.status(500).json({ error: 'Error al calcular compatibilidad' });
  }
});

module.exports = router;
