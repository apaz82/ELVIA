// LinkedIn Optima — Validador y optimizador de perfil LinkedIn con IA
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import {
  LinkedinLogo, Sparkle, CheckCircle, WarningCircle,
  CaretDown, CaretUp, ArrowRight, Trophy, Star, LightbulbFilament,
} from '@phosphor-icons/react'
import ProGate from '../components/common/ProGate'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Secciones del perfil a analizar
const SECCIONES = [
  {
    id: 'titular',
    label: 'Titular (Headline)',
    placeholder: 'Ej: Senior Product Manager | SaaS B2B | +8 años liderando equipos de producto en LATAM',
    descripcion: 'La línea debajo de tu nombre. Máx 220 caracteres.',
    maxLength: 220,
    rows: 2,
  },
  {
    id: 'extracto',
    label: 'Extracto (About)',
    placeholder: 'Pega aquí tu sección "Acerca de" completa...',
    descripcion: 'Tu resumen personal. Máx 2.600 caracteres.',
    maxLength: 2600,
    rows: 5,
  },
  {
    id: 'experiencia',
    label: 'Experiencia',
    placeholder: 'Empresa - Cargo | Fecha\nDescripción del rol y logros...\n\nEmpresa - Cargo | Fecha\nDescripción...',
    descripcion: 'Copia el texto de tus posiciones más recientes (últimos 10 años).',
    maxLength: 5000,
    rows: 6,
  },
  {
    id: 'habilidades',
    label: 'Habilidades (Skills)',
    placeholder: 'Ej: Product Management, Agile, Scrum, SQL, Tableau, Liderazgo de equipos...',
    descripcion: 'Lista tus habilidades principales, separadas por coma.',
    maxLength: 1000,
    rows: 3,
  },
  {
    id: 'educacion',
    label: 'Educación',
    placeholder: 'Institución — Título | Año\nActividades o logros relevantes...',
    descripcion: 'Instituciones, títulos y años.',
    maxLength: 1000,
    rows: 3,
  },
]

