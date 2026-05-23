// Dashboard — métricas de uso + recursos editoriales
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { calcularProgreso } from '../utils/progresoLaboral'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase,
  ChartLineUp, Coins, ArrowRight, Sparkle,
  Target, Ticket, Kanban
} from '@phosphor-icons/react'
import PlanBanner from '../components/common/PlanBanner'
import HelpBadge from '../components/common/HelpBadge'

// ─── Componente métrica ───────────────────────────────────────────────────────
function MetricCard({ icon: Icon, iconColor, bgColor, label, value, sub, to, isEmpty, ctaLabel, trend }) {
  const content = (
    <div className={`${bgColor} rounded-2xl p-5 flex flex-col gap-3 h-full transition-all hover:shadow-md hover:-translate-y-0.5`}>
      <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
        <Icon size={20} weight="duotone" className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-on-surface-variant mb-0.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-on-surface leading-none">{value}</p>
          {trend && (
            <span className={`text-xs font-bold ${trend.dir === 'up' ? 'text-emerald-600' : trend.dir === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
              {trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '→'} {trend.delta}
            </span>
          )}
        </div>
        {trend?.prev && <p className="text-[10px] text-on-surface-variant/50 mt-0.5">{trend.prev}</p>}
        {sub && <p className="text-xs text-on-surface-variant/70 mt-1">{sub}</p>}
      </div>
      {to && (
        <div className="mt-auto pt-2">
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            {isEmpty && ctaLabel ? ctaLabel : 'Ver más'} <ArrowRight size={11} weight="bold" />
          </span>
        </div>
      )}
    </div>
  )
  return to ? <Link to={to} className="block">{content}</Link> : <div>{content}</div>
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, perfil, creditosRestantes, LIMITE_PLAN, usageCount, isPaidPlan, trialExpired, trialDaysLeft, jpData } = useAuth()

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

  const nombre = perfil?.nombre1
    ? `${perfil.nombre1}${perfil.apellido1 ? ' ' + perfil.apellido1 : ''}`
    : user?.email?.split('@')[0]

  // Determina el saludo según la hora
  const saludo = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

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

      // Tendencia semanal: esta semana vs semana pasada
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
          dir:   diff > 2 ? 'up' : diff < -2 ? 'down' : 'flat',
          delta: `${diff > 0 ? '+' : ''}${diff}%`,
          prev:  `vs ${avgPasada}% sem. anterior`,
        }
      } else if (avgEsta !== null && scoresEstaSemana.length > 0) {
        matchTendencia = { dir: 'flat', delta: null, prev: `${scoresEstaSemana.length} análisis esta semana` }
      }

      // Pipeline stats
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

      // Proyecto laboral % - Unificado
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

  const val = (v, suffix = '') => loadingMetricas ? '—' : `${v ?? 0}${suffix}`

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

      {/* ── Banner de trial ── */}
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

      {/* ── Saludo ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-on-surface-variant mb-1 flex items-center gap-1.5">
            <Sparkle size={14} weight="duotone" className="text-primary" />
            {saludo}
          </p>
          <h1 className="text-3xl font-black text-on-surface leading-tight flex items-center gap-2">
            Hola, {nombre} 👋
            <HelpBadge id="dashboard.main" />
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Aquí tienes un resumen de tu actividad y recursos para potenciar tu búsqueda.
          </p>
        </div>
        <Link to="/cv-optimizer"
          className="shrink-0 flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
          <FileMagnifyingGlass size={16} weight="duotone" />
          Optimizar CV
        </Link>
      </div>

      {/* ── Sección 1: Métricas ── */}
      <section>
        <h2 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
          <ChartLineUp size={18} weight="duotone" className="text-primary" />
          Tu actividad
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={FileMagnifyingGlass}
            iconColor="bg-[#E8541A]"
            bgColor="bg-[#E8541A]/5"
            label="CVs optimizados"
            value={val(metricas.cvsOptimizados)}
            sub={!loadingMetricas && (metricas.cvsOptimizados ?? 0) === 0 ? 'Sube tu CV y mejora tu formato' : 'análisis de formato Harvard'}
            to="/cv-optimizer"
            isEmpty={!loadingMetricas && (metricas.cvsOptimizados ?? 0) === 0}
            ctaLabel="Optimiza tu primer CV"
          />
          <MetricCard
            icon={MagnifyingGlass}
            iconColor="bg-primary"
            bgColor="bg-primary/5"
            label="CVs vs Vacante"
            value={val(metricas.cvsVsVacante)}
            sub={!loadingMetricas && (metricas.cvsVsVacante ?? 0) === 0 ? 'Mide tu compatibilidad con una vacante' : 'análisis de compatibilidad'}
            to="/cv-vs-job"
            isEmpty={!loadingMetricas && (metricas.cvsVsVacante ?? 0) === 0}
            ctaLabel="Analizar ahora"
          />
          <MetricCard
            icon={ChartLineUp}
            iconColor="bg-primary"
            bgColor="bg-primary/5"
            label="Match promedio"
            value={metricas.matchPromedio !== null ? val(metricas.matchPromedio, '%') : loadingMetricas ? '—' : 'N/A'}
            sub={metricas.matchPromedio !== null ? 'en tus análisis recientes' : 'sin análisis aún'}
            trend={metricas.matchTendencia}
          />
          <MetricCard
            icon={Briefcase}
            iconColor="bg-[#E8541A]"
            bgColor="bg-[#E8541A]/5"
            label="Vacantes guardadas"
            value={val(metricas.vacantesGuardadas)}
            sub={!loadingMetricas && (metricas.vacantesGuardadas ?? 0) === 0 ? 'Registra vacantes para rastrear tu proceso' : 'en tu pipeline'}
            to="/pipeline"
            isEmpty={!loadingMetricas && (metricas.vacantesGuardadas ?? 0) === 0}
            ctaLabel="Abrir Pipeline"
          />
        </div>

        {/* Créditos */}
        <div className="mt-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Coins size={20} weight="duotone" className="text-white" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Créditos disponibles</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-2xl font-black ${creditosRestantes === 0 ? 'text-error' : creditosRestantes === 1 ? 'text-amber-500' : 'text-on-surface'}`}>
                  {creditosRestantes}
                </span>
                <span className="text-sm text-on-surface-variant/70">/ {LIMITE_PLAN} · {usageCount} utilizados</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40 bg-surface-container-high rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${creditosRestantes === 0 ? 'bg-error' : creditosRestantes === 1 ? 'bg-amber-400' : 'bg-primary'}`}
                style={{ width: `${(creditosRestantes / LIMITE_PLAN) * 100}%` }}
              />
            </div>
            <Link to="/mi-plan"
              className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors whitespace-nowrap">
              Ver plan
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tu próxima acción ── */}
      {!loadingMetricas && proyectoPct !== null && (() => {
        let accion = null
        if ((proyectoPct ?? 0) < 100) {
          accion = { msg: 'Completa tu Proyecto Laboral para liberar todo el potencial de ELVIA®', cta: 'Ir al proyecto', to: '/proyecto-laboral' }
        } else if ((metricas.cvsVsVacante ?? 0) === 0) {
          accion = { msg: 'Analiza tu CV contra una vacante real y conoce tu nivel de compatibilidad', cta: 'Analizar ahora', to: '/cv-vs-job' }
        } else if ((metricas.vacantesGuardadas ?? 0) === 0) {
          accion = { msg: 'Guarda tu primera vacante en el Pipeline y empieza a rastrear tu proceso', cta: 'Ir al Pipeline', to: '/pipeline' }
        } else if ((pipelineStats?.entrevistas ?? 0) > 0) {
          accion = { msg: 'Tienes entrevistas activas — prepárate con nuestra herramienta de simulación', cta: 'Preparar entrevista', to: '/entrevista' }
        }
        if (!accion) return null
        return (
          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Target size={18} weight="duotone" className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">Tu próxima acción</p>
              <p className="text-sm text-on-surface">{accion.msg}</p>
            </div>
            <Link to={accion.to}
              className="shrink-0 flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap">
              {accion.cta} <ArrowRight size={11} weight="bold" />
            </Link>
          </section>
        )
      })()}

      {/* ── Código redimido ── */}
      {codigoRedimido && (
        <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Ticket size={16} weight="duotone" className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-600">
              Código <span className="font-mono font-black tracking-widest">{codigoRedimido.access_codes?.code}</span> canjeado —{' '}
              plan <span className="capitalize">{codigoRedimido.plan_granted}</span> activado
            </p>
            <p className="text-[10px] text-emerald-700/60 mt-0.5">
              Canjeado el {new Date(codigoRedimido.redeemed_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* ── Bloque: Gerente de Búsqueda Laboral ── */}
      <section className="rounded-2xl overflow-hidden border border-violet-200 shadow-sm">
        {/* Header oscuro */}
        <div className="bg-gradient-to-r from-[#1a103d] to-[#2d1b69] px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Target size={20} weight="duotone" className="text-violet-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Mi Proyecto Laboral</p>
              <h2 className="text-white font-black text-base">Soy Gerente de mi Búsqueda</h2>
            </div>
          </div>
          <Link to="/proyecto-laboral"
            className="shrink-0 flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors">
            {proyectoPct === 0 ? 'Empezar mi proyecto' : 'Revisar mi proyecto'}
            <ArrowRight size={13} weight="bold" />
          </Link>
        </div>

        {/* Barra de progreso + stats */}
        <div className="bg-white px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  proyectoPct >= 70 ? 'bg-green-500' :
                  proyectoPct >= 40 ? 'bg-amber-500' : 'bg-violet-500'
                }`}
                style={{ width: `${proyectoPct ?? 0}%` }}
              />
            </div>
            <span className={`text-sm font-black min-w-[3rem] text-right ${
              proyectoPct >= 70 ? 'text-green-600' :
              proyectoPct >= 40 ? 'text-amber-600' : 'text-violet-600'
            }`}>
              {proyectoPct !== null ? `${proyectoPct}%` : '—'}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {proyectoPct === 100 ? '🎉 Proyecto 100% completo — estás listo para postular con estrategia' :
             proyectoPct >= 70  ? 'Muy buen avance — afina los últimos detalles' :
             proyectoPct >= 40  ? 'Buen inicio — completa las secciones restantes' :
             proyectoPct > 0    ? 'Recién empezando — Completa tu perfil de proyecto' :
                                  'Aún no has iniciado tu plan — te toma menos de 10 min'}
          </p>
        </div>
      </section>

      {/* ── Bloque: Pipeline resumen ── */}
      {pipelineStats && pipelineStats.total > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Kanban size={18} weight="duotone" className="text-primary" />
              Pipeline de vacantes
            </h2>
            <Link to="/pipeline" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Ver todo <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Activas',      value: pipelineStats.total,       color: 'text-blue-600',  bg: 'bg-blue-50  border-blue-100' },
              { label: 'Entrevistas', value: pipelineStats.entrevistas,  color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
              { label: 'Ofertas',     value: pipelineStats.ofertas,      color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
              { label: 'No avanzó',  value: pipelineStats.perdidas,     color: 'text-red-500',   bg: 'bg-red-50   border-red-100'   },
            ].map(s => (
              <div key={s.label} className={`p-4 rounded-2xl border ${s.bg}`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
