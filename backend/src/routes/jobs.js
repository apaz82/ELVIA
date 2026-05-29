const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const auth                = require('../middleware/auth');
const { planContext }     = require('../middleware/planContext');
const checkCvMatchLimit   = require('../middleware/checkCvMatchLimit');
const requireActiveTrial  = require('../middleware/requireActiveTrial');

// DeepSeek V3 — para búsqueda y filtrado (no toca datos de usuario/PII)
let client = null;
const _deepseekKey = process.env.DEEPSEEK_API_KEY;
if (!_deepseekKey) {
  console.error('[DeepSeek/Jobs] DEEPSEEK_API_KEY no configurada — búsqueda de IA deshabilitada');
} else {
  try {
    client = new OpenAI({ apiKey: _deepseekKey, baseURL: 'https://api.deepseek.com/v1' });
  } catch (err) {
    console.error('[DeepSeek/Jobs] Error al inicializar cliente:', err.message);
  }
}

// Claude Haiku — para análisis de compatibilidad CV vs vacante (maneja PII del usuario)
// Se usa en vez de DeepSeek para cumplimiento LGPD/GDPR: DPA firmado con Anthropic
let claudeClient = null;
const _anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!_anthropicKey) {
  console.error('[Claude/Jobs] ANTHROPIC_API_KEY no configurada — análisis de compatibilidad deshabilitado');
} else {
  try {
    claudeClient = new Anthropic({ apiKey: _anthropicKey });
  } catch (err) {
    console.error('[Claude/Jobs] Error al inicializar cliente:', err.message);
  }
}
const DS_MODEL = 'deepseek-chat';

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
      redirect: 'manual', // No seguir redirects — previene SSRF a IPs internas o metadata endpoints
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

    // Bloquear redirects — el destino final podría ser una IP interna o metadata service
    if (response.status >= 300 && response.status < 400) {
      return res.status(400).json({
        error: 'La URL redirige a otra página. Por favor pega la descripción manualmente.'
      });
    }

    if (!response.ok) {
      let hostname = '';
      try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch {}

      if (response.status === 403 || response.status === 401 || response.status === 429) {
        return res.status(response.status).json({
          error: `El sitio${hostname ? ` ${hostname}` : ''} bloqueó la lectura automática de la vacante. Muchos portales de empleo y sistemas ATS impiden el acceso sin navegador. Copia y pega la descripción manualmente en la pestaña "Pegar descripción".`
        });
      }
      if (response.status === 404) {
        return res.status(404).json({
          error: `La vacante ya no está disponible${hostname ? ` en ${hostname}` : ''} (Error 404). Verifica el enlace o pega la descripción manualmente.`
        });
      }
      return res.status(400).json({
        error: `No pudimos leer la vacante${hostname ? ` en ${hostname}` : ''} (Error ${response.status}). Copia y pega la descripción manualmente.`
      });
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

    // Usar DeepSeek para extraer solo la descripción de la vacante (degrada sin IA si no hay cliente)
    if (!client) return res.json({ text: textoRecortado });
    const respuesta = await client.chat.completions.create({
      model: DS_MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Del siguiente texto extraído de una página web de empleo, extrae ÚNICAMENTE la descripción de la vacante: título del puesto, empresa, ubicación, descripción del rol, requisitos y beneficios. Elimina navegación, menús, empleos similares, publicidad y cualquier otro contenido que no sea la oferta de trabajo en sí. Responde solo con el texto limpio de la vacante, sin explicaciones.\n\nTEXTO:\n${textoRecortado}`,
      }],
    });

    res.json({ text: respuesta.choices[0].message.content.trim() });
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

// Mapea texto de ubicación a country code para Google Jobs (gl param)
const detectarGL = (location) => {
  if (!location) return 'mx';
  const loc = location.toLowerCase();
  const map = [
    [['méxico', 'mexico', 'cdmx', 'ciudad de méxico', 'monterrey', 'guadalajara', 'puebla', 'querétaro'], 'mx'],
    [['colombia', 'bogotá', 'bogota', 'medellín', 'medellin', 'cali', 'barranquilla'], 'co'],
    [['argentina', 'buenos aires', 'córdoba', 'rosario'], 'ar'],
    [['chile', 'santiago', 'valparaíso'], 'cl'],
    [['perú', 'peru', 'lima', 'arequipa'], 'pe'],
    [['españa', 'spain', 'madrid', 'barcelona', 'valencia'], 'es'],
    [['colombia'], 'co'],
    [['ecuador', 'quito', 'guayaquil'], 'ec'],
    [['panamá', 'panama'], 'pa'],
    [['costa rica', 'san josé'], 'cr'],
    [['uruguay', 'montevideo'], 'uy'],
    [['united states', 'usa', 'new york', 'california', 'texas', 'florida'], 'us'],
    [['brasil', 'brazil', 'são paulo', 'rio de janeiro'], 'br'],
  ];
  for (const [keywords, gl] of map) {
    if (keywords.some(k => loc.includes(k))) return gl;
  }
  return 'mx';
};

// Palabras/patrones que identifican resultados claramente de USA
const ES_USA_REGEX = /\b(united states|u\.s\.a?|usa|u\.s\b|new york|new jersey|california|texas|florida|illinois|georgia|washington,?\s*d\.?\s*c\.?|ohio|pennsylvania|north carolina|michigan|virginia|arizona|tennessee|massachusetts|indiana|missouri|maryland|wisconsin|minnesota|colorado|south carolina|alabama|louisiana|kentucky|oregon|oklahoma|connecticut|utah|iowa|nevada|arkansas|mississippi|kansas|new mexico|nebraska|west virginia|idaho|hawai+i|new hampshire|maine|rhode island|montana|delaware|south dakota|north dakota|alaska|wyoming|vermont|chicago|los angeles|san francisco|houston|dallas|austin|seattle|boston|denver|atlanta|phoenix|san diego|las vegas|nashville|charlotte|portland|minneapolis|miami|new orleans|san antonio|detroit|baltimore|memphis|louisville|milwaukee|albuquerque|tucson|fresno|sacramento|kansas city|omaha|colorado springs|raleigh|long beach|virginia beach|oakland|minneapolis|tampa|tulsa|arlington|new orleans|wichita|cleveland|bakersfield|aurora|anaheim|santa ana|corpus christi|riverside|lexington|stockton|st\. louis|pittsburgh|anchorage|cincinnati|greensboro|toledo|newark|plano|henderson|lincoln|buffalo|fort wayne|jersey city|chula vista|orlando|st\. paul|norfolk|madison|durham|lubbock|winston[- ]salem|garland|glendale|hialeah|reno|baton rouge|irvine|chesapeake|scottsdale|north las vegas|fremont|gilbert|san bernardino|birmingham|rochester|richmond|spokane|des moines|montgomery|modesto|fayetteville|tacoma|oxnard|fontana|columbus|moreno valley|glendale|akron|yonkers|aurora|huntington beach|santa clara|worcester|tallahassee|grand rapids|overland park|tempe|garden grove|oceanside|rockford|fort lauderdale|chattanooga|providence|rancho cucamonga|santa rosa|peoria|cape coral|ontario|springfield|elk grove|pembroke pines|eugene|corona|cary|salinas|palmdale|pasadena|hayward|sunnyvale|pomona|escondido|kansas city|savannah|fort collins|lakewood|paterson|killeen|bridgeport|mcallen|torrance|macon|hartford|surprise|gainesville|clarksville|warren|fullerton|columbia|sterling heights|west valley city|el monte|vallejo|berkeley|peoria|lansing|clearwater|clovis|west palm beach|beaumont|ann arbor|odessa|abilene|cambridge|waco|new haven|cedar rapids|elizabeth|el paso|denton|indianapolis|jacksonville|san jose|san antonio|riverside|toledo)\b/i;
const esResultadoUSA = (v) => ES_USA_REGEX.test(v.location || '');

// Busca en Google Jobs via SerpApi
const searchGoogleJobs = async ({ title, location, datecreated }) => {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];
  try {
    const gl = detectarGL(location);
    // Incluir ubicación en la query para que Google la priorice (más efectivo que solo el parámetro location)
    const queryConUbicacion = location ? `${title} ${location}` : title;
    const params = new URLSearchParams({
      engine:   'google_jobs',
      q:        queryConUbicacion,
      location: location || '',
      hl:       'es',
      gl,
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

// Busca en Adzuna — filtro por país real, buena cobertura LATAM
const ADZUNA_COUNTRY_MAP = {
  mx: 'mx', co: 'co', ar: 'ar', cl: 'cl', pe: 'pe',
  es: 'es', br: 'br', us: 'us',
};
const searchAdzuna = async ({ title, location, datecreated, employment_type }) => {
  const appId  = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  try {
    const gl      = detectarGL(location);
    const country = ADZUNA_COUNTRY_MAP[gl] || 'mx';
    const params  = new URLSearchParams({
      app_id:        appId,
      app_key:       appKey,
      results_per_page: '15',
      what:          title,
      where:         location || '',
      content_type:  'application/json',
    });
    if (employment_type) params.set('full_time', employment_type === 'Full-time' ? '1' : '0');
    if (datecreated) {
      const daysMap = { '1': '1', '3': '3', '7': '7', '30': '30' };
      if (daysMap[datecreated]) params.set('max_days_old', daysMap[datecreated]);
    }
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((j, i) => ({
      id:       `adzuna-${j.id || i}`,
      title:    j.title,
      company:  j.company?.display_name || '',
      location: j.location?.display_name || '',
      salary:   j.salary_min ? `${Math.round(j.salary_min).toLocaleString()} - ${Math.round(j.salary_max || j.salary_min).toLocaleString()}` : null,
      snippet:  (j.description || '').slice(0, 300),
      link:     j.redirect_url || '',
      updated:  j.created || null,
      fuente:   'Adzuna',
    }));
  } catch { return []; }
};

// Busca en JSearch (RapidAPI) — scraper de LinkedIn, filtro de país real
const searchJSearch = async ({ title, location, employment_type }) => {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return [];
  try {
    const query = location ? `${title} in ${location}` : title;
    const params = new URLSearchParams({ query, page: '1', num_pages: '1' });
    if (employment_type) {
      const typeMap = { 'Full-time': 'FULLTIME', 'Part-time': 'PARTTIME', 'Contract': 'CONTRACTOR', 'Internship': 'INTERN' };
      if (typeMap[employment_type]) params.set('employment_types', typeMap[employment_type]);
    }
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'X-RapidAPI-Key':  apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((j, i) => ({
      id:       `jsearch-${j.job_id || i}`,
      title:    j.job_title,
      company:  j.employer_name || '',
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
      salary:   j.job_min_salary ? `${j.job_min_salary.toLocaleString()} - ${(j.job_max_salary || j.job_min_salary).toLocaleString()} ${j.job_salary_currency || ''}`.trim() : null,
      snippet:  (j.job_description || '').slice(0, 300),
      link:     j.job_apply_link || j.job_google_link || '',
      updated:  j.job_posted_at_datetime_utc || null,
      fuente:   'LinkedIn',
    }));
  } catch { return []; }
};

// Busca en Remotive — solo empleos 100% remotos (gratis, sin auth)
const searchRemotive = async ({ title }) => {
  try {
    const params = new URLSearchParams({ search: title, limit: '10' });
    const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map(j => ({
      id:       `remotive-${j.id}`,
      title:    j.title,
      company:  j.company_name || '',
      location: j.candidate_required_location || 'Remoto',
      salary:   j.salary || null,
      snippet:  (j.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
      link:     j.url || '',
      updated:  j.publication_date || null,
      fuente:   'Remotive',
    }));
  } catch { return []; }
};

// Expande el título del cargo con sinónimos usando DeepSeek (solo español LATAM)
const expandirCargo = async (title) => {
  if (!client) return title;
  try {
    const resp = await client.chat.completions.create({
      model: DS_MODEL,
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `Para el cargo "${title}", genera 3-4 títulos equivalentes en español usados en el mercado laboral de LATAM. SOLO en español, sin inglés. Responde ÚNICAMENTE con los títulos separados por comas, sin explicaciones. Ejemplo para "Director General": Gerente General, Director Ejecutivo, CEO, Director Corporativo`,
      }],
    });
    const sinonimos = resp.choices[0].message.content.trim().split(',').map(s => s.trim()).filter(Boolean);
    return [title, ...sinonimos.slice(0, 3)].join(' OR ');
  } catch {
    return title;
  }
};

// GET /api/jobs/similar
// Soporta dos modos:
//   ?keywords=            → búsqueda por palabras clave/frases (sin expansión IA)
//   ?keywords=&companies= → búsqueda dirigida por empresas objetivo (repite param para múltiples)
router.get('/similar', auth, async (req, res) => {
  const { title, keywords, location, datecreated, employment_type, experience, radius, salary, page } = req.query;
  const companiesParam = req.query.companies;
  const companies = companiesParam
    ? (Array.isArray(companiesParam) ? companiesParam : [companiesParam]).map(c => c.trim()).filter(Boolean).slice(0, 5)
    : [];

  // Normalizar: keywords toma precedencia sobre title (title existe por retrocompatibilidad)
  const queryOriginal = (keywords || title || '').trim();
  const modoEmpresas = companies.length > 0 && !!queryOriginal;

  if (!queryOriginal) return res.status(400).json({ error: 'Se requiere el cargo o palabras clave' });

  try {
    if (modoEmpresas) {
      // Búsqueda dirigida: N llamadas en paralelo, una por empresa
      console.log(`[jobs/similar] Modo empresas | Query: "${queryOriginal}" | Empresas: ${companies.join(', ')}`);
      const searchPromises = companies.flatMap(empresa => [
        searchJooble({ title: `${queryOriginal} ${empresa}`, location, datecreated, employment_type, experience, radius, salary, page }),
        searchGoogleJobs({ title: `${queryOriginal} at ${empresa}`, location, datecreated }),
        searchAdzuna({ title: `${queryOriginal} ${empresa}`, location, datecreated, employment_type }),
        searchJSearch({ title: `${queryOriginal} ${empresa}`, location, employment_type }),
      ]);
      const allResults = await Promise.all(searchPromises);
      const flat = allResults.flat();

      // Dedup + filtrar solo resultados que mencionen alguna empresa objetivo
      const vistos = new Set();
      const rawVacantes = flat.filter(v => {
        const key = `${v.title?.toLowerCase().trim()}|${v.company?.toLowerCase().trim()}`;
        if (vistos.has(key)) return false;
        vistos.add(key);
        // Aceptar cualquier resultado cuando se busca por empresa (la query ya lo filtra implícitamente)
        return true;
      });

      // Post-filtro anti-USA para búsqueda en LATAM
      const glEmpresas = detectarGL(location);
      let resultadosEmpresas = rawVacantes;
      if (glEmpresas !== 'us' && location) {
        const sinUSA = rawVacantes.filter(v => !esResultadoUSA(v));
        if (sinUSA.length > 0) resultadosEmpresas = sinUSA;
      }

      // Ordenar: primero los que coinciden explícitamente con alguna empresa objetivo
      const normalizeEmpresa = s => (s || '').toLowerCase().trim();
      const estaEnObjetivo = v => companies.some(e => normalizeEmpresa(v.company).includes(normalizeEmpresa(e)));
      resultadosEmpresas.sort((a, b) => (estaEnObjetivo(b) ? 1 : 0) - (estaEnObjetivo(a) ? 1 : 0));

      return res.json({ vacantes: resultadosEmpresas, total: resultadosEmpresas.length, modoEmpresas: true });
    }

    // Siempre usar keywords directo (sin expansión de sinónimos vía IA)
    const queryBusqueda = queryOriginal;
    console.log(`[jobs/similar] Modo keywords | Query: "${queryBusqueda}"`);

    // Remotive solo cuando el usuario busca trabajo remoto
    const esRemoto = /remot|remote/i.test(location || '') || /remot|remote/i.test(queryBusqueda);

    const [joobleResults, googleResults, adzunaResults, jsearchResults, remotiveResults] = await Promise.all([
      searchJooble({ title: queryBusqueda, location, datecreated, employment_type, experience, radius, salary, page }),
      searchGoogleJobs({ title: queryBusqueda, location, datecreated }),
      searchAdzuna({ title: queryBusqueda, location, datecreated, employment_type }),
      searchJSearch({ title: queryBusqueda, location, employment_type }),
      esRemoto ? searchRemotive({ title: queryOriginal }) : Promise.resolve([]),
    ]);

    console.log(`[jobs/similar] Jooble: ${joobleResults.length} | Google: ${googleResults.length} | Adzuna: ${adzunaResults.length} | JSearch: ${jsearchResults.length} | Remotive: ${remotiveResults.length}`);

    // Combinar y deduplicar
    const vistos = new Set();
    const rawVacantes = [...joobleResults, ...googleResults, ...adzunaResults, ...jsearchResults, ...remotiveResults].filter(v => {
      const key = `${v.title?.toLowerCase().trim()}|${v.company?.toLowerCase().trim()}`;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });

    if (rawVacantes.length === 0) return res.json({ vacantes: [], total: 0 });

    // Si DeepSeek no está disponible, devolver resultados sin filtrar (degrade graceful)
    if (!client) {
      console.warn('[jobs/similar] DeepSeek no disponible — devolviendo sin filtrar IA');
      return res.json({ vacantes: rawVacantes, total: rawVacantes.length, sinFiltroIA: true });
    }

    // Post-filtro determinístico: excluir resultados claramente de USA cuando se busca en LATAM/España
    const gl = detectarGL(location);
    let filtrados = rawVacantes;
    if (gl !== 'us' && location) {
      filtrados = rawVacantes.filter(v => !esResultadoUSA(v));
      if (filtrados.length === 0) filtrados = rawVacantes; // fallback: no eliminar todo
    }

    if (filtrados.length === 0) return res.json({ vacantes: [], total: 0 });

    // Si DeepSeek no está disponible, devolver resultados sin filtrar (degrade graceful)
    if (!client) {
      console.warn('[jobs/similar] DeepSeek no disponible — devolviendo sin filtrar IA');
      return res.json({ vacantes: filtrados, total: filtrados.length, sinFiltroIA: true });
    }

    // Filtrar con DeepSeek: relevancia de cargo + ubicación
    const ubicacionCtx = location || 'LATAM';
    const listaParaFiltrar = filtrados
      .map((v, i) => `${i}. ${v.title} | ${v.company || ''} | ${v.location || ''}`)
      .join('\n');

    const promptFiltro = `Se buscó con: "${queryOriginal}", ubicación: "${ubicacionCtx}". De esta lista devuelve los índices de vacantes relacionadas con esa búsqueda y cuya ubicación sea compatible con "${ubicacionCtx}" (excluir si claramente son de un país diferente al solicitado). Responde únicamente con los índices separados por comas.\n\n${listaParaFiltrar}`;

    let vacantes = filtrados;
    try {
      const filtroResp = await client.chat.completions.create({
        model: DS_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: promptFiltro }],
      });

      const indicesTexto = filtroResp.choices[0].message.content.trim();
      const indicesValidos = new Set(
        indicesTexto.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      );

      if (indicesValidos.size > 0) {
        vacantes = filtrados.filter((_, i) => indicesValidos.has(i));
      }
    } catch (filtroErr) {
      console.warn('[jobs/similar] Filtro DeepSeek falló, devolviendo sin filtrar:', filtroErr.message);
    }

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

    // 2. Llamar a Claude Haiku — el CV contiene PII, DeepSeek no tiene DPA para LATAM
    if (!claudeClient) return res.status(503).json({ error: 'Servicio de análisis no disponible temporalmente' });
    const respuesta = await claudeClient.messages.create({
      model: process.env.CLAUDE_MODEL_FAST || 'claude-haiku-4-5-20251001',
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
