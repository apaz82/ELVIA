// Wizard: Crear CV desde cero
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { generarCVDesdeCero, extractarPerfilCV } from '../services/cvService'
import {
  Plus, X, ArrowLeft, ArrowRight, Question, Check,
  CheckFat, SpinnerGap, Warning, FileArrowDown, UploadSimple,
  WarningCircle, CheckCircle
} from '@phosphor-icons/react'

const PASOS = [
  { id: 'datos',       label: 'Datos Personales',    icon: '👤' },
  { id: 'resumen',     label: 'Resumen Profesional',  icon: '📝' },
  { id: 'experiencia', label: 'Experiencia Laboral',  icon: '💼' },
  { id: 'educacion',   label: 'Educación',            icon: '🎓' },
  { id: 'habilidades', label: 'Habilidades',          icon: '⭐' },
  { id: 'idiomas',     label: 'Idiomas',              icon: '🌍' },
]

const NIVELES_CEFR   = ['Nativo', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1']
const IDIOMAS_LIST   = ['Español', 'Inglés', 'Francés', 'Portugués', 'Alemán', 'Italiano', 'Japonés']
const PAISES         = ['México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Brasil', 'España', 'Estados Unidos', 'Otro']
const HABILIDADES_COMUNES = ['Liderazgo', 'Comunicación', 'Resolución de problemas', 'Análisis de datos', 'Gestión de proyectos', 'Negociación', 'Pensamiento estratégico', 'Innovación']

const ESTADO_EMPTY = {
  nombre: '', nombre2: '', apellido: '', apellido2: '',
  email: '', indicativo: '+52', telefono: '', ciudad: '', pais: '',
  cargo_objetivo: '', resumen: '',
  experiencias: [{ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }],
  educacion:    [{ institucion: '', titulo: '', anio: '' }],
  habilidades: [],
  idiomas:     [],
}

const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        className="text-slate-400 hover:text-slate-600 transition-colors cursor-help ml-1">
        <Question size={16} weight="fill" />
      </button>
      {show && (
        <div className="absolute z-20 bottom-full right-0 mb-2 w-52 bg-slate-800 text-white text-xs p-2.5 rounded-lg shadow-lg leading-relaxed">
          {text}
        </div>
      )}
    </div>
  )
}

// ─── Análisis de calidad ─────────────────────────────────────────────────────
function analizarCalidad(d) {
  let pts = 0
  const recs = []

  // Encabezado (20 pts)
  if (d.nombre && d.apellido) pts += 5; else recs.push('Completa tu nombre y apellido')
  if (d.email)   pts += 5; else recs.push('Agrega un correo electrónico de contacto')
  if (d.telefono) pts += 5; else recs.push('Agrega tu número de teléfono')
  if (d.ciudad && d.pais) pts += 5; else recs.push('Especifica tu ciudad y país')

  // Resumen (20 pts)
  if (d.resumen && d.resumen.length > 30) pts += 20
  else recs.push('Agrega un resumen profesional (3-5 líneas: años exp. + rol + logro)')

  // Experiencia (30 pts)
  const expOk = (d.experiencias || []).filter(e => e.empresa && e.cargo)
  if      (expOk.length >= 3) pts += 30
  else if (expOk.length === 2) pts += 22
  else if (expOk.length === 1) pts += 12
  if (expOk.length === 0) recs.push('Agrega al menos una experiencia laboral (empresa + cargo)')
  else if (expOk.length === 1) recs.push('Idealmente 2+ experiencias mejoran tu perfil')

  // Educación (15 pts)
  const eduOk = (d.educacion || []).filter(e => e.institucion && e.titulo)
  if (eduOk.length > 0) pts += 15; else recs.push('Agrega al menos un título académico')

  // Habilidades (15 pts)
  const numH = (d.habilidades || []).length
  if      (numH >= 6) pts += 15
  else if (numH >= 3) pts += 10
  else if (numH >= 1) pts += 5
  if (numH === 0) recs.push('Agrega habilidades técnicas y blandas relevantes')

  const porcentaje = Math.min(Math.round(pts), 100)
  return {
    porcentaje,
    estado: porcentaje >= 80 ? 'Excelente' : porcentaje >= 60 ? 'Incompleto' : 'Muy incompleto',
    nivel:  porcentaje >= 80 ? 'green' : porcentaje >= 60 ? 'amber' : 'red',
    recs,
  }
}

