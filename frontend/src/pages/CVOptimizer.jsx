import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCV } from '../context/CVContext'
import { optimizarCV, descargarCV } from '../services/cvService'
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
  const [descargando, setDescargando]     = useState({})
  const [cargandoPerfil, setCargandoPerfil] = useState(false)
  // null = sin decidir, 'perfil' = usar CV del perfil, 'nuevo' = subir nuevo
  const [cvDecision, setCvDecision] = useState(null)

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

  const analizar = async () => {
    if (!cvArchivo) return setError('Selecciona un archivo primero')
    if (!user)      return navigate('/auth')
    setLoading(true)
    setError('')
    try {
      const data = await optimizarCV(cvArchivo, language)
      if (data.error) {
        setError(data.error === 'LIMIT_REACHED'
          ? 'Agotaste tus 2 análisis gratuitos. Suscríbete para continuar.'
          : data.error)
        return
      }
      // Reemplazar CVs anteriores del mismo idioma
      const idiomaDetectado = data.metadata?.language
      if (idiomaDetectado) {
        const aEliminar = cvsExistentes
          .filter(cv => cv.metadata?.language === idiomaDetectado && cv.id !== data.id)
          .map(cv => cv.id)
        if (aEliminar.length > 0) {
          await supabase.from('cv_results').delete().in('id', aEliminar)
        }
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
    <div className="max-w-3xl mx-auto px-6 py-10">

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

        {/* Pregunta: ¿usar CV del perfil? — se muestra solo si hay CV guardado y aún no se ha decidido */}
        {perfil?.cv_path && cvDecision === null ? (
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

        {/* Upload normal — solo si decidió subir nuevo o no hay CV en perfil */}
        {(cvDecision === 'nuevo' || !perfil?.cv_path) && (
          <FileUpload onFileSelect={setCvArchivo} archivoActual={cvArchivo} />
        )}

        {/* Disclaimer de reemplazo — solo si ya hay CVs previos */}
        {cvsExistentes.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2">
            <span className="shrink-0 text-amber-500 text-sm">ℹ</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              Al optimizar un nuevo CV, reemplazará el anterior del mismo idioma como tu versión activa.
              No te preocupes — los podrás encontrar todos en{' '}
              <button onClick={() => navigate('/mis-cvs')} className="underline font-medium">Mis CVs</button>
              {' '}ordenados por fecha.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-gray-100">
          <LanguageSelector value={language} onChange={setLanguage} />
          <Button onClick={analizar} loading={loading} disabled={!cvArchivo}>
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
              <Button onClick={() => navigate('/cv-vs-job')}>CV vs Vacante →</Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mb-6 border-b border-gray-100">
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
          </div>

          {tabActiva === 'cv' && (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 rounded-xl p-6 leading-relaxed max-h-[600px] overflow-y-auto border border-gray-100">
              {resultadoOptimize.optimizedCV}
            </pre>
          )}
          {tabActiva === 'cambios' && (
            <ul className="space-y-1">
              {resultadoOptimize.changes?.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-teal shrink-0 font-bold mt-0.5">✓</span><span>{c}</span>
                </li>
              ))}
            </ul>
          )}
          {tabActiva === 'recomendaciones' && (
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
    </div>
  )
}
