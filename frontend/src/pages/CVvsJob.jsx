import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCV } from '../context/CVContext'
import { matchCVVacante, descargarCV, obtenerInfografia } from '../services/cvService'
import CVInfographic from '../components/cv/CVInfographic'
import { supabase } from '../services/authService'
import FileUpload from '../components/common/FileUpload'
import LanguageSelector from '../components/common/LanguageSelector'
import EmailField from '../components/common/EmailField'
import Button from '../components/common/Button'
import FeatureLocked from '../components/common/FeatureLocked'
import { MagnifyingGlass, CaretDown } from '@phosphor-icons/react'

export default function CVvsJob() {
  const { user, refreshUsage, featuresDesbloqueadas } = useAuth()
  const { cvArchivo, setCvArchivo, resultadoOptimize, resultadoMatch, setResultadoMatch } = useCV()
  const navigate = useNavigate()

  const [cvsExistentes, setCvsExistentes] = useState([])
  const [selectedCvId, setSelectedCvId] = useState(null)
  const [cvDecision, setCvDecision] = useState(null) // 'perfil' | 'archivo' | 'texto' | null
  const [cvText, setCvText] = useState('') // Para pegado directo de CV

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked 
        titulo="CV vs Vacante" 
        descripcion="Mide qué tan compatible es tu CV con una vacante real y recibe sugerencias de optimización inmediata."
        icono={<MagnifyingGlass size={44} weight="light" />}
      />
    )
  }

  // Cargar CVs optimizados históricos
  useEffect(() => {
    if (!user) return
    supabase
      .from('cv_results')
      .select('id, contenido, metadata, created_at')
      .eq('user_id', user.id)
      .eq('tipo', 'optimize')
      .not('contenido', 'like', '{%')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const results = data || []
        setCvsExistentes(results)
        if (results.length > 0 && !cvArchivo && !selectedCvId) {
          setCvDecision('perfil')
          setSelectedCvId(results[0].id)
        }
      })
  }, [user])

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
  const [loadingText, setLoadingText] = useState('')
  const [showAuthWall, setShowAuthWall] = useState(false)
  const [error, setError] = useState('')
  const [tabActiva, setTabActiva] = useState('cv')
  const [vistaInfografia, setVistaInfografia] = useState(false)
  const [datosInfografia, setDatosInfografia] = useState(null)
  const [cargandoInfografia, setCargandoInfografia] = useState(false)
  const [brechaAbierta, setBrechaAbierta] = useState(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveForm, setSaveForm] = useState({ empresa: '', posicion: '', etapa: 'Descubierto' })
  const [savingPipeline, setSavingPipeline] = useState(false)
  const [savedToPipeline, setSavedToPipeline] = useState(false)

  const toggleInfografia = async () => {
    if (vistaInfografia) { setVistaInfografia(false); return }
    if (!datosInfografia && resultadoMatch?.id) {
      setCargandoInfografia(true)
      try {
        const datos = await obtenerInfografia(resultadoMatch.id)
        setDatosInfografia(datos)
      } catch {
        // no bloqueamos el flujo
      } finally {
        setCargandoInfografia(false)
      }
    }
    setVistaInfografia(true)
  }

  const guardarEnPipeline = async () => {
    if (!resultadoMatch || !user) return
    setSavingPipeline(true)
    try {
      const jobData = {
        title:       saveForm.posicion || resultadoMatch.jobData?.title || '',
        company:     saveForm.empresa  || resultadoMatch.jobData?.company || '',
        description: jobText || '',
      }
      const { data: saved, error: errJob } = await supabase
        .from('saved_jobs')
        .insert({ user_id: user.id, job_data: jobData, estado: saveForm.etapa, notas: '' })
        .select('id')
        .single()
      if (errJob) throw errJob

      await supabase.from('job_checks').upsert({
        job_key:  saved.id,
        user_id:  user.id,
        score:    resultadoMatch.matchScore,
        motivos:  resultadoMatch.analisis?.fortalezas ?? [],
      })
      setSavedToPipeline(true)
      setShowSaveForm(false)
    } catch {
      // silently handled — user can retry
    } finally {
      setSavingPipeline(false)
    }
  }

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
      setModoInput('descripcion')
    } catch {
      setError('No se pudo cargar la URL. Pega la descripción manualmente.')
    } finally {
      setLoadingUrl(false)
    }
  }

  useEffect(() => {
    setError('')
  }, [modoInput, jobUrl, jobText, selectedCvId, cvArchivo, cvText])

  const analizar = async () => {
    if (!selectedCvId && !cvArchivo && !cvText.trim()) return setError('Selecciona un CV, sube uno o pega el texto directamente.')
    if (!jobText.trim()) return setError('Pega la descripción de la vacante')

    setError('')
    setLoading(true)
    setShowAuthWall(false)

    if (!user) {
      setLoadingText('Leyendo CV...')
      setTimeout(() => setLoadingText('Cruzando requerimientos de la vacante...'), 1200)
      setTimeout(() => setLoadingText('Cálculo de penalizaciones ATS...'), 2400)
      setTimeout(() => {
        setLoading(false)
        setLoadingText('')
        setShowAuthWall(true)
      }, 3500)
      return
    }

    try {
      // El service matchCVVacante puede recibir file, string (id) o string (texto directo)
      const data = await matchCVVacante(selectedCvId || cvArchivo || cvText, jobText, language)
      if (data.error) {
        if (data.error === 'LIMIT_REACHED') setError('Agotaste tus análisis gratuitos. Suscríbete para continuar.')
        else if (data.error === 'ACCOUNT_SUSPENDED') setError('Tu cuenta ha sido suspendida. Contacta a soporte.')
        else setError(data.error)
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

  const colorScore = (score) => {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen bg-slate-50 w-full py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CV vs Vacante</h1>
          <p className="mt-2 text-gray-600">
            Adapta tu CV a una vacante específica y descubre tu % de compatibilidad.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-semibold text-gray-800">1. Tu CV</h2>
             <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'archivo', label: 'Archivo / Guardado' },
                  { key: 'texto',   label: 'Pegar Texto' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setCvDecision(m.key)}
                    className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-md transition-all ${
                      cvDecision === m.key || (m.key === 'archivo' && cvDecision === 'perfil')
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
             </div>
          </div>

          {(cvDecision === 'archivo' || cvDecision === 'perfil' || cvDecision === null) ? (
            <>
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
                        <h3 className="text-sm font-bold text-blue-900 leading-tight">Tienes CVs guardados</h3>
                        <p className="text-xs text-blue-700 mt-0.5">Selecciona cuál deseas adaptar:</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setCvDecision('archivo'); setSelectedCvId(null); setCvArchivo(null); }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-100/50"
                    >
                      Subir archivo
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
                            isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
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
                    <button onClick={() => setCvDecision('perfil')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">← Volver a mis CVs guardados</button>
                  )}
                  <FileUpload onFileSelect={(file) => { setCvArchivo(file); setCvDecision('archivo'); setSelectedCvId(null); }} archivoActual={cvArchivo} />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
               <textarea
                 value={cvText}
                 onChange={(e) => setCvText(e.target.value)}
                 placeholder="Pega aquí el contenido completo de tu CV actual..."
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-48 resize-none"
               />
               <p className="text-[10px] text-gray-400 italic">Nuestra IA extraerá tu experiencia, educación y habilidades automáticamente.</p>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">2. Vacante</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[{ key: 'descripcion', label: 'Pegar descripción' }, { key: 'link', label: 'Pegar link' }].map((m) => (
                  <button key={m.key} onClick={() => setModoInput(m.key)} className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors ${modoInput === m.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>{m.label}</button>
                ))}
              </div>
            </div>
            {modoInput === 'descripcion' ? (
              <textarea value={jobText} onChange={(e) => setJobText(e.target.value)} placeholder="Pega aquí el título, empresa y descripción completa de la vacante..." rows={6} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            ) : (
              <div className="flex gap-2">
                <input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://www.linkedin.com/jobs/view/..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <Button onClick={cargarDesdeUrl} loading={loadingUrl} disabled={!jobUrl.trim()} variant="outline">{loadingUrl ? 'Cargando...' : 'Cargar'}</Button>
              </div>
            )}
            {modoInput === 'link' && jobText && <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1"><span className="text-lg">✓</span> Contenido de la vacante cargado.</p>}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <LanguageSelector value={language} onChange={setLanguage} />
            <Button className="w-full sm:w-auto" onClick={analizar} loading={loading} disabled={(!cvArchivo && !selectedCvId && !cvText.trim()) || !jobText.trim()}>
              {loading ? (loadingText || 'Analizando...') : 'Analizar compatibilidad'}
            </Button>
          </div>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        </div>

        {showAuthWall && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden mt-6 mb-8 animate-fade-in shadow-xl text-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full mx-auto">
              <h3 className="text-2xl font-black text-gray-900 mb-3">¡Análisis finalizado!</h3>
              <p className="text-gray-600 mb-8 text-sm">Regístrate gratis para ver tus resultados detallados.</p>
              <button onClick={() => navigate('/auth')} className="w-full bg-[#1A91F0] text-white font-bold py-3.5 rounded-xl">Revelar mis resultados</button>
            </div>
          </div>
        )}

        {resultadoMatch && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">3. Resultado</h2>
                {resultadoMatch.jobData?.title && <p className="text-sm text-gray-500 mt-0.5">{resultadoMatch.jobData.title}</p>}
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${colorScore(resultadoMatch.matchScore)}`}>{resultadoMatch.matchScore}%</div>
                <div className="text-xs text-gray-400">compatibilidad</div>
              </div>
            </div>
            {!vistaInfografia && (
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div className={`h-2 rounded-full transition-all duration-500 ${resultadoMatch.matchScore >= 75 ? 'bg-green-500' : resultadoMatch.matchScore >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${resultadoMatch.matchScore}%` }} />
              </div>
            )}
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={() => descargarCV(resultadoMatch.id, 'pdf')}>↓ PDF</Button>
              <Button variant="outline" onClick={() => descargarCV(resultadoMatch.id, 'word')}>↓ Word</Button>
              <Button onClick={toggleInfografia}>{vistaInfografia ? '📄 Vista Texto' : '🎨 Vista Infográfica'}</Button>
            </div>
            {vistaInfografia && datosInfografia && (
              <CVInfographic datos={datosInfografia} matchScore={resultadoMatch.matchScore} jobData={resultadoMatch.jobData} analisis={resultadoMatch.analisis} />
            )}
            {!vistaInfografia && (
              <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'cv',       label: 'CV Adaptado' },
                  { key: 'analisis', label: 'Análisis' },
                  { key: 'keywords', label: 'Keywords' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setTabActiva(tab.key)}
                    className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${tabActiva === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {!vistaInfografia && tabActiva === 'cv' && <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-4 rounded-xl">{resultadoMatch.tailoredCV}</pre>}
            {!vistaInfografia && tabActiva === 'analisis' && (
              <div className="space-y-4">
                {resultadoMatch.dimensiones && (() => {
                  const dims = [
                    { key: 'hard_skills', label: 'Hard Skills', color: 'bg-violet-500' },
                    { key: 'soft_skills', label: 'Soft Skills', color: 'bg-blue-500' },
                    { key: 'experiencia', label: 'Experiencia', color: 'bg-emerald-500' },
                    { key: 'formato_ats', label: 'Formato ATS', color: 'bg-amber-500' },
                  ]
                  return (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desglose por dimensión</h3>
                      {dims.map(d => {
                        const val = resultadoMatch.dimensiones[d.key]
                        if (val === null || val === undefined) return null
                        return (
                          <div key={d.key}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">{d.label}</span>
                              <span className={`text-xs font-bold ${val >= 75 ? 'text-emerald-600' : val >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{val}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${d.color} rounded-full transition-all`} style={{ width: `${val}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
                <div><h3 className="text-sm font-semibold text-green-700 mb-1.5">Fortalezas</h3><ul className="text-xs space-y-1 text-gray-700">{resultadoMatch.analisis.fortalezas.map((f, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-green-500 shrink-0 mt-0.5">✓</span>{f}</li>)}</ul></div>
                <div>
                  <h3 className="text-sm font-semibold text-red-600 mb-2">Brechas</h3>
                  <ul className="space-y-2">
                    {resultadoMatch.analisis.brechas.map((b, i) => (
                      <li key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setBrechaAbierta(brechaAbierta === i ? null : i)}
                          className="w-full flex items-start justify-between gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-red-400 shrink-0 mt-0.5 text-sm">→</span>
                            <span className="text-xs text-gray-700">{b}</span>
                          </div>
                          <CaretDown size={13} className={`shrink-0 mt-0.5 text-gray-400 transition-transform ${brechaAbierta === i ? 'rotate-180' : ''}`} />
                        </button>
                        {brechaAbierta === i && (
                          <div className="px-4 pb-3 pt-2 bg-amber-50/60 border-t border-amber-100">
                            <p className="text-[11px] font-semibold text-amber-700 mb-1">Cómo mejorarlo:</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Considera incluir esta competencia de forma explícita en tu CV — idealmente con un resultado medible (número, porcentaje o impacto concreto) que respalde tu perfil frente a esta vacante.
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {resultadoMatch.analisis.conclusion && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5">Conclusión</h3>
                    <p className="text-sm text-blue-900 leading-relaxed">{resultadoMatch.analisis.conclusion}</p>
                  </div>
                )}
              </div>
            )}
            {!vistaInfografia && tabActiva === 'keywords' && (
              <div className="space-y-5">
                {resultadoMatch.keywords ? (
                  <>
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Keywords Críticas</h3>
                      {resultadoMatch.keywords.criticas.presentes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold text-emerald-600 mb-2 flex items-center gap-1">✓ Presentes en tu CV ({resultadoMatch.keywords.criticas.presentes.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {resultadoMatch.keywords.criticas.presentes.map((kw, i) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-full">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {resultadoMatch.keywords.criticas.ausentes.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-red-500 mb-2 flex items-center gap-1">✗ Faltan en tu CV ({resultadoMatch.keywords.criticas.ausentes.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {resultadoMatch.keywords.criticas.ausentes.map((kw, i) => (
                              <span key={i} className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-full">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Skills Complementarios</h3>
                      {resultadoMatch.keywords.complementarias.presentes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold text-blue-600 mb-2 flex items-center gap-1">✓ Presentes ({resultadoMatch.keywords.complementarias.presentes.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {resultadoMatch.keywords.complementarias.presentes.map((kw, i) => (
                              <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium rounded-full">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {resultadoMatch.keywords.complementarias.ausentes.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-amber-600 mb-2 flex items-center gap-1">→ Para agregar ({resultadoMatch.keywords.complementarias.ausentes.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {resultadoMatch.keywords.complementarias.ausentes.map((kw, i) => (
                              <span key={i} className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-full">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">Keywords no disponibles para este análisis.</p>
                )}
              </div>
            )}

            {/* Guardar en Pipeline */}
            {user && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                {savedToPipeline ? (
                  <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                    ✓ Vacante guardada en tu Pipeline
                  </p>
                ) : showSaveForm ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Guardar en Pipeline</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Empresa"
                        value={saveForm.empresa || resultadoMatch.jobData?.company || ''}
                        onChange={e => setSaveForm(f => ({ ...f, empresa: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Posición / título"
                        value={saveForm.posicion || resultadoMatch.jobData?.title || ''}
                        onChange={e => setSaveForm(f => ({ ...f, posicion: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <select
                      value={saveForm.etapa}
                      onChange={e => setSaveForm(f => ({ ...f, etapa: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {['Descubierto', 'Apliqué', 'Pruebas/Assessment', 'En entrevistas', 'Ofertado'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setShowSaveForm(false)} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">Cancelar</button>
                      <button onClick={guardarEnPipeline} disabled={savingPipeline}
                        className="text-sm bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        {savingPipeline ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowSaveForm(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 rounded-xl px-4 py-2.5 hover:bg-primary/5 transition-colors">
                    + Guardar vacante en Pipeline
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
