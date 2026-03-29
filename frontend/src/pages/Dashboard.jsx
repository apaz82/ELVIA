// Dashboard — métricas de uso + recursos editoriales
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase,
  ChartLineUp, Coins, ArrowRight, Sparkle,
  FileText, Target, ChartBar, LinkSimple, CurrencyDollar, Star,
  Ticket, Kanban
} from '@phosphor-icons/react'
import PlanBanner from '../components/common/PlanBanner'

// ─── Artículos placeholder — reemplaza con contenido real ────────────────────
const ARTICULOS = [
  {
    id: 1,
    categoria: 'Tips de CV',
    titulo: 'Los 7 errores más comunes en un CV y cómo corregirlos',
    resumen: 'Desde el formato hasta las palabras clave, descubre qué aleja a los reclutadores antes de la primera entrevista.',
    color: 'from-blue-500 to-indigo-600',
    icono: <FileText weight="duotone" className="text-white drop-shadow-sm" size={48} />,
    minLectura: 4,
    href: '#',
  },
  {
    id: 2,
    categoria: 'Entrevistas',
    titulo: 'Método STAR: responde preguntas de comportamiento con impacto',
    resumen: 'Aprende a estructurar tus respuestas con situación, tarea, acción y resultado para dejar huella en cualquier entrevista.',
    color: 'from-emerald-500 to-teal-600',
    icono: <Target weight="duotone" className="text-white drop-shadow-sm" size={48} />,
    minLectura: 5,
    href: '#',
  },
  {
    id: 3,
    categoria: 'Mercado laboral',
    titulo: 'Las habilidades más demandadas en LATAM para 2025',
    resumen: 'Análisis de más de 50,000 ofertas en México, Colombia y Argentina revela qué competencias marcan la diferencia.',
    color: 'from-orange-500 to-rose-500',
    icono: <ChartBar weight="duotone" className="text-white drop-shadow-sm" size={48} />,
    minLectura: 6,
    href: '#',
  },
  {
    id: 4,
    categoria: 'LinkedIn',
    titulo: 'Cómo optimizar tu perfil de LinkedIn para aparecer en búsquedas de reclutadores',
    resumen: 'El algoritmo de LinkedIn prioriza ciertas secciones. Saber cuáles puede triplicar tu visibilidad en semanas.',
    color: 'from-sky-500 to-blue-600',
    icono: <LinkSimple weight="duotone" className="text-white drop-shadow-sm" size={48} />,
    minLectura: 7,
    href: '#',
  },
  {
    id: 5,
    categoria: 'Negociación',
    titulo: 'Cómo negociar tu salario sin perder la oferta',
    resumen: 'El 70% de los profesionales nunca negocia su sueldo inicial. Guía práctica con frases y estrategias que funcionan.',
    color: 'from-violet-500 to-purple-600',
    icono: <CurrencyDollar weight="duotone" className="text-white drop-shadow-sm" size={48} />,
    minLectura: 5,
    href: '#',
  },
  {
    id: 6,
    categoria: 'Marca personal',
    titulo: 'Personal branding para ejecutivos: diferénciate en mercados saturados',
    resumen: 'Construir una marca profesional coherente entre tu CV, LinkedIn y entrevistas multiplica tus oportunidades.',
    color: 'from-pink-500 to-rose-600',
    icono: <Star weight="duotone" className="text-white drop-shadow-sm" size={48} />,
    minLectura: 8,
    href: '#',
  },
]

