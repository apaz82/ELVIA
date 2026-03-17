import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'

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

const ESTADOS = ['Por aplicar', 'Aplicada', 'En proceso', 'Oferta recibida', 'Descartada']

const colorEstado = (estado) => {
  if (estado === 'Oferta recibida') return 'bg-green-100 text-green-700'
  if (estado === 'En proceso')      return 'bg-blue-100 text-blue-700'
  if (estado === 'Aplicada')        return 'bg-purple-100 text-purple-700'
  if (estado === 'Descartada')      return 'bg-gray-100 text-gray-500'
  return 'bg-yellow-50 text-yellow-700'
}

export default function MisVacantes() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [vacantes, setVacantes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('todas')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    cargarTodo()
  }, [user, authLoading])

  const cargarTodo = async () => {
    setLoading(true)
    const [{ data: saved }, { data: checks }] = await Promise.all([
      supabase.from('saved_jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('job_checks').select('job_key, score, motivos'),
    ])
    const checkMap = {}
    ;(checks || []).forEach(c => { checkMap[c.job_key] = c })
    setVacantes((saved || []).map(s => ({ ...s, check: checkMap[s.job_key] || null })))
    setLoading(false)
  }

  const toggleLike = async (item) => {
    const nuevoLiked = !item.liked
    await supabase.from('saved_jobs').update({ liked: nuevoLiked }).eq('id', item.id)
    setVacantes(prev => prev.map(v => v.id === item.id ? { ...v, liked: nuevoLiked } : v))
  }

  const actualizarEstado = async (item, estado) => {
    await supabase.from('saved_jobs').update({ estado }).eq('id', item.id)
    setVacantes(prev => prev.map(v => v.id === item.id ? { ...v, estado } : v))
  }

  const eliminar = async (item) => {
    await supabase.from('saved_jobs').delete().eq('id', item.id)
    setVacantes(prev => prev.filter(v => v.id !== item.id))
  }

  const irCVvsJob = (item) => {
    sessionStorage.setItem('vacante_prefill', JSON.stringify({
      texto: `${item.job_data?.title || ''}\n${item.job_data?.company || ''}\n${item.job_data?.location || ''}\n\n${item.job_data?.snippet || ''}`,
    }))
    navigate('/cv-vs-job')
  }

  const filtradas = vacantes.filter(v => {
    if (tab === 'liked')          return v.liked
    if (tab === 'compatibilidad') return !!v.check
    return true
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
        <div className="space-y-3">
          {filtradas.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base leading-snug">{item.job_data?.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
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
                        {item.liked && (
                          <span className="text-xs text-red-500 flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                            Favorita
                          </span>
                        )}
                      </div>
                    </div>
                    {item.check && (
                      <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${badgeScore(item.check.score)}`}>
                        <span className="text-base font-bold">{item.check.score}%</span>
                        <span className="font-normal">match</span>
                      </div>
                    )}
                  </div>

                  {item.check?.motivos?.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {item.check.motivos.slice(0, 2).map((m, i) => (
                        <li key={i} className="text-xs text-gray-500 flex gap-1.5">
                          <span className="shrink-0">•</span>{m}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select value={item.estado || 'Por aplicar'}
                      onChange={e => actualizarEstado(item, e.target.value)}
                      className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${colorEstado(item.estado || 'Por aplicar')}`}>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <button onClick={() => irCVvsJob(item)} className="text-xs text-primary font-medium hover:underline">
                      Generar CV adaptado →
                    </button>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-2 items-stretch min-w-[120px]">
                  <button onClick={() => toggleLike(item)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 border text-xs font-medium transition-colors
                      ${item.liked ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}>
                    <svg className="w-3.5 h-3.5" fill={item.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    {item.liked ? 'Favorita' : 'Guardar'}
                  </button>
                  {item.job_data?.link && (
                    <a href={item.job_data.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary border border-primary rounded-lg px-3 py-2 hover:bg-primary hover:text-white transition-colors">
                      Ver vacante
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  )}
                  <button onClick={() => eliminar(item)}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors text-center py-1">
                    Eliminar
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
