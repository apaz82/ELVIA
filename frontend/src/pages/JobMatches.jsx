import { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { useNavigate } from 'react-router-dom'
import { useCV } from '../context/CVContext'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { supabase } from '../services/authService'
import { api } from '../services/api'
import { useTrackEvent } from '../hooks/useTrackEvent'
import Button from '../components/common/Button'
import JobActionPanel from '../components/common/JobActionPanel'
import FeatureLocked from '../components/common/FeatureLocked'
import HelpBadge from '../components/common/HelpBadge'
import { Briefcase } from '@phosphor-icons/react'

const extraerNombre = (contenido) => {
  if (!contenido) return 'CV sin nombre'
  return contenido.split('\n').find(l => l.trim().length > 2)?.trim() || 'CV sin nombre'
}

const fechaRelativa = (fechaStr) => {
  if (!fechaStr) return null
  const diff = Date.now() - new Date(fechaStr).getTime()
  const dias = Math.floor(diff / 86400000)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 30) return `Hace ${dias} días`
  return null
}

const colorScore = (score) => {
  if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-50 border-green-200' }
  if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
  return { text: 'text-red-500', bg: 'bg-red-50 border-red-200' }
}



export default function JobMatches() {
  const { resultadoMatch, resultadoOptimize } = useCV()
  const { user, refreshUsage, perfil, featuresDesbloqueadas, loading: authLoading } = useAuth()
  const { isB2B } = useTenant()
  const navigate = useNavigate()
  const track = useTrackEvent()
  useEffect(() => { track('page_view', 'job_matches') }, [])

  // CV base para compatibilidad: primero el de contexto (sesión actual), si no el seleccionado de historial
  const cvTextContexto = resultadoOptimize?.optimizedCV || resultadoMatch?.tailoredCV || ''

  const [cvsSaved, setCvsSaved]         = useState([])
  const [cvSeleccionado, setCvSeleccionado] = useState(null)
  const [mostrarSelector, setMostrarSelector] = useState(false)
  const selectorRef = useRef(null)

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

  const cvText = cvTextContexto || cvSeleccionado?.contenido || ''

  // Cargar CVs base guardados (optimize/generar — no infografías, linkedin, entrevistas)
  useEffect(() => {
    if (cvTextContexto || !user) return
    const SUBTIPOS_EXCLUIDOS = ['infografia_proyecto', 'linkedin_analysis', 'entrevista_simulada']
    supabase.from('cv_results')
      .select('id, contenido, tipo, metadata, created_at')
      .eq('user_id', user.id)
      .in('tipo', ['optimize', 'generar'])
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data?.length) return
        const cvBase = (data || []).filter(r => {
          const sub = r.metadata?.subtipo
          return !SUBTIPOS_EXCLUIDOS.includes(sub)
        })
        if (!cvBase.length) return
        setCvsSaved(cvBase)
        setCvSeleccionado({ id: cvBase[0].id, nombre: extraerNombre(cvBase[0].contenido), contenido: cvBase[0].contenido })
      })
  }, [user, cvTextContexto])

  // --- Búsquedas guardadas en localStorage ---
  const STORAGE_KEY = 'cvopt_saved_searches'
  const cargarBusquedasGuardadas = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  }
  const persistirBusqueda = (t, u, f) => {
    const label = [t, u].filter(Boolean).join(' · ')
    const nueva = { id: Date.now(), titulo: t, ubicacion: u, filtros: f, label }
    const previas = cargarBusquedasGuardadas().filter(s => s.label !== label)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([nueva, ...previas].slice(0, 6)))
    setBusquedasGuardadas([nueva, ...previas].slice(0, 6))
  }
  const eliminarBusquedaGuardada = (id) => {
    const actualizadas = cargarBusquedasGuardadas().filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizadas))
    setBusquedasGuardadas(actualizadas)
  }

  const [modoEmpresasActivo, setModoEmpresasActivo] = useState(false) // búsqueda dirigida por empresas objetivo
  const [empresasObjetivo, setEmpresasObjetivo] = useState([]) // top5 del perfilador
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState([]) // subset para búsqueda
  const [keywords, setKeywords] = useState(resultadoMatch?.jobData?.title || '')
  const [compatScores, setCompatScores] = useState({}) // jobKey → score calculado
  const [avisosPerfil, setAvisosPerfil] = useState([]) // mensajes contextuales de campos faltantes
  const [paisSeleccionado, setPaisSeleccionado] = useState('') // selector de país
  const [ubicacion, setUbicacion] = useState(
    [resultadoMatch?.jobData?.location, resultadoMatch?.jobData?.country].filter(Boolean).join(', ') || 'México'
  )
  const [filtros, setFiltros] = useState({
    datecreated: '', employment_type: '', experience: '', radius: '', salary: '',
  })
  const [vacantes, setVacantes]             = useState([])
  const [total, setTotal]                   = useState(0)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [buscado, setBuscado]               = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(true) // visibles al inicio
  const [panelAbierto, setPanelAbierto]     = useState({})
  const [ciudadSugerencias, setCiudadSugerencias] = useState([])

  const UBICACIONES_SUGERIDAS = [
    // Países principales
    'México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'España', 'Estados Unidos', 
    'Ecuador', 'Uruguay', 'Panamá', 'Costa Rica', 'Dominicana',
    // Ciudades México
    'Ciudad de México, México', 'Guadalajara, México', 'Monterrey, México', 'Puebla, México', 'Querétaro, México',
    // Ciudades Colombia
    'Bogotá, Colombia', 'Medellín, Colombia', 'Cali, Colombia', 'Barranquilla, Colombia',
    // Ciudades Argentina
    'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina',
    // Chile
    'Santiago, Chile', 'Valparaíso, Chile',
    // Perú
    'Lima, Perú', 'Arequipa, Perú',
    // Brasil
    'São Paulo, Brasil', 'Rio de Janeiro, Brasil',
    // USA
    'Miami, USA', 'Houston, USA', 'Los Angeles, USA', 'New York, USA', 'Dallas, USA', 'Austin, USA',
    // España
    'Madrid, España', 'Barcelona, España', 'Valencia, España',
    // Otros
    'Remote', 'Remoto',
  ]

  const filtrarUbicaciones = (texto) => {
    if (!texto || texto.length < 2) { setCiudadSugerencias([]); return }
    const matches = UBICACIONES_SUGERIDAS.filter(c => c.toLowerCase().includes(texto.toLowerCase())).slice(0, 8)
    setCiudadSugerencias(matches)
  }
  const [savedKeys, setSavedKeys]           = useState(new Set()) // job_keys con liked=true
  const [busquedasGuardadas, setBusquedasGuardadas] = useState(cargarBusquedasGuardadas)

  // Prioridad ubicación: perfil del usuario → default México (sin geo-IP)
  useEffect(() => {
    if (!perfil) return
    if (perfil.ciudad || perfil.pais) {
      setUbicacion([perfil.ciudad, perfil.pais].filter(Boolean).join(', '))
    }
  }, [perfil])

  // Cargar Perfilador: top5empresas + cargo_objetivo + avisos contextuales
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('job_search_profile').eq('id', user.id).maybeSingle()
      .then(({ data: p }) => {
        const jp = p?.job_search_profile || {}

        // Detectar campos clave faltantes para mostrar avisos contextuales
        const avisos = []
        const cargoObjDir = String(jp?.perfil?.cargo_objetivo || '').trim()
        const nivelCargo = (jp?.perfil?.niveles_cargo || []).length > 0
        if (!cargoObjDir && !nivelCargo) {
          avisos.push({ tipo: 'cargo', msg: 'Completa el campo "Cargo objetivo" en el Perfilador para obtener mejores resultados de búsqueda.', ruta: '/proyecto-laboral' })
        }
        const hardSkills = jp?.autoconocimiento?.hard_skills || []
        const softSkills = jp?.autoconocimiento?.soft_skills || []
        if (hardSkills.length < 2 || softSkills.length < 2) {
          avisos.push({ tipo: 'skills', msg: 'Agrega al menos 2 Hard Skills y 2 Power Skills en el Gerente de Proyecto para mejorar el análisis de compatibilidad.', ruta: '/proyecto-laboral' })
        }
        setAvisosPerfil(avisos)
        const empresas = (
          Array.isArray(jp?.perfil?.top5empresas) ? jp.perfil.top5empresas :
          Array.isArray(jp?.autoconocimiento?.top5empresas) ? jp.autoconocimiento.top5empresas : []
        ).filter(e => e && String(e).trim())
        if (empresas.length > 0) {
          setEmpresasObjetivo(empresas)
          setEmpresasSeleccionadas(empresas) // todas seleccionadas por default
        }
        // Precargar keywords: 1º campo directo cargo_objetivo, 2º fallback nivel+área
        const cargoDirecto = String(jp?.perfil?.cargo_objetivo || '').trim()
        if (cargoDirecto) {
          setKeywords(prev => prev || cargoDirecto)
        } else {
          const niveles = jp?.perfil?.niveles_cargo || []
          const areas = jp?.perfil?.areas || []
          const cargo = [niveles[0] || '', areas[0] || ''].filter(Boolean).join(' ')
          if (cargo) setKeywords(prev => prev || cargo)
        }
        // Activar modo empresas por default si hay empresas Y cargo definido
        const cargoFinal = cargoDirecto || (jp?.perfil?.niveles_cargo||[])[0] || ''
        if (empresas.length > 0 && cargoFinal) setModoEmpresasActivo(true)
      })
      .catch(() => {})
  }, [user])

  const generarJobKey = (title, company) =>
    `${(title || '').toLowerCase().trim()}|${(company || '').toLowerCase().trim()}`

  // Cargar vacantes guardadas del usuario (liked=true para mostrar corazón activo)
  const recargarSavedKeys = async () => {
    if (!user) return
    const { data } = await supabase.from('saved_jobs').select('job_key, liked')
    if (data) setSavedKeys(new Set(data.filter(r => r.liked).map(r => r.job_key)))
  }

  useEffect(() => { recargarSavedKeys() }, [user])

  const jobDataDe = (v) => ({
    title: v.title, company: v.company, location: v.location,
    link: v.link, snippet: v.snippet, via: v.via, salary: v.salary,
    full_description: [v.title, v.company, v.location, v.snippet].filter(Boolean).join('\n\n'),
  })

  const toggleLike = async (v) => {
    if (!user) return
    const key = generarJobKey(v.title, v.company)
    const tienelike = savedKeys.has(key)

    // Optimistic UI inmediato
    setSavedKeys(prev => {
      const s = new Set(prev); tienelike ? s.delete(key) : s.add(key); return s
    })

    if (tienelike) {
      const { error } = await supabase.from('saved_jobs')
        .update({ liked: false })
        .eq('job_key', key).eq('user_id', user.id)
      // Revertir si falla
      if (error) setSavedKeys(prev => new Set([...prev, key]))
    } else {
      const { error } = await supabase.from('saved_jobs').upsert({
        user_id: user.id,
        job_key: key,
        job_data: jobDataDe(v),
        liked: true,
      }, { onConflict: 'user_id,job_key' })
      // Revertir si falla
      if (error) {
        console.error('[toggleLike] error:', error.message)
        setSavedKeys(prev => { const s = new Set(prev); s.delete(key); return s })
      }
    }
  }

  const autoSave = async (v) => {
    if (!user) return
    const key = generarJobKey(v.title, v.company)
    // ignoreDuplicates: no sobreescribir si ya existe (no queremos quitar el liked)
    await supabase.from('saved_jobs').upsert({
      user_id: user.id,
      job_key: key,
      job_data: jobDataDe(v),
      liked: false,
    }, { onConflict: 'user_id,job_key', ignoreDuplicates: true })
    setSavedKeys(prev => new Set([...prev, key]))
  }

  useEffect(() => {
    if (resultadoMatch?.jobData?.title) buscar()
  }, [])

  const buscar = async () => {
    if (modoEmpresasActivo) return buscarEnEmpresas()
    if (!keywords.trim()) return setError('Ingresa cargo, habilidades o palabras clave')
    setLoading(true)
    setError('')
    setBuscado(false)
    setPanelAbierto({})
    try {
      const params = new URLSearchParams({ keywords })
      if (ubicacion) params.append('location', ubicacion)
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v) })
      const data = await api.get(`/api/jobs/similar?${params}`)
      if (data.error) return setError(data.error)
      setVacantes(data.vacantes || [])
      setTotal(data.total || 0)
      setBuscado(true)
      setMostrarFiltros(false)
      persistirBusqueda(keywords, ubicacion, filtros)
      recargarSavedKeys()
    } catch {
      setError('Error al buscar vacantes')
    } finally {
      setLoading(false)
    }
  }

  const buscarEnEmpresas = async () => {
    const query = keywords.trim()
    const empresas = empresasSeleccionadas.filter(e => e && String(e).trim())
    if (!query) return setError('Escribe un cargo o palabras clave para buscar en tus empresas objetivo')
    if (empresas.length === 0) return setError('Selecciona al menos una empresa objetivo')
    setLoading(true)
    setError('')
    setBuscado(false)
    setPanelAbierto({})
    try {
      // Usamos keywords (no title) para evitar expansión de sinónimos que distorsiona resultados
      const params = new URLSearchParams({ keywords: query })
      if (ubicacion) params.append('location', ubicacion)
      empresas.slice(0, 5).forEach(e => params.append('companies', e))
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v) })
      const data = await api.get(`/api/jobs/similar?${params}`)
      if (data.error) return setError(data.error)
      setVacantes(data.vacantes || [])
      setTotal(data.total || 0)
      setBuscado(true)
      setMostrarFiltros(false)
      recargarSavedKeys()
    } catch {
      setError('Error al buscar vacantes en empresas objetivo')
    } finally {
      setLoading(false)
    }
  }

  const aplicarBusquedaGuardada = (b) => {
    setKeywords(b.titulo)
    setUbicacion(b.ubicacion)
    setFiltros(b.filtros)
    setTimeout(() => buscarCon(b.titulo, b.ubicacion, b.filtros), 0)
  }

  const buscarCon = async (kw, u, f) => {
    if (!kw.trim()) return
    setLoading(true); setError(''); setBuscado(false); setPanelAbierto({})
    track('feature_used', 'job_matches', { keywords: kw, ubicacion: u })
    try {
      const params = new URLSearchParams({ keywords: kw })
      if (u) params.append('location', u)
      Object.entries(f).forEach(([k, v]) => { if (v) params.append(k, v) })
      const data = await api.get(`/api/jobs/similar?${params}`)
      if (data.error) return setError(data.error)
      setVacantes(data.vacantes || []); setTotal(data.total || 0); setBuscado(true)
    } catch { setError('Error al buscar vacantes') }
    finally { setLoading(false) }
  }

  const togglePanel = (id) =>
    setPanelAbierto(prev => ({ ...prev, [id]: !prev[id] }))

  // Lleva a CV vs Vacante con la descripción de la vacante pre-cargada
  const generarCVAdaptado = (vacante) => {
    sessionStorage.setItem('vacante_prefill', JSON.stringify({
      texto: `${vacante.title}\n${vacante.company || ''}\n${vacante.location || ''}\n\n${vacante.snippet || ''}`,
    }))
    navigate('/cv-vs-job')
  }

  if (authLoading) return null

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked
        titulo="Buscar Vacantes"
        descripcion="Accede a las mejores oportunidades laborales filtradas por nuestra IA según tu perfil único."
        icono={<Briefcase size={44} weight="light" />}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Buscar Vacantes
          <HelpBadge id="jobs.main" />
        </h1>
        <p className="mt-2 text-gray-600">Encuentra oportunidades y verifica tu compatibilidad antes de aplicar.</p>
      </div>

      {/* CV en uso para compatibilidad */}
      {user && (
        <div className="mb-4">
          {cvTextContexto ? (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 w-fit">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              CV de sesión actual en uso para compatibilidad
            </div>
          ) : cvSeleccionado ? (
            <div className="relative" ref={selectorRef}>
              <button onClick={() => setMostrarSelector(!mostrarSelector)}
                className="flex items-center gap-2 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-primary transition-colors">
                <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span className="text-gray-700">CV en uso: <strong>{cvSeleccionado.nombre}</strong></span>
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${mostrarSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {mostrarSelector && (
                <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  <p className="text-xs text-gray-400 px-3 pt-2 pb-1">Selecciona tu CV base:</p>
                  {cvsSaved.map(cv => (
                    <button key={cv.id} onClick={() => { setCvSeleccionado({ id: cv.id, nombre: extraerNombre(cv.contenido), contenido: cv.contenido }); setMostrarSelector(false) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 ${cvSeleccionado?.id === cv.id ? 'bg-blue-50 text-primary' : 'text-gray-700'}`}>
                      <span className="truncate">{extraerNombre(cv.contenido)}</span>
                      <span className="text-xs text-gray-400 shrink-0">{cv.tipo === 'generar' ? 'CV Inicial' : 'Optimizado'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-fit">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              No tienes CVs guardados — <button onClick={() => navigate('/')} className="underline font-medium ml-0.5">optimiza tu CV primero</button>
            </div>
          )}
        </div>
      )}

      {/* Avisos contextuales de perfil incompleto */}
      {avisosPerfil.length > 0 && (
        <div className="space-y-2 mb-4">
          {avisosPerfil.map(a => (
            <div key={a.tipo} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{a.msg} <button onClick={() => navigate(a.ruta)} className="underline font-semibold ml-0.5">Ir al Gerente de Proyecto →</button></span>
            </div>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">

        {/* Panel: Mis empresas objetivo */}
        {empresasObjetivo.length > 0 && (
          <div className={`mb-5 rounded-xl border-2 p-4 transition-colors ${modoEmpresasActivo ? 'border-indigo-300 bg-indigo-50/60' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-700">🎯 Mis empresas objetivo</span>
                <span className="text-xs text-gray-400">({empresasSeleccionadas.length}/{empresasObjetivo.length} seleccionadas)</span>
              </div>
              <button
                onClick={() => setModoEmpresasActivo(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${modoEmpresasActivo ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${modoEmpresasActivo ? 'translate-x-6' : 'translate-x-1'}`}/>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {empresasObjetivo.map(e => {
                const sel = empresasSeleccionadas.includes(e)
                return (
                  <button key={e}
                    onClick={() => setEmpresasSeleccionadas(prev => sel ? prev.filter(x => x !== e) : [...prev, e])}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer
                      ${sel ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-300 hover:border-indigo-400'}`}>
                    {e}
                    <span className={`text-xs leading-none ${sel ? 'text-indigo-200' : 'text-gray-400'}`}>{sel ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400">Estas compañías las seleccionaste en tu Autoconocimiento, puedes desmarcar para no tenerlas en cuenta y ampliar la búsqueda.</p>
            {modoEmpresasActivo && (
              <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 bg-white border border-indigo-200 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Palabras clave para buscar: <strong className="ml-1">{keywords || 'sin especificar'}</strong>
                {!keywords && <span className="text-amber-600 ml-1">— escribe cargo o habilidades abajo</span>}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {modoEmpresasActivo ? 'Cargo, habilidades o palabras clave' : 'Cargo, habilidades o palabras clave'}
              </label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="ej. Director Comercial, transformación digital, SAP..."
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${modoEmpresasActivo ? 'border-indigo-300 focus:ring-indigo-400' : 'border-gray-300 focus:ring-primary'}`} />
              <p className="text-xs text-gray-400 mt-1">
                {modoEmpresasActivo ? 'Precargado desde tu Perfilador — puedes editarlo.' : 'Puedes combinar cargo, habilidades o frases separadas por coma.'}
              </p>
            </>
          </div>
          <div className="sm:w-56 relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Ubicación</label>
            <input type="text" value={ubicacion}
              onChange={e => { setUbicacion(e.target.value); filtrarUbicaciones(e.target.value) }}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              onBlur={() => setTimeout(() => setCiudadSugerencias([]), 150)}
              placeholder="ej. Ciudad de México"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            {ciudadSugerencias.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {ciudadSugerencias.map(c => (
                  <button key={c} onMouseDown={() => { setUbicacion(c); setCiudadSugerencias([]) }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="sm:self-end">
            <Button onClick={buscar} loading={loading}
              disabled={modoEmpresasActivo ? empresasSeleccionadas.length === 0 : !keywords.trim()}>
              {modoEmpresasActivo ? '🎯 Buscar en mis empresas' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Búsquedas guardadas */}
        {busquedasGuardadas.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">Recientes:</span>
            {busquedasGuardadas.map(b => (
              <div key={b.id} className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-full pl-3 pr-1 py-1">
                <button onClick={() => aplicarBusquedaGuardada(b)}
                  className="text-xs text-gray-600 hover:text-primary transition-colors">
                  {b.label}
                </button>
                <button onClick={() => eliminarBusquedaGuardada(b.id)}
                  className="ml-1 text-gray-300 hover:text-red-400 transition-colors p-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="text-sm text-gray-500 hover:text-primary flex items-center gap-1.5 transition-colors">
            <svg className={`w-4 h-4 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
            {mostrarFiltros ? 'Ocultar filtros' : 'Más filtros'}
          </button>

          {mostrarFiltros && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'datecreated', label: 'Fecha', options: [['','Cualquier fecha'],['1','Últimas 24h'],['3','Últimos 3 días'],['7','Última semana'],['30','Último mes']] },
                { key: 'employment_type', label: 'Tipo', options: [['','Todos'],['Full-time','Tiempo completo'],['Part-time','Medio tiempo'],['Contract','Contrato'],['Internship','Prácticas'],['Temporary','Temporal']] },
                { key: 'experience', label: 'Experiencia', options: [['','Cualquiera'],['0','Sin experiencia'],['1','1+ años'],['3','3+ años'],['5','5+ años']] },
                { key: 'radius', label: 'Radio', options: [['','Sin límite'],['10','10 km'],['25','25 km'],['50','50 km'],['100','100 km']] },
              ].map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <select value={filtros[key]} onChange={e => setFiltros(f => ({...f, [key]: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Salario mínimo</label>
                <input type="number" value={filtros.salary} onChange={e => setFiltros(f => ({...f, salary: e.target.value}))}
                  placeholder="ej. 20000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex items-end">
                <button onClick={() => setFiltros({ datecreated:'', employment_type:'', experience:'', radius:'', salary:'' })}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors">Limpiar filtros</button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      </div>

      {/* Resultados */}
      {buscado && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {total > 0 ? `${total} vacantes relevantes encontradas` : 'No se encontraron vacantes'}
          </p>
          <div className="space-y-3">
            {vacantes.map((v) => {
              const vid = v.id || v.link
              const jobKey = generarJobKey(v.title, v.company)
              const esGuardada = savedKeys.has(jobKey)
              const scoreAnalizado = compatScores[jobKey] // undefined si no se analizó
              const puedeGuardar = scoreAnalizado === undefined || scoreAnalizado >= 75
              return (
                <div key={vid} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base leading-snug">{v.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {v.company && <span className="text-sm text-gray-600">{v.company}</span>}
                        {v.location && (
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            {v.location}
                          </span>
                        )}
                        {v.salary && <span className="text-sm text-green-700 font-medium">{v.salary}</span>}
                        {fechaRelativa(v.updated) && <span className="text-xs text-gray-400">{fechaRelativa(v.updated)}</span>}
                        {v.fuente && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${v.fuente === 'Google Jobs' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            {v.fuente}
                          </span>
                        )}
                        {v.company && empresasObjetivo.some(e => v.company.toLowerCase().includes(e.toLowerCase())) && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            🎯 Empresa objetivo
                          </span>
                        )}
                      </div>
                      {v.snippet && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v.snippet) }} />
                      )}

                      {/* Panel de acciones IA */}
                      {(panelAbierto[vid] || esGuardada) && (
                        <JobActionPanel
                          vacante={v}
                          cvId={cvSeleccionado?.id || (resultadoOptimize ? 'context' : null)}
                          cvText={cvText}
                          compatibilidadInicial={null}
                          onRefreshUsage={refreshUsage}
                          onSave={() => autoSave(v)}
                          onCompatibilidadCalculada={(score) =>
                            setCompatScores(prev => ({ ...prev, [jobKey]: score }))
                          }
                        />
                      )}

                      {/* Botón toggle compatibilidad (solo si no está abierto) */}
                      {!panelAbierto[vid] && !esGuardada && (
                        <button onClick={() => togglePanel(vid)}
                          className="mt-3 flex items-center gap-2 text-xs font-medium text-primary hover:underline transition-all">
                          Ver compatibilidad con mi CV →
                          {!isB2B && (
                            <span className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">
                              1 crédito
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-stretch gap-2">
                      {/* Corazón — deshabilitado si score analizado < 75% */}
                      <button
                        onClick={() => puedeGuardar ? toggleLike(v) : null}
                        title={!puedeGuardar ? `Compatibilidad ${scoreAnalizado}% — se requiere mínimo 75% para guardar` : esGuardada ? 'Quitar de guardados' : 'Guardar vacante'}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 border text-xs font-medium transition-colors
                          ${!puedeGuardar
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                            : esGuardada
                              ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                              : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'
                          }`}>
                        <svg className="w-4 h-4" fill={esGuardada ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                        {esGuardada ? 'Guardada' : 'Guardar'}
                      </button>
                      {/* Ver vacante */}
                      <a href={v.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex flex-col items-center gap-0.5 text-sm font-medium text-primary border border-primary rounded-lg px-4 py-2 hover:bg-primary hover:text-white transition-colors">
                        <span className="flex items-center gap-1.5">
                          Ver vacante
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                        </span>
                        {v.via && <span className="text-xs opacity-70 font-normal">{v.via}</span>}
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!buscado && !loading && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p className="text-sm">Ingresa un cargo para buscar vacantes,<br/>o analiza tu CV contra una vacante primero.</p>
        </div>
      )}
    </div>
  )
}
