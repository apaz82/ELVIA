// Wizard: Crear CV desde cero
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { generarCVDesdeCero, extractarPerfilCV, descargarCV, optimizarResumenIA, optimizarExpIA, fusionarResumenIA } from '../services/cvService'
import HelpBadge from '../components/common/HelpBadge'
import {
  Plus, X, ArrowLeft, ArrowRight, Question, Check,
  CheckFat, SpinnerGap, Warning, FileArrowDown, UploadSimple,
  WarningCircle, CheckCircle, DownloadSimple, FileDoc, MagicWand,
  ArrowUUpLeft, Sparkle, Lock, PencilSimple, Notepad, Eye
} from '@phosphor-icons/react'
import CVHarvardPreview from '../components/cv/CVHarvardPreview'

const PASOS = [
  { id: 'datos',       label: 'Datos Personales',    icon: '👤' },
  { id: 'resumen',     label: 'Resumen Profesional',  icon: '📝' },
  { id: 'experiencia', label: 'Experiencia Laboral',  icon: '💼' },
  { id: 'educacion',   label: 'Educación',            icon: '🎓' },
  { id: 'habilidades', label: 'Habilidades',          icon: '⭐' },
  { id: 'idiomas',     label: 'Idiomas',              icon: '🌍' },
  { id: 'preview',     label: 'Vista Previa',         icon: '👁️' },
]

const NIVELES_CEFR   = ['Nativo', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1']
const IDIOMAS_LIST   = ['Español', 'Inglés', 'Francés', 'Portugués', 'Alemán', 'Italiano', 'Japonés']
const PAISES         = ['México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Brasil', 'España', 'Estados Unidos', 'Otro']
const HABILIDADES_COMUNES = ['Liderazgo', 'Comunicación', 'Resolución de problemas', 'Análisis de datos', 'Gestión de proyectos', 'Negociación', 'Pensamiento estratégico', 'Innovación']

const ESTADO_EMPTY = {
  nombre: '', nombre2: '', apellido: '', apellido2: '',
  email: '', indicativo: '+52', telefono: '', ciudad: '', pais: '',
  cargo_objetivo: '',
  resumen: '',
  experiencias: [{ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }],
  educacion:    [{ institucion: '', titulo: '', anio: '' }],
  habilidades: [],
  idiomas:     [],
}
const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        className="text-slate-400 hover:text-slate-600 transition-colors cursor-help ml-1">
        <Question size={16} weight="fill" />
      </button>
      {show && (
        <div className="absolute z-20 bottom-full right-0 mb-2 w-52 bg-slate-800 text-white text-xs p-2.5 rounded-lg shadow-lg leading-relaxed">
          {text}
        </div>
      )}
    </div>
  )
}

// ─── Análisis de calidad (estándares Harvard / LATAM 2026) ───────────────────
// Basado en calificacioncv.md — Metodología STAR/Google
// Distribución: Encabezado 18 | Resumen 20 | Experiencia 30 | Educación 15 | Habilidades 10 | Idiomas 7 = 100
const VERBOS_ACCION = ['lider', 'implement', 'negoci', 'optimiz', 'increment', 'reduci', 'gestion', 'desarroll', 'coordin', 'supervis', 'direct', 'lanz', 'mejor', 'transform', 'ejecut', 'logr', 'cre', 'diseñ', 'capaci', 'consolid']

function analizarCalidad(d) {
  let pts = 0
  const recs = []

  // ── 1. Encabezado (18 pts) ─────────────────────────────────────────────────
  if (d.nombre && d.apellido) pts += 8; else recs.push('Completa tu nombre y apellido completo')
  if (d.email)                pts += 3; else recs.push('Agrega un correo electrónico profesional (nombre.apellido@...)')
  if (d.telefono)             pts += 4; else recs.push('Agrega tu número de teléfono con código de área internacional')
  if (d.ciudad && d.pais)     pts += 3; else recs.push('Especifica tu ciudad y país (sin dirección exacta)')

  // ── 2. Resumen de valor (20 pts) ───────────────────────────────────────────
  const resumen = d.resumen || ''
  if      (resumen.length >= 200) pts += 20
  else if (resumen.length >= 100) pts += 13
  else if (resumen.length >   30) pts += 6
  else recs.push('Agrega un resumen de valor (3-5 líneas): años de exp. + sector + logro cuantificado')
  if (resumen.length > 30 && resumen.length < 100) {
    recs.push('Expande tu resumen — incluye años de experiencia, sector y al menos un logro con número')
  }

  // ── 3. Experiencia — STAR/Google (30 pts) ─────────────────────────────────
  const expOk = (d.experiencias || []).filter(e => e.empresa && e.cargo)
  if      (expOk.length >= 3) pts += 15
  else if (expOk.length === 2) pts += 10
  else if (expOk.length === 1) pts += 5
  if (expOk.length === 0) recs.push('Agrega al menos una experiencia laboral con empresa, cargo y logros')
  else if (expOk.length === 1) recs.push('Intenta agregar 2+ experiencias — refuerza mucho tu credibilidad')

  const expConDesc = expOk.filter(e => e.descripcion && e.descripcion.length > 20)
  if (expOk.length > 0 && expConDesc.length === 0) {
    recs.push('Describe tus logros en cada rol (fórmula STAR: Verbo de acción + Métrica + Resultado)')
  } else if (expConDesc.length > 0) {
    const tieneMetricas = expConDesc.some(e => /[\d%$€£]/.test(e.descripcion))
    const tieneVerbos   = expConDesc.some(e => {
      const desc = e.descripcion.toLowerCase()
      return VERBOS_ACCION.some(v => desc.includes(v))
    })
    if (tieneMetricas) pts += 10; else recs.push('Cuantifica al menos un logro con números o porcentajes (ej: "Incrementé ventas en 18%")')
    if (tieneVerbos)   pts +=  5; else recs.push('Empieza cada logro con un verbo de acción: Lideré, Implementé, Optimicé, Negocié...')
  }

  // ── 4. Educación (15 pts) ──────────────────────────────────────────────────
  const eduOk = (d.educacion || []).filter(e => e.institucion && e.titulo)
  if      (eduOk.length >= 2) pts += 15
  else if (eduOk.length === 1) pts += 12
  else recs.push('Agrega tu formación académica (institución + título + año)')

  // ── 5. Habilidades (10 pts) ────────────────────────────────────────────────
  const numH = (d.habilidades || []).length
  if      (numH >= 8) pts += 10
  else if (numH >= 5) pts += 7
  else if (numH >= 3) pts += 4
  else if (numH >= 1) pts += 2
  if (numH < 5) recs.push('Agrega al menos 5 habilidades clave (técnicas + blandas) — mejora el score ATS')

  // ── 6. Idiomas (7 pts — ATS) ──────────────────────────────────────────────
  const numI = (d.idiomas || []).length
  if      (numI >= 2) pts += 7
  else if (numI === 1) pts += 4
  if (numI === 0) recs.push('Agrega idiomas con nivel CEFR (C1, B2, etc.) — el 75% de CVs sin idiomas son rechazados por ATS')

  const porcentaje = Math.min(Math.round(pts), 100)
  return {
    porcentaje,
    estado: porcentaje >= 80 ? 'Excelente' : porcentaje >= 60 ? 'Bueno' : porcentaje >= 40 ? 'Incompleto' : 'Muy incompleto',
    nivel:  porcentaje >= 80 ? 'green' : porcentaje >= 60 ? 'amber' : 'red',
    recs,
  }
}

// ─── % de llenado del wizard ──────────────────────────────────────────────────
function calcularLlenado(d) {
  let pts = 0
  if (d.nombre && d.apellido) pts += 2
  if (d.email)   pts++
  if (d.telefono) pts++
  if (d.ciudad && d.pais) pts += 2
  if (d.resumen && d.resumen.length > 30) pts++
  if ((d.experiencias || []).some(e => e.empresa && e.cargo)) pts++
  if ((d.educacion || []).some(e => e.institucion && e.titulo)) pts++
  if ((d.habilidades || []).length >= 3) pts++
  if ((d.idiomas || []).length >= 1) pts++
  return Math.round((pts / 11) * 100)
}

