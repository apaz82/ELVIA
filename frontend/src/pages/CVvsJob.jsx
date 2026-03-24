import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCV } from '../context/CVContext'
import { matchCVVacante, descargarCV } from '../services/cvService'
import { supabase } from '../services/authService'
import FileUpload from '../components/common/FileUpload'
import LanguageSelector from '../components/common/LanguageSelector'
import EmailField from '../components/common/EmailField'
import Button from '../components/common/Button'

export default function CVvsJob() {
  const { user, refreshUsage } = useAuth()
  const { cvArchivo, setCvArchivo, resultadoOptimize, resultadoMatch, setResultadoMatch } = useCV()
  const navigate = useNavigate()

  const [cvsExistentes, setCvsExistentes] = useState([])
  const [selectedCvId, setSelectedCvId] = useState(null)
  const [cvDecision, setCvDecision] = useState(null) // 'perfil' | 'archivo' | null

  // Cargar CVs optimizados históricos
  useEffect(() => {
    if (!user) return
    supabase
      .from('cv_results')
      .select('id, contenido, metadata, created_at')
      .eq('tipo', 'optimize')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const results = data || []
        setCvsExistentes(results)
        // Por defecto, si hay alguno, sugerir usar el más reciente
        if (results.length > 0 && !cvArchivo && !selectedCvId) {
          setCvDecision('perfil')
          setSelectedCvId(results[0].id)
        }
      })
  }, [user])

  // Sincronizar con el contexto global si acaba de optimizar uno
  useEffect(() => {
    if (resultadoOptimize?.id) {
      setSelectedCvId(resultadoOptimize.id)
      setCvDecision('perfil')
    }
  }, [resultadoOptimize])

  const [jobText, setJobText] = useState(() => {
    const prefill = sessionStorage.getItem('vacante_prefill')
    if (prefill) { sessionStorage.removeItem('vacante_prefill'); return JSON.parse(prefill).texto }
    return ''
  })
  const [jobUrl, setJobUrl] = useState('')
  const [modoInput, setModoInput] = useState('descripcion') // descripcion | link
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [language, setLanguage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabActiva, setTabActiva] = useState('cv')

  const cargarDesdeUrl = async () => {
    if (!jobUrl.trim()) return
    setLoadingUrl(true)
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl }),
      })
      const data = await res.json()
      if (data.error) return setError(data.error)
      setJobText(data.text)
      setModoInput('descripcion') // muestra el texto cargado
    } catch {
      setError('No se pudo cargar la URL. Pega la descripción manualmente.')
    } finally {
      setLoadingUrl(false)
    }
  }

  // Limpiar errores cuando el usuario interactúa con los campos o cambia de modo
  useEffect(() => {
    setError('')
  }, [modoInput, jobUrl, jobText, selectedCvId, cvArchivo])

  const analizar = async () => {
    if (!selectedCvId && !cvArchivo) return setError('Selecciona un CV de tu historial o sube uno nuevo para continuar.')
    if (!jobText.trim()) return setError('Pega la descripción de la vacante')
    if (!user) return navigate('/auth')

    setLoading(true)
    setError('')
    try {
      const data = await matchCVVacante(selectedCvId || cvArchivo, jobText, language)
      if (data.error) {
        if (data.error === 'LIMIT_REACHED') {
          setError('Agotaste tus 2 análisis gratuitos. Suscríbete para continuar.')
        } else {
          setError(data.error)
        }
        return
      }
      setResultadoMatch(data)
      setTabActiva('cv')
      refreshUsage()
    } catch {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  // Color del score según valor
  const colorScore = (score) => {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CV vs Vacante</h1>
        <p className="mt-2 text-gray-600">
          Adapta tu CV a una vacante específica y descubre tu % de compatibilidad.
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        {/* Lógica de selección de CV */}
        {cvsExistentes.length > 0 && cvDecision !== 'archivo' ? (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-900 leading-tight">Tienes CVs guardados de tus optimizaciones</h3>
                  <p className="text-xs text-blue-700 mt-0.5">Selecciona cuál deseas adaptar a esta vacante:</p>
                </div>
              </div>
              <button 
                onClick={() => { setCvDecision('archivo'); setSelectedCvId(null); setCvArchivo(null); }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-100/50"
              >
                Subir otro archivo
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {cvsExistentes.map((cv) => {
                const isSelected = selectedCvId === cv.id
                const lang = cv.metadata?.language || 'es'
                const fecha = new Date(cv.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                return (
                  <button
                    key={cv.id}
                    onClick={() => { setSelectedCvId(cv.id); setCvDecision('perfil'); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <span className="uppercase">{lang}</span>
                    <span className="opacity-40">•</span>
                    <span>{fecha}</span>
                    {isSelected && <span className="ml-1">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {cvDecision === 'archivo' && cvsExistentes.length > 0 && (
              <button 
                onClick={() => setCvDecision('perfil')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                ← Volver a mis CVs guardados
              </button>
            )}
            <FileUpload onFileSelect={(file) => { setCvArchivo(file); setCvDecision('archivo'); setSelectedCvId(null); }} archivoActual={cvArchivo} />
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">2. Vacante</h2>
            {/* Toggle descripción / link */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'descripcion', label: 'Pegar descripción' },
                { key: 'link',        label: 'Pegar link' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setModoInput(m.key)}
                  className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors ${
                    modoInput === m.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {modoInput === 'descripcion' ? (
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Pega aquí el título, empresa y descripción completa de la vacante..."
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={cargarDesdeUrl} loading={loadingUrl} disabled={!jobUrl.trim()} variant="outline">
                {loadingUrl ? 'Cargando...' : 'Cargar'}
              </Button>
            </div>
          )}

          {modoInput === 'link' && jobText && (
            <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="text-lg">✓</span> Contenido de la vacante cargado con éxito.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <LanguageSelector value={language} onChange={setLanguage} />
          <Button onClick={analizar} loading={loading} disabled={(!cvArchivo && !selectedCvId) || !jobText.trim()}>
            {loading ? 'Analizando...' : 'Analizar compatibilidad'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {!user && (
          <p className="mt-3 text-sm text-amber-600">
            ⚠️ Necesitas{' '}
            <button onClick={() => navigate('/auth')} className="underline font-medium">
              iniciar sesión
            </button>{' '}
            para analizar tu CV.
          </p>
        )}
      </div>

      {/* Resultado */}
      {resultadoMatch && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {/* Header con score */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">3. Resultado</h2>
              {resultadoMatch.jobData?.title && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {resultadoMatch.jobData.title}
                  {resultadoMatch.jobData.location ? ` · ${resultadoMatch.jobData.location}` : ''}
                  {resultadoMatch.jobData.country ? `, ${resultadoMatch.jobData.country}` : ''}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Score */}
              <div className="text-center">
                <div className={`text-3xl font-bold ${colorScore(resultadoMatch.matchScore)}`}>
                  {resultadoMatch.matchScore}%
                </div>
                <div className="text-xs text-gray-400">compatibilidad</div>
              </div>

              {/* Descargas */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => descargarCV(resultadoMatch.id, 'pdf')}>
                  ↓ PDF
                </Button>
                <Button variant="outline" onClick={() => descargarCV(resultadoMatch.id, 'word')}>
                  ↓ Word
                </Button>
              </div>
            </div>
          </div>

          {/* Barra de progreso del score */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                resultadoMatch.matchScore >= 75
                  ? 'bg-green-500'
                  : resultadoMatch.matchScore >= 50
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
              style={{ width: `${resultadoMatch.matchScore}%` }}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'cv',       label: 'CV Adaptado' },
              { key: 'analisis', label: 'Análisis' },
              { key: 'cambios',  label: `Ajustes (${resultadoMatch.changes?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTabActiva(tab.key)}
                className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                  tabActiva === tab.key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: CV adaptado */}
          {tabActiva === 'cv' && (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-gray-50 rounded-xl p-5 leading-relaxed max-h-[600px] overflow-y-auto">
              {resultadoMatch.tailoredCV}
            </pre>
          )}

          {/* Tab: Análisis detallado */}
          {tabActiva === 'analisis' && resultadoMatch.analisis && (
            <div className="space-y-5">
              {/* Fortalezas */}
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-2">Fortalezas</h3>
                <ul className="space-y-1.5">
                  {resultadoMatch.analisis.fortalezas.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Brechas */}
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2">Brechas</h3>
                <ul className="space-y-1.5">
                  {resultadoMatch.analisis.brechas.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Conclusión */}
              {resultadoMatch.analisis.conclusion && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-700 mb-1">Conclusión</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">{resultadoMatch.analisis.conclusion}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Ajustes */}
          {tabActiva === 'cambios' && (
            <ul className="space-y-2">
              {resultadoMatch.changes?.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Botón a Vacantes Similares */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Enviar por email:</p>
              <EmailField cvId={resultadoMatch.id} />
            </div>
            <Button onClick={() => navigate('/jobs')} variant="outline">
              Ver vacantes similares →
            </Button>
          </div>

          <p className="mt-4 text-xs text-gray-400 text-right">
            Créditos utilizados: {resultadoMatch.usageCount} · Plan gratuito (2 análisis)
          </p>
        </div>
      )}
    </div>
  )
}
