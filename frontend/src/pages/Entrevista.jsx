// Entrevista — práctica de entrevistas con IA (funcionalidad premium)
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { api } from '../services/api'
import { useTrackEvent } from '../hooks/useTrackEvent'
import {
  MicrophoneStage, Microphone, MicrophoneSlash, SpeakerHigh, SpeakerSimpleSlash,
  ArrowRight, ArrowLeft, CheckCircle, Star, Lightning,
  ChatText, Trophy, Target, Spinner,
} from '@phosphor-icons/react'
import ProGate from '../components/common/ProGate'
import HelpBadge from '../components/common/HelpBadge'

const ENTREVISTADORES = [
  { value: 'HR',             label: 'HR / Recursos Humanos',  desc: 'Cultura, motivación y fit' },
  { value: 'Hiring Manager', label: 'Hiring Manager',          desc: 'Técnico y casos prácticos' },
  { value: 'Headhunter',     label: 'Headhunter',              desc: 'Logros y propuesta de valor' },
]

const NUM_PREGUNTAS = [5, 7, 10]

const TIPO_FEEDBACK = [
  { value: 'final',    label: 'Al final',          desc: 'Recibe todo el feedback al terminar' },
  { value: 'pregunta', label: 'Por pregunta',       desc: 'Feedback inmediato tras cada respuesta' },
]

// ── Score ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const r = 54; const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="text-center">
        <p className="text-4xl font-black" style={{ color }}>{score}</p>
        <p className="text-xs text-gray-400 font-semibold">/ 100</p>
      </div>
    </div>
  )
}

