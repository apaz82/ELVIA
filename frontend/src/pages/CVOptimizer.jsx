import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCV } from '../context/CVContext'
import { optimizarCV, descargarCV } from '../services/cvService'
import FileUpload from '../components/common/FileUpload'
import LanguageSelector from '../components/common/LanguageSelector'
import EmailField from '../components/common/EmailField'
import Button from '../components/common/Button'

export default function CVOptimizer() {
  const { user, refreshUsage } = useAuth()
  const { cvArchivo, setCvArchivo, setResultadoOptimize, resultadoOptimize } = useCV()
  const navigate = useNavigate()

  const [language, setLanguage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabActiva, setTabActiva] = useState('cv') // cv | cambios | recomendaciones

  const analizar = async () => {
    if (!cvArchivo) return setError('Selecciona un archivo primero')
    if (!user) return navigate('/auth')

    setLoading(true)
    setError('')
    try {
      const data = await optimizarCV(cvArchivo, language)
      if (data.error) {
        if (data.error === 'LIMIT_REACHED') {
          setError('Agotaste tus 2 análisis gratuitos. Suscríbete para continuar.')
        } else {
          setError(data.error)
        }
        return
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CV Optimizer</h1>
        <p className="mt-2 text-gray-600">Optimiza tu CV al formato Harvard con inteligencia artificial. Sin inventar información — solo mejoramos lo que ya tienes.</p>
      </div>

      {/* Formulario de subida */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Sube tu CV</h2>
        <FileUpload onFileSelect={setCvArchivo} archivoActual={cvArchivo} />

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <LanguageSelector value={language} onChange={setLanguage} />
          <Button onClick={analizar} loading={loading} disabled={!cvArchivo}>
            {loading ? 'Analizando...' : 'Optimizar CV'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {!user && (
          <p className="mt-3 text-sm text-amber-600">
            ⚠️ Necesitas <button onClick={() => navigate('/auth')} className="underline font-medium">iniciar sesión</button> para analizar tu CV.
          </p>
        )}
      </div>

      {/* Resultado */}
      {resultadoOptimize && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800">2. Tu CV optimizado</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => descargarCV(resultadoOptimize.id, 'pdf')}>
                ↓ PDF
              </Button>
              <Button variant="outline" onClick={() => descargarCV(resultadoOptimize.id, 'word')}>
                ↓ Word
              </Button>
              <Button onClick={() => navigate('/cv-vs-job')} variant="secondary">
                CV vs Vacante →
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'cv',              label: 'CV Optimizado' },
              { key: 'cambios',         label: `Cambios (${resultadoOptimize.changes?.length || 0})` },
              { key: 'recomendaciones', label: `Recomendaciones (${resultadoOptimize.recommendations?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTabActiva(tab.key)}
                className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                  tabActiva === tab.key ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: CV */}
          {tabActiva === 'cv' && (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-gray-50 rounded-xl p-5 leading-relaxed max-h-[600px] overflow-y-auto">
              {resultadoOptimize.optimizedCV}
            </pre>
          )}

          {/* Tab: Cambios */}
          {tabActiva === 'cambios' && (
            <ul className="space-y-2">
              {resultadoOptimize.changes?.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Tab: Recomendaciones */}
          {tabActiva === 'recomendaciones' && (
            <ul className="space-y-3">
              {resultadoOptimize.recommendations?.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="text-primary mt-0.5 shrink-0">💡</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Email */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Enviar por email:</p>
            <EmailField cvId={resultadoOptimize.id} />
          </div>

          {/* Contador de usos */}
          <p className="mt-4 text-xs text-gray-400 text-right">
            Créditos utilizados: {resultadoOptimize.usageCount} · Plan gratuito (2 análisis)
          </p>
        </div>
      )}
    </div>
  )
}
