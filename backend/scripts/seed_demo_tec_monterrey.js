// Seed demo: Tecnológico de Monterrey
// Uso: cd backend && node scripts/seed_demo_tec_monterrey.js
// Requiere: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en .env (mismo que producción)
//
// Crea:
//   1. 6 candidatos demo (@elvia.demo) con estados unlocked/in_progress/fresh
//   2. 3 pending en allowlist (invitados sin activar)
//   3. 1 cuenta HR (company_admin) para el panel de empleabilidad
//
// Idempotente: upsert en profiles, skip-create si ya existe en auth.
// Borrado: DELETE FROM profiles WHERE cohort = 'tec-monterrey-2026-05';
//          DELETE FROM auth.users WHERE email LIKE '%@elvia.demo' OR email = 'hr.tec@elvia.demo';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  console.error('FALTA: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)

const COHORT        = 'tec-monterrey-2026-05'
const COMPANY_SLUG  = 'tec-monterrey'
const DEMO_PASSWORD = 'DemoElvia2026!'

const DEMO_USERS = [
  // ── FULLY UNLOCKED (3) — usa estos para demo de features ──
  { nombre: 'Valentina', apellido: 'Reyes',     area: 'Marketing',    cargo_actual: 'Brand Manager',           cv_opt: 4, cv_match: 9,  usage: 20, hired: true,  hired_company: 'Grupo Bimbo',  state: 'unlocked' },
  { nombre: 'Carlos',    apellido: 'Morales',   area: 'Tecnología',   cargo_actual: 'Software Engineer',       cv_opt: 5, cv_match: 11, usage: 27, hired: true,  hired_company: 'BBVA México',  state: 'unlocked' },
  { nombre: 'Ana',       apellido: 'Torres',    area: 'Finanzas',     cargo_actual: 'Analista financiero',      cv_opt: 3, cv_match: 7,  usage: 16, hired: false, state: 'unlocked' },

  // ── IN PROGRESS (2) — onboarding hecho, Gerente parcial ──
  { nombre: 'Diego',     apellido: 'Sanchez',   area: 'Operaciones',  cargo_actual: 'Coordinador de proyectos', cv_opt: 0, cv_match: 0,  usage: 5,  hired: false, state: 'in_progress' },
  { nombre: 'Fernanda',  apellido: 'Castro',    area: 'Comunicación', cargo_actual: 'Relaciones Públicas Jr',   cv_opt: 0, cv_match: 0,  usage: 3,  hired: false, state: 'in_progress' },

  // ── FRESH (1) — login → /bienvenida onboarding ──
  { nombre: 'Miguel',    apellido: 'Hernandez', area: 'Ingeniería',   cargo_actual: 'Ingeniero Industrial',     cv_opt: 0, cv_match: 0,  usage: 0,  hired: false, state: 'fresh' },
]

function buildFullJobProfile(area, cargo) {
  return {
    perfil: {
      nivel_educativo: 'Pregrado',
      anios_experiencia: '0-2',
    },
    autoconocimiento: {
      hard_skills:  [
        'Gestión de proyectos (Project Management) y metodologías ágiles',
        'Modelado financiero, minería de datos financieros y gestión de inversiones',
        'Marketing digital avanzado (SEO, SEM y campañas de correo)',
      ],
      soft_skills:  ['Pensamiento analítico', 'Comunicación', 'Trabajo en equipo y colaboración'],
      power_skills: [
        'Inteligencia Artificial (IA), Machine Learning e Ingeniería de Prompts',
        'Gestión de proyectos (Project Management) y metodologías ágiles',
      ],
      top5empresas: ['BBVA México', 'Cemex', 'Grupo Bimbo', 'Rappi', 'GBM'],
    },
    semana: {
      bloques: {
        lunes_am: true, lunes_pm: true, martes_am: true, miercoles_pm: true,
      },
    },
    recursos: [
      { id: '1', nombre: 'Espacio de trabajo tranquilo', tengo: true },
      { id: '2', nombre: 'Conexión a internet estable',  tengo: true },
      { id: '3', nombre: 'Celular activo',               tengo: true },
    ],
    oferta: {
      oferta_valor: `Profesional egresado del Tecnológico de Monterrey con especialización en ${area}. Combino sólida formación técnica con experiencia en proyectos reales. Aporto pensamiento analítico, adaptabilidad y orientación a resultados en entornos dinámicos.`,
      ikigai_amas:     `Me apasiona resolver problemas complejos en ${area} y crear soluciones innovadoras junto a equipos multidisciplinarios. Disfruto del aprendizaje continuo y de enfrentar desafíos que me permitan crecer profesional y personalmente.`,
      ikigai_bueno:    `Tengo facilidad para analizar situaciones complejas, estructurar procesos y comunicar ideas con claridad. Mi formación en el Tec desarrolló pensamiento crítico y capacidad de ejecución en proyectos bajo presión y con recursos limitados.`,
      ikigai_necesita: `El mercado demanda profesionales que integren habilidades técnicas con visión estratégica. En ${area} existe una creciente necesidad de perfiles que combinen conocimiento especializado con competencias digitales y capacidad de liderazgo.`,
      ikigai_pagar:    `Las organizaciones invierten en profesionales que generan resultados medibles. Mi especialización en ${area} me permite ofrecer soluciones que impactan directamente en la rentabilidad, eficiencia operativa o posicionamiento de la empresa en el mercado.`,
    },
  }
}

