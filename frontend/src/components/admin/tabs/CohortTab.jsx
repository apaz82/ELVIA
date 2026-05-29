import React, { useState, useEffect } from 'react'
import * as PI from '@phosphor-icons/react'

const COHORT_EMAILS = [
  'mario.bahamonde@telefonica.com',
  'vanessa.mejia@telefonica.com',
  'elvia.quintero@telefonica.com',
]

const FEATURE_LABELS = {
  dashboard:        { label: 'Dashboard',       color: '#6366f1' },
  proyecto_laboral: { label: 'Gerente',         color: '#8b5cf6' },
  linkedin_pro:     { label: 'LinkedIn® Pro',   color: '#0077B5' },
  cv_optimizer:     { label: 'Optimizador CV',  color: '#059669' },
  cvvsjob:          { label: 'CV vs Vacante',   color: '#d97706' },
  job_matches:      { label: 'Búsqueda',        color: '#dc2626' },
  entrevista:       { label: 'Entrevista',      color: '#7c3aed' },
}

const PILARES = ['perfil','autoconocimiento','recursos','semana','oferta','documentos']
const PILAR_LABEL = { perfil:'Perfil', autoconocimiento:'Competencias', recursos:'Gastos', semana:'Semana', oferta:'Oferta', documentos:'Documentos' }

function fmtTs(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}

function PctBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-black tabular-nums" style={{ color }}>{value}%</span>
    </div>
  )
}

