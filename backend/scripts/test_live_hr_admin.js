// Script de prueba para endpoints de Administración de RRHH en Producción
// Uso: cd backend && node scripts/test_live_hr_admin.js

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://rmzcjvahdriunedyylbe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtemNqdmFoZHJpdW5lZHl5bGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTYyMjUsImV4cCI6MjA4OTI3MjIyNX0.6Bk5YQEMtRyoQ3rvAaNCyKH1ngGWvdeOTruCKTPYm3A'
const BACKEND_URL = 'https://cv-optimizer-pro-production.up.railway.app'

const ADMIN_EMAIL = 'hr.telefonica@elvia.demo'
const ADMIN_PASS = 'Telefonica2026!'

async function runAdminTests() {
  console.log('===============================================================')
  console.log('INICIANDO PRUEBAS DE ADMINISTRACIÓN DE RRHH EN PRODUCCIÓN')
  console.log(`Backend URL: ${BACKEND_URL}`)
  console.log(`Administrador: ${ADMIN_EMAIL}`)
  console.log('===============================================================\n')

  // 1. Inicializar cliente Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // 2. Iniciar sesión para obtener token JWT de admin
  console.log('🔑 Iniciando sesión como Administrador de RRHH...')
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS
  })

  if (authErr || !authData.session) {
    console.error('❌ Error al iniciar sesión:', authErr?.message || 'Sin sesión')
    process.exit(1)
  }

  const token = authData.session.access_token
  console.log('✅ Sesión iniciada. Token JWT de Administrador obtenido.\n')

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  // ── PRUEBA 1: company/profile (Datos de Empresa) ──
  console.log('📡 [TEST A] Consultando perfil de empresa (/api/company/profile)...')
  try {
    const res = await fetch(`${BACKEND_URL}/api/company/profile`, { headers })
    const data = await res.json()
    if (res.ok && data.company) {
      console.log(`✅ [TEST A PASADO] Empresa: ${data.company.name} | Sector: ${data.company.sector} | País: ${data.company.country}\n`)
    } else {
      console.error('❌ [TEST A FALLIDO] No se pudo obtener el perfil de empresa:', data)
    }
  } catch (err) {
    console.error('❌ [TEST A ERROR]:', err.message)
  }

  // ── PRUEBA 2: company/users (Lista de Colaboradores) ──
  console.log('📡 [TEST B] Listando colaboradores asignados (/api/company/users)...')
  try {
    const res = await fetch(`${BACKEND_URL}/api/company/users`, { headers })
    const data = await res.json()
    if (res.ok && Array.isArray(data.users)) {
      console.log(`✅ [TEST B PASADO] Colaboradores listados: ${data.users.length}`)
      console.log('   Muestra de usuarios registrados:')
      data.users.slice(0, 3).forEach((u, i) => {
        console.log(`     ${i + 1}. ${u.nombre1} ${u.apellido1 || ''} (${u.email_principal}) - Plan: ${u.plan}`)
      })
      console.log('')
    } else {
      console.error('❌ [TEST B FALLIDO] Error al obtener colaboradores:', data)
    }
  } catch (err) {
    console.error('❌ [TEST B ERROR]:', err.message)
  }

  // ── PRUEBA 3: company/invitations (Invitaciones Enviadas) ──
  console.log('📡 [TEST C] Listando invitaciones del programa (/api/company/invitations)...')
  try {
    const res = await fetch(`${BACKEND_URL}/api/company/invitations`, { headers })
    const data = await res.json()
    if (res.ok && Array.isArray(data.invitations)) {
      console.log(`✅ [TEST C PASADO] Invitaciones registradas: ${data.invitations.length}`)
      console.log('   Muestra de invitaciones:')
      data.invitations.slice(0, 3).forEach((inv, i) => {
        console.log(`     ${i + 1}. Destinatario: ${inv.nombre || 'Invitado'} (${inv.email}) - Estado: ${inv.status}`)
      })
      console.log('')
    } else {
      console.error('❌ [TEST C FALLIDO] Error al obtener invitaciones:', data)
    }
  } catch (err) {
    console.error('❌ [TEST C ERROR]:', err.message)
  }

  // ── PRUEBA 4: company/dashboard (Métricas del Funnel) ──
  console.log('📡 [TEST D] Consultando estadísticas de utilización (/api/company/dashboard)...')
  try {
    const res = await fetch(`${BACKEND_URL}/api/company/dashboard`, { headers })
    const data = await res.json()
    if (res.ok && data.stats) {
      console.log('✅ [TEST D PASADO] Métricas cargadas con éxito:')
      console.log(`   - Total Colaboradores registrados: ${data.stats.totalUsers}`)
      console.log(`   - Colaboradores activos (30 días): ${data.stats.activeUsers}`)
      console.log(`   - Tasa de adopción general: ${data.stats.adoptionRate}%`)
      console.log(`   - Total CVs optimizados: ${data.stats.cvOptimizerUse}`)
      console.log(`   - Total comparaciones de vacantes (match): ${data.stats.cvMatchUse}\n`)
    } else {
      console.error('❌ [TEST D FALLIDO] Error al obtener estadísticas:', data)
    }
  } catch (err) {
    console.error('❌ [TEST D ERROR]:', err.message)
  }

  console.log('===============================================================')
  console.log('PRUEBAS DE ADMINISTRACIÓN RRHH FINALIZADAS')
  console.log('===============================================================')
}

runAdminTests().catch(console.error)
