import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCV } from '../context/CVContext'
import { optimizarCV, descargarCV } from '../services/cvService'
import { supabase } from '../services/authService'
import FileUpload from '../components/common/FileUpload'
import LanguageSelector from '../components/common/LanguageSelector'
import EmailField from '../components/common/EmailField'
import Button from '../components/common/Button'

const LABEL_IDIOMA = { es: 'español', en: 'inglés', pt: 'portugués' }

export default function CVOptimizer() {
  const { user, refreshUsage } = useAuth()
  const { cvArchivo, setCvArchivo, setResultadoOptimize, resultadoOptimize } = useCV()
  const navigate = useNavigate()

  const [language, setLanguage]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [tabActiva, setTabActiva] = useState('cv')
  // Confirmación de reemplazo de CV existente
  const [confirmar, setConfirmar] = useState(null) // null | { cvsPrevios: [], idioma: string }

  const ejecutarAnalisis = async () => {
    setLoading(true)
    setError('')
    setConfirmar(null)
    try {
      const data = await optimizarCV(cvArchivo, language)
      if (data.error) {
        setError(data.error === 'LIMIT_REACHED'
          ? 'Agotaste tus 2 análisis gratuitos. Suscríbete para continuar.'
          : data.error)
        return
      }
      // Eliminar CVs anteriores del mismo idioma (reemplazo automático)
      const idiomaDetectado = data.metadata?.language
      if (idiomaDetectado) {
        const { data: previos } = await supabase
          .from('cv_results')
          .select('id, metadata')
          .eq('tipo', 'optimize')
          .neq('id', data.id)
        const aEliminar = (previos || [])
          .filter(cv => cv.metadata?.language === idiomaDetectado)
          .map(cv => cv.id)
        if (aEliminar.length > 0) {
          await supabase.from('cv_results').delete().in('id', aEliminar)
        }
      }
      setResultadoOptimize(data)
      setTabActiva('cv')
      refreshUsage()
    } catch {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const analizar = async () => {
    if (!cvArchivo) return setError('Selecciona un archivo primero')
    if (!user)      return navigate('/auth')

    // Verificar si ya existe un CV optimizado en el mismo idioma
    if (language) {
      const { data: previos } = await supabase
        .from('cv_results')
        .select('id, metadata')
        .eq('tipo', 'optimize')
      const mismoIdioma = (previos || []).filter(cv => cv.metadata?.language === language)
      if (mismoIdioma.length > 0) {
        setConfirmar({ cvsPrevios: mismoIdioma, idioma: language })
        return
      }
    } else {
      // Sin idioma seleccionado — verificar si hay algún CV anterior
      const { data: previos } = await supabase
        .from('cv_results')
        .select('id, metadata')
        .eq('tipo', 'optimize')
      if (previos && previos.length > 0) {
        setConfirmar({ cvsPrevios: previos, idioma: null })
        return
      }
    }

    await ejecutarAnalisis()
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* Modal de confirmación — reemplazo de CV existente */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-7 max-w-sm w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">CV existente detectado</h3>
            <p className="text-sm text-gray-500 mb-5">
              Ya tienes{' '}
              {confirmar.idioma
                ? `un CV optimizado en ${LABEL_IDIOMA[confirmar.idioma] || confirmar.idioma}`
                : `${confirmar.cvsPrevios.length} CV(s) optimizado(s)`}
              . Al continuar, {confirmar.cvsPrevios.length === 1 ? 'será reemplazado' : 'serán reemplazados'} por el nuevo.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmar(null)}
                className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:border-gray-400 transition-colors">
                Cancelar
              </button>
              <button onClick={ejecutarAnalisis}
                className="flex-1 bg-primary text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                Reemplazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Optimizer</h1>
        <p className="text-gray-500">Sube tu CV y obtén una versión optimizada en formato Harvard. Sin inventar información.</p>
      </div>

      {/* Upload */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Sube tu CV</h2>
        <p className="text-sm text-gray-400 mb-5">PDF, DOC o DOCX — máx. 5MB</p>

        <FileUpload onFileSelect={setCvArchivo} archivoActual={cvArchivo} />

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
