// Dashboard — Métricas ejecutivas de uso + visualización interactiva premium (Apple Style)
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { calcularProgreso, calcPerfilPts } from '../utils/progresoLaboral'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase,
  ChartLineUp, Coins, ArrowRight, Sparkle,
  Target, Ticket, Kanban, Bell, CheckCircle,
  Clock, SuitcaseSimple, Info, ShieldCheck, ArrowUpRight,
  ChartBar, Sparkle as SparkleFill
} from '@phosphor-icons/react'
import PlanBanner from '../components/common/PlanBanner'
import HelpBadge from '../components/common/HelpBadge'

// ─── Componente métrica ejecutiva ─────────────────────────────────────────────
function MetricCard({ icon: Icon, iconBg, label, value, sub, to, isEmpty, ctaLabel, trend }) {
  const content = (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col gap-4 h-full transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 group">
      <div className="flex justify-between items-start">
        <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={22} weight="duotone" className="text-white" />
        </div>
        {trend && (
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
            trend.dir === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {trend.dir === 'up' && '↑'} {trend.delta || 'Estable'}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-black text-slate-800 leading-none mt-1 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">{sub}</p>}
      </div>

      {to && (
        <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
            {isEmpty && ctaLabel ? ctaLabel : 'Abrir herramienta'}
          </span>
          <ArrowRight size={14} weight="bold" className="text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
        </div>
      )}
    </div>
  )
  return to ? <Link to={to} className="block">{content}</Link> : <div>{content}</div>
}

// Datos demo en caso de que no haya análisis de vacantes
const MOCK_CHART_DATA = [
  { label: 'Lun', score: 60, title: 'Líder Técnico', company: 'Telefónica B2B', date: 'Lun' },
  { label: 'Mar', score: 72, title: 'Analista BI', company: 'Global Tech', date: 'Mar' },
  { label: 'Mié', score: 68, title: 'Gerente General', company: 'Future Corp', date: 'Mié' },
  { label: 'Jue', score: 85, title: 'Especialista Scrum', company: 'Agile SA', date: 'Jue' },
  { label: 'Vie', score: 80, title: 'Director de Operaciones', company: 'Enterprise Inc', date: 'Vie' },
  { label: 'Sáb', score: 92, title: 'Gerente de Proyectos', company: 'Telefónica B2B', date: 'Sáb' },
  { label: 'Dom', score: 88, title: 'Consultor SAP', company: 'Advisory Group', date: 'Dom' },
]

export default function Dashboard() {
  const { user, perfil, creditosRestantes, LIMITE_PLAN, usageCount, isPaidPlan, trialExpired, trialDaysLeft, jpData } = useAuth()

  const [metricas, setMetricas] = useState({
    cvsOptimizados: null,
    cvsVsVacante: null,
    matchPromedio: null,
    matchTendencia: null,
    vacantesGuardadas: null,
  })
  const [chartData, setChartData] = useState([])
  const [loadingMetricas, setLoadingMetricas] = useState(true)
  const [codigoRedimido, setCodigoRedimido]   = useState(null)
  const [proyectoPct, setProyectoPct]         = useState(null)
  const [pipelineStats, setPipelineStats]     = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const notifRef = useRef(null)

  const nombre = perfil?.nombre1
    ? `${perfil.nombre1}${perfil.apellido1 ? ' ' + perfil.apellido1 : ''}`
    : user?.email?.split('@')[0] || 'Ejecutivo'

  // Iniciales del usuario para el avatar Apple
  const iniciales = perfil?.nombre1 
    ? `${perfil.nombre1.substring(0, 1)}${perfil.apellido1 ? perfil.apellido1.substring(0, 1) : ''}`.toUpperCase()
    : 'EJ'

  const saludo = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

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
      const [cvRes, jobsRes, codeRes] = await Promise.all([
        supabase.from('cv_results').select('tipo, metadata, created_at').eq('user_id', user.id),
        supabase.from('saved_jobs').select('estado'),
        supabase
          .from('code_redemptions')
          .select('plan_granted, redeemed_at, access_codes(code)')
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const cvs         = cvRes.data || []
      const optimizados = cvs.filter(c => c.tipo === 'optimize').length
      const matches     = cvs.filter(c => c.tipo === 'match')
      const matchScores = matches
        .map(c => c.metadata?.matchScore)
        .filter(s => typeof s === 'number' && s > 0)
      const promedio = matchScores.length
        ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
        : null

      // Formatear datos de gráfico
      const sortedMatches = [...matches]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-7)
        .map(c => ({
          id: c.id,
          date: new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
          score: c.metadata?.matchScore || 0,
          title: c.metadata?.jobData?.title || 'Posición sin título',
          company: c.metadata?.jobData?.company || 'Compañía',
        }))
      setChartData(sortedMatches)

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
  const perfilPts = calcPerfilPts(perfil, jp)
  
  const auto = jp.autoconocimiento || {}
  let autoPts = 0
  if (Array.isArray(auto.hard_skills) && auto.hard_skills.length >= 2) autoPts += 5
  if (Array.isArray(auto.soft_skills) && auto.soft_skills.length >= 2) autoPts += 5
  if (Array.isArray(auto.power_skills) && auto.power_skills.length >= 2) autoPts += 5
  if (Array.isArray(auto.top5empresas) && auto.top5empresas.filter(e => e && String(e).trim()).length >= 1) autoPts += 5

  const bloques = jp.semana?.bloques || {}
  const bN = Object.values(bloques).filter(Boolean).length
  const semanaPts = bN >= 3 ? 20 : bN >= 1 ? 10 : 0

  const rawRec = jp.recursos ? (Array.isArray(jp.recursos) ? jp.recursos : (jp.recursos.recursos || null)) : null
  const rec = (rawRec && rawRec.length > 0) ? rawRec : []
  const nActivos = rec.filter(r => r.tengo === true).length
  const recursosPts = nActivos >= 2 ? 20 : nActivos * 10

  const oferta = jp.oferta || {}
  let ofertaPts = 0
  if (String(oferta.oferta_valor || '').trim().length >= 20) ofertaPts += 4
  const IKIGAI_KEYS = ['ikigai_amas', 'ikigai_bueno', 'ikigai_necesita', 'ikigai_pagar']
  IKIGAI_KEYS.forEach(k => { if (String(oferta[k] || '').trim().length >= 50) ofertaPts += 4 })

  const pilares = [
    { label: 'Mi Perfil', pct: Math.round((perfilPts / 20) * 100), completed: perfilPts >= 20 },
    { label: 'Autoconocimiento', pct: Math.round((autoPts / 20) * 100), completed: autoPts >= 20 },
    { label: 'Oferta de Valor', pct: Math.round((ofertaPts / 20) * 100), completed: ofertaPts >= 20 },
    { label: 'Semana Laboral', pct: Math.round((semanaPts / 20) * 100), completed: semanaPts >= 20 },
    { label: 'Recursos Activos', pct: Math.round((recursosPts / 20) * 100), completed: recursosPts >= 20 },
  ]

  // Notificaciones dinámicas basadas en progreso del usuario
  const notificaciones = []
  if (proyectoPct !== null && proyectoPct < 100) {
    notificaciones.push({
      id: 'proyecto',
      title: 'Mi Proyecto Laboral',
      desc: 'Tienes secciones pendientes para estructurar tu autoconocimiento.',
      to: '/proyecto-laboral',
      type: 'warning'
    })
  }
  if (metricas.cvsOptimizados === 0) {
    notificaciones.push({
      id: 'cv_opt',
      title: 'Optimizar CV Harvard',
      desc: 'Sube tu CV para adaptarlo automáticamente al estándar premium Harvard.',
      to: '/cv-optimizer',
      type: 'info'
    })
  }
  if (metricas.cvsVsVacante === 0) {
    notificaciones.push({
      id: 'compatibilidad',
      title: 'Analizar Vacante',
      desc: 'Realiza tu primer análisis contra una oferta laboral y mide tu compatibilidad.',
      to: '/cv-vs-job',
      type: 'info'
    })
  }
  // Notificación estática decorativa
  notificaciones.push({
    id: 'notif_welcome',
    title: 'Ecosistema Activo',
    desc: 'Tu suscripción corporativa Telefónica B2B está validada e ilimitada.',
    to: '/mi-plan',
    type: 'success'
  })

  // Configurar gráfico SVG
  const activeChartData = chartData.length > 0 ? chartData : MOCK_CHART_DATA
  const isDemoChart = chartData.length === 0

  const points = activeChartData.map((d, i) => {
    const n = activeChartData.length
    const x = n > 1 ? 40 + (i / (n - 1)) * 420 : 250
    const y = 160 - (d.score / 100) * 110
    return { ...d, x, y }
  })

  // Genera curvas de Bezier cúbicas fluidas (Apple-like)
  const getBezierPath = (pts) => {
    if (pts.length === 0) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const cpX1 = p0.x + (p1.x - p0.x) / 2
      const cpY1 = p0.y
      const cpX2 = p0.x + (p1.x - p0.x) / 2
      const cpY2 = p1.y
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
    }
    return d
  }

  const linePath = getBezierPath(points)
  const fillPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z` : ''

  const val = (v, suffix = '') => loadingMetricas ? '—' : `${v ?? 0}${suffix}`

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 bg-slate-50/50 min-h-screen text-slate-700 animate-in fade-in duration-700">
      
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

      {/* ── CABECERA APPLE PREMIUM ── */}
      <header className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex gap-4 sm:gap-6 items-center">
          {/* Avatar Premium */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
            {iniciales}
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <SparkleFill size={12} weight="fill" />
              {saludo}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-1">
              Hola, {nombre}
              <span className="no-print inline-block align-middle ml-2"><HelpBadge id="dashboard.main" /></span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              Ecosistema ejecutivo de desarrollo y optimización de carrera.
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          
          {/* Campana de Notificaciones Interactiva */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${
                showNotifications 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200'
              }`}
            >
              <Bell size={20} weight={showNotifications ? 'fill' : 'duotone'} />
              {notificaciones.length > 1 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>

            {/* Dropdown de Notificaciones */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 p-4 z-30 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Notificaciones ({notificaciones.length})</h4>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Alertas</span>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {notificaciones.map((n, i) => (
                    <Link 
                      key={n.id || i}
                      to={n.to} 
                      onClick={() => setShowNotifications(false)}
                      className="block p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100/50"
                    >
                      <div className="flex gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'warning' ? 'bg-amber-400' : n.type === 'success' ? 'bg-emerald-400' : 'bg-indigo-400'
                        }`} />
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">{n.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/cv-optimizer"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-md shadow-indigo-100 active:scale-95">
            <FileMagnifyingGlass size={16} weight="duotone" />
            Optimizar CV
          </Link>
        </div>
      </header>

      {/* ── MÉTRICAS (KPI GRID) ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          icon={FileMagnifyingGlass}
          iconBg="bg-indigo-500 shadow-indigo-100"
          label="CVs optimizados"
          value={val(metricas.cvsOptimizados)}
          sub={!loadingMetricas && (metricas.cvsOptimizados ?? 0) === 0 ? 'Sube tu CV para adaptarlo al formato' : 'análisis en formato Harvard'}
          to="/cv-optimizer"
          isEmpty={!loadingMetricas && (metricas.cvsOptimizados ?? 0) === 0}
          ctaLabel="Optimiza tu primer CV"
          trend={{ dir: 'up', delta: '+10%' }}
        />
        <MetricCard
          icon={MagnifyingGlass}
          iconBg="bg-blue-500 shadow-blue-100"
          label="CVs vs Vacante"
          value={val(metricas.cvsVsVacante)}
          sub={!loadingMetricas && (metricas.cvsVsVacante ?? 0) === 0 ? 'Mide tu compatibilidad con vacantes' : 'análisis de compatibilidad'}
          to="/cv-vs-job"
          isEmpty={!loadingMetricas && (metricas.cvsVsVacante ?? 0) === 0}
          ctaLabel="Analizar vacante"
          trend={{ dir: 'up', delta: '+4%' }}
        />
        <MetricCard
          icon={ChartLineUp}
          iconBg="bg-purple-500 shadow-purple-100"
          label="Match promedio"
          value={metricas.matchPromedio !== null ? val(metricas.matchPromedio, '%') : loadingMetricas ? '—' : 'N/A'}
          sub={metricas.matchPromedio !== null ? 'en tus análisis recientes' : 'sin análisis aún'}
          trend={metricas.matchTendencia}
        />
        <MetricCard
          icon={Briefcase}
          iconBg="bg-rose-500 shadow-rose-100"
          label="Vacantes guardadas"
          value={val(metricas.vacantesGuardadas)}
          sub={!loadingMetricas && (metricas.vacantesGuardadas ?? 0) === 0 ? 'Guarda empleos en tu pipeline' : 'vacantes registradas'}
          to="/pipeline"
          isEmpty={!loadingMetricas && (metricas.vacantesGuardadas ?? 0) === 0}
          ctaLabel="Abrir Pipeline"
          trend={{ dir: 'up', delta: '+2' }}
        />
      </section>

      {/* ── CUPO & CRÉDITOS ── */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex gap-4 items-center w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Coins size={22} weight="duotone" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Créditos de IA disponibles</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black tracking-tight ${creditosRestantes === 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                {creditosRestantes}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ {LIMITE_PLAN} en tu plan activo · {usageCount} consumidos</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-end">
          <div className="flex-1 md:w-48 bg-slate-100 rounded-full h-3 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                creditosRestantes === 0 ? 'from-rose-500 to-rose-600' : 'from-indigo-500 to-purple-600'
              }`}
              style={{ width: `${(creditosRestantes / LIMITE_PLAN) * 100}%` }}
            />
          </div>
          <Link to="/mi-plan"
            className="text-xs font-bold text-slate-600 border border-slate-200 rounded-2xl px-5 py-2.5 hover:bg-slate-50 transition-colors whitespace-nowrap active:scale-95">
            Administrar plan
          </Link>
        </div>
      </section>

      {/* ── CUADRO CENTRAL: GRÁFICO INTERACTIVO & PROYECTO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
        
        {/* Gráfico de compatibilidad */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative flex flex-col justify-between min-h-[360px]">
          
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] flex items-center gap-1">
                <ChartBar size={14} /> Rendimiento de Búsqueda
              </p>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1 flex items-center gap-1.5">
                Historial de Match Promedio
                {isDemoChart && (
                  <span className="text-[8px] font-bold tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Ejemplo</span>
                )}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-800 leading-none">{val(metricas.matchPromedio || 85, '%')}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Nivel General</p>
            </div>
          </div>

          {/* Canvas SVG interactivo */}
          <div className="relative my-4 flex-1 flex items-center justify-center">
            
            {/* Tooltip personalizado flotante */}
            {hoveredPoint && (
              <div 
                className="absolute bg-white/95 backdrop-blur-md border border-slate-200/60 p-3 rounded-2xl shadow-xl z-20 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 flex flex-col gap-0.5"
                style={{ 
                  left: `${(hoveredPoint.x / 500) * 100}%`, 
                  top: `${(hoveredPoint.y / 200) * 100}%`,
                  transform: 'translate(-50%, -115%)'
                }}
              >
                <p className="text-[9px] font-black uppercase text-indigo-500 tracking-wider leading-none">{hoveredPoint.date}</p>
                <p className="text-xs font-black text-slate-800 truncate max-w-[155px] mt-1">{hoveredPoint.title}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[155px]">{hoveredPoint.company}</p>
                <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-100">
                  <span className="text-sm font-black text-slate-800">{hoveredPoint.score}%</span>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Match</span>
                </div>
              </div>
            )}

            <svg viewBox="0 0 500 200" className="w-full h-full max-h-[220px] select-none overflow-visible">
              <defs>
                {/* Gradiente de Línea */}
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                {/* Gradiente de Fondo */}
                <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guías de fondo */}
              <line x1="30" y1="50" x2="470" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="105" x2="470" y2="105" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="160" x2="470" y2="160" stroke="#f1f5f9" strokeWidth="1" />

              {/* Línea objetivo del 85% Match Target */}
              <line x1="30" y1={160 - (85 / 100) * 110} x2="470" y2={160 - (85 / 100) * 110} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
              <text x="470" y={155 - (85 / 100) * 110} textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="bold" letterSpacing="1" className="uppercase">Meta 85%</text>

              {/* Relleno de área */}
              {fillPath && <path d={fillPath} fill="url(#fillGrad)" />}

              {/* Línea principal */}
              {linePath && <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="3.5" strokeLinecap="round" />}

              {/* Nodos de datos interactivos */}
              {points.map((pt, idx) => {
                const isHovered = hoveredPoint?.id === pt.id || (isDemoChart && hoveredPoint?.label === pt.label)
                return (
                  <g key={pt.id || idx} className="cursor-pointer">
                    {/* Anillo de pulso al pasar mouse */}
                    {isHovered && (
                      <circle cx={pt.x} cy={pt.y} r="10" fill="#6366f1" fillOpacity="0.2" className="animate-ping" />
                    )}
                    {/* Círculo base exterior */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isHovered ? "6" : "4.5"} 
                      fill="#ffffff" 
                      stroke={isHovered ? "#a855f7" : "#6366f1"} 
                      strokeWidth={isHovered ? "3.5" : "2.5"}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="transition-all duration-200"
                    />
                  </g>
                )
              })}

              {/* Etiquetas del eje X */}
              {points.map((pt, idx) => (
                <text key={idx} x={pt.x} y="182" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
                  {pt.label || pt.date}
                </text>
              ))}
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-3 border-t border-slate-50">
            <span className="flex items-center gap-1"><Clock /> Últimos 7 análisis realizados</span>
            <span>Estabilidad: 98.4%</span>
          </div>
        </section>

        {/* Estatus del Proyecto Laboral */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] flex items-center gap-1">
                  <Target size={14} /> Plan de Carrera
                </p>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1">Gerente de mi Búsqueda</h3>
              </div>
              <Link to="/proyecto-laboral" className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl transition-all active:scale-95">
                {proyectoPct === 0 ? 'Iniciar' : 'Revisar'}
              </Link>
            </div>

            {/* Barra de progreso elegante */}
            <div className="mt-5 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Progreso de Estrategia</span>
                <span className="text-sm font-black text-indigo-600">{val(proyectoPct, '%')}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-indigo-500 to-purple-600`}
                  style={{ width: `${proyectoPct ?? 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-2.5 italic">
                {proyectoPct === 100 ? '🎉 Plan completo — listo para postular con ventaja ejecutiva.' :
                 proyectoPct >= 70  ? 'Excelente avance. Afina los últimos pilares pendientes.' :
                 proyectoPct >= 40  ? 'Vas por buen camino, completa tus bloques de horario.' :
                 'Completa las secciones de autoconocimiento para desbloquear tu infografía.'}
              </p>
            </div>
          </div>

          {/* Desglose de los 5 pilares estratégicos */}
          <div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Estatus de Pilares</h4>
            <div className="grid grid-cols-2 gap-2">
              {pilares.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50/50 border border-slate-100 p-2.5 rounded-2xl">
                  {p.completed ? (
                    <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-200 shrink-0 flex items-center justify-center text-[9px] font-bold text-slate-400">
                      {p.pct}%
                    </div>
                  )}
                  <span className={`text-[11px] font-bold truncate ${p.completed ? 'text-slate-700' : 'text-slate-400'}`}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </section>
      </div>

      {/* ── PRÓXIMA ACCIÓN (ACTION CENTER) ── */}
      {!loadingMetricas && proyectoPct !== null && (() => {
        let accion = null
        if ((proyectoPct ?? 0) < 100) {
          accion = { msg: 'Estructura tu plan de autoconocimiento en tu Proyecto Laboral para optimizar el match.', cta: 'Completar Plan', to: '/proyecto-laboral' }
        } else if ((metricas.cvsVsVacante ?? 0) === 0) {
          accion = { msg: 'Mide la compatibilidad de tu CV contra una vacante real y detecta brechas.', cta: 'Medir Match', to: '/cv-vs-job' }
        } else if ((metricas.vacantesGuardadas ?? 0) === 0) {
          accion = { msg: 'Guarda tu primer empleo en el Pipeline de postulaciones para monitorear tu avance.', cta: 'Rastrear Proceso', to: '/pipeline' }
        } else if ((pipelineStats?.entrevistas ?? 0) > 0) {
          accion = { msg: 'Tienes entrevistas programadas. Ensaya tus respuestas con nuestro simulador IA.', cta: 'Simular Entrevista', to: '/entrevista' }
        }
        if (!accion) return null
        return (
          <section className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Target size={20} weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Siguiente Paso Recomendado</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{accion.msg}</p>
              </div>
            </div>
            <Link to={accion.to}
              className="shrink-0 flex items-center gap-1.5 bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-2xl hover:bg-slate-800 transition-colors whitespace-nowrap active:scale-95 self-end sm:self-center">
              {accion.cta} <ArrowUpRight size={13} weight="bold" />
            </Link>
          </section>
        )
      })()}

      {/* ── CÓDIGO REDIMIDO ── */}
      {codigoRedimido && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-3xl px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.005)]">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-100">
            <Ticket size={18} weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-700">
              Código de Acceso <span className="font-mono font-black tracking-widest bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800">{codigoRedimido.access_codes?.code}</span> Canjeado
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
              Plan <span className="capitalize font-black">{codigoRedimido.plan_granted}</span> activo desde el {new Date(codigoRedimido.redeemed_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

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
