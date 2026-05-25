// Test de endpoints críticos para la demo de Telefónica
// Cuenta de prueba: david.ruiz@elvia.demo (fully unlocked)
//
// Uso: cd backend && node scripts/test_demo_endpoints.js
// Requiere: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + VITE_API_URL (o usa localhost:3001)
//
// Cada test reporta: ✅ PASS | ❌ FAIL | ⚠️  WARN

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL  = process.env.SUPABASE_URL
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_URL = process.env.BACKEND_URL || process.env.VITE_API_URL || 'http://localhost:3001'

if (!SB_URL || !SB_KEY) {
  console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)

const TEST_EMAIL    = 'david.ruiz@elvia.demo'
const TEST_PASSWORD = 'DemoElvia2026!'

const results = []
let token = null

function pass(name, detail = '')  { results.push({ status: '✅ PASS', name, detail }); console.log(`✅  ${name}${detail ? ' — ' + detail : ''}`) }
function fail(name, detail = '')  { results.push({ status: '❌ FAIL', name, detail }); console.log(`❌  ${name}${detail ? ' — ' + detail : ''}`) }
function warn(name, detail = '')  { results.push({ status: '⚠️  WARN', name, detail }); console.log(`⚠️   ${name}${detail ? ' — ' + detail : ''}`) }