// ── Estrellas de calificación ───────────────────────────────────────────────
function Estrellas({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} weight={i <= n ? 'fill' : 'regular'}
          className={i <= n ? 'text-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────
export default function Entrevista() {
  const { user, isPaidPlan, trialExpired, featuresDesbloqueadas, jpData, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const track = useTrackEvent()
  useEffect(() => { track('page_view', 'entrevista') }, [])

  // Bloqueo para usuarios sin progreso 100% o sin plan
  if (authLoading) return null

  if (!featuresDesbloqueadas) {
    return (
      <ProGate
        tipo={trialExpired ? 'trial' : 'pro'}
        titulo="Preparación para Entrevistas"
        descripcion="Practica entrevistas simuladas con IA, recibe feedback personalizado y llega preparado a cualquier proceso de selección."
        icono={<MicrophoneStage size={40} className="text-on-surface-variant/60" />}
        beneficios={[
          'Entrevistas simuladas con HR, Hiring Manager o panel técnico',
          'Preguntas adaptadas a tu cargo y nivel de experiencia',
          'Feedback detallado por respuesta con puntuación',
          'Acceso a vacantes guardadas como contexto de práctica',
        ]}
      />
    )
  }

  // Paso: 'setup' | 'entrevista' | 'feedback'
  const [paso, setPaso]           = useState('setup')
  const [vacantesGuardadas, setVacantesGuardadas] = useState([])
  const [vacanteSel, setVacanteSel] = useState(null) // vacante seleccionada de guardadas

  // Config
  const [empresa, setEmpresa]             = useState('')
  const [cargo, setCargo]                 = useState('')
  const [entrevistador, setEntrevistador] = useState('HR')
  const [descripcion, setDescripcion]     = useState('')
  const [numPreguntas, setNumPreguntas]   = useState(10)
  const [tipoFeedback, setTipoFeedback]   = useState('final')

  // Entrevista
  const [preguntas, setPreguntas]         = useState([])
  const [preguntaIdx, setPreguntaIdx]     = useState(0)
  const [respuestas, setRespuestas]       = useState([])
  const [inputRespuesta, setInputRespuesta] = useState('')
  const [escuchando, setEscuchando]       = useState(false)
  const [hablando, setHablando]           = useState(false)
  const [muted, setMuted]                 = useState(() => localStorage.getItem('entrevista_muted') === '1')
  const [feedbackInmediato, setFeedbackInmediato] = useState(null)
  const [loadingFeedbackInm, setLoadingFeedbackInm] = useState(false)

  // Estados de carga
  const [loadingPreguntas, setLoadingPreguntas] = useState(false)
  const [loadingEval, setLoadingEval]           = useState(false)
  const [error, setError]                       = useState('')

  // Feedback final
  const [evaluacion, setEvaluacion] = useState(null)
  const [guardadoEnPipeline, setGuardadoEnPipeline] = useState(false)

  const [respuestaCorta, setRespuestaCorta] = useState(false)
  const [confirmSalir, setConfirmSalir]     = useState(false)
  const [activeBrowserTab, setActiveBrowserTab] = useState('chrome')
  const [cvBase, setCvBase]                 = useState('')
  // Brave bloquea Speech Recognition por política de privacidad
  const esBrave = typeof navigator !== 'undefined' && navigator.brave?.isBrave != null
  const recognitionRef = useRef(null)
  const textareaRef    = useRef(null)
  const vocesRef       = useRef([])

  // Cargar CV Base (tipo=optimize sin subtipo especial) para contexto de entrevista
  useEffect(() => {
    if (!user) return
    const SUBTIPOS_EXCLUIDOS = ['infografia_proyecto', 'linkedin_analysis', 'entrevista_simulada', 'desde_cero']
    supabase.from('cv_results')
      .select('id, contenido, tipo, metadata')
      .eq('user_id', user.id)
      .in('tipo', ['optimize', 'original'])
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const base = (data || []).find(r => {
          const subtipo = (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata)?.subtipo
          return !SUBTIPOS_EXCLUIDOS.includes(subtipo) && r.tipo !== 'match'
        })
        if (base?.contenido) {
          try {
            const parsed = typeof base.contenido === 'string' ? JSON.parse(base.contenido) : base.contenido
            const texto = parsed?.contenido_cv || parsed?.cv_text || parsed?.texto || ''
            setCvBase(typeof texto === 'string' ? texto : JSON.stringify(texto))
          } catch {
            if (typeof base.contenido === 'string') setCvBase(base.contenido)
          }
        }
      })
  }, [user])

  // Cargar vacantes guardadas con score ≥ 75 y título disponible
  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('saved_jobs').select('id, job_data, job_key').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('job_checks').select('job_key, score').eq('user_id', user.id),
    ]).then(([{ data: saved }, { data: checks }]) => {
      const checkMap = {}
      ;(checks || []).forEach(c => { if (c.job_key) checkMap[c.job_key] = c.score })
      const filtradas = (saved || [])
        .filter(s => {
          const titulo = s.job_data?.title
          if (!titulo) return false
          const score = checkMap[s.job_key] ?? checkMap[s.id]
          return score !== undefined && score >= 75
        })
        .map(s => ({ ...s, score: checkMap[s.job_key] ?? checkMap[s.id] }))
      setVacantesGuardadas(filtradas)
    })
  }, [user])

  // Pre-cargar cargo objetivo desde el Gerente de Proyecto
  useEffect(() => {
    const cargoObjetivo = jpData?.perfil?.cargo_objetivo?.trim()
    if (cargoObjetivo) {
      setCargo(prev => prev || cargoObjetivo)
    }
  }, [jpData])

  // 6.1 — Auto-load job description from Pipeline (runs on every mount AND on location change)
  useEffect(() => {
    const prefill = sessionStorage.getItem('entrevista_prefill')
    if (prefill) {
      try {
        const data = JSON.parse(prefill)
        setEmpresa(data.empresa || '')
        setCargo(data.cargo || '')
        setDescripcion(data.descripcion || data.job_data?.full_description || data.job_data?.description || '')
        if (data.jobId) {
          setVacanteSel({ id: data.jobId })
        }
        sessionStorage.removeItem('entrevista_prefill')
      } catch {
        // silently ignore
      }
    }
  }) // sin dependencias → corre en cada render; sessionStorage.removeItem garantiza 1 sola ejecución efectiva

  // Seleccionar vacante guardada
  const seleccionarVacante = (v) => {
    setVacanteSel(v)
    setEmpresa(v.job_data?.company || '')
    setCargo(v.job_data?.title || '')
    setDescripcion(v.job_data?.full_description || v.job_data?.description || v.job_data?.snippet || '')
  }

  // ── Cargar voces disponibles ───────────────────────────────────────────
  useEffect(() => {
    const cargarVoces = () => { vocesRef.current = window.speechSynthesis?.getVoices() || [] }
    cargarVoces()
    window.speechSynthesis?.addEventListener('voiceschanged', cargarVoces)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', cargarVoces)
  }, [])

  // Toggle mute (persistente en localStorage)
  const toggleMute = () => {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem('entrevista_muted', next ? '1' : '0')
      if (next) {
        window.speechSynthesis?.cancel()
        setHablando(false)
      }
      return next
    })
  }

  // ── TTS: solo voces neuronales/de alta calidad ─────────────────────────
  // Si el navegador no tiene voz "Natural" (Edge) ni "Google" (Chrome), no habla
  // — preferimos silencio a una voz robótica de baja calidad.
  const leerEnVoz = (texto) => {
    if (muted) return
    if (!window.speechSynthesis) return
    const voces = vocesRef.current

    // Preferir voces LATAM (es-MX, es-US, es-419) sobre es-ES
    const esLatam = v => /es-(MX|US|419|AR|CO|CL|PE)/i.test(v.lang)
    const esNeural = v => /Natural|Online|Neural/i.test(v.name)
    const esGoogle = v => /Google/i.test(v.name)
    const esEspanol = v => /^es/i.test(v.lang)

    const vozBuena =
         voces.find(v => esLatam(v) && esNeural(v))
      || voces.find(v => esLatam(v) && esGoogle(v))
      || voces.find(v => esEspanol(v) && esNeural(v))
      || voces.find(v => esEspanol(v) && esGoogle(v))

    if (!vozBuena) return // sin voz de calidad disponible → silencio

    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(texto)
    utt.voice = vozBuena
    utt.lang  = vozBuena.lang
    utt.rate  = 0.95
    utt.pitch = 1.0

    utt.onstart = () => setHablando(true)
    utt.onend   = () => setHablando(false)
    utt.onerror = () => setHablando(false)
    window.speechSynthesis.speak(utt)
  }

  // ── STT: escuchar respuesta del usuario ────────────────────────────────
  const toggleEscucha = async () => {
    if (escuchando) {
      recognitionRef.current?.stop()
      setEscuchando(false)
      return
    }

    setError('')

    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) { setError('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.'); return }

      // Verificar permiso explícitamente con getUserMedia — fuerza el popup si es la primera vez
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t => t.stop())
      } catch (err) {
        setError(`Micrófono inaccesible [${err?.name}]: ${err?.message}. Verifica el permiso en el candado de la barra de dirección y recarga.`)
        return
      }

      // Detener TTS antes de escuchar
      window.speechSynthesis.cancel()
      setHablando(false)

      const rec = new SR()
      rec.lang = 'es-MX'
      rec.continuous = true
      rec.interimResults = true
      rec.onstart  = () => { setEscuchando(true); setError('') }
      rec.onresult = (e) => {
        let parcial = ''
        let final   = ''
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) final   += e.results[i][0].transcript + ' '
          else                       parcial += e.results[i][0].transcript
        }
        setInputRespuesta(prev => {
          const base = prev.endsWith('…') ? prev.slice(0, -1) : prev
          return (final || (base + parcial)).trim()
        })
      }
      rec.onend   = () => setEscuchando(false)
      rec.onerror = (e) => {
        setEscuchando(false)
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setError('Micrófono bloqueado. Si usas Brave: desactiva Shields para este sitio. En Chrome: candado → Micrófono → Permitir y recarga.')
        } else if (e.error === 'no-speech') {
          setError('No se detectó voz. Asegúrate de hablar cerca del micrófono.')
        } else if (e.error === 'network') {
          setError('Error de red con el servicio de voz. Brave bloquea este servicio — prueba en Chrome o Edge.')
        } else {
          setError(`Error de micrófono [${e.error}]. Prueba en Chrome o Edge.`)
        }
      }
      try {
        rec.start()
        recognitionRef.current = rec
      } catch (err) {
        setEscuchando(false)
        if (err?.name === 'InvalidStateError') {
          recognitionRef.current?.stop()
          setError('El micrófono ya estaba activo. Intenta de nuevo.')
        } else {
          setError(`No se pudo iniciar el micrófono [${err?.name}]: ${err?.message}`)
        }
      }
    } catch (err) {
      setEscuchando(false)
      setError(`Error inesperado [${err?.name}]: ${err?.message}`)
    }
  }

  // ── Generar preguntas ──────────────────────────────────────────────────
  const iniciarEntrevista = async () => {
    if (!cargo.trim()) { setError('Escribe el cargo para continuar'); return }
    setError('')
    setLoadingPreguntas(true)
    track('feature_used', 'entrevista', { cargo, entrevistador })
    try {
      const { preguntas: qs } = await api.post('/api/interview/preguntas', {
        empresa, cargo, entrevistador, descripcion, numPreguntas,
        ...(cvBase ? { cv_base: cvBase } : {}),
      })
      setPreguntas(qs)
      setRespuestas(new Array(qs.length).fill(''))
      setPreguntaIdx(0)
      setFeedbackInmediato(null)
      setPaso('entrevista')
      setTimeout(() => leerEnVoz(qs[0].pregunta), 600)
    } catch {
      setError('Error al generar las preguntas. Intenta de nuevo.')
    } finally {
      setLoadingPreguntas(false)
    }
  }

  // ── Validar respuesta antes de avanzar ────────────────────────────────
  const MIN_CHARS = 30
  const validarRespuesta = () => {
    const txt = inputRespuesta.trim()
    if (!txt) { setError('Debes responder antes de continuar.'); return false }
    if (txt.length < MIN_CHARS) { setRespuestaCorta(true); return false }
    setRespuestaCorta(false)
    setError('')
    return true
  }

  // ── Guardar respuesta actual ───────────────────────────────────────────
  const guardarRespuesta = () => {
    recognitionRef.current?.stop()
    const nuevas = [...respuestas]
    nuevas[preguntaIdx] = inputRespuesta.trim()
    setRespuestas(nuevas)
    return nuevas
  }

  // ── Siguiente pregunta ────────────────────────────────────────────────
  const siguientePregunta = async () => {
    if (!validarRespuesta()) return
    const nuevas = guardarRespuesta()
    setFeedbackInmediato(null)

    // Feedback por pregunta
    if (tipoFeedback === 'pregunta' && nuevas[preguntaIdx]) {
      setLoadingFeedbackInm(true)
      try {
        const res = await api.post('/api/interview/evaluar', {
          empresa, cargo, entrevistador,
          preguntas: [preguntas[preguntaIdx]],
          respuestas: [nuevas[preguntaIdx]],
          feedbackPorPregunta: true,
        })
        setFeedbackInmediato(res.detalle?.[0] || null)
      } catch { /* silencioso */ }
      finally { setLoadingFeedbackInm(false) }
    }

    if (feedbackInmediato || tipoFeedback === 'final') {
      const next = preguntaIdx + 1
      if (next >= preguntas.length) {
        await finalizarEntrevista(nuevas)
      } else {
        setPreguntaIdx(next)
        setInputRespuesta(nuevas[next] || '')
        setTimeout(() => leerEnVoz(preguntas[next].pregunta), 300)
      }
    }
  }

  const avanzarTraseFeedback = () => {
    setFeedbackInmediato(null)
    const next = preguntaIdx + 1
    if (next >= preguntas.length) {
      finalizarEntrevista(respuestas)
    } else {
      setPreguntaIdx(next)
      setInputRespuesta(respuestas[next] || '')
      setTimeout(() => leerEnVoz(preguntas[next].pregunta), 300)
    }
  }

  // ── Finalizar y evaluar ───────────────────────────────────────────────
  const finalizarEntrevista = async (resp = respuestas) => {
    window.speechSynthesis.cancel()
    setLoadingEval(true)
    try {
      const resultado = await api.post('/api/interview/evaluar', {
        empresa, cargo, entrevistador, preguntas,
        respuestas: resp,
        feedbackPorPregunta: tipoFeedback === 'pregunta',
      })
      setEvaluacion(resultado)
      setPaso('feedback')
      // El reporte se guarda automáticamente en el backend (cv_results, TTL 14 días)
      setGuardadoEnPipeline(true)
    } catch {
      setError('Error al evaluar la entrevista.')
    } finally {
      setLoadingEval(false)
    }
  }

  const reiniciar = () => {
    window.speechSynthesis.cancel()
    setPreguntas([]); setRespuestas([]); setPreguntaIdx(0)
    setInputRespuesta(''); setEvaluacion(null); setFeedbackInmediato(null)
    setGuardadoEnPipeline(false)
    setPaso('setup')
  }

  if (!user) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-gray-500 mb-4">Necesitas iniciar sesión para usar esta función.</p>
      <button onClick={() => navigate('/auth')} className="btn-primary">Iniciar sesión</button>
    </div>
  )

  const preguntaActual = preguntas[preguntaIdx]
  const progreso = preguntas.length ? ((preguntaIdx) / preguntas.length) * 100 : 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Modal confirmación salir */}
      {confirmSalir && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">¿Salir de la entrevista?</h3>
            <p className="text-sm text-gray-500">Se perderá todo el progreso de esta sesión, incluyendo tus respuestas.</p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmSalir(false)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-400 transition-colors text-sm">
                Continuar entrevista
              </button>
              <button onClick={reiniciar}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm">
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Simulador de Entrevista</h1>
          </div>
          <p className="text-sm text-gray-500">Practica con ELVIA y recibe feedback profesional en tiempo real.</p>
        </div>
        {paso === 'entrevista' && (
          <button onClick={() => setConfirmSalir(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 rounded-xl px-3 py-2 transition-colors">
            <ArrowLeft size={13} weight="bold" /> Salir
          </button>
        )}
      </div>

      {/* ── PASO 1: SETUP ────────────────────────────────────────────────── */}
      {paso === 'setup' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Configurar Simulación
              <HelpBadge id="entrevista.setup" />
            </h2>
          </div>


          {/* Vacantes guardadas */}
          {vacantesGuardadas.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">Practicar con una vacante guardada</h2>
              <p className="text-xs text-gray-400 mb-3">Solo se muestran vacantes con compatibilidad ≥ 75%</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {vacantesGuardadas.map(v => (
                  <button key={v.id} onClick={() => seleccionarVacante(v)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-colors
                      ${vacanteSel?.id === v.id
                        ? 'bg-primary/5 border-primary/40 text-primary font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{v.job_data?.title}</p>
                      <span className="shrink-0 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">{v.score}%</span>
                    </div>
                    {v.job_data?.company && <p className="text-xs text-gray-400 mt-0.5">{v.job_data.company}</p>}
                  </button>
                ))}
              </div>
              {vacanteSel && (
                <button onClick={() => { setVacanteSel(null); setEmpresa(''); setCargo(''); setDescripcion('') }}
                  className="text-xs text-gray-400 hover:text-red-500 mt-2 transition-colors">
                  × Limpiar selección
                </button>
              )}
            </div>
          )}

          {/* Formulario */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              {vacanteSel ? 'Datos de la vacante (editables)' : 'Datos de la entrevista'}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
                  placeholder="Ej. Google, FEMSA..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cargo *</label>
                <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
                  placeholder="Ej. Gerente de Operaciones"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            {/* Tipo de entrevistador */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">¿Con quién te entrevistas?</label>
              <div className="grid grid-cols-3 gap-2">
                {ENTREVISTADORES.map(e => (
                  <button key={e.value} onClick={() => setEntrevistador(e.value)}
                    className={`p-3 rounded-xl border text-left transition-colors
                      ${entrevistador === e.value
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-700 hover:border-primary/50'}`}>
                    <p className={`text-xs font-bold ${entrevistador === e.value ? 'text-white' : 'text-gray-800'}`}>{e.label}</p>
                    <p className={`text-[10px] mt-0.5 ${entrevistador === e.value ? 'text-white/80' : 'text-gray-400'}`}>{e.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descripción o link de la vacante <span className="text-gray-400">(opcional pero recomendado)</span></label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
                placeholder="Pega aquí la descripción de la vacante o el link..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>

            {/* Número de preguntas */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Número de preguntas</label>
              <div className="flex gap-2">
                {NUM_PREGUNTAS.map(n => (
                  <button key={n} onClick={() => setNumPreguntas(n)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors
                      ${numPreguntas === n ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">50% técnicas · 50% soft skills</p>
            </div>

            {/* Tipo de feedback */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">¿Cuándo quieres el feedback?</label>
              <div className="grid grid-cols-2 gap-2">
                {TIPO_FEEDBACK.map(t => (
                  <button key={t.value} onClick={() => setTipoFeedback(t.value)}
                    className={`p-3 rounded-xl border text-left transition-colors
                      ${tipoFeedback === t.value ? 'bg-primary/5 border-primary text-primary' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}

            <button onClick={iniciarEntrevista} disabled={loadingPreguntas || !cargo.trim()}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loadingPreguntas
                ? <><Spinner size={18} className="animate-spin" /> Generando preguntas...</>
                : <><Lightning size={18} weight="fill" /> Comenzar entrevista</>}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2: ENTREVISTA ────────────────────────────────────────────── */}
      {paso === 'entrevista' && preguntaActual && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Sala de Entrevista
              <HelpBadge id="entrevista.entrevista" />
            </h2>
          </div>

          {/* Progreso */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Pregunta {preguntaIdx + 1} de {preguntas.length}</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wide
                ${preguntaActual.tipo === 'tecnica' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                {preguntaActual.tipo === 'tecnica' ? 'Técnica' : 'Soft Skill'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
            </div>
          </div>

          {/* Avatar OPTIMA + pregunta */}
          <div className="card">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="shrink-0 relative">
                <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all bg-[#0A3D2A] ${hablando ? 'border-primary shadow-lg shadow-primary/20' : 'border-gray-200'}`}>
                  <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="w-full h-full object-contain p-1.5" />
                </div>
                {hablando && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary items-center justify-center">
                      <SpeakerHigh size={9} weight="fill" className="text-white" />
                    </span>
                  </span>
                )}
              </div>
              {/* Pregunta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-primary">ELVIA</p>
                  <button onClick={() => leerEnVoz(preguntaActual.pregunta)} title="Escuchar de nuevo"
                    disabled={muted}
                    className="text-gray-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <SpeakerHigh size={14} weight="duotone" />
                  </button>
                  <button onClick={toggleMute}
                    title={muted ? 'Activar voz' : 'Silenciar voz'}
                    aria-pressed={muted}
                    className={`transition-colors ${muted ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
                    {muted
                      ? <SpeakerSimpleSlash size={14} weight="duotone" />
                      : <SpeakerHigh size={14} weight="regular" />}
                  </button>
                </div>
                <p className="text-base font-semibold text-gray-800 leading-snug">{preguntaActual.pregunta}</p>
              </div>
            </div>
          </div>

          {/* Feedback inmediato (si aplica) */}
          {loadingFeedbackInm && (
            <div className="card flex items-center gap-3 py-4">
              <Spinner size={18} className="animate-spin text-primary shrink-0" />
              <p className="text-sm text-gray-500">Analizando tu respuesta...</p>
            </div>
          )}

          {feedbackInmediato && !loadingFeedbackInm && (
            <div className="card border-l-4 border-primary space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Feedback de ELVIA</p>
                <Estrellas n={feedbackInmediato.calificacion || 3} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{feedbackInmediato.comentario}</p>
              <button onClick={avanzarTraseFeedback}
                className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                {preguntaIdx + 1 >= preguntas.length ? 'Ver evaluación final' : 'Siguiente pregunta'}
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          )}

          {/* Respuesta del usuario */}
          {!feedbackInmediato && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500">Tu respuesta</p>
                <div className="flex items-center gap-2">
                  {escuchando && (
                    <span className="text-xs text-red-500 font-medium flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span> Escuchando...
                    </span>
                  )}
                  <button onClick={toggleEscucha}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                      ${escuchando
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110'
                        : 'bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary'}`}>
                    {escuchando ? <MicrophoneSlash size={18} weight="fill" /> : <Microphone size={18} weight="duotone" />}
                  </button>
                </div>
              </div>

              {esBrave && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                  ⚠ <strong>Brave bloquea el micrófono</strong> por política de privacidad. Para usar voz: desactiva Shields para este sitio o usa <strong>Chrome / Edge</strong>. También puedes escribir tu respuesta directamente.
                </p>
              )}

              <textarea ref={textareaRef} value={inputRespuesta}
                onChange={e => { setInputRespuesta(e.target.value); setRespuestaCorta(false) }} rows={5}
                placeholder="Habla o escribe tu respuesta aquí..."
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-gray-50
                  ${respuestaCorta ? 'border-amber-400 ring-1 ring-amber-300' : 'border-gray-200'}`} />

              {respuestaCorta && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  Tu respuesta es muy corta. Intenta dar más detalle (al menos {MIN_CHARS} caracteres) para recibir feedback útil.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => {
                  if (!validarRespuesta()) return
                  const nuevas = guardarRespuesta()
                  if (preguntaIdx + 1 >= preguntas.length) finalizarEntrevista(nuevas)
                  else { setPreguntaIdx(i => i + 1); setInputRespuesta(nuevas[preguntaIdx + 1] || ''); setTimeout(() => leerEnVoz(preguntas[preguntaIdx + 1].pregunta), 300) }
                }} disabled={loadingFeedbackInm}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {preguntaIdx + 1 >= preguntas.length ? <><CheckCircle size={16} weight="fill" /> Finalizar entrevista</> : <>Siguiente <ArrowRight size={15} weight="bold" /></>}
                </button>
                {tipoFeedback === 'pregunta' && inputRespuesta.trim() && (
                  <button onClick={siguientePregunta} disabled={loadingFeedbackInm}
                    className="border border-primary text-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    <ChatText size={15} weight="duotone" /> Ver feedback
                  </button>
                )}
              </div>

              {error && (
                error.includes('micrófono denegado') ? (
                  <div className="bg-red-50/90 border border-red-200/80 rounded-2xl p-5 text-sm text-red-800 space-y-4 mt-3 shadow-sm transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0" role="img" aria-label="microphone">🎙️</span>
                      <div className="space-y-1">
                        <p className="font-bold text-red-950 text-base">Acceso al micrófono bloqueado</p>
                        <p className="text-xs text-red-800/90 leading-relaxed">
                          Por seguridad, las aplicaciones web <strong>no pueden forzar la apertura</strong> de la configuración del navegador. Debes permitir el acceso manualmente siguiendo estos sencillos pasos:
                        </p>
                      </div>
                    </div>

                    {/* Selector de Navegador */}
                    <div className="flex flex-wrap gap-1 border-b border-red-200/30 pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveBrowserTab('chrome')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeBrowserTab === 'chrome'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-red-800 hover:bg-red-100/60'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="8" r="3" />
                          <line x1="3" y1="8" x2="5" y2="8" />
                          <line x1="11" y1="8" x2="21" y2="8" />
                          <circle cx="16" cy="16" r="3" />
                          <line x1="3" y1="16" x2="13" y2="16" />
                          <line x1="19" y1="16" x2="21" y2="16" />
                        </svg>
                        Chrome / Edge
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveBrowserTab('safari')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeBrowserTab === 'safari'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-red-800 hover:bg-red-100/60'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                        </svg>
                        Safari
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveBrowserTab('firefox')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeBrowserTab === 'firefox'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-red-800 hover:bg-red-100/60'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Firefox
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveBrowserTab('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeBrowserTab === 'mobile'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-red-800 hover:bg-red-100/60'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                        </svg>
                        Celular / Tablet
                      </button>
                    </div>

                    {/* Pasos Detallados según Navegador */}
                    <div className="bg-white/95 rounded-xl p-4 border border-red-100/50 space-y-3 text-xs text-red-950 leading-relaxed shadow-sm">
                      {activeBrowserTab === 'chrome' && (
                        <>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">1</span>
                            <div>
                              En la barra de direcciones superior, a la izquierda de la dirección de la web, haz clic en el icono de <strong>Ajustes del Sitio / Controles</strong> que parece dos deslizadores o sliders horizontales:
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 ml-1.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono text-[9px] align-middle select-none">
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="8" cy="8" r="3" />
                                  <line x1="3" y1="8" x2="5" y2="8" />
                                  <line x1="11" y1="8" x2="21" y2="8" />
                                  <circle cx="16" cy="16" r="3" />
                                  <line x1="3" y1="16" x2="13" y2="16" />
                                  <line x1="19" y1="16" x2="21" y2="16" />
                                </svg>
                                <span>Ajustes del sitio (🎛️)</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">2</span>
                            <div>
                              En la pequeña ventana que se abre, localiza la opción de <strong>Micrófono</strong> y activa el interruptor o cámbialo a <strong className="text-emerald-700 font-bold">"Permitir"</strong>.
                            </div>
                          </div>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">3</span>
                            <div>
                              Si no ves la opción rápida, haz clic en <strong>Configuración del sitio</strong> al final de esa misma pequeña ventana y cambia el permiso de <strong>Micrófono</strong> a <strong>"Permitir"</strong>.
                            </div>
                          </div>
                        </>
                      )}

                      {activeBrowserTab === 'safari' && (
                        <>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">1</span>
                            <div>
                              En la barra de menús superior de tu Mac, haz clic en <strong>Safari</strong> y selecciona <strong>Configuración para este sitio web...</strong>
                            </div>
                          </div>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">2</span>
                            <div>
                              En la ventana emergente, busca la opción de <strong>Micrófono</strong> y cámbiala a <strong className="text-emerald-700 font-bold">"Permitir"</strong> (Allow).
                            </div>
                          </div>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">3</span>
                            <div>
                              Si estás en un dispositivo móvil iPhone o iPad, consulta la pestaña <strong>Celular / Tablet</strong> arriba.
                            </div>
                          </div>
                        </>
                      )}

                      {activeBrowserTab === 'firefox' && (
                        <>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">1</span>
                            <div>
                              Haz clic en el icono del <strong>candado (🔒)</strong> o del **micrófono tachado** ubicado a la izquierda de la barra de direcciones.
                            </div>
                          </div>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">2</span>
                            <div>
                              En la sección de permisos, busca "Usar el micrófono" y haz clic en la **"X"** que aparece al lado de "Bloqueado Temporalmente" o "Bloqueado".
                            </div>
                          </div>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold shrink-0 text-[10px]">3</span>
                            <div>
                              Haz clic en el botón de **"Probar de nuevo"** abajo y cuando el navegador te pregunte por permiso, marca la casilla "Recordar esta decisión" y haz clic en <strong className="text-emerald-700 font-bold">"Permitir"</strong>.
                            </div>
                          </div>
                        </>
                      )}

                      {activeBrowserTab === 'mobile' && (
                        <>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-8 h-5 rounded bg-red-100 text-red-700 font-bold shrink-0 text-[9px] uppercase">iOS</span>
                            <div>
                              Ve a la aplicación de <strong>Ajustes</strong> de tu iPhone/iPad &gt; desplázate hasta la app de <strong>Safari</strong> &gt; toca en <strong>Micrófono</strong> y selecciona <strong className="text-emerald-700 font-bold">"Permitir"</strong>.
                            </div>
                          </div>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-8 h-5 rounded bg-red-100 text-red-700 font-bold shrink-0 text-[9px] uppercase">Android</span>
                            <div>
                              Abre Chrome &gt; toca los 3 puntos verticales &gt; <strong>Configuración</strong> &gt; <strong>Configuración de sitios</strong> &gt; <strong>Micrófono</strong> &gt; selecciona `elvia.lat` y establécelo en "Permitir".
                            </div>
                          </div>
                          <div className="flex gap-2.5">
                            <span className="flex items-center justify-center w-8 h-5 rounded bg-red-100 text-red-700 font-bold shrink-0 text-[9px] uppercase">Sist.</span>
                            <div>
                              Asegúrate de que tu navegador tenga permiso de acceso al micrófono en los Ajustes del Sistema &gt; Privacidad & Seguridad &gt; Micrófono.
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-1">
                      <p className="text-[10px] text-red-800/80 italic text-center sm:text-left">
                        Una vez permitida la opción en el navegador, presiona el botón para continuar.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setError('');
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            stream.getTracks().forEach(track => track.stop());
                            toggleEscucha();
                          } catch (err) {
                            setError('Permiso de micrófono denegado. Actívalo en la configuración del navegador.');
                          }
                        }}
                        className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-red-200 select-none shrink-0"
                      >
                        Probar de nuevo
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 font-medium">{error}</p>
                )
              )}
            </div>
          )}

          {/* Terminar antes */}
          <button onClick={() => finalizarEntrevista()} disabled={loadingEval}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-2">
            {loadingEval ? <span className="flex items-center justify-center gap-2"><Spinner size={14} className="animate-spin" /> Evaluando...</span> : 'Terminar y ver evaluación →'}
          </button>
        </div>
      )}

      {/* ── PASO 3: FEEDBACK FINAL ────────────────────────────────────────── */}
      {paso === 'feedback' && evaluacion && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Evaluación y Feedback
              <HelpBadge id="entrevista.feedback" />
            </h2>
          </div>

          {/* Score */}
          <div className="card flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={evaluacion.puntuacion} />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <Trophy size={20} weight="duotone" className="text-amber-500" />
                <p className="text-lg font-bold text-gray-900">Resultado de tu entrevista</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{evaluacion.resumen}</p>
              <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
                <p className="text-xs text-gray-500">Cargo: <strong className="text-gray-700">{cargo}</strong></p>
                {empresa && <><span className="text-gray-300">·</span><p className="text-xs text-gray-500">{empresa}</p></>}
                {guardadoEnPipeline && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                    ✓ Reporte guardado · disponible 14 días en Mis Documentos
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Evaluación por secciones (nueva estructura) */}
          {evaluacion.secciones && evaluacion.secciones.length > 0 ? (
            <div className="space-y-4">
              {evaluacion.secciones.map((sec, idx) => (
                <div key={idx} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{sec.titulo}</h3>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      sec.puntuacion >= 8 ? 'bg-green-100 text-green-700' :
                      sec.puntuacion >= 6 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {sec.puntuacion}/10
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">{sec.feedback}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">
                        <CheckCircle size={14} weight="fill" /> Fortalezas
                      </p>
                      <ul className="space-y-1.5">
                        {sec.fortalezas?.map((f, i) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-2">
                            <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                        <Target size={14} weight="fill" /> Áreas de mejora
                      </p>
                      <ul className="space-y-1.5">
                        {sec.areas_mejora?.map((m, i) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-2">
                            <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback a estructura antigua si no hay secciones */
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-green-500" /> Fortalezas
                </h3>
                <ul className="space-y-2">
                  {evaluacion.fortalezas?.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-green-500 shrink-0 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={16} weight="fill" className="text-amber-500" /> Áreas de mejora
                </h3>
                <ul className="space-y-2">
                  {evaluacion.areas_mejora?.map((a, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-amber-500 shrink-0 mt-0.5">→</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          <div className="card">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star size={16} weight="duotone" className="text-primary" /> Recomendaciones para mejorar
            </h3>
            <ul className="space-y-2">
              {evaluacion.recomendaciones?.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600 py-2 border-b border-gray-50 last:border-0">
                  <span className="shrink-0 font-bold text-primary text-xs mt-0.5">{i + 1}.</span>{r}
                </li>
              ))}
            </ul>
          </div>

          {/* Detalle por pregunta */}
          {evaluacion.detalle?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Detalle por pregunta</h3>
              <div className="space-y-4">
                {evaluacion.detalle.map((d, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-xs font-semibold text-gray-700 flex-1">{d.pregunta || preguntas[i]?.pregunta}</p>
                      <Estrellas n={d.calificacion || 3} />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{d.comentario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={reiniciar}
              className="flex-1 border border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={16} weight="bold" /> Nueva entrevista
            </button>
            <button onClick={() => navigate('/mis-cvs?tab=reportes')}
              className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors">
              Ver en Mis Documentos →
            </button>
          </div>
        </div>
      )}

      {/* Loading evaluar */}
      {loadingEval && paso !== 'feedback' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-xs mx-4">
            <Spinner size={40} className="animate-spin text-primary" />
            <p className="text-base font-bold text-gray-800 text-center">Analizando tu entrevista...</p>
            <p className="text-sm text-gray-500 text-center">ELVIA está evaluando tus respuestas</p>
          </div>
        </div>
      )}
    </div>
  )
}
