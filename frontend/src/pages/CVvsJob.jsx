import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCV } from '../context/CVContext'
import { matchCVVacante, descargarCV } from '../services/cvService'
import { supabase } from '../services/authService'
import { useTrackEvent } from '../hooks/useTrackEvent'
import LanguageSelector from '../components/common/LanguageSelector'
import Button from '../components/common/Button'
import FeatureLocked from '../components/common/FeatureLocked'
import HelpBadge from '../components/common/HelpBadge'
import { MagnifyingGlass, CaretDown, FileText, ArrowRight, Lightbulb } from '@phosphor-icons/react'

export default function CVvsJob() {
  const { user, refreshUsage, featuresDesbloqueadas, companyId, jpData, loading: authLoading } = useAuth()
  const { resultadoOptimize, resultadoMatch, setResultadoMatch } = useCV()
  const navigate = useNavigate()
  const track = useTrackEvent()
  useEffect(() => { track('page_view', 'cvvsjob') }, [])

  const [cvsExistentes, setCvsExistentes] = useState([])
  const [selectedCvId, setSelectedCvId] = useState(null)
  const [userNombre, setUserNombre] = useState('')
  const [mostrarOtrosCVs, setMostrarOtrosCVs] = useState(false)
  const [cvDesvelado, setCvDesvelado] = useState(false)

  if (authLoading) return null

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked
        titulo="CV vs Vacante"
        descripcion="Mide qué tan compatible es tu CV con una vacante real y recibe sugerencias de optimización inmediata."
        icono={<MagnifyingGlass size={44} weight="light" />}
      />
    )
  }

  // Cargar CVs optimizados históricos + nombre del usuario en paralelo
  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase
        .from('profiles')
        .select('nombre1, apellido1')
        .eq('id', user.id)
        .single(),
      supabase
        .from('cv_results')
        .select('id, metadata, created_at')
        .eq('user_id', user.id)
        .eq('tipo', 'optimize')
        .not('contenido', 'like', '{%')
        .order('created_at', { ascending: false }),
    ]).then(([{ data: profileData }, { data: cvData }]) => {
      if (profileData) {
        const nombre = `${profileData.nombre1 || ''} ${profileData.apellido1 || ''}`.trim()
        setUserNombre(nombre)
      }
      // Ordenar: CVs optimizados primero, luego subidos; dentro de cada grupo, más reciente primero.
      const sorted = [...(cvData || [])].sort((a, b) => {
        const aOrig = a.metadata?.subtipo === 'original' ? 1 : 0
        const bOrig = b.metadata?.subtipo === 'original' ? 1 : 0
        if (aOrig !== bOrig) return aOrig - bOrig
        return new Date(b.created_at) - new Date(a.created_at)
      })
      setCvsExistentes(sorted)
      if (sorted.length > 0 && !selectedCvId) {
        setSelectedCvId(sorted[0].id)
      }
    })
  }, [user])

  // Si viene un CV recién optimizado desde CVOptimizer, preseleccionarlo
  useEffect(() => {
    if (resultadoOptimize?.id) {
      setSelectedCvId(resultadoOptimize.id)
    }
  }, [resultadoOptimize])

  const [jobText, setJobText] = useState(() => {
    const prefill = sessionStorage.getItem('vacante_prefill')
    if (prefill) { sessionStorage.removeItem('vacante_prefill'); return JSON.parse(prefill).texto }
    return ''
  })
  const [language, setLanguage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [showAuthWall, setShowAuthWall] = useState(false)
  const [error, setError] = useState('')
  const [duplicadoDetectado, setDuplicadoDetectado] = useState(null)
  const [tabActiva, setTabActiva] = useState('cv')
  const [brechaAbierta, setBrechaAbierta] = useState(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveForm, setSaveForm] = useState({ empresa: '', posicion: '', etapa: 'Descubierto', link: '' })
  const [savingPipeline, setSavingPipeline] = useState(false)
  const [savedToPipeline, setSavedToPipeline] = useState(false)
  const [historialAnalisis, setHistorialAnalisis] = useState([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const guardarEnPipeline = async () => {
    if (!resultadoMatch || !user) return
    setSavingPipeline(true)
    setError('')
    try {
      const jobData = {
        title:            saveForm.posicion || resultadoMatch.jobData?.title || '',
        company:          saveForm.empresa  || resultadoMatch.jobData?.company || '',
        full_description: jobText || '',
        link:             saveForm.link     || resultadoMatch.jobData?.link || '',
      }

      // job_key consistente (titulo|empresa en minúsculas)
      const key = `${(jobData.title || '').toLowerCase().trim()}|${(jobData.company || '').toLowerCase().trim()}`
      console.log('Guardando vacante — job_key:', key)

      // Insert alineado al schema real de saved_jobs (sin columnas fantasma)
      const { data: savedRows, error: errJob } = await supabase
        .from('saved_jobs')
        .insert({
          user_id:    user.id,
          company_id: companyId || null,
          job_key:    key,
          job_data:   jobData,
          estado:     saveForm.etapa,
          notas:      '',
        })
        .select('id')

      if (errJob) {
        console.error('Error insertando en saved_jobs:', errJob)
        throw errJob
      }

      const saved = savedRows?.[0]
      if (!saved?.id) throw new Error('No se recibió el ID de la vacante guardada')

      console.log('Vacante guardada en saved_jobs con ID:', saved.id)

      // Upsert en job_checks para vincular el score
      const { error: errCheck } = await supabase.from('job_checks').upsert({
        job_key:    key,
        user_id:    user.id,
        company_id: companyId || null,
        score:      resultadoMatch.matchScore,
        motivos:    resultadoMatch.analisis?.fortalezas ?? [],
      })

      if (errCheck) {
        console.warn('Error en job_checks (no bloquea):', errCheck)
      } else {
        console.log('Score guardado en job_checks')
      }

      setSavedToPipeline(true)
      setShowSaveForm(false)
    } catch (err) {
      console.error('Error en guardarEnPipeline:', err)
      setError(err.message || 'Error al guardar en Pipeline. Intenta de nuevo.')
    } finally {
      setSavingPipeline(false)
    }
  }

  useEffect(() => {
    setError('')
    setResultadoMatch(null)
    setDuplicadoDetectado(null)
  }, [jobText, selectedCvId])

  const analizar = async () => {
    if (!selectedCvId) return setError('Selecciona un CV optimizado para continuar.')
    if (!jobText.trim()) return setError('Pega la descripción de la vacante')
    track('feature_used', 'cvvsjob', { action: 'analizar' })

    // Detectar vacante duplicada antes de llamar a la IA
    const fingerprint = jobText.trim().toLowerCase().slice(0, 300)
    const duplicado = historialAnalisis.find(h => h.metadata?.job_fingerprint === fingerprint)
    if (duplicado && !duplicadoDetectado) {
      setDuplicadoDetectado(duplicado)
      return
    }
    setDuplicadoDetectado(null)

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
      const data = await matchCVVacante(selectedCvId, jobText, language)
      if (data.error) {
        if (data.error === 'LIMIT_REACHED') setError('Agotaste tus análisis gratuitos. Suscríbete para continuar.')
        else if (data.error === 'ACCOUNT_SUSPENDED') setError('Tu cuenta ha sido suspendida. Contacta a soporte.')
        else setError(data.error)
        return
      }
      setResultadoMatch(data)
      setTabActiva('analisis')
      setCvDesvelado(false)
      refreshUsage()
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    supabase
      .from('cv_results')
      .select('id, metadata, created_at')
      .eq('user_id', user.id)
      .eq('tipo', 'match')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setHistorialAnalisis(data || []))
  }, [user, savedToPipeline])

  const colorScore = (score) => {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen bg-slate-50 w-full py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            CV vs Vacante
            <HelpBadge id="cvvsjob.main" />
          </h1>
          <p className="mt-2 text-gray-600">
            Adapta tu CV a una vacante específica y descubre tu % de compatibilidad.
          </p>
        </div>

        {/* Avisos contextuales de perfil */}
        {(() => {
          const avisos = []
          const hard = jpData?.autoconocimiento?.hard_skills || []
          const soft = jpData?.autoconocimiento?.soft_skills || []
          if (hard.length < 2 || soft.length < 2) {
            avisos.push('Agrega al menos 2 Hard Skills y 2 Power Skills en el Gerente de Proyecto para que el análisis de compatibilidad sea más preciso.')
          }
          const oferta = String(jpData?.oferta?.oferta_valor || '').trim()
          if (!oferta) {
            avisos.push('Completa tu Oferta de Valor en el Gerente de Proyecto para que el análisis identifique mejor tus fortalezas.')
          }
          if (!avisos.length) return null
          return (
            <div className="space-y-2 mb-4">
              {avisos.map((msg, i) => (
                <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                  <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <span>{msg} <button onClick={() => navigate('/proyecto-laboral')} className="underline font-semibold ml-0.5">Ir al Gerente de Proyecto →</button></span>
                </div>
              ))}
            </div>
          )
        })()}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          {/* ── Sección 1: Tu CV ── */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Tu CV</h2>

          {cvsExistentes.length === 0 ? (
            /* Estado vacío — sin CVs */
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
              <FileText size={42} className="text-slate-300 mx-auto mb-3" weight="light" />
              <p className="text-sm font-semibold text-slate-700 mb-1">Aún no tienes un CV optimizado</p>
              <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto">
                Para medir tu compatibilidad con vacantes, primero sube y optimiza tu CV con nuestra IA.
              </p>
              <button
                onClick={() => navigate('/cv-optimizer')}
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
              >
                Ir al Optimizador de CV
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          ) : (() => {
            const cvSeleccionado = cvsExistentes.find(c => c.id === selectedCvId) || cvsExistentes[0]
            const cvRestantes = cvsExistentes.filter(c => c.id !== cvSeleccionado?.id)
            const fmtFecha = (iso) => {
              const d = new Date(iso)
              const hoy = new Date()
              return d.toDateString() === hoy.toDateString()
                ? `Hoy ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
                : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
            }
            const tipoLabel = (cv) => {
              const s = cv.metadata?.subtipo
              if (s === 'desde_cero')      return 'CV de tu Proceso de Autoconocimiento'
              if (s === 'optimizacion_ia') return 'CV Optimizado con ELVIA'
              if (s === 'original')        return 'CV subido por ti'
              return 'CV Optimizado'
            }
            const filenameLabel = (cv) => cv.metadata?.filename
              ? cv.metadata.filename.replace(/\.[^.]+$/, '').slice(0, 50)
              : null

            return (
              <div>
                {/* Tarjeta del CV activo */}
                {cvSeleccionado && (
                  <div className="flex items-center gap-4 bg-blue-600 text-white rounded-2xl px-5 py-4 mb-3 shadow-md shadow-blue-200">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <FileText size={22} weight="fill" className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{userNombre || 'Mi CV'}</span>
                        <span className="text-[10px] bg-white/25 rounded-full px-2 py-0.5 font-semibold">✓ Seleccionado</span>
                      </div>
                      <div className="text-xs text-blue-200 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-white/90">{tipoLabel(cvSeleccionado)}</span>
                        <span>·</span>
                        <span>{(cvSeleccionado.metadata?.language || 'es').toUpperCase()}</span>
                        <span>·</span>
                        <span>{fmtFecha(cvSeleccionado.created_at)}</span>
                      </div>
                      {filenameLabel(cvSeleccionado) && (
                        <div className="text-[11px] text-blue-200 mt-1 truncate">{filenameLabel(cvSeleccionado)}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Toggle ver otros */}
                {cvRestantes.length > 0 && (
                  <button
                    onClick={() => setMostrarOtrosCVs(v => !v)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mb-2 transition-colors"
                  >
                    <CaretDown size={13} className={`transition-transform ${mostrarOtrosCVs ? 'rotate-180' : ''}`} />
                    {mostrarOtrosCVs ? 'Ocultar otros CVs' : `Usar otro CV (${cvRestantes.length} más)`}
                  </button>
                )}

                {/* Lista colapsable de otros CVs */}
                {mostrarOtrosCVs && (
                  <div className="flex flex-wrap gap-2 pl-1">
                    {cvRestantes.map((cv) => (
                      <button
                        key={cv.id}
                        onClick={() => { setSelectedCvId(cv.id); setMostrarOtrosCVs(false) }}
                        className="flex flex-col items-start px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <span className="font-semibold text-xs text-gray-800 leading-none mb-1">{tipoLabel(cv)}</span>
                        <span className="text-[10px] text-gray-400">
                          {(cv.metadata?.language || 'es').toUpperCase()} · {fmtFecha(cv.created_at)}
                        </span>
                        {filenameLabel(cv) && (
                          <span className="text-[10px] text-gray-400 truncate max-w-[160px] mt-0.5">{filenameLabel(cv)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Sección 2: Vacante ── */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">2. Vacante</h2>
              {jobText.length > 0 && (
                <span className={`text-xs font-medium ${jobText.length >= 200 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {jobText.length} caracteres{jobText.length < 200 ? ' — pega más detalle para mejor análisis' : ' ✓'}
                </span>
              )}
            </div>

            {/* Tip educativo */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-3">
              <Lightbulb size={16} weight="fill" className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Tip:</strong> Abre la vacante en otra pestaña · selecciona todo el texto{' '}
                <kbd className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[10px] font-mono">Ctrl+A</kbd>{' '}
                · copia{' '}
                <kbd className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[10px] font-mono">Ctrl+C</kbd>{' '}
                · y pégalo aquí. Incluye título, empresa, ubicación y requisitos para un análisis más preciso.
              </p>
            </div>

            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder={'Ejemplo:\n\nGerente de Marketing Digital — Empresa XYZ | Bogotá, Colombia\n\nBuscamos un profesional con 5+ años de experiencia en marketing digital, gestión de equipos y estrategia de contenidos. Requisitos: Google Analytics, Meta Ads, SEO/SEM, presupuesto >$100k USD...'}
              rows={8}
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${
                jobText.length >= 200
                  ? 'border-emerald-300 focus:ring-emerald-400 bg-emerald-50/30'
                  : 'border-gray-300 focus:ring-primary'
              }`}
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <LanguageSelector value={language} onChange={setLanguage} />
            <Button
              className="w-full sm:w-auto"
              onClick={analizar}
              loading={loading}
              disabled={!selectedCvId || !jobText.trim() || !!resultadoMatch}
            >
              {loading ? (loadingText || 'Analizando...') : resultadoMatch ? 'Análisis realizado ✓' : 'Analizar compatibilidad'}
            </Button>
          </div>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {duplicadoDetectado && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-800 mb-1">Ya analizaste esta vacante</p>
              <p className="text-xs text-amber-700 mb-3">
                Tienes un análisis del {new Date(duplicadoDetectado.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} para esta misma vacante. ¿Qué deseas hacer?
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    const meta = duplicadoDetectado.metadata || {}
                    let tailoredCV = null
                    try {
                      const { data: cvData } = await supabase
                        .from('cv_results')
                        .select('contenido')
                        .eq('id', duplicadoDetectado.id)
                        .single()
                      if (cvData?.contenido) tailoredCV = cvData.contenido
                    } catch (err) {
                      console.error('Error fetching tailored CV:', err)
                    }

                    setResultadoMatch({
                      id: duplicadoDetectado.id,
                      matchScore: meta.matchScore ?? 0,
                      analisis: meta.analisis || { fortalezas: [], brechas: [], conclusion: '' },
                      jobData: meta.jobData || {},
                      keywords: meta.keywords || null,
                      dimensiones: meta.dimensiones || null,
                      tailoredCV,
                      changes: meta.changes || [],
                    })
                    setCvDesvelado(false)
                    setTabActiva('analisis')
                    setDuplicadoDetectado(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="text-xs font-bold px-3 py-2 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  Ver análisis anterior
                </button>
                <button
                  onClick={analizar}
                  className="text-xs font-bold px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Analizar de nuevo
                </button>
                <button
                  onClick={() => setDuplicadoDetectado(null)}
                  className="text-xs text-amber-600 hover:text-amber-800 px-2 py-2 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {showAuthWall && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden mt-6 mb-8 animate-fade-in shadow-xl text-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full mx-auto">
              <h3 className="text-2xl font-black text-gray-900 mb-3">¡Análisis finalizado!</h3>
              <p className="text-gray-600 mb-8 text-sm">Regístrate gratis para ver tus resultados detallados.</p>
              <button onClick={() => navigate('/auth')} className="w-full bg-[#1A91F0] text-white font-bold py-3.5 rounded-xl">Revelarmis resultados</button>
            </div>
          </div>
        )}

        {resultadoMatch && (() => {
          const score = resultadoMatch.matchScore
          const puedeAdaptar = score >= 75
          const empresa = resultadoMatch.jobData?.company || ''
          const tabs = [
            { key: 'analisis', label: 'Análisis' },
            { key: 'keywords', label: 'Keywords' },
            ...(puedeAdaptar ? [{ key: 'cv', label: 'CV Adaptado' }] : []),
          ]
          return (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            {/* Cabecera con score */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">3. Resultado</h2>
                {resultadoMatch.jobData?.title && <p className="text-sm text-gray-500 mt-0.5">{resultadoMatch.jobData.title}{empresa ? ` · ${empresa}` : ''}</p>}
              </div>
              <div className="text-center shrink-0">
                <div className={`text-3xl font-bold ${colorScore(score)}`}>{score}%</div>
                <div className="text-xs text-gray-400">compatibilidad</div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
              <div className={`h-2 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${score}%` }} />
            </div>

            {/* Banner contextual según score */}
            {puedeAdaptar ? (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-5">
                <span className="text-emerald-600 text-lg shrink-0">✓</span>
                <div>
                  <p className="text-sm font-bold text-emerald-800">¡Buena compatibilidad con esta vacante!</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Puedes revisar el análisis y luego generar un CV adaptado partiendo de tu CV optimizado. Revisa las tabs a continuación.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5">
                <span className="text-red-500 text-lg shrink-0">✕</span>
                <div>
                  <p className="text-sm font-bold text-red-800">CV adaptado no disponible para esta vacante</p>
                  <p className="text-xs text-red-700 mt-0.5">Los requerimientos de la vacante no coinciden suficientemente con tu CV, por lo que no podemos generar un CV adaptado a esta vacante (compatibilidad {score}% — se requiere mínimo 75%). Revisa el análisis y las keywords faltantes para entender las brechas.</p>
                </div>
              </div>
            )}

            {/* Tabs — CV Adaptado solo si score ≥ 80 */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setTabActiva(tab.key)}
                  className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${tabActiva === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Análisis */}
            {tabActiva === 'analisis' && (
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
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-1.5">Fortalezas</h3>
                  <ul className="text-xs space-y-1 text-gray-700">
                    {resultadoMatch.analisis.fortalezas.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-green-500 shrink-0 mt-0.5">✓</span>{f}</li>
                    ))}
                  </ul>
                </div>
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

            {/* Tab: Keywords */}
            {tabActiva === 'keywords' && (
              <div className="space-y-5">
                {resultadoMatch.keywords ? (
                  <>
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Keywords Críticas</h3>
                      {resultadoMatch.keywords.criticas.presentes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold text-emerald-600 mb-2">✓ Presentes en tu CV ({resultadoMatch.keywords.criticas.presentes.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {resultadoMatch.keywords.criticas.presentes.map((kw, i) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-full">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {resultadoMatch.keywords.criticas.ausentes.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-red-500 mb-2">✗ Faltan en tu CV ({resultadoMatch.keywords.criticas.ausentes.length})</p>
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
                          <p className="text-[11px] font-semibold text-blue-600 mb-2">✓ Presentes ({resultadoMatch.keywords.complementarias.presentes.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {resultadoMatch.keywords.complementarias.presentes.map((kw, i) => (
                              <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium rounded-full">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {resultadoMatch.keywords.complementarias.ausentes.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-amber-600 mb-2">→ Para agregar ({resultadoMatch.keywords.complementarias.ausentes.length})</p>
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

            {/* Tab: CV Adaptado — solo visible si score ≥ 80 */}
            {tabActiva === 'cv' && puedeAdaptar && (
              cvDesvelado ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => descargarCV(resultadoMatch.id, 'pdf')}>↓ Descargar PDF</Button>
                    <Button variant="outline" onClick={() => descargarCV(resultadoMatch.id, 'word')}>↓ Descargar Word</Button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Guardado en Mis Documentos como: <span className="font-medium text-gray-600">{empresa || 'Confidencial'} — CV Adaptado — {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-4 rounded-xl">{resultadoMatch.tailoredCV}</pre>
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mt-2">
                    <span className="text-blue-600 text-sm">📁</span>
                    <p className="text-sm text-blue-800 flex-1">Tu CV adaptado ya está guardado en <strong>Mis Documentos</strong>.</p>
                    <button
                      onClick={() => navigate('/mis-cvs')}
                      className="text-xs font-bold text-blue-700 underline hover:text-blue-900 transition-colors whitespace-nowrap"
                    >
                      Ir a Mis Documentos →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-7 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
                    <FileText size={28} weight="duotone" className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-base">Esta posición es susceptible para un CV adaptado</p>
                    <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto leading-relaxed">
                      ELVIA generará tu CV adaptado partiendo de tu <strong>CV optimizado</strong> — no de cualquier versión. Este CV incorpora los keywords críticos de la vacante manteniendo tu narrativa profesional.
                    </p>
                  </div>
                  <button
                    onClick={() => setCvDesvelado(true)}
                    className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                  >
                    <ArrowRight size={16} weight="bold" />
                    Ver mi CV adaptado
                  </button>
                  <p className="text-[11px] text-gray-400">Se guardará automáticamente en Mis Documentos</p>
                </div>
              )
            )}

            {/* Guardar en Pipeline */}
            {user && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                {savedToPipeline ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                      ✓ Vacante guardada en tu Pipeline
                    </p>
                    <button
                      onClick={() => navigate('/pipeline')}
                      className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900 transition-colors"
                    >
                      Ir al Pipeline →
                    </button>
                  </div>
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
                    <input
                      type="url"
                      placeholder="Enlace / URL de la vacante (ej: LinkedIn, Indeed...)"
                      value={saveForm.link || resultadoMatch.jobData?.link || ''}
                      onChange={e => setSaveForm(f => ({ ...f, link: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary"
                    />
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
                  <button
                    onClick={() => { if (!puedeAdaptar) return; setSaveForm({ empresa: resultadoMatch.jobData?.company || '', posicion: resultadoMatch.jobData?.title || '', etapa: 'Descubierto', link: resultadoMatch.jobData?.link || '' }); setShowSaveForm(true) }}
                    disabled={!puedeAdaptar}
                    title={!puedeAdaptar ? 'Compatibilidad insuficiente para guardar en Pipeline (mínimo 75%)' : ''}
                    className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors ${
                      puedeAdaptar
                        ? 'text-primary border border-primary/30 hover:bg-primary/5 cursor-pointer'
                        : 'text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                    }`}>
                    + Guardar vacante en Pipeline
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })()}

        {historialAnalisis.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
            <button
              onClick={() => setMostrarHistorial(v => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-sm font-bold text-gray-700">Análisis recientes</h3>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                {mostrarHistorial ? 'Ocultar' : `Ver últimos ${Math.min(historialAnalisis.length, 10)}`}
                <CaretDown size={12} className={`transition-transform ${mostrarHistorial ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {mostrarHistorial && (
              <div className="mt-4 space-y-2">
                {historialAnalisis.slice(0, 10).map((item) => {
                  const meta = item.metadata || {}
                  const score = meta.matchScore ?? 0
                  const empresa = meta.jobData?.company || ''
                  const titulo = meta.jobData?.title || 'Vacante'
                  const fecha = new Date(item.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  return (
                    <button
                      key={item.id}
                      onClick={async () => {
                        let tailoredCV = null
                        try {
                          const { data: cvData } = await supabase
                            .from('cv_results')
                            .select('contenido')
                            .eq('id', item.id)
                            .single()
                          if (cvData?.contenido) tailoredCV = cvData.contenido
                        } catch (err) {
                          console.error('Error fetching tailored CV:', err)
                        }

                        setResultadoMatch({
                          id: item.id,
                          matchScore: score,
                          analisis: meta.analisis || { fortalezas: [], brechas: [], conclusion: '' },
                          jobData: meta.jobData || {},
                          keywords: meta.keywords || null,
                          dimensiones: meta.dimensiones || null,
                          tailoredCV,
                          changes: meta.changes || [],
                        })
                        setCvDesvelado(false)
                        setTabActiva('analisis')
                        setSavedToPipeline(false)
                        setShowSaveForm(false)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className={`text-sm font-bold w-10 shrink-0 text-center ${score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {score}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{titulo}{empresa ? ` · ${empresa}` : ''}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{fecha}</div>
                      </div>
                      <ArrowRight size={13} className="text-gray-300 shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