export default function CohortTab({ db, theme }) {
  const isLight = theme === 'light'
  const [usuarios, setUsuarios]       = useState([])
  const [eventos, setEventos]         = useState([])
  const [documentos, setDocumentos]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    // 1. Perfiles del cohort
    const { data: perfiles } = await db
      .from('profiles')
      .select('id, nombre1, apellido1, email_principal, job_search_profile, created_at, updated_at')
      .in('email_principal', COHORT_EMAILS)

    // 2. Eventos de actividad
    const userIds = (perfiles || []).map(p => p.id)
    let evts = []
    if (userIds.length > 0) {
      const { data } = await db
        .from('user_events')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(200)
      evts = data || []
    }

    // 3. Documentos generados (cv_results)
    let docs = []
    if (userIds.length > 0) {
      const { data } = await db
        .from('cv_results')
        .select('id, user_id, tipo, metadata, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(100)
      docs = data || []
    }

    setUsuarios(perfiles || [])
    setEventos(evts)
    setDocumentos(docs)
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-refresh cada 60s
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchData, 60000)
    return () => clearInterval(id)
  }, [autoRefresh])

  // Mapa de calor: contar eventos por feature
  const heatmap = Object.keys(FEATURE_LABELS).map(f => {
    const total = eventos.filter(e => e.feature === f).length
    const byUser = {}
    COHORT_EMAILS.forEach(email => {
      const uid = usuarios.find(u => u.email_principal === email)?.id
      byUser[email] = uid ? eventos.filter(e => e.feature === f && e.user_id === uid).length : 0
    })
    return { feature: f, total, byUser }
  }).sort((a, b) => b.total - a.total)

  const maxHeat = Math.max(...heatmap.map(h => h.total), 1)

  // Timeline global últimas 30 acciones
  const timeline = eventos.slice(0, 30)

  const bg    = isLight ? 'bg-white border border-slate-200' : 'bg-slate-800/60 border border-slate-700'
  const cardBg = isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-900/60 border border-slate-700'
  const txt   = isLight ? 'text-slate-800' : 'text-white'
  const muted = isLight ? 'text-slate-500' : 'text-slate-400'

  if (loading) return (
    <div className="h-full flex items-center justify-center py-32">
      <PI.Cpu size={40} className="text-indigo-500 animate-pulse" weight="duotone" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-black ${txt}`}>Cohort Telefónica</h2>
          <p className={`text-[11px] ${muted} mt-0.5`}>
            {lastRefresh ? `Actualizado ${fmtTs(lastRefresh.toISOString())}` : ''}
            {' · '}{eventos.length} eventos registrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className={`flex items-center gap-2 text-[11px] font-bold cursor-pointer ${muted}`}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
              className="accent-indigo-500" />
            Auto-refresh 60s
          </label>
          <button onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black transition-colors">
            <PI.ArrowClockwise size={13} weight="bold" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas de usuario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COHORT_EMAILS.map(email => {
          const u = usuarios.find(u => u.email_principal === email)
          const jp = u?.job_search_profile || {}
          const pctPilar = {}
          PILARES.forEach(p => {
            const d = jp[p]
            if (p === 'perfil') {
              const campos = ['nombre1','apellido1','pais','ciudad','salario_monto']
              const filled = campos.filter(c => u?.[c] || d?.[c]).length
              pctPilar[p] = Math.round((filled / campos.length) * 100)
            } else if (p === 'autoconocimiento') {
              const hs = (d?.hard_skills || []).length
              const ss = (d?.soft_skills || []).length
              pctPilar[p] = Math.min(100, Math.round(((hs >= 2 ? 50 : hs * 25) + (ss >= 2 ? 50 : ss * 25))))
            } else if (p === 'oferta') {
              const ok = d?.oferta_valor?.length > 20
              pctPilar[p] = ok ? 100 : 0
            } else if (p === 'recursos') {
              const activos = (d?.recursos || []).filter(r => r.tengo).length
              pctPilar[p] = activos >= 1 ? 100 : 0
            } else if (p === 'semana') {
              const bloques = Object.values(d?.bloques || {}).filter(Boolean).length
              pctPilar[p] = bloques >= 1 ? 100 : 0
            } else if (p === 'documentos') {
              const hasCv = documentos.some(d => d.user_id === u?.id && (d.tipo === 'optimize' || d.tipo === 'original'))
              pctPilar[p] = hasCv ? 100 : 0
            }
          })
          const pctTotal = Math.round(Object.values(pctPilar).reduce((s, v) => s + v, 0) / PILARES.length)
          const userEvents = u ? eventos.filter(e => e.user_id === u.id) : []
          const lastEvent = userEvents[0]
          const userDocs = u ? documentos.filter(d => d.user_id === u.id) : []

          return (
            <div key={email} className={`rounded-2xl p-5 ${bg} space-y-4`}>
              {/* Avatar + nombre */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {u ? `${u.nombre1?.[0] || ''}${u.apellido1?.[0] || ''}`.toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate ${txt}`}>
                    {u ? `${u.nombre1 || ''} ${u.apellido1 || ''}`.trim() || email.split('@')[0] : email.split('@')[0]}
                  </p>
                  <p className={`text-[10px] truncate ${muted}`}>{email}</p>
                </div>
                {u
                  ? <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Activo</span>
                  : <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">Sin acceso</span>
                }
              </div>

              {/* Progreso global */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Progreso Gerente</span>
                  <span className={`text-[10px] font-black ${pctTotal >= 80 ? 'text-emerald-400' : pctTotal >= 40 ? 'text-amber-400' : 'text-slate-400'}`}>{pctTotal}%</span>
                </div>
                <PctBar value={pctTotal} color={pctTotal >= 80 ? '#10b981' : pctTotal >= 40 ? '#f59e0b' : '#6366f1'} />
              </div>

              {/* Pilares */}
              <div className="space-y-1.5">
                {PILARES.map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold w-24 shrink-0 ${muted}`}>{PILAR_LABEL[p]}</span>
                    <PctBar value={pctPilar[p] || 0} color={pctPilar[p] === 100 ? '#10b981' : '#6366f1'} />
                  </div>
                ))}
              </div>

              {/* Stats rápidas */}
              <div className={`grid grid-cols-3 gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
                <div className="text-center">
                  <p className={`text-lg font-black ${txt}`}>{userEvents.length}</p>
                  <p className={`text-[9px] ${muted}`}>Eventos</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-black ${txt}`}>{userDocs.length}</p>
                  <p className={`text-[9px] ${muted}`}>Docs</p>
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-black ${txt}`}>{lastEvent ? fmtTs(lastEvent.created_at) : '—'}</p>
                  <p className={`text-[9px] ${muted}`}>Última actividad</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mapa de calor por feature */}
      <div className={`rounded-2xl p-5 ${bg}`}>
        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${muted}`}>Mapa de Uso por Feature</h3>
        <div className="space-y-3">
          {heatmap.map(({ feature, total, byUser }) => {
            const cfg = FEATURE_LABELS[feature]
            const pct = Math.round((total / maxHeat) * 100)
            return (
              <div key={feature} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${txt}`}>{cfg.label}</span>
                  <div className="flex items-center gap-3">
                    {COHORT_EMAILS.map(email => {
                      const cnt = byUser[email] || 0
                      const name = email.split('.')[0]
                      return (
                        <span key={email} className={`text-[10px] font-black ${cnt > 0 ? '' : muted}`}
                          style={{ color: cnt > 0 ? cfg.color : undefined }}>
                          {name[0].toUpperCase()}: {cnt}
                        </span>
                      )
                    })}
                    <span className={`text-[10px] font-black w-6 text-right ${txt}`}>{total}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: isLight ? '#e2e8f0' : '#1e293b' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: cfg.color, opacity: 0.85 }} />
                </div>
              </div>
            )
          })}
        </div>
        <p className={`text-[9px] mt-3 ${muted}`}>
          M = Mario · V = Vanessa · E = Elvia
        </p>
      </div>

      {/* Timeline global */}
      <div className={`rounded-2xl p-5 ${bg}`}>
        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${muted}`}>Actividad Reciente</h3>
        {timeline.length === 0
          ? <p className={`text-sm text-center py-8 ${muted}`}>Sin actividad registrada aún. Los eventos aparecerán cuando los usuarios empiecen a usar la plataforma.</p>
          : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {timeline.map(ev => {
                const u = usuarios.find(u => u.id === ev.user_id)
                const email = u?.email_principal || ''
                const firstName = u?.nombre1 || email.split('@')[0]
                const cfg = FEATURE_LABELS[ev.feature] || { label: ev.feature, color: '#94a3b8' }
                const isPageView = ev.event === 'page_view'
                return (
                  <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-xl ${cardBg}`}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: cfg.color + '20' }}>
                      {isPageView
                        ? <PI.Eye size={12} weight="duotone" style={{ color: cfg.color }} />
                        : <PI.Lightning size={12} weight="fill" style={{ color: cfg.color }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold ${txt}`}>
                        <span style={{ color: cfg.color }}>{firstName}</span>
                        {' '}
                        {isPageView ? 'visitó' : 'usó'}
                        {' '}
                        <span className="font-black">{cfg.label}</span>
                        {ev.metadata?.pilar && <span className={muted}> · {PILAR_LABEL[ev.metadata.pilar] || ev.metadata.pilar}</span>}
                        {ev.metadata?.pct !== undefined && <span className={muted}> → {ev.metadata.pct}%</span>}
                      </p>
                      <p className={`text-[9px] mt-0.5 ${muted}`}>{fmtTs(ev.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

    </div>
  )
}
