// Dashboard — Centro de Control Ejecutivo B2B & Bienestar Emocional (ELVIA®)
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { calcularProgreso, calcPerfilPts, calcularPorPilar } from '../utils/progresoLaboral'
import { useTrackEvent } from '../hooks/useTrackEvent'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase,
  ChartLineUp, ArrowRight, Sparkle,
  Target, Ticket, Kanban, Bell, CheckCircle,
  Clock, Smiley, SmileyMeh, SmileySad, SmileyAngry,
  SmileyBlank, SmileyNervous, Heart, Info,
  ShieldCheck, ArrowUpRight, TrendUp,
  CalendarBlank, User
} from '@phosphor-icons/react'
import PlanBanner from '../components/common/PlanBanner'
import HelpBadge from '../components/common/HelpBadge'
import { useTenant } from '../context/TenantContext'

// ─── Constantes de Bienestar ──────────────────────────────────────────────────
const EMOCIONES = {
  confiado:   { label: 'Confiado',    bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600', Icon: Smiley },
  motivado:   { label: 'Motivado',    bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-600',    Icon: Smiley },
  tranquilo:  { label: 'Tranquilo',   bg: 'bg-teal-50 border-teal-200',       text: 'text-teal-600',    Icon: SmileyBlank },
  cansado:    { label: 'Cansado',     bg: 'bg-slate-50 border-slate-200',     text: 'text-slate-600',   Icon: SmileyMeh },
  ansioso:    { label: 'Ansioso',     bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-600',   Icon: SmileyNervous },
  frustrado:  { label: 'Frustrado',   bg: 'bg-orange-50 border-orange-200',   text: 'text-orange-600',  Icon: SmileyAngry },
  triste:     { label: 'Triste',      bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-600',    Icon: SmileySad },
}

const RADAR_EJES = [
  { id: 'energia',     label: 'Energía',     color: 'text-amber-600',  bar: 'bg-amber-500'  },
  { id: 'confianza',   label: 'Confianza',   color: 'text-emerald-600',bar: 'bg-emerald-500'},
  { id: 'enfoque',     label: 'Enfoque',     color: 'text-blue-600',   bar: 'bg-blue-500'   },
  { id: 'ansiedad',    label: 'Ansiedad',    color: 'text-orange-600', bar: 'bg-orange-500' },
  { id: 'resiliencia', label: 'Resiliencia', color: 'text-violet-600', bar: 'bg-violet-500' },
]

// ─── Componente Métrica de Actividad ──────────────────────────────────────────
function MetricCard({ icon: Icon, iconBg, label, value, sub, to, isEmpty, ctaLabel, trend }) {
  const content = (
    <div className="bg-white border border-slate-100/80 rounded-2xl p-5 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 group">
      <div className="flex justify-between items-center mb-2">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={18} weight="duotone" className="text-white" />
        </div>
        {trend && (
          <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
            ↑ {trend.delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 font-semibold mt-1.5">{sub}</p>}
      </div>
      {to && (
        <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
            {isEmpty && ctaLabel ? ctaLabel : 'Abrir'}
          </span>
          <ArrowRight size={12} weight="bold" className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition-all" />
        </div>
      )}
    </div>
  )
  return to ? <Link to={to} className="block">{content}</Link> : <div>{content}</div>
}

export default function Dashboard() {
  const { user, perfil, jpData, isPaidPlan, trialExpired, trialDaysLeft, refreshUsage } = useAuth()
  const { tenant, isB2B } = useTenant()

  const [metricas, setMetricas] = useState({
    cvsOptimizados: null,
    cvsVsVacante: null,
    matchPromedio: null,
    matchTendencia: null,
    vacantesGuardadas: null,
  })
  const [loadingMetricas, setLoadingMetricas] = useState(true)
  const [codigoRedimido, setCodigoRedimido]   = useState(null)
  const [proyectoPct, setProyectoPct]         = useState(null)
  const [pipelineStats, setPipelineStats]     = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [bienestar, setBienestar] = useState({ checkins: {}, radar: {} })
  const notifRef = useRef(null)

  const track = useTrackEvent()
  useEffect(() => { track('page_view', 'dashboard') }, [])

  const nombre = perfil?.nombre1
    ? `${perfil.nombre1}${perfil.apellido1 ? ' ' + perfil.apellido1 : ''}`
    : user?.email?.split('@')[0] || 'Ejecutivo'

  const iniciales = perfil?.nombre1 
    ? `${perfil.nombre1.substring(0, 1)}${perfil.apellido1 ? perfil.apellido1.substring(0, 1) : ''}`.toUpperCase()
    : 'EJ'

  const saludo = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  // Calcular ID de la semana actual
  function getWeekId() {
    const d = new Date()
    const jan1 = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7) + '_' + d.getFullYear()
  }
  const currentWeek = `semana_${getWeekId()}`

  // Cierre de dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const cargarMetricas = async () => {
      setLoadingMetricas(true)
      const [cvRes, jobsRes, codeRes, profileRes] = await Promise.all([
        supabase.from('cv_results').select('tipo, metadata, created_at').eq('user_id', user.id),
        supabase.from('saved_jobs').select('estado'),
        supabase
          .from('code_redemptions')
          .select('plan_granted, redeemed_at, access_codes(code)')
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('profiles').select('bienestar_data').eq('id', user.id).single()
      ])

      const cvs         = cvRes.data || []
      const optimizados = cvs.filter(c => c.tipo === 'optimize' && !c.contenido?.trim()?.startsWith('{')).length
      const matches     = cvs.filter(c => c.tipo === 'match')
      const matchScores = matches
        .map(c => c.metadata?.matchScore)
        .filter(s => typeof s === 'number' && s > 0)
      const promedio = matchScores.length
        ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
        : null

      // Tendencia semanal
      const ahora = Date.now()
      const semana = 7 * 24 * 60 * 60 * 1000
      const scoresEstaSemana = matches
        .filter(c => (ahora - new Date(c.created_at).getTime()) < semana)
        .map(c => c.metadata?.matchScore).filter(s => typeof s === 'number' && s > 0)
      const scoresSemPasada = matches
        .filter(c => { const d = ahora - new Date(c.created_at).getTime(); return d >= semana && d < 2 * semana })
        .map(c => c.metadata?.matchScore).filter(s => typeof s === 'number' && s > 0)
      const avgEsta = scoresEstaSemana.length ? Math.round(scoresEstaSemana.reduce((a, b) => a + b, 0) / scoresEstaSemana.length) : null
      const avgPasada = scoresSemPasada.length ? Math.round(scoresSemPasada.reduce((a, b) => a + b, 0) / scoresSemPasada.length) : null
      
      let matchTendencia = null
      if (avgEsta !== null && avgPasada !== null) {
        const diff = avgEsta - avgPasada
        matchTendencia = {
          dir:   diff > 0 ? 'up' : 'flat',
          delta: diff !== 0 ? `${diff > 0 ? '+' : ''}${diff}%` : null,
          prev:  `vs ${avgPasada}% sem. anterior`,
        }
      } else if (avgEsta !== null) {
        matchTendencia = { dir: 'up', delta: `+${avgEsta}%`, prev: 'Primeros análisis' }
      }

      // Pipeline
      const savedJobs = jobsRes.data || []
      const etapasCount = {}
      savedJobs.forEach(j => {
        const e = j.estado || 'Descubierto'
        etapasCount[e] = (etapasCount[e] || 0) + 1
      })
      setPipelineStats({
        total:        savedJobs.filter(j => (j.estado || 'Descubierto') !== 'No avanzó').length,
        entrevistas:  etapasCount['En entrevistas'] || 0,
        ofertas:      etapasCount['Ofertado'] || 0,
        perdidas:     etapasCount['No avanzó'] || 0,
      })

      // Bienestar Data
      if (profileRes.data?.bienestar_data) {
        setBienestar(profileRes.data.bienestar_data)
      }

      // Progreso proyecto
      setProyectoPct(calcularProgreso(jpData || {}, perfil || {}))

      setMetricas({
        cvsOptimizados:   optimizados,
        cvsVsVacante:     matches.length,
        matchPromedio:    promedio,
        matchTendencia:   matchTendencia,
        vacantesGuardadas: savedJobs.filter(j => (j.estado || 'Descubierto') !== 'No avanzó').length,
      })
      if (codeRes.data) setCodigoRedimido(codeRes.data)
      setLoadingMetricas(false)
    }
    cargarMetricas()
  }, [user?.id, jpData, perfil])

  // Desglose del proyecto de carrera (Pilares)
  const jp = jpData || {}
  const porPilar = calcularPorPilar(jp, perfil)

  const pilares = [
    { label: 'Mi Perfil',           pct: porPilar.perfil,           completed: porPilar.perfil >= 100 },
    { label: 'Competencias',         pct: porPilar.autoconocimiento, completed: porPilar.autoconocimiento >= 100 },
    { label: 'Mi oferta de valor',   pct: porPilar.oferta,           completed: porPilar.oferta >= 100 },
    { label: 'Horario semanal',      pct: porPilar.semana,           completed: porPilar.semana >= 100 },
    { label: 'Gastos',               pct: porPilar.recursos,         completed: porPilar.recursos >= 100 },
    { label: 'Optimizador de CV',    pct: porPilar.documentos,       completed: porPilar.documentos >= 100 },
  ]

  // Notificaciones dinámicas basadas en progreso del usuario
  const notificaciones = []
  if (proyectoPct !== null && proyectoPct < 100) {
    notificaciones.push({
      id: 'proyecto',
      title: 'Autoconocimiento incompleto',
      desc: 'Completa tus pilares estratégicos para habilitar todas las descargas.',
      to: '/proyecto-laboral',
      type: 'warning'
    })
  }
  if (metricas.cvsOptimizados === 0) {
    notificaciones.push({
      id: 'cv_opt',
      title: 'Crea tu CV Inicial',
      desc: 'Construye tu CV con el estándar premium Harvard, guiado paso a paso por ELVIA.',
      to: '/cv-desde-cero',
      type: 'info'
    })
  }
  if (isB2B) {
    notificaciones.push({
      id: 'notif_welcome',
      title: 'Ecosistema corporativo',
      desc: `Tu cuenta de ${tenant.name} está validada con acceso ejecutivo.`,
      to: '/mi-plan',
      type: 'success'
    })
  }

  // Calcular check-ins reales de las últimas 2 semanas (14 días)
  const ultimos14Dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = i === 0 ? 'Hoy' : d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
    return { key, label, data: bienestar.checkins?.[key] || null }
  }).reverse()

  // Calcular radar de la semana actual
  const radarSemanal = bienestar.radar?.[currentWeek] || {}
  const radarValores = RADAR_EJES.map(e => ({
    ...e,
    valor: radarSemanal[e.id] || 0 // Escala de 0 a 5
  }))
  const radarCompleto = radarValores.some(v => v.valor > 0)

  // Medidor circular SVG de Match (Circular Gauge)
  const matchScore = metricas.matchPromedio !== null ? metricas.matchPromedio : 0
  const isDemoGauge = metricas.matchPromedio === null

  // Fórmulas para círculo de progreso
  const radioGauge = 55
  const circunferenciaGauge = 2 * Math.PI * radioGauge
  const strokeOffset = circunferenciaGauge - (circunferenciaGauge * (isDemoGauge ? 0 : matchScore)) / 100

  const val = (v, suffix = '') => loadingMetricas ? '—' : `${v ?? 0}${suffix}`

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 space-y-8 bg-slate-50/50 min-h-screen text-slate-700 font-sans leading-relaxed animate-in fade-in duration-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ── Banners de Trial ── */}
      {!isPaidPlan && !trialExpired && trialDaysLeft <= 3 && (
        <PlanBanner
          tipo="trial_warning"
          mensaje={`Te quedan ${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} de acceso completo.`}
          ctaText="Ver planes →"
        />
      )}
      {!isPaidPlan && trialExpired && (
        <PlanBanner
          tipo="trial_expired"
          mensaje="Tu período de prueba de 14 días ha terminado."
          ctaText="Ver planes →"
        />
      )}

      {/* ── CABECERA APPLE PREMIUM B2B ── */}
      <header className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            {iniciales}
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] flex items-center gap-1">
              <Sparkle size={10} weight="fill" />
              {saludo}
            </p>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
              {nombre}
              <span className="no-print inline-block align-middle ml-2"><HelpBadge id="dashboard.main" /></span>
            </h1>
            <p className="text-[11px] text-slate-400 font-bold tracking-wide uppercase mt-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" weight="fill" /> Ecosistema de Carrera · {isB2B ? `${tenant.name} Corporativo` : 'ELVIA® Pro'}
            </p>
          </div>
        </div>

        {/* Acciones e Interacciones */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          
          {/* Campana de Notificaciones */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                showNotifications 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200'
              }`}
            >
              <Bell size={18} weight={showNotifications ? 'fill' : 'duotone'} />
              {notificaciones.length > 1 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 border border-white rounded-full animate-pulse" />
              )}
            </button>

            {/* Dropdown de Alertas */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/98 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 p-4 z-30 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 mb-2.5">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Sugerencias Ejecutivas</h4>
                  <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Foco</span>
                </div>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {notificaciones.map((n, i) => (
                    <Link 
                      key={n.id || i}
                      to={n.to} 
                      onClick={() => setShowNotifications(false)}
                      className="block p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                    >
                      <div className="flex gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'warning' ? 'bg-amber-400' : n.type === 'success' ? 'bg-emerald-400' : 'bg-indigo-400'
                        }`} />
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{n.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── 🌟 EL HERO: STATUS AUTOCONOCIMIENTO 🌟 ── */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.25em] flex items-center gap-1.5">
              <Target size={14} weight="fill" /> Estatus Estratégico
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">Status Autoconocimiento</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Este módulo consolida la claridad de tus metas y tu oferta de valor única en el mercado.</p>
          </div>
          <Link to="/proyecto-laboral" className="self-start sm:self-center shrink-0 flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all active:scale-95 shadow-sm">
            {proyectoPct === 0 ? 'Iniciar' : 'Modificar Pilares'} <ArrowRight size={12} weight="bold" />
          </Link>
        </div>

        {/* Barra de progreso estilo cristal templado */}
        <div className="mt-6 bg-slate-50 border border-slate-100/50 p-5 rounded-2xl relative">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grado de Autoconocimiento</span>
            <span className="text-sm font-black text-indigo-600">{val(proyectoPct, '%')}</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
              style={{ width: `${proyectoPct ?? 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-2.5 italic leading-relaxed">
            {proyectoPct === 100 ? '🎉 Autoconocimiento completado — Has estructurado tu oferta de valor y estás listo para postular con estrategia ejecutiva.' :
             proyectoPct >= 70  ? 'Excelente avance de autoconocimiento. Revisa tus pilares para habilitar tu infografía.' :
             proyectoPct >= 40  ? 'Buen progreso. Define tus bloques de horario y habilidades para avanzar.' :
             'Define tus habilidades y aspiraciones para estructurar tu perfil estratégico.'}
          </p>
        </div>

        {/* Grilla responsiva de los 6 Pilares */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 mt-6 pt-5 border-t border-slate-100">
          {pilares.map((p, i) => (
            <div key={i} className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
              p.completed ? 'bg-slate-50/50 border-slate-100/60' : 'bg-white border-dashed border-slate-200'
            }`}>
              {p.completed ? (
                <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
              ) : (
                <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-200 shrink-0 flex items-center justify-center text-[9px] font-black text-slate-400">
                  {p.pct}%
                </div>
              )}
              <span className={`text-[11px] font-bold truncate ${p.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN CENTRAL A DOS COLUMNAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8">
        
        {/* COLUMNA IZQUIERDA: RENDIMIENTO & METRICAS */}
        <div className="space-y-8">
          
          {/* Rendimiento de Carrera (Circular Gauge) */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between min-h-[300px]">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.25em] flex items-center gap-1.5">
                <ChartLineUp size={14} weight="fill" /> Rendimiento de Carrera
              </p>
              <h3 className="text-base font-black text-slate-800 tracking-tight mt-1">Historial de Match Promedio</h3>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Compatibilidad de tu CV frente al mercado objetivo.</p>
            </div>

            {/* Dial circular SVG Premium de Éxito */}
            <div className="relative my-4 flex items-center justify-center">
              
              <svg viewBox="0 0 200 200" className="w-full h-full max-h-[160px] overflow-visible select-none">
                <defs>
                  <linearGradient id="indigoPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                {/* Círculo base de fondo */}
                <circle cx="100" cy="100" r={radioGauge} fill="none" stroke="#f1f5f9" strokeWidth="10" />

                {/* Anillo de Match Score */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r={radioGauge} 
                  fill="none" 
                  stroke={isDemoGauge ? "#cbd5e1" : "url(#indigoPurpleGrad)"} 
                  strokeWidth="10" 
                  strokeDasharray={circunferenciaGauge}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round" 
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Meta discontinua exterior de Target (85%) */}
                <circle cx="100" cy="100" r="66" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                <text x="100" y="27" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="black" letterSpacing="1" className="uppercase">Target 85%</text>

                {/* Texto Central */}
                <text x="100" y="102" textAnchor="middle" fill="#1e293b" fontSize="24" fontWeight="900" letterSpacing="-1">
                  {val(isDemoGauge ? 0 : matchScore, '%')}
                </text>
                <text x="100" y="120" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="black" letterSpacing="1" className="uppercase">
                  {isDemoGauge ? 'Simulado' : 'Match Promedio'}
                </text>
              </svg>

              {/* Botón dinámico en el Gauge */}
              {isDemoGauge && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center mt-12 bg-white px-2 py-0.5 border border-slate-100 rounded-full shadow-sm">
                  <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Sin análisis aún</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-3 border-t border-slate-50">
              <span className="flex items-center gap-1"><Clock /> Frecuencia de compatibilidad</span>
              <Link to="/cv-vs-job" className="text-indigo-600 hover:text-indigo-700 font-black">
                Medir Match →
              </Link>
            </div>
          </section>

          {/* Grilla Compacta de Actividad */}
          <section className="grid grid-cols-2 gap-4">
            <MetricCard
              icon={FileMagnifyingGlass}
              iconBg="bg-indigo-500"
              label="CVs generados"
              value={val(metricas.cvsOptimizados)}
              sub={!loadingMetricas && (metricas.cvsOptimizados ?? 0) === 0 ? 'Sin generar' : 'estándar Harvard'}
              to="/cv-desde-cero"
              isEmpty={!loadingMetricas && (metricas.cvsOptimizados ?? 0) === 0}
              ctaLabel="Crear mi CV"
            />
            <MetricCard
              icon={MagnifyingGlass}
              iconBg="bg-blue-500"
              label="CVs vs Vacante"
              value={val(metricas.cvsVsVacante)}
              sub={!loadingMetricas && (metricas.cvsVsVacante ?? 0) === 0 ? 'Sin medir' : 'coincidencias de vacantes'}
              to="/cv-vs-job"
              isEmpty={!loadingMetricas && (metricas.cvsVsVacante ?? 0) === 0}
              ctaLabel="Medir Match"
            />
          </section>
        </div>

        {/* COLUMNA DERECHA: BIENESTAR EMOCIONAL (HERO BLOCK DE APOYO) */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.25em] flex items-center gap-1.5">
                  <Heart size={14} weight="fill" className="text-rose-500 animate-pulse" /> Soporte Emocional
                </p>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1">Bienestar de Búsqueda</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Monitorear tu salud mental influye directamente en tu confianza en entrevistas.</p>
              </div>
              <Link to="/bienestar" className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl transition-all active:scale-95">
                Ver Bienestar
              </Link>
            </div>

            {/* Sub-Bloque 1: Micro-Calendario Cromático de las últimas 2 semanas (14 días) */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-100/50 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><CalendarBlank /> Estado de Ánimo Diario</span>
                <Link to="/bienestar" className="text-[9px] font-bold text-indigo-600 hover:underline">Check-in diario</Link>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {ultimos14Dias.map((d, i) => {
                  const em = d.data ? EMOCIONES[d.data.emocion] : null
                  const Icon = em ? em.Icon : null
                  return (
                    <div key={d.key || i} className="flex flex-col items-center gap-1" title={em ? `Ánimo: ${em.label}` : 'Sin registro'}>
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        em ? em.bg + ' ' + em.text + ' ' + em.bg.replace('bg-', 'border-').split(' ')[0] : 'bg-white border-dashed border-slate-200'
                      }`}>
                        {Icon ? <Icon size={14} weight="fill" /> : <span className="text-slate-300 text-xs">·</span>}
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase">{d.label.slice(0, 3)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sub-Bloque 2: Radar de la Semana en Barras Horizontales */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-100/50 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><TrendUp /> Radar de Bienestar Semanal</span>
                <Link to="/bienestar" className="text-[9px] font-bold text-indigo-600 hover:underline">Evaluar mi semana</Link>
              </div>

              <div className="space-y-3">
                {radarValores.map(eje => (
                  <div key={eje.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-600 w-16 truncate leading-none">{eje.label}</span>
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${eje.bar}`} 
                        style={{ width: `${(eje.valor / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-black w-6 text-right leading-none ${eje.color}`}>{eje.valor}/5</span>
                  </div>
                ))}
              </div>

              {!radarCompleto && (
                <div className="mt-4 pt-3 border-t border-slate-200/55 text-center">
                  <p className="text-[9px] text-slate-400 font-semibold mb-2">Aún no has registrado tu radar emocional de esta semana.</p>
                  <Link to="/bienestar" className="inline-block text-[9px] font-black text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-xl shadow-sm hover:bg-indigo-50 transition-colors">
                    Iniciar Evaluación Semanal
                  </Link>
                </div>
              )}
            </div>
          </div>

          <p className="text-[9.5px] text-slate-400 text-center leading-relaxed mt-4 italic font-medium">
            💡 Mantener equilibrada tu salud emocional reduce la ansiedad en entrevistas de forma comprobada.
          </p>
        </section>
      </div>

      {/* ── PIPELINE RESUMEN ── */}
      {pipelineStats && pipelineStats.total > 0 && (
        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                <Kanban size={18} weight="duotone" />
              </div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Estatus de Postulaciones</h3>
            </div>
            <Link to="/pipeline" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 active:scale-95 transition-transform">
              Abrir Pipeline Completo <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Postulaciones Activas', value: pipelineStats.total,       color: 'text-blue-600',  bg: 'bg-blue-50/50 border-blue-100/50' },
              { label: 'En Entrevistas',       value: pipelineStats.entrevistas,  color: 'text-green-600', bg: 'bg-green-50/50 border-green-100/50' },
              { label: 'Ofertas Recibidas',     value: pipelineStats.ofertas,      color: 'text-amber-600', bg: 'bg-amber-50/50 border-amber-100/50' },
              { label: 'Descartados / Cerrados', value: pipelineStats.perdidas,     color: 'text-rose-500',   bg: 'bg-rose-50/50 border-rose-100/50' },
            ].map((s, idx) => (
              <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-md ${s.bg}`}>
                <p className={`text-3xl font-black ${s.color} tracking-tight`}>{s.value}</p>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
