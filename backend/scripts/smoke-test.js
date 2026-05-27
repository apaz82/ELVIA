#!/usr/bin/env node
// Smoke test pre-demo Telefónica
// Corre: node backend/scripts/smoke-test.js
// Requiere .env del backend con SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')
const https = require('https')

const RAILWAY_URL = 'https://cv-optimizer-pro-production.up.railway.app'
const SLUG        = 'telefonica'
const HR_EMAIL    = 'hr.telefonica@elvia.demo'
const HR_PASS     = 'Telefonica2026!'

let passed = 0
let failed = 0
const results = []

function ok(label, detail = '') {
  passed++
  results.push(`  ✅  ${label}${detail ? ` — ${detail}` : ''}`)
}
function fail(label, detail = '') {
  failed++
  results.push(`  ❌  ${label}${detail ? ` — ${detail}` : ''}`)
}

async function fetchJSON(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } }, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, body }) }
      })
    })
    req.on('error', reject)
    if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body))
    req.end()
  })
}

// ─── 1. Backend health ───────────────────────────────────────────────────────
async function testHealth() {
  console.log('\n▸ 1. Backend health (Railway)')
  try {
    // Usamos el endpoint público de tenant como proxy de "está arriba"
    const r = await fetchJSON(`${RAILWAY_URL}/api/company/registration/${SLUG}`, { method: 'GET' })
    if (r.status < 500) ok('Backend Railway responde', `HTTP ${r.status}`)
    else fail('Backend Railway', `HTTP ${r.status}`)
  } catch (e) {
    fail('Backend Railway inalcanzable', e.message)
  }
}

// ─── 2. Tenant Telefónica público ───────────────────────────────────────────
async function testTenantPublic() {
  console.log('\n▸ 2. Tenant Telefónica público')
  try {
    const r = await fetchJSON(`${RAILWAY_URL}/api/company/registration/${SLUG}`, { method: 'GET' })
    // La respuesta viene como { company: { slug, name, ... } }
    const company = r.body?.company || r.body
    if (r.status === 200 && company?.slug === SLUG) {
      ok('GET /registration/telefonica', `name="${company.name}"`)
    } else {
      fail('GET /registration/telefonica', `HTTP ${r.status} — ${JSON.stringify(r.body).slice(0,80)}`)
    }
  } catch (e) {
    fail('Tenant público', e.message)
  }
}

// ─── 2b. Allowlist table directa (service_role) ─────────────────────────────
async function testAllowlistDirect(supaAdmin) {
  console.log('\n▸ 2b. company_allowlist directa (service_role — aísla bug de endpoint vs tabla)')
  const { data, error } = await supaAdmin
    .from('company_allowlist')
    .select('id, email, nombre, apellido, cohort, area, cargo_actual, status, added_at, activated_at, activated_user_id, revoked_at')
    .limit(5)
  if (error) {
    fail('SELECT company_allowlist', `${error.code} — ${error.message}`)
  } else {
    ok('SELECT company_allowlist', `${data?.length ?? 0} filas de muestra`)
  }
}

// ─── 3. Migraciones (via service_role) ──────────────────────────────────────
async function testMigrations(supaAdmin) {
  console.log('\n▸ 3. Migraciones en Supabase')

  // 019: cv_results.expires_at
  const { data: cols, error: colErr } = await supaAdmin
    .from('cv_results')
    .select('expires_at')
    .limit(1)
    .maybeSingle()
  if (!colErr || colErr.message?.includes('0 rows')) {
    ok('Migration 019 — cv_results.expires_at existe')
  } else {
    fail('Migration 019 — cv_results.expires_at', colErr.message)
  }

  // 019: profiles.pii_consent_at
  const { error: pcErr } = await supaAdmin
    .from('profiles')
    .select('pii_consent_at')
    .limit(1)
    .maybeSingle()
  if (!pcErr || pcErr.message?.includes('0 rows')) {
    ok('Migration 019 — profiles.pii_consent_at existe')
  } else {
    fail('Migration 019 — profiles.pii_consent_at', pcErr.message)
  }

  // 020: tipo='generar' — verificar con INSERT+rollback via RPC no disponible; checar constraint
  // Usamos un SELECT que simplemente comprueba que la tabla acepta el valor
  const { error: tipoErr } = await supaAdmin
    .from('cv_results')
    .select('tipo')
    .eq('tipo', 'generar')
    .limit(1)
  // Un SELECT nunca viola CHECK, pero si la columna o tabla no existe fallará
  if (!tipoErr) {
    ok('Migration 020 — columna tipo consultable (verificar constraint manualmente si no corriste la migration)')
  } else {
    fail('Migration 020 — error consultando tipo', tipoErr.message)
  }
}

