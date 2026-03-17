import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { descargarCV } from '../services/cvService'

const extraerNombre = (contenido) => {
  if (!contenido) return 'CV sin nombre'
  return contenido.split('\n').find(l => l.trim().length > 2)?.trim() || 'CV sin nombre'
}

const formatFecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const colorScore = (score) => {
  if (score >= 75) return 'text-green-600'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-400'
}

const badgeScore = (score) => {
  if (score >= 75) return 'bg-green-50 border-green-200 text-green-700'
  if (score >= 50) return 'bg-amber-50 border-amber-200 text-amber-700'
  return 'bg-red-50 border-red-200 text-red-600'
}

const parsearJobKey = (key = '') => {
  const [titulo, empresa] = key.split('|')
  return { titulo: titulo?.trim() || key, empresa: empresa?.trim() || '' }
}

// Botones de descarga reutilizables
function BotonesDescarga({ id, descargando, onDescargar }) {
  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={() => onDescargar(id, 'pdf')} disabled={!!descargando[id]}
        className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
        {descargando[id] === 'pdf' ? '...' : '↓ PDF'}
      </button>
      <button onClick={() => onDescargar(id, 'word')} disabled={!!descargando[id]}
        className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
        {descargando[id] === 'word' ? '...' : '↓ Word'}
      </button>
    </div>
  )
}

// Info de vacante reutilizable
function InfoVacante({ title, company, location, link, via, snippet }) {
  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vacante</p>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {company && <p className="text-xs text-gray-600 mt-0.5 font-medium">{company}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
        {location && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {location}
          </span>
        )}
        {via && <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">{via}</span>}
      </div>
      {snippet && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{snippet}</p>}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Ver vacante original
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      )}
    </div>
  )
}

