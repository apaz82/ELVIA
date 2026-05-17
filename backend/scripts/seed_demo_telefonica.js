// Seed de 10 usuarios demo para Telefonica (cohort telefonica-2026-05)
// Uso: cd backend && node scripts/seed_demo_telefonica.js
// Requiere: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en env (mismo que produccion)
//
// Idempotente: si un email ya existe, lo actualiza en vez de fallar.
// Borrado: para limpiar la cohorte despues del demo, corre:
//   DELETE FROM profiles WHERE cohort = 'telefonica-2026-05';
//   DELETE FROM auth.users WHERE email LIKE '%@elvia.demo';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  console.error('FALTA: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)

const COHORT = 'telefonica-2026-05'
const COMPANY_SLUG = 'telefonica'
const DEMO_PASSWORD = 'DemoElvia2026!'

// Persona demo con estados diferenciados:
// - state 'unlocked': hizo onboarding + Gerente al 100% -> ve todas las features
// - state 'in_progress': hizo onboarding, Gerente parcial -> solo Gerente desbloqueado
// - state 'fresh': recien activado, sin onboarding -> /bienvenida al login
const DEMO_USERS = [
  // ── FULLY UNLOCKED (5) — usalos para demo de features ──
  { nombre: 'Carmen',   apellido: 'Iglesias',   area: 'Comercial',     cargo_actual: 'Gerente de cuentas',     cv_opt: 4, cv_match: 8,  usage: 22, hired: true,  hired_company: 'Vodafone España',   state: 'unlocked' },
  { nombre: 'David',    apellido: 'Ruiz',       area: 'Tecnologia',    cargo_actual: 'Arquitecto cloud',       cv_opt: 5, cv_match: 12, usage: 31, hired: true,  hired_company: 'Amazon Web Services', state: 'unlocked' },
  { nombre: 'Pablo',    apellido: 'Martinez',   area: 'Tecnologia',    cargo_actual: 'Engineering Manager',    cv_opt: 5, cv_match: 11, usage: 28, hired: true,  hired_company: 'Glovo',             state: 'unlocked' },
  { nombre: 'Laura',    apellido: 'Fernandez',  area: 'Marketing',     cargo_actual: 'Brand Manager',          cv_opt: 3, cv_match: 6,  usage: 18, hired: false, state: 'unlocked' },
  { nombre: 'Javier',   apellido: 'Gomez',      area: 'Finanzas',      cargo_actual: 'Controller financiero',  cv_opt: 4, cv_match: 9,  usage: 25, hired: false, state: 'unlocked' },

  // ── IN PROGRESS (3) — gerente parcial, ven el progreso bloqueado ──
  { nombre: 'Sofia',    apellido: 'Lopez',      area: 'Personas',      cargo_actual: 'HRBP Senior',            cv_opt: 0, cv_match: 0,  usage: 6,  hired: false, state: 'in_progress' },
  { nombre: 'Marcos',   apellido: 'Hernandez',  area: 'Operaciones',   cargo_actual: 'Project Manager',        cv_opt: 0, cv_match: 0,  usage: 8,  hired: false, state: 'in_progress' },
  { nombre: 'Isabel',   apellido: 'Vargas',     area: 'Legal',         cargo_actual: 'Counsel corporativo',    cv_opt: 0, cv_match: 0,  usage: 4,  hired: false, state: 'in_progress' },

  // ── FRESH (2) — sin onboarding, van directo a /bienvenida ──
  { nombre: 'Andrea',   apellido: 'Santos',     area: 'Producto',      cargo_actual: 'Product Owner',          cv_opt: 0, cv_match: 0,  usage: 0,  hired: false, state: 'fresh' },
  { nombre: 'Roberto',  apellido: 'Castro',     area: 'Comercial',     cargo_actual: 'Director Regional',      cv_opt: 0, cv_match: 0,  usage: 0,  hired: false, state: 'fresh' },
]