// ─── Panel lateral de análisis ───────────────────────────────────────────────
function PanelAnalisis({ analisis, onClose }) {
  const colors = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'border-emerald-400', score: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    amber: { bg: 'bg-amber-50',   border: 'border-amber-200',   ring: 'border-amber-400',   score: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700'   },
    red:   { bg: 'bg-red-50',     border: 'border-red-200',     ring: 'border-red-300',     score: 'text-red-500',     badge: 'bg-red-100 text-red-700'       },
  }
  const c = colors[analisis.nivel]

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-base">Análisis del CV</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
      </div>
      <div className="-mt-2 space-y-1">
        <p className="text-xs font-semibold text-slate-600">Análisis bajo estándares Harvard / LATAM 2026 y expertos mentores de carrera.</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">Esta es información privada y solo tuya. Nuestras recomendaciones son parte del proceso, pero tú debes aprobar los cambios.</p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shrink-0 ${c.ring}`}>
          <div className="text-center">
            <div className={`text-2xl font-black ${c.score}`}>{analisis.porcentaje}%</div>
            <div className="text-[9px] font-bold text-slate-500">Optim.</div>
          </div>
        </div>
        <div>
          <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{analisis.estado}</span>
          <div className="mt-2">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className={`h-2 rounded-full ${analisis.nivel === 'green' ? 'bg-emerald-500' : analisis.nivel === 'amber' ? 'bg-amber-500' : 'bg-red-400'}`}
                style={{ width: `${analisis.porcentaje}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      {analisis.recs.length > 0 && (
        <div>
          <p className="text-sm font-bold text-slate-600 mb-2">Áreas a mejorar:</p>
          <ul className="space-y-2">
            {analisis.recs.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700 bg-white/70 p-2.5 rounded-lg border border-white/80 leading-snug">
                <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analisis.recs.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm text-emerald-700 bg-white/70 p-3 rounded-lg flex items-start gap-2">
            <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Revisa cada sección para incluir actualizaciones, indicadores de gestión o información relevante. Después de esto, te generaremos una CV optimizada.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tips contextuales por sección ────────────────────────────────────────────
function generarTipsPorPaso(d) {
  const tips = { datos: [], resumen: [], experiencia: [], educacion: [], habilidades: [], idiomas: [] }

  // Datos personales
  if (!d.nombre || !d.apellido) tips.datos.push('Agrega tu nombre y apellido completo')
  if (!d.email) tips.datos.push('Agrega un correo profesional (nombre.apellido@...)')
  if (!d.telefono) tips.datos.push('Incluye tu teléfono con código internacional (+52, +57, etc.)')
  if (!d.ciudad || !d.pais) tips.datos.push('Especifica ciudad y país — mejora el match con vacantes locales')

  // Resumen
  const res = d.resumen || ''
  if (res.length < 100) tips.resumen.push('Escribe un resumen de 200–500 caracteres con años de experiencia + sector + logro clave')
  else if (res.length < 200) tips.resumen.push('Expande tu resumen: incluye sector, cargo objetivo y al menos un logro con número')
  if (res.length > 30 && !/\d/.test(res)) tips.resumen.push('Agrega un dato cuantificable (%, $, años, personas a cargo, volumen de negocio)')

  // Experiencia
  const exps = (d.experiencias || []).filter(e => e.empresa || e.cargo || e.descripcion)
  if (exps.length === 0) {
    tips.experiencia.push('Agrega al menos una experiencia laboral con cargo y empresa')
  } else {
    const sinDesc = exps.filter(e => !e.descripcion || e.descripcion.length < 60)
    if (sinDesc.length > 0) tips.experiencia.push(`${sinDesc.length} experiencia(s) sin descripción. Usa STAR: Acción + Métrica + Resultado (ej: "Lideré migración que redujo costos 30%")`)
    const sinMetrica = exps.filter(e => e.descripcion && !/\d/.test(e.descripcion))
    if (sinMetrica.length > 0) tips.experiencia.push('Agrega métricas: % de crecimiento, equipo a cargo, presupuesto gestionado, # clientes')
    const sinVerbo = exps.filter(e => e.descripcion && !VERBOS_ACCION.some(v => e.descripcion.toLowerCase().includes(v)))
    if (sinVerbo.length > 0) tips.experiencia.push('Usa verbos de impacto al inicio: "Implementé", "Lideré", "Incrementé", "Reduje", "Gestioné"')
    const sinFechas = exps.filter(e => !e.fecha_inicio)
    if (sinFechas.length > 0) tips.experiencia.push('Completa las fechas de inicio y fin para mostrar trayectoria clara')
  }

  // Educación
  const edu = (d.educacion || []).filter(e => e.institucion || e.titulo)
  if (edu.length === 0) tips.educacion.push('Agrega tu formación académica (institución, título, año)')
  else {
    const sinAnio = edu.filter(e => !e.anio)
    if (sinAnio.length > 0) tips.educacion.push('Agrega el año de graduación en tus estudios para validar antigüedad')
  }

  // Habilidades
  const numHabs = (d.habilidades || []).length
  if (numHabs === 0) tips.habilidades.push('Agrega habilidades clave de tu industria (mínimo 5)')
  else if (numHabs < 5) tips.habilidades.push(`Tienes ${numHabs} habilidad(es). Agrega más hasta llegar a 8–12 para mejor match con vacantes`)

  // Idiomas
  if (!d.idiomas || d.idiomas.length === 0) {
    tips.idiomas.push('Agrega al menos tu idioma nativo y el nivel CEFR')
    tips.idiomas.push('El inglés (aunque sea B1) abre oportunidades en empresas multinacionales')
  } else if (!d.idiomas.some(i => i.idioma === 'Inglés')) {
    tips.idiomas.push('Si tienes algo de inglés, agrégalo — incluso nivel B1 puede ser diferenciador')
  }

  return tips
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CVDesdeCero() {
  const { user, isPaidPlan, perfil, refreshPerfil, refreshJpData } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Modo forzado al entrar desde el Pilar Optimizador de CV
  // 'upload'  → muestra solo upload (pantalla 0 obligatoria)
  // 'scratch' → salta directo al wizard, sin upload
  // null      → comportamiento legacy: pantalla de selección con 2 cards
  const modoForzado = location.state?.mode || null

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [borradorPendiente, setBorradorPendiente] = useState(null) // { datos, paso_actual, p, jsp } cuando hay borrador en BD entrando con mode='scratch'
  const [pasoActual,    setPasoActual]    = useState(0)
  const [datos,         setDatos]         = useState(ESTADO_EMPTY)
  const [generando,     setGenerando]     = useState(false)
  const [cvGenerada,    setCvGenerada]    = useState(null)
  const [error,         setError]         = useState('')
  const [inicializando, setInicializando] = useState(true)
  const [ultimoGuardado,setUltimoGuardado]= useState(null)
  const [extrayendo,    setExtrayendo]    = useState(false)
  const [analisis,      setAnalisis]      = useState(null)
  const [cvMismatch,    setCvMismatch]    = useState(false)
  const [cvPending,     setCvPending]     = useState(null)   // datos extraídos en espera de confirmar
  const [cvFileName,    setCvFileName]    = useState('')
  const [alertaExistente, setAlertaExistente] = useState(false)
  const [modoSeleccion,   setModoSeleccion]   = useState(true)  // false cuando hay borrador o el usuario eligió ruta
  const [optimizandoResumen, setOptimizandoResumen] = useState(false)
  const [resumenSugerido, setResumenSugerido] = useState('')
  const [resumenBloqueado, setResumenBloqueado] = useState(false)
  // Path A — fusión CV + Oferta de Valor
  const [cvResumenOriginal, setCvResumenOriginal] = useState('') // snapshot del resumen extraído del CV (inmutable)
  const [ofertaValorGerente, setOfertaValorGerente] = useState('') // texto Mi Oferta de Valor del Gerente (inmutable)
  const [fusionando, setFusionando] = useState(false)
  const [errorFusion, setErrorFusion] = useState('')
  const [cvIdioma, setCvIdioma] = useState('es')         // idioma detectado del CV subido
  const [alertaIdioma, setAlertaIdioma] = useState(false) // modal confirm idioma antes de generar
  const [expSugeridas, setExpSugeridas]   = useState({})  // { [i]: string } sugerencia por exp
  const [expOptimizando, setExpOptimizando] = useState({}) // { [i]: boolean } loading por exp
  const [expMejoradas, setExpMejoradas]   = useState({})  // { [i]: true } botón bloqueado tras aplicar
  const [alertaPlaceholder, setAlertaPlaceholder] = useState(false) // modal placeholder sin reemplazar

  // 1. Verificar si ya tiene CV al cargar
  useEffect(() => {
    if (perfil?.cv_path) {
      setAlertaExistente(true)
    }
  }, [perfil])
  const [nuevaHab,      setNuevaHab]      = useState('')

  // Tips contextuales calculados en tiempo real
  const tipsPorPaso = useMemo(() => generarTipsPorPaso(datos), [datos])

  const saveTimer = useRef(null)
  const fileRef   = useRef(null)
  // Refs para flush en unmount (evitan closure stale)
  const datosRef    = useRef(datos)
  const pasoRef     = useRef(pasoActual)
  const userRef     = useRef(user)
  useEffect(() => { datosRef.current = datos },     [datos])
  useEffect(() => { pasoRef.current  = pasoActual }, [pasoActual])
  useEffect(() => { userRef.current  = user },       [user])

  // ── Pre-llenado desde Perfil + Gerente de Proyecto ──────────────────────────
  // Fuentes (todas dentro de profiles.job_search_profile excepto las marcadas como profile-top-level):
  // - Identidad (nombre, email, etc.) → profiles (top-level)
  // - Cargo objetivo → jsp.perfil.niveles_cargo (array; tomamos el primero como referencia)
  // - Resumen profesional → jsp.oferta.oferta_valor (Mi Oferta de Valor)
  // - Habilidades → jsp.autoconocimiento.hard_skills + soft_skills (Hard + Power Skills, sin duplicados)
  // - Idiomas → jsp.perfil.idiomas (Perfilador del Gerente, NO profiles.idiomas top-level)
  const prefillFromGerente = (p, jsp) => {
    const auto = jsp?.autoconocimiento || {}
    const oferta = jsp?.oferta || {}
    const perfilGerente = jsp?.perfil || {}
    const habGerente = [
      ...(Array.isArray(auto.hard_skills) ? auto.hard_skills : []),
      ...(Array.isArray(auto.soft_skills) ? auto.soft_skills : []),
    ].filter((v, i, a) => a.indexOf(v) === i)

    // Cargo objetivo: primer nivel jerárquico del Perfilador (ej: "Gerente", "Director", "C-Level")
    const cargoFromPerfilador = Array.isArray(perfilGerente.niveles_cargo) && perfilGerente.niveles_cargo.length > 0
      ? perfilGerente.niveles_cargo[0]
      : ''

    // Idiomas: viven en jsp.perfil.idiomas (Perfilador del Gerente)
    const idiomasGerente = Array.isArray(perfilGerente.idiomas) ? perfilGerente.idiomas : []

    return {
      ...ESTADO_EMPTY,
      nombre:        p?.nombre1  || jsp?.nombre1 || '',
      nombre2:       p?.nombre2  || jsp?.nombre2 || '',
      apellido:      p?.apellido1 || jsp?.apellido1 || '',
      apellido2:     p?.apellido2 || jsp?.apellido2 || '',
      email:         p?.email_principal || p?.email || '',
      indicativo:    p?.indicativo1 || jsp?.indicativo1 || '+52',
      telefono:      p?.telefono1 || jsp?.telefono1 || '',
      ciudad:        p?.ciudad   || jsp?.ciudad   || '',
      pais:          p?.pais     || jsp?.pais     || '',
      cargo_objetivo: cargoFromPerfilador,
      resumen:       String(oferta.oferta_valor || '').trim(),
      habilidades:   habGerente,
      idiomas:       idiomasGerente,
    }
  }

  // Decisión sobre borrador en progreso (modal cuando entras con mode='scratch' y ya hay borrador en BD)
  const continuarBorrador = () => {
    if (!borradorPendiente) return
    const { datos: bDatos, paso_actual } = borradorPendiente
    setDatos(bDatos)
    setPasoActual(paso_actual || 0)
    setModoSeleccion(false)
    if (user) sessionStorage.setItem(`cv_draft_${user.id}`, JSON.stringify({ datos: bDatos, paso_actual: paso_actual || 0 }))
    setBorradorPendiente(null)
  }

  const descartarYEmpezar = async () => {
    if (!borradorPendiente || !user) return
    const { p, jsp } = borradorPendiente

    // Borrar cv_borrador + cv_datos_originales en BD
    const newJsp = { ...jsp }
    delete newJsp.cv_borrador
    delete newJsp.cv_datos_originales
    try {
      await supabase.from('profiles').update({ job_search_profile: newJsp }).eq('id', user.id)
    } catch (e) {
      console.error('Error descartando borrador:', e)
    }

    // Limpiar caché local
    sessionStorage.removeItem(`cv_draft_${user.id}`)

    // Pre-llenar fresh
    setDatos(prefillFromGerente(p, jsp))
    setPasoActual(0)
    setModoSeleccion(false)
    setBorradorPendiente(null)
  }

  // ── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      if (!user) return
      const CACHE_KEY = `cv_draft_${user.id}`

      // Cuando el usuario viene del Pilar Optimizador con un modo explícito ('scratch' o 'upload'),
      // saltamos el shortcut de sessionStorage. La BD es la fuente de verdad: si hay cv_borrador
      // se carga, si no, se pre-llena desde el perfil y el Gerente. Esto evita que un cache stale
      // (ej. después de borrar datos en BD) bloquee el pre-llenado.
      const ignorarCache = !!modoForzado

      // 1. Carga desde sessionStorage (Solo si tiene datos reales para evitar pisar el perfil con vacíos)
      if (!ignorarCache) {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          try {
            const b = JSON.parse(cached)
            // Solo usar caché si tiene al menos un nombre o si el paso es avanzado
            if (b?.datos && (b.datos.nombre || b.paso_actual > 0)) {
              setDatos(b.datos)
              setPasoActual(b.paso_actual || 0)
              setModoSeleccion(false)
              setInicializando(false)
              return
            }
          } catch { /* ignorar error de parseo */ }
        }
      }

      // 1.5. Si el modo viene forzado desde el Pilar Optimizador de CV
      //   - 'scratch' → salta la pantalla de selección y entra al wizard directo
      //   - 'upload'  → mantiene la pantalla de selección (pantalla 0 obligatoria de upload)
      if (modoForzado === 'scratch') {
        setModoSeleccion(false)
      }

      // 2. Fetch desde Supabase (fuente de verdad)
      try {
        setInicializando(true)
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (!p) return

        const borrador = p?.job_search_profile?.cv_borrador
        const jsp = p?.job_search_profile || {}

        // Capturar Mi Oferta de Valor del Gerente para Path A (fusión con el resumen del CV)
        const ofertaValorTexto = String(jsp?.oferta?.oferta_valor || '').trim()
        setOfertaValorGerente(ofertaValorTexto)

        if (borrador?.datos && Object.keys(borrador.datos).length > 0) {
          // Hay borrador en BD. Si el usuario entró desde el pilar con mode='scratch',
          // mostramos modal de decisión: continuar borrador vs empezar nuevo.
          // Si entró por link directo (sin mode), cargamos el borrador automáticamente (legacy).
          if (modoForzado === 'scratch') {
            setBorradorPendiente({ datos: borrador.datos, paso_actual: borrador.paso_actual || 0, p, jsp })
          } else {
            setDatos(borrador.datos)
            setPasoActual(borrador.paso_actual || 0)
            setModoSeleccion(false)
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ datos: borrador.datos, paso_actual: borrador.paso_actual || 0 }))
          }
        } else {
          // Si no hay borrador, pre-llenar fresh desde perfil + Gerente
          // Cache local stale: si no hay borrador en BD, el sessionStorage estaría desincronizado.
          // Lo limpiamos para que el próximo unmount no re-escriba datos viejos.
          sessionStorage.removeItem(CACHE_KEY)
          setDatos(prefillFromGerente(p, jsp))
        }
      } catch (e) {
        console.error('Error cargando datos:', e)
        setError('Error al cargar tus datos. Por favor recarga la página.')
      } finally {
        setInicializando(false)
      }
    }
    cargar()
  }, [user, modoForzado])

  // ── Auto-save (todos los usuarios) ─────────────────────────────────────────
  const guardarBorrador = useCallback(() => {
    if (!user) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const { data: p } = await supabase.from('profiles').select('job_search_profile').eq('id', user.id).maybeSingle()
        if (!p) return
        const jsp = p.job_search_profile || {}
        const { error: e } = await supabase.from('profiles').update({
          job_search_profile: { ...jsp, cv_borrador: { paso_actual: pasoActual, ultimo_guardado: new Date().toISOString(), datos } }
        }).eq('id', user.id)
        if (!e) {
          setUltimoGuardado(new Date())
          sessionStorage.setItem(`cv_draft_${user.id}`, JSON.stringify({ datos, paso_actual: pasoActual }))
        }
      } catch (e) { console.error('Error guardando borrador:', e) }
    }, 2000)
  }, [user, isPaidPlan, pasoActual, datos])

  useEffect(() => { guardarBorrador() }, [pasoActual, datos])

  // Flush inmediato al desmontar — evita perder cambios al navegar a otra página
  useEffect(() => {
    return () => {
      if (!userRef.current) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      // Guardar en sessionStorage de forma síncrona (instantáneo)
      sessionStorage.setItem(`cv_draft_${userRef.current.id}`, JSON.stringify({ datos: datosRef.current, paso_actual: pasoRef.current }))
      // Fire-and-forget a Supabase en background
      supabase.from('profiles').select('job_search_profile').eq('id', userRef.current.id).maybeSingle()
        .then(({ data: p }) => {
          if (!p) return
          const jsp = p.job_search_profile || {}
          supabase.from('profiles').update({
            job_search_profile: { ...jsp, cv_borrador: { paso_actual: pasoRef.current, ultimo_guardado: new Date().toISOString(), datos: datosRef.current } }
          }).eq('id', userRef.current.id).then(() => {})
        }).catch(() => {})
    }
  }, [])

  // ── Helpers de estado ───────────────────────────────────────────────────────
  const upDatos = (k, v)           => setDatos(f => ({ ...f, [k]: v }))
  const upExp   = (i, k, v)        => { const a = [...datos.experiencias]; a[i] = { ...a[i], [k]: v }; setDatos(f => ({ ...f, experiencias: a })) }
  const addExp  = ()               => setDatos(f => ({ ...f, experiencias: [{ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }, ...f.experiencias] }))
  const delExp  = (i)              => setDatos(f => ({ ...f, experiencias: f.experiencias.filter((_, j) => j !== i) }))
  const upEdu   = (i, k, v)        => { const a = [...datos.educacion];    a[i] = { ...a[i], [k]: v }; setDatos(f => ({ ...f, educacion: a })) }
  const addEdu  = ()               => setDatos(f => ({ ...f, educacion: [...f.educacion, { institucion: '', titulo: '', anio: '' }] }))
  const delEdu  = (i)              => setDatos(f => ({ ...f, educacion: f.educacion.filter((_, j) => j !== i) }))
  const togHab  = (h)              => setDatos(f => ({ ...f, habilidades: f.habilidades.includes(h) ? f.habilidades.filter(x => x !== h) : [...f.habilidades, h] }))
  const addHab  = (h)              => { if (h && !datos.habilidades.includes(h)) { setDatos(f => ({ ...f, habilidades: [...f.habilidades, h] })); setNuevaHab('') } }
  const togIdm  = (id)             => { const existing = datos.idiomas?.find(i => i.idioma === id); const arr = (datos.idiomas || []).filter(i => i.idioma !== id); if (!existing) arr.push({ idioma: id, nivel: id === 'Español' ? 'Nativo' : null }); setDatos(f => ({ ...f, idiomas: arr })) }
  const upNivIdm = (id, nivel)     => setDatos(f => ({ ...f, idiomas: f.idiomas.map(i => i.idioma === id ? { ...i, nivel } : i) }))

  // ── Aplicar datos extraídos del CV ──────────────────────────────────────────
  // Parsea el año de fecha_fin para ordenar — "Actualidad"/"Present"/null → más reciente (9999)
  const parseExpYear = (fin) => {
    if (!fin || /actual|present|current|hoy|vigente/i.test(fin)) return 9999
    const m = String(fin).match(/\d{4}/)
    return m ? parseInt(m[0], 10) : 0
  }

  const aplicarDatos = (d) => {
    const expArr = Array.isArray(d.experiencias) && d.experiencias.length > 0
      ? d.experiencias
          .map(e => ({ empresa: e.empresa || '', cargo: e.cargo || '', fecha_inicio: e.fecha_inicio || '', fecha_fin: e.fecha_fin || '', descripcion: e.descripcion || '' }))
          .sort((a, b) => parseExpYear(b.fecha_fin) - parseExpYear(a.fecha_fin)) // más reciente primero
      : [{ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }]

    const eduArr = Array.isArray(d.educacion) && d.educacion.length > 0
      ? d.educacion.map(e => ({ institucion: e.institucion || '', titulo: e.titulo || '', anio: e.anio || '' }))
      : [{ institucion: '', titulo: '', anio: '' }]

    // Normalizar idiomas: strings → {idioma, nivel}. nivel null = usuario elige.
    const IDIOMA_CV_MAP = { es: 'Español', en: 'Inglés', pt: 'Portugués', fr: 'Francés', de: 'Alemán', it: 'Italiano', ja: 'Japonés' }
    const CEFR_VALIDOS = new Set(['Nativo', 'Native', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'])
    let idiomasNorm = Array.isArray(d.idiomas) && d.idiomas.length > 0
      ? d.idiomas.map(i => {
          if (typeof i === 'string') return { idioma: i, nivel: i === 'Español' ? 'Nativo' : null, detectedFromCV: true }
          const nivelNorm = CEFR_VALIDOS.has(i.nivel) ? i.nivel : (i.nivel === 'Native' ? 'Nativo' : null)
          return { idioma: i.idioma, nivel: nivelNorm, detectedFromCV: true }
        })
      : [...(datos.idiomas || [])]

    // Añadir el idioma del CV como entrada si no está ya en la lista
    const idiomaCvNombre = d.idioma_cv ? IDIOMA_CV_MAP[d.idioma_cv] : null
    if (idiomaCvNombre && !idiomasNorm.some(i => i.idioma === idiomaCvNombre)) {
      idiomasNorm = [{ idioma: idiomaCvNombre, nivel: null, detectedFromCV: true }, ...idiomasNorm]
    }

    // Merge con idiomas del Gerente (Perfilador) — unión sin duplicados
    if (Array.isArray(datos.idiomas)) {
      datos.idiomas.forEach(ig => {
        if (ig?.idioma && !idiomasNorm.some(i => i.idioma === ig.idioma)) {
          idiomasNorm.push(ig)
        }
      })
    }

    // Habilidades: combinar las del CV con las del Gerente (Hard + Power Skills), sin duplicados.
    // Las del Gerente (Competencias del usuario) prevalecen porque son seleccionadas explícitamente.
    const habsCV = Array.isArray(d.habilidades) ? d.habilidades : []
    const habsGerente = Array.isArray(datos.habilidades) ? datos.habilidades : []
    const habsMerged = [...habsGerente, ...habsCV].filter((v, i, a) => a.indexOf(v) === i)

    // Resumen profesional: priorizar el del CV original; si viene vacío, usar Mi Oferta de Valor del Gerente
    const resumenMerged = (d.resumen && String(d.resumen).trim()) || datos.resumen || ''

    const merged = {
      nombre:         d.nombre1    || datos.nombre    || '',
      nombre2:        d.nombre2    || datos.nombre2   || '',
      apellido:       d.apellido1  || datos.apellido  || '',
      apellido2:      d.apellido2  || datos.apellido2 || '',
      email:          datos.email  || '',                          // no sobreescribir el email del registro
      indicativo:     datos.indicativo,
      telefono:       d.telefono1  || d.telefono || datos.telefono  || '',
      ciudad:         d.ciudad     || datos.ciudad    || '',
      pais:           d.pais       || datos.pais      || '',
      cargo_objetivo: d.cargo_actual || datos.cargo_objetivo || '',
      resumen:        resumenMerged,
      experiencias:   expArr,
      educacion:      eduArr,
      habilidades:    habsMerged.length > 0 ? habsMerged : datos.habilidades,
      idiomas:        idiomasNorm,
    }

    // Guardar idioma detectado para usarlo en optimizarResumen y generarCV
    if (d.idioma_cv) setCvIdioma(d.idioma_cv)

    // Path A: capturar snapshot del resumen del CV original (inmutable) para mostrar en la fusión
    setCvResumenOriginal(String(d.resumen || '').trim())

    setDatos(merged)
    setAnalisis(analizarCalidad(merged))
    setCvPending(null)
    setError('')
  }

  // Path A — Fusionar el resumen extraído del CV con la Oferta de Valor del Gerente.
  // El resultado pasa a ser el resumen activo del wizard (datos.resumen).
  const handleFusionarResumen = async () => {
    if (fusionando) return
    if (!cvResumenOriginal && !ofertaValorGerente) {
      setErrorFusion('Necesitas al menos el resumen del CV o tu Oferta de Valor para fusionar.')
      return
    }
    setFusionando(true)
    setErrorFusion('')
    try {
      const res = await fusionarResumenIA(cvResumenOriginal, ofertaValorGerente, cvIdioma || 'es')
      const texto = String(res?.fusionado || '').trim()
      if (!texto) throw new Error('La fusión no devolvió texto.')
      upDatos('resumen', texto)
    } catch (err) {
      console.error('[Fusión] Error:', err)
      setErrorFusion(err?.message || 'No pudimos fusionar el resumen. Intenta de nuevo.')
    } finally {
      setFusionando(false)
    }
  }

  // ── Extracción del CV ────────────────────────────────────────────────────────
  const extraerCV = async (archivo) => {
    if (!archivo) return
    setError('')
    setExtrayendo(true)
    setCvMismatch(false)
    setCvPending(null)
    setCvFileName(archivo.name)

    try {
      const tipos = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!tipos.includes(archivo.type)) throw new Error('Solo se aceptan PDF o Word (.pdf, .doc, .docx)')

      const resultado = await extractarPerfilCV(archivo)
      if (resultado.error) throw new Error(resultado.error)

      // Validación de identidad — doble capa:
      // 1) el backend ya puso mismatch:true si detectó discrepancia
      // 2) fallback frontend: compara con los datos pre-cargados del perfil
      const norm = (s) => (s || '').toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ')[0]
      const cvN  = norm(resultado.nombre1)
      const cvA  = norm(resultado.apellido1)
      const regN = norm(datos.nombre)    // pre-cargado de Supabase al iniciar
      const regA = norm(datos.apellido)
      const frontendMismatch = (regN && cvN && regN !== cvN) || (regA && cvA && regA !== cvA)

      if (resultado.mismatch || frontendMismatch) {
        setCvMismatch(true)
        setCvPending(resultado)
        return
      }

      aplicarDatos(resultado)
      setModoSeleccion(false)
    } catch (err) {
      setCvFileName('')
      const msg = err?.message || ''
      if (msg.includes('401') || msg.includes('403')) setError('Sesión expirada. Recarga la página e intenta de nuevo.')
      else if (msg.includes('413'))                   setError('El archivo es muy grande. Máximo 5MB.')
      else if (msg.includes('Solo se aceptan'))       setError('Formato no soportado. Sube un PDF o Word (.docx).')
      else                                             setError('No pudimos procesar el CV. Intenta de nuevo.')
    } finally {
      setExtrayendo(false)
    }
  }

  // ── Generar CV con IA ────────────────────────────────────────────────────────
  const generarCV = async (idiomaForzado) => {
    const lang = idiomaForzado || cvIdioma || 'es'
    setAlertaIdioma(false)
    setError('')
    setGenerando(true)
    try {
      const resultado = await generarCVDesdeCero(datos, lang)
      if (resultado.error) throw new Error(resultado.error)
      setCvGenerada(resultado)
    } catch (err) {
      setError(err.message || 'Error al generar CV')
    } finally {
      setGenerando(false)
    }
  }

  // Si el CV subido está en un idioma distinto al español, pedir confirmación antes de generar
  const iniciarGenerarCV = () => {
    if (cvIdioma && cvIdioma !== 'es') {
      setAlertaIdioma(true)
    } else {
      generarCV('es')
    }
  }

  const handleOptimizarResumen = async () => {
    if (!datos.resumen || datos.resumen.length < 20) {
      setError('Escribe al menos un borrador de tu resumen para optimizarlo.')
      return
    }
    setOptimizandoResumen(true)
    setError('')
    setResumenBloqueado(false)
    try {
      const res = await optimizarResumenIA(datos.resumen, cvIdioma || 'es')
      console.log('[Debug] Respuesta IA:', res)
      if (res.optimizado) {
        setResumenSugerido(res.optimizado)
      } else {
        console.warn('[Debug] La respuesta no contiene un resumen optimizado:', res)
      }
    } catch (err) {
      console.error('[Debug] Error capturado en handleOptimizarResumen:', err)
      setError(`No pudimos optimizar tu resumen: ${err.message}`)
    } finally {
      setOptimizandoResumen(false)
    }
  }

  const handleOptimizarExp = async (i) => {
    const exp = datos.experiencias[i]
    if (!exp?.descripcion || exp.descripcion.length < 10) return
    setExpOptimizando(prev => ({ ...prev, [i]: true }))
    try {
      const res = await optimizarExpIA(exp.descripcion, exp.cargo, exp.empresa, cvIdioma || 'es')
      if (res.optimizado) {
        setExpSugeridas(prev => ({ ...prev, [i]: res.optimizado }))
      }
    } catch (err) {
      setError(`No pudimos optimizar la experiencia: ${err.message}`)
    } finally {
      setExpOptimizando(prev => ({ ...prev, [i]: false }))
    }
  }

  const PLACEHOLDER_EXP = /\[[^\]]*[%#]\]|\[X\]|\[N\]|\[XX?\]/i
  const aplicarSugerenciaExp = (i) => {
    const texto = expSugeridas[i] || ''
    if (PLACEHOLDER_EXP.test(texto)) {
      setAlertaPlaceholder(true)
      return
    }
    upExp(i, 'descripcion', texto)
    setExpSugeridas(prev => { const n = { ...prev }; delete n[i]; return n })
    setExpMejoradas(prev => ({ ...prev, [i]: true }))
  }

  const rechazarSugerenciaExp = (i) => {
    setExpSugeridas(prev => { const n = { ...prev }; delete n[i]; return n })
  }

  // Compara dos textos y pone en negrita las palabras nuevas — soporta multi-línea
  const renderDiff = (original, sugerido) => {
    if (!original || !sugerido) return sugerido
    const wordsO = new Set(original.toLowerCase().split(/\s+/).map(w => w.replace(/[.,•\-*]/g, '')))
    return sugerido.split('\n').map((line, li) => (
      <span key={li} style={{ display: 'block' }}>
        {line.split(/\s+/).map((w, wi) => {
          const clean = w.toLowerCase().replace(/[.,•\-*]/g, '')
          return wordsO.has(clean) || clean === ''
            ? <span key={wi}>{w} </span>
            : <strong key={wi} className="text-indigo-700 font-bold">{w} </strong>
        })}
      </span>
    ))
  }


  // ── Confirmar y guardar en BD ─────────────────────────────────────────────
  const confirmarYGuardar = async () => {
    if (!cvGenerada) return
    setGenerando(true)
    setError('')
    try {
      const hoy = new Date()
      const ddmmaa = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')
      const nombreLimpio = `${datos.nombre} ${datos.apellido}`.trim() || 'Usuario ELVIA'
      const nombreArchivo = `CV_${nombreLimpio} - original ${ddmmaa}.txt`

      // 1. Subir texto generado a Storage
      const blob = new Blob([cvGenerada.optimizedCV], { type: 'text/plain' })
      const filePath = `${user.id}/cv_original.txt`
      
      const { data: up, error: upErr } = await supabase.storage
        .from('cvs').upload(filePath, blob, { upsert: true })
      
      if (upErr) throw new Error('Error al guardar CV en Storage')

      // 2. Usar el ID que ya nos dio el backend al generar
      const savedId = cvGenerada.id;
      if (!savedId) {
        console.warn('Backend no retornó ID, continuando sin vinculación crítica.');
      }

      // 3. Obtener job_search_profile actual para no sobreescribir otros datos
      const { data: pActual } = await supabase.from('profiles')
        .select('job_search_profile')
        .eq('id', user.id)
        .maybeSingle()
      
      const jsp = pActual?.job_search_profile || {}
      
      // 4. Guardar datos estructurados + limpiar borrador en la DB
      const { cv_borrador, ...restoJsp } = jsp

      const { error: updErr } = await supabase.from('profiles').update({
        cv_path:     up.path,
        cv_filename: nombreArchivo,
        job_search_profile: {
          ...restoJsp,
          cv_datos_originales: { datos, generado_en: new Date().toISOString() }
        }
      }).eq('id', user.id)
      
      if (updErr) throw new Error('Error al actualizar el perfil en la base de datos')

      // 4. Limpiar caches locales — ESTO ES CRITICO para que ProyectoLaboral no cargue basura
      sessionStorage.removeItem(`jsp_${user.id}`)
      sessionStorage.removeItem(`cv_draft_${user.id}`)
      sessionStorage.removeItem(`perfil_lp_${user.id}`)

      // 5. Refrescar estado global antes de navegar
      await refreshPerfil()
      if (refreshJpData) await refreshJpData()

      // 6. Navegar al Proyecto Laboral con el flag de éxito
      setCvGenerada(null)
      navigate('/proyecto-laboral?exito=cv_creada', { replace: true })
      
    } catch (err) {
      console.error('Error en confirmarYGuardar:', err)
      setError(err.message || 'Ocurrió un error inesperado al guardar tu CV.')
    } finally {
      setGenerando(false)
    }
  }

  // ── Vista: CV generado para revisión ─────────────────────────────────────────
  if (cvGenerada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setCvGenerada(null)} className="mb-6 text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-2">
            <ArrowLeft size={20} /> Volver a editar
          </button>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {cvGenerada.optimizedCV}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
                {cvGenerada.changes?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Cambios realizados</h3>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {cvGenerada.changes.slice(0, 4).map((c, i) => (
                        <li key={i} className="flex gap-2"><Check size={13} className="text-green-600 shrink-0 mt-0.5" /><span>{c}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {cvGenerada.recommendations?.length > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Recomendaciones</h3>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {cvGenerada.recommendations.slice(0, 3).map((r, i) => (<li key={i}>💡 {r}</li>))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => descargarCV(cvGenerada.id, 'pdf')}
                    disabled={!cvGenerada.id}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <DownloadSimple size={18} /> Descargar PDF
                  </button>
                  <button
                    onClick={() => descargarCV(cvGenerada.id, 'word')}
                    disabled={!cvGenerada.id}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <FileDoc size={18} className="text-blue-600" /> Descargar Word
                  </button>
                </div>

                <div className="pt-2">
                  <button onClick={confirmarYGuardar} disabled={generando}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-green-100">
                    {generando ? <><SpinnerGap size={18} className="animate-spin" /> Guardando...</> : <><CheckFat size={18} /> Confirmar y Finalizar</>}
                  </button>
                </div>
                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">{error}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading inicial ───────────────────────────────────────────────────────────
  if (inicializando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <SpinnerGap size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  const pasoInfo   = PASOS[pasoActual]
  const pctLlenado = calcularLlenado(datos)

  // Si hay un borrador en BD y el usuario entró con mode='scratch', mostramos solo el modal
  // (sin el wizard ni la pantalla de selección detrás)
  if (borradorPendiente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Notepad size={20} weight="duotone" className="text-indigo-600" />
            </div>
            <h3 className="text-base font-black text-slate-800">Tienes un borrador en progreso</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Detectamos un CV que estabas construyendo antes. ¿Quieres continuar donde lo dejaste o empezar uno nuevo con la información actualizada de tu Gerente de Proyecto?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={continuarBorrador}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Continuar mi borrador
            </button>
            <button
              onClick={descartarYEmpezar}
              className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold transition-colors cursor-pointer border border-rose-200 flex items-center justify-center gap-2"
            >
              <ArrowUUpLeft size={14} weight="bold" /> Empezar uno nuevo (descarta el anterior)
            </button>
            <button
              onClick={() => { setBorradorPendiente(null); navigate('/proyecto-laboral') }}
              className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Volver al Optimizador
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (alertaExistente && pasoActual === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <WarningCircle size={32} weight="bold" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">¡Ya tienes un CV hecho!</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Detectamos que ya generaste tu CV profesional con nosotros. 
            Si continúas, sobrescribiremos tu versión actual.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/proyecto-laboral')}
              className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={18} weight="bold" /> Volver al Proyecto
            </button>
            <button onClick={() => setAlertaExistente(false)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
              Crear uno nuevo de todas formas
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Pantalla de selección de ruta ───────────────────────────────────────────
  // - modoForzado='upload'  → solo card de upload (pantalla 0 obligatoria)
  // - modoForzado=null      → comportamiento legacy: 2 cards
  // - modoForzado='scratch' → nunca llega aquí (skip directo en cargar())
  if (!inicializando && modoSeleccion) {
    const soloUpload = modoForzado === 'upload'
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        {/* Input oculto reutilizado del wizard */}
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx"
          onChange={e => extraerCV(e.target.files?.[0])} className="hidden" />

        <div className={soloUpload ? 'max-w-xl w-full' : 'max-w-2xl w-full'}>
          {/* Volver al pilar */}
          {soloUpload && (
            <button
              onClick={() => navigate('/proyecto-laboral')}
              className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
              <ArrowLeft size={14} weight="bold" /> Volver al Optimizador de CV
            </button>
          )}

          {/* Título */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 mb-5">
              <FileDoc size={30} weight="duotone" className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">
              {soloUpload ? 'Sube tu CV' : 'Crea tu CV Inicial'}
            </h1>
            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
              {soloUpload
                ? 'ELVIA® analiza tu CV actual y lo combina con tu información del Gerente de Proyecto para entregarte una versión optimizada al estándar Harvard®.'
                : 'Tu CV base con el estándar Harvard® — el cimiento de tu transición con ELVIA®.'}
            </p>
          </div>

          {/* Cards */}
          <div className={soloUpload ? '' : 'grid sm:grid-cols-2 gap-5'}>

            {/* Card A: Subir mi CV (siempre visible) */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={extrayendo}
              className={`group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-50 ${soloUpload ? 'p-10' : 'p-8'} text-left transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait w-full`}
            >
              {extrayendo && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center gap-2 z-10">
                  <SpinnerGap size={28} className="animate-spin text-indigo-500" />
                  <p className="text-xs font-bold text-indigo-700">Analizando tu CV...</p>
                </div>
              )}
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-indigo-50 flex items-center justify-center mb-5 transition-colors">
                <UploadSimple size={24} weight="duotone" className="text-blue-600 group-hover:text-indigo-600 transition-colors" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-2">
                {soloUpload ? 'Selecciona tu CV (PDF o Word)' : 'Subir mi CV'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {soloUpload
                  ? 'Haz clic para escoger el archivo desde tu computadora. Lo procesamos y construimos un nuevo CV optimizado con tu contexto de ELVIA®.'
                  : 'Tengo un CV listo. ELVIA lo analiza, lo estructura y lo optimiza al estándar Harvard.'}
              </p>
              <div className="mt-5 text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                PDF o Word · Max. 5MB →
              </div>
            </button>

            {/* Card B: Empezar de cero (solo en modo legacy) */}
            {!soloUpload && (
              <button
                onClick={() => setModoSeleccion(false)}
                className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-50 p-8 text-left transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-5 transition-colors">
                  <PencilSimple size={24} weight="duotone" className="text-emerald-600" />
                </div>
                <h3 className="text-base font-black text-slate-800 mb-2">Empezar de cero</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Construye tu CV paso a paso con la guía de ELVIA, campo por campo y con IA en cada sección.
                </p>
                <div className="mt-5 text-xs font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
                  6 pasos · ~15 minutos →
                </div>
              </button>
            )}

          </div>

          {error && (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">{error}</div>
          )}

          {!soloUpload && (
            <p className="text-center text-[11px] text-slate-400 mt-8">
              En ambos casos terminarás con una Vista Previa Harvard antes de generar tu CV final.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className={`mx-auto transition-all duration-300 ${analisis ? 'max-w-5xl' : 'max-w-2xl'}`}>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-slate-800 mb-1">
                {modoForzado === 'upload' ? 'Optimiza tu CV' : 'Crea tu CV desde cero'}
              </h1>
              <p className="text-slate-500 text-sm">Paso {pasoActual + 1} de {PASOS.length} · {pasoInfo.icon} {pasoInfo.label}</p>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer">
              <X size={14} weight="bold" /> Cancelar
            </button>
          </div>

          {/* Barra de pasos */}
          <div className="mt-3 flex gap-1">
            {PASOS.map((p, i) => (
              <div key={p.id} className={`flex-1 h-1.5 rounded-full transition-all ${i < pasoActual ? 'bg-green-500' : i === pasoActual ? 'bg-blue-500' : 'bg-slate-200'}`} />
            ))}
          </div>

          {/* % de llenado */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-slate-200 rounded-full h-1">
              <div className={`h-1 rounded-full transition-all duration-500 ${pctLlenado >= 80 ? 'bg-green-500' : pctLlenado >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`}
                style={{ width: `${pctLlenado}%` }} />
            </div>
            <span className={`text-xs font-bold shrink-0 ${pctLlenado >= 80 ? 'text-green-600' : pctLlenado >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>
              {pctLlenado}% completado
            </span>
          </div>
        </div>

        {/* Banners de estado */}
        {user && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {ultimoGuardado
              ? `✓ Guardado a las ${ultimoGuardado.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
              : 'Tus cambios se guardarán automáticamente...'}
          </div>
        )}


        {/* Layout: 1 col normal, 2 col cuando hay panel de análisis */}
        <div className={analisis ? 'grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start' : ''}>

          {/* ── Wizard principal ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">

            {/* PASO 0: Datos personales */}
            {pasoActual === 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                  <h2 className="text-base font-bold text-slate-800">Datos Personales</h2>
                  <HelpBadge id="cvdesdecero.datos" />
                </div>
                {/* Upload CV — oculto en modo 'scratch' (el usuario eligió empezar desde cero desde el pilar) */}
                {modoForzado !== 'scratch' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl p-5">
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx"
                    onChange={e => extraerCV(e.target.files?.[0])} className="hidden" />
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-700">¿Tienes un CV? Súbelo y llenamos el formulario</p>
                      <p className="text-xs text-slate-400 mt-0.5">{cvFileName || 'PDF o Word · Max. 5MB · Se respeta el idioma del CV'}</p>
                    </div>
                    <button onClick={() => fileRef.current?.click()} disabled={extrayendo}
                      className={`flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${extrayendo ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {extrayendo ? <SpinnerGap size={14} className="animate-spin" /> : <UploadSimple size={14} weight="bold" />}
                      {extrayendo ? 'Analizando...' : cvFileName ? 'Cambiar' : 'Cargar CV'}
                    </button>
                  </div>

                  {/* Banner de mismatch (CV de otra persona) */}
                  {cvMismatch && (
                    <div className="mt-3 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                      <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-bold text-red-700">El CV no corresponde al usuario registrado</p>
                        <p className="text-xs text-red-600 leading-relaxed">
                          No se puede subir información de terceros sin su previa autorización. Para mayor información lee nuestros{' '}
                          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-800">
                            Términos & Condiciones y Privacidad de Datos
                          </a>.
                        </p>
                        <button
                          onClick={() => {
                            setCvMismatch(false)
                            setCvPending(null)
                            setCvFileName('')
                            fileRef.current.value = ''
                            fileRef.current?.click()
                          }}
                          className="flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors">
                          <UploadSimple size={12} weight="bold" /> Cargar otro CV
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Banner de éxito al extraer */}
                  {!cvMismatch && cvFileName && analisis && (
                    <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-white border border-green-200">
                      <CheckCircle size={15} weight="fill" className="text-green-500 shrink-0" />
                      <p className="text-xs text-slate-700">
                        Datos extraídos de <span className="font-bold">{cvFileName}</span> — revisa y ajusta si es necesario
                      </p>
                    </div>
                  )}

                  {/* Aviso de idioma detectado distinto al español */}
                  {!cvMismatch && cvIdioma && cvIdioma !== 'es' && cvFileName && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <Warning size={15} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Tu CV está en <span className="font-bold">{cvIdioma === 'en' ? 'inglés' : cvIdioma === 'pt' ? 'portugués' : cvIdioma === 'fr' ? 'francés' : cvIdioma.toUpperCase()}</span>.
                        Las sugerencias de resumen se generarán en ese idioma. Al llegar al último paso podrás elegir el idioma del CV final.
                      </p>
                    </div>
                  )}
                </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
                    <WarningCircle size={14} className="shrink-0" /> {error}
                  </div>
                )}

                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Datos personales</p>

                <div className="grid grid-cols-2 gap-3">
                  {[['nombre','Primer nombre *'],['nombre2','Segundo nombre'],['apellido','Primer apellido *'],['apellido2','Segundo apellido']].map(([k, l]) => (
                    <input key={k} type="text" placeholder={l} value={datos[k]} onChange={e => upDatos(k, e.target.value)}
                      className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                  ))}
                </div>

                <input type="email" placeholder="Correo electrónico" value={datos.email} onChange={e => upDatos('email', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />

                <div className="flex gap-2">
                  <select value={datos.indicativo} onChange={e => upDatos('indicativo', e.target.value)}
                    className="border border-slate-300 rounded-xl px-2 py-2.5 text-sm focus:outline-none w-24 shrink-0">
                    {['+1','+52','+57','+54','+55','+34','+39','+49','+33'].map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  <input type="tel" placeholder="Teléfono" value={datos.telefono} onChange={e => upDatos('telefono', e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Ciudad" value={datos.ciudad} onChange={e => upDatos('ciudad', e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                  <select value={datos.pais} onChange={e => upDatos('pais', e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="">País</option>
                    {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <input type="text" placeholder="Cargo objetivo (ej. Gerente de Marketing, Analista Senior, CFO...)"
                    value={datos.cargo_objetivo} onChange={e => upDatos('cargo_objetivo', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                  {datos.cargo_objetivo && (() => {
                    const c = datos.cargo_objetivo.toLowerCase()
                    const s = /c-?level|ceo|cfo|coo|cto|cpo|chief|vp\b|vice|vicepresidente/.test(c) ? { label: 'C-Level / VP', color: 'bg-purple-100 text-purple-700' }
                      : /gerente|director|head of|l[ií]der\b|lead\b/.test(c) ? { label: 'Senior (Gerente/Director)', color: 'bg-blue-100 text-blue-700' }
                      : /jefe|coordinador|supervisor|especialista\b/.test(c) ? { label: 'Mid-Senior (Jefe/Coordinador)', color: 'bg-indigo-100 text-indigo-700' }
                      : /analista|asistente|auxiliar|jr\b|junior/.test(c) ? { label: 'Junior (Analista/Asistente)', color: 'bg-emerald-100 text-emerald-700' }
                      : null
                    return s ? <span className={`inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>Seniority: {s.label}</span> : null
                  })()}
                </div>

                {tipsPorPaso.datos.length > 0 && (
                  <div className="mt-1 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 mb-1.5">💡 Tips para mejorar esta sección:</p>
                    <ul className="space-y-1">{tipsPorPaso.datos.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-1.5"><span className="shrink-0">→</span><span>{t}</span></li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* PASO 1: Resumen */}
            {pasoActual === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                  <h2 className="text-base font-bold text-slate-800">Resumen Profesional</h2>
                  <HelpBadge id="cvdesdecero.resumen" />
                </div>

                {/* ── Path A: Fusión CV original + Oferta de Valor ─────────────────── */}
                {modoForzado === 'upload' && (cvResumenOriginal || ofertaValorGerente) && (
                  <div className="space-y-4">
                    {/* Caja A: Resumen del CV original (read-only) */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Notepad size={14} weight="duotone" /> A. Resumen extraído de tu CV
                      </label>
                      {cvResumenOriginal ? (
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{cvResumenOriginal}</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Tu CV no traía un resumen explícito.</p>
                      )}
                    </div>

                    {/* Caja B: Oferta de Valor del Gerente (read-only) */}
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <label className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Sparkle size={14} weight="duotone" /> B. Tu Oferta de Valor (Gerente de Proyecto)
                      </label>
                      {ofertaValorGerente ? (
                        <p className="text-xs text-indigo-900/80 leading-relaxed whitespace-pre-line">{ofertaValorGerente}</p>
                      ) : (
                        <p className="text-xs text-indigo-400 italic">Aún no has llenado Mi Oferta de Valor en el Gerente de Proyecto.</p>
                      )}
                    </div>

                    {/* Botón fusión */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={handleFusionarResumen}
                        disabled={fusionando || (!cvResumenOriginal && !ofertaValorGerente)}
                        className={`flex items-center gap-2 text-sm font-black px-6 py-3 rounded-xl transition-all shadow-lg ${fusionando ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl cursor-pointer'}`}
                      >
                        {fusionando ? <SpinnerGap size={18} className="animate-spin" /> : <MagicWand size={18} weight="fill" />}
                        {fusionando ? 'Fusionando con ELVIA®…' : 'Fusionar con ELVIA®'}
                      </button>
                      <p className="text-[10px] text-slate-400 text-center max-w-xs">
                        ELVIA® sintetiza ambos textos en un resumen ATS-optimizado. Cero alucinación: solo usa información presente en tus textos.
                      </p>
                      {errorFusion && (
                        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-1">{errorFusion}</div>
                      )}
                    </div>

                    {/* Separador visual */}
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">C. Resultado</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  </div>
                )}

                {/* CAJA principal: borrador/entrada */}
                <div className={`transition-all duration-300 ${resumenBloqueado ? 'opacity-50 pointer-events-none scale-[0.98]' : ''}`}>
                  <label className="text-sm font-bold text-slate-700 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1">
                      {modoForzado === 'upload' ? 'Resumen profesional definitivo' : '1. Tu borrador profesional'}
                      <Tooltip text="Escribe libremente tus logros y trayectoria. La IA te ayudará a pulirlo." />
                    </span>
                    {resumenBloqueado && <button onClick={()=>setResumenBloqueado(false)} className="text-xs text-indigo-600 font-bold hover:underline">Editar de nuevo</button>}
                  </label>
                  {modoForzado === 'scratch' && datos.resumen && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-2 px-1">
                      Esta es la sugerencia que resulta de tu <span className="font-bold text-indigo-600">Autoconocimiento</span>. Puedes modificarla y/o mejorarla con la ayuda de ELVIA®.
                    </p>
                  )}
                  {modoForzado === 'upload' && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-2 px-1">
                      Edita libremente o usa <span className="font-bold text-indigo-600">Fusionar con ELVIA®</span> arriba para combinar tu CV con tu Oferta de Valor.
                    </p>
                  )}
                  <textarea
                    placeholder="Describe tu trayectoria..."
                    value={datos.resumen}
                    onChange={e => upDatos('resumen', e.target.value)}
                    rows={12}
                    maxLength={1000}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-y bg-white shadow-sm leading-relaxed"
                    style={{ minHeight: 220 }}
                  />
                  {datos.resumen.length > 800 && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <Warning size={14} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Tu resumen tiene <span className="font-bold">{datos.resumen.length} caracteres</span>. Para un CV de 1 página, lo ideal es mantenerlo entre 400 y 800. Considera acortarlo.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={handleOptimizarResumen}
                      disabled={optimizandoResumen || !datos.resumen || resumenBloqueado}
                      className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${optimizandoResumen ? 'bg-slate-100 text-slate-400' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100'}`}
                    >
                      {optimizandoResumen ? <SpinnerGap size={16} className="animate-spin" /> : <MagicWand size={16} weight="bold" />}
                      {optimizandoResumen ? 'Analizando...' : 'Sugerencia de mejora'}
                    </button>
                    <div className={`text-[10px] ${datos.resumen.length >= 900 ? 'text-rose-500 font-bold' : datos.resumen.length >= 800 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>{datos.resumen.length}/1000 caracteres</div>
                  </div>
                </div>

                {/* CAJA 2: Sugerencia Editable con Diff */}
                {resumenSugerido && !resumenBloqueado && (
                  <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-4 shadow-sm border-dashed border-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MagicWand size={18} weight="fill" className="text-indigo-600" />
                        <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">Sugerencia de mejora (Editable)</span>
                      </div>
                      <button onClick={() => setResumenSugerido('')} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                    </div>
                    
                    {/* Visualización de Cambios (Diff) */}
                    <div className="mb-4 p-3 bg-white/60 rounded-lg text-xs leading-relaxed text-slate-600 border border-indigo-50">
                      <p className="font-bold text-[10px] text-indigo-400 uppercase mb-1">Cambios detectados:</p>
                      {renderDiff(datos.resumen, resumenSugerido)}
                    </div>

                    <textarea 
                      value={resumenSugerido}
                      onChange={e => setResumenSugerido(e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none shadow-inner mb-4"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() => { upDatos('resumen', resumenSugerido); setResumenSugerido(''); setResumenBloqueado(true) }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                      >
                        <CheckFat size={16} weight="fill" /> Aplicar y Finalizar
                      </button>
                      <button
                        onClick={() => setResumenSugerido('')}
                        className="px-6 bg-white border border-slate-200 text-slate-500 text-xs font-bold py-3 rounded-xl hover:bg-slate-50 transition-all"
                      >
                        Ignorar
                      </button>
                    </div>
                  </div>
                )}

                {/* CAJA 3: Resultado Final (Solo Lectura) */}
                {resumenBloqueado && (
                  <div className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-3xl animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-900/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Lock size={20} weight="fill" className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sección Completada</p>
                        <p className="text-sm font-bold text-slate-800 leading-tight">Tu resumen profesional final</p>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-inner relative group">
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        "{datos.resumen}"
                      </p>
                      <button 
                        onClick={() => setResumenBloqueado(false)}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        title="Editar de nuevo"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                )}

                {tipsPorPaso.resumen.length > 0 && !resumenBloqueado && !resumenSugerido && (
                  <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                      <Notepad size={16} className="text-amber-500" />
                      💡 Tips para mejorar esta sección:
                    </p>
                    <ul className="space-y-1.5">{tipsPorPaso.resumen.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-2 leading-relaxed"><span className="shrink-0 text-amber-400">●</span><span>{t}</span></li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* PASO 2: Experiencia */}
            {pasoActual === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                  <h2 className="text-base font-bold text-slate-800">Experiencia Laboral</h2>
                  <HelpBadge id="cvdesdecero.experiencia" />
                </div>
                {datos.experiencias.map((exp, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-700 text-sm">Experiencia {i + 1}</h4>
                        {i === 0 && <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">más reciente</span>}
                      </div>
                      {datos.experiencias.length > 1 && (
                        <button onClick={() => delExp(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><X size={16} /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Empresa" value={exp.empresa} onChange={e => upExp(i, 'empresa', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                      <input placeholder="Cargo / Title" value={exp.cargo} onChange={e => upExp(i, 'cargo', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Fecha inicio (ej: Jan 2020)" value={exp.fecha_inicio} onChange={e => upExp(i, 'fecha_inicio', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                      <input placeholder="Fecha fin (ej: Present)" value={exp.fecha_fin} onChange={e => upExp(i, 'fecha_fin', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                    </div>
                    {/* Descripción + botón de mejora */}
                    <textarea placeholder="Descripción y logros (en el idioma del CV)..." value={exp.descripcion} onChange={e => upExp(i, 'descripcion', e.target.value)}
                      rows={Math.max(3, (exp.descripcion || '').split('\n').length + 1)}
                      style={{ whiteSpace: 'pre-wrap' }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none leading-relaxed" />

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleOptimizarExp(i)}
                        disabled={expOptimizando[i] || !exp.descripcion || exp.descripcion.length < 10 || !!expSugeridas[i] || !!expMejoradas[i]}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${expOptimizando[i] ? 'bg-slate-100 text-slate-400' : expMejoradas[i] ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100'} disabled:opacity-40`}
                      >
                        {expOptimizando[i] ? <SpinnerGap size={14} className="animate-spin" /> : expMejoradas[i] ? <CheckFat size={14} weight="fill" /> : <MagicWand size={14} weight="bold" />}
                        {expOptimizando[i] ? 'Analizando...' : expMejoradas[i] ? 'Ya mejorado' : 'Mejorar con IA'}
                      </button>
                      <span className={`text-[10px] ${exp.descripcion.length >= 600 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>{exp.descripcion.length} chars</span>
                    </div>

                    {/* Panel de sugerencia */}
                    {expSugeridas[i] && (
                      <div className="p-4 bg-indigo-50/40 border-2 border-dashed border-indigo-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <MagicWand size={15} weight="fill" className="text-indigo-600" />
                            <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">Sugerencia IA (editable)</span>
                          </div>
                          <button onClick={() => rechazarSugerenciaExp(i)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                        </div>

                        {/* Diff visual */}
                        <div className="p-2.5 bg-white/70 rounded-lg text-xs leading-relaxed text-slate-600 border border-indigo-50">
                          <p className="font-bold text-[10px] text-indigo-400 uppercase mb-1">Palabras nuevas en negrita:</p>
                          {renderDiff(exp.descripcion, expSugeridas[i])}
                        </div>

                        <textarea
                          value={expSugeridas[i]}
                          onChange={e => setExpSugeridas(prev => ({ ...prev, [i]: e.target.value }))}
                          rows={Math.max(3, (expSugeridas[i] || '').split('\n').length + 1)}
                          style={{ whiteSpace: 'pre-wrap' }}
                          className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none leading-relaxed"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => aplicarSugerenciaExp(i)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <CheckFat size={14} weight="fill" /> Aplicar
                          </button>
                          <button
                            onClick={() => rechazarSugerenciaExp(i)}
                            className="px-5 bg-white border border-slate-200 text-slate-500 text-xs font-bold py-2 rounded-xl hover:bg-slate-50 transition-colors"
                          >
                            Ignorar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={addExp} className="w-full border-2 border-dashed border-blue-300 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 text-sm cursor-pointer">
                  <Plus size={16} /> Agregar experiencia
                </button>
                {tipsPorPaso.experiencia.length > 0 && (
                  <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 mb-1.5">💡 Tips para mejorar esta sección:</p>
                    <ul className="space-y-1">{tipsPorPaso.experiencia.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-1.5"><span className="shrink-0">→</span><span>{t}</span></li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* PASO 3: Educación */}
            {pasoActual === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                  <h2 className="text-base font-bold text-slate-800">Educación</h2>
                  <HelpBadge id="cvdesdecero.educacion" />
                </div>
                {datos.educacion.map((edu, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-slate-700 text-sm">Educación {i + 1}</h4>
                      {datos.educacion.length > 1 && (
                        <button onClick={() => delEdu(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><X size={16} /></button>
                      )}
                    </div>
                    <input placeholder="Institución / University" value={edu.institucion} onChange={e => upEdu(i, 'institucion', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Título / Degree" value={edu.titulo} onChange={e => upEdu(i, 'titulo', e.target.value)}
                        className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                      <input placeholder="Año" value={edu.anio} onChange={e => upEdu(i, 'anio', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                    </div>
                  </div>
                ))}
                <button onClick={addEdu} className="w-full border-2 border-dashed border-blue-300 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 text-sm cursor-pointer">
                  <Plus size={16} /> Agregar educación
                </button>
                {tipsPorPaso.educacion.length > 0 && (
                  <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 mb-1.5">💡 Tips para mejorar esta sección:</p>
                    <ul className="space-y-1">{tipsPorPaso.educacion.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-1.5"><span className="shrink-0">→</span><span>{t}</span></li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* PASO 4: Habilidades */}
            {pasoActual === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                  <h2 className="text-base font-bold text-slate-800">Competencias y Habilidades</h2>
                  <HelpBadge id="cvdesdecero.habilidades" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Estas son las competencias seleccionadas en tu pilar <span className="font-bold text-indigo-600">Competencias</span> del Gerente de Proyecto. Puedes quitar las que no quieras incluir en este CV o agregar habilidades adicionales.
                </p>

                {/* Habilidades del usuario (vienen del Gerente o agregadas aquí) */}
                {datos.habilidades.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {datos.habilidades.map(h => (
                      <span key={h} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white">
                        {h}
                        <button onClick={() => togHab(h)} className="cursor-pointer ml-0.5 opacity-70 hover:opacity-100 hover:bg-white/20 rounded-full" title="Quitar de este CV"><X size={11} weight="bold" /></button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-500 text-center">
                    No tienes habilidades cargadas. Agrégalas debajo o ve al pilar Competencias para seleccionarlas.
                  </div>
                )}

                {/* Agregar habilidad personalizada */}
                <div className="flex gap-2">
                  <input type="text" placeholder="Agregar habilidad adicional..." value={nuevaHab}
                    onChange={e => setNuevaHab(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addHab(nuevaHab)}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                  <button onClick={() => addHab(nuevaHab)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 cursor-pointer">
                    <Plus size={16} />
                  </button>
                </div>
                {tipsPorPaso.habilidades.length > 0 && (
                  <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 mb-1.5">💡 Tips para mejorar esta sección:</p>
                    <ul className="space-y-1">{tipsPorPaso.habilidades.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-1.5"><span className="shrink-0">→</span><span>{t}</span></li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* PASO 5: Idiomas */}
            {pasoActual === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                  <h2 className="text-base font-bold text-slate-800">Idiomas</h2>
                  <HelpBadge id="cvdesdecero.idiomas" />
                </div>
                <p className="text-sm text-slate-600">Idiomas que dominas</p>
                <div className="space-y-2">
                  {/* Idiomas detectados del CV que no están en la lista estándar */}
                  {(datos.idiomas || []).filter(i => i.detectedFromCV && !IDIOMAS_LIST.includes(i.idioma)).map(item => (
                    <div key={item.idioma} className="flex items-center gap-3 border border-blue-200 bg-blue-50/40 rounded-lg p-3">
                      <input type="checkbox" checked onChange={() => setDatos(f => ({ ...f, idiomas: f.idiomas.filter(x => x.idioma !== item.idioma) }))}
                        className="w-4 h-4 cursor-pointer accent-blue-600" />
                      <span className="flex-1 text-sm font-medium text-slate-700">{item.idioma}</span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">Del CV</span>
                      <select
                        value={item.nivel || ''}
                        onChange={e => upNivIdm(item.idioma, e.target.value)}
                        className={`border rounded-lg px-2 py-1 text-xs focus:outline-none ${!item.nivel ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300'}`}>
                        <option value="" disabled>Seleccionar...</option>
                        {NIVELES_CEFR.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  ))}
                  {IDIOMAS_LIST.map(idioma => {
                    const entry = datos.idiomas?.find(i => i.idioma === idioma)
                    const isChecked = !!entry
                    const isFromCV = entry?.detectedFromCV
                    const nivelActual = entry?.nivel
                    return (
                      <div key={idioma} className={`flex items-center gap-3 border rounded-lg p-3 ${isFromCV ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200'}`}>
                        <input type="checkbox" checked={isChecked}
                          onChange={() => togIdm(idioma)} className="w-4 h-4 cursor-pointer accent-blue-600" />
                        <span className="flex-1 text-sm font-medium text-slate-700">{idioma}</span>
                        {isFromCV && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">Del CV</span>}
                        {isChecked && (
                          <select
                            value={nivelActual || ''}
                            onChange={e => upNivIdm(idioma, e.target.value)}
                            className={`border rounded-lg px-2 py-1 text-xs focus:outline-none ${!nivelActual ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300'}`}>
                            {!nivelActual && <option value="" disabled>Seleccionar...</option>}
                            {NIVELES_CEFR.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>
                {tipsPorPaso.idiomas.length > 0 && (
                  <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 mb-1.5">💡 Tips para mejorar esta sección:</p>
                    <ul className="space-y-1">{tipsPorPaso.idiomas.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-1.5"><span className="shrink-0">→</span><span>{t}</span></li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* PASO 6: Vista Previa Harvard */}
            {pasoActual === 6 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                  <Eye size={18} weight="duotone" className="text-indigo-600" />
                  <h2 className="text-base font-black text-slate-800">Vista Previa — Formato Harvard</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Así quedará tu CV. Puedes volver a editar cualquier sección antes de generar.
                </p>
                {/* Contenedor scrollable con sombra de papel */}
                <div className="overflow-y-auto overflow-x-hidden max-h-[580px] rounded-xl border border-slate-200 shadow-inner bg-slate-100 p-4">
                  <CVHarvardPreview datos={datos} />
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="mt-8 flex justify-between">
              <button onClick={() => setPasoActual(p => Math.max(0, p - 1))} disabled={pasoActual === 0}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-300 rounded-xl font-bold text-slate-700 disabled:opacity-30 hover:border-slate-500 transition-colors text-sm cursor-pointer">
                <ArrowLeft size={16} /> {pasoActual === 6 ? 'Volver a editar' : 'Anterior'}
              </button>
              {pasoActual === PASOS.length - 1 ? (
                <button onClick={iniciarGenerarCV} disabled={generando || !datos.nombre || !datos.apellido}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold disabled:opacity-50 transition-colors text-sm cursor-pointer">
                  {generando ? <><SpinnerGap size={16} className="animate-spin" /> Generando...</> : <><FileArrowDown size={16} /> Generar CV</>}
                </button>
              ) : pasoActual === PASOS.length - 2 ? (
                <button onClick={() => setPasoActual(PASOS.length - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors text-sm cursor-pointer">
                  <Eye size={16} /> Ver Vista Previa
                </button>
              ) : (
                <button onClick={() => setPasoActual(p => Math.min(PASOS.length - 1, p + 1))}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-sm cursor-pointer">
                  Siguiente <ArrowRight size={16} />
                </button>
              )}
            </div>

            {error && pasoActual !== 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}
          </div>

          {/* ── Panel lateral de análisis ──────────────────────────────────── */}
          {analisis && (
            <div className="lg:sticky lg:top-6">
              <PanelAnalisis analisis={analisis} onClose={() => setAnalisis(null)} />
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: placeholder sin reemplazar ────────────────────────────── */}
      {alertaPlaceholder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Warning size={22} weight="duotone" className="text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Marcadores sin completar</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              El texto contiene marcadores sin completar (como{' '}
              <code className="bg-amber-50 text-amber-700 font-mono text-xs px-1.5 py-0.5 rounded">[X%]</code>
              {' '}o{' '}
              <code className="bg-amber-50 text-amber-700 font-mono text-xs px-1.5 py-0.5 rounded">[#]</code>
              ). Reemplázalos con valores reales o elimínalos antes de aplicar.
            </p>
            <button
              onClick={() => setAlertaPlaceholder(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ── Modal confirmación de idioma antes de generar ─────────────────── */}
      {alertaIdioma && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Warning size={20} weight="duotone" className="text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">CV en otro idioma</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              Detectamos que tu CV está redactado en{' '}
              <strong>{cvIdioma === 'en' ? 'inglés' : cvIdioma === 'pt' ? 'portugués' : cvIdioma === 'fr' ? 'francés' : cvIdioma.toUpperCase()}</strong>.
              El CV generado saldrá en ese idioma. ¿Confirmas o prefieres generarlo en español?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => generarCV('es')}
                className="py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer">
                Generar en español
              </button>
              <button
                onClick={() => generarCV(cvIdioma)}
                className="py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors cursor-pointer">
                Continuar en {cvIdioma === 'en' ? 'inglés' : cvIdioma === 'pt' ? 'portugués' : cvIdioma === 'fr' ? 'francés' : cvIdioma.toUpperCase()}
              </button>
            </div>
            <button onClick={() => setAlertaIdioma(false)}
              className="mt-3 w-full text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal cancelar wizard ────────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Warning size={20} weight="fill" className="text-amber-600" />
              </div>
              <h3 className="text-base font-black text-slate-800">¿Salir del wizard?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {modoForzado === 'upload'
                ? 'Perderás el progreso de optimización de este CV. Puedes volver al pilar Optimizador de CV y subir un CV distinto cuando quieras.'
                : 'Perderás lo que llevas escrito en este CV desde cero. Si ya tienes un CV listo, puedes subirlo desde el pilar Optimizador de CV y dejar que ELVIA® lo trabaje por ti.'}
            </p>
            <div className="flex flex-col gap-2">
              {modoForzado !== 'upload' && (
                <button
                  onClick={() => {
                    if (user) sessionStorage.removeItem(`cv_draft_${user.id}`)
                    setShowCancelModal(false)
                    navigate('/cv-desde-cero', { state: { mode: 'upload' }, replace: true })
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <UploadSimple size={14} weight="bold" /> Salir y subir mi CV
                </button>
              )}
              <button
                onClick={() => {
                  if (user) sessionStorage.removeItem(`cv_draft_${user.id}`)
                  setShowCancelModal(false)
                  navigate('/proyecto-laboral')
                }}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold transition-colors cursor-pointer border border-rose-200"
              >
                Salir sin guardar
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
              >
                Volver al wizard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
