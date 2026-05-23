import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import {
  ChartBar, Kanban, Target, TrendUp, CalendarCheck, ArrowRight
} from '@phosphor-icons/react'
import PlanBanner from '../components/common/PlanBanner'
import HelpBadge from '../components/common/HelpBadge'

const ETAPAS_ORDEN = ['Descubierto', 'Apliqué', 'Pruebas/Assessment', 'En entrevistas', 'Ofertado']
const ETAPA_PERDIDA = 'No avanzó'

const ETAPA_COLORS = {
  'Descubierto':        'bg-slate-400',
  'Apliqué':           'bg-blue-400',
  'Pruebas/Assessment': 'bg-violet-500',
  'En entrevistas':     'bg-amber-500',
  'Ofertado':           'bg-emerald-500',
  [ETAPA_PERDIDA]:      'bg-red-400',
}

const parseJSON = (val) => {
  if (!val) return {}
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return {}
    }
  }
  return val
}

function StatCard({ label, value, sub, color = 'text-gray-900', icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-2">
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon size={18} weight="duotone" className="text-primary" />
        </div>
      )}
      <p className={`text-3xl font-black leading-none ${color}`}>{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function BarChart({ data, max, colorFn }) {
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((item, i) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-gray-500">{item.value || ''}</span>
            <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: colorFn ? colorFn(i) : '#6366f1' }} />
            <span className="text-[9px] text-gray-400 text-center leading-none truncate w-full text-center">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function MisMetricas() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [matches, setMatches] = useState([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [jobsRes, matchesRes] = await Promise.all([
        supabase.from('saved_jobs').select('estado, etapas_fechas, created_at').eq('user_id', user.id),
        supabase.from('cv_results').select('metadata, created_at').eq('tipo', 'match').eq('user_id', user.id).order('created_at', { ascending: true }),
      ])
      setJobs(jobsRes.data || [])
      setMatches(matchesRes.data || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── Pipeline funnel ──────────────────────────────────────────────────────
  const etapasCount = {}
  jobs.forEach(j => {
    const e = j.estado || 'Descubierto'
    etapasCount[e] = (etapasCount[e] || 0) + 1
  })

  const funnelData = [...ETAPAS_ORDEN, ETAPA_PERDIDA].map(e => ({
    label: e === 'En entrevistas' ? 'Entrevistas' : e,
    etapa: e,
    value: etapasCount[e] || 0,
  })).filter(d => d.value > 0)

  const maxFunnel = Math.max(...funnelData.map(d => d.value), 1)

  // ── Match score trend (últimas 10 semanas) ────────────────────────────────
  const scoresConFecha = matches
    .map(m => {
      const meta = parseJSON(m.metadata)
      return { score: meta?.matchScore, fecha: new Date(m.created_at) }
    })
    .filter(m => typeof m.score === 'number' && m.score > 0)

  // Agrupar por semana (últimas 8)
  const ahora = Date.now()
  const semanaMs = 7 * 24 * 60 * 60 * 1000
  const NUM_SEMANAS = 8
  const scorePorSemana = Array.from({ length: NUM_SEMANAS }, (_, i) => {
    const fin   = ahora - i * semanaMs
    const inicio = fin - semanaMs
    const scores = scoresConFecha
      .filter(m => m.fecha.getTime() >= inicio && m.fecha.getTime() < fin)
      .map(m => m.score)
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const label = i === 0 ? 'Esta' : `S-${i}`
    return { label, value: avg }
  }).reverse()

  const maxScore = Math.max(...scorePorSemana.map(s => s.value), 1)

  // ── Actividad semanal (vacantes añadidas) ─────────────────────────────────
  const actPorSemana = Array.from({ length: NUM_SEMANAS }, (_, i) => {
    const fin    = ahora - i * semanaMs
    const inicio = fin - semanaMs
    const count  = jobs.filter(j => {
      const t = new Date(j.created_at).getTime()
      return t >= inicio && t < fin
    }).length
    return { label: i === 0 ? 'Esta' : `S-${i}`, value: count }
  }).reverse()

  const maxAct = Math.max(...actPorSemana.map(s => s.value), 1)

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalActivas = jobs.filter(j => j.estado !== ETAPA_PERDIDA).length
  const entrevistas  = etapasCount['En entrevistas'] || 0
  const ofertados    = etapasCount['Ofertado'] || 0
  const perdidas     = etapasCount[ETAPA_PERDIDA] || 0
  const tasaExito    = totalActivas + perdidas > 0
    ? Math.round((ofertados / (totalActivas + perdidas)) * 100)
    : 0
  const avgScore     = scoresConFecha.length
    ? Math.round(scoresConFecha.reduce((a, b) => a + b.score, 0) / scoresConFecha.length)
    : 0

  // ── Días promedio entre etapas (aplicado → entrevista) ───────────────────
  let diasPromAplicadoEntrevista = null
  const diasList = jobs
    .map(j => ({ ...j, etapas_fechas_parsed: parseJSON(j.etapas_fechas) }))
    .filter(j => j.etapas_fechas_parsed?.['Apliqué'] && j.etapas_fechas_parsed?.['En entrevistas'])
    .map(j => {
      const a = new Date(j.etapas_fechas_parsed['Apliqué']).getTime()
      const b = new Date(j.etapas_fechas_parsed['En entrevistas']).getTime()
      return Math.round((b - a) / (24 * 60 * 60 * 1000))
    })
    .filter(d => d > 0)
  if (diasList.length) {
    diasPromAplicadoEntrevista = Math.round(diasList.reduce((a, b) => a + b, 0) / diasList.length)
  }

  const tieneData = jobs.length > 0 || matches.length > 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <PlanBanner />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          Mis Métricas
          <HelpBadge id="metricas.main" />
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Seguimiento de tu búsqueda activa — actualizado en tiempo real.
        </p>
      </div>

      {!tieneData ? (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-10 text-center">
          <ChartBar size={40} className="text-gray-300 mx-auto mb-3" weight="duotone" />
          <p className="text-sm font-semibold text-gray-500 mb-1">Aún no hay datos que mostrar</p>
          <p className="text-xs text-gray-400 mb-4">Agrega vacantes al Pipeline y analiza CVs para ver tus métricas aquí.</p>
          <Link to="/pipeline" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 justify-center">
            Ir al Pipeline <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Vacantes activas"
              value={totalActivas}
              icon={Kanban}
              color="text-blue-600"
            />
            <StatCard
              label="En entrevistas"
              value={entrevistas}
              icon={CalendarCheck}
              color="text-amber-600"
            />
            <StatCard
              label="Match promedio"
              value={avgScore ? `${avgScore}%` : '—'}
              sub={scoresConFecha.length ? `${scoresConFecha.length} análisis` : 'Sin análisis aún'}
              icon={Target}
              color={avgScore >= 75 ? 'text-emerald-600' : avgScore >= 50 ? 'text-amber-600' : 'text-gray-700'}
            />
            <StatCard
              label="Tasa de éxito"
              value={ofertados > 0 ? `${tasaExito}%` : '—'}
              sub={ofertados > 0 ? `${ofertados} oferta${ofertados > 1 ? 's' : ''}` : 'Sin ofertas aún'}
              icon={TrendUp}
              color={tasaExito >= 10 ? 'text-emerald-600' : 'text-gray-700'}
            />
          </div>

          {/* Pipeline Funnel */}
          {funnelData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Estado del Pipeline</h2>
              <div className="space-y-2.5">
                {funnelData.map(d => {
                  const pct = Math.round((d.value / (jobs.length || 1)) * 100)
                  return (
                    <div key={d.etapa} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-28 shrink-0">{d.label}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${ETAPA_COLORS[d.etapa] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600 w-8 text-right">{d.value}</span>
                    </div>
                  )
                })}
              </div>
              {diasPromAplicadoEntrevista && (
                <p className="text-xs text-gray-400 mt-4 border-t border-gray-50 pt-3">
                  Tiempo promedio de <strong>Apliqué → Entrevista</strong>: {diasPromAplicadoEntrevista} días
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Match Score Trend */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Match Score — últimas 8 semanas</h2>
              {scoresConFecha.length === 0 ? (
                <p className="text-xs text-gray-400">Analiza CVs vs vacantes para ver la tendencia.</p>
              ) : (
                <BarChart
                  data={scorePorSemana}
                  max={maxScore}
                  colorFn={(i) => {
                    const v = scorePorSemana[i].value
                    return v >= 75 ? '#10b981' : v >= 50 ? '#f59e0b' : v > 0 ? '#ef4444' : '#e5e7eb'
                  }}
                />
              )}
            </div>

            {/* Actividad semanal */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Vacantes añadidas — últimas 8 semanas</h2>
              {jobs.length === 0 ? (
                <p className="text-xs text-gray-400">Agrega vacantes al Pipeline para ver tu actividad.</p>
              ) : (
                <BarChart
                  data={actPorSemana}
                  max={maxAct}
                  colorFn={() => '#6366f1'}
                />
              )}
            </div>
          </div>

          {/* Conversión por etapa */}
          {jobs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-1">Conversión por etapa</h2>
              <p className="text-xs text-gray-400 mb-4">Del total de vacantes, cuántas llegaron a cada etapa.</p>
              <div className="flex flex-wrap justify-center gap-4 text-center">
                {ETAPAS_ORDEN.map((etapa, i) => {
                  const cnt = etapasCount[etapa] || 0
                  const pct = jobs.length > 0 ? Math.round((cnt / jobs.length) * 100) : 0
                  const labels = ['Descubierto', 'Apliqué', 'Assessment', 'Entrevistas', 'Oferta']
                  return (
                    <div key={etapa} className="flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${ETAPA_COLORS[etapa] || 'bg-gray-300'}`}>
                        {cnt}
                      </div>
                      <span className="text-[10px] text-gray-500 leading-tight">{labels[i]}</span>
                      <span className="text-[10px] font-bold text-gray-400">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