// ── Plantillas de job_search_profile para alcanzar 100% del Gerente ──
function buildFullJobProfile(area, cargo) {
  return {
    perfil: {
      nivel_educativo: 'Pregrado',
      anios_experiencia: '8-12',
    },
    autoconocimiento: {
      hard_skills:  ['Excel avanzado', 'Power BI', 'SQL'],
      soft_skills:  ['Comunicacion', 'Liderazgo'],
      power_skills: ['Negociacion', 'Pensamiento estrategico'],
      top5empresas: ['Microsoft', 'Google', 'Amazon', 'IBM'],
    },
    semana: {
      bloques: {
        lunes_am: true, lunes_pm: true, martes_am: true, miercoles_pm: true,
      },
    },
    recursos: [
      { id: '1', nombre: 'Espacio de trabajo tranquilo', tengo: true },
      { id: '2', nombre: 'Conexion a internet estable', tengo: true },
      { id: '3', nombre: 'Celular activo', tengo: true },
    ],
    oferta: {
      cultura: ['Aprendizaje continuo', 'Equipos colaborativos', 'Innovacion'],
      oferta_valor: `Profesional con experiencia en ${area} en posiciones de ${cargo}. Aporto enfoque en resultados y trabajo en equipo.`,
    },
  }
}

function buildPartialJobProfile() {
  return {
    perfil: { nivel_educativo: 'Pregrado' },
    autoconocimiento: {
      hard_skills:  ['Excel'],
      soft_skills:  ['Comunicacion'],
    },
  }
}

const slugifyEmail = (nombre, apellido) =>
  (nombre + '.' + apellido)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z.]/g, '') + '@elvia.demo'