// Colores por puntaje
function colorPuntaje(score) {
  if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' }
  if (score >= 60) return { text: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    bar: 'bg-blue-500'    }
  if (score >= 40) return { text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500'   }
  return               { text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500'     }
}

function ScoreRing({ score }) {
  const color = colorPuntaje(score)
  return (
    <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 ${color.border} ${color.bg} shrink-0`}>
      <span className={`text-2xl font-bold ${color.text}`}>{score}</span>
      <span className={`text-[10px] font-semibold ${color.text} uppercase tracking-wide`}>/ 100</span>
    </div>
  )
}

function SeccionResultado({ seccion, datos }) {
  const [abierto, setAbierto] = useState(true)
  const color = colorPuntaje(datos.puntaje)

  return (
    <div className={`rounded-2xl border ${color.border} overflow-hidden`}>
      {/* Header de sección */}
      <button
        onClick={() => setAbierto(a => !a)}
        className={`w-full flex items-center gap-4 px-5 py-4 ${color.bg} hover:brightness-95 transition-all text-left`}
      >
        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white border ${color.border} shrink-0`}>
          <span className={`text-sm font-bold ${color.text}`}>{datos.puntaje}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{seccion.label}</p>
          <div className="w-full h-1.5 bg-white/60 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${color.bar} transition-all duration-700`}
              style={{ width: `${datos.puntaje}%` }}
            />
          </div>
        </div>
        {abierto ? <CaretUp size={16} className="text-gray-400 shrink-0" /> : <CaretDown size={16} className="text-gray-400 shrink-0" />}
      </button>

      {/* Contenido expandible */}
      {abierto && (
        <div className="px-5 py-4 bg-white space-y-4">
          {/* Diagnóstico general */}
          {datos.diagnostico && (
            <p className="text-sm text-gray-600 leading-relaxed">{datos.diagnostico}</p>
          )}

          {/* Fortalezas */}
          {datos.fortalezas?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
                <CheckCircle size={13} weight="fill" /> Fortalezas
              </p>
              <ul className="space-y-1.5">
                {datos.fortalezas.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-0.5 shrink-0">•</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mejoras */}
          {datos.mejoras?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1.5">
                <LightbulbFilament size={13} weight="fill" /> Qué mejorar
              </p>
              <ul className="space-y-1.5">
                {datos.mejoras.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5 shrink-0">→</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ejemplo reescrito */}
          {datos.ejemplo && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1.5 flex items-center gap-1.5">
                <Sparkle size={12} weight="fill" /> Sugerencia de redacción
              </p>
              <p className="text-sm text-teal-800 leading-relaxed italic">"{datos.ejemplo}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LinkedinOptima() {
  const { user, isPaidPlan, trialExpired } = useAuth()
  const [campos, setCampos] = useState({ titular: '', extracto: '', experiencia: '', habilidades: '', educacion: '' })

  // Bloqueo para usuarios gratuitos
  if (!isPaidPlan) {
    return (
      <ProGate
        tipo={trialExpired ? 'trial' : 'pro'}
        titulo="LinkedIn Óptimo"
        descripcion="Analiza y optimiza cada sección de tu perfil de LinkedIn con IA para maximizar tu visibilidad ante reclutadores y ATS."
        icono={<LinkedinLogo size={40} className="text-[#0077B5]" />}
        beneficios={[
          'Análisis de titular, extracto, experiencia y habilidades',
          'Score por sección con recomendaciones específicas',
          'Sugerencias con palabras clave del mercado',
          'Comparación contra estándares de reclutadores',
        ]}
      />
    )
  }
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  const camposLlenos = Object.values(campos).some(v => v.trim().length > 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!camposLlenos) return
    setCargando(true)
    setError('')
    setResultado(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const res = await fetch(`${API}/api/linkedin/analizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(campos),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al analizar el perfil')
      }

      const data = await res.json()
      setResultado(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const handleReset = () => {
    setResultado(null)
    setCampos({ titular: '', extracto: '', experiencia: '', habilidades: '', educacion: '' })
  }

  // ─── Vista de resultados ─────────────────────────────────────────────────
  if (resultado) {
    const colorGlobal = colorPuntaje(resultado.puntaje_global)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Puntaje global */}
        <div className={`rounded-2xl border ${colorGlobal.border} ${colorGlobal.bg} p-6 flex items-center gap-5`}>
          <ScoreRing score={resultado.puntaje_global} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={18} weight="duotone" className={colorGlobal.text} />
              <h2 className="font-bold text-gray-900 text-lg">Puntaje de tu Perfil</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{resultado.resumen_global}</p>
          </div>
        </div>

        {/* Prioridades rápidas */}
        {resultado.top_acciones?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star size={16} weight="duotone" className="text-amber-500" />
              Top acciones para mejorar tu perfil
            </p>
            <ol className="space-y-2">
              {resultado.top_acciones.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-[11px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Resultados por sección */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 px-1">Análisis por sección</h3>
          {SECCIONES.map(sec => {
            const datos = resultado.secciones?.[sec.id]
            if (!datos || !campos[sec.id]?.trim()) return null
            return <SeccionResultado key={sec.id} seccion={sec} datos={datos} />
          })}
        </div>

        {/* Botón para nuevo análisis */}
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Analizar otro perfil
        </button>
      </div>
    )
  }

  // ─── Vista del formulario ────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#0077B5]/10 flex items-center justify-center">
            <LinkedinLogo size={22} weight="fill" className="text-[#0077B5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">LinkedIn Optima</h1>
            <p className="text-xs text-gray-500">Análisis IA de tu perfil · 2026</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Pega el contenido de cada sección de tu perfil de LinkedIn y recibe un análisis
          detallado con puntaje y recomendaciones basadas en las mejores prácticas 2026.
        </p>

        {/* Info cómo copiar */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 mb-1.5">¿Cómo obtener el texto?</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            En LinkedIn, ve a tu perfil → haz clic en "Ver perfil" → copia manualmente
            el texto de cada sección. No necesitas pegar todas, con 1 o 2 ya obtienes valor.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {SECCIONES.map(sec => (
          <div key={sec.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <label className="text-sm font-semibold text-gray-800">{sec.label}</label>
              <span className="text-[11px] text-gray-400">{campos[sec.id]?.length || 0} / {sec.maxLength}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2.5">{sec.descripcion}</p>
            <textarea
              value={campos[sec.id]}
              onChange={e => setCampos(prev => ({ ...prev, [sec.id]: e.target.value }))}
              placeholder={sec.placeholder}
              rows={sec.rows}
              maxLength={sec.maxLength}
              className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800
                         placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0077B5]/20 focus:border-[#0077B5]/50
                         transition-all leading-relaxed"
            />
          </div>
        ))}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <WarningCircle size={16} className="text-red-500 mt-0.5 shrink-0" weight="fill" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!camposLlenos || cargando}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl
                     bg-[#0077B5] text-white font-semibold text-sm shadow-sm
                     hover:bg-[#005f96] disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all active:scale-[0.98]"
        >
          {cargando ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analizando tu perfil...
            </>
          ) : (
            <>
              <Sparkle size={17} weight="fill" />
              Analizar con IA
              <ArrowRight size={15} weight="bold" />
            </>
          )}
        </button>

        {!user && (
          <p className="text-center text-xs text-gray-400">
            Inicia sesión para guardar tu análisis y comparar versiones
          </p>
        )}
      </form>
    </div>
  )
}
