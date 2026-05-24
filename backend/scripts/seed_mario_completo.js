// Seed del usuario Mario Bahamonde 2 — experiencia fully unlocked para demo
// Email:    mario.bahamonde2@telefonica.com
// Password: DemoElvia2026!
//
// Uso: cd backend && node scripts/seed_mario_completo.js
// Requiere: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en backend/.env
//
// Idempotente: si ya existe lo sobreescribe desde cero (borra auth + profile).

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  console.error('ERROR: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en backend/.env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)

const TARGET_EMAIL  = 'mario.bahamonde2@telefonica.com'
const DEMO_PASSWORD = 'DemoElvia2026!'
const COMPANY_SLUG  = 'telefonica'
const COHORT        = 'telefonica-2026-05'

// ── Gerente de Búsqueda: perfil Director General Telco al 100% ───────────────
const JOB_SEARCH_PROFILE = {
  perfil: {
    nivel_educativo:   'Posgrado',
    anios_experiencia: 'Más de 15',
    salario_actual:    '180000',
    salario_esperado:  '200000',
    modalidad:         'Híbrido',
    disponibilidad:    'Inmediata',
  },
  autoconocimiento: {
    hard_skills: [
      'Gestión de P&L',
      'Transformación digital',
      'Telecomunicaciones B2B/B2C',
      'Planificación estratégica',
      'M&A y due diligence',
      'Regulación sector telco',
      'OKRs y KPIs ejecutivos',
      'Gestión de carteras de proyectos',
      'Negociación de contratos enterprise',
      'Análisis financiero y forecasting',
      'CRM Salesforce / SAP',
      'Cloud computing (AWS / Azure)',
      'Gobierno corporativo',
      'Gestión de proveedores',
      'Lean Six Sigma',
      'Reportes a Junta Directiva',
    ],
    soft_skills: [
      'Liderazgo ejecutivo',
      'Comunicación estratégica',
      'Pensamiento sistémico',
      'Resiliencia bajo presión',
      'Gestión del cambio',
      'Influencia sin autoridad directa',
      'Empatía organizacional',
      'Orientación a resultados',
      'Escucha activa',
      'Trabajo colaborativo',
      'Adaptabilidad',
      'Mentoría de equipos',
      'Gestión de stakeholders',
      'Toma de decisiones bajo incertidumbre',
      'Inteligencia emocional',
      'Innovación aplicada',
      'Networking estratégico',
      'Visión a largo plazo',
      'Integridad y ética profesional',
    ],
    power_skills: [
      'Liderazgo de equipos multiculturales (+500 personas)',
      'Transformación de unidades de negocio en crisis',
      'Diseño de estrategia go-to-market B2B enterprise',
      'Gestión de alianzas estratégicas internacionales',
      'Creación de cultura de alto desempeño',
      'Comunicación ejecutiva ante inversores y medios',
      'Implementación de metodologías ágiles a escala',
      'Gestión de proyectos de infraestructura crítica',
      'Desarrollo y retención de talento directivo',
      'Negociación en entornos regulados',
      'Gestión de crisis reputacional',
      'Integración post-fusión y adquisición',
      'Expansión a nuevos mercados LATAM',
      'Storytelling ejecutivo para C-Suite',
      'Construcción de tableros de gobierno (Board)',
      'Optimización de costos operacionales a gran escala',
    ],
    top5empresas: [
      'Movistar',
      'Claro',
      'Amazon Web Services',
      'Microsoft LATAM',
      'Grupo Santander',
    ],
  },
  semana: {
    bloques: {
      lunes_am: true, lunes_pm: true,
      martes_am: true, martes_pm: true,
      miercoles_am: true, miercoles_pm: true,
      jueves_am: true, jueves_pm: true,
      viernes_am: true,
    },
  },
  recursos: [
    { id: '1', nombre: 'Espacio de trabajo privado y sin interrupciones', tengo: true },
    { id: '2', nombre: 'Conexión a internet de alta velocidad (fibra)', tengo: true },
    { id: '3', nombre: 'Laptop corporativa actualizada', tengo: true },
    { id: '4', nombre: 'Acceso a LinkedIn Premium', tengo: true },
    { id: '5', nombre: 'Coach ejecutivo de carrera', tengo: true },
  ],
  oferta: {
    cultura: [
      'Aprendizaje continuo',
      'Diversidad e inclusión',
      'Innovación disruptiva',
      'Equipos de alto desempeño',
    ],
    oferta_valor: `Director General con 18 años de experiencia en el sector de telecomunicaciones, liderando operaciones de más de USD 500M en ingresos anuales y equipos de más de 500 personas en LATAM y España. Combino visión estratégica con capacidad de ejecución, habiendo liderado tres transformaciones digitales exitosas y la integración de dos procesos de M&A. Mi diferencial es la habilidad de conectar la estrategia con el equipo operacional, generando resultados medibles en entornos de alta complejidad y cambio regulatorio constante.`,
    ikigai_amas: `Liderar organizaciones en momentos de transformación, especialmente cuando el equipo necesita claridad de dirección y energía para afrontar cambios difíciles. Me apasiona ver a personas crecer en sus carreras dentro de los equipos que dirijo. También disfruto profundamente la construcción de estrategias de largo plazo que se traducen en resultados tangibles para clientes, colaboradores e inversionistas.`,
    ikigai_bueno: `Tengo habilidad comprobada para diseñar e implementar estrategias de negocio en entornos regulados y cambiantes. Soy particularmente efectivo para alinear equipos multidisciplinarios alrededor de objetivos comunes, comunicar con claridad en todos los niveles de la organización, y tomar decisiones complejas con información incompleta. Mi historial en telecomunicaciones incluye crecimiento orgánico e inorgánico, expansiones regionales y reducciones de costos sin pérdida de calidad.`,
    ikigai_necesita: `El mercado necesita directivos que entiendan tanto la dimensión tecnológica como la humana de la transformación digital. Las empresas en LATAM buscan líderes que puedan navegar la complejidad regulatoria, la presión de costos y la aceleración tecnológica simultáneamente. También existe una creciente demanda de directivos que sepan gestionar el talento en entornos híbridos y construir culturas de innovación sin perder la eficiencia operacional.`,
    ikigai_pagar: `Las organizaciones de telecomunicaciones, tecnología, infraestructura y servicios empresariales que buscan crecer o transformarse están dispuestas a invertir en perfiles directivos con experiencia comprobada en gestión de P&L, transformación digital y liderazgo de equipos grandes. También existe mercado en fondos de private equity que adquieren compañías en el sector y necesitan directivos con capacidad de generación de valor post-inversión.`,
  },
}

// ── CVs optimizados realistas ─────────────────────────────────────────────────
const CV_OPTIMIZADO_1 = `MARIO BAHAMONDE
Director General | Telecomunicaciones & Transformación Digital
mario.bahamonde2@telefonica.com | +52 55 0000 0000 | LinkedIn: linkedin.com/in/mariobahamonde | Ciudad de México, México

PERFIL EJECUTIVO
Director General con 18 años de experiencia en el sector de telecomunicaciones, con historial comprobado de liderazgo de operaciones de más de USD 500M en ingresos anuales y gestión de equipos de más de 500 personas en LATAM y España. Especialista en transformación digital, expansión de mercados y procesos de M&A. Orientado a resultados con capacidad de conectar estrategia corporativa con ejecución operacional en entornos de alta complejidad.

EXPERIENCIA PROFESIONAL

DIRECTOR GENERAL — Telefónica México | Ago 2019 – Actual
• Lideré la transformación digital de la unidad de negocio B2B, incrementando los ingresos en un 34% en 3 años (de USD 210M a USD 282M).
• Dirigí un equipo de 520 personas distribuidas en 8 ciudades, implementando modelo de trabajo híbrido con índice de retención del 91%.
• Supervisé la integración de dos adquisiciones estratégicas (Grupo TelData y NetSoluciones), completando el proceso 2 meses antes del plazo previsto.
• Reduje los costos operacionales en USD 18M anuales mediante la optimización de la cadena de proveedores y automatización de procesos clave.
• Coordiné la presentación de resultados trimestrales ante el Consejo de Administración global en Madrid y ante reguladores de la SCT.

DIRECTOR DE OPERACIONES — Movistar Chile | Mar 2015 – Jul 2019
• Gestioné el portafolio de servicios enterprise con más de 400 clientes corporativos y ARR de USD 95M.
• Implementé metodología OKR en las áreas de Operaciones, Tecnología y Ventas, elevando el cumplimiento de metas del 61% al 87% en 18 meses.
• Lideré el proyecto de modernización de infraestructura de red con inversión de USD 45M, entregado en tiempo y presupuesto.

GERENTE DE DESARROLLO DE NEGOCIOS — Claro Colombia | Ene 2011 – Feb 2015
• Desarrollé el portafolio de soluciones cloud y conectividad B2B, cerrando contratos por USD 38M en 24 meses.
• Construí equipo comercial de alto desempeño de 45 personas con cuota promedio superada en 118%.

EDUCACIÓN
MBA — Instituto de Empresa (IE Business School), Madrid, España | 2010
Ingeniería en Telecomunicaciones — Universidad de Chile | 2005

IDIOMAS
Español (nativo) | Inglés (C1 — Business fluent) | Portugués (B2)

HABILIDADES CLAVE
Gestión de P&L | Transformación digital | Planificación estratégica | M&A | Negociación enterprise | OKRs | CRM Salesforce | Gobierno corporativo | Lean Six Sigma | AWS / Azure`

const CV_MATCH_1 = `MARIO BAHAMONDE — CV ADAPTADO: Director Comercial B2B Enterprise
[Versión optimizada para Movistar LATAM — Dirección Comercial B2B]

PERFIL
Directivo con 18 años en telecomunicaciones y track record comprobado en desarrollo de negocio B2B enterprise. Historial de construcción y liderazgo de equipos comerciales de alto desempeño con cuotas consistentemente superadas. Experto en soluciones cloud, conectividad y servicios gestionados para clientes corporativos de gran escala en LATAM.

LOGROS CLAVE (Relevantes para la posición)
✓ Portafolio B2B de USD 95M ARR gestionado durante 4 años en Movistar Chile
✓ Cierre de contratos enterprise por USD 38M en 24 meses en Claro Colombia
✓ Construcción de equipo comercial de 45 personas con cuota promedio de 118%
✓ Implementación de CRM Salesforce para equipo de 120 comerciales

MATCH CON LA VACANTE: 92%
Habilidades críticas cubiertas: Gestión P&L, Ventas B2B enterprise, Liderazgo de equipos, CRM, Telecomunicaciones
Áreas de desarrollo: Knowledge específico de portafolio IoT (recomiendo certificación AWS IoT Core)`

// ── Pipeline de vacantes ──────────────────────────────────────────────────────
const SAVED_JOBS = [
  {
    empresa: 'Movistar LATAM',
    cargo: 'VP de Transformación Digital',
    descripcion: 'Liderazgo de la agenda de transformación digital para 8 mercados de LATAM. Reporte directo al CEO. Gestión de equipo de 200+ personas y presupuesto de USD 80M.',
    estado: 'En entrevistas',
    url: 'https://www.linkedin.com/jobs',
    metadata: { matchScore: 94, via: 'LinkedIn', notas: 'Entrevista con CHRO el 26-may. Preparar caso de transformación Telefónica México.' },
  },
  {
    empresa: 'Claro Colombia',
    cargo: 'Director General Empresas',
    descripcion: 'Dirección de la unidad de negocio empresarial con P&L de USD 300M. Liderazgo de equipos comerciales, operacionales y tecnológicos.',
    estado: 'Aplicado',
    url: 'https://www.linkedin.com/jobs',
    metadata: { matchScore: 89, via: 'Red de contactos', notas: 'Referido por Jorge Medina (ex-Telefónica). Esperar respuesta de RRHH.' },
  },
  {
    empresa: 'Amazon Web Services',
    cargo: 'Country Manager México & CA',
    descripcion: 'Liderazgo del negocio de AWS en México y Centroamérica. Gestión de ventas enterprise, alianzas y ecosistema de partners.',
    estado: 'Descubierto',
    url: 'https://www.linkedin.com/jobs',
    metadata: { matchScore: 81, via: 'LinkedIn', notas: 'Rol interesante. Evaluar si el cambio a Big Tech tiene sentido en este momento.' },
  },
  {
    empresa: 'Grupo Santander',
    cargo: 'Director de Transformación Digital — LATAM',
    descripcion: 'Liderar la agenda de digitalización de servicios bancarios en 6 países de América Latina.',
    estado: 'No avanzó',
    url: 'https://www.linkedin.com/jobs',
    metadata: { matchScore: 72, via: 'Headhunter', notas: 'Prefirieron perfil con experiencia en sector financiero. Feedback: skills de liderazgo sólidos.' },
  },
]

// ── Bienestar (2 semanas de check-ins) ───────────────────────────────────────
function buildBienestarData() {
  const checkins = {}
  const radar    = {}
  const hoy = new Date()

  // Últimos 10 días con check-ins (no todos los días — realista)
  const diasConCheckin = [0, 1, 3, 4, 6, 7, 8, 10, 11, 13]
  const emociones = ['motivado', 'confiado', 'tranquilo', 'ansioso', 'motivado', 'confiado', 'motivado', 'cansado', 'confiado', 'motivado']

  diasConCheckin.forEach((offset, i) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() - offset)
    const key = d.toISOString().slice(0, 10)
    checkins[key] = { emocion: emociones[i], nota: '' }
  })

  // Radar de la semana actual
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  const weekKey = `semana_semana_${weekNum}_${d.getFullYear()}`

  radar[weekKey] = {
    energia:     4,
    confianza:   5,
    enfoque:     4,
    ansiedad:    2,
    resiliencia: 5,
  }

  return { checkins, radar }
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Seed Mario Bahamonde 2 — Fully Unlocked ===\n')

  // 1. Resolver company_id
  const { data: company, error: cErr } = await db
    .from('companies').select('id, name').eq('slug', COMPANY_SLUG).single()
  if (cErr || !company) {
    console.error('No se encontró la empresa:', COMPANY_SLUG, cErr?.message)
    process.exit(1)
  }
  console.log('Empresa:', company.name, '—', company.id)

  // 2. Borrar usuario previo si existe (idempotente)
  const { data: listData } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = (listData?.users || []).find(u => (u.email || '').toLowerCase() === TARGET_EMAIL.toLowerCase())

  if (existing) {
    console.log('Borrando usuario previo:', existing.id)
    const { error: delErr } = await db.auth.admin.deleteUser(existing.id)
    if (delErr) { console.error('Error al borrar:', delErr.message); process.exit(1) }
    console.log('Usuario previo eliminado.')
  }

  // 3. Crear usuario en auth (auto-confirmado)
  const { data: newAuth, error: aErr } = await db.auth.admin.createUser({
    email: TARGET_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { nombre1: 'Mario', apellido1: 'Bahamonde', demo: true },
  })
  if (aErr) { console.error('Error creando auth user:', aErr.message); process.exit(1) }

  const userId = newAuth.user.id
  console.log('Auth creado — ID:', userId)

  // 4. Upsert profile completo (fully unlocked)
  const bienestar = buildBienestarData()
  const { error: pErr } = await db.from('profiles').upsert([{
    id:                userId,
    email_principal:   TARGET_EMAIL,
    nombre1:           'Mario',
    apellido1:         'Bahamonde',
    nombre:            'Mario Bahamonde',
    pais:              'México',
    ciudad:            'Ciudad de México',
    telefono1:         '+52 55 0000 0000',
    indicativo1:       '+52',
    salario_esperado:  '200000',
    company_id:        company.id,
    cohort:            COHORT,
    role:              'user',
    plan:              'pro',
    cv_optimizer_count: 5,
    cv_match_count:     8,
    usage_count:        28,
    job_search_profile: JOB_SEARCH_PROFILE,
    bienestar_data:     bienestar,
  }], { onConflict: 'id' })

  if (pErr) { console.error('Error en profile:', pErr.message); process.exit(1) }
  console.log('Profile creado al 100% con bienestar_data.')

  // 5. CV results — 1 optimizado + 2 match
  const cvRows = [
    {
      user_id:    userId,
      tipo:       'optimize',
      contenido:  CV_OPTIMIZADO_1,
      metadata:   { titulo: 'CV Ejecutivo — Director General Telco', version: 1 },
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      user_id:    userId,
      tipo:       'match',
      contenido:  CV_MATCH_1,
      metadata:   { matchScore: 94, empresa: 'Movistar LATAM', cargo: 'VP Transformación Digital' },
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      user_id:    userId,
      tipo:       'match',
      contenido:  '[Match CV vs vacante Director General Empresas — Claro Colombia. Score: 89%]',
      metadata:   { matchScore: 89, empresa: 'Claro Colombia', cargo: 'Director General Empresas' },
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ]

  const { error: cvErr } = await db.from('cv_results').insert(cvRows)
  if (cvErr) { console.error('Error en cv_results:', cvErr.message) }
  else console.log('CV results insertados:', cvRows.length)

  // 6. Pipeline de vacantes
  const jobRows = SAVED_JOBS.map(j => ({
    user_id:     userId,
    empresa:     j.empresa,
    cargo:       j.cargo,
    descripcion: j.descripcion,
    estado:      j.estado,
    url:         j.url,
    metadata:    j.metadata,
    created_at:  new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString(),
  }))

  const { error: jErr } = await db.from('saved_jobs').insert(jobRows)
  if (jErr) { console.error('Error en saved_jobs:', jErr.message) }
  else console.log('Pipeline insertado:', jobRows.length, 'vacantes')

  // 7. Allowlist — activado
  const { error: alErr } = await db.from('company_allowlist').upsert([{
    company_id:   company.id,
    email:        TARGET_EMAIL.toLowerCase(),
    nombre:       'Mario',
    apellido:     'Bahamonde',
    cohort:       COHORT,
    area:         'Dirección General',
    cargo_actual: 'Director General',
    status:       'activated',
    activated_at: new Date().toISOString(),
  }], { onConflict: 'company_id,email' })

  if (alErr) { console.error('Error en allowlist:', alErr.message) }
  else console.log('Allowlist activado.')

  console.log('\n==============================================')
  console.log('USUARIO LISTO:')
  console.log('  Email:    ', TARGET_EMAIL)
  console.log('  Password: ', DEMO_PASSWORD)
  console.log('  Estado:   Fully Unlocked (Dashboard + todas las features)')
  console.log('  Pipeline: 4 vacantes (En entrevistas, Aplicado, Descubierto, No avanzó)')
  console.log('  CVs:      1 optimizado + 2 análisis de match (94% y 89%)')
  console.log('  Bienestar: 10 check-ins + radar semanal')
  console.log('\nURL de acceso:')
  console.log('  Candidato: https://www.elvia.lat/auth')
  console.log('  HR Admin:  https://www.elvia.lat/empresas/telefonica/hr')
  console.log('==============================================\n')
}

main().catch(e => { console.error('Error inesperado:', e); process.exit(1) })
