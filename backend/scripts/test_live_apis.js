// Script de prueba de integración para endpoints de IA en Producción
// Uso: cd backend && node scripts/test_live_apis.js
// Valida el servidor de producción: https://optima-backend-production.up.railway.app

const { createClient } = require('@supabase/supabase-js')

// Datos de producción obtenidos de frontend/.env
const SUPABASE_URL = 'https://rmzcjvahdriunedyylbe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtemNqdmFoZHJpdW5lZHl5bGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTYyMjUsImV4cCI6MjA4OTI3MjIyNX0.6Bk5YQEMtRyoQ3rvAaNCyKH1ngGWvdeOTruCKTPYm3A'
const BACKEND_URL = 'https://cv-optimizer-pro-production.up.railway.app'

const TEST_EMAIL = 'miguel.ramirez@elvia.demo'
const TEST_PASS = 'DemoElvia2026!'

async function runTests() {
  console.log('===============================================================')
  console.log('INICIANDO PRUEBAS DE INTEGRACIÓN EN PRODUCCIÓN')
  console.log(`Backend URL: ${BACKEND_URL}`)
  console.log(`Usuario: ${TEST_EMAIL}`)
  console.log('===============================================================\n')

  // 1. Inicializar cliente Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // 2. Iniciar sesión para obtener token JWT
  console.log('🔑 Iniciando sesión en Supabase Auth...')
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASS
  })

  if (authErr || !authData.session) {
    console.error('❌ Error al iniciar sesión en producción:', authErr?.message || 'Sin sesión')
    process.exit(1)
  }

  const token = authData.session.access_token
  console.log('✅ Sesión iniciada con éxito. Token JWT obtenido.\n')

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  // ── PRUEBA 1: my-tenant (B2B Context) ──
  console.log('📡 [TEST 1] Consultando datos de tenant B2B (/api/company/my-tenant)...')
  try {
    const res = await fetch(`${BACKEND_URL}/api/company/my-tenant`, { headers })
    const data = await res.json()
    if (res.ok && data.company) {
      console.log(`✅ [TEST 1 PASADO] Tenant: ${data.company.name} | Slug: ${data.company.slug} | Rol: ${data.role}\n`)
    } else {
      console.error('❌ [TEST 1 FALLIDO] No se pudo obtener el tenant:', data)
    }
  } catch (err) {
    console.error('❌ [TEST 1 ERROR]:', err.message)
  }

  // ── PRUEBA 2: optimizar-resumen (AI DeepSeek) ──
  console.log('📡 [TEST 2] Probando Optimizar Resumen Profesional con IA (/api/cv/optimizar-resumen)...')
  try {
    const payload = {
      texto: 'Soy un ingeniero de software con 5 años de experiencia haciendo aplicaciones web con node y react y base de datos relacionales.',
      idioma: 'es'
    }
    const res = await fetch(`${BACKEND_URL}/api/cv/optimizar-resumen`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (res.ok && data.optimizado) {
      console.log('✅ [TEST 2 PASADO] Resumen optimizado por DeepSeek:')
      console.log(`   "${data.optimizado.substring(0, 150)}..."\n`)
    } else {
      console.error('❌ [TEST 2 FALLIDO] Error al optimizar resumen:', data)
    }
  } catch (err) {
    console.error('❌ [TEST 2 ERROR]:', err.message)
  }

  // ── PRUEBA 3: Chat ELVIA (DeepSeek RAG) ──
  console.log('📡 [TEST 3] Probando Chatbot ELVIA (/api/chat)...')
  try {
    const payload = {
      message: '¿Cuáles son los mejores consejos para redactar la sección de experiencia de mi currículum?',
      history: []
    }
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (res.ok && data.reply) {
      console.log('✅ [TEST 3 PASADO] Chatbot respondió fluidamente:')
      console.log(`   "${data.reply.substring(0, 150).replace(/\n/g, ' ')}..."\n`)
    } else {
      console.error('❌ [TEST 3 FALLIDO] Error en Chatbot:', data)
    }
  } catch (err) {
    console.error('❌ [TEST 3 ERROR]:', err.message)
  }

  // ── PRUEBA 4: Generar Preguntas de Entrevista ──
  console.log('📡 [TEST 4] Probando Generar Preguntas de Entrevista (/api/interview/preguntas)...')
  try {
    const payload = {
      cargo: 'Frontend Engineer',
      descripcion: 'Desarrollador React con experiencia en Vite y CSS vainilla.',
      empresa: 'Telefónica',
      cantidad: 3
    }
    const res = await fetch(`${BACKEND_URL}/api/interview/preguntas`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (res.ok && Array.isArray(data.preguntas)) {
      console.log('✅ [TEST 4 PASADO] Preguntas de entrevista generadas:')
      data.preguntas.forEach((p, idx) => console.log(`   ${idx + 1}. [${p.tipo}] ${p.pregunta}`))
      console.log('')
    } else {
      console.error('❌ [TEST 4 FALLIDO] Error al generar preguntas:', data)
    }
  } catch (err) {
    console.error('❌ [TEST 4 ERROR]:', err.message)
  }

  console.log('===============================================================')
  console.log('PRUEBAS FINALIZADAS')
  console.log('===============================================================')
}

runTests().catch(console.error)
