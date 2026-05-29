// LinkedIn Optima — Validador y optimizador de perfil LinkedIn con IA
import { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { calcularProgreso } from '../utils/progresoLaboral'
import toast from 'react-hot-toast'
import { useTrackEvent } from '../hooks/useTrackEvent'
import HelpBadge from '../components/common/HelpBadge'
import LinkedinReportePDF from '../components/LinkedinReportePDF'
import {
  LinkedinLogo, Sparkle, CheckCircle, WarningCircle,
  CaretDown, CaretUp, ArrowRight, Trophy, Star, LightbulbFilament,
  FilePdf, NotePencil, UploadSimple, CircleNotch, Clock,
  Copy, Eye, EyeSlash, PencilSimple, FileArrowDown
} from '@phosphor-icons/react'
import FeatureLocked from '../components/common/FeatureLocked'

const PI = {
  FilePdf, NotePencil, UploadSimple,
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
    placeholder: 'Empresa ABC · Gerente de Marketing Digital\nene. 2022 – presente · 3 años\nBogotá, Colombia\nLideré un equipo de 8 personas y aumenté la tasa de conversión en 35%...\n\nEmpresa XYZ · Jefe de Producto\nmar. 2019 – dic. 2021 · 2 años 10 meses\nMedellín, Colombia\nDesarrollé el roadmap de producto SaaS para 50 000 usuarios activos...',
    descripcion: 'Copia cada cargo con empresa, fechas y descripción. Ordena del más reciente al más antiguo.',
    maxLength: 5000,
    rows: 10,
  },
  {
    id: 'habilidades',
    label: 'Aptitudes (Skills)',
    placeholder: 'Ej: Product Management, Agile, Scrum, SQL, Tableau, Liderazgo de equipos...',
    descripcion: 'Lista tus aptitudes principales, separadas por coma. LinkedIn las llama "Skills".',
    maxLength: 1000,
    rows: 3,
  },
  {
    id: 'idiomas',
    label: 'Idiomas (Languages)',
    placeholder: 'Ej: Español (Nativo), Inglés (B2 – Avanzado), Portugués (A2 – Básico)...',
    descripcion: 'Idiomas que manejas y nivel de dominio.',
    maxLength: 300,
    rows: 2,
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

// Colores y labels por puntaje
function colorPuntaje(score) {
  if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', label: 'Excelente', labelBg: 'bg-emerald-100', labelText: 'text-emerald-700' }
  if (score >= 60) return { text: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    bar: 'bg-blue-500',    label: 'Bueno',     labelBg: 'bg-blue-100',    labelText: 'text-blue-700'    }
  if (score >= 40) return { text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500',   label: 'Regular',   labelBg: 'bg-amber-100',   labelText: 'text-amber-700'   }
  return               { text: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500',     label: 'Urgente',   labelBg: 'bg-red-100',     labelText: 'text-red-700'     }
}

function ScoreRing({ score }) {
  const color = colorPuntaje(score)
  return (
    <div className={`flex flex-col items-center justify-center w-36 h-36 rounded-full border-[6px] ${color.border} ${color.bg} shrink-0 shadow-2xl shadow-slate-200/50 relative overflow-hidden group`}>
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${color.bar} to-transparent`} />
      <span className={`text-5xl font-black ${color.text} relative z-10 tracking-tighter`}>{score}</span>
      <span className={`text-[12px] font-black ${color.text} uppercase tracking-widest relative z-10 opacity-60`}>/ 100</span>
      {/* Decorative pulse */}
      <div className={`absolute inset-0 rounded-full border-4 border-white/40 group-hover:scale-110 transition-transform duration-700`} />
    </div>
  )
}

// Copia al portapapeles + toast (helper compartido por las cards de sección).
const copiarPortapapeles = async (texto, etiqueta) => {
  if (!texto) return
  try {
    await navigator.clipboard.writeText(texto)
    toast.success(`${etiqueta} copiado al portapapeles`)
  } catch {
    toast.error('No pudimos copiar — intenta seleccionar el texto manualmente')
  }
}

// Bloque editable + botones (Copiar / Ver original) para una sección de texto largo.
// El usuario decide qué pegar en LinkedIn — el AI propone, NO impone.
function BloqueEditable({ seccion, original, valor, onChange, maxLength }) {
  const [verOriginal, setVerOriginal] = useState(false)
  return (
    <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
          <PencilSimple size={13} weight="fill" /> Tu {seccion.label.toLowerCase()} — edítalo si quieres antes de pegarlo
        </p>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {(valor || '').length}{maxLength ? ` / ${maxLength}` : ''}
        </span>
      </div>
      <textarea
        value={valor || ''}
        onChange={e => onChange(e.target.value)}
        rows={Math.max(seccion.rows || 4, 4)}
        maxLength={maxLength}
        className="w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white leading-relaxed"
        placeholder={`Aquí aparecerá la sugerencia generada para ${seccion.label}. Edítala antes de pegarla en LinkedIn.`}
      />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => copiarPortapapeles(valor || '', seccion.label)}
          disabled={!valor}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Copy size={13} weight="bold" /> Copiar al portapapeles
        </button>
        {original ? (
          <button
            type="button"
            onClick={() => setVerOriginal(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
          >
            {verOriginal
              ? <><EyeSlash size={13} weight="bold" /> Ocultar mi texto actual</>
              : <><Eye size={13} weight="bold" /> Ver mi texto actual</>
            }
          </button>
        ) : null}
      </div>
      {verOriginal && original ? (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Texto original tuyo</p>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{original}</p>
        </div>
      ) : null}
    </div>
  )
}

// Bloque editable especial para habilidades — chips removibles + entrada nueva + copiar todo.
function BloqueHabilidades({ habilidades, onChange, original }) {
  const [nuevaSkill, setNuevaSkill] = useState('')
  const [verOriginal, setVerOriginal] = useState(false)
  const lista = Array.isArray(habilidades) ? habilidades : []
  const eliminar = (i) => onChange(lista.filter((_, idx) => idx !== i))
  const agregar = () => {
    const v = nuevaSkill.trim()
    if (!v) return
    if (lista.includes(v)) {
      toast('Esa habilidad ya está en la lista', { icon: 'ℹ️' })
      setNuevaSkill('')
      return
    }
    if (lista.length >= 50) {
      toast.error('LinkedIn permite máximo 50 habilidades')
      return
    }
    onChange([...lista, v])
    setNuevaSkill('')
  }
  return (
    <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
          <PencilSimple size={13} weight="fill" /> Tus aptitudes — edita la lista antes de pegarlas
        </p>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {lista.length} / 50
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[48px] bg-slate-50 p-3 rounded-xl">
        {lista.length === 0 && (
          <span className="text-xs text-slate-400 italic">Las habilidades sugeridas aparecerán aquí.</span>
        )}
        {lista.map((s, i) => (
          <span key={`${s}-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm">
            {s}
            <button
              type="button"
              onClick={() => eliminar(i)}
              className="text-emerald-500 hover:text-rose-500 transition-colors font-bold text-sm"
              aria-label={`Eliminar ${s}`}
            >×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={nuevaSkill}
          onChange={e => setNuevaSkill(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar() } }}
          placeholder="Agregar aptitud y presionar Enter"
          className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!nuevaSkill.trim()}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 disabled:opacity-40 transition-all"
        >Agregar</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copiarPortapapeles(lista.join('\n'), 'Aptitudes')}
          disabled={lista.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Copy size={13} weight="bold" /> Copiar todas
        </button>
        {original ? (
          <button
            type="button"
            onClick={() => setVerOriginal(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
          >
            {verOriginal
              ? <><EyeSlash size={13} weight="bold" /> Ocultar mi lista actual</>
              : <><Eye size={13} weight="bold" /> Ver mi lista actual</>
            }
          </button>
        ) : null}
      </div>
      {verOriginal && original ? (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tus aptitudes actuales</p>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{original}</p>
        </div>
      ) : null}
    </div>
  )
}

function SeccionResultado({ seccion, datos, original, editable, onEditableChange }) {
  const [abierto, setAbierto] = useState(true)
  const color = colorPuntaje(datos.puntaje)
  const esHabilidades = seccion.id === 'habilidades'

  return (
    <div className={`rounded-3xl border ${color.border} overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300`}>
      {/* Header de sección */}
      <button
        onClick={() => setAbierto(a => !a)}
        className={`w-full flex items-center gap-5 px-6 py-5 ${color.bg} hover:brightness-95 transition-all text-left`}
      >
        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-white border ${color.border} shadow-sm shrink-0`}>
          <span className={`text-base font-black ${color.text}`}>{datos.puntaje}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-lg tracking-tight">{seccion.label}</p>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${color.labelBg} ${color.labelText}`}>
              {color.label}
            </span>
          </div>
          <div className="w-full h-2 bg-white/60 rounded-full mt-2 overflow-hidden border border-white/20">
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

          {/* Ejemplo reescrito (recordatorio del análisis IA — sigue visible) */}
          {datos.ejemplo && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1.5 flex items-center gap-1.5">
                <Sparkle size={12} weight="fill" /> Sugerencia de redacción
              </p>
              <p className="text-sm text-teal-800 leading-relaxed italic">"{datos.ejemplo}"</p>
            </div>
          )}

          {/* Nota Autoconocimiento solo para extracto */}
          {seccion.id === 'extracto' && (
            <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <LightbulbFilament size={15} weight="fill" className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                Esta sugerencia se generó tomando en cuenta tu Autoconocimiento y oferta de valor del Gerente de Proyecto.
              </p>
            </div>
          )}

          {/* Tip especial para idiomas */}
          {seccion.id === 'idiomas' && (
            <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
              <LightbulbFilament size={15} weight="fill" className="text-sky-500 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-700 font-medium leading-relaxed">
                Es ideal determinar el nivel de inglés realista. Te recomendamos hacer algún test gratuito en línea de buena reputación o si tienes de alguna institución avalada del idioma, y tenerlo en cuenta para esta sección.
              </p>
            </div>
          )}

          {/* Bloque editable: el texto sugerido aplicado, listo para pegar en LinkedIn */}
          {esHabilidades ? (
            <BloqueHabilidades
              habilidades={editable}
              onChange={onEditableChange}
              original={original}
            />
          ) : (
            <BloqueEditable
              seccion={seccion}
              original={original}
              valor={editable}
              onChange={onEditableChange}
              maxLength={seccion.maxLength}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function LinkedinOptima() {
  const { user, isPaidPlan, trialExpired, jpData, perfil } = useAuth()
  const navigate = useNavigate()
  const track = useTrackEvent()
  useEffect(() => { track('page_view', 'linkedin_pro') }, [])

  // Calcular progreso para el "Progress-based Unlock"
  const proyectoPct = calcularProgreso(jpData || {}, perfil || {})
  const isUnlockedByProgress = proyectoPct >= 100

  const [campos, setCampos] = useState({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
  const [importMode, setImportMode] = useState('pdf') // 'pdf' | 'manual'
  const [isExtracting, setIsExtracting] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  // Snapshot del texto original que el usuario subió/escribió en el momento del análisis.
  const [originalSnapshot, setOriginalSnapshot] = useState({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
  // Textos editables que la IA sugirió por sección — el usuario los modifica antes de pegarlos en LinkedIn.
  const [editables, setEditables] = useState({ titular: '', extracto: '', experiencia: '', habilidades: [], idiomas: '', educacion: '' })
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState([])
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const [generandoInforme, setGenerandoInforme] = useState(false)
  const [informeGenerado, setInformeGenerado] = useState(false)
  const [analisisPrevio, setAnalisisPrevio] = useState(null) // { created_at } del análisis guardado
  const [modalReemplazar, setModalReemplazar] = useState(false)
  // Contador de uso mensual (límite duro de análisis IA por mes calendario).
  const [usoMes, setUsoMes] = useState({ usados: 0, restantes: 10, limite: 10, fecha_reset: null })

  useEffect(() => {
    if (!user) return
    const loadHistorialYUso = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        const [resH, resU, resA] = await Promise.all([
          fetch(`${API}/api/linkedin/historial`, { headers }),
          fetch(`${API}/api/linkedin/uso-mes`, { headers }),
          fetch(`${API}/api/linkedin/ultimo-analisis`, { headers }),
        ])
        if (resH.ok) {
          const data = await resH.json()
          setHistorial(Array.isArray(data) ? data : [])
        }
        if (resU.ok) {
          const u = await resU.json()
          setUsoMes(u)
        }
        if (resA.ok) {
          const a = await resA.json()
          if (a?.original && Object.values(a.original).some(v => v?.trim?.().length > 0)) {
            // Precargar los campos con el último texto original guardado (silencioso)
            setCampos({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '', ...a.original })
            setImportMode('manual')
            setAnalisisPrevio({ created_at: a.created_at })
          }
        }
      } catch { /* lectura inicial no es crítica */ }
    }
    loadHistorialYUso()
  }, [user])

  // Bloqueo para usuarios que no han llegado al 100% de progreso (o plan pago)
  if (!isPaidPlan && !isUnlockedByProgress) {
    return (
      <FeatureLocked 
        titulo="LinkedIn Pro" 
        descripcion="Optimiza tu presencia en la red profesional más grande del mundo con análisis de keywords y estructura de alto impacto."
        icono={<LinkedinLogo size={44} weight="light" className="text-[#0077B5]" />}
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

      if (!res.ok) {
        // Preferimos el mensaje exacto del backend (incluye instrucciones de descarga si el PDF no coincide).
        let backendMsg = 'No se pudo extraer la información del PDF. Asegúrate de que sea el "Guardar en PDF" de LinkedIn.'
        try {
          const payload = await res.json()
          if (payload?.error) backendMsg = payload.error
        } catch { /* ignoramos parse error y usamos el mensaje por defecto */ }
        throw new Error(backendMsg)
      }
      const data = await res.json()

      setCampos(data)
      setImportMode('manual') // Cambiar a manual para que vean los resultados
      toast.success('¡Perfil importado con éxito!')
    } catch (err) {
      setError(err.message || 'Error al procesar el PDF. Asegúrate de que sea el "Guardar en PDF" de LinkedIn.')
    } finally {
      setIsExtracting(false)
    }
  }

  const camposLlenos = Object.values(campos).some(v => v.trim().length > 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Si hay análisis anterior guardado, pedir confirmación antes de gastar un cupo
    if (analisisPrevio) {
      setModalReemplazar(true)
      return
    }
    return handleLanzarAnalisis()
  }

  const handleLanzarAnalisis = async () => {
    setModalReemplazar(false)
    if (!camposLlenos) return
    setCargando(true)
    setError('')
    setResultado(null)
    track('feature_used', 'linkedin_pro', { action: 'analizar' })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const res = await fetch(`${API}/api/linkedin/analizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ ...campos, contextoLaboral: jpData }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al analizar el perfil')
      }

      const data = await res.json()
      setResultado(data)

      // Decremento optimista del contador (el backend ya validó antes del análisis).
      setUsoMes(prev => ({
        ...prev,
        usados: (prev.usados || 0) + 1,
        restantes: Math.max(0, (prev.restantes || 0) - 1),
      }))

      // Snapshot del texto original que el usuario tenía en el momento del análisis.
      // Sirve para el botón "Ver mi texto actual" en cada sección editable.
      setOriginalSnapshot({ ...campos })

      // Inicializar editables desde sugerencias_aplicables. Si el backend no las envía
      // (compatibilidad hacia atrás), caemos a `secciones[id].ejemplo` y luego al texto original.
      const sa = data.sugerencias_aplicables || {}
      const secs = data.secciones || {}
      const habilidadesIniciales = (() => {
        if (Array.isArray(sa.habilidades)) return sa.habilidades.filter(Boolean)
        // Fallback: parsear el ejemplo o el texto original separado por coma
        const fuente = sa.habilidades || secs.habilidades?.ejemplo || campos.habilidades || ''
        return String(fuente).split(/[,\n;]+/).map(s => s.trim()).filter(Boolean)
      })()
      const nuevosEditables = {
        titular:     sa.titular     || secs.titular?.ejemplo     || campos.titular     || '',
        extracto:    sa.extracto    || secs.extracto?.ejemplo    || campos.extracto    || '',
        experiencia: sa.experiencia || secs.experiencia?.ejemplo || campos.experiencia || '',
        habilidades: habilidadesIniciales,
        idiomas:     sa.idiomas     || secs.idiomas?.ejemplo     || campos.idiomas     || '',
        educacion:   sa.educacion   || secs.educacion?.ejemplo   || campos.educacion   || '',
      }
      setEditables(nuevosEditables)

      // Agregar al historial local inmediatamente (sin esperar re-fetch)
      const camposUsados = Object.entries(campos).filter(([, v]) => v.trim().length > 0).map(([k]) => k)
      setHistorial(prev => [{
        id: Date.now().toString(),
        puntaje_global: data.puntaje_global,
        resumen_global: data.resumen_global,
        top_acciones: data.top_acciones ?? [],
        secciones: data.secciones ?? {},
        campos_analizados: camposUsados,
        created_at: new Date().toISOString(),
      }, ...prev.slice(0, 9)])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const handleGenerarInforme = async () => {
    if (!resultado) return
    setGenerandoInforme(true)
    try {
      const { default: html2pdf } = await import('html2pdf.js')

      // Renderizar el componente PDF en un div temporal fuera del DOM visible
      const contenedor = document.createElement('div')
      contenedor.style.position = 'fixed'
      contenedor.style.left = '-9999px'
      contenedor.style.top = '0'
      document.body.appendChild(contenedor)

      const root = createRoot(contenedor)
      const fecha = new Date().toISOString().slice(0, 10)
      const nombreArchivo = `Analisis LinkedIn ${fecha}`

      await new Promise(resolve => {
        root.render(
          <LinkedinReportePDF
            analisis={resultado}
            editables={editables}
            original={originalSnapshot}
          />
        )
        // Dar tiempo al render
        setTimeout(resolve, 300)
      })

      await html2pdf().set({
        margin: 8,
        filename: `${nombreArchivo}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(contenedor.firstChild).save()

      root.unmount()
      document.body.removeChild(contenedor)

      // Guardar registro en Mis Documentos
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await fetch(`${API}/api/linkedin/guardar-reporte`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            analisis: resultado,
            editables,
            original: originalSnapshot,
            filename: nombreArchivo,
          }),
        })
      }

      setInformeGenerado(true)
      toast.success('¡Informe creado! Puedes verlo en Mis Documentos', { duration: 5000, icon: '📄' })
    } catch (err) {
      console.error('[generarInforme]', err)
      toast.error('No se pudo generar el informe. Intenta de nuevo.')
    } finally {
      setGenerandoInforme(false)
    }
  }

  const handleReset = () => {
    setResultado(null)
    setCampos({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
    setEditables({ titular: '', extracto: '', experiencia: '', habilidades: [], idiomas: '', educacion: '' })
    setOriginalSnapshot({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
    setAnalisisPrevio(null)
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Trophy size={18} weight="duotone" className={colorGlobal.text} />
              <h2 className="font-bold text-gray-900 text-lg">Puntaje de tu Perfil</h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colorGlobal.labelBg} ${colorGlobal.labelText}`}>
                {colorGlobal.label}
              </span>
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
            const desdHistorial = !!resultado.campos_analizados
            if (!datos || (!desdHistorial && !campos[sec.id]?.trim())) return null
            return (
              <SeccionResultado
                key={sec.id}
                seccion={sec}
                datos={datos}
                original={originalSnapshot[sec.id] || ''}
                editable={editables[sec.id]}
                onEditableChange={(nuevo) => setEditables(prev => ({ ...prev, [sec.id]: nuevo }))}
              />
            )
          })}
        </div>

        {/* Acciones finales */}
        <div className="space-y-3">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <p className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <LightbulbFilament size={16} weight="duotone" className="text-indigo-500" />
              Sobre estas sugerencias
            </p>
            <p className="text-sm text-indigo-700 leading-relaxed">
              Estas sugerencias se generaron tomando en cuenta tu Autoconocimiento, oferta de valor y el contexto de tu búsqueda laboral registrado en tu Gerente de Proyecto. Revísalas con calma y aplícalas gradualmente — el criterio final siempre es tuyo.
            </p>
          </div>

          {!informeGenerado ? (
            <button
              onClick={handleGenerarInforme}
              disabled={generandoInforme}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0077B5] to-[#019DF4] hover:brightness-110 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {generandoInforme ? (
                <><CircleNotch size={18} className="animate-spin" /> Generando informe...</>
              ) : (
                <><FileArrowDown size={18} weight="bold" /> Generar informe PDF</>
              )}
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              Informe generado
            </div>
          )}

          <button
            onClick={() => navigate('/mis-cvs?tab=reportes')}
            className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            Ir a Mis Documentos
            <ArrowRight size={14} weight="bold" />
          </button>

          <p className="text-center text-sm text-slate-500 font-medium leading-relaxed pt-2">
            Son sugerencias con las mejores prácticas de mercado, tu criterio es la palabra final.
          </p>
        </div>
      </div>
    )
  }

  // ─── Vista del formulario ────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Modal: confirmar reemplazo del análisis anterior */}
      {modalReemplazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                <WarningCircle size={32} weight="duotone" className="text-amber-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Ya tienes un análisis guardado</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tu análisis del{' '}
                <strong>{new Date(analisisPrevio?.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>{' '}
                será reemplazado por este nuevo. Esta acción usará uno de tus análisis del mes.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModalReemplazar(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleLanzarAnalisis}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#0077B5] to-[#019DF4] text-white text-sm font-black uppercase tracking-wider hover:brightness-110 transition-all"
              >
                Sí, reemplazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de análisis */}
      {historial.length > 0 && (
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <button
            onClick={() => setHistorialAbierto(h => !h)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Clock size={18} weight="duotone" className="text-[#0077B5]" />
              <div>
                <p className="text-sm font-bold text-slate-800">Historial de análisis</p>
                <p className="text-xs text-slate-400">{historial.length} análisis guardado{historial.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {historialAbierto ? <CaretUp size={16} className="text-slate-400" /> : <CaretDown size={16} className="text-slate-400" />}
          </button>
          {historialAbierto && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {historial.map((entry) => {
                const color = colorPuntaje(entry.puntaje_global)
                const fecha = new Date(entry.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
                const campos = Array.isArray(entry.campos_analizados) ? entry.campos_analizados.join(', ') : ''
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-full border-2 ${color.border} ${color.bg} shrink-0`}>
                      <span className={`text-sm font-black ${color.text}`}>{entry.puntaje_global}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${color.labelBg} ${color.labelText}`}>{color.label}</span>
                        <span className="text-xs text-slate-400">{fecha}</span>
                      </div>
                      {campos && <p className="text-[11px] text-slate-400 mt-0.5 truncate capitalize">{campos}</p>}
                    </div>
                    <button
                      onClick={() => {
                        setResultado(entry)
                        // Para análisis del historial no tenemos snapshot del texto original ni sugerencias_aplicables.
                        // Caemos al "ejemplo" del análisis IA — el usuario aún puede editar y copiar.
                        const secs = entry.secciones || {}
                        const habilidadesIniciales = String(secs.habilidades?.ejemplo || '')
                          .split(/[,\n;]+/).map(s => s.trim()).filter(Boolean)
                        setOriginalSnapshot({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
                        setEditables({
                          titular:     secs.titular?.ejemplo     || '',
                          extracto:    secs.extracto?.ejemplo    || '',
                          experiencia: secs.experiencia?.ejemplo || '',
                          habilidades: habilidadesIniciales,
                          idiomas:     secs.idiomas?.ejemplo     || '',
                          educacion:   secs.educacion?.ejemplo   || '',
                        })
                        setHistorialAbierto(false)
                      }}
                      className="shrink-0 text-xs font-bold text-[#0077B5] border border-[#0077B5]/20 hover:bg-[#0077B5]/5 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                    >
                      Ver <ArrowRight size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0077B5]/10 flex items-center justify-center border border-[#0077B5]/20">
            <LinkedinLogo size={40} weight="fill" className="text-[#0077B5]" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          LinkedIn<span className="text-[#0077B5]">®</span> Óptimo
        </h1>
        
        <div className="flex flex-col items-center gap-3">
          <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">
              Sintonización de Perfil con IA Elite · 2026
            </p>
          </div>
          <p className="text-sm text-slate-500 max-w-lg leading-relaxed font-medium">
            Transforma tu perfil en un imán de oportunidades. Analizamos tu contenido contra estándares de reclutadores expertos para que destaques en el mercado.
          </p>
          
          {/* Disclaimer Mandatory */}
          <div className="mt-4 px-5 py-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2">
            <Sparkle size={14} weight="fill" className="text-amber-500" />
            <p className="text-[10px] font-bold text-slate-600 italic">
              Construido y optimizado por mentores de carrera expertos y tecnología de última generación.
            </p>
          </div>
        </div>
      </div>

      {/* Avisos contextuales de perfil */}
      {(() => {
        const avisos = []
        const oferta = String(jpData?.oferta?.oferta_valor || '').trim()
        const hard = jpData?.autoconocimiento?.hard_skills || []
        const soft = jpData?.autoconocimiento?.soft_skills || []
        if (!oferta) avisos.push('Completa tu Oferta de Valor en el Gerente de Proyecto — enriquece el análisis con tu propuesta de valor única.')
        if (hard.length < 2 || soft.length < 2) avisos.push('Agrega al menos 2 Hard Skills y 2 Power Skills para que el análisis identifique mejor las brechas de tu perfil.')
        if (!avisos.length) return null
        return (
          <div className="space-y-2 mb-6">
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

      {/* Selector de Modo */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl mb-10 border border-slate-200 shadow-sm transition-all">
        {[
          { id: 'pdf', label: 'Carga PDF', icon: PI.FilePdf },
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
          <div className="space-y-6">
            {/* Instrucciones paso a paso */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] mb-4">
                Cómo descargar TU perfil en PDF
              </p>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0">1</span>
                  Entra a <strong>tu perfil principal</strong> en LinkedIn (no a otro perfil).
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0">2</span>
                  Haz clic en el botón <strong>"Recursos"</strong> (o "Más", según el idioma).
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0">3</span>
                  Selecciona <strong>"Guardar en PDF"</strong> y descarga el archivo.
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0">4</span>
                  Súbelo aquí — ELVIA valida que el perfil sea tuyo y analiza el contenido.
                </li>
              </ol>
            </div>

            {/* Zona de carga */}
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center hover:border-indigo-500/50 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/40">
              <div className="relative z-10">
                <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                  <PI.UploadSimple size={36} className="text-indigo-600" weight="duotone" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 italic">Importación Express de PDF</h3>
                <p className="text-sm text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
                  Súbelo aquí y ELVIA hará el resto.
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
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            {/* Panel de error visible en modo PDF (validación de identidad o lectura) */}
            {error && (
              <div className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-[2rem] px-6 py-5 shadow-inner">
                <PI.WarningCircle size={24} className="text-rose-500 shrink-0" weight="fill" />
                <div>
                  <h4 className="text-[11px] font-black text-rose-800 uppercase tracking-widest mb-1">No pudimos procesar el PDF</h4>
                  <p className="text-sm font-medium text-rose-700 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
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
                      <label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic flex items-center gap-2">
                        {sec.label}
                        <HelpBadge id={`linkedin.${sec.id}`} />
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

              {/* Contador de análisis del mes */}
              <div className={`space-y-2 px-5 py-4 rounded-2xl border ${usoMes.restantes <= 1 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'} mt-8`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkle size={16} weight="fill" className={usoMes.restantes <= 1 ? 'text-amber-500' : 'text-indigo-500'} />
                    <span className="text-xs font-bold text-slate-700">
                      Análisis restantes este mes: <span className={`font-black ${usoMes.restantes === 0 ? 'text-rose-600' : usoMes.restantes <= 1 ? 'text-amber-700' : 'text-indigo-700'}`}>{usoMes.restantes} / {usoMes.limite}</span>
                    </span>
                  </div>
                  {usoMes.restantes === 0 && usoMes.fecha_reset ? (
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                      Se reinicia el {new Date(usoMes.fecha_reset).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Es recomendable hacer cada vez menos cambios, y que sean cambios menores — los cambios bruscos en el perfil pueden confundir al mercado.
                </p>
              </div>

              <button
                type="submit"
                disabled={!camposLlenos || cargando || usoMes.restantes === 0}
                className="w-full flex items-center justify-center gap-4 py-5 rounded-[2rem]
                           bg-gradient-to-r from-[#0077B5] to-[#00a0dc] text-white font-black text-xs uppercase tracking-[0.35em] shadow-2xl shadow-indigo-900/30
                           hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all active:scale-[0.97] mt-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {cargando ? (
                  <>
                    <PI.CircleNotch size={20} className="animate-spin" />
                    Ejecutando Análisis Maestro...
                  </>
                ) : usoMes.restantes === 0 ? (
                  <>
                    <PI.WarningCircle size={20} weight="fill" />
                    Límite mensual alcanzado
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
