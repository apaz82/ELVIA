// ProyectoLaboral.jsx  — Gerente de Proyecto de tu Búsqueda Laboral
// Design: Plus Jakarta Sans · SaaS Professional · Light mode
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { extractarPerfilCV, descargarCV } from '../services/cvService'
import { RECURSOS_DEFAULT as RECURSOS_DEFAULT_BASE, calcPerfilPts, calcularProgreso as calcProgreso } from '../utils/progresoLaboral'
import {
  Brain, CalendarCheck, Toolbox, FileText,
  Heart, CheckSquare, Square,
  ArrowRight, Trophy, Play, Robot,
  LinkedinLogo, FileMagnifyingGlass, MagnifyingGlass,
  Notepad, PlusMinus, Trash, Target, SpinnerGap,
  CheckCircle, ChartLine, Briefcase,
  User, Lock, Sparkle, MicrophoneStage, Books, Kanban,
  BookmarkSimple, Folders, UsersThree, Globe,
  UploadSimple, CheckFat, WarningCircle, X
} from '@phosphor-icons/react'

/* ─── Design tokens (Plus Jakarta Sans via Google Fonts) ─── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap'
if (!document.getElementById('pjs-font')) {
  const link = document.createElement('link')
  link.id   = 'pjs-font'
  link.rel  = 'stylesheet'
  link.href = FONT_LINK
  document.head.appendChild(link)
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PILARES = [
  { id: 'perfil',           label: 'Mi Perfil',           icon: User,          color: 'indigo', weight: 20 },
  { id: 'autoconocimiento', label: 'Autoconocimiento',    icon: Brain,         color: 'violet', weight: 25 },
  { id: 'recursos',         label: 'Recursos',            icon: Toolbox,       color: 'blue',   weight: 10 },
  { id: 'semana',           label: 'Horario semanal',     icon: CalendarCheck, color: 'teal',   weight: 15 },
  { id: 'oferta',           label: 'Mi oferta de valor',  icon: Sparkle,       color: 'rose',   weight: 10 },
  { id: 'documentos',       label: 'Documentos',          icon: FileText,      color: 'amber',  weight: 20 },
]

// ─── Catálogos para Mi Perfil ─────────────────────────────────────────────────
const PAISES_LATAM = [
  'México','Colombia','Argentina','Chile','Perú','Venezuela','Ecuador','Bolivia',
  'Uruguay','Paraguay','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua',
  'Panamá','República Dominicana','Cuba','España','Estados Unidos','Canadá','Brasil','Otro',
]
const INDICATIVOS = [
  {code:'MX',label:'México',ind:'+52'},{code:'CO',label:'Colombia',ind:'+57'},
  {code:'AR',label:'Argentina',ind:'+54'},{code:'CL',label:'Chile',ind:'+56'},
  {code:'PE',label:'Perú',ind:'+51'},{code:'VE',label:'Venezuela',ind:'+58'},
  {code:'EC',label:'Ecuador',ind:'+593'},{code:'BO',label:'Bolivia',ind:'+591'},
  {code:'UY',label:'Uruguay',ind:'+598'},{code:'PY',label:'Paraguay',ind:'+595'},
  {code:'CR',label:'Costa Rica',ind:'+506'},{code:'GT',label:'Guatemala',ind:'+502'},
  {code:'HN',label:'Honduras',ind:'+504'},{code:'SV',label:'El Salvador',ind:'+503'},
  {code:'NI',label:'Nicaragua',ind:'+505'},{code:'PA',label:'Panamá',ind:'+507'},
  {code:'DO',label:'Rep. Dominicana',ind:'+1'},{code:'CU',label:'Cuba',ind:'+53'},
  {code:'ES',label:'España',ind:'+34'},{code:'US',label:'Estados Unidos',ind:'+1'},
  {code:'CA',label:'Canadá',ind:'+1'},{code:'BR',label:'Brasil',ind:'+55'},
  {code:'XX',label:'Otro',ind:''},
]
const MONEDA_POR_PAIS = {
  'México':'MXN','Colombia':'COP','Argentina':'ARS','Chile':'CLP','Perú':'PEN',
  'Uruguay':'UYU','Venezuela':'USD','Ecuador':'USD','El Salvador':'USD','Panamá':'USD',
  'España':'EUR','Estados Unidos':'USD','Canadá':'CAD','Brasil':'BRL',
}
const detectarMoneda=(p)=>MONEDA_POR_PAIS[p]||'USD'
const indicativoPorPais=(p)=>{
  const e=INDICATIVOS.find(i=>i.label===p||i.label.startsWith((p||'').split(' ')[0]))
  return e?.ind||'+1'
}
const PRESTACIONES_POR_PAIS = {
  'México':['IMSS','INFONAVIT','AFORE','Aguinaldo','Prima vacacional','Seguro de gastos médicos','Seguro de vida','Vales de despensa','Fondo de ahorro','Auto de empresa','Car allowance','Viáticos'],
  'Colombia':['EPS (salud)','Pensión','ARL','Prima de servicios','Cesantías','Vacaciones adicionales','Dotación','Caja de compensación','Seguro de vida'],
  'Argentina':['Obra social','ART','SAC (aguinaldo)','Jubilación','Plan médico privado','Seguro de vida'],
  'Chile':['AFP','Isapre / Fonasa','Seguro de cesantía','Gratificación legal'],
  'Perú':['EsSalud','AFP / ONP','Gratificación','CTS','Seguro de vida ley'],
  'default':['Seguro médico','Seguro de vida','Bono anual','Plan de pensión','Vehículo / viáticos','Vacaciones adicionales','Flexibilidad horaria','Home office'],
}
const getPrestaciones=(p)=>PRESTACIONES_POR_PAIS[p]||PRESTACIONES_POR_PAIS['default']
const NIVELES_CARGO=['Asesor externo','Analista','Asistente','Jefe','Coordinador','Gerente','Director','C-Level']
const INDUSTRIAS_LATAM=[
  'Manufactura e Industria','Tecnología y Software','Banca y Servicios Financieros',
  'Seguros','Comercio y Retail','Salud y Farmacéutica','Agroindustria y Alimentos',
  'Construcción e Infraestructura','Energía y Petróleo','Telecomunicaciones',
  'Logística y Transporte','Consultoría','Educación','Gobierno y Sector Público',
  'Medios y Entretenimiento','Turismo y Hospitalidad','Automotriz','Minería',
  'Bienes Raíces','Marketing y Publicidad','Legal y Jurídico','Recursos Humanos',
  'Startups y Emprendimiento',
]
const AREAS_FUNC=['Operaciones','Supply Chain','Finanzas','IT','R&D','Recursos Humanos','Ingeniería','Dirección General','Marketing','Ventas','Legal','Otro']
const TIPOS_TRABAJO=['Híbrido','Presencial','Remoto']
const IDIOMAS_LIST=['Español','Inglés','Francés','Portugués','Alemán','Italiano','Chino Mandarín','Japonés','Árabe','Otro']
const NIVELES_CEFR=['Nativo','C2','C1','B2','B1','A2','A1']
const NIVELES_EDUCACION=['No profesional','Profesional','Postgrado']
const MONEDAS_LIST=[{code:'MXN',symbol:'$'},{code:'COP',symbol:'$'},{code:'ARS',symbol:'$'},{code:'CLP',symbol:'$'},{code:'PEN',symbol:'S/'},{code:'USD',symbol:'$'},{code:'EUR',symbol:'€'},{code:'BRL',symbol:'R$'},{code:'UYU',symbol:'$'}]
const MONEDAS_US=['MXN','USD','CAD']
const MEXICO_DETALLE={
  'Aguinaldo':              { tipo:'dias',     label:'Días',          default:'30'       },
  'Prima vacacional':       { tipo:'pct',      label:'% prima',       default:'25'       },
  'Seguro de gastos médicos':{ tipo:'selector', label:'Cobertura',    opciones:['Personal','Familiar'], default:'Personal' },
  'Vales de despensa':      { tipo:'monto',    label:'Monto mensual', default:''         },
  'Fondo de ahorro':        { tipo:'pct',      label:'% fondo',       default:''         },
  'Auto de empresa':        { tipo:'monto',    label:'Valor / mes',   default:''         },
  'Car allowance':          { tipo:'monto',    label:'Monto mensual', default:''         },
  'House allowance':        { tipo:'monto',    label:'Monto mensual', default:''         },
  'Viáticos':               { tipo:'monto',    label:'Monto mensual', default:''         },
}
const soloNumericos = (val, moneda) => {
  if (MONEDAS_US.includes(moneda)) return val.replace(/[^0-9.]/g, '')
  return val.replace(/[^0-9,]/g, '')
}
const formatearMonto = (val, moneda) => {
  if (!val) return ''
  const isUS = MONEDAS_US.includes(moneda)
  const dec = isUS ? '.' : ','
  const mil = isUS ? ',' : '.'
  const clean = isUS ? val.replace(/[^0-9.]/g, '') : val.replace(/[^0-9,]/g, '')
  const parts = clean.split(dec)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, mil)
  return parts.join(dec)
}
const parseMonto = (val, moneda) => {
  if (!val) return 0
  const isUS = MONEDAS_US.includes(moneda)
  const clean = isUS ? val.replace(/,/g, '') : val.replace(/\./g, '').replace(',', '.')
  return parseFloat(clean) || 0
}
const CIUDADES_SUGERIDAS=['México','Colombia','Argentina','Chile','Perú','Brasil','Estados Unidos','España','Portugal','Asia','Remoto','Otro']
const ANIOS_EXP=['Menos de 1','1-2','3-5','6-10','11-15','16-20','Más de 20']

const COLORES = {
  indigo: {
    pill:   'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    active: 'bg-indigo-600 text-white border-indigo-600',
    header: 'bg-indigo-50 border-indigo-100',
    icon:   'text-indigo-600',
    bar:    'bg-indigo-500',
    soft:   'bg-indigo-50',
    badge:  'bg-indigo-100 text-indigo-700',
    ring:   'ring-indigo-200',
  },
  violet: {
    pill:   'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
    active: 'bg-violet-600 text-white border-violet-600',
    header: 'bg-violet-50 border-violet-100',
    icon:   'text-violet-600',
    bar:    'bg-violet-500',
    soft:   'bg-violet-50',
    badge:  'bg-violet-100 text-violet-700',
    ring:   'ring-violet-200',
  },
  blue: {
    pill:   'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    active: 'bg-blue-600 text-white border-blue-600',
    header: 'bg-blue-50 border-blue-100',
    icon:   'text-blue-600',
    bar:    'bg-blue-500',
    soft:   'bg-blue-50',
    badge:  'bg-blue-100 text-blue-700',
    ring:   'ring-blue-200',
  },
  teal: {
    pill:   'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    active: 'bg-emerald-600 text-white border-emerald-600',
    header: 'bg-emerald-50 border-emerald-100',
    icon:   'text-emerald-600',
    bar:    'bg-emerald-500',
    soft:   'bg-emerald-50',
    badge:  'bg-emerald-100 text-emerald-700',
    ring:   'ring-emerald-200',
  },
  amber: {
    pill:   'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    active: 'bg-amber-500 text-white border-amber-500',
    header: 'bg-amber-50 border-amber-100',
    icon:   'text-amber-600',
    bar:    'bg-amber-500',
    soft:   'bg-amber-50',
    badge:  'bg-amber-100 text-amber-700',
    ring:   'ring-amber-200',
  },
  rose: {
    pill:   'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    active: 'bg-rose-600 text-white border-rose-600',
    header: 'bg-rose-50 border-rose-100',
    icon:   'text-rose-600',
    bar:    'bg-rose-500',
    soft:   'bg-rose-50',
    badge:  'bg-rose-100 text-rose-700',
    ring:   'ring-rose-200',
  },
}

const DIAS     = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORARIOS = ['7am-9am','9am-11am','11am-1pm','1pm-3pm','3pm-5pm','5pm-7pm','7pm-9pm']

// Precios de Suscripción Optima en MXN según plan
const PRECIO_OPTIMA_MXN = { free: 0, semanal: 99, mensual: 249, trimestral: 659 }

// Tasas de conversión aproximadas (base MXN)
const TASAS_DESDE_MXN = {
  MXN: 1, USD: 0.059, EUR: 0.054, COP: 232, ARS: 17.2,
  CLP: 55, PEN: 0.22, BRL: 0.30, UYU: 2.35, CAD: 0.080,
}

function convertirDesdeMXN(montoMXN, moneda) {
  const tasa = TASAS_DESDE_MXN[moneda] || 1
  return Math.round(montoMXN * tasa)
}

// Usar la constante centralizada desde utils (única fuente de verdad)
const RECURSOS_DEFAULT = RECURSOS_DEFAULT_BASE

const DOCS_LIST = [
  { id:'cv',          label:'CV optimizado con ELVIA',            link:'/cv-optimizer',   Icon:FileMagnifyingGlass, nota:'Tu CV base, optimizado para pasar filtros ATS y destacar tu perfil.'            },
  { id:'linkedin',    label:'LinkedIn actualizado y auditado',     link:'/linkedin-pro',   Icon:LinkedinLogo, target:'_blank', nota:'Perfil LinkedIn® analizado y optimizado con keywords de tu industria.' },
  { id:'cv_vacante',  label:'CV adaptado a una vacante objetivo',  link:'/cv-vs-job',      Icon:MagnifyingGlass,    nota:'CV personalizado para una vacante de alto interés, con match > 70%.'        },
  { id:'entrevista',  label:'Práctica de entrevista realizada',    link:'/entrevista',     Icon:Robot,              nota:'Al menos una simulación de entrevista completa con feedback de ELVIA.'       },
  { id:'carta',       label:'Carta de presentación lista',         link:null,              Icon:Notepad,            nota:'Carta personalizada para tu vacante objetivo. Redáctala con ayuda de ELVIA.' },
  { id:'referencias', label:'Referencias profesionales confirmadas',link:null,             Icon:CheckCircle,        nota:'Al menos 2 referencias avisadas y listas para ser contactadas.'             },
]

// ─── Cálculo de progreso ─────────────────────────────────────────────────────
// calcPerfilPts y calcularProgreso importados desde utils/progresoLaboral.js
const calcularProgreso = calcProgreso

function calcularPorPilar(data, perfil) {
  const perfilPts = calcPerfilPts(perfil, data)

  const auto = (data&&data.autoconocimiento) ? data.autoconocimiento : {}
  const perf = (data&&data.perfil) ? data.perfil : {}
  let autoPts = 0

  // 1. Hard Skills - 5 pts
  if (Array.isArray(auto.hard_skills) && auto.hard_skills.length >= 2) autoPts += 5

  // 2. Soft Skills - 5 pts
  if (Array.isArray(auto.soft_skills) && auto.soft_skills.length >= 2) autoPts += 5

  // 3. Power Skills - 5 pts
  if (Array.isArray(auto.power_skills) && auto.power_skills.length >= 2) autoPts += 5

  // 4. Compañías - 5 pts
  if (Array.isArray(auto.top5empresas) && auto.top5empresas.filter(function(e){return e && String(e).trim()}).length >= 1) autoPts += 5


  const checks = (data&&data.documentos&&data.checks) ? data.documentos.checks : {}
  const docsDone = DOCS_LIST.filter(function(d){return checks[d.id]}).length

  const bloques = (data&&data.semana&&data.semana.bloques) ? data.semana.bloques : {}
  const bN = Object.values(bloques).filter(Boolean).length
  let semanaPts = 0
  if (bN>=3) semanaPts=20; else if (bN>=1) semanaPts=10;

  const rawRec2 = data&&data.recursos ? (Array.isArray(data.recursos) ? data.recursos : (data.recursos.recursos||null)) : null
  const rec = (rawRec2&&rawRec2.length>0) ? rawRec2 : RECURSOS_DEFAULT
  const nRecActivos = rec.filter(function(r){return r.tengo===true}).length
  let recPts = (nRecActivos >= 2) ? 20 : (nRecActivos * 10)

  // Oferta: 5 ítems × 4 pts = 20 · mismo umbral que progresoLaboral.js
  const oferta = (data&&data.oferta) ? data.oferta : {}
  let ofertaPts = 0
  if (String(oferta.oferta_valor||'').trim().length>=20) ofertaPts+=4
  const IKIGAI_KEYS_PP = ['ikigai_amas','ikigai_bueno','ikigai_necesita','ikigai_pagar']
  IKIGAI_KEYS_PP.forEach(function(k){ if (String(oferta[k]||'').trim().length>=50) ofertaPts+=4 })

  return {
    perfil:           Math.round((perfilPts/20)*100),
    autoconocimiento: Math.round((Math.min(autoPts,20)/20)*100),
    documentos:       Math.round((docsDone/DOCS_LIST.length)*100),
    semana:           Math.round((semanaPts/20)*100),
    recursos:         Math.round((recPts/20)*100),
    oferta:           Math.round((Math.min(ofertaPts,20)/20)*100),
  }
}

const sanitizarTexto = (txt) => {
  if (!txt) return ''
  return txt.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
}

// ─── Pilar 0: Mi Perfil Profesional ──────────────────────────────────────────

function PilarMiPerfil({ perfil, extraData, onChange, onSavePerfil, saving, isPaidPlan, data, userId, pct }) {
  const d = extraData || {}
  const up = (key, val) => onChange({ ...d, [key]: val })
  const [subTab, setSubTab] = useState('datos')
  const isComplete = (pct || 0) >= 100
  const [citySearch, setCitySearch] = useState('')
  const [showCitySugg, setShowCitySugg] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvDatos, setCvDatos] = useState(null)
  const [cvFileName, setCvFileName] = useState('')
  const [cvErr, setCvErr] = useState('')
  const [cvMismatch, setCvMismatch] = useState(false)  // alerta si CV no coincide con registro
  const [cvForceApply, setCvForceApply] = useState(false) // usuario confirma que es su CV a pesar de discrepancia
  const lpLoaded = useRef(false)   // evita auto-save en la carga inicial
  const autoSaveTimer = useRef(null)
  const [originalCvId, setOriginalCvId] = useState(null)
  const [descargandoOriginal, setDescargandoOriginal] = useState(null)
  const [justSaved, setJustSaved] = useState(false) // Feedback visual para botones

  // 1. Buscar ID de CV original para descarga
  useEffect(() => {
    if (!userId || !perfil?.cv_path) return
    const getCvId = async () => {
      const { data } = await supabase.from('cv_results').select('id').eq('user_id', userId).eq('tipo', 'original').order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (data) setOriginalCvId(data.id)
    }
    getCvId()
  }, [userId, perfil])

  const handleDescargarOriginal = async (formato) => {
    let cvId = originalCvId
    
    // Fallback: si no tenemos el ID (posiblemente recién generado), intentamos buscarlo
    if (!cvId) {
      const { data } = await supabase
        .from('cv_results')
        .select('id')
        .eq('user_id', userId)
        .eq('tipo', 'original')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (data) {
        cvId = data.id
        setOriginalCvId(data.id)
      }
    }

    if (!cvId) {
      toast.error('No se encontró el ID del CV original para descargar. Intenta recargar la página.')
      return
    }

    setDescargandoOriginal(formato)
    try {
      await descargarCV(cvId, formato)
    } catch (err) {
      toast.error('Error al descargar el CV')
    } finally {
      setDescargandoOriginal(null)
    }
  }
  // Refs para flush en unmount
  const [lp, setLP] = useState({
    nombre1:'',nombre2:'',apellido1:'',apellido2:'',
    pais:'',ciudad:'',edad:'',indicativo1:'+52',telefono1:'',
    email_secundario:'',
    pais_prestaciones:'',salario_monto:'',moneda:'',
    prestaciones:[],prestaciones_detalle:{},
    bono_activo:false,bono_tipo:'',bono_esquema:'',
    bono_frecuencia:'',bono_pct:'',bono_num_salarios:'',
    bono_monto:'',variable_monto:'',prestaciones_otros:'',
    idiomas: [],
  })
  const lpRef          = useRef(lp)
  const onSavePerfilRef = useRef(onSavePerfil)
  useEffect(() => { lpRef.current = lp },                [lp])
  useEffect(() => { onSavePerfilRef.current = onSavePerfil }, [onSavePerfil])

  // Carga inicial desde perfil — prefiere sessionStorage para carga instantánea al cambiar pilar
  useEffect(() => {
    if (!perfil) return
    const CACHE_KEY = userId ? `perfil_lp_${userId}` : null

    // Intentar restaurar desde caché (evita ver datos viejos al cambiar de pilar y volver)
    if (CACHE_KEY) {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          lpLoaded.current = false
          setLP(JSON.parse(cached))
          setTimeout(() => { lpLoaded.current = true }, 100)
          return
        } catch { /* ignorar */ }
      }
    }

    lpLoaded.current = false
    setLP({
      nombre1:perfil.nombre1||'',nombre2:perfil.nombre2||'',
      apellido1:perfil.apellido1||'',apellido2:perfil.apellido2||'',
      pais:perfil.pais||'',ciudad:perfil.ciudad||'',edad:perfil.edad||'',
      indicativo1:perfil.indicativo1||'+52',telefono1:perfil.telefono1||'',
      email_secundario:perfil.email_secundario||'',
      salario_monto:(perfil.salario_esperado||'').split(' ')[0]||'',
      moneda:(perfil.salario_esperado||'').split(' ')[1]||detectarMoneda(perfil.pais)||'',
      pais_prestaciones:perfil.pais_prestaciones||perfil.pais||'',
      prestaciones:perfil.prestaciones||[],
      prestaciones_detalle:perfil.prestaciones_detalle||{},
      bono_activo:perfil.bono_activo||false,
      bono_tipo:perfil.bono_tipo||'',bono_esquema:perfil.bono_esquema||'',
      bono_frecuencia:perfil.bono_frecuencia||'',bono_pct:perfil.bono_pct||'',
      bono_num_salarios:perfil.bono_num_salarios||'',
      bono_monto:perfil.bono_monto||'',variable_monto:perfil.variable_monto||'',
      prestaciones_otros:perfil.prestaciones_otros||'',
    })
    setTimeout(() => { lpLoaded.current = true }, 100)
  },[perfil, userId])

  const onSavePerfilLocal = async (p) => {
    await onSavePerfil(p)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
    if (subTab === 'asp') {
      window.alert('Se guardó tu información. ¡Esta sección está al 100%! Si quieres volver después a modificar, puedes entrar de nuevo.')
    }
  }

  // Auto-save con debounce de 1.5s — solo después de que el usuario haya editado
  useEffect(() => {
    if (!lpLoaded.current) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => { onSavePerfil(lp) }, 1500)
    // No cancelar el timer en el cleanup del debounce — solo al montar/desmontar
  }, [lp]) // eslint-disable-line react-hooks/exhaustive-deps

  // Flush inmediato al desmontar — guarda en sessionStorage (síncrono) + Supabase (async)
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
        if (lpLoaded.current) {
          // Guardar en sessionStorage de forma síncrona para carga instantánea al volver
          if (userId) sessionStorage.setItem(`perfil_lp_${userId}`, JSON.stringify(lpRef.current))
          onSavePerfilRef.current(lpRef.current)
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const togglePrest=(p)=>setLP(f=>({...f,prestaciones:f.prestaciones.includes(p)?f.prestaciones.filter(x=>x!==p):[...f.prestaciones,p]}))
  const toggleIdioma=(id)=>{const arr=Array.isArray(d.idiomas)?d.idiomas:[];const ex=arr.find(i=>i.idioma===id);up('idiomas',ex?arr.filter(i=>i.idioma!==id):[...arr,{idioma:id,nivel:'B2'}])}
  const updNivelIdioma=(id,nivel)=>up('idiomas',(Array.isArray(d.idiomas)?d.idiomas:[]).map(i=>i.idioma===id?{...i,nivel}:i))
  const toggleArea=(a)=>{const arr=Array.isArray(d.areas)?d.areas:[];up('areas',arr.includes(a)?arr.filter(x=>x!==a):[...arr,a])}
  const toggleInd=(ind)=>{const arr=Array.isArray(d.industrias_deseadas)?d.industrias_deseadas:[];up('industrias_deseadas',arr.includes(ind)?arr.filter(x=>x!==ind):[...arr,ind])}
  const toggleNC=(n)=>{const arr=Array.isArray(d.niveles_cargo)?d.niveles_cargo:[];up('niveles_cargo',arr.includes(n)?arr.filter(x=>x!==n):[...arr,n])}
  const TABS=[{id:'datos',label:'Datos Personales'},{id:'comp',label:'Compensación'},{id:'asp',label:'Aspiraciones'}]
  const iBtn=(sel,txt,fn)=><button key={txt} onClick={fn} className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${sel?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{txt}</button>

  // Normalizar string para comparación (lowercase, sin espacios/acentos)
  const normalizeName = (s) => {
    if (!s || typeof s !== 'string') return ''
    return s.toLowerCase().trim().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setCvUploading(true)
    setCvErr('')
    setCvDatos(null)
    setCvFileName(file.name)
    setCvMismatch(false)
    setCvForceApply(false)
    try {
      const datos = await extractarPerfilCV(file)
      if (datos?.error) throw new Error(datos.error)

      // Validar que el nombre/apellido del CV coincida con el registro del usuario
      const cvNombre = normalizeName(datos.nombre1)
      const cvApellido = normalizeName(datos.apellido1)
      const regNombre = normalizeName(perfil?.nombre1)
      const regApellido = normalizeName(perfil?.apellido1)

      // Si el usuario tiene nombre registrado, verificar que coincida
      if (regNombre && regNombre !== cvNombre) {
        setCvMismatch(true)
      } else if (regApellido && regApellido !== cvApellido) {
        setCvMismatch(true)
      }

      setCvDatos(datos)
    } catch (err) {
      setCvFileName('')
      const msg = err?.message || ''
      if (msg.includes('401') || msg.includes('403')) {
        setCvErr('Sesión expirada. Recarga la página e intenta de nuevo.')
      } else if (msg.includes('413')) {
        setCvErr('El archivo es muy grande. Máximo 5MB.')
      } else if (msg.includes('Formato')) {
        setCvErr('Formato no soportado. Sube un PDF o Word (.docx).')
      } else {
        setCvErr('No pudimos procesar el CV. Intenta de nuevo.')
      }
    } finally {
      setCvUploading(false)
    }
  }

  const aplicarDatosCV = () => {
    if (!cvDatos) return
    setLP(f => ({
      ...f,
      nombre1:    cvDatos.nombre1    || f.nombre1,
      nombre2:    cvDatos.nombre2    || f.nombre2,
      apellido1:  cvDatos.apellido1  || f.apellido1,
      apellido2:  cvDatos.apellido2  || f.apellido2,
      ciudad:     cvDatos.ciudad     || f.ciudad,
      pais:       cvDatos.pais       || f.pais,
      edad:       cvDatos.edad       ? String(cvDatos.edad) : f.edad,
      telefono1:  cvDatos.telefono1  || f.telefono1,
      indicativo1: cvDatos.pais ? indicativoPorPais(cvDatos.pais) : f.indicativo1,
      moneda:     cvDatos.pais ? detectarMoneda(cvDatos.pais) : f.moneda,
    }))
    if (Array.isArray(cvDatos.idiomas) && cvDatos.idiomas.length > 0) {
      up('idiomas', cvDatos.idiomas)
    }
    if (Array.isArray(cvDatos.educacion) && cvDatos.educacion.length > 0) {
      up('educacion_lista', cvDatos.educacion)
    }
    setCvDatos(null)
    setCvFileName('')
  }

  return (
    <div className="space-y-6">
      {/* ── Upload CV para pre-llenar ── */}
      <div className={`p-4 rounded-2xl border-2 border-dashed transition-colors ${cvDatos ? 'bg-green-50 border-green-300' : 'bg-indigo-50 border-indigo-200'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700">¿Tienes un CV? Súbelo y llenamos el formulario por ti</p>
            <p className="text-xs text-slate-400 mt-0.5">{cvFileName || 'PDF o Word · Máx. 5MB'}</p>
          </div>
          <label className={`cursor-pointer flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 ${cvUploading?'bg-slate-400':'bg-indigo-600 hover:bg-indigo-700'}`}>
            {cvUploading ? <SpinnerGap size={14} className="animate-spin"/> : <UploadSimple size={14} weight="bold"/>}
            {cvUploading ? 'Analizando...' : cvFileName ? 'Cambiar' : 'Subir CV'}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVUpload} disabled={cvUploading}/>
          </label>
        </div>
        {cvDatos && (
          <>
            {cvMismatch ? (
              <div className="mt-3 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0 mt-0.5"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-700 mb-1">El CV no corresponde al usuario registrado</p>
                  <p className="text-sm text-red-600 leading-snug">
                    Los nombres y apellidos con los que te registraste deben estar en la CV, valida que el documento esta correctamente escrito.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckFat size={16} weight="fill" className="text-green-500 shrink-0"/>
                  <p className="text-xs text-slate-700">
                    <span className="font-bold">{[cvDatos.nombre1, cvDatos.apellido1].filter(Boolean).join(' ')}</span>
                    {cvDatos.pais && <span className="text-slate-400"> · {cvDatos.pais}</span>}
                    {cvDatos.idiomas?.length > 0 && <span className="text-slate-400"> · {cvDatos.idiomas.length} idioma(s)</span>}
                    {cvDatos.educacion?.length > 0 && <span className="text-slate-400"> · {cvDatos.educacion.length} estudio(s)</span>}
                  </p>
                </div>
                <button onClick={aplicarDatosCV} className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg font-bold shrink-0 cursor-pointer transition-colors">
                  Aplicar →
                </button>
              </div>
            )}
          </>
        )}
        {cvErr && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
            <WarningCircle size={13}/> {cvErr}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
            <span className="font-bold">⚠️ Aviso importante:</span> Si usas la información de otra persona sin autorización expresa, se incumplen los términos y condiciones de ELVIA así como la privacidad de la información. Solo debes subir CVs propios o autorizados.
          </p>
        </div>

        {/* Botón "Crear desde cero" */}
        <Link to="/cv-desde-cero" className="mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-indigo-300 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-colors">
          <PlusMinus size={16}/> Crear CV desde cero
        </Link>

        {/* Detección de borrador guardado (solo usuarios pago) */}
        {isPaidPlan && data?.cv_borrador && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-amber-800 font-semibold">Tienes un CV en progreso</p>
            <Link to="/cv-desde-cero" className="text-sm text-amber-600 hover:text-amber-700 font-bold">Continuar →</Link>
          </div>
        )}

        {/* Estado de CV Generado */}
        {perfil?.cv_path && (
          <div className={`mt-4 p-4 rounded-2xl border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {isComplete ? <CheckCircle size={14} weight="bold" /> : <Lock size={12} weight="bold" />}
                  </div>
                  <p className="text-sm font-black text-slate-800">Tu CV Inicial Generado</p>
                </div>
                {!isComplete && (
                  <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-tight bg-amber-50 px-2 py-0.5 rounded border border-amber-100 w-fit">
                    Bloqueado hasta completar el 100%
                  </p>
                )}
                <p className="text-xs text-slate-600 font-medium truncate mb-2">
                  {perfil.cv_filename || 'cv_original.txt'}
                </p>
                <div className="flex items-center gap-1.5">
                  {isComplete ? (
                    <Link to="/mis-cvs" className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors">
                      <Folders size={14} weight="bold" /> Ver en MIS CVs
                    </Link>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 cursor-not-allowed">
                      <Folders size={14} weight="bold" /> Ver en MIS CVs
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button 
                  onClick={() => isComplete && handleDescargarOriginal('pdf')}
                  disabled={!isComplete || descargandoOriginal === 'pdf'}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 border text-[11px] font-black rounded-lg transition-all ${isComplete ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  {descargandoOriginal === 'pdf' ? <SpinnerGap size={12} className="animate-spin" /> : '↓ PDF'}
                </button>
                <button 
                  onClick={() => isComplete && handleDescargarOriginal('word')}
                  disabled={!isComplete || descargandoOriginal === 'word'}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 border text-[11px] font-black rounded-lg transition-all ${isComplete ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  {descargandoOriginal === 'word' ? <SpinnerGap size={12} className="animate-spin" /> : '↓ Word'}
                </button>
              </div>
            </div>
            {!isComplete && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                  Podrás ver esta CV en tu sección de MIS CVs cuando termines todo el proceso.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Banner: Importancia de CV (si no hay CV cargada ni borrador) */}
        {!perfil?.cv_path && !data?.cv_borrador && (
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-sm text-slate-700 font-semibold">⚠️ Sin CV inicial no llegarás al 100% de esta sección y no podrás usar todas las funcionalidades del Gerente de Proyecto.</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setSubTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer -mb-px ${subTab===t.id?'border-indigo-600 text-indigo-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {subTab==='datos'&&(
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'nombre1',   label: 'Primer nombre *',   isReadOnly: true },
              { k: 'nombre2',   label: 'Segundo nombre',     isReadOnly: false },
              { k: 'apellido1', label: 'Primer apellido *', isReadOnly: true },
              { k: 'apellido2', label: 'Segundo apellido',   isReadOnly: false }
            ].map(({ k, label, isReadOnly }) => (
              <div key={k}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">{label}</label>
                {isReadOnly ? (
                  <input 
                    value={perfil?.[k] || ''} 
                    readOnly 
                    title="Este campo no se puede modificar"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                ) : (
                  <input 
                    value={lp[k] || ''} 
                    onChange={e => setLP(f => ({ ...f, [k]: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">País *</label>
              <select value={lp.pais} onChange={e=>{const p=e.target.value;setLP(f=>({...f,pais:p,indicativo1:indicativoPorPais(p),moneda:detectarMoneda(p),pais_prestaciones:(!f.pais_prestaciones||f.pais_prestaciones===f.pais)?p:f.pais_prestaciones}))}}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40">
                <option value="">Selecciona</option>{PAISES_LATAM.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Ciudad actual</label>
              <input value={lp.ciudad||''} onChange={e=>setLP(f=>({...f,ciudad:e.target.value}))} placeholder="Tu ciudad"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Teléfono principal</label>
              <div className="flex gap-1.5">
                <select value={lp.indicativo1} onChange={e=>setLP(f=>({...f,indicativo1:e.target.value}))}
                  className="border border-slate-300 rounded-xl px-2 py-2.5 text-xs focus:outline-none w-24 shrink-0">
                  {INDICATIVOS.map(i=><option key={i.code} value={i.ind}>{i.code} {i.ind}</option>)}</select>
                <input type="tel" value={lp.telefono1||''} onChange={e=>setLP(f=>({...f,telefono1:e.target.value}))} placeholder="55 1234 5678"
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/></div></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Edad</label>
              <input type="number" value={lp.edad||''} onChange={e=>setLP(f=>({...f,edad:e.target.value}))} placeholder="Ej: 32" min={18} max={70}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/></div>
          </div>
          <button onClick={()=>onSavePerfil(lp)} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-60">
            {saving?<SpinnerGap size={16} className="animate-spin"/>:<CheckCircle size={16} weight="fill"/>} Guardar datos personales</button>
        </div>
      )}
      {subTab==='comp'&&(
        <div className="space-y-6">
          {/* País para prestaciones */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">País (para prestaciones)</label>
            <select value={lp.pais_prestaciones||''} onChange={e=>{
              const p=e.target.value
              setLP(f=>({...f,pais_prestaciones:p,moneda:detectarMoneda(p)||f.moneda,prestaciones:[],prestaciones_detalle:{}}))
            }} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40">
              <option value="">Selecciona</option>
              {PAISES_LATAM.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Salario */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Salario bruto mensual</label>
            <div className="flex gap-2">
              <select value={lp.moneda||''} onChange={e=>setLP(f=>({...f,moneda:e.target.value}))}
                className="border border-slate-300 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shrink-0">
                <option value="">Moneda</option>
                {MONEDAS_LIST.map(m=><option key={m.code} value={m.code}>{m.code}</option>)}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none">
                  {MONEDAS_LIST.find(m=>m.code===lp.moneda)?.symbol||'$'}
                </span>
                <input type="text" value={lp.salario_monto||''}
                  onChange={e=>setLP(f=>({...f,salario_monto:soloNumericos(e.target.value,f.moneda)}))}
                  onBlur={()=>setLP(f=>({...f,salario_monto:formatearMonto(f.salario_monto,f.moneda)}))}
                  placeholder={MONEDAS_US.includes(lp.moneda)?'50,000':'50.000'}
                  className="w-full border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>
              </div>
            </div>
          </div>

          {/* Prestaciones */}
          {lp.pais_prestaciones&&(
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Prestaciones{lp.pais_prestaciones?` — ${lp.pais_prestaciones}`:''}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {getPrestaciones(lp.pais_prestaciones).map(p=>{
                  const detailCfg=lp.pais_prestaciones==='México'?MEXICO_DETALLE[p]:null
                  const isChecked=lp.prestaciones.includes(p)
                  const updateDetalle=(key,val)=>setLP(f=>({...f,prestaciones_detalle:{...f.prestaciones_detalle,[key]:val}}))
                  return(
                    <div key={p}>
                      <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${isChecked?'bg-indigo-50 border-indigo-300 text-indigo-800 font-medium':'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                        <input type="checkbox" checked={isChecked} onChange={()=>setLP(f=>({...f,prestaciones:f.prestaciones.includes(p)?f.prestaciones.filter(x=>x!==p):[...f.prestaciones,p]}))}
                          className="accent-indigo-600 shrink-0"/>
                        {p}
                      </label>
                      {isChecked&&detailCfg&&(
                        <div className="mt-1 px-1">
                          {detailCfg.tipo==='selector'?(
                            <select value={lp.prestaciones_detalle[p]??detailCfg.default} onChange={e=>updateDetalle(p,e.target.value)}
                              className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                              {detailCfg.opciones.map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                          ):(
                            <div className="flex items-center gap-1">
                              <input type="text" inputMode="decimal"
                                value={lp.prestaciones_detalle[p]??detailCfg.default}
                                onChange={e=>{
                                  const val=detailCfg.tipo==='monto'?soloNumericos(e.target.value,lp.moneda):e.target.value.replace(/[^0-9.]/g,'')
                                  updateDetalle(p,val)
                                }}
                                onBlur={()=>{
                                  if(detailCfg.tipo==='monto'){
                                    const val=lp.prestaciones_detalle[p]??''
                                    updateDetalle(p,formatearMonto(String(val),lp.moneda))
                                  }
                                }}
                                placeholder={detailCfg.tipo==='monto'?(MONEDAS_US.includes(lp.moneda)?'10,000':'10.000'):detailCfg.label}
                                className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                              {detailCfg.tipo==='pct'&&<span className="text-xs text-slate-400 shrink-0">%</span>}
                              {detailCfg.tipo==='dias'&&<span className="text-xs text-slate-400 shrink-0">días</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Variable o Bono */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Variable o Bono</label>
              <button onClick={()=>setLP(f=>({...f,bono_activo:!f.bono_activo,bono_tipo:'',bono_esquema:'',bono_pct:'',bono_num_salarios:'',bono_monto:'',variable_monto:''}))}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${lp.bono_activo?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>
                {lp.bono_activo?'✓ Aplica':'+ Agregar'}
              </button>
            </div>
            {lp.bono_activo&&(()=>{
              const salarioNum=parseMonto(lp.salario_monto,lp.moneda)
              const mult={'Mensual':1,'Trimestral':3,'Semestral':6,'Anual':12}[lp.bono_frecuencia]||1
              const bonoCalc=lp.bono_esquema==='%'&&lp.bono_pct&&lp.bono_frecuencia
                ?salarioNum*mult*(parseFloat(lp.bono_pct)/100)
                :lp.bono_esquema==='Número de salarios'&&lp.bono_num_salarios
                ?parseFloat(lp.bono_num_salarios)*salarioNum:null
              const bonoFmt=bonoCalc!==null?formatearMonto(String(Math.round(bonoCalc)),lp.moneda):null
              return(
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex gap-2">
                    {['Bono','Variable mensual'].map(t=>(
                      <button key={t} onClick={()=>setLP(f=>({...f,bono_tipo:t,bono_esquema:'',bono_pct:'',bono_num_salarios:'',bono_monto:''}))}
                        className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors cursor-pointer ${lp.bono_tipo===t?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {lp.bono_tipo==='Bono'&&(
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Frecuencia</label>
                          <select value={lp.bono_frecuencia} onChange={e=>setLP(f=>({...f,bono_frecuencia:e.target.value}))}
                            className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                            <option value="">Selecciona</option>
                            {['Mensual','Trimestral','Semestral','Anual'].map(f=><option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Esquema</label>
                          <select value={lp.bono_esquema} onChange={e=>setLP(f=>({...f,bono_esquema:e.target.value,bono_pct:'',bono_num_salarios:'',bono_monto:''}))}
                            className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                            <option value="">Selecciona</option>
                            <option value="%">% del salario anual</option>
                            <option value="Número de salarios">Número de salarios</option>
                            <option value="Valor">Valor fijo</option>
                          </select>
                        </div>
                      </div>
                      {lp.bono_esquema==='%'&&(
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Porcentaje %</label>
                            <input type="text" value={lp.bono_pct} onChange={e=>setLP(f=>({...f,bono_pct:e.target.value.replace(/[^0-9.]/g,'')}))} placeholder="10"
                              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Bono estimado ({lp.moneda})</label>
                            <input type="text" readOnly value={bonoFmt||''} placeholder="Se calcula automáticamente"
                              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-slate-100 text-slate-500 focus:outline-none"/>
                          </div>
                        </div>
                      )}
                      {lp.bono_esquema==='Número de salarios'&&(
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Número de salarios</label>
                            <input type="text" value={lp.bono_num_salarios} onChange={e=>setLP(f=>({...f,bono_num_salarios:e.target.value.replace(/[^0-9.]/g,'')}))} placeholder="3"
                              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Bono estimado ({lp.moneda})</label>
                            <input type="text" readOnly value={bonoFmt||''} placeholder="Se calcula automáticamente"
                              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-slate-100 text-slate-500 focus:outline-none"/>
                          </div>
                        </div>
                      )}
                      {lp.bono_esquema==='Valor'&&(
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Monto del bono ({lp.moneda})</label>
                          <input type="text" value={lp.bono_monto}
                            onChange={e=>setLP(f=>({...f,bono_monto:soloNumericos(e.target.value,f.moneda)}))}
                            onBlur={()=>setLP(f=>({...f,bono_monto:formatearMonto(f.bono_monto,f.moneda)}))}
                            placeholder={MONEDAS_US.includes(lp.moneda)?'50,000':'50.000'}
                            className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                        </div>
                      )}
                    </div>
                  )}
                  {lp.bono_tipo==='Variable mensual'&&(
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Monto mensual ({lp.moneda})</label>
                      <input type="text" value={lp.variable_monto}
                        onChange={e=>setLP(f=>({...f,variable_monto:soloNumericos(e.target.value,f.moneda)}))}
                        onBlur={()=>setLP(f=>({...f,variable_monto:formatearMonto(f.variable_monto,f.moneda)}))}
                        placeholder={MONEDAS_US.includes(lp.moneda)?'10,000':'10.000'}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Otros beneficios */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">
              Otros beneficios <span className="text-slate-400 font-normal">(campo libre)</span>
            </label>
            <textarea value={lp.prestaciones_otros||''} onChange={e=>setLP(f=>({...f,prestaciones_otros:e.target.value}))}
              placeholder="Ej. Seguro dental, días adicionales de vacaciones, plan de carrera, acciones de la empresa..."
              rows={2} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 resize-none"/>
          </div>

          <button onClick={()=>onSavePerfilLocal(lp)} disabled={saving}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer disabled:opacity-60 ${justSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {saving ? <SpinnerGap size={16} className="animate-spin"/> : (justSaved ? <CheckCircle size={16} weight="fill"/> : <CheckCircle size={16} weight="fill"/>)} 
            {justSaved ? 'Guardado' : 'Guardar compensación'}
          </button>
        </div>
      )}
      {subTab==='asp'&&(
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cargo objetivo</h3>
            <p className="text-xs text-slate-400 mb-2">¿Qué puesto estás buscando? (ej. Gerente de Marketing, Analista de Datos, CFO)</p>
            <input value={d.cargo_objetivo||''} onChange={e=>up('cargo_objetivo',e.target.value)}
              placeholder="Ej. Gerente de Operaciones, Analista Senior, Director Comercial..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>
            {d.cargo_objetivo&&(()=>{
              const c=d.cargo_objetivo.toLowerCase()
              const s=/c-?level|ceo|cfo|coo|cto|cpo|chief|vp\b|vice|vicepresidente/.test(c)?{label:'C-Level / VP',color:'bg-purple-100 text-purple-700'}
                :/gerente|director|head of|l[ií]der\b|lead\b/.test(c)?{label:'Senior (Gerente/Director)',color:'bg-blue-100 text-blue-700'}
                :/jefe|coordinador|supervisor|especialista\b/.test(c)?{label:'Mid-Senior (Jefe/Coordinador)',color:'bg-indigo-100 text-indigo-700'}
                :/analista|asistente|auxiliar|jr\b|junior/.test(c)?{label:'Junior (Analista/Asistente)',color:'bg-emerald-100 text-emerald-700'}
                :null
              return s?<span className={`inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>Seniority detectado: {s.label}</span>:null
            })()}
          </div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Nivel de cargo objetivo</h3>
            <div className="flex flex-wrap gap-2">{NIVELES_CARGO.map(n=>{const sel=Array.isArray(d.niveles_cargo)&&d.niveles_cargo.includes(n);return iBtn(sel,n,()=>toggleNC(n))})}</div></div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Área funcional objetivo</h3>
            <div className="flex flex-wrap gap-2">{AREAS_FUNC.map(a=>{const sel=Array.isArray(d.areas)&&d.areas.includes(a);return iBtn(sel,a,()=>toggleArea(a))})}</div>
            {Array.isArray(d.areas)&&d.areas.includes('Otro')&&(
              <input value={d.area_otro||''} onChange={e=>up('area_otro',e.target.value)} placeholder="Especifica el área..."
                className="mt-3 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>)}</div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Industrias de interés</h3>
            <div className="flex flex-wrap gap-2">{[...INDUSTRIAS_LATAM,'Otro'].map(ind=>{const sel=Array.isArray(d.industrias_deseadas)&&d.industrias_deseadas.includes(ind);return(
              <button key={ind} onClick={()=>toggleInd(ind)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${sel?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{ind}</button>
            )})}</div>
            {Array.isArray(d.industrias_deseadas)&&d.industrias_deseadas.includes('Otro')&&(
              <div className="mt-3 flex gap-2">
                <input value={d.industria_otro||''} onChange={e=>up('industria_otro',e.target.value)} placeholder="Especifica la industria..."
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>
                <button onClick={()=>{const val=(d.industria_otro||'').trim();if(val){const arr=Array.isArray(d.industrias_deseadas)?d.industrias_deseadas:[]; onChange({ ...d, industrias_deseadas: [...arr.filter(x=>x!=='Otro'), val], industria_otro: '' })}}}
                  disabled={!d.industria_otro||!d.industria_otro.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">+</button>
              </div>
            )}</div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tipo de trabajo</h3>
            <div className="flex flex-wrap gap-2">{TIPOS_TRABAJO.map(t=>(
              <button key={t} onClick={()=>up('tipo_trabajo',t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${d.tipo_trabajo===t?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{t}</button>
            ))}</div></div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Ciudades / Países de búsqueda</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-slate-600">¿Dispuesto a buscar en otras ciudades?</span>
              {['Sí','No'].map(op=>(
                <button key={op} onClick={()=>up('busca_otras_ciudades',op==='Sí')}
                  className={`px-4 py-1.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${d.busca_otras_ciudades===(op==='Sí')?'bg-slate-800 text-white border-slate-800':'border-slate-300 text-slate-600 hover:border-slate-500'}`}>{op}</button>
              ))}
            </div>
            {d.busca_otras_ciudades&&(<div>
              <p className="text-xs text-slate-500 mb-3">Ciudades y países de preferencia:</p>
              {/* Campo de búsqueda con autocompletado */}
              <div className="relative mb-3">
                <input
                  value={citySearch}
                  onChange={e=>{setCitySearch(e.target.value);setShowCitySugg(e.target.value.length>0)}}
                  onKeyDown={e=>{if(e.key==='Enter'&&citySearch.trim()){const arr=Array.isArray(d.ciudades_preferidas)?d.ciudades_preferidas:[];if(!arr.includes(citySearch.trim())){ onChange({ ...d, ciudades_preferidas: [...arr, citySearch.trim()] }) };setCitySearch('');setShowCitySugg(false)}}}
                  onBlur={()=>setTimeout(()=>setShowCitySugg(false),150)}
                  placeholder="Buscar ciudad o país..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>
                {showCitySugg&&(
                  <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {[...PAISES_LATAM,...CIUDADES_SUGERIDAS].filter((c,i,a)=>a.indexOf(c)===i).filter(c=>c.toLowerCase().includes(citySearch.toLowerCase())).slice(0,8).map(c=>{
                      const arr=Array.isArray(d.ciudades_preferidas)?d.ciudades_preferidas:[]
                      if(arr.includes(c))return null
                      return(<button key={c} onMouseDown={()=>{ onChange({ ...d, ciudades_preferidas: [...arr, c] });setCitySearch('');setShowCitySugg(false)}} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">{c}</button>)
                    })}
                  </div>
                )}
              </div>
              {/* Tags seleccionados */}
              {Array.isArray(d.ciudades_preferidas)&&d.ciudades_preferidas.length>0&&(
                <div className="flex flex-wrap gap-2 mb-3">
                  {d.ciudades_preferidas.map(c=>(
                    <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-700 text-white border border-slate-700">
                      {c}
                      <button onClick={()=>up('ciudades_preferidas',d.ciudades_preferidas.filter(x=>x!==c))} className="hover:text-red-300 cursor-pointer leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
              {/* Sugerencias rápidas en grid para ver todas sin scroll */}
              <p className="text-xs text-slate-400 mb-2">Sugerencias rápidas:</p>
              <div className="grid grid-cols-3 gap-1.5">{CIUDADES_SUGERIDAS.map(c=>{const arr=Array.isArray(d.ciudades_preferidas)?d.ciudades_preferidas:[];const sel=arr.includes(c);return(
                <button key={c} onClick={()=>{if(sel)up('ciudades_preferidas',arr.filter(x=>x!==c));else up('ciudades_preferidas',[...arr,c])}}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer text-center ${sel?'bg-slate-700 text-white border-slate-700':'border-slate-300 text-slate-600 hover:border-slate-500'}`}>{c}</button>
              )})}</div>
            </div>)}</div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Nivel educativo</h3>
            <div className="flex flex-wrap gap-3">{NIVELES_EDUCACION.map(n=>(
              <button key={n} onClick={()=>up('nivel_educativo',n)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-colors cursor-pointer ${d.nivel_educativo===n?'bg-indigo-600 text-white border-indigo-600 shadow-md':'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{n}</button>
            ))}</div></div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Años de experiencia profesional</h3>
            <div className="flex flex-wrap gap-2">{ANIOS_EXP.map(a=>(
              <button key={a} onClick={()=>up('anios_experiencia',a)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${d.anios_experiencia===a?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{a}</button>
            ))}</div></div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Idiomas</h3>
            <div className="flex flex-wrap gap-2 mb-3">{IDIOMAS_LIST.map(id=>{const sel=Array.isArray(d.idiomas)&&d.idiomas.find(i=>i.idioma===id);return(
              <button key={id} onClick={()=>toggleIdioma(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${sel?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{id}</button>
            )})}</div>
            {Array.isArray(d.idiomas)&&d.idiomas.length>0&&(
              <div className="space-y-2">{d.idiomas.map(i=>(
                <div key={i.idioma} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <span className="text-sm font-semibold text-indigo-700 flex-1">{i.idioma}</span>
                  <select value={i.nivel} onChange={e=>updNivelIdioma(i.idioma,e.target.value)}
                    className="border border-indigo-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                    {NIVELES_CEFR.map(n=><option key={n} value={n}>{n}</option>)}</select>
                </div>
              ))}</div>)}
          </div>
          <button onClick={()=>onSavePerfilLocal(lp)} disabled={saving}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer disabled:opacity-60 ${justSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {saving ? <SpinnerGap size={16} className="animate-spin"/> : (justSaved ? <CheckCircle size={16} weight="fill"/> : <CheckCircle size={16} weight="fill"/>)} 
            {justSaved ? 'Guardado' : 'Guardar aspiraciones'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Feature Preview Grid (cuando onboarding está pendiente) ─────────────────

const FEATURES_PREVIEW=[
  {label:'CV Optimizer',desc:'Analiza y mejora tu CV con IA',Icon:FileMagnifyingGlass,color:'violet'},
  {label:'LinkedIn Optimo',desc:'Optimiza tu perfil para reclutadores',Icon:LinkedinLogo,color:'blue',beta:true},
  {label:'CV vs Vacante',desc:'Compara tu CV con cualquier vacante',Icon:MagnifyingGlass,color:'teal'},
  {label:'Vacantes',desc:'Encuentra oportunidades personalizadas',Icon:Briefcase,color:'indigo'},
  {label:'Entrevistas IA',desc:'Practica con entrevistas simuladas',Icon:MicrophoneStage,color:'rose',beta:true},
  {label:'Mis CVs',desc:'Gestiona todas tus versiones de CV',Icon:Folders,color:'amber'},
  {label:'Mis Vacantes',desc:'Guarda y organiza empleos de interés',Icon:BookmarkSimple,color:'green'},
  {label:'Pipeline',desc:'Haz seguimiento a tus postulaciones',Icon:Kanban,color:'purple'},
  {label:'Biblioteca',desc:'Recursos y guías de búsqueda laboral',Icon:Books,color:'slate'},
  {label:'Bienestar',desc:'Mindfulness y ejercicios para el proceso',Icon:Heart,color:'rose'},
  {label:'Mentor Experto',desc:'Acceso a mentores de carrera',Icon:UsersThree,color:'orange',beta:true},
  {label:'Dashboard',desc:'Vista centralizada de tu progreso',Icon:ChartLine,color:'violet'},
]
const FC={violet:'bg-violet-50 border-violet-200 text-violet-700',blue:'bg-blue-50 border-blue-200 text-blue-700',teal:'bg-teal-50 border-teal-200 text-teal-700',indigo:'bg-indigo-50 border-indigo-200 text-indigo-700',rose:'bg-rose-50 border-rose-200 text-rose-700',amber:'bg-amber-50 border-amber-200 text-amber-700',green:'bg-emerald-50 border-emerald-200 text-emerald-700',purple:'bg-purple-50 border-purple-200 text-purple-700',slate:'bg-slate-100 border-slate-200 text-slate-600',orange:'bg-orange-50 border-orange-200 text-orange-700'}

function FeaturePreviewGrid() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-violet-50/30 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkle size={18} weight="duotone" className="text-violet-600"/>
        </div>
        <div>
          <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-0.5">Lo que te espera</p>
          <h3 className="font-black text-slate-800 text-base leading-snug">Completa tu perfil para desbloquear todas las herramientas</h3>
          <p className="text-xs text-slate-500 mt-1">Una vez que termines el Gerente de Búsqueda, toda la plataforma se activa automáticamente.</p>
        </div>
      </div>
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {FEATURES_PREVIEW.map(f=>{
          const Icon=f.Icon
          const c=FC[f.color]||FC.slate
          return(
            <div key={f.label} className={'relative rounded-2xl border-2 p-4 flex flex-col gap-2 opacity-60 '+c}>
              <div className="flex items-center justify-between"><Icon size={22} weight="duotone"/><Lock size={14} weight="bold" className="text-slate-400"/></div>
              <p className="font-bold text-sm leading-snug">{f.label}</p>
              <p className="text-xs opacity-80 leading-snug">{f.desc}</p>
              {f.beta&&<span className="absolute top-2 right-6 text-[8px] font-bold uppercase tracking-wider bg-white/60 rounded-full px-1.5 py-0.5">Beta</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Dashboard de resumen ────────────────────────────────────────────────────

function DashboardResumen({ data, pct, onSelect, perfil, activePilar }) {
  const porPilar = calcularPorPilar(data, perfil)
  const checks = (data&&data.documentos&&data.documentos.checks) ? data.documentos.checks : {}
  const docsDone = DOCS_LIST.filter(function(d){return checks[d.id]}).length
  const bloques = (data&&data.semana&&data.semana.bloques) ? data.semana.bloques : {}
  const horas = Object.values(bloques).filter(Boolean).length * 2
  const rec = (data&&data.recursos&&data.recursos.recursos) ? data.recursos.recursos : RECURSOS_DEFAULT
  const costoTotal = rec.reduce(function(s,r){return s+(Number(r.costo)||0)},0)
  const auto = (data&&data.autoconocimiento) ? data.autoconocimiento : {}

  // Los 5 pilares al 100% desbloquean herramientas clave
  const CORE_IDS = ['perfil','autoconocimiento','recursos','semana','oferta']
  const isUnlocked = pct >= 100

  const statusLabel = pct===100?'Estratega Completo':pct>=80?'Muy avanzado':pct>=50?'En progreso':pct>0?'Iniciado':'Sin inicio'
  const statusColor = pct===100?'text-emerald-600 bg-emerald-50 border-emerald-200':pct>=50?'text-amber-600 bg-amber-50 border-amber-200':'text-violet-600 bg-violet-50 border-violet-200'

  const kpis = [
    { label:'Horas / sem',   value: horas>0?horas+'h':'—',                              icon:CalendarCheck, color:'text-teal-500',  bg:'bg-teal-50'   },
    { label:'Docs listos',   value: docsDone+' / '+DOCS_LIST.length,                    icon:FileText,      color:'text-amber-500', bg:'bg-amber-50'  },
    { label:'Costo mensual', value: costoTotal>0?'$'+costoTotal.toLocaleString():'—',   icon:Briefcase,     color:'text-blue-500',  bg:'bg-blue-50'   },
    { label:'Industrias',    value: Array.isArray(auto.industrias)&&auto.industrias.length>0?auto.industrias[0]:'—', icon:Target, color:'text-violet-500', bg:'bg-violet-50', small:true },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <ChartLine size={16} weight="duotone" className="text-violet-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Mi Proyecto Laboral</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">Resumen de avance</p>
          </div>
        </div>
        <span className={'text-[11px] font-bold px-3 py-1 rounded-full border ' + statusColor}>{statusLabel}</span>
      </div>

      {/* ── KPI strip ── */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-5">
          {/* Círculo de progreso */}
          <div className="relative w-[72px] h-[72px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" strokeWidth="7" stroke="#f1f5f9" fill="none"/>
              <circle cx="36" cy="36" r="28" strokeWidth="7"
                stroke={pct>=60?'#10b981':pct>=40?'#f59e0b':'#7c3aed'}
                strokeLinecap="round" fill="none"
                strokeDasharray={`${2*Math.PI*28}`}
                strokeDashoffset={`${2*Math.PI*28*(1-pct/100)}`}
                style={{transition:'stroke-dashoffset 0.8s ease'}}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-800 leading-none">{pct}%</span>
              <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide">total</span>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-12 bg-slate-200 shrink-0"/>

          {/* KPIs */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
            {kpis.map(function(k){
              const Icon = k.icon
              return (
                <div key={k.label} className="flex items-center gap-2.5 min-w-0">
                  <div className={'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' + k.bg}>
                    <Icon size={14} weight="duotone" className={k.color}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">{k.label}</p>
                    <p className={'font-black text-slate-800 mt-0.5 leading-tight ' + (k.small?'text-xs truncate':'text-sm')}>{k.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Banner de desbloqueo cuando llega a 100% */}
        {isUnlocked && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckFat size={16} weight="fill" className="text-emerald-600 shrink-0"/>
            <p className="text-xs font-bold text-emerald-700">¡Herramientas clave desbloqueadas! Alcanzaste el 100% de tu estrategia.</p>
          </div>
        )}
        {!isUnlocked && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[10px] font-semibold text-slate-400">Completa el 100% para desbloquear herramientas</p>
              <p className="text-[10px] font-bold text-violet-600">{pct} / 100%</p>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700"
                style={{width: Math.min((pct/60)*100, 100)+'%'}}/>
            </div>
          </div>
        )}
      </div>

      {/* ── Pilares grid 3x2 ── */}
      <div className="px-6 py-5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">6 Pilares del proyecto</p>
        <div className="grid grid-cols-3 gap-3">
          {PILARES.map(function(p) {
            const pp = porPilar[p.id] || 0
            const c  = COLORES[p.color]
            const Icon = p.icon
            const isCore = CORE_IDS.includes(p.id)
            const isLocked = !isCore && !isUnlocked
            const isActive = activePilar === p.id

            return (
              <button key={p.id} onClick={function(){ if(!isLocked) onSelect(p.id) }}
                title={isLocked ? 'Completa los 6 pilares estratégicos para desbloquear' : pp===100 ? '¡Sección completa!' : 'Te falta '+(100-pp)+'% para terminar esta sección'}
                className={'group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center '
                  + (isLocked
                    ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                    : isActive
                    ? 'cursor-pointer shadow-md border-current ' + c.soft
                    : 'cursor-pointer hover:shadow-md border-transparent hover:border-current ' + c.soft)}
              >
                {/* Candado */}
                {isLocked && (
                  <div className="absolute top-2 right-2">
                    <Lock size={12} weight="fill" className="text-slate-400"/>
                  </div>
                )}

                {/* Tooltip */}
                {!isLocked && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div className="bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      {pp===100 ? '¡Sección completa!' : 'Te falta '+(100-pp)+'% para terminar'}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"/>
                  </div>
                )}

                {/* Icono */}
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + (isLocked?'bg-slate-200':c.badge)}>
                  <Icon size={18} weight="duotone" className={isLocked?'text-slate-400':c.icon} />
                </div>

                {/* Label completo */}
                <p className={'text-[11px] font-bold leading-tight ' + (isLocked?'text-slate-400':'text-slate-700')}
                   style={{wordBreak:'break-word'}}>
                  {p.label}
                </p>

                {/* Barra de progreso */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={'h-full rounded-full transition-all duration-500 ' + (isLocked?'bg-slate-300':c.bar)}
                    style={{width:pp+'%'}} />
                </div>

                <span className={'text-xs font-black ' + (isLocked?'text-slate-400':c.icon)}>{pp}%</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Pilar 1: Autoconocimiento ───────────────────────────────────────────────

function PilarAutoconocimiento({ data, onChange, onSave, justSaved }) {
  const d = data || {}
  const up = function(key, val) { onChange(Object.assign({}, d, {[key]:val})) }
  const [modalIncompleto, setModalIncompleto] = useState(null)

  function getIncompletos() {
    const items = []
    if (!Array.isArray(d.hard_skills)||d.hard_skills.length<2)   items.push('Hard Skills — selecciona al menos 2')
    if (!Array.isArray(d.soft_skills)||d.soft_skills.length<2)   items.push('Soft Skills — selecciona al menos 2')
    if (!Array.isArray(d.power_skills)||d.power_skills.length<2) items.push('Power Skills — selecciona al menos 2')
    if (!Array.isArray(d.top5empresas)||d.top5empresas.filter(function(e){return e&&String(e).trim()}).length<1) items.push('Top 5 Compañías — escribe al menos 1')
    return items
  }
  function handleSave() {
    const f = getIncompletos()
    if (f.length>0) { setModalIncompleto(f) } else { onSave() }
  }

  const HARD_SKILLS = [
    'Tecnología y Datos','Gestión de Proyectos','Finanzas y Negocio',
    'Operaciones','Supply Chain','Marketing Digital','Ventas y Comercial',
    'Diseño','Ingeniería y Procesos','Idiomas','Comercio Exterior','Legal',
  ]
  const SOFT_SKILLS = [
    'Adaptabilidad','Pensamiento analítico','Pensamiento creativo',
    'Comunicación','Inteligencia emocional','Liderazgo',
    'Resolución de problemas','Trabajo en equipo y colaboración','Resiliencia',
    'Flexibilidad y agilidad','Curiosidad y aprendizaje continuo','Pensamiento sistémico',
    'Resolución de conflictos','Gestión del estrés','Gestión y servicio al cliente',
    'Influencia social','Motivación y autoconciencia','Empatía y escucha activa',
    'Hablar en público y presentaciones',
  ]
  const POWER_SKILLS = [
    'Inteligencia Artificial (IA), Machine Learning e Ingeniería de Prompts',
    'Ciencia de datos, ingeniería de datos y análisis estadístico',
    'Diseño UX/UI y arquitectura de la información',
    'Tecnología Blockchain y contratos inteligentes',
    'Desarrollo de plataformas Low-Code / No-Code',
    'Realidad Aumentada (AR), Realidad Virtual (VR) y computación espacial',
    'Gestión de proyectos (Project Management) y metodologías ágiles',
    'Sostenibilidad, reportes ESG, contabilidad de carbono y "Green Skills"',
    'Modelado financiero, minería de datos financieros y gestión de inversiones',
    'Cumplimiento normativo (Compliance)',
    'Evaluación de riesgos',
    'Ciencias actuariales y análisis crediticio',
    'Estrategia de comercialización (Go-to-Market) y venta consultiva',
    'Marketing digital avanzado (SEO, SEM y campañas de correo)',
    'Logística: control de inventarios, compras y gestión de la cadena de suministro',
    'Operación de equipos',
  ]
  const INDUSTRIAS = ['Tecnología','Finanzas / Banca','Salud','Retail / FMCG','Manufactura','Consultoría','Educación','Gobierno','Startups','Energía']
  const MOVILIDAD = ['Presencial','Remoto','Híbrido']
  const toggle = function(key,val){
    const list = Array.isArray(d[key])?d[key]:[]
    up(key,list.includes(val)?list.filter(function(x){return x!==val}):list.concat([val]))
  }
  const updateE = function(i,val){
    const arr = Array.isArray(d.top5empresas)?d.top5empresas.slice():['','','','','']
    arr[i]=val; up('top5empresas',arr)
  }
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Brain size={16} className="text-violet-600" weight="duotone"/>¿En qué eres genuinamente bueno?</h3>
          <p className="text-xs text-slate-500">Selecciona tus habilidades reales en cada categoría.</p>
        </div>

        {/* Hard Skills */}
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
              <Toolbox size={15} className="text-blue-600" weight="duotone"/>
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm leading-tight">Hard Skills</div>
              <div className="text-xs text-blue-600 font-medium">El "Saber hacer" · Competencias técnicas medibles · <strong>Debes seleccionar al menos 3</strong></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {HARD_SKILLS.map(function(a){
              const sel = Array.isArray(d.hard_skills)&&d.hard_skills.includes(a)
              return <button key={a} onClick={function(){toggle('hard_skills',a)}}
                className={'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer '+(sel?'bg-blue-600 text-white border-blue-600':'border-blue-200 text-slate-600 hover:border-blue-400 hover:text-blue-700')}>{a}</button>
            })}
          </div>
        </div>

        {/* Soft Skills */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <Heart size={15} className="text-emerald-600" weight="duotone"/>
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm leading-tight">Soft Skills</div>
              <div className="text-xs text-emerald-600 font-medium">El "Saber ser" · Habilidades sociales y de carácter · <strong>Debes seleccionar al menos 3</strong></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SOFT_SKILLS.map(function(a){
              const sel = Array.isArray(d.soft_skills)&&d.soft_skills.includes(a)
              return <button key={a} onClick={function(){toggle('soft_skills',a)}}
                className={'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer '+(sel?'bg-emerald-600 text-white border-emerald-600':'border-emerald-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700')}>{a}</button>
            })}
          </div>
        </div>

        {/* Power Skills */}
        <div className="p-5 rounded-2xl bg-violet-50 border border-violet-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
              <Sparkle size={15} className="text-violet-600" weight="duotone"/>
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm leading-tight">Power Skills</div>
              <div className="text-xs text-violet-600 font-medium">El "Saber lograr" · Competencias de alto impacto · <strong>Debes seleccionar al menos 3</strong></div>
            </div>
          </div>
          <div className="space-y-2">
            {POWER_SKILLS.map(function(a){
              const sel = Array.isArray(d.power_skills)&&d.power_skills.includes(a)
              return (
                <button key={a} onClick={function(){toggle('power_skills',a)}}
                  className={'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm border-2 transition-all cursor-pointer '+(sel?'bg-violet-600 text-white border-violet-600 font-semibold shadow-sm':'bg-white border-violet-100 text-slate-700 font-medium hover:border-violet-300 hover:bg-violet-50/60')}
                >
                  <span className={'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors '+(sel?'border-white bg-white/20':'border-violet-300')}>
                    {sel && <span className="w-2.5 h-2.5 rounded-full bg-white"/>}
                  </span>
                  {a}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Top 5 Compañías objetivo · <span className="text-amber-600">Debes llenar al menos 1</span></h3>
        <p className="text-xs text-slate-400 mb-4">Estas empresas aparecerán primero en tu radar de Vacantes.</p>
        <div className="space-y-2">
          {[0,1,2,3,4].map(function(i){return(
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-black flex items-center justify-center shrink-0 border border-amber-200">{i+1}</span>
              <input value={(Array.isArray(d.top5empresas)?d.top5empresas:[])[i]||''} onChange={function(e){updateE(i,e.target.value)}}
                placeholder={'Empresa #'+(i+1)+' (ej: Google, Banorte...)'}
                className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400"/>
            </div>
          )})}
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-violet-600 hover:bg-violet-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>

      {modalIncompleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(15,10,40,0.55)',backdropFilter:'blur(4px)'}} onClick={function(e){if(e.target===e.currentTarget)setModalIncompleto(null)}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-violet-500 to-violet-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div><h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2><p className="text-violet-100 text-xs mt-0.5">Autoconocimiento tiene campos sin completar</p></div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Para guardar correctamente y reflejar tu progreso, completa:</p>
              <ul className="space-y-2 mb-6">{modalIncompleto.map(function(item,i){return(<li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>{item}</li>)})}</ul>
              <div className="flex gap-3">
                <button onClick={function(){setModalIncompleto(null)}} className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors cursor-pointer">Volver a completar</button>
                <button onClick={function(){setModalIncompleto(null);onSave()}} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer">Guardar así</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pilar 2: Recursos ───────────────────────────────────────────────────────

function PilarRecursos({ data, onChange, onSave, justSaved, pais }) {
  const rawArr = data ? (Array.isArray(data) ? data : (Array.isArray(data.recursos) ? data.recursos : null)) : null
  const recursos = (rawArr && rawArr.length > 0) ? rawArr : RECURSOS_DEFAULT
  const [modalIncompleto, setModalIncompleto] = useState(null)

  const moneda = detectarMoneda(pais)
  const upR = function(id,f,v){onChange({recursos:recursos.map(function(r){return r.id===id?Object.assign({},r,{[f]:v}):r})})}
  const addR = function(){onChange({recursos:recursos.concat([{id:String(Date.now()),nombre:'',descripcion:'',costo:0,tengo:false}])})}
  const delR = function(id){onChange({recursos:recursos.filter(function(r){return r.id!==id})})}
  const totalAll = recursos.reduce(function(s,r){return s+(Number(r.costo)||0)},0)
  const monedaSymbol = MONEDAS_LIST.find(function(m){return m.code===moneda})?.symbol || '$'

  function handleSave() {
    const activos = recursos.filter(function(r){return r.tengo===true}).length
    if (activos < 1) { setModalIncompleto(['Marca al menos 1 recurso que ya tienes disponible']) }
    else { onSave() }
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="text-blue-700 font-bold">¿Cuánto cuesta tu búsqueda laboral?</span>{' '}
          Identifica lo que ya tienes y lo que aún necesitas. Todos los costos son <strong>mensuales en {moneda}</strong>.
        </p>
      </div>
      <div className="space-y-2.5">
        {recursos.map(function(r){
          const isOptima = r.id==='optima'
          const optimaValor = isOptima && r.tengo ? convertirDesdeMXN(PRECIO_OPTIMA_MXN['free'], moneda) : r.costo
          return(
          <div key={r.id} className={'border rounded-2xl p-4 transition-all '+(r.tengo?'bg-green-50 border-green-200':'bg-white border-slate-200')}>
            <div className="flex items-center gap-4">
              <button onClick={function(){
                const newTengo = !r.tengo
                if (!newTengo) {
                  onChange({recursos:recursos.map(function(res){return res.id===r.id?Object.assign({},res,{tengo:false,costo:0}):res})})
                } else {
                  upR(r.id,'tengo',newTengo)
                }
              }} className={'w-10 h-5.5 rounded-full relative shrink-0 transition-colors cursor-pointer '+(r.tengo?'bg-green-500':'bg-slate-300')} style={{height:22}}>
                <span className={'absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all '+(r.tengo?'right-[3px]':'left-[3px]')}/>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <input value={r.nombre} onChange={function(e){upR(r.id,'nombre',e.target.value)}} disabled={!r.tengo}
                      placeholder="Nombre del recurso"
                      className="font-semibold text-sm text-slate-800 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 w-full disabled:text-slate-400 disabled:cursor-not-allowed"/>
                    <input value={r.descripcion||''} onChange={function(e){upR(r.id,'descripcion',e.target.value)}} disabled={!r.tengo}
                      placeholder="Describe para qué lo necesitas..."
                      className="text-xs text-slate-500 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-200 w-full mt-0.5 disabled:text-slate-300 disabled:cursor-not-allowed"/>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-slate-500">{monedaSymbol}</span>
                      <input type="number" value={isOptima && r.tengo ? optimaValor : r.costo} onChange={function(e){if(!isOptima || !r.tengo){const v=e.target.value; if(v===''||!isNaN(v)&&Number(v)>=0) upR(r.id,'costo',v)}}} disabled={!r.tengo || (isOptima && r.tengo)}
                        className="w-14 text-xs text-slate-700 font-bold bg-transparent focus:outline-none text-right disabled:text-slate-400 disabled:cursor-not-allowed" min="0"/>
                      <span className="text-xs text-slate-400">{moneda}</span>
                    </div>
                    {!r.obligatorio && <button onClick={function(){delR(r.id)}} className="text-slate-300 hover:text-red-400 transition-colors p-1 cursor-pointer">
                      <Trash size={14}/>
                    </button>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>
      <button onClick={addR} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-dashed border-blue-300 rounded-xl px-4 py-3 hover:border-blue-400 transition-colors w-full justify-center cursor-pointer">
        <PlusMinus size={16}/> Agregar recurso
      </button>
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total mensual</p>
        <p className="text-2xl font-black text-slate-800">{monedaSymbol}{totalAll.toLocaleString()} <span className="text-sm text-slate-400 font-normal">{moneda}</span></p>
      </div>

      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>

      {modalIncompleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(15,10,40,0.55)',backdropFilter:'blur(4px)'}} onClick={function(e){if(e.target===e.currentTarget)setModalIncompleto(null)}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div><h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2><p className="text-blue-100 text-xs mt-0.5">Recursos tiene campos sin completar</p></div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Para guardar correctamente y reflejar tu progreso, completa:</p>
              <ul className="space-y-2 mb-6">{modalIncompleto.map(function(item,i){return(<li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>{item}</li>)})}</ul>
              <div className="flex gap-3">
                <button onClick={function(){setModalIncompleto(null)}} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors cursor-pointer">Volver a completar</button>
                <button onClick={function(){setModalIncompleto(null);onSave()}} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer">Guardar así</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pilar 3: Semana Laboral ─────────────────────────────────────────────────

function PilarSemana({ data, onChange, onSave, justSaved }) {
  const d = data||{}
  const dias = Array.isArray(d.dias)?d.dias:[]
  const bloques = d.bloques||{}
  const toggleDia = function(dia){ onChange(Object.assign({},d,{dias:dias.includes(dia)?dias.filter(function(x){return x!==dia}):dias.concat([dia])})) }
  const toggleB = function(dia,h){ const k=dia+'_'+h; onChange(Object.assign({},d,{bloques:Object.assign({},bloques,{[k]:!bloques[k]})})) }
  const totalH = Object.values(bloques).filter(Boolean).length*2
  const bench = totalH>=15?'green':totalH>=8?'amber':'red'
  const [modalIncompleto, setModalIncompleto] = useState(null)

  function handleSave() {
    const bN = Object.values(bloques).filter(Boolean).length
    if (bN < 1) { setModalIncompleto(['Agrega al menos 1 bloque de horas en tu horario semanal']) }
    else { onSave() }
  }
  return (
    <div className="space-y-8">
      <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="text-teal-700 font-bold">Trátalo como un trabajo de medio tiempo.</span>{' '}
          Los candidatos exitosos dedican consistentemente <strong>15+ horas/semana</strong> a su búsqueda.
        </p>
      </div>
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Días activos de búsqueda</h3>
        <div className="flex flex-wrap gap-2">
          {DIAS.map(function(d){ const sel=dias.includes(d); return (
            <button key={d} onClick={function(){toggleDia(d)}} className={'w-14 h-14 rounded-2xl font-bold text-sm transition-all border-2 cursor-pointer '+(sel?'bg-teal-600 text-white border-teal-600 shadow-sm':'border-slate-200 text-slate-500 hover:border-teal-400')}>{d}</button>
          )})}
        </div>
      </div>
      {dias.length>0&&(
        <div className="overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Bloques de 2 horas por día</h3>
          <table className="min-w-[480px]">
            <thead><tr>
              <th className="text-left text-[10px] text-slate-400 pb-2 pr-4 font-semibold">Horario</th>
              {dias.map(function(d){return <th key={d} className="text-center text-xs text-slate-600 pb-2 px-2 font-bold">{d}</th>})}
            </tr></thead>
            <tbody>
              {HORARIOS.map(function(h){return(
                <tr key={h}>
                  <td className="text-xs text-slate-500 pr-4 py-1.5 whitespace-nowrap">{h}</td>
                  {dias.map(function(d){ const k=d+'_'+h; const act=bloques[k]; return(
                    <td key={d} className="px-2 py-1.5 text-center">
                      <button onClick={function(){toggleB(d,h)}} className={'w-8 h-8 rounded-lg mx-auto block transition-all border-2 cursor-pointer '+(act?'bg-teal-500 border-teal-500':'border-slate-200 hover:border-teal-400')}>
                        {act&&<CheckCircle size={16} weight="fill" className="text-white mx-auto"/>}
                      </button>
                    </td>
                  )})}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
      {totalH>0&&(
        <div className={'p-5 rounded-2xl border-2 flex items-center justify-between '+(bench==='green'?'bg-teal-50 border-teal-200':bench==='amber'?'bg-amber-50 border-amber-200':'bg-red-50 border-red-200')}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Horas por semana</p>
            <p className={'text-sm font-semibold mt-0.5 '+(bench==='green'?'text-teal-700':bench==='amber'?'text-amber-700':'text-red-600')}>
              {bench==='green'?'Excelente — en la zona de éxito':bench==='amber'?'Bien, agrega algunos bloques más':'Muy poco — el proceso tomará más tiempo'}
            </p>
          </div>
          <p className={'text-3xl font-black '+(bench==='green'?'text-teal-600':bench==='amber'?'text-amber-600':'text-red-500')}>{totalH}h</p>
        </div>
      )}

      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-teal-600 hover:bg-teal-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>

      {modalIncompleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(15,10,40,0.55)',backdropFilter:'blur(4px)'}} onClick={function(e){if(e.target===e.currentTarget)setModalIncompleto(null)}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div><h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2><p className="text-teal-100 text-xs mt-0.5">Horario semanal no tiene bloques definidos</p></div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Para guardar correctamente y reflejar tu progreso, completa:</p>
              <ul className="space-y-2 mb-6">{modalIncompleto.map(function(item,i){return(<li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>{item}</li>)})}</ul>
              <div className="flex gap-3">
                <button onClick={function(){setModalIncompleto(null)}} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors cursor-pointer">Volver a completar</button>
                <button onClick={function(){setModalIncompleto(null);onSave()}} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer">Guardar así</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pilar 4: Mi Oferta de Valor ─────────────────────────────────────────────

const CULTURA_SUGERIDAS = [
  'De puertas abiertas','Feedback continuo','Comunicación transparente',
  'Orientada a resultados','Innovación constante','Work-life balance',
  'Multinacional','Nacional','Transnacional','Startup / Ágil',
  'Diversidad e inclusión','Jerarquía plana','Mentoría y desarrollo',
  'Colaborativa','Autonomía profesional','Alta exigencia',
  'Procesos bien definidos','Con propósito social','Flexible',
]

function PilarOfertaDeValor({ data, onChange, onSave, justSaved }) {
  const d = data || {}
  const up = function(key, val) { onChange(Object.assign({}, d, {[key]: val})) }
  const [cultInput, setCultInput] = useState('')
  const [modalIkigai, setModalIkigai] = useState(false)
  const [modalIncompleto, setModalIncompleto] = useState(null) // null | string[]

  const IKIGAI_LABELS = {
    ikigai_amas:     '¿Qué es lo que AMAS?',
    ikigai_bueno:    '¿Para qué eres BUENO/A?',
    ikigai_necesita: '¿Qué NECESITA el mundo de ti?',
    ikigai_pagar:    '¿Por qué podrían PAGARTE?',
  }

  function getIncompletos() {
    const items = []
    if (String(d.oferta_valor||'').trim().length < 20) items.push('Tu oferta de valor (mínimo 20 caracteres)')
    Object.keys(IKIGAI_LABELS).forEach(function(k) {
      if (String(d[k]||'').trim().length < 50) items.push(IKIGAI_LABELS[k] + ' (mínimo 50 caracteres)')
    })
    return items
  }

  function handleSave() {
    const faltantes = getIncompletos()
    if (faltantes.length > 0) {
      setModalIncompleto(faltantes)
    } else {
      onSave()
    }
  }

  const cultura = Array.isArray(d.cultura) ? d.cultura : []

  const toggleCultura = function(tag) {
    if (cultura.includes(tag)) {
      up('cultura', cultura.filter(function(t){ return t !== tag }))
    } else {
      up('cultura', cultura.concat([tag]))
    }
  }

  const addCustom = function() {
    const val = cultInput.trim()
    if (!val || cultura.includes(val)) { setCultInput(''); return }
    up('cultura', cultura.concat([val]))
    setCultInput('')
  }

  const customTags = cultura.filter(function(t){ return !CULTURA_SUGERIDAS.includes(t) })

  return (
    <div className="space-y-8">

      {/* ── Cultura ── */}
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100">
        <div className="flex items-center gap-2 mb-1">
          <UsersThree size={16} className="text-rose-600" weight="duotone"/>
          <h3 className="font-bold text-slate-800">¿Qué cultura laboral te define?</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Selecciona o agrega los valores y dinámicas de trabajo que mejor se alinean con tu perfil.
          Pueden ser tipo de empresa (multinacional, startup) o estilo de trabajo (feedback continuo, jerarquía plana).
        </p>

        {/* Sugerencias */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CULTURA_SUGERIDAS.map(function(tag){
            const sel = cultura.includes(tag)
            return (
              <button key={tag} onClick={function(){ toggleCultura(tag) }}
                className={'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ' +
                  (sel ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-200 text-slate-600 hover:border-rose-400 hover:text-rose-700')}>
                {tag}
              </button>
            )
          })}
        </div>

        {/* Tags personalizados */}
        {customTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customTags.map(function(tag){
              return (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-rose-600 text-white border border-rose-600">
                  {tag}
                  <button onClick={function(){ up('cultura', cultura.filter(function(t){ return t !== tag })) }}
                    className="opacity-70 hover:opacity-100 cursor-pointer leading-none">×</button>
                </span>
              )
            })}
          </div>
        )}

        {/* Agregar personalizado */}
        <div className="flex gap-2">
          <input
            value={cultInput}
            onChange={function(e){ setCultInput(e.target.value) }}
            onKeyDown={function(e){ if (e.key==='Enter'){ e.preventDefault(); addCustom() } }}
            placeholder="Agrega tu propio valor cultural..."
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white"
          />
          <button onClick={addCustom}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap">
            + Agregar
          </button>
        </div>
      </div>

      {/* ── IKIGAI · 4 cajas obligatorias ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-50 via-white to-rose-50 border border-violet-100 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkle size={16} className="text-violet-600" weight="duotone"/>
            <h3 className="font-bold text-slate-800">Descubre tu IKIGAI profesional</h3>
            <button
              onClick={function(){ setModalIkigai(true) }}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-100 hover:bg-violet-200 px-3 py-1 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <Sparkle size={12} weight="fill"/> ¿Qué es el IKIGAI?
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Las 4 preguntas del método IKIGAI japonés para encontrar el propósito en tu carrera.
            Tómate tu tiempo — esta reflexión es la base de tu oferta de valor.
          </p>

          {/* ── Modal IKIGAI ── */}
          {modalIkigai && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{backgroundColor:'rgba(15,10,40,0.6)', backdropFilter:'blur(4px)'}}
              onClick={function(e){ if(e.target===e.currentTarget) setModalIkigai(false) }}
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-rose-500 rounded-t-3xl shrink-0">
                  <Sparkle size={22} className="text-white" weight="fill"/>
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-lg leading-tight">El método IKIGAI</h2>
                    <p className="text-violet-100 text-xs">Tu razón de ser profesional</p>
                  </div>
                  <button
                    onClick={function(){ setModalIkigai(false) }}
                    className="text-white/80 hover:text-white transition-colors p-1 cursor-pointer"
                  >
                    <X size={20} weight="bold"/>
                  </button>
                </div>

                {/* Body — scrollable */}
                <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm text-slate-700">

                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
                    <p className="font-semibold text-violet-800 mb-1">¿Qué es el IKIGAI?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Ikigai (生き甲斐) es un concepto japonés que significa <em>"razón de ser"</em> o <em>"razón para levantarte en la mañana"</em>.
                      Es la intersección entre lo que amas, lo que se te da bien, lo que el mundo necesita y por lo que te pueden pagar.
                      Cuando alineas estas cuatro fuerzas, encuentras un trabajo que no se siente como trabajo.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-2">¿Cómo funciona?</p>
                    <p className="text-slate-600 leading-relaxed">
                      El IKIGAI se construye respondiendo honestamente cuatro preguntas. La magia ocurre en las intersecciones:
                    </p>
                    <ul className="mt-3 space-y-2 pl-2">
                      <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span><span><strong className="text-rose-700">PASIÓN</strong> = lo que amas + lo que haces bien</span></li>
                      <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span><span><strong className="text-blue-700">MISIÓN</strong> = lo que amas + lo que el mundo necesita</span></li>
                      <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span><span><strong className="text-emerald-700">VOCACIÓN</strong> = lo que haces bien + por lo que te pagan</span></li>
                      <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">4</span><span><strong className="text-amber-700">PROFESIÓN</strong> = lo que el mundo necesita + por lo que te pagan</span></li>
                    </ul>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                    <p className="font-semibold text-rose-700 mb-1">¿Qué es lo que AMAS?</p>
                    <p className="text-slate-600 leading-relaxed">
                      La primera parte del IKIGAI descubrirá el tipo de actividades que hacen latir tu corazón.
                      No sobrepienses — elige tu primer instinto. Piensa en qué harías aunque no te pagaran,
                      qué temas investigas en tu tiempo libre, qué conversaciones te emocionan sin que nadie te lo pida.
                    </p>
                    <p className="mt-2 text-xs text-rose-600 font-medium italic">
                      "¿Qué actividades haces sin que te importe el paso del tiempo? ¿Qué temas investigarías gratis?"
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="font-semibold text-blue-700 mb-1">¿Para qué eres BUENO?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Esta sección busca tus mejores aptitudes — incluso si no disfrutas usarlas. Ten la mente abierta.
                      Piensa en los elogios que recibes con frecuencia, en qué tareas eres más eficiente que el promedio,
                      o qué cosas otros te piden ayuda porque saben que lo haces bien.
                    </p>
                    <p className="mt-2 text-xs text-blue-600 font-medium italic">
                      "¿Qué elogios recibes de tus colegas? ¿En qué eres más eficiente que el promedio?"
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <p className="font-semibold text-emerald-700 mb-1">¿Qué es lo que el mundo NECESITA de ti?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Esta sección se enfoca en el impacto que puedes tener. Con la educación y experiencia adecuadas,
                      puedes hacer todo lo que te propongas para ayudar a tu industria, empresa o comunidad.
                      Piensa en problemas que nadie está resolviendo, en brechas que ves y que tú podrías cerrar.
                    </p>
                    <p className="mt-2 text-xs text-emerald-600 font-medium italic">
                      "¿Qué problemas ves en tu industria que nadie resuelve? ¿Qué carencia podrías cubrir?"
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="font-semibold text-amber-700 mb-1">¿Por qué podrían PAGARTE?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Esta sección identifica qué habilidades tuyas son valiosas en el mercado laboral hoy.
                      ¿Qué combinación de skills tienes que sea escasa? ¿Qué servicios o conocimientos buscan
                      las empresas y que tú puedes ofrecer con credibilidad y resultados probados?
                    </p>
                    <p className="mt-2 text-xs text-amber-600 font-medium italic">
                      "¿Qué conocimientos están contratando hoy las empresas donde tú puedes generar valor?"
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-violet-50 to-rose-50 border border-violet-100 rounded-2xl p-4">
                    <p className="font-semibold text-violet-800 mb-2">Tu IKIGAI en la búsqueda de empleo</p>
                    <p className="text-slate-600 leading-relaxed">
                      Completar estas 4 reflexiones tiene un impacto directo en tu proceso:
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-600">
                      <li className="flex gap-2"><span className="text-violet-500 font-bold">→</span> Defines con precisión qué tipo de empresa y cultura buscas</li>
                      <li className="flex gap-2"><span className="text-violet-500 font-bold">→</span> Articulas tu propuesta de valor en entrevistas con claridad</li>
                      <li className="flex gap-2"><span className="text-violet-500 font-bold">→</span> Filtras oportunidades que no van alineadas con tu propósito</li>
                      <li className="flex gap-2"><span className="text-violet-500 font-bold">→</span> Tu "Elevator Pitch" se vuelve auténtico y memorable</li>
                    </ul>
                  </div>

                  <p className="text-center text-xs text-slate-400 pb-2">
                    Metodología basada en el concepto IKIGAI japonés adaptada para la búsqueda laboral estratégica por ELVIA®
                  </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
                  <button
                    onClick={function(){ setModalIkigai(false) }}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Entendido, ¡voy a completarlo!
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {[
          {
            key: 'ikigai_amas',
            title: '¿Qué es lo que AMAS?',
            color: 'rose',
            desc: 'La primera parte de IKIGAI descubrirá el tipo de actividades que hacen latir tu corazón y el tipo de actividades que no te gustan. No sobrepienses, solo elige tu primer instinto.',
            ej: '¿Qué actividades haces sin que te importe el paso del tiempo? ¿Qué temas investigarías gratis?',
            placeholder: 'Me apasiona enseñar y ver cómo otros crecen. Investigo de innovación y modelos de negocio sin que nadie me lo pida...',
          },
          {
            key: 'ikigai_bueno',
            title: '¿Para qué eres BUENO?',
            color: 'blue',
            desc: 'En esta sección descubrirás para qué eres bueno. Esta parte del IKIGAI buscará tus mejores aptitudes, incluso si en realidad no disfrutas usarlas, así que ten la mente abierta al contestar.',
            ej: '¿Qué elogios recibes con frecuencia de tus colegas o jefes? ¿En qué tareas eres más eficiente que el promedio?',
            placeholder: 'Mis colegas dicen que explico ideas complejas de forma simple. Soy rápida estructurando información en presentaciones...',
          },
          {
            key: 'ikigai_necesita',
            title: '¿Qué es lo que el mundo NECESITA de ti?',
            color: 'emerald',
            desc: 'Esta sección se enfoca en el conocimiento que tienes o te gustaría tener. Después de todo, con la educación adecuada puedes hacer todo lo que te propongas para ayudar al mundo.',
            ej: '¿Qué problemas ves en tu comunidad o en tu industria que nadie está resolviendo?',
            placeholder: 'En mi industria muchas empresas no usan datos para tomar decisiones. Veo el problema de que los equipos juniors no tienen mentoría real...',
          },
          {
            key: 'ikigai_pagar',
            title: '¿Por qué podrían PAGARTE?',
            color: 'amber',
            desc: 'Esta sección se enfoca en entender qué habilidades son necesarias en el mercado laboral y que son tu diferenciador.',
            ej: '¿Qué servicios o conocimientos están contratando hoy en día las empresas en los que tú puedes generar valor?',
            placeholder: 'Las empresas hoy buscan profesionales que combinen análisis de datos con storytelling. Mi mezcla de Marketing + SQL + presentación a C-level es escasa...',
          },
        ].map(function(it){
          const val = String(d[it.key]||'')
          const ok = val.trim().length >= 50
          const colorMap = {
            rose:    { ring:'border-rose-200 bg-rose-50/40',    badge:'bg-rose-500',    text:'text-rose-700',    ringFocus:'focus:ring-rose-200' },
            blue:    { ring:'border-blue-200 bg-blue-50/40',    badge:'bg-blue-500',    text:'text-blue-700',    ringFocus:'focus:ring-blue-200' },
            emerald: { ring:'border-emerald-200 bg-emerald-50/40', badge:'bg-emerald-500', text:'text-emerald-700', ringFocus:'focus:ring-emerald-200' },
            amber:   { ring:'border-amber-200 bg-amber-50/40',  badge:'bg-amber-500',   text:'text-amber-700',   ringFocus:'focus:ring-amber-200' },
          }
          const c = colorMap[it.color]
          return (
            <div key={it.key} className={'p-4 rounded-xl border-2 transition-all '+c.ring}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className={'w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 '+c.badge}>★</span>
                  <h4 className={'font-bold text-sm '+c.text}>
                    {it.title} <span className="text-red-500">*</span>
                  </h4>
                </div>
                {ok ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                    <CheckFat size={10} weight="fill"/> Completo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-white/70 px-2 py-0.5 rounded-full shrink-0">Obligatorio</span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-1">{it.desc}</p>
              <p className="text-xs text-slate-500 italic mb-3"><strong>Ej:</strong> {it.ej}</p>
              <textarea
                value={val}
                onChange={function(e){ up(it.key, e.target.value) }}
                placeholder={it.placeholder}
                rows={3}
                className={'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none '+c.ringFocus}
              />
              <div className="flex justify-end mt-1">
                <span className={'text-[10px] font-semibold '+(ok ? 'text-emerald-600' : 'text-slate-400')}>
                  {val.trim().length}/50 mínimo
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Oferta de valor ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <MicrophoneStage size={16} className="text-rose-600" weight="duotone"/>
          <h3 className="font-bold text-slate-800">¿Cuál es tu oferta de valor? <span className="text-red-500">*</span></h3>
          {String(d.oferta_valor||'').trim().length >= 20 ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
              <CheckFat size={10} weight="fill"/> Completo
            </span>
          ) : (
            <span className="ml-auto text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">Obligatorio</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-1">
          Si tuvieras 5 minutos en una charla TED, ¿cómo le explicarías a una empresa exactamente
          qué valor único traes con tu experiencia, habilidades y forma de trabajar?
        </p>
        <p className="text-xs text-rose-600 font-semibold mb-4">
          Este texto se integrará en tu CV optimizado, después de tus datos de contacto.
        </p>
        <textarea
          value={d.oferta_valor || ''}
          onChange={function(e){ up('oferta_valor', e.target.value) }}
          placeholder={'Ej: Soy un profesional de Supply Chain con 12 años de experiencia en manufactura automotriz. Mi valor está en reducir costos operativos sin sacrificar calidad: en mis últimos 3 roles, lideré proyectos que redujeron tiempos de entrega en un 30% y costos logísticos en un 18%. Combino análisis de datos con liderazgo de equipos multiculturales y me adapto rápido a entornos de alta presión. Lo que me diferencia es mi capacidad de conectar la estrategia de negocio con la operación del día a día.'}
          rows={8}
          maxLength={700}
          className={'w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none bg-white '+(String(d.oferta_valor||'').trim().length>=20?'border-emerald-300 focus:ring-emerald-200':'border-rose-200 focus:ring-rose-200')}
        />
        <div className="flex justify-between mt-1.5">
          <span className={'text-xs font-semibold '+(String(d.oferta_valor||'').trim().length>=20?'text-emerald-600':'text-slate-400')}>
            {String(d.oferta_valor||'').trim().length < 20 && `Mínimo 20 caracteres (${String(d.oferta_valor||'').trim().length}/20)`}
          </span>
          <span className="text-xs text-slate-400">{(d.oferta_valor||'').length}/700 caracteres</span>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-rose-600 hover:bg-rose-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>

      {/* ── Modal: sección incompleta ── */}
      {modalIncompleto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor:'rgba(15,10,40,0.55)', backdropFilter:'blur(4px)'}}
          onClick={function(e){ if(e.target===e.currentTarget) setModalIncompleto(null) }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2>
                <p className="text-rose-100 text-xs mt-0.5">Completa estos campos para guardar tu progreso</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">
                Para guardar correctamente y reflejar tu progreso, necesitas completar:
              </p>
              <ul className="space-y-2 mb-6">
                {modalIncompleto.map(function(item, i){
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>
                      {item}
                    </li>
                  )
                })}
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={function(){ setModalIncompleto(null) }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Volver a completar
                </button>
                <button
                  onClick={function(){ setModalIncompleto(null); onSave() }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Guardar así
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pilar 5: Documentos ────────────────────────────────────────────────────

function PilarDocumentos({ data, onChange, onSave, justSaved, pct, isPaidPlan }) {
  const isUnlocked = pct >= 60
  const checks = (data&&data.checks)?data.checks:{}
  const toggle = function(id){onChange({checks:Object.assign({},checks,{[id]:!checks[id]})})}
  const completados = DOCS_LIST.filter(function(d){return checks[d.id]}).length
  const pctDocs = Math.round((completados/DOCS_LIST.length)*100)
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progreso de tu carpeta</h3>
          <span className="text-xs font-bold text-amber-600">{completados}/{DOCS_LIST.length} listos</span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" style={{width:pctDocs+'%'}}/>
        </div>
      </div>
      <div className="space-y-3">
        {DOCS_LIST.map(function(item){
          const done=!!checks[item.id]; const Icon=item.Icon
          const unlocked = isUnlocked && (item.id !== 'linkedin' || isPaidPlan)
          return (
            <div key={item.id} className={'flex items-start gap-4 p-4 rounded-2xl border-2 transition-all '+(done?'bg-amber-50 border-amber-200':'bg-white border-slate-200')}>
              <button onClick={function(){toggle(item.id)}} className="shrink-0 cursor-pointer mt-0.5">
                {done?<CheckSquare size={22} weight="fill" className="text-amber-500"/>:<Square size={22} className="text-slate-300 hover:text-slate-500 transition-colors"/>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                  <Icon size={17} className={done?'text-amber-500':'text-slate-400'} weight="duotone"/>
                  <span className={'text-sm font-semibold '+(done?'text-amber-700':'text-slate-700')}>{item.label}</span>
                  {done
                    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">Listo ✓</span>
                    : unlocked
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">Pendiente</span>
                      : null
                  }
                </div>
                {item.nota && <p className={'text-[11px] leading-snug mt-0.5 '+(done?'text-amber-600/70':'text-slate-400')}>{item.nota}</p>}
              </div>
              {item.link&&(
                unlocked ? (
                  <Link to={item.link} target={item.target || (item.link.startsWith('http') ? '_blank' : '_self')} className="shrink-0 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-amber-600 border border-slate-200 hover:border-amber-300 rounded-lg px-3 py-1.5 transition-all cursor-pointer hover:shadow-sm hover:translate-x-0.5">
                    {done?'Revisar':'Ir ahora'} <ArrowRight size={12}/>
                  </Link>
                ) : (
                  <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-slate-300 border border-slate-100 rounded-lg px-3 py-1.5 cursor-not-allowed bg-slate-50/50">
                    {item.id==='linkedin'&&!isPaidPlan ? <><Lock size={12}/> Pro</> : <><Lock size={12}/> Bloqueado</>}
                  </span>
                )
              )}
            </div>
          )
        })}
      </div>
      {pctDocs===100&&(
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-teal-50 border-2 border-amber-200 text-center">
          <Trophy size={40} weight="duotone" className="text-amber-500 mx-auto mb-2"/>
          <h3 className="font-black text-slate-800 text-lg mb-1">¡Carpeta 100% lista!</h3>
          <p className="text-sm text-slate-500">Estás listo para postular con confianza.</p>
        </div>
      )}
      {!isUnlocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800 font-medium">
            <span className="font-bold">Nota:</span> Las funcionalidades avanzadas (Optimizador, LinkedIn, etc.) se desbloquearán cuando alcances el <span className="font-bold text-amber-900">100% de progreso</span>.
          </p>
        </div>
      )}

      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={onSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-amber-600 hover:bg-amber-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Pilar 5: Bienestar ──────────────────────────────────────────────────────

function PilarBienestar() {
  const [respira,setRespira] = useState(false)
  const [fase,setFase]       = useState('inhala')
  const [video,setVideo]     = useState(null)
  const VIDEOS = [
    {titulo:'Meditación antes de tu entrevista', duracion:'8 min', url:'https://www.youtube.com/embed/inpok4MKVLM'},
    {titulo:'Cómo manejar el rechazo laboral',   duracion:'10 min',url:'https://www.youtube.com/embed/RcGyVTAoXEU'},
    {titulo:'Motivación para la búsqueda',       duracion:'6 min', url:'https://www.youtube.com/embed/u6XAPnuFjJc'},
  ]
  useEffect(function(){
    if (!respira) return
    const seq=[{n:'inhala',ms:4000},{n:'sostén',ms:7000},{n:'exhala',ms:8000}]
    let i=0; setFase('inhala')
    const tick=function(){ i++; setFase(seq[i%3].n); return setTimeout(tick,seq[i%3].ms) }
    const t=setTimeout(tick,4000)
    return function(){clearTimeout(t)}
  },[respira])
  const faseBg = fase==='inhala'?'bg-blue-400':fase==='sostén'?'bg-violet-400':'bg-teal-400'
  const faseScale = fase==='inhala'?'scale-125':fase==='sostén'?'scale-110':'scale-90'
  return (
    <div className="space-y-10">
      <div className="p-8 rounded-3xl bg-rose-50 border-2 border-rose-100 text-center">
        <h3 className="font-black text-slate-800 text-lg mb-1">Ejercicio de Respiración Guiado</h3>
        <p className="text-sm text-slate-500 mb-6">Técnica 4-7-8. Ideal antes de una entrevista.</p>
        <div className="flex flex-col items-center gap-6">
          <div className={'w-24 h-24 rounded-full transition-all duration-[4000ms] ease-in-out flex items-center justify-center shadow-lg '+(respira?faseBg+' '+faseScale:'bg-slate-200 scale-100')}>
            <span className="text-white text-xs font-black uppercase tracking-widest">{respira?fase:'●'}</span>
          </div>
          <button onClick={function(){setRespira(!respira)}} className={'px-8 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer '+(respira?'bg-rose-100 text-rose-700 border-2 border-rose-200 hover:bg-rose-200':'bg-rose-600 text-white hover:bg-rose-700 shadow-sm')}>
            {respira?'Detener':'Iniciar respiración guiada'}
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-black text-slate-800 text-base mb-4">Meditación y Motivación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VIDEOS.map(function(v,i){return(
            <div key={i}>
              {video===i?(
                <div className="rounded-2xl overflow-hidden aspect-video shadow-md">
                  <iframe width="100%" height="100%" src={v.url+'?autoplay=1'} title={v.titulo} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full"/>
                </div>
              ):(
                <div onClick={function(){setVideo(i)}} className="aspect-video rounded-2xl bg-slate-100 border-2 border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-rose-300 hover:bg-rose-50 transition-colors group">
                  <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform border-2 border-rose-200">
                    <Play size={22} weight="fill" className="text-rose-500 ml-1"/>
                  </div>
                  <div className="text-center px-3">
                    <p className="text-sm font-bold text-slate-700 leading-snug">{v.titulo}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{v.duracion}</p>
                  </div>
                </div>
              )}
            </div>
          )})}
        </div>
      </div>
      <div>
        <h3 className="font-black text-slate-800 text-base mb-4">Para leer cuando el proceso se siente pesado</h3>
        <div className="space-y-3">
          {[
            {titulo:'La regla del 5×5 para reducir la ansiedad',desc:'Si el problema no te importará en 5 años, no le dediques más de 5 minutos de angustia hoy.'},
            {titulo:'Cómo transformar el "no" en aprendizaje',  desc:'Cada rechazo es datos. Analiza tus procesos y mejora sin tomarlo personal.'},
            {titulo:'El poder de las micro-victorias diarias',   desc:'Celebra cada paso, no solo la oferta final. El momentum positivo es tu mejor aliado.'},
          ].map(function(a,i){return(
            <div key={i} className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-rose-200 hover:bg-rose-50/30 transition-colors cursor-pointer">
              <h4 className="font-bold text-slate-800 text-sm mb-1">{a.titulo}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function ProyectoLaboral() {
  const { user, perfil, refreshPerfil, onboardingPendiente, isPaidPlan, refreshJpData } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pilarId,setPilarId] = useState('perfil')
  const [data,setData]       = useState({})
  const [saving,setSaving]   = useState(false)
  const [saved,setSaved]     = useState(false)
  const [justSaved, setJustSaved] = useState(null)  // pilar que acaba de guardarse
  const [modalOfertaIncompleta, setModalOfertaIncompleta] = useState(null) // null | { items, nextPilar }

  function ofertaIncompletos(oferta) {
    const o = oferta || {}
    const LABELS = {
      ikigai_amas:'¿Qué es lo que AMAS?', ikigai_bueno:'¿Para qué eres BUENO/A?',
      ikigai_necesita:'¿Qué NECESITA el mundo de ti?', ikigai_pagar:'¿Por qué podrían PAGARTE?'
    }
    const items = []
    if (String(o.oferta_valor||'').trim().length<20) items.push('Tu oferta de valor (mínimo 20 caracteres)')
    Object.keys(LABELS).forEach(function(k){ if (String(o[k]||'').trim().length<50) items.push(LABELS[k]+' (mínimo 50 caracteres)') })
    return items
  }

  function pilarIncompletos(pilar, d) {
    const IKIGAI_LABELS = {ikigai_amas:'¿Qué AMAS?',ikigai_bueno:'¿Para qué eres BUENO/A?',ikigai_necesita:'¿Qué NECESITA el mundo?',ikigai_pagar:'¿Por qué te PAGARÍAN?'}
    if (pilar==='autoconocimiento') {
      const a = d.autoconocimiento||{}
      const items=[]
      if (!Array.isArray(a.hard_skills)||a.hard_skills.length<2)   items.push('Hard Skills — selecciona al menos 2')
      if (!Array.isArray(a.soft_skills)||a.soft_skills.length<2)   items.push('Soft Skills — selecciona al menos 2')
      if (!Array.isArray(a.power_skills)||a.power_skills.length<2) items.push('Power Skills — selecciona al menos 2')
      if (!Array.isArray(a.top5empresas)||a.top5empresas.filter(function(e){return e&&String(e).trim()}).length<1) items.push('Top 5 Compañías — escribe al menos 1')
      return items
    }
    if (pilar==='recursos') {
      const rawArr = d.recursos ? (Array.isArray(d.recursos)?d.recursos:(d.recursos.recursos||[])) : []
      const activos = rawArr.filter(function(r){return r.tengo===true}).length
      return activos<1 ? ['Marca al menos 1 recurso que ya tienes disponible'] : []
    }
    if (pilar==='semana') {
      const bN = Object.values((d.semana&&d.semana.bloques)||{}).filter(Boolean).length
      return bN<1 ? ['Agrega al menos 1 bloque de horas en tu horario semanal'] : []
    }
    if (pilar==='oferta') { return ofertaIncompletos(d.oferta) }
    return []
  }

  function handleSelectPilar(id) {
    if (id!==pilarId) {
      const faltantes = pilarIncompletos(pilarId, data)
      if (faltantes.length>0) { setModalOfertaIncompleta({items:faltantes, nextPilar:id}); return }
    }
    setPilarId(id)
    setTimeout(function(){ pilarCardRef.current&&pilarCardRef.current.scrollIntoView({behavior:'smooth',block:'start'}) },50)
  }
  const [cargando,setCargando] = useState(true)  // estado de carga inicial
  const [errorCarga, setErrorCarga] = useState(null)  // error al cargar datos
  const [bannerCvCreada, setBannerCvCreada] = useState(false)  // banner tras guardar CV
  const [generandoPdf, setGenerandoPdf] = useState(false) // Trigger gen infografía
  const pilarCardRef         = useRef(null)
  const saveTimeoutRef       = useRef(null)
  const cvAutoPopuladoRef    = useRef(false)  // evita doble ejecución

  const generarInfografia = async () => {
    if (pct < 50) {
      alert("Debes completar al menos el 50% de tu Proyecto Laboral para generar la infografía ejecutiva. ¡Sigue avanzando!")
      return
    }
    setGenerandoPdf(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${apiUrl}/api/cv/infografia-proyecto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const respData = await res.json()
      if (!res.ok) throw new Error(respData.error || 'Error al generar infografía')
      
      // Navigate to the visual report (Fixing respData.data.id mismatch)
      navigate(`/reporte-visual/${respData.id}`)
    } catch(e) {
      alert("Error: " + e.message)
    } finally {
      setGenerandoPdf(false)
    }
  }

  // 1. Carga inicial de datos (sessionStorage -> Supabase)
  useEffect(function(){
    if (!user) return
    let mounted = true
    const CACHE_KEY = `jsp_${user.id}`

    const cargarDatos = async () => {
      // Intento desde caché para velocidad máxima
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached && mounted) {
        try {
          setData(JSON.parse(cached))
          setCargando(false)
        } catch (e) { console.error('Cache corrupto:', e) }
      }

      // Siempre validar contra la DB si no hay caché o si queremos frescura
      try {
        const { data: res, error } = await supabase.from('profiles').select('job_search_profile').eq('id', user.id).maybeSingle()
        if (mounted) {
          if (error) throw error
          if (res?.job_search_profile) {
            setData(res.job_search_profile)
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(res.job_search_profile))
            refreshJpData()
          }
          setCargando(false)
        }
      } catch (err) {
        console.error('Error cargando job_search_profile:', err)
        if (mounted) {
          setErrorCarga('Error al cargar tus datos. Por favor recarga la página.')
          setCargando(false)
        }
      }
    }

    cargarDatos()
    return () => { mounted = false }
    // Depender de user?.id (no de user) para evitar re-cargar y sobrescribir
    // edits en curso cuando el objeto user cambia de referencia (p.ej. al volver
    // a la pestaña tras un refresh de token de Supabase).
  }, [user?.id])

  // 2. Detectar banner de éxito y limpiar URL — solo al montar o cambiar búsqueda
  useEffect(function(){
    const params = new URLSearchParams(location.search)
    if (params.get('exito') === 'cv_creada') {
      setBannerCvCreada(true)
      // Limpiamos la URL sin recargar la página para que el refresh no lo detecte de nuevo
      navigate('/proyecto-laboral', { replace: true })
    }
  }, [location.search, navigate])

  // 3. Auto-poblar perfil si venimos de crear CV y los datos están listos
  useEffect(function(){
    // Solo actuamos si el banner está activo, no estamos cargando, y no lo hemos hecho ya en esta "instancia"
    if (!bannerCvCreada || cargando || !user || !perfil || cvAutoPopuladoRef.current) return
    
    // El lock se pone inmediatamente
    cvAutoPopuladoRef.current = true

    const cvDatos = data?.cv_datos_originales?.datos
    if (!cvDatos) return

    const updates = {}
    // Solo actualizamos lo que esté vacío para no sobreescribir cambios manuales del usuario
    if (!perfil.nombre1    && cvDatos.nombre)     updates.nombre1    = cvDatos.nombre.trim()
    if (!perfil.apellido1  && cvDatos.apellido)   updates.apellido1  = cvDatos.apellido.trim()
    if (!perfil.nombre2    && cvDatos.nombre2)    updates.nombre2    = cvDatos.nombre2.trim()
    if (!perfil.apellido2  && cvDatos.apellido2)  updates.apellido2  = cvDatos.apellido2.trim()
    if (!perfil.telefono1  && cvDatos.telefono)   updates.telefono1  = cvDatos.telefono.trim()
    if (!perfil.ciudad     && cvDatos.ciudad)     updates.ciudad     = cvDatos.ciudad.trim()
    if (!perfil.pais       && cvDatos.pais)       updates.pais       = cvDatos.pais.trim()
    
    // Indicativo especial
    if (!perfil.indicativo1 && (cvDatos.indicativo || cvDatos.pais)) {
      updates.indicativo1 = cvDatos.indicativo || indicativoPorPais(cvDatos.pais)
    }

    // Idiomas (se guardan en job_search_profile.perfil.idiomas)
    const existingJsp = perfil.job_search_profile || {}
    const existingPerfil = existingJsp.perfil || {}
    if ((!existingPerfil.idiomas || existingPerfil.idiomas.length === 0) && cvDatos.idiomas) {
      // Nota: Aquí actualizamos el objeto job_search_profile completo
      const newJsp = {
        ...existingJsp,
        perfil: {
          ...existingPerfil,
          idiomas: cvDatos.idiomas
        }
      }
      updates.job_search_profile = newJsp
    }

    if (Object.keys(updates).length > 0) {
      console.log('Auto-poblando perfil desde CV...', updates)
      // Limpiar caché de perfil para forzar refresco
      sessionStorage.removeItem(`perfil_lp_${user.id}`)
      supabase.from('profiles').update(updates).eq('id', user.id).then(function({ error }){
        if (!error) {
          refreshPerfil() // Refrescar el estado global del perfil
        }
      })
    }
  }, [bannerCvCreada, cargando, user, perfil, data, refreshPerfil])

  const saveData = useCallback(function(nd){
    if (!user) return
    setSaving(true)
    setErrorCarga(null)

    // Sanitizar campos de texto largo antes de guardar (deep-copy oferta para no mutar nd)
    const sanitizedData = { ...nd }
    if (sanitizedData.oferta && sanitizedData.oferta.oferta_valor) {
      sanitizedData.oferta = { ...sanitizedData.oferta, oferta_valor: sanitizarTexto(sanitizedData.oferta.oferta_valor) }
    }

    // Actualizar caché inmediatamente para que al regresar cargue instantáneo
    sessionStorage.setItem(`jsp_${user.id}`, JSON.stringify(sanitizedData))
    supabase.from('profiles').update({job_search_profile:sanitizedData}).eq('id',user.id)
      .then(function(){
        setSaving(false)
        setSaved(true)
        setTimeout(function(){setSaved(false)},2500)
        refreshJpData()  // sincronizar progreso global en AuthContext
      })
      .catch(function(err){
        console.error('Error guardando datos:', err)
        setSaving(false)
        setErrorCarga('Error al guardar. Intenta nuevamente.')
        setTimeout(function(){setErrorCarga(null)},5000)
      })
  },[user])

  // Guarda datos de Mi Perfil directamente en columnas de profiles
  const savePerfil = useCallback(async function(lp){
    if (!user) return
    // Actualizar caché inmediatamente para carga instantánea al volver al pilar
    sessionStorage.setItem(`perfil_lp_${user.id}`, JSON.stringify(lp))
    setSaving(true)
    const nombreCompleto = [lp.nombre1,lp.nombre2,lp.apellido1,lp.apellido2].map(s=>(s||'').trim()).filter(Boolean).join(' ')
    const salario_esperado = lp.salario_monto ? `${lp.salario_monto} ${lp.moneda||'MXN'}` : ''
    const { error } = await supabase.from('profiles').update({
      nombre1: lp.nombre1?.trim()||null,
      nombre2: lp.nombre2?.trim()||null,
      apellido1: lp.apellido1?.trim()||null,
      apellido2: lp.apellido2?.trim()||null,
      indicativo1: lp.indicativo1||null,
      telefono1: lp.telefono1?.trim()||null,
      email_secundario: lp.email_secundario?.trim()||null,
      pais: lp.pais||null,
      ciudad: lp.ciudad?.trim()||null,
      edad: lp.edad ? parseInt(lp.edad) : null,
      salario_esperado: salario_esperado||null,
      prestaciones: lp.prestaciones||[],
      nombre: nombreCompleto||null,
      // Compensación detallada
      pais_prestaciones: lp.pais_prestaciones||null,
      prestaciones_detalle: lp.prestaciones_detalle||{},
      bono_activo: lp.bono_activo||false,
      bono_tipo: lp.bono_tipo||null,
      bono_esquema: lp.bono_esquema||null,
      bono_frecuencia: lp.bono_frecuencia||null,
      bono_pct: lp.bono_pct||null,
      bono_num_salarios: lp.bono_num_salarios||null,
      bono_monto: lp.bono_monto||null,
      variable_monto: lp.variable_monto||null,
      prestaciones_otros: lp.prestaciones_otros||null,
    }).eq('id',user.id)
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(()=>setSaved(false),2500); await refreshPerfil() }
  },[user, refreshPerfil])

  const updatePilar = useCallback(function(key,val){
    const nd = Object.assign({},data,{[key]:val})
    setData(nd); saveData(nd)
  },[data,saveData])

  const handlePilarSave = useCallback(function(pilarId){
    setJustSaved(pilarId)
    // Forzar guardado inmediato al presionar el botón, evitando depender solo del debounce/onChange
    saveData(data)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(function(){ setJustSaved(null) }, 2000)
  },[data, saveData])

  const pct      = calcularProgreso(data, perfil)
  const porPilar = calcularPorPilar(data, perfil)
  const [heroVisible, setHeroVisible] = useState(true)
  const mostrarHeroCompleto = heroVisible
  const pilarObj = PILARES.find(function(p){return p.id===pilarId})||PILARES[0]
  const col      = COLORES[pilarObj.color]||COLORES.violet
  const PilarIcon= pilarObj.icon

  const pctColor = pct>=70?'text-emerald-600':pct>=40?'text-amber-600':'text-violet-700'

  // Auto-colapso del hero al hacer scroll hacia abajo
  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 120) setHeroVisible(false) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Si hay error de carga, mostrar banner
  if (errorCarga && !cargando) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-6 border border-red-200 bg-red-50">
          <WarningCircle size={48} weight="fill" className="text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error al cargar tus datos</h2>
          <p className="text-sm text-slate-600 mb-4">{errorCarga}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    )
  }

  // Si está cargando, mostrar spinner
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <SpinnerGap size={48} className="text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

      {/* ══════════ BANNERS DE ESTADO ══════════ */}
      {bannerCvCreada && (
        <div className="bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
              <span><strong>¡Tu CV fue guardada!</strong> Hemos pre-llenado tu perfil con la información detectada. Revisa y completa los campos en Mi Perfil.</span>
            </div>
            <button onClick={()=>setBannerCvCreada(false)} className="text-emerald-600 hover:text-emerald-800 shrink-0 cursor-pointer">
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>
      )}
      {errorCarga && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <WarningCircle size={18} weight="fill" />
              <span className="font-semibold">{errorCarga}</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ HERO HEADER ══════════ */}
      {!mostrarHeroCompleto && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 py-4 px-6 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            {/* Icono + título */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
                <Target size={16} weight="fill" className="text-violet-300"/>
              </div>
              <span className="text-sm font-black text-white tracking-tight hidden sm:block">Autoconocimiento</span>
            </div>

            {/* Barra de progreso — centrada y más grande */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 w-full max-w-xs">
                <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80
                        ? 'linear-gradient(90deg,#10b981,#34d399)'
                        : pct >= 40
                        ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                        : 'linear-gradient(90deg,#8b5cf6,#a78bfa)'
                    }}
                  />
                </div>
                <span className="text-sm font-black text-white tabular-nums">{pct}%</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">tu progreso actual</span>
            </div>

            {/* Botón "Ver avance" centrado con animación */}
            <button
              onClick={() => setHeroVisible(true)}
              className="shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-violet-900/50"
              style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
            >
              <span>Ver avance</span>
              <span className="inline-block" style={{ animation: 'bounce-y 1s ease-in-out infinite' }}>↓</span>
            </button>
          </div>

          {/* Keyframes inline para la animación */}
          <style>{`
            @keyframes pulse-glow {
              0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4), 0 4px 24px rgba(139,92,246,0.3); }
              50%       { box-shadow: 0 0 0 6px rgba(139,92,246,0), 0 4px 24px rgba(139,92,246,0.6); }
            }
            @keyframes bounce-y {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(3px); }
            }
          `}</style>
        </div>
      )}
      {mostrarHeroCompleto && <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            {/* Left: text */}
            <div className="flex-1">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-200/50 shadow-sm">
                  <Target size={16} weight="fill" className="text-violet-600"/>
                </div>
                <span className="text-[11px] font-black text-violet-600 uppercase tracking-[0.15em]">Marco PMI · Planificación Estratégica</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
                Sé Gerente de Proyecto<br/>
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">de tu Búsqueda Laboral</span>
              </h1>

              <p className="text-slate-500 text-lg leading-relaxed max-w-xl mb-6 font-medium">
                Tómate este tiempo para reflexionar. Deja de lado urgencias y concéntrate en
                entender <span className="font-bold text-slate-800 underline decoration-violet-300 decoration-2 underline-offset-4">muy bien tu propio perfil</span>.
                Es el mejor momento para evaluar, reevaluar y avanzar con una estrategia de última generación.
              </p>

              {/* Stat inline - Premium Glass */}
              <div className="inline-flex items-center gap-3 bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-2xl px-5 py-3.5 group transition-all hover:scale-[1.02]">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-200">73%</div>
                <span className="text-[13px] font-bold text-slate-600 leading-tight max-w-[220px]">de quienes lo completan <span className="text-violet-600">ganan claridad inmediata</span> sobre su oferta de valor</span>
              </div>

              {/* Save indicator */}
              <div className="mt-6 h-6">
                {saving&&<span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold tracking-wide uppercase"><SpinnerGap size={14} className="animate-spin text-violet-500"/> Sincronizando en la nube...</span>}
                {saved &&<span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100 shadow-sm animate-fade-in"><CheckCircle size={14} weight="fill"/> Guardado Seguro</span>}
              </div>
            </div>

            {/* Right: progress card — World Class Design */}
            <div className="md:w-[340px] shrink-0">
              <div className="relative group overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/40 border border-slate-800">
                {/* Mesh Gradient Background Effect */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-violet-600/30 blur-[100px] rounded-full group-hover:bg-violet-600/40 transition-colors duration-1000"/>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full group-hover:bg-indigo-600/30 transition-colors duration-1000"/>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estatus General</p>
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-lg px-2 py-1 border border-white/5">
                      <span className="text-[10px] font-bold text-slate-300">FASE 1</span>
                    </div>
                  </div>

                  {/* Circle - Larger and more Premium */}
                  <div className="relative w-36 h-36 mx-auto mb-8 transform group-hover:scale-105 transition-transform duration-700">
                    <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="48" strokeWidth="10" stroke="#101827" fill="none"/>
                      <circle cx="56" cy="56" r="48" strokeWidth="10"
                        stroke={pct>=80?'#10b981':pct>=50?'#f59e0b':'#8b5cf6'}
                        strokeLinecap="round" fill="none"
                        strokeDasharray={`${2*Math.PI*48}`}
                        strokeDashoffset={`${2*Math.PI*48*(1-pct/100)}`}
                        style={{transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}}/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-5xl font-black text-white tracking-tighter">{pct}</span>
                        <span className="text-lg font-black text-white/40">%</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Óptimo</span>
                    </div>
                  </div>

                  {/* High Contrast Legend */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-8 bg-white/5 rounded-2xl p-4 border border-white/5">
                    {[
                      {label:'Perfil',            id:'perfil',           color:'bg-indigo-500'},
                      {label:'Autoconocimiento',  id:'autoconocimiento', color:'bg-violet-500'},
                      {label:'Recursos',          id:'recursos',         color:'bg-blue-400'},
                      {label:'Semana',            id:'semana',           color:'bg-teal-400'},
                      {label:'Oferta',            id:'oferta',           color:'bg-rose-500'},
                      {label:'Documentos',        id:'documentos',       color:'bg-amber-400'},
                    ].map(function(l){
                      const v = porPilar[l.id] || 0
                      return(
                      <div key={l.label} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{l.label}</span>
                          <span className={`text-[11px] font-black ${v>=80?'text-emerald-400':v>=40?'text-amber-400':'text-slate-400'}`}>{v}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                          <div className={`h-full ${l.color} transition-all duration-1000`} style={{width: v+'%'}}/>
                        </div>
                      </div>
                    )})}
                  </div>

                  {/* Generar PDF Infográfico CTA — Glow Effect */}
                  <button 
                    onClick={generarInfografia}
                    disabled={generandoPdf}
                    className="group/btn w-full relative overflow-hidden bg-white text-slate-900 font-black text-xs py-4 rounded-[1.25rem] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] disabled:opacity-50"
                    title={pct < 50 ? "Requiere 50% de completitud" : "Genera tu presentación ejecutiva"}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"/>
                    <div className="relative z-10 flex items-center justify-center gap-2 group-hover/btn:text-white transition-colors">
                      {generandoPdf ? <SpinnerGap size={18} className="animate-spin" /> : <Sparkle size={18} weight="fill" className="text-violet-600 group-hover/btn:text-white transition-colors" />}
                      <span className="tracking-widest uppercase">{generandoPdf ? 'Calculando...' : 'Infografía Ejecutiva'}</span>
                    </div>
                  </button>
                  <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest mt-4">
                    Impulsado por Tecnología de Última Generación ELVIA®
                  </p>
                </div>
              </div>
            </div>
          </div>
          {pct > 0 && (
            <div className="max-w-5xl mx-auto px-6 md:px-10 pb-5 flex justify-end">
              <button
                onClick={() => setHeroVisible(false)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-md"
              >
                Ocultar avance ↑
              </button>
            </div>
          )}
        </div>
      </div>}

      {/* ══════════ DASHBOARD RESUMEN ══════════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-10 mt-8">
        <DashboardResumen
          data={data}
          pct={pct}
          onSelect={handleSelectPilar}
          perfil={perfil}
          activePilar={pilarId}
        />
      </div>

      {/* ══════════ CUERPO — Pilares ══════════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-10 mt-6" ref={pilarCardRef}>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          <div className={'flex items-center gap-3 px-6 py-5 border-b border-slate-100 '+col.header}>
            <PilarIcon size={22} weight="duotone" className={col.icon}/>
            <div>
              <h2 className="font-black text-slate-800 text-lg">{pilarObj.label}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {pilarId==='perfil'          &&'Tu identidad profesional · Datos, compensación y aspiraciones'}
                {pilarId==='autoconocimiento'&&'Iniciación · Define tu punto de partida y tu objetivo'}
                {pilarId==='recursos'        &&'Planificación · Entiende la inversión real de tu búsqueda'}
                {pilarId==='semana'          &&'Ejecución · Comprométete con el tiempo que dedicarás'}
                {pilarId==='oferta'          &&'Diferenciación · Define qué te hace único como candidato'}
                {pilarId==='documentos'      &&'Monitoreo · Estado de tus materiales de candidatura'}
              </p>
            </div>
          </div>
          <div className="p-6 md:p-8">
            {pilarId==='perfil'        &&<PilarMiPerfil perfil={perfil} extraData={data.perfil} onChange={function(v){updatePilar('perfil',v)}} onSavePerfil={savePerfil} saving={saving} isPaidPlan={isPaidPlan} data={data} userId={user?.id} pct={pct}/>}
            {pilarId==='autoconocimiento'&&<PilarAutoconocimiento data={data.autoconocimiento} onChange={function(v){updatePilar('autoconocimiento',v)}} onSave={function(){handlePilarSave('autoconocimiento')}} justSaved={justSaved==='autoconocimiento'}/>}
            {pilarId==='recursos'      &&<PilarRecursos         data={data.recursos}         onChange={function(v){updatePilar('recursos',v)}} onSave={function(){handlePilarSave('recursos')}} justSaved={justSaved==='recursos'} pais={perfil?.pais_prestaciones || perfil?.pais || ''}/>}
            {pilarId==='semana'        &&<PilarSemana           data={data.semana}           onChange={function(v){updatePilar('semana',v)}} onSave={function(){handlePilarSave('semana')}} justSaved={justSaved==='semana'}/>}
            {pilarId==='oferta'        &&<PilarOfertaDeValor    data={data.oferta}           onChange={function(v){updatePilar('oferta',v)}} onSave={function(){handlePilarSave('oferta')}} justSaved={justSaved==='oferta'}/>}
            {pilarId==='documentos'    &&<PilarDocumentos       data={data.documentos}       onChange={function(v){updatePilar('documentos',v)}} onSave={function(){handlePilarSave('documentos')}} justSaved={justSaved==='documentos'} pct={pct} isPaidPlan={isPaidPlan}/>}
          </div>
        </div>

        {/* Feature preview grid — solo mientras onboarding pendiente */}
        {onboardingPendiente && (
          <div className="mt-8 mb-10">
            <FeaturePreviewGrid />
          </div>
        )}
      </div>

      {/* ── Modal: navegación con oferta incompleta ── */}
      {modalOfertaIncompleta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor:'rgba(15,10,40,0.55)', backdropFilter:'blur(4px)'}}
          onClick={function(e){ if(e.target===e.currentTarget) setModalOfertaIncompleta(null) }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2>
                <p className="text-rose-100 text-xs mt-0.5">Mi oferta de valor tiene campos sin completar</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Si sales ahora, tu progreso no llegará al 100%. Faltan:</p>
              <ul className="space-y-2 mb-6">
                {modalOfertaIncompleta.items.map(function(item, i){
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>
                      {item}
                    </li>
                  )
                })}
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={function(){ setModalOfertaIncompleta(null) }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Volver a completar
                </button>
                <button
                  onClick={function(){
                    const next = modalOfertaIncompleta.nextPilar
                    setModalOfertaIncompleta(null)
                    setPilarId(next)
                    setTimeout(function(){ pilarCardRef.current&&pilarCardRef.current.scrollIntoView({behavior:'smooth',block:'start'}) },50)
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Salir de todas formas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