// ─── 4. Auth HR Telefónica ───────────────────────────────────────────────────
async function testHRAuth(supaAnon) {
  console.log('\n▸ 4. Autenticación HR Telefónica')
  const { data, error } = await supaAnon.auth.signInWithPassword({ email: HR_EMAIL, password: HR_PASS })
  if (error) {
    fail('HR login', error.message)
    return null
  }
  ok('HR login', `user=${data.user.id.slice(0,8)}…`)
  return data.session?.access_token
}

// ─── 5. Protected endpoints con token HR ────────────────────────────────────
async function testProtectedEndpoints(token) {
  console.log('\n▸ 5. Endpoints protegidos (token HR)')
  if (!token) { fail('Skipped — sin token HR'); return }

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // GET /api/company/allowlist
  const al = await fetchJSON(`${RAILWAY_URL}/api/company/allowlist`, { method: 'GET', headers })
  if (al.status === 200) ok('GET /allowlist', `${Array.isArray(al.body) ? al.body.length : '?'} entradas`)
  else fail('GET /allowlist', `HTTP ${al.status} — ${JSON.stringify(al.body).slice(0,80)}`)

  // GET /api/company/invitations
  const inv = await fetchJSON(`${RAILWAY_URL}/api/company/invitations`, { method: 'GET', headers })
  if (inv.status === 200) ok('GET /invitations', `${Array.isArray(inv.body) ? inv.body.length : '?'} invitaciones`)
  else fail('GET /invitations', `HTTP ${inv.status} — ${JSON.stringify(inv.body).slice(0,80)}`)
}

// ─── 6. Auth Redirect URL warning ───────────────────────────────────────────
function checkRedirectUrlWarning() {
  console.log('\n▸ 6. Supabase Auth Redirect URL')
  console.log('  ⚠️   No auto-verificable — confirmar manualmente:')
  console.log('       Supabase Studio → Auth → URL Configuration → Redirect URLs')
  console.log(`       debe incluir: https://elvia.lat/empresas/*/activar`)
}

// ─── Main ────────────────────────────────────────────────────────────────────
;(async () => {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SMOKE TEST — Pre-demo Telefónica')
  console.log('═══════════════════════════════════════════════════════')

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_ANON_KEY) {
    console.error('\n❌  Faltan variables de entorno. Asegúrate de correr desde backend/ con .env cargado.')
    process.exit(1)
  }

  const supaAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supaAnon  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  await testHealth()
  await testTenantPublic()
  await testAllowlistDirect(supaAdmin)
  await testMigrations(supaAdmin)
  const hrToken = await testHRAuth(supaAnon)
  await testProtectedEndpoints(hrToken)
  checkRedirectUrlWarning()

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`  Resultado: ${passed} passed / ${failed} failed`)
  console.log('═══════════════════════════════════════════════════════')
  results.forEach(r => console.log(r))

  if (failed > 0) {
    console.log('\n  ⛔  Resolver los ❌ antes de mandar invitaciones reales.')
    process.exit(1)
  } else {
    console.log('\n  🟢  Todo OK. Listo para invitar candidatos Telefónica.')
  }
})()
