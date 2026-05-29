// Cálculo de progreso del Gerente de Búsqueda — funciones puras sin dependencias React
// Importar desde AuthContext y ProyectoLaboral para mantener una sola fuente de verdad

export const RECURSOS_DEFAULT = [
  { id:'2',      nombre:'Conexión a internet estable',  descripcion:'Necesaria para aplicar, videollamadas y LinkedIn.',      costo:0, tengo:false },
  { id:'3',      nombre:'Celular activo',               descripcion:'Para recibir llamadas de reclutadores.',                 costo:0, tengo:false },
  { id:'4',      nombre:'LinkedIn Premium',             descripcion:'La red #1 para ser encontrado por reclutadores.',        costo:0, tengo:false },
  { id:'5',      nombre:'Transporte a entrevistas',     descripcion:'Transporte público o privado + estacionamiento.',        costo:0, tengo:false },
  { id:'6',      nombre:'Networking',                   descripcion:'Eventos, membresías o herramientas para ampliar tu red profesional.',     costo:0, tengo:false },
  { id:'7',      nombre:'Café / Coworking',             descripcion:'Si prefieres salir de casa para más productividad.',     costo:0, tengo:false },
  { id:'optima', nombre:'Suscripción ELVIA',            descripcion:'Tu plan activo de ELVIA.',                               costo:0, tengo:false, obligatorio:true, b2cOnly:true },
]

// IDs de documentos del pilar Documentos (sin referencias a componentes React)
const DOCS_IDS = ['cv', 'linkedin', 'cv_vacante', 'entrevista', 'carta', 'referencias']

export function calcPerfilPts(perfil, jpData) {
  let pts = 0
  if (String(perfil?.nombre1||'').trim().length>1) pts+=7
  if (String(perfil?.pais||'').trim().length>1) pts+=3
  if (String(perfil?.telefono1||'').trim().length>4) pts+=3
  if (String(perfil?.salario_esperado||'').trim().length>1) pts+=3
  if (String(jpData?.perfil?.nivel_educativo||'').length>1) pts+=2
  if (String(jpData?.perfil?.anios_experiencia||'').length>0) pts+=2
  // Top 5 Compañías — movido desde Autoconocimiento al Perfilador (lectura dual para migración gradual)
  const empresas = Array.isArray(jpData?.perfil?.top5empresas) ? jpData.perfil.top5empresas
    : (Array.isArray(jpData?.autoconocimiento?.top5empresas) ? jpData.autoconocimiento.top5empresas : [])
  if (empresas.filter(function(e){return e && String(e).trim()}).length >= 1) pts += 5
  return Math.min(pts, 25)
}

export function calcularProgreso(data, perfil) {
  let core = 0
  core += calcPerfilPts(perfil, data)

  const auto = (data&&data.autoconocimiento) ? data.autoconocimiento : {}
  let autoPts = 0

  // 1. Hard Skills - 8 pts
  if (Array.isArray(auto.hard_skills) && auto.hard_skills.length >= 2) autoPts += 8

  // 2. Power Skills - 7 pts (sección ex Soft Skills, renombrada)
  if (Array.isArray(auto.soft_skills) && auto.soft_skills.length >= 2) autoPts += 7

  core += Math.min(autoPts, 15)

  // Semana: 10 pts (peso reducido, ejecución táctica)
  const bloques = (data&&data.semana&&data.semana.bloques) ? data.semana.bloques : {}
  const bN = Object.values(bloques).filter(Boolean).length
  if (bN>=3) core+=10; else if (bN>=1) core+=5;

  // Gastos: 10 pts (peso reducido, planificación financiera)
  const rawRec = data&&data.recursos ? (Array.isArray(data.recursos) ? data.recursos : (data.recursos.recursos||null)) : null
  const rec = (rawRec&&rawRec.length>0) ? rawRec : RECURSOS_DEFAULT
  const nActivos = rec.filter(function(r){return r.tengo===true}).length
  core += (nActivos >= 2) ? 10 : (nActivos * 5)

  // Oferta de Valor: 5 ítems × 6 pts = 30 · insumo principal del CV (peso mayor)
  const oferta = (data&&data.oferta) ? data.oferta : {}
  let ofertaPts = 0
  if (String(oferta.oferta_valor||'').trim().length>=20) ofertaPts+=6
  const IKIGAI_KEYS = ['ikigai_amas','ikigai_bueno','ikigai_necesita','ikigai_pagar']
  IKIGAI_KEYS.forEach(function(k){ if (String(oferta[k]||'').trim().length>=50) ofertaPts+=6 })
  core += Math.min(ofertaPts, 30)

  // Optimizador de CV: 10 pts cuando se genera el CV inicial
  if (data && data.optimizer && data.optimizer.cv_generado === true) core += 10

  return Math.min(core, 100)
}

export function calcularPorPilar(data, perfil) {
  const perfilPts = calcPerfilPts(perfil, data)

  const auto = (data && data.autoconocimiento) ? data.autoconocimiento : {}
  let autoPts = 0

  // 1. Hard Skills - 8 pts
  if (Array.isArray(auto.hard_skills) && auto.hard_skills.length >= 2) autoPts += 8

  // 2. Power/Soft Skills (soft_skills) - 7 pts
  if (Array.isArray(auto.soft_skills) && auto.soft_skills.length >= 2) autoPts += 7

  const bloques = (data && data.semana && data.semana.bloques) ? data.semana.bloques : {}
  const bN = Object.values(bloques).filter(Boolean).length
  let semanaPts = 0
  if (bN >= 3) semanaPts = 20; else if (bN >= 1) semanaPts = 10;

  const rawRec2 = data && data.recursos ? (Array.isArray(data.recursos) ? data.recursos : (data.recursos.recursos || null)) : null
  const rec = (rawRec2 && rawRec2.length > 0) ? rawRec2 : RECURSOS_DEFAULT
  const nRecActivos = rec.filter(function(r){return r.tengo === true}).length
  let recPts = (nRecActivos >= 2) ? 20 : (nRecActivos * 10)

  // Oferta: 5 ítems × 4 pts = 20
  const oferta = (data && data.oferta) ? data.oferta : {}
  let ofertaPts = 0
  if (String(oferta.oferta_valor || '').trim().length >= 20) ofertaPts += 4
  const IKIGAI_KEYS_PP = ['ikigai_amas', 'ikigai_bueno', 'ikigai_necesita', 'ikigai_pagar']
  IKIGAI_KEYS_PP.forEach(function(k){ if (String(oferta[k] || '').trim().length >= 50) ofertaPts += 4 })

  return {
    perfil:           Math.round((Math.min(perfilPts, 25) / 25) * 100),
    autoconocimiento: Math.round((Math.min(autoPts, 15) / 15) * 100),
    documentos:       (data && data.optimizer && data.optimizer.cv_generado) ? 100 : 0,
    semana:           Math.round((semanaPts / 20) * 100),
    recursos:         Math.round((recPts / 20) * 100),
    oferta:           Math.round((Math.min(ofertaPts, 20) / 20) * 100),
  }
}