async function main() {
  // 1. Resolver company_id de Telefonica
  const { data: company, error: cErr } = await db
    .from('companies')
    .select('id, name')
    .eq('slug', COMPANY_SLUG)
    .single()

  if (cErr || !company) {
    console.error('No encontre la empresa con slug', COMPANY_SLUG, cErr?.message)
    process.exit(1)
  }
  console.log('Empresa target:', company.name, '(' + company.id + ')')

  let created = 0, updated = 0, errors = 0

  for (const u of DEMO_USERS) {
    const email = slugifyEmail(u.nombre, u.apellido)
    // Construir profile segun estado
    const isFresh      = u.state === 'fresh'
    const isInProgress = u.state === 'in_progress'

    const profile = {
      email_principal: email,
      // FRESH: nombre1 null -> dispara /bienvenida en el login
      nombre1:   isFresh ? null : u.nombre,
      apellido1: isFresh ? null : u.apellido,
      nombre:    isFresh ? null : (u.nombre + ' ' + u.apellido),
      pais:      isFresh ? null : 'España',
      telefono1: isFresh ? null : '+34600000000',
      salario_esperado: isFresh || isInProgress ? null : '50000',
      indicativo1: isFresh ? null : '+34',
      company_id: company.id,
      cohort: COHORT,
      role: 'user',
      plan: 'pro',
      cv_optimizer_count: u.cv_opt,
      cv_match_count: u.cv_match,
      usage_count: u.usage,
      hired_at: u.hired ? new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString() : null,
      hired_company: u.hired ? u.hired_company : null,
      // Gerente de Busqueda — unlocked tiene 100%, in_progress tiene parcial, fresh null
      job_search_profile: isFresh ? null
                       : isInProgress ? buildPartialJobProfile()
                       : buildFullJobProfile(u.area, u.cargo_actual),
    }

    // Buscar si ya existe el auth user
    const { data: listData } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const found = (listData?.users || []).find(au => (au.email || '').toLowerCase() === email)

    let userId
    if (found) {
      userId = found.id
      console.log('  [skip-create]', email, '(ya existe en auth)')
    } else {
      const { data: created_user, error: aErr } = await db.auth.admin.createUser({
        email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { nombre1: u.nombre, apellido1: u.apellido, demo: true },
      })
      if (aErr) {
        console.error('  [auth-error]', email, aErr.message)
        errors++
        continue
      }
      userId = created_user.user.id
      console.log('  [auth-created]', email)
    }

    // Upsert profile
    const { error: pErr } = await db
      .from('profiles')
      .upsert([{ id: userId, ...profile }], { onConflict: 'id' })

    if (pErr) {
      console.error('  [profile-error]', email, pErr.message)
      errors++
    } else {
      if (found) updated++; else created++
    }
  }

  // 2. Agregar todos al allowlist con status='activated'
  const allowlistRows = DEMO_USERS.map(u => ({
    company_id: company.id,
    email: slugifyEmail(u.nombre, u.apellido),
    nombre: u.nombre,
    apellido: u.apellido,
    cohort: COHORT,
    area: u.area,
    cargo_actual: u.cargo_actual,
    status: 'activated',
    activated_at: new Date().toISOString(),
  }))

  const { error: alErr } = await db
    .from('company_allowlist')
    .upsert(allowlistRows, { onConflict: 'company_id,email' })

  if (alErr) {
    console.error('Error upsert allowlist:', alErr.message)
  } else {
    console.log('Allowlist actualizado con', allowlistRows.length, 'entradas activadas')
  }

  // 3. Agregar 5 entradas pending al allowlist (para que el funnel muestre invitados-pero-no-activados)
  const pendingRows = [
    { nombre: 'Lucia',   apellido: 'Ortega',   area: 'Marketing',   cargo_actual: 'Social Media Manager' },
    { nombre: 'Daniel',  apellido: 'Romero',   area: 'Tecnologia',  cargo_actual: 'DevOps Engineer' },
    { nombre: 'Patricia',apellido: 'Jimenez',  area: 'Comercial',   cargo_actual: 'Key Account Manager' },
    { nombre: 'Alvaro',  apellido: 'Navarro',  area: 'Operaciones', cargo_actual: 'Operations Lead' },
    { nombre: 'Beatriz', apellido: 'Moreno',   area: 'Personas',    cargo_actual: 'Talent Acquisition' },
  ].map(u => ({
    company_id: company.id,
    email: (u.nombre + '.' + u.apellido).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@elvia.demo',
    nombre: u.nombre,
    apellido: u.apellido,
    cohort: COHORT,
    area: u.area,
    cargo_actual: u.cargo_actual,
    status: 'pending',
  }))

  const { error: pAlErr } = await db
    .from('company_allowlist')
    .upsert(pendingRows, { onConflict: 'company_id,email' })

  if (pAlErr) console.error('Error pending rows:', pAlErr.message)
  else console.log('Pending rows:', pendingRows.length)

  console.log('\nResumen:')
  console.log('  Profiles activados:', created + updated, '(nuevos', created, '/ existentes', updated, ')')
  console.log('  Allowlist activated:', allowlistRows.length)
  console.log('  Allowlist pending:', pendingRows.length)
  console.log('  Errores:', errors)
  console.log('\nDashboard mostrara:')
  console.log('  Invitados:', allowlistRows.length + pendingRows.length)
  console.log('  Activados:', allowlistRows.length)
  console.log('  Tasa activacion:', Math.round((allowlistRows.length / (allowlistRows.length + pendingRows.length)) * 100) + '%')
  console.log('  Empleados:', DEMO_USERS.filter(u => u.hired).length)
  console.log('\nEstados para demo de flujo de usuario:')
  console.log('  FULLY UNLOCKED (acceso completo a herramientas):')
  DEMO_USERS.filter(u => u.state === 'unlocked').forEach(u => console.log('    -', slugifyEmail(u.nombre, u.apellido)))
  console.log('  IN PROGRESS (solo Gerente desbloqueado):')
  DEMO_USERS.filter(u => u.state === 'in_progress').forEach(u => console.log('    -', slugifyEmail(u.nombre, u.apellido)))
  console.log('  FRESH (login -> /bienvenida):')
  DEMO_USERS.filter(u => u.state === 'fresh').forEach(u => console.log('    -', slugifyEmail(u.nombre, u.apellido)))
  console.log('\nPassword: ' + DEMO_PASSWORD)
}

main().catch(e => { console.error(e); process.exit(1) })
