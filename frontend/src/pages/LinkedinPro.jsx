// LinkedIn Optima — Validador y optimizador de perfil LinkedIn con IA
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import toast from 'react-hot-toast'
import {
  LinkedinLogo, Sparkle, CheckCircle, WarningCircle,
  CaretDown, CaretUp, ArrowRight, Trophy, Star, LightbulbFilament,
  FilePdf, MagicWand, NotePencil, UploadSimple, SelectionAll, CircleNotch
} from '@phosphor-icons/react'
import ProGate from '../components/common/ProGate'

const PI = { 
  FilePdf, MagicWand, NotePencil, UploadSimple, SelectionAll, 
  CircleNotch, Sparkle, CheckCircle, WarningCircle, ArrowRight 
}

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
  const [importMode, setImportMode] = useState('pdf') // 'pdf' | 'paste' | 'manual'
  const [isExtracting, setIsExtracting] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

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

  const handlePDFUpload = async (file) => {
    if (!file) return
    setIsExtracting(true)
    setError('')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const formData = new FormData()
      formData.append('pdf', file)

      const res = await fetch(`${API}/api/linkedin/extraer-pdf`, {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: formData,
      })

      if (!res.ok) throw new Error('No se pudo extraer la información del PDF')
      const data = await res.json()
      
      setCampos(data)
      setImportMode('manual') // Cambiar a manual para que vean los resultados
      toast.success('¡Perfil importado con éxito!')
    } catch (err) {
      setError('Error al procesar el PDF. Asegúrate de que sea el "Guardar en PDF" de LinkedIn.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handlePasteMagic = async (blob) => {
    if (!blob || blob.length < 50) return
    setIsExtracting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API}/api/linkedin/extraer-texto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ blob }),
      })

      if (!res.ok) throw new Error('La IA no pudo procesar este texto')
      const data = await res.json()
      
      setCampos(data)
      setImportMode('manual')
      toast.success('¡Texto procesado e importado!')
    } catch (err) {
      setError('No logramos estructurar el texto. Prueba con el PDF o pega sección por sección.')
    } finally {
      setIsExtracting(false)
    }
  }

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
    setImportMode('pdf')
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
      <div className="mb-8 p-1">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
            <LinkedinLogo size={32} weight="fill" className="text-[#0077B5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase">LinkedIn Optima</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Sintonización IA de Perfil · 2026</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">
          Optimiza tu presencia profesional en LinkedIn. Elige el método de carga que prefieras para un análisis instantáneo.
        </p>
      </div>

      {/* Selector de Modo */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl mb-10 border border-slate-200 shadow-sm transition-all">
        {[
          { id: 'pdf', label: 'Carga PDF', icon: PI.FilePdf },
          { id: 'paste', label: 'Pegado Mágico', icon: PI.MagicWand },
          { id: 'manual', label: 'Manual', icon: PI.NotePencil },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setImportMode(m.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
              importMode === m.id 
                ? 'bg-white text-indigo-600 shadow-md border border-slate-100 scale-[1.02]' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
            }`}
          >
            <m.icon size={16} weight={importMode === m.id ? 'fill' : 'bold'} />
            {m.label}
          </button>
        ))}
      </div>

      {/* MODOS DE CARGA */}
      <div className="mb-10 min-h-[300px]">
        {importMode === 'pdf' && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center hover:border-indigo-500/50 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/40">
            <div className="relative z-10">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                <PI.UploadSimple size={36} className="text-indigo-600" weight="duotone" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 italic">Importación Express de PDF</h3>
              <p className="text-sm text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
                LinkedIn → Perfil → Botón 'Más' → <span className="font-bold text-slate-800">Guardar en PDF</span>.<br/>Súbelo aquí y ELVIA hará el resto.
              </p>
              
              <input 
                type="file" 
                accept=".pdf"
                onChange={e => handlePDFUpload(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                disabled={isExtracting}
              />
              
              {isExtracting ? (
                <div className="flex flex-col items-center gap-4">
                   <div className="w-12 h-12 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                   <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Decodificando Perfil...</p>
                </div>
              ) : (
                <button className="px-10 py-4 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.25em] rounded-2xl shadow-2xl shadow-indigo-900/30 group-hover:bg-indigo-500 group-hover:-translate-y-1 transition-all duration-300">
                  Seleccionar archivo PDF
                </button>
              )}
            </div>
            {/* Decoración de fondo */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
          </div>
        )}

        {importMode === 'paste' && (
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/30">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100">
                 <PI.SelectionAll size={24} className="text-violet-600" weight="duotone" />
               </div>
               <div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight italic">Caja Mágica de Pegado</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Extrae todo tu perfil en segundos</p>
               </div>
            </div>
            
            <textarea 
              placeholder="Haz Ctrl+A en tu perfil de LinkedIn, copia y pega TODO aquí... la IA lo limpia por ti."
              className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm text-slate-700 h-56 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all leading-relaxed placeholder:text-slate-300 shadow-inner"
              onPaste={(e) => {
                const text = e.clipboardData.getData('text')
                handlePasteMagic(text)
              }}
            />
            
            {isExtracting && (
              <div className="mt-6 flex items-center gap-3 justify-center">
                 <PI.CircleNotch size={20} className="text-violet-500 animate-spin" />
                 <span className="text-[11px] font-black text-violet-600 uppercase tracking-widest animate-pulse">IA Procesando Textos...</span>
              </div>
            )}
            
            <p className="mt-6 text-[10px] text-slate-400 italic text-center font-bold uppercase tracking-[0.2em] leading-relaxed">
              No te preocupes por el formato o textos extra de la web,<br/>nuestra IA separa las secciones automáticamente.
            </p>
          </div>
        )}

        {importMode === 'manual' && (
          <div className="space-y-8 animate-slide-up">
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-5 flex items-center justify-between backdrop-blur-sm">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <PI.CheckCircle size={18} className="text-white" weight="bold" />
                 </div>
                 <p className="text-[11px] font-black text-emerald-800 uppercase tracking-tight italic">Revisa y Analiza tu Perfil</p>
               </div>
               <button 
                onClick={() => setImportMode('pdf')} 
                className="px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase text-slate-600 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
               >
                 Cambiar modo
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {SECCIONES.map(sec => (
                <div key={sec.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/20 hover:shadow-indigo-500/5 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                      <label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">
                        {sec.label}
                      </label>
                    </div>
                    <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {campos[sec.id]?.length || 0} / {sec.maxLength}
                      </span>
                    </div>
                  </div>
                  <textarea
                    value={campos[sec.id]}
                    onChange={e => setCampos(prev => ({ ...prev, [sec.id]: e.target.value }))}
                    placeholder={sec.placeholder}
                    rows={sec.rows}
                    maxLength={sec.maxLength}
                    className="w-full resize-none rounded-2xl border-none bg-slate-50/50 group-focus-within:bg-white px-6 py-5 text-sm text-slate-800
                               placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all leading-relaxed shadow-inner"
                  />
                  <p className="mt-3 text-[10px] text-slate-400 font-medium px-1 italic">{sec.descripcion}</p>
                </div>
              ))}

              {error && (
                <div className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-[2rem] px-6 py-5 shadow-inner">
                  <PI.WarningCircle size={24} className="text-rose-500 shrink-0" weight="fill" />
                  <div>
                    <h4 className="text-[11px] font-black text-rose-800 uppercase tracking-widest mb-1">Error de Proceso</h4>
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-tight leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!camposLlenos || cargando}
                className="w-full flex items-center justify-center gap-4 py-5 rounded-[2rem]
                           bg-gradient-to-r from-[#0077B5] to-[#00a0dc] text-white font-black text-xs uppercase tracking-[0.35em] shadow-2xl shadow-indigo-900/30
                           hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all active:scale-[0.97] mt-10 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {cargando ? (
                  <>
                    <PI.CircleNotch size={20} className="animate-spin" />
                    Ejecutando Análisis Maestro...
                  </>
                ) : (
                  <>
                    <PI.Sparkle size={20} weight="fill" />
                    Lanzar Inteligencia Optima
                    <PI.ArrowRight size={18} weight="bold" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {!user && importMode === 'manual' && (
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60">
          Inicia sesión para guardar tu análisis y comparar versiones
        </p>
      )}
    </div>
  )
}