// ─── % de llenado del wizard ──────────────────────────────────────────────────
function calcularLlenado(d) {
  let pts = 0
  if (d.nombre && d.apellido) pts += 2
  if (d.email)   pts++
  if (d.telefono) pts++
  if (d.ciudad && d.pais) pts++
  if (d.cargo_objetivo) pts++
  if (d.resumen && d.resumen.length > 30) pts++
  if ((d.experiencias || []).some(e => e.empresa && e.cargo)) pts++
  if ((d.educacion || []).some(e => e.institucion && e.titulo)) pts++
  if ((d.habilidades || []).length >= 3) pts++
  if ((d.idiomas || []).length >= 1) pts++
  return Math.round((pts / 11) * 100)
}

// ─── Panel lateral de análisis ───────────────────────────────────────────────
function PanelAnalisis({ analisis, onClose }) {
  const colors = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'border-emerald-400', score: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    amber: { bg: 'bg-amber-50',   border: 'border-amber-200',   ring: 'border-amber-400',   score: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700'   },
    red:   { bg: 'bg-red-50',     border: 'border-red-200',     ring: 'border-red-300',     score: 'text-red-500',     badge: 'bg-red-100 text-red-700'       },
  }
  const c = colors[analisis.nivel]

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-sm">Análisis del CV</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
      </div>
      <div className="-mt-2 space-y-1">
        <p className="text-[11px] font-semibold text-slate-600">Análisis bajo altos estándares internacionales y expertos mentores de carrera.</p>
        <p className="text-[10px] text-slate-400 leading-relaxed">Esta es información privada y solo tuya. Nuestras recomendaciones son parte del proceso, pero tú debes aprobar los cambios.</p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shrink-0 ${c.ring}`}>
          <div className="text-center">
            <div className={`text-2xl font-black ${c.score}`}>{analisis.porcentaje}%</div>
            <div className="text-[9px] font-bold text-slate-500">Optim.</div>
          </div>
        </div>
        <div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.badge}`}>{analisis.estado}</span>
          <div className="mt-2">
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${analisis.nivel === 'green' ? 'bg-emerald-500' : analisis.nivel === 'amber' ? 'bg-amber-500' : 'bg-red-400'}`}
                style={{ width: `${analisis.porcentaje}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      {analisis.recs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">Areas a mejorar:</p>
          <ul className="space-y-1.5">
            {analisis.recs.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-700 bg-white/70 p-2 rounded-lg border border-white/80">
                <span className="text-amber-500 font-bold shrink-0">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analisis.recs.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-emerald-700 bg-white/70 p-2.5 rounded-lg flex items-start gap-2">
            <CheckCircle size={14} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Revisa cada sección para incluir actualizaciones, indicadores de gestión o información relevante. Después de esto, te generaremos una CV optimizada.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CVDesdeCero() {
  const { user, isPaidPlan, perfil } = useAuth()
  const navigate = useNavigate()

  const [pasoActual,    setPasoActual]    = useState(0)
  const [datos,         setDatos]         = useState(ESTADO_EMPTY)
  const [generando,     setGenerando]     = useState(false)
  const [cvGenerada,    setCvGenerada]    = useState(null)
  const [error,         setError]         = useState('')
  const [inicializando, setInicializando] = useState(true)
  const [ultimoGuardado,setUltimoGuardado]= useState(null)
  const [extrayendo,    setExtrayendo]    = useState(false)
  const [analisis,      setAnalisis]      = useState(null)
  const [cvMismatch,    setCvMismatch]    = useState(false)
  const [cvPending,     setCvPending]     = useState(null)   // datos extraídos en espera de confirmar
  const [cvFileName,    setCvFileName]    = useState('')
  const [nuevaHab,      setNuevaHab]      = useState('')

  const saveTimer = useRef(null)
  const fileRef   = useRef(null)

  // ── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      if (!user) return
      try {
        setInicializando(true)
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (!p) return

        const borrador = p?.job_search_profile?.cv_borrador
        if (borrador?.datos && Object.keys(borrador.datos).length > 0) {
          setDatos(borrador.datos)
          setPasoActual(borrador.paso_actual || 0)
        } else {
          setDatos({
            ...ESTADO_EMPTY,
            nombre:    p.nombre1  || '',
            nombre2:   p.nombre2  || '',
            apellido:  p.apellido1 || '',
            apellido2: p.apellido2 || '',
            email:     p.email_principal || p.email || '',
            indicativo: p.indicativo1 || '+52',
            telefono:  p.telefono1 || '',
            ciudad:    p.ciudad   || '',
            pais:      p.pais     || '',
            cargo_objetivo: p.industria_actual || '',
          })
        }
      } catch (e) {
        console.error('Error cargando datos:', e)
        setError('Error al cargar tus datos. Por favor recarga la página.')
      } finally {
        setInicializando(false)
      }
    }
    cargar()
  }, [user])

  // ── Auto-save (usuarios pago) ───────────────────────────────────────────────
  const guardarBorrador = useCallback(() => {
    if (!user || !isPaidPlan) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const { data: p } = await supabase.from('profiles').select('job_search_profile').eq('id', user.id).maybeSingle()
        if (!p) return
        const jsp = p.job_search_profile || {}
        const { error: e } = await supabase.from('profiles').update({
          job_search_profile: { ...jsp, cv_borrador: { paso_actual: pasoActual, ultimo_guardado: new Date().toISOString(), datos } }
        }).eq('id', user.id)
        if (!e) setUltimoGuardado(new Date())
      } catch (e) { console.error('Error guardando borrador:', e) }
    }, 2000)
  }, [user, isPaidPlan, pasoActual, datos])

  useEffect(() => { guardarBorrador() }, [pasoActual, datos])

  // ── Helpers de estado ───────────────────────────────────────────────────────
  const upDatos = (k, v)           => setDatos(f => ({ ...f, [k]: v }))
  const upExp   = (i, k, v)        => { const a = [...datos.experiencias]; a[i] = { ...a[i], [k]: v }; setDatos(f => ({ ...f, experiencias: a })) }
  const addExp  = ()               => setDatos(f => ({ ...f, experiencias: [...f.experiencias, { empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }] }))
  const delExp  = (i)              => setDatos(f => ({ ...f, experiencias: f.experiencias.filter((_, j) => j !== i) }))
  const upEdu   = (i, k, v)        => { const a = [...datos.educacion];    a[i] = { ...a[i], [k]: v }; setDatos(f => ({ ...f, educacion: a })) }
  const addEdu  = ()               => setDatos(f => ({ ...f, educacion: [...f.educacion, { institucion: '', titulo: '', anio: '' }] }))
  const delEdu  = (i)              => setDatos(f => ({ ...f, educacion: f.educacion.filter((_, j) => j !== i) }))
  const togHab  = (h)              => setDatos(f => ({ ...f, habilidades: f.habilidades.includes(h) ? f.habilidades.filter(x => x !== h) : [...f.habilidades, h] }))
  const addHab  = (h)              => { if (h && !datos.habilidades.includes(h)) { setDatos(f => ({ ...f, habilidades: [...f.habilidades, h] })); setNuevaHab('') } }
  const togIdm  = (id)             => { const arr = (datos.idiomas || []).filter(i => i.idioma !== id); if (!datos.idiomas?.some(i => i.idioma === id)) arr.push({ idioma: id, nivel: 'B2' }); setDatos(f => ({ ...f, idiomas: arr })) }
  const upNivIdm = (id, nivel)     => setDatos(f => ({ ...f, idiomas: f.idiomas.map(i => i.idioma === id ? { ...i, nivel } : i) }))

  // ── Aplicar datos extraídos del CV ──────────────────────────────────────────
  const aplicarDatos = (d) => {
    const expArr = Array.isArray(d.experiencias) && d.experiencias.length > 0
      ? d.experiencias.map(e => ({ empresa: e.empresa || '', cargo: e.cargo || '', fecha_inicio: e.fecha_inicio || '', fecha_fin: e.fecha_fin || '', descripcion: e.descripcion || '' }))
      : [{ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }]

    const eduArr = Array.isArray(d.educacion) && d.educacion.length > 0
      ? d.educacion.map(e => ({ institucion: e.institucion || '', titulo: e.titulo || '', anio: e.anio || '' }))
      : [{ institucion: '', titulo: '', anio: '' }]

    const merged = {
      nombre:         d.nombre1    || datos.nombre    || '',
      nombre2:        d.nombre2    || datos.nombre2   || '',
      apellido:       d.apellido1  || datos.apellido  || '',
      apellido2:      d.apellido2  || datos.apellido2 || '',
      email:          datos.email  || '',                          // no sobreescribir el email del registro
      indicativo:     d.indicativo1 ? d.indicativo1 : datos.indicativo,
      telefono:       d.telefono1  || datos.telefono  || '',
      ciudad:         d.ciudad     || datos.ciudad    || '',
      pais:           d.pais       || datos.pais      || '',
      cargo_objetivo: d.cargo_actual || datos.cargo_objetivo || '',
      resumen:        d.resumen    || '',                          // idioma original
      experiencias:   expArr,
      educacion:      eduArr,
      habilidades:    Array.isArray(d.habilidades) ? d.habilidades : datos.habilidades,
      idiomas:        Array.isArray(d.idiomas) && d.idiomas.length > 0 ? d.idiomas : datos.idiomas,
    }

    setDatos(merged)
    setAnalisis(analizarCalidad(merged))
    setCvPending(null)
    setError('')
  }

  // ── Extracción del CV ────────────────────────────────────────────────────────
  const extraerCV = async (archivo) => {
    if (!archivo) return
    setError('')
    setExtrayendo(true)
    setCvMismatch(false)
    setCvPending(null)
    setCvFileName(archivo.name)

    try {
      const tipos = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!tipos.includes(archivo.type)) throw new Error('Solo se aceptan PDF o Word (.pdf, .doc, .docx)')

      const resultado = await extractarPerfilCV(archivo)
      if (resultado.error) throw new Error(resultado.error)

      // Validación de identidad — doble capa:
      // 1) el backend ya puso mismatch:true si detectó discrepancia
      // 2) fallback frontend: compara con los datos pre-cargados del perfil
      const norm = (s) => (s || '').toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ')[0]
      const cvN  = norm(resultado.nombre1)
      const cvA  = norm(resultado.apellido1)
      const regN = norm(datos.nombre)    // pre-cargado de Supabase al iniciar
      const regA = norm(datos.apellido)
      const frontendMismatch = (regN && cvN && regN !== cvN) || (regA && cvA && regA !== cvA)

      if (resultado.mismatch || frontendMismatch) {
        setCvMismatch(true)
        setCvPending(resultado)
        return
      }

      aplicarDatos(resultado)
    } catch (err) {
      setCvFileName('')
      const msg = err?.message || ''
      if (msg.includes('401') || msg.includes('403')) setError('Sesión expirada. Recarga la página e intenta de nuevo.')
      else if (msg.includes('413'))                   setError('El archivo es muy grande. Máximo 5MB.')
      else if (msg.includes('Solo se aceptan'))       setError('Formato no soportado. Sube un PDF o Word (.docx).')
      else                                             setError('No pudimos procesar el CV. Intenta de nuevo.')
    } finally {
      setExtrayendo(false)
    }
  }

  // ── Generar CV con IA ────────────────────────────────────────────────────────
  const generarCV = async () => {
    setError('')
    setGenerando(true)
    try {
      const resultado = await generarCVDesdeCero(datos, 'es')
      if (resultado.error) throw new Error(resultado.error)
      setCvGenerada(resultado)
    } catch (err) {
      setError(err.message || 'Error al generar CV')
    } finally {
      setGenerando(false)
    }
  }

  // ── Confirmar y guardar en BD ─────────────────────────────────────────────
  const confirmarYGuardar = async () => {
    if (!cvGenerada) return
    setGenerando(true)
    try {
      // 1. Subir texto generado a Storage
      const blob = new Blob([cvGenerada.optimizedCV], { type: 'text/plain' })
      const { data: up, error: upErr } = await supabase.storage
        .from('cvs').upload(`${user.id}/cv_original.txt`, blob, { upsert: true })
      if (upErr) throw new Error('Error al guardar CV en Storage')

      // 2. Obtener job_search_profile actual
      const { data: pActual } = await supabase.from('profiles').select('job_search_profile').eq('id', user.id).maybeSingle()
      const jsp = pActual?.job_search_profile || {}
      const { cv_borrador, ...resto } = jsp

      // 3. Guardar datos estructurados + limpiar borrador
      const { error: updErr } = await supabase.from('profiles').update({
        cv_path:     up.path,
        cv_filename: 'cv_harvard.txt',
        job_search_profile: {
          ...resto,
          cv_datos_originales: { datos, generado_en: new Date().toISOString() }
        }
      }).eq('id', user.id)
      if (updErr) throw new Error('Error al actualizar perfil')

      setCvGenerada(null)
      setTimeout(() => navigate('/proyecto-laboral?exito=cv_creada'), 500)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerando(false)
    }
  }

  // ── Vista: CV generado para revisión ─────────────────────────────────────────
  if (cvGenerada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setCvGenerada(null)} className="mb-6 text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-2">
            <ArrowLeft size={20} /> Volver a editar
          </button>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {cvGenerada.optimizedCV}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
                {cvGenerada.changes?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Cambios realizados</h3>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {cvGenerada.changes.slice(0, 4).map((c, i) => (
                        <li key={i} className="flex gap-2"><Check size={13} className="text-green-600 shrink-0 mt-0.5" /><span>{c}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {cvGenerada.recommendations?.length > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Recomendaciones</h3>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {cvGenerada.recommendations.slice(0, 3).map((r, i) => (<li key={i}>💡 {r}</li>))}
                    </ul>
                  </div>
                )}
                <button onClick={confirmarYGuardar} disabled={generando}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                  {generando ? <><SpinnerGap size={18} className="animate-spin" /> Guardando...</> : <><CheckFat size={18} /> Confirmar como mi CV</>}
                </button>
                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">{error}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading inicial ───────────────────────────────────────────────────────────
  if (inicializando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <SpinnerGap size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  const pasoInfo   = PASOS[pasoActual]
  const pctLlenado = calcularLlenado(datos)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className={`mx-auto transition-all duration-300 ${analisis ? 'max-w-5xl' : 'max-w-2xl'}`}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800 mb-1">Crea tu CV desde cero</h1>
          <p className="text-slate-500 text-sm">Paso {pasoActual + 1} de {PASOS.length} · {pasoInfo.icon} {pasoInfo.label}</p>

          {/* Barra de pasos */}
          <div className="mt-3 flex gap-1">
            {PASOS.map((p, i) => (
              <div key={p.id} className={`flex-1 h-1.5 rounded-full transition-all ${i < pasoActual ? 'bg-green-500' : i === pasoActual ? 'bg-blue-500' : 'bg-slate-200'}`} />
            ))}
          </div>

          {/* % de llenado */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-slate-200 rounded-full h-1">
              <div className={`h-1 rounded-full transition-all duration-500 ${pctLlenado >= 80 ? 'bg-green-500' : pctLlenado >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`}
                style={{ width: `${pctLlenado}%` }} />
            </div>
            <span className={`text-xs font-bold shrink-0 ${pctLlenado >= 80 ? 'text-green-600' : pctLlenado >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>
              {pctLlenado}% completado
            </span>
          </div>
        </div>

        {/* Banners de estado */}
        {isPaidPlan && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {ultimoGuardado
              ? `✓ Guardado a las ${ultimoGuardado.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
              : 'Tus cambios se guardarán automáticamente...'}
          </div>
        )}


        {/* Layout: 1 col normal, 2 col cuando hay panel de análisis */}
        <div className={analisis ? 'grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start' : ''}>

          {/* ── Wizard principal ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">

            {/* PASO 0: Datos personales */}
            {pasoActual === 0 && (
              <div className="space-y-5">
                {/* Upload CV */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl p-5">
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx"
                    onChange={e => extraerCV(e.target.files?.[0])} className="hidden" />
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-700">¿Tienes un CV? Súbelo y llenamos el formulario</p>
                      <p className="text-xs text-slate-400 mt-0.5">{cvFileName || 'PDF o Word · Max. 5MB · Se respeta el idioma del CV'}</p>
                    </div>
                    <button onClick={() => fileRef.current?.click()} disabled={extrayendo}
                      className={`flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${extrayendo ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {extrayendo ? <SpinnerGap size={14} className="animate-spin" /> : <UploadSimple size={14} weight="bold" />}
                      {extrayendo ? 'Analizando...' : cvFileName ? 'Cambiar' : 'Cargar CV'}
                    </button>
                  </div>

                  {/* Banner de mismatch (CV de otra persona) */}
                  {cvMismatch && (
                    <div className="mt-3 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                      <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-bold text-red-700">El CV no corresponde al usuario registrado</p>
                        <p className="text-xs text-red-600 leading-relaxed">
                          No se puede subir información de terceros sin su previa autorización. Para mayor información lee nuestros{' '}
                          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-800">
                            Términos & Condiciones y Privacidad de Datos
                          </a>.
                        </p>
                        <button
                          onClick={() => {
                            setCvMismatch(false)
                            setCvPending(null)
                            setCvFileName('')
                            fileRef.current.value = ''
                            fileRef.current?.click()
                          }}
                          className="flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors">
                          <UploadSimple size={12} weight="bold" /> Cargar otro CV
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Banner de éxito al extraer */}
                  {!cvMismatch && cvFileName && analisis && (
                    <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-white border border-green-200">
                      <CheckCircle size={15} weight="fill" className="text-green-500 shrink-0" />
                      <p className="text-xs text-slate-700">
                        Datos extraídos de <span className="font-bold">{cvFileName}</span> — revisa y ajusta si es necesario
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
                    <WarningCircle size={14} className="shrink-0" /> {error}
                  </div>
                )}

                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Datos personales</p>

                <div className="grid grid-cols-2 gap-3">
                  {[['nombre','Primer nombre *'],['nombre2','Segundo nombre'],['apellido','Primer apellido *'],['apellido2','Segundo apellido']].map(([k, l]) => (
                    <input key={k} type="text" placeholder={l} value={datos[k]} onChange={e => upDatos(k, e.target.value)}
                      className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                  ))}
                </div>

                <input type="email" placeholder="Correo electrónico" value={datos.email} onChange={e => upDatos('email', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />

                <div className="flex gap-2">
                  <select value={datos.indicativo} onChange={e => upDatos('indicativo', e.target.value)}
                    className="border border-slate-300 rounded-xl px-2 py-2.5 text-sm focus:outline-none w-24 shrink-0">
                    {['+1','+52','+57','+54','+55','+34','+39','+49','+33'].map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  <input type="tel" placeholder="Teléfono" value={datos.telefono} onChange={e => upDatos('telefono', e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Ciudad" value={datos.ciudad} onChange={e => upDatos('ciudad', e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                  <select value={datos.pais} onChange={e => upDatos('pais', e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="">País</option>
                    {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <input type="text" placeholder="Cargo objetivo (ej: Operations Manager)" value={datos.cargo_objetivo} onChange={e => upDatos('cargo_objetivo', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              </div>
            )}

            {/* PASO 1: Resumen */}
            {pasoActual === 1 && (
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1 mb-2">
                  Resumen profesional (3-4 líneas)
                  <Tooltip text="Ej: 'Operations Manager with 8 years in manufacturing. Reduced costs by $2M in 2022. Seeking regional leadership role.'" />
                </label>
                <textarea placeholder="Describe tu perfil en el idioma que prefieras..." value={datos.resumen}
                  onChange={e => upDatos('resumen', e.target.value)} rows={6}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none" />
                <div className="text-xs text-slate-400 text-right -mt-1">{datos.resumen.length}/600 caracteres</div>
              </div>
            )}

            {/* PASO 2: Experiencia */}
            {pasoActual === 2 && (
              <div className="space-y-4">
                {datos.experiencias.map((exp, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-slate-700 text-sm">Experiencia {i + 1}</h4>
                      {datos.experiencias.length > 1 && (
                        <button onClick={() => delExp(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><X size={16} /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Empresa" value={exp.empresa} onChange={e => upExp(i, 'empresa', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                      <input placeholder="Cargo / Title" value={exp.cargo} onChange={e => upExp(i, 'cargo', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Fecha inicio (ej: Jan 2020)" value={exp.fecha_inicio} onChange={e => upExp(i, 'fecha_inicio', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                      <input placeholder="Fecha fin (ej: Present)" value={exp.fecha_fin} onChange={e => upExp(i, 'fecha_fin', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                    </div>
                    <textarea placeholder="Descripción y logros (en el idioma del CV)..." value={exp.descripcion} onChange={e => upExp(i, 'descripcion', e.target.value)}
                      rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none" />
                  </div>
                ))}
                <button onClick={addExp} className="w-full border-2 border-dashed border-blue-300 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 text-sm cursor-pointer">
                  <Plus size={16} /> Agregar experiencia
                </button>
              </div>
            )}

            {/* PASO 3: Educación */}
            {pasoActual === 3 && (
              <div className="space-y-4">
                {datos.educacion.map((edu, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-slate-700 text-sm">Educación {i + 1}</h4>
                      {datos.educacion.length > 1 && (
                        <button onClick={() => delEdu(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><X size={16} /></button>
                      )}
                    </div>
                    <input placeholder="Institución / University" value={edu.institucion} onChange={e => upEdu(i, 'institucion', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Título / Degree" value={edu.titulo} onChange={e => upEdu(i, 'titulo', e.target.value)}
                        className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                      <input placeholder="Año" value={edu.anio} onChange={e => upEdu(i, 'anio', e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                    </div>
                  </div>
                ))}
                <button onClick={addEdu} className="w-full border-2 border-dashed border-blue-300 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 text-sm cursor-pointer">
                  <Plus size={16} /> Agregar educación
                </button>
              </div>
            )}

            {/* PASO 4: Habilidades */}
            {pasoActual === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Selecciona o agrega tus habilidades principales</p>
                <div className="flex flex-wrap gap-2">
                  {HABILIDADES_COMUNES.map(h => (
                    <button key={h} onClick={() => togHab(h)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-colors cursor-pointer ${datos.habilidades.includes(h) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400'}`}>
                      {h}
                    </button>
                  ))}
                </div>

                {/* Habilidades extraídas del CV (no están en la lista estándar) */}
                {datos.habilidades.filter(h => !HABILIDADES_COMUNES.includes(h)).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Del CV:</p>
                    <div className="flex flex-wrap gap-2">
                      {datos.habilidades.filter(h => !HABILIDADES_COMUNES.includes(h)).map(h => (
                        <span key={h} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white">
                          {h}
                          <button onClick={() => togHab(h)} className="cursor-pointer ml-0.5 opacity-70 hover:opacity-100"><X size={11} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agregar habilidad personalizada */}
                <div className="flex gap-2">
                  <input type="text" placeholder="Agregar habilidad personalizada..." value={nuevaHab}
                    onChange={e => setNuevaHab(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addHab(nuevaHab)}
                    className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                  <button onClick={() => addHab(nuevaHab)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 cursor-pointer">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 5: Idiomas */}
            {pasoActual === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Idiomas que dominas</p>
                <div className="space-y-2">
                  {IDIOMAS_LIST.map(idioma => (
                    <div key={idioma} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3">
                      <input type="checkbox" checked={datos.idiomas?.some(i => i.idioma === idioma) || false}
                        onChange={() => togIdm(idioma)} className="w-4 h-4 cursor-pointer accent-blue-600" />
                      <span className="flex-1 text-sm font-medium text-slate-700">{idioma}</span>
                      {datos.idiomas?.some(i => i.idioma === idioma) && (
                        <select value={datos.idiomas.find(i => i.idioma === idioma)?.nivel || 'B2'}
                          onChange={e => upNivIdm(idioma, e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none">
                          {NIVELES_CEFR.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="mt-8 flex justify-between">
              <button onClick={() => setPasoActual(p => Math.max(0, p - 1))} disabled={pasoActual === 0}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-300 rounded-xl font-bold text-slate-700 disabled:opacity-30 hover:border-slate-500 transition-colors text-sm cursor-pointer">
                <ArrowLeft size={16} /> Anterior
              </button>
              {pasoActual === PASOS.length - 1 ? (
                <button onClick={generarCV} disabled={generando || !datos.nombre || !datos.apellido}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold disabled:opacity-50 transition-colors text-sm cursor-pointer">
                  {generando ? <><SpinnerGap size={16} className="animate-spin" /> Generando...</> : <><FileArrowDown size={16} /> Generar CV</>}
                </button>
              ) : (
                <button onClick={() => setPasoActual(p => Math.min(PASOS.length - 1, p + 1))}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-sm cursor-pointer">
                  Siguiente <ArrowRight size={16} />
                </button>
              )}
            </div>

            {error && pasoActual !== 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}
          </div>

          {/* ── Panel lateral de análisis ──────────────────────────────────── */}
          {analisis && (
            <div className="lg:sticky lg:top-6">
              <PanelAnalisis analisis={analisis} onClose={() => setAnalisis(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
