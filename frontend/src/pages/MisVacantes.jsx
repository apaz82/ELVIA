import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCV } from '../context/CVContext'
import { supabase } from '../services/authService'
import JobActionPanel from '../components/common/JobActionPanel'
import FeatureLocked from '../components/common/FeatureLocked'
import { MagnifyingGlass } from '@phosphor-icons/react'

const formatFecha = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MisVacantes() {
  const { user, refreshUsage, loading: authLoading, featuresDesbloqueadas } = useAuth()
  const { resultadoOptimize, resultadoMatch } = useCV()
  const navigate = useNavigate()

  const [cvsSaved, setCvsSaved]         = useState([])
  const [cvSeleccionado, setCvSeleccionado] = useState(null)
  const [mostrarSelector, setMostrarSelector] = useState(false)
  const selectorRef = useRef(null)

  const [vacantes, setVacantes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('todas')
  const [ordenFecha, setOrdenFecha] = useState('desc')

  if (authLoading) return null

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked
        titulo="Mis Vacantes Guardadas"
        descripcion="Seguimiento detallado de todas las oportunidades que te interesan y análisis de compatibilidad por IA."
        icono={<MagnifyingGlass size={44} weight="light" />}
      />
    )
  }

  const extraerNombre = (contenido) => {
    if (!contenido) return 'CV sin nombre'
    return contenido.split('\n').find(l => l.trim().length > 2)?.trim() || 'CV sin nombre'
  }

  const cvTextContexto = resultadoOptimize?.optimizedCV || resultadoMatch?.tailoredCV || ''
  const cvText = cvTextContexto || cvSeleccionado?.contenido || ''

  // Cargar CVs guardados si no hay CV en contexto
  useEffect(() => {
    if (cvTextContexto || !user) return
    supabase.from('cv_results')
      .select('id, contenido, tipo, created_at')
      .eq('user_id', user.id)
      .in('tipo', ['optimize', 'match', 'generar'])
      .not('contenido', 'like', '{%')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data?.length) return
        setCvsSaved(data)
        setCvSeleccionado({ id: data[0].id, nombre: extraerNombre(data[0].contenido), contenido: data[0].contenido })
      })
  }, [user, cvTextContexto])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setMostrarSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    cargarTodo()
  }, [user, authLoading])

  const cargarTodo = async () => {
    setLoading(true)
    try {
      const [{ data: saved, error: errSaved }, { data: checks, error: errChecks }] = await Promise.all([
        supabase.from('saved_jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('job_checks').select('job_key, score, motivos').eq('user_id', user.id),
      ])

      if (errSaved) console.error('Error cargando saved_jobs en MisVacantes:', errSaved)
      if (errChecks) console.error('Error cargando job_checks en MisVacantes:', errChecks)

      const checkMap = {}
      ;(checks || []).forEach(c => {
        if (c.job_key) {
          checkMap[c.job_key] = c
        }
      })

      const mappedVacantes = (saved || []).map(s => {
        // Fallback robusto: buscar compatibilidad por job_key (consistente) o por id (UUID legacy)
        const check = (s.job_key && checkMap[s.job_key]) || checkMap[s.id] || null
        return { ...s, check }
      })

      setVacantes(mappedVacantes)
    } catch (err) {
      console.error('Error general en cargarTodo de MisVacantes:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async (item) => {
    const nuevoLiked = !item.liked
    await supabase.from('saved_jobs').update({ liked: nuevoLiked }).eq('id', item.id)
    setVacantes(prev => prev.map(v => v.id === item.id ? { ...v, liked: nuevoLiked } : v))
  }

  const eliminar = async (item) => {
    await supabase.from('saved_jobs').delete().eq('id', item.id)
    setVacantes(prev => prev.filter(v => v.id !== item.id))
  }

  const filtradas = vacantes
    .filter(v => {
      if (tab === 'liked')          return v.liked
      if (tab === 'compatibilidad') return !!v.check
      return true
    })
    .sort((a, b) => {
      const da = new Date(a.created_at), db = new Date(b.created_at)
      return ordenFecha === 'desc' ? db - da : da - db
    })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Vacantes</h1>
          <p className="mt-2 text-gray-600">Seguimiento de vacantes guardadas y compatibilidades verificadas.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/pipeline')}
            className="text-sm font-medium border border-gray-300 text-gray-600 rounded-lg px-4 py-2 hover:border-primary hover:text-primary transition-colors">
            Ver pipeline →
          </button>
          <button onClick={() => navigate('/jobs')}
            className="text-sm text-primary font-medium border border-primary rounded-lg px-4 py-2 hover:bg-primary hover:text-white transition-colors">
            Buscar vacantes →
          </button>
        </div>
      </div>

      {/* CV en uso para compatibilidad */}
      {user && (
        <div className="mb-6">
          {cvTextContexto ? (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 w-fit">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              CV de sesión actual en uso para compatibilidad
            </div>
          ) : cvSeleccionado ? (
            <div className="relative" ref={selectorRef}>
              <button onClick={() => setMostrarSelector(!mostrarSelector)}
                className="flex items-center gap-2 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-primary transition-colors">
                <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-700">CV para comparar: <strong>{cvSeleccionado.nombre}</strong></span>
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${mostrarSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mostrarSelector && (
                <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  <p className="text-xs text-gray-400 px-3 pt-2 pb-1">Selecciona el CV para comparar:</p>
                  {cvsSaved.map(cv => (
                    <button key={cv.id} onClick={() => { setCvSeleccionado({ id: cv.id, nombre: extraerNombre(cv.contenido), contenido: cv.contenido }); setMostrarSelector(false) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 ${cvSeleccionado?.id === cv.id ? 'bg-blue-50 text-primary' : 'text-gray-700'}`}>
                      <span className="truncate">{extraerNombre(cv.contenido)}</span>
                      <span className="text-xs text-gray-400 shrink-0">{cv.tipo === 'match' ? 'vs Vacante' : 'Optimizado'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-fit">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              No tienes CVs guardados para comparar.
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'todas',          label: `Todas (${vacantes.length})` },
          { key: 'liked',          label: `Guardadas (${vacantes.filter(v => v.liked).length})` },
          { key: 'compatibilidad', label: `Con análisis (${vacantes.filter(v => v.check).length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-sm font-medium py-2 px-4 rounded-lg transition-colors ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando vacantes...</div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p className="text-sm text-gray-400 mb-3">
            {tab === 'liked' ? 'No has marcado vacantes como favoritas.' :
             tab === 'compatibilidad' ? 'No has verificado compatibilidades.' :
             'No tienes vacantes guardadas aún.'}
          </p>
          <button onClick={() => navigate('/jobs')} className="text-sm text-primary font-medium hover:underline">
            Buscar vacantes →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtradas.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base leading-snug">{item.job_data?.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {item.job_data?.company && <span className="text-sm text-gray-600">{item.job_data.company}</span>}
                        {item.job_data?.location && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            {item.job_data.location}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">Descubierta: {formatFecha(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Panel de acciones IA */}
                  <JobActionPanel 
                    vacante={{
                      title: item.job_data?.title,
                      company: item.job_data?.company,
                      location: item.job_data?.location,
                      snippet: item.job_data?.snippet,
                      link: item.job_data?.link,
                      via: item.job_data?.via
                    }}
                    cvId={cvSeleccionado?.id}
                    cvText={cvText}
                    compatibilidadInicial={item.check}
                    onRefreshUsage={refreshUsage}
                  />
                </div>

                <div className="shrink-0 flex flex-col gap-2 items-stretch min-w-[140px]">
                  <button onClick={() => toggleLike(item)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 border text-xs font-semibold transition-colors
                      ${item.liked ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}>
                    <svg className="w-3.5 h-3.5" fill={item.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    {item.liked ? 'Favorita' : 'Guardar'}
                  </button>
                  {item.job_data?.link && (
                    <a href={item.job_data.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary border border-primary rounded-lg px-3 py-2 hover:bg-primary hover:text-white transition-colors">
                      Ver vacante
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  )}
                  <button onClick={() => eliminar(item)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center py-2 border border-transparent hover:border-red-100 rounded-lg">
                    Eliminar de la lista
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