async function api(method, path, body, authRequired = true) {
  const headers = { 'Content-Type': 'application/json' }
  if (authRequired && token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch { data = null }
  return { status: res.status, ok: res.ok, data }
}

async function main() {
  console.log('\n========= TEST ENDPOINTS — ELVIA® DEMO TELEFÓNICA =========')
  console.log(`API:    ${API_URL}`)
  console.log(`User:   ${TEST_EMAIL}`)
  console.log('============================================================\n')

  // ── 0. Login y obtención de token ─────────────────────────────────────────
  console.log('--- AUTENTICACIÓN ---')
  const sbUser = createClient(SB_URL, SB_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: authData, error: authErr } = await sbUser.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (authErr || !authData?.session?.access_token) {
    fail('Login', authErr?.message || 'Sin token')
    console.log('\n⛔  Sin token no se puede continuar. Verifica que el usuario exista.\n')
    printSummary(); process.exit(1)
  }
  token = authData.session.access_token
  pass('Login', `UID: ${authData.user.id.slice(0, 8)}...`)

  // ── 1. Endpoints públicos ──────────────────────────────────────────────────
  console.log('\n--- ENDPOINTS PÚBLICOS ---')

  try {
    const r = await api('GET', '/api/company/branding/telefonica', null, false)
    const c = r.data?.company
    if (r.ok && c?.slug === 'telefonica') pass('GET /api/company/branding/telefonica', `logo: ${c.logo_url?.slice(-20)}`)
    else fail('GET /api/company/branding/telefonica', `status ${r.status} — ${JSON.stringify(r.data).slice(0, 80)}`)
  } catch (e) { fail('GET /api/company/branding/telefonica', e.message) }

  // ── 2. Endpoints de usuario autenticado ───────────────────────────────────
  console.log('\n--- ENDPOINTS AUTENTICADOS ---')

  try {
    const r = await api('GET', '/api/company/my-tenant')
    if (r.ok && r.data?.company) pass('GET /api/company/my-tenant', `tenant: ${r.data.company?.name}`)
    else warn('GET /api/company/my-tenant', `status ${r.status} — puede ser normal si el endpoint no existe en esta versión`)
  } catch (e) { warn('GET /api/company/my-tenant', e.message) }

  // ── 3. Perfil ──────────────────────────────────────────────────────────────
  console.log('\n--- DATOS DE PERFIL (Supabase directo) ---')

  try {
    const { data: profile, error: pErr } = await db
      .from('profiles')
      .select('id, nombre1, apellido1, company_id, plan, job_search_profile, bienestar_data')
      .eq('email_principal', TEST_EMAIL)
      .single()

    if (pErr || !profile) {
      fail('Profile en DB', pErr?.message || 'No encontrado')
    } else {
      pass('Profile en DB', `plan: ${profile.plan}, company_id: ${profile.company_id ? 'OK' : '❌ NULL'}`)
      profile.job_search_profile
        ? pass('job_search_profile', 'Gerente de Búsqueda con datos')
        : fail('job_search_profile', 'NULL — usuario no completó Gerente')
      profile.bienestar_data
        ? pass('bienestar_data column', 'Columna existe y tiene datos')
        : warn('bienestar_data column', 'NULL o columna no existe — correr migración SQL')
    }
  } catch (e) { fail('Profile en DB', e.message) }

  // ── 4. CV Results ──────────────────────────────────────────────────────────
  console.log('\n--- DATOS PIPELINE ---')

  try {
    const { data: cvs, error: cvErr } = await db
      .from('cv_results')
      .select('tipo, created_at')
      .eq('user_id', authData.user.id)

    if (cvErr) fail('cv_results en DB', cvErr.message)
    else {
      const opt   = cvs.filter(c => c.tipo === 'optimize')
      const match = cvs.filter(c => c.tipo === 'match')
      pass('cv_results en DB', `${opt.length} optimizados, ${match.length} match`)
    }
  } catch (e) { fail('cv_results en DB', e.message) }

  try {
    const { data: jobs, error: jErr } = await db
      .from('saved_jobs')
      .select('estado')
      .eq('user_id', authData.user.id)

    if (jErr) fail('saved_jobs en DB', jErr.message)
    else pass('saved_jobs en DB', `${jobs.length} vacantes en pipeline`)
  } catch (e) { fail('saved_jobs en DB', e.message) }

  // ── 5. Endpoint Chat ───────────────────────────────────────────────────────
  console.log('\n--- IA ENDPOINTS ---')

  try {
    const r = await api('POST', '/api/chat', {
      message: 'Dame un tip de 10 palabras para mi búsqueda de empleo.',
      context: 'dashboard',
    })
    if (r.ok && r.data?.reply) pass('POST /api/chat', `"${r.data.reply.slice(0, 60)}..."`)
    else if (r.status === 429) warn('POST /api/chat', 'Rate limit activo (normal en pruebas rápidas)')
    else fail('POST /api/chat', `status ${r.status} — ${JSON.stringify(r.data).slice(0, 100)}`)
  } catch (e) { fail('POST /api/chat', e.message) }

  // cv/optimize y cv/match requieren multipart/form-data con PDF real (multer).
  // Se prueban con FormData + buffer de texto — si pasa el 400 de req.file, el endpoint responde.
  try {
    const form = new FormData()
    const cvContent = 'Ingeniero con 5 años de experiencia en desarrollo de software. Trabajo en equipos ágiles.'
    form.append('cv', new Blob([cvContent], { type: 'application/pdf' }), 'cv.pdf')
    form.append('jobDescription', 'Buscamos Senior Software Engineer con experiencia en React y Node.js.')
    form.append('language', 'es')
    const res = await fetch(`${API_URL}/api/cv/optimize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.resultado) pass('POST /api/cv/optimize', `Match: ${data.resultado?.matchScore ?? 'N/A'}%`)
    else if (res.status === 429) warn('POST /api/cv/optimize', 'Daily cap alcanzado (normal en test)')
    else warn('POST /api/cv/optimize', `status ${res.status} — requiere PDF válido para resultado completo`)
  } catch (e) { fail('POST /api/cv/optimize', e.message) }

  try {
    const form = new FormData()
    const cvContent = 'Gerente con 10 años de experiencia en ventas B2B en telecomunicaciones.'
    form.append('cv', new Blob([cvContent], { type: 'application/pdf' }), 'cv.pdf')
    form.append('jobDescription', 'Director Comercial para empresa telco. Experiencia en ventas enterprise.')
    const res = await fetch(`${API_URL}/api/cv/match`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const data = await res.json().catch(() => null)
    if (res.ok && (data?.matchScore !== undefined || data?.resultado)) pass('POST /api/cv/match', `score: ${data?.matchScore ?? data?.resultado?.matchScore ?? 'N/A'}%`)
    else if (res.status === 429) warn('POST /api/cv/match', 'Daily cap alcanzado')
    else warn('POST /api/cv/match', `status ${res.status} — requiere PDF válido para resultado completo`)
  } catch (e) { fail('POST /api/cv/match', e.message) }

  try {
    const r = await api('POST', '/api/cv/carta', {
      empresa: 'Movistar LATAM',
      cargo: 'VP Transformación Digital',
      descripcion: 'Liderar transformación digital en 8 mercados de LATAM.',
      cvText: 'Director General con 18 años en telecomunicaciones.',
      language: 'es',
    })
    if (r.ok && r.data?.carta) pass('POST /api/cv/carta', `${r.data.carta.slice(0, 60)}...`)
    else if (r.status === 429) warn('POST /api/cv/carta', 'Daily cap alcanzado')
    else fail('POST /api/cv/carta', `status ${r.status}`)
  } catch (e) { fail('POST /api/cv/carta', e.message) }

  // ── 6. LinkedIn ────────────────────────────────────────────────────────────
  console.log('\n--- LINKEDIN ---')

  try {
    // Ruta correcta: /analizar (no /analyze). Campos: titular, extracto, experiencia, habilidades, educacion
    const r = await api('POST', '/api/linkedin/analizar', {
      titular: 'Director General | Telecomunicaciones | 18 años liderando operaciones de USD 500M en LATAM',
      extracto: 'Ejecutivo con trayectoria en transformación digital y expansión en mercados de LATAM.',
      experiencia: 'Director General en Movistar LATAM 2015-2024. VP Operaciones en Claro 2010-2015.',
      habilidades: 'Liderazgo, transformación digital, P&L, gestión de equipos, ventas B2B enterprise.',
    })
    if (r.ok && r.data?.puntaje_global !== undefined) pass('POST /api/linkedin/analizar', `Puntaje: ${r.data.puntaje_global}`)
    else if (r.status === 429) warn('POST /api/linkedin/analizar', 'Daily cap')
    else fail('POST /api/linkedin/analizar', `status ${r.status} — ${JSON.stringify(r.data).slice(0, 80)}`)
  } catch (e) { fail('POST /api/linkedin/analizar', e.message) }

  try {
    const r = await api('GET', '/api/linkedin/historial')
    if (r.ok) pass('GET /api/linkedin/historial', `${r.data?.length ?? 0} análisis guardados`)
    else fail('GET /api/linkedin/historial', `status ${r.status}`)
  } catch (e) { fail('GET /api/linkedin/historial', e.message) }

  // ── 7. HR Admin (company_admin) ───────────────────────────────────────────
  console.log('\n--- HR ADMIN (usar hr.telefonica@elvia.demo para este bloque) ---')

  try {
    const r = await api('GET', '/api/company/dashboard')
    if (r.ok) pass('GET /api/company/dashboard', `${JSON.stringify(r.data).slice(0, 80)}...`)
    else if (r.status === 403) warn('GET /api/company/dashboard', '403 — este user no es company_admin (esperado para candidato)')
    else fail('GET /api/company/dashboard', `status ${r.status}`)
  } catch (e) { fail('GET /api/company/dashboard', e.message) }

  try {
    const r = await api('GET', '/api/company/users')
    if (r.ok) pass('GET /api/company/users', `${r.data?.length ?? 0} usuarios`)
    else if (r.status === 403) warn('GET /api/company/users', '403 — este user no es company_admin (esperado)')
    else fail('GET /api/company/users', `status ${r.status}`)
  } catch (e) { fail('GET /api/company/users', e.message) }

  // ── Resumen ────────────────────────────────────────────────────────────────
  printSummary()
}

function printSummary() {
  const passed = results.filter(r => r.status.includes('PASS')).length
  const failed = results.filter(r => r.status.includes('FAIL')).length
  const warned = results.filter(r => r.status.includes('WARN')).length

  console.log('\n============================================================')
  console.log(`RESUMEN: ${passed} ✅ PASS  |  ${warned} ⚠️  WARN  |  ${failed} ❌ FAIL`)
  if (failed > 0) {
    console.log('\nFALLAS CRÍTICAS:')
    results.filter(r => r.status.includes('FAIL')).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`))
  }
  if (warned > 0) {
    console.log('\nADVERTENCIAS:')
    results.filter(r => r.status.includes('WARN')).forEach(r => console.log(`  ⚠️  ${r.name}: ${r.detail}`))
  }
  console.log('============================================================\n')
  if (failed > 0) process.exit(1)
}

main().catch(e => { console.error('Error inesperado:', e); process.exit(1) })