// ─── Componente métrica ───────────────────────────────────────────────────────
function MetricCard({ icon: Icon, iconColor, bgColor, label, value, sub, to }) {
  const content = (
    <div className={`${bgColor} rounded-2xl p-5 flex flex-col gap-3 h-full transition-all hover:shadow-md hover:-translate-y-0.5`}>
      <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
        <Icon size={20} weight="duotone" className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-on-surface-variant mb-0.5">{label}</p>
        <p className="text-3xl font-black text-on-surface leading-none">{value}</p>
        {sub && <p className="text-xs text-on-surface-variant/70 mt-1">{sub}</p>}
      </div>
      {to && (
        <div className="mt-auto pt-2">
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            Ver más <ArrowRight size={11} weight="bold" />
          </span>
        </div>
      )}
    </div>
  )
  return to ? <Link to={to} className="block">{content}</Link> : <div>{content}</div>
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, perfil, creditosRestantes, LIMITE_PLAN, usageCount, isPaidPlan, trialExpired, trialDaysLeft } = useAuth()

  const [metricas, setMetricas] = useState({
    cvsOptimizados: null,
    cvsVsVacante: null,
    matchPromedio: null,
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
      const [cvRes, jobsRes, codeRes, profileRes] = await Promise.all([
        supabase.from('cv_results').select('tipo, metadata').eq('user_id', user.id),
        supabase.from('saved_jobs').select('estado'),
        supabase
          .from('code_redemptions')
          .select('plan_granted, redeemed_at, access_codes(code)')
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('profiles').select('job_search_profile').eq('id', user.id).single(),
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

      // Proyecto laboral %
      const jp = profileRes.data?.job_search_profile || {}
      if (Object.keys(jp).length > 0) {
        // Lightweight % calculation (same logic as ProyectoLaboral)
        let pts = 0
        const auto = jp.autoconocimiento || {}
        if ((auto.cargo_objetivo || '').trim().length > 2) pts += 10
        if ((auto.areas || []).length >= 2)               pts += 8
        if ((auto.industrias || []).length >= 1)          pts += 7
        if ((auto.top5empresas || []).filter(e => e?.trim()).length >= 3) pts += 5
        if ((auto.modalidad || []).length >= 1)           pts += 5
        const checksDone = Object.values(jp.documentos?.checks || {}).filter(Boolean).length
        pts += Math.round((checksDone / 6) * 30)
        const bloquesActivos = Object.values(jp.semana?.bloques || {}).filter(Boolean).length
        if (bloquesActivos >= 8) pts += 20
        else if (bloquesActivos >= 5) pts += 14
        else if (bloquesActivos >= 2) pts += 8
        else if (bloquesActivos >= 1) pts += 4
        pts += 10 // recursos base (siempre tiene los default)
        setProyectoPct(Math.min(pts, 100))
      } else {
        setProyectoPct(0)
      }

      setMetricas({
        cvsOptimizados:   optimizados,
        cvsVsVacante:     matches.length,
        matchPromedio:    promedio,
        vacantesGuardadas: savedJobs.filter(j => (j.estado || 'Descubierto') !== 'No avanzó').length,
      })
      if (codeRes.data) setCodigoRedimido(codeRes.data)
      setLoadingMetricas(false)
    }
    cargarMetricas()
  }, [user?.id])

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
          <h1 className="text-3xl font-black text-on-surface leading-tight">
            Hola, {nombre} 👋
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
            sub="análisis de formato Harvard"
            to="/cv-optimizer"
          />
          <MetricCard
            icon={MagnifyingGlass}
            iconColor="bg-primary"
            bgColor="bg-primary/5"
            label="CVs vs Vacante"
            value={val(metricas.cvsVsVacante)}
            sub="análisis de compatibilidad"
            to="/cv-vs-job"
          />
          <MetricCard
            icon={ChartLineUp}
            iconColor="bg-primary"
            bgColor="bg-primary/5"
            label="Match promedio"
            value={metricas.matchPromedio !== null ? val(metricas.matchPromedio, '%') : loadingMetricas ? '—' : 'N/A'}
            sub={metricas.matchPromedio !== null ? 'en tus análisis recientes' : 'sin análisis aún'}
          />
          <MetricCard
            icon={Briefcase}
            iconColor="bg-[#E8541A]"
            bgColor="bg-[#E8541A]/5"
            label="Vacantes guardadas"
            value={val(metricas.vacantesGuardadas)}
            sub="en tu pipeline"
            to="/pipeline"
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
             proyectoPct > 0    ? 'Recién empezando — completa tu perfil de proyecto' :
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

      {/* ── Sección 2: Recursos editoriales ── */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Sparkle size={18} weight="duotone" className="text-primary" />
              Recursos para tu búsqueda
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Artículos y guías seleccionados para potenciar tu perfil</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ARTICULOS.map(a => (
            <a key={a.id} href={a.href}
              className="group bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden hover:shadow-float hover:border-[#E8541A]/30 hover:-translate-y-1 transition-all flex flex-col cursor-pointer">

              {/* Imagen / banner */}
              <div className={`h-28 bg-[#0D2B4E]/5 flex items-center justify-center relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-80 mix-blend-overlay`} />
                <div className="relative z-10 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center shadow-sm">
                  {a.icono}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 flex flex-col flex-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                    {a.categoria}
                  </span>
                  <span className="text-[10px] text-gray-400">{a.minLectura} min</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {a.titulo}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 flex-1">
                  {a.resumen}
                </p>
                <span className="text-xs font-semibold text-primary flex items-center gap-1 mt-1">
                  Leer artículo <ArrowRight size={11} weight="bold" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

    </div>
  )
}