function buildPartialJobProfile() {
  return {
    perfil: { nivel_educativo: 'Pregrado' },
    autoconocimiento: {
      hard_skills: ['Gestión de proyectos (Project Management) y metodologías ágiles'],
      soft_skills: ['Comunicación'],
    },
  }
}

const slugifyEmail = (nombre, apellido) =>
  (nombre + '.' + apellido)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z.]/g, '') + '@elvia.demo'

async function getOrCreateAuthUser(email, nombre, apellido, extraMeta = {}) {
  const { data: listData } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const found = (listData?.users || []).find(u => (u.email || '').toLowerCase() === email)
  if (found) {
    console.log('  [skip-create]', email, '(ya existe en auth)')
    return found.id
  }
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { nombre1: nombre, apellido1: apellido, demo: true, ...extraMeta },
  })
  if (error) throw new Error(`auth error ${email}: ${error.message}`)
  console.log('  [auth-created]', email)
  return created.user.id
}

async function main() {
  // Resolver company_id
  const { data: company, error: cErr } = await db
    .from('companies')
    .select('id, name')
    .eq('slug', COMPANY_SLUG)
    .single()

  if (cErr || !company) {
    console.error('Empresa no encontrada con slug', COMPANY_SLUG, '— corre 009_seed_tec_monterrey.sql primero.')
    process.exit(1)
  }
  console.log('Empresa:', company.name, '(' + company.id + ')')

  // ── 1. Candidatos demo ──
  let created = 0, updated = 0, errors = 0

  for (const u of DEMO_USERS) {
    const email     = slugifyEmail(u.nombre, u.apellido)
    const isFresh   = u.state === 'fresh'
    const isPartial = u.state === 'in_progress'

    let userId
    try {
      userId = await getOrCreateAuthUser(email, u.nombre, u.apellido)
    } catch (e) {
      console.error('  [error]', e.message); errors++; continue
    }

    const profile = {
      id: userId,
      email_principal: email,
      nombre1:   isFresh ? null : u.nombre,
      apellido1: isFresh ? null : u.apellido,
      nombre:    isFresh ? null : (u.nombre + ' ' + u.apellido),
      pais:      isFresh ? null : 'México',
      telefono1: isFresh ? null : '+5255000000',
      salario_esperado: (isFresh || isPartial) ? null : '25000',
      indicativo1: isFresh ? null : '+52',
      company_id: company.id,
      cohort: COHORT,
      role: 'user',
      plan: 'pro',
      cv_optimizer_count: u.cv_opt,
      cv_match_count: u.cv_match,
      usage_count: u.usage,
      hired_at: u.hired ? new Date(Date.now() - Math.floor(Math.random() * 45) * 86400000).toISOString() : null,
      hired_company: u.hired ? u.hired_company : null,
      job_search_profile: isFresh   ? null
                        : isPartial ? buildPartialJobProfile()
                        : buildFullJobProfile(u.area, u.cargo_actual),
    }

    const alreadyExisted = !!(await db.auth.admin.listUsers({ page: 1, perPage: 1 }))
    const { error: pErr } = await db.from('profiles').upsert([profile], { onConflict: 'id' })
    if (pErr) { console.error('  [profile-error]', email, pErr.message); errors++ }
    else       { created++ }
  }

  // ── Allowlist activados ──
  const allowlistRows = DEMO_USERS.map(u => ({
    company_id:   company.id,
    email:        slugifyEmail(u.nombre, u.apellido),
    nombre:       u.nombre,
    apellido:     u.apellido,
    cohort:       COHORT,
    area:         u.area,
    cargo_actual: u.cargo_actual,
    status:       'activated',
    activated_at: new Date().toISOString(),
  }))

  const { error: alErr } = await db
    .from('company_allowlist')
    .upsert(allowlistRows, { onConflict: 'company_id,email' })
  if (alErr) console.error('Allowlist error:', alErr.message)
  else       console.log('Allowlist activado:', allowlistRows.length, 'entradas')

  // ── Allowlist pending ──
  const pendingRows = [
    { nombre: 'Mariana',  apellido: 'Gutierrez', area: 'Diseño',     cargo_actual: 'UX Designer' },
    { nombre: 'Luis',     apellido: 'Ramirez',   area: 'Tecnología', cargo_actual: 'Data Analyst' },
    { nombre: 'Paola',    apellido: 'Jimenez',   area: 'Negocios',   cargo_actual: 'Business Analyst' },
  ].map(u => ({
    company_id:   company.id,
    email:        slugifyEmail(u.nombre, u.apellido),
    nombre:       u.nombre,
    apellido:     u.apellido,
    cohort:       COHORT,
    area:         u.area,
    cargo_actual: u.cargo_actual,
    status:       'pending',
  }))

  const { error: pAlErr } = await db
    .from('company_allowlist')
    .upsert(pendingRows, { onConflict: 'company_id,email' })
  if (pAlErr) console.error('Pending rows error:', pAlErr.message)
  else        console.log('Allowlist pending:', pendingRows.length, 'entradas')

  // ── 2. Cuenta HR (company_admin) ──
  const HR_EMAIL = 'hr.tec@elvia.demo'
  let hrUserId
  try {
    hrUserId = await getOrCreateAuthUser(HR_EMAIL, 'Coordinadora', 'Empleabilidad', { role: 'company_admin' })
  } catch (e) {
    console.error('  [hr-error]', e.message); errors++
  }

  if (hrUserId) {
    const { error: hrErr } = await db.from('profiles').upsert([{
      id:              hrUserId,
      email_principal: HR_EMAIL,
      nombre1:         'Coordinadora',
      apellido1:       'Empleabilidad',
      nombre:          'Coordinadora Empleabilidad',
      company_id:      company.id,
      cohort:          COHORT,
      role:            'company_admin',
      plan:            'pro',
    }], { onConflict: 'id' })

    if (hrErr) console.error('  [hr-profile-error]', hrErr.message)
    else       console.log('  [hr-admin-ok]', HR_EMAIL, '→ company_admin del Tec')
  }

  // ── Resumen ──
  console.log('\n--- Resumen ---')
  console.log('Candidatos demo:', DEMO_USERS.length, '(errores:', errors, ')')
  console.log('Allowlist activated:', allowlistRows.length)
  console.log('Allowlist pending:', pendingRows.length)
  console.log('\nCuentas para demo:')
  console.log('  HR Admin:       hr.tec@elvia.demo          →  /empresa-admin')
  DEMO_USERS.filter(u => u.state === 'unlocked').forEach(u =>
    console.log('  UNLOCKED:      ', slugifyEmail(u.nombre, u.apellido)))
  DEMO_USERS.filter(u => u.state === 'in_progress').forEach(u =>
    console.log('  IN PROGRESS:   ', slugifyEmail(u.nombre, u.apellido)))
  DEMO_USERS.filter(u => u.state === 'fresh').forEach(u =>
    console.log('  FRESH:         ', slugifyEmail(u.nombre, u.apellido)))
  console.log('\nPassword todos: ' + DEMO_PASSWORD)
  console.log('URL candidatos: /empresas/tec-monterrey/registro')
  console.log('URL HR:         /empresas/tec-monterrey/hr')
}

main().catch(e => { console.error(e); process.exit(1) })