export default function MisCVs() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [cvsOptimizados, setCvsOptimizados] = useState([])
  const [cvsMatch, setCvsMatch]             = useState([])
  const [checks, setChecks]                 = useState([])
  const [loading, setLoading]               = useState(true)
  const [descargando, setDescargando]       = useState({})
  const [tab, setTab]                       = useState('optimizados')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    cargarTodo()
  }, [user, authLoading])

  const cargarTodo = async () => {
    setLoading(true)
    const [{ data: cvData }, { data: checkData }, { data: savedData }] = await Promise.all([
      supabase.from('cv_results')
        .select('id, tipo, contenido, metadata, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('job_checks')
        .select('id, job_key, score, motivos, job_data, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('saved_jobs')
        .select('job_key, job_data'),
    ])

    // Indexar saved_jobs por job_key como fallback para entradas antiguas
    const savedMap = {}
    ;(savedData || []).forEach(s => { savedMap[s.job_key] = s.job_data })

    const todos = cvData || []
    setCvsOptimizados(todos.filter(c => c.tipo === 'optimize'))
    setCvsMatch(todos.filter(c => c.tipo === 'match').map(cv => {
      const jobTitle   = cv.metadata?.jobData?.title || ''
      const jobCompany = cv.metadata?.jobData?.company || cv.metadata?.jobData?.empresa || ''
      const jobKey     = `${jobTitle.toLowerCase().trim()}|${jobCompany.toLowerCase().trim()}`
      return { ...cv, savedJob: savedMap[jobKey] || null }
    }))
    // job_data viene ahora directo de job_checks; saved_jobs como fallback para registros viejos
    setChecks((checkData || []).map(c => ({
      ...c,
      jobData: c.job_data || savedMap[c.job_key] || null,
    })))
    setLoading(false)
  }

  const handleDescargar = async (id, formato) => {
    setDescargando(d => ({ ...d, [id]: formato }))
    try { await descargarCV(id, formato) }
    finally { setDescargando(d => ({ ...d, [id]: null })) }
  }

  const EmptyState = ({ mensaje, cta, ruta }) => (
    <div className="text-center py-12">
      <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p className="text-sm text-gray-400">{mensaje}</p>
      <button onClick={() => navigate(ruta)} className="mt-3 text-sm text-primary font-medium hover:underline">{cta}</button>
    </div>
  )

  const tabs = [
    { key: 'optimizados', label: `CV Optimizado (${cvsOptimizados.length})` },
    { key: 'compatibilidades', label: `Compatibilidad (${checks.length})` },
    { key: 'match', label: `CV vs Vacante (${cvsMatch.length})` },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis CVs</h1>
        <p className="mt-2 text-gray-600">Historial completo de documentos y compatibilidades verificadas.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-sm font-medium py-2 px-4 rounded-lg transition-colors ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando historial...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">

          {/* Tab 1: CV Optimizado */}
          {tab === 'optimizados' && (
            cvsOptimizados.length === 0
              ? <EmptyState mensaje="Aún no tienes CVs optimizados." cta="Optimizar mi CV →" ruta="/" />
              : <div className="space-y-3">
                  {cvsOptimizados.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">CV Optimizado</span>
                          {item.metadata?.language && (
                            <span className="text-xs text-gray-400 uppercase">{item.metadata.language}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-1 truncate">{extraerNombre(item.contenido)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatFecha(item.created_at)}</p>
                      </div>
                      <BotonesDescarga id={item.id} descargando={descargando} onDescargar={handleDescargar} />
                    </div>
                  ))}
                </div>
          )}

          {/* Tab 2: Compatibilidades */}
          {tab === 'compatibilidades' && (
            checks.length === 0
              ? <EmptyState mensaje="Aún no has verificado compatibilidades." cta="Buscar vacantes →" ruta="/jobs" />
              : <div className="space-y-3">
                  {checks.map(item => {
                    const { titulo, empresa } = parsearJobKey(item.job_key)
                    const motivos = Array.isArray(item.motivos) ? item.motivos : []
                    const job = item.jobData
                    return (
                      <div key={item.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-800 capitalize">{job?.title || titulo}</p>
                              {job?.via && <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">{job.via}</span>}
                            </div>
                            {(job?.company || empresa) && (
                              <p className="text-xs text-gray-600 mt-0.5 font-medium capitalize">{job?.company || empresa}</p>
                            )}
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {job?.location && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                  </svg>
                                  {job.location}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">{formatFecha(item.created_at)}</span>
                            </div>
                            {job?.link && (
                              <a href={job.link} target="_blank" rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                Ver vacante
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                </svg>
                              </a>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-2xl font-bold ${colorScore(item.score)}`}>{item.score}%</span>
                            <p className="text-xs text-gray-400">compatibilidad</p>
                          </div>
                        </div>
                        {motivos.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {motivos.slice(0, 3).map((m, i) => (
                              <li key={i} className="text-xs text-gray-500 flex gap-1.5">
                                <span className="shrink-0 mt-0.5">•</span>{m}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
          )}

          {/* Tab 3: CV vs Vacante */}
          {tab === 'match' && (
            cvsMatch.length === 0
              ? <EmptyState mensaje="Aún no has generado CVs adaptados a vacantes." cta="CV vs Vacante →" ruta="/cv-vs-job" />
              : <div className="space-y-4">
                  {cvsMatch.map(item => {
                    const jd = item.metadata?.jobData || {}
                    const saved = item.savedJob
                    const score = item.metadata?.matchScore
                    // Preferir datos de saved_jobs (tienen link), caer a metadata
                    const vacTitle    = saved?.title    || jd.title    || ''
                    const vacCompany  = saved?.company  || jd.company  || jd.empresa || ''
                    const vacLocation = saved?.location || [jd.location, jd.country].filter(Boolean).join(', ') || ''
                    const vacLink     = saved?.link     || jd.link     || ''
                    const vacVia      = saved?.via      || ''
                    const vacSnippet  = saved?.snippet  || ''
                    return (
                      <div key={item.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                        {/* Header: nombre del CV + score + idioma */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">CV vs Vacante</span>
                              {item.metadata?.language && (
                                <span className="text-xs text-gray-400 uppercase">{item.metadata.language}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-800 mt-1 truncate">{extraerNombre(item.contenido)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatFecha(item.created_at)}</p>
                          </div>
                          {score != null && (
                            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 ${badgeScore(score)}`}>
                              <span className="text-lg font-bold">{score}%</span>
                              <span className="font-normal">match</span>
                            </div>
                          )}
                        </div>

                        {/* Info de la vacante */}
                        {vacTitle && (
                          <InfoVacante
                            title={vacTitle}
                            company={vacCompany}
                            location={vacLocation}
                            link={vacLink}
                            via={vacVia}
                            snippet={vacSnippet}
                          />
                        )}

                        {/* Descarga */}
                        <div className="mt-3 flex justify-end">
                          <BotonesDescarga id={item.id} descargando={descargando} onDescargar={handleDescargar} />
                        </div>
                      </div>
                    )
                  })}
                </div>
          )}

        </div>
      )}
    </div>
  )
}
