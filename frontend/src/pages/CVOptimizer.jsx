import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCV } from '../context/CVContext'
import { optimizarCV, descargarCV, obtenerInfografia } from '../services/cvService'
import CVInfographic from '../components/cv/CVInfographic'
import { supabase } from '../services/authService'
import FileUpload from '../components/common/FileUpload'
import LanguageSelector from '../components/common/LanguageSelector'
import EmailField from '../components/common/EmailField'
import Button from '../components/common/Button'

const LABEL_IDIOMA = { es: 'Español', en: 'Inglés', pt: 'Portugués' }

const formatFecha = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const nombreCV = (cv) => {
  const linea = cv.contenido?.split('\n').find(l => l.trim().length > 2)?.trim()
  return linea || 'CV optimizado'
}

export default function CVOptimizer() {
  const { user, refreshUsage, perfil } = useAuth()
  const { cvArchivo, setCvArchivo, setResultadoOptimize, resultadoOptimize } = useCV()
  const navigate = useNavigate()

  const [language, setLanguage]           = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [tabActiva, setTabActiva]         = useState('cv')
  const [cvsExistentes, setCvsExistentes] = useState([])
  const [descargando, setDescargando]         = useState({})
  const [cargandoPerfil, setCargandoPerfil]   = useState(false)
  const [vistaInfografia, setVistaInfografia] = useState(false)
  const [datosInfografia, setDatosInfografia] = useState(null)
  const [cargandoInfografia, setCargandoInfografia] = useState(false)
  // null = sin decidir, 'perfil' = usar CV del perfil, 'nuevo' = subir nuevo
  const [cvDecision, setCvDecision] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Cargar CVs optimizados existentes del usuario
  useEffect(() => {
    if (!user) return
    supabase
      .from('cv_results')
      .select('id, contenido, metadata, created_at')
      .eq('tipo', 'optimize')
      .order('created_at', { ascending: false })
      .then(({ data }) => setCvsExistentes(data || []))
  }, [user])

  const toggleInfografia = async () => {
    if (vistaInfografia) { setVistaInfografia(false); return }
    if (!datosInfografia && resultadoOptimize?.id) {
      setCargandoInfografia(true)
      try {
        const datos = await obtenerInfografia(resultadoOptimize.id)
        setDatosInfografia(datos)
      } catch {
        // Si falla, no bloqueamos — simplemente no mostramos la infografía
      } finally {
        setCargandoInfografia(false)
      }
    }
    setVistaInfografia(true)
  }

  const handleDescargar = async (id, fmt) => {
    setDescargando(d => ({ ...d, [id]: fmt }))
    await descargarCV(id, fmt)
    setDescargando(d => ({ ...d, [id]: null }))
  }

  // Carga el CV guardado en Storage desde el onboarding
  const usarCvDePerfil = async () => {
    if (!perfil?.cv_path) return
    setCargandoPerfil(true)
    setError('')
    try {
      const { data, error: dlErr } = await supabase.storage
        .from('cvs')
        .download(perfil.cv_path)
      if (dlErr) throw dlErr
      const ext      = perfil.cv_path.split('.').pop()
      const mimeMap  = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      const file     = new File([data], perfil.cv_filename || `cv.${ext}`, { type: mimeMap[ext] || 'application/octet-stream' })
      setCvArchivo(file)
      setCvDecision('perfil')
    } catch (err) {
      setError('No se pudo cargar el CV del perfil. Sube el archivo manualmente.')
      setCvDecision('nuevo')
    } finally {
      setCargandoPerfil(false)
    }
  }

  const handleOptimizarClick = () => {
    if (!cvArchivo) return setError('Selecciona un archivo primero')
    if (cvsExistentes.length > 0) {
      setShowConfirmModal(true)
    } else {
      analizar()
    }
  }

  const analizar = async () => {
    if (!cvArchivo) return setError('Selecciona un archivo primero')
    if (!user)      return navigate('/auth')
    
    setShowConfirmModal(false)
    setLoading(true)
    setError('')
    try {
      const data = await optimizarCV(cvArchivo, language)
      if (data.error) {
        if (data.error === 'LIMIT_REACHED') setError('Agotaste tus análisis gratuitos. Suscríbete para continuar.')
        else if (data.error === 'ACCOUNT_SUSPENDED') setError('Tu cuenta ha sido suspendida. Contacta a soporte.')
        else setError(data.error)
        return
      }

      // Limpieza de historial: Conservar máximo los últimos 5 CVs en total para no saturar la BD (y se mantienen visibles en Mis CVs)
      const nuevosCVs = [ {id: data.id}, ...cvsExistentes ]
      if (nuevosCVs.length > 5) {
        const aEliminar = nuevosCVs.slice(5).map(c => c.id) // Todos a partir del sexto
        await supabase.from('cv_results').delete().in('id', aEliminar)
      }

      // Recargar lista de CVs existentes
      const { data: actualizados } = await supabase
        .from('cv_results')
        .select('id, contenido, metadata, created_at')
        .eq('tipo', 'optimize')
        .order('created_at', { ascending: false })
      setCvsExistentes(actualizados || [])
      setResultadoOptimize(data)
      setTabActiva('cv')
      refreshUsage()
    } catch {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 relative">

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Optimizer</h1>
        <p className="text-gray-500">Sube tu CV y obtén una versión optimizada en formato Harvard. Sin inventar información.</p>
      </div>

      {/* CVs optimizados existentes */}
      {cvsExistentes.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Tus CVs optimizados</h2>
            <button onClick={() => navigate('/mis-cvs')}
              className="text-xs text-primary font-medium hover:underline">
              Ver todos en Mis CVs →
            </button>
          </div>
          <div className="space-y-3">
            {cvsExistentes.map(cv => (
              <div key={cv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{nombreCV(cv)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {cv.metadata?.language && (
                      <span className="text-xs bg-purple-50 text-purple-600 border border-purple-100 rounded-full px-2 py-0.5">
                        {LABEL_IDIOMA[cv.metadata.language] || cv.metadata.language}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatFecha(cv.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleDescargar(cv.id, 'pdf')} disabled={!!descargando[cv.id]}
                    className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                    {descargando[cv.id] === 'pdf' ? '...' : '↓ PDF'}
                  </button>
                  <button onClick={() => handleDescargar(cv.id, 'word')} disabled={!!descargando[cv.id]}
                    className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                    {descargando[cv.id] === 'word' ? '...' : '↓ Word'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          {cvsExistentes.length > 0 ? 'Subir nuevo CV' : 'Sube tu CV'}
        </h2>
        <p className="text-sm text-gray-400 mb-5">PDF, DOC o DOCX — máx. 5MB</p>

        {/* Pregunta: ¿usar CV del perfil? — se muestra solo si hay CV guardado, aún no se ha decidido y NO hay CVs optimizados */}
        {perfil?.cv_path && cvDecision === null && cvsExistentes.length === 0 ? (
          <div className="mb-2 p-5 bg-primary/5 border border-primary/20 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xl">📄</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  Tienes un CV guardado en tu perfil
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {perfil.cv_filename || 'CV de mi perfil'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              ¿Quieres optimizar ese CV o prefieres subir uno diferente?
            </p>
            <div className="flex gap-3">
              <button
                onClick={usarCvDePerfil}
                disabled={cargandoPerfil}
                className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                {cargandoPerfil ? 'Cargando...' : 'Sí, usar este CV'}
              </button>
              <button
                onClick={() => setCvDecision('nuevo')}
                disabled={cargandoPerfil}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                No, subir otro
              </button>
            </div>
          </div>
        ) : null}

        {/* CV cargado del perfil — resumen */}
        {cvDecision === 'perfil' && cvArchivo && (
          <div className="mb-4 flex items-center justify-between gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-primary text-base shrink-0">📄</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{cvArchivo.name}</p>
                <p className="text-xs text-gray-400">CV cargado desde tu perfil</p>
              </div>
            </div>
            <button
              onClick={() => { setCvArchivo(null); setCvDecision('nuevo') }}
              className="shrink-0 text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
              Cambiar
            </button>
          </div>
        )}

        {/* Upload normal — solo si decidió subir nuevo, no hay CV en perfil, o ya tiene historial previo */}
        {(cvDecision === 'nuevo' || !perfil?.cv_path || cvsExistentes.length > 0) && (
          <FileUpload onFileSelect={setCvArchivo} archivoActual={cvArchivo} />
        )}

        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-gray-100">
          <LanguageSelector value={language} onChange={setLanguage} />
          <Button onClick={handleOptimizarClick} loading={loading} disabled={!cvArchivo}>
            {loading ? 'Analizando...' : 'Optimizar CV →'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex gap-2">
            <span className="shrink-0">⚠️</span>{error}
          </div>
        )}

        {!user && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 flex gap-2">
            <span className="shrink-0">🔒</span>
            <span>Necesitas{' '}
              <button onClick={() => navigate('/auth')} className="underline font-semibold">iniciar sesión</button>
              {' '}para analizar tu CV.
            </span>
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultadoOptimize && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Tu CV optimizado</h2>
              <p className="text-sm text-gray-400">Listo para descargar o enviar</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => descargarCV(resultadoOptimize.id, 'pdf')}>↓ PDF</Button>
              <Button variant="outline" onClick={() => descargarCV(resultadoOptimize.id, 'word')}>↓ Word</Button>
              <button
                onClick={toggleInfografia}
                disabled={cargandoInfografia}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
                  vistaInfografia
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                } disabled:opacity-50`}
              >
                {cargandoInfografia ? (
                  <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" /> Generando...</>
                ) : (
                  <>{vistaInfografia ? '📄 Vista Texto' : '🎨 Vista Infográfica'}</>
                )}
              </button>
              <Button onClick={() => navigate('/cv-vs-job')}>CV vs Vacante →</Button>
            </div>
          </div>

          {/* Vista Infográfica */}
          {vistaInfografia && datosInfografia && (
            <div className="mb-6 overflow-x-auto">
              <CVInfographic
                datos={datosInfografia}
                watermark={resultadoOptimize.watermark}
              />
            </div>
          )}

          {/* Tabs — solo visibles en vista texto */}
          {!vistaInfografia && <div className="flex gap-6 mb-6 border-b border-gray-100">
            {[
              { key: 'cv',              label: 'CV Optimizado' },
              { key: 'cambios',         label: `Cambios (${resultadoOptimize.changes?.length || 0})` },
              { key: 'recomendaciones', label: `Recomendaciones (${resultadoOptimize.recommendations?.length || 0})` },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setTabActiva(tab.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                  tabActiva === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>}

          {!vistaInfografia && tabActiva === 'cv' && (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 rounded-xl p-6 leading-relaxed max-h-[600px] overflow-y-auto border border-gray-100">
              {resultadoOptimize.optimizedCV}
            </pre>
          )}
          {!vistaInfografia && tabActiva === 'cambios' && (
            <ul className="space-y-1">
              {resultadoOptimize.changes?.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-teal shrink-0 font-bold mt-0.5">✓</span><span>{c}</span>
                </li>
              ))}
            </ul>
          )}
          {!vistaInfografia && tabActiva === 'recomendaciones' && (
            <ul className="space-y-1">
              {resultadoOptimize.recommendations?.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="shrink-0 mt-0.5">💡</span><span>{r}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Enviar por email:</p>
            <EmailField cvId={resultadoOptimize.id} />
          </div>
          <p className="mt-4 text-xs text-gray-400 text-right">
            Créditos utilizados: {resultadoOptimize.usageCount} · Plan gratuito (2 análisis)
          </p>
        </div>
      )}

      {/* Modal de confirmación para reemplazo de CV activo */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4 border border-amber-100">
                <span className="text-amber-500 text-2xl">ℹ</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Optimizar un nuevo CV?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Al optimizar un nuevo CV, reemplazará el anterior del mismo idioma como tu versión activa.
                No te preocupes — los podrás encontrar todos en <strong className="font-semibold text-gray-900">Mis CVs</strong> ordenados por fecha.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={analizar}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : null}
                {loading ? 'Analizando...' : 'Optimizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
