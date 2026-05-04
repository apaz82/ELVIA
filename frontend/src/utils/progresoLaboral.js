// Cálculo de progreso del Gerente de Búsqueda — funciones puras sin dependencias React
// Importar desde AuthContext y ProyectoLaboral para mantener una sola fuente de verdad

export const RECURSOS_DEFAULT = [
  { id:'1',      nombre:'Espacio de trabajo tranquilo', descripcion:'Un lugar donde puedas concentrarte sin interrupciones.', costo:0, tengo:false },
  { id:'2',      nombre:'Conexión a internet estable',  descripcion:'Necesaria para aplicar, videollamadas y LinkedIn.',      costo:0, tengo:false },
  { id:'3',      nombre:'Celular activo',               descripcion:'Para recibir llamadas de reclutadores.',                 costo:0, tengo:false },
  { id:'4',      nombre:'LinkedIn Premium',             descripcion:'La red #1 para ser encontrado por reclutadores.',        costo:0, tengo:false },
  { id:'5',      nombre:'Transporte a entrevistas',     descripcion:'Transporte público o privado + estacionamiento.',        costo:0, tengo:false },
  { id:'6',      nombre:'Ropa de presentación',         descripcion:'Outfit adecuado para entrevistas presenciales.',         costo:0, tengo:false },
  { id:'7',      nombre:'Café / Coworking',             descripcion:'Si prefieres salir de casa para más productividad.',     costo:0, tengo:false },
  { id:'optima', nombre:'Suscripción ELVIA',           descripcion:'Tu plan activo de ELVIA.',                           costo:0, tengo:false, obligatorio:true },
]

// IDs de documentos del pilar Documentos (sin referencias a componentes React)
const DOCS_IDS = ['cv', 'linkedin', 'cv_vacante', 'entrevista', 'carta', 'referencias']

export function calcPerfilPts(perfil, jpData) {
  let pts = 0
  if (String(perfil?.nombre1||'').trim().length>1) pts+=10
  if (String(perfil?.pais||'').trim().length>1) pts+=5
  if (String(perfil?.telefono1||'').trim().length>4) pts+=5
  if (String(perfil?.salario_esperado||'').trim().length>1) pts+=5
  if (String(jpData?.perfil?.nivel_educativo||'').length>1) pts+=3
  if (String(jpData?.perfil?.anios_experiencia||'').length>0) pts+=2
  return Math.min(pts, 30)
}

export function calcularProgreso(data, perfil) {
  let core = 0
  core += calcPerfilPts(perfil, data)

  const auto = (data&&data.autoconocimiento) ? data.autoconocimiento : {}
  let autoPts = 0

  // 1. Hard Skills - 5 pts
  if (Array.isArray(auto.hard_skills) && auto.hard_skills.length >= 2) autoPts += 5

  // 2. Soft Skills - 5 pts
  if (Array.isArray(auto.soft_skills) && auto.soft_skills.length >= 2) autoPts += 5

  // 3. Power Skills - 5 pts
  if (Array.isArray(auto.power_skills) && auto.power_skills.length >= 2) autoPts += 5

  // 4. Compañías - 5 pts
  if (Array.isArray(auto.top5empresas) && auto.top5empresas.filter(function(e){return e && String(e).trim()}).length >= 1) autoPts += 5

  core += Math.min(autoPts, 20)

  const bloques = (data&&data.semana&&data.semana.bloques) ? data.semana.bloques : {}
  const bN = Object.values(bloques).filter(Boolean).length
  if (bN>=3) core+=10; else if (bN>=1) core+=5; 

  const rawRec = data&&data.recursos ? (Array.isArray(data.recursos) ? data.recursos : (data.recursos.recursos||null)) : null
  const rec = (rawRec&&rawRec.length>0) ? rawRec : RECURSOS_DEFAULT
  const nActivos = rec.filter(function(r){return r.tengo===true}).length
  core += (nActivos >= 2) ? 10 : (nActivos * 5) 

  const oferta = (data&&data.oferta) ? data.oferta : {}
  let ofertaPts = 0
  if (Array.isArray(oferta.cultura)&&oferta.cultura.length>=2) ofertaPts+=10
  if (String(oferta.oferta_valor||'').trim().length>=30) ofertaPts+=20
  core += Math.min(ofertaPts, 30)

  return Math.min(core, 100)
}
