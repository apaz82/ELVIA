// Onboarding — se muestra una sola vez después del primer registro
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { api } from '../services/api'

// ─── Catálogos ───────────────────────────────────────────────────────────────

const PAISES_LATAM = [
  'México','Colombia','Argentina','Chile','Perú','Venezuela','Ecuador','Bolivia',
  'Uruguay','Paraguay','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua',
  'Panamá','República Dominicana','Cuba','España','Estados Unidos','Canadá','Brasil','Otro',
]

// Indicativos telefónicos por país
const INDICATIVOS = [
  { code:'MX', label:'México',             ind:'+52'  },
  { code:'CO', label:'Colombia',           ind:'+57'  },
  { code:'AR', label:'Argentina',          ind:'+54'  },
  { code:'CL', label:'Chile',              ind:'+56'  },
  { code:'PE', label:'Perú',               ind:'+51'  },
  { code:'VE', label:'Venezuela',          ind:'+58'  },
  { code:'EC', label:'Ecuador',            ind:'+593' },
  { code:'BO', label:'Bolivia',            ind:'+591' },
  { code:'UY', label:'Uruguay',            ind:'+598' },
  { code:'PY', label:'Paraguay',           ind:'+595' },
  { code:'CR', label:'Costa Rica',         ind:'+506' },
  { code:'GT', label:'Guatemala',          ind:'+502' },
  { code:'HN', label:'Honduras',           ind:'+504' },
  { code:'SV', label:'El Salvador',        ind:'+503' },
  { code:'NI', label:'Nicaragua',          ind:'+505' },
  { code:'PA', label:'Panamá',             ind:'+507' },
  { code:'DO', label:'Rep. Dominicana',    ind:'+1'   },
  { code:'CU', label:'Cuba',               ind:'+53'  },
  { code:'ES', label:'España',             ind:'+34'  },
  { code:'US', label:'Estados Unidos',     ind:'+1'   },
  { code:'CA', label:'Canadá',             ind:'+1'   },
  { code:'BR', label:'Brasil',             ind:'+55'  },
  { code:'XX', label:'Otro',               ind:''     },
]

// Mapa de country_code de ipapi → nombre en PAISES_LATAM
const PAIS_POR_IPCODE = {
  MX:'México', CO:'Colombia', AR:'Argentina', CL:'Chile', PE:'Perú',
  VE:'Venezuela', EC:'Ecuador', BO:'Bolivia', UY:'Uruguay', PY:'Paraguay',
  CR:'Costa Rica', GT:'Guatemala', HN:'Honduras', SV:'El Salvador',
  NI:'Nicaragua', PA:'Panamá', DO:'República Dominicana', CU:'Cuba',
  ES:'España', US:'Estados Unidos', CA:'Canadá', BR:'Brasil',
}

const indicativoPorPais = (pais) => {
  const entry = INDICATIVOS.find(i => i.label === pais || i.label.startsWith(pais?.split(' ')[0] || ''))
  return entry?.ind || '+1'
}

const NIVELES_CARGO = ['Asesor externo','Analista','Asistente','Jefe','Coordinador','Gerente','Director','C-Level']

const INDUSTRIAS_LATAM = [
  'Manufactura e Industria','Tecnología y Software','Banca y Servicios Financieros',
  'Seguros','Comercio y Retail','Salud y Farmacéutica','Agroindustria y Alimentos',
  'Construcción e Infraestructura','Energía y Petróleo','Telecomunicaciones',
  'Logística y Transporte','Consultoría','Educación','Gobierno y Sector Público',
  'Medios y Entretenimiento','Turismo y Hospitalidad','Automotriz','Minería',
  'Bienes Raíces','Marketing y Publicidad','Legal y Jurídico','Recursos Humanos',
  'Startups y Emprendimiento','Otro',
]

const AREAS = ['Operaciones','Supply Chain','Finanzas','IT','R&D','Recursos Humanos','Ingeniería','Dirección General','Marketing','Ventas','Legal','Otro']
const TIPOS_TRABAJO = ['Híbrido','Presencial','Remoto']

const PRESTACIONES_POR_PAIS = {
  'México': ['IMSS','INFONAVIT','AFORE','Aguinaldo (30 días)','Prima vacacional','Seguro de gastos médicos','Seguro de vida','Vales de despensa','Fondo de ahorro','Auto de empresa','Caja de ahorro'],
  'Colombia': ['EPS (salud)','Pensión','ARL','Prima de servicios','Cesantías','Vacaciones adicionales','Dotación','Caja de compensación','Seguro de vida'],
  'Argentina': ['Obra social','ART','SAC (aguinaldo)','Jubilación','Vacaciones legales','Plan médico privado','Seguro de vida'],
  'Chile': ['AFP','Isapre / Fonasa','Seguro de cesantía','Gratificación legal','Seguro de accidentes'],
  'Perú': ['EsSalud','AFP / ONP','Gratificación','CTS','Seguro de vida ley','Vacaciones'],
  'Venezuela': ['IVSS','Bono de alimentación','Utilidades','Cesta ticket','Seguro médico'],
  'Ecuador': ['IESS','Décimo tercer sueldo','Décimo cuarto sueldo','Fondos de reserva','Vacaciones'],
  'default': ['Seguro médico','Seguro de vida','Bono anual de desempeño','Plan de pensión','Vehículo / viáticos','Vacaciones adicionales','Flexibilidad horaria','Home office','Capacitación y desarrollo'],
}
const getPrestaciones = (pais) => PRESTACIONES_POR_PAIS[pais] || PRESTACIONES_POR_PAIS['default']

const MONEDAS = [
  { code:'MXN',symbol:'$' },{ code:'COP',symbol:'$' },{ code:'ARS',symbol:'$' },
  { code:'CLP',symbol:'$' },{ code:'PEN',symbol:'S/' },{ code:'USD',symbol:'$' },
  { code:'EUR',symbol:'€' },{ code:'BRL',symbol:'R$' },{ code:'UYU',symbol:'$' },
]
const MONEDA_POR_PAIS = {
  'México':'MXN','Colombia':'COP','Argentina':'ARS','Chile':'CLP','Perú':'PEN',
  'Uruguay':'UYU','Venezuela':'USD','Ecuador':'USD','El Salvador':'USD','Panamá':'USD',
  'España':'EUR','Estados Unidos':'USD','Canadá':'CAD','Brasil':'BRL',
}
const detectarMoneda = (pais) => MONEDA_POR_PAIS[pais] || 'USD'

const PASOS = ['Información personal','Compensación','Aspiraciones']

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Onboarding() {
  const { user, loading: authLoading, refreshPerfil, perfil } = useAuth()
  const navigate = useNavigate()
  const cvInputRef = useRef(null)

  const [paso, setPaso] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [detectando, setDetectando] = useState(false)

  const bloqueado = !!(perfil?.nombre1 && perfil?.apellido1)

  // ── Sección 1 ──
  const [s1, setS1] = useState({
    pais: '', ciudad: '',
    nombre1: '', nombre2: '', apellido1: '', apellido2: '',
    indicativo1: '+52', telefono1: '',
    indicativo2: '+52', telefono2: '',
    email_secundario: '',
    ciudades_busqueda: [],
    edad: '',
  })
  const [ciudadInput, setCiudadInput] = useState('')

  // ── Sección 2 ──
  const [s2, setS2] = useState({ salario_monto: '', moneda: 'MXN', prestaciones: [] })

  // ── Sección 3 ──
  const [s3, setS3] = useState({ nivel_cargo: '', industrias_deseadas: [], tipo_trabajo: '', area: '' })

  useEffect(() => {
    if (authLoading) return
    if (!user) navigate('/auth')
  }, [user, authLoading])

  // Detección de país por IP al montar
  useEffect(() => {
    if (s1.pais) return // no sobreescribir si ya viene del perfil
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        const paisDetectado = PAIS_POR_IPCODE[d.country_code] || ''
        const indDetectado  = INDICATIVOS.find(i => i.code === d.country_code)?.ind || '+52'
        if (paisDetectado) {
          setS1(f => ({
            ...f,
            pais:       f.pais || paisDetectado,
            ciudad:     f.ciudad || d.region || '',
            indicativo1: f.indicativo1 === '+52' ? indDetectado : f.indicativo1,
            indicativo2: f.indicativo2 === '+52' ? indDetectado : f.indicativo2,
          }))
          setS2(f => ({ ...f, moneda: f.moneda === 'MXN' ? detectarMoneda(paisDetectado) : f.moneda }))
        }
      })
      .catch(() => {})
  }, [])

  // Pre-llenar con datos existentes del perfil
  useEffect(() => {
    if (!perfil) return
    const [monto, monedaSaved] = (perfil.salario_esperado || '').split(' ')
    setS1(prev => ({
      ...prev,
      pais:              perfil.pais || prev.pais,
      ciudad:            perfil.ciudad || prev.ciudad,
      nombre1:           perfil.nombre1 || '',
      nombre2:           perfil.nombre2 || '',
      apellido1:         perfil.apellido1 || '',
      apellido2:         perfil.apellido2 || '',
      indicativo1:       perfil.indicativo1 || prev.indicativo1,
      telefono1:         perfil.telefono1 || '',
      indicativo2:       perfil.indicativo2 || prev.indicativo2,
      telefono2:         perfil.telefono2 || '',
      email_secundario:  perfil.email_secundario || '',
      ciudades_busqueda: perfil.ciudades_busqueda || [],
      edad:              perfil.edad || '',
    }))
    setS2(prev => ({
      ...prev,
      prestaciones: perfil.prestaciones || [],
      salario_monto: monto || '',
      moneda: monedaSaved || detectarMoneda(perfil.pais),
    }))
    setS3(prev => ({
      ...prev,
      nivel_cargo:         perfil.nivel_cargo || '',
      industrias_deseadas: perfil.industrias_deseadas || [],
      tipo_trabajo:        perfil.tipo_trabajo || '',
      area:                perfil.area || '',
    }))
  }, [perfil])

  // Actualizar moneda e indicativos cuando cambia el país
  const handlePaisChange = (e) => {
    const pais = e.target.value
    const ind  = indicativoPorPais(pais)
    setS1(f => ({ ...f, pais, indicativo1: ind, indicativo2: ind }))
    setS2(f => ({ ...f, moneda: detectarMoneda(pais) }))
  }

  // ── Auto-detección desde CV ──
  const detectarDesdeCv = async (file) => {
    if (!file) return
    setDetectando(true)
    try {
      const formData = new FormData()
      formData.append('cv', file)
      const data = await api.postForm('/api/cv/extract-profile', formData)
      setS1(prev => ({
        ...prev,
        nombre1:   bloqueado ? prev.nombre1  : (data.nombre1  || prev.nombre1),
        nombre2:   data.nombre2  || prev.nombre2,
        apellido1: bloqueado ? prev.apellido1 : (data.apellido1 || prev.apellido1),
        apellido2: data.apellido2 || prev.apellido2,
        telefono1: data.telefono1 || prev.telefono1,
        ciudad:    data.ciudad    || prev.ciudad,
        edad:      data.edad      || prev.edad,
      }))
    } catch { /* falla silenciosamente */ }
    finally { setDetectando(false) }
  }

  // ── Ciudades de búsqueda ──
  const agregarCiudad = () => {
    const val = ciudadInput.trim()
    if (!val || s1.ciudades_busqueda.length >= 5 || s1.ciudades_busqueda.includes(val)) { setCiudadInput(''); return }
    setS1(f => ({ ...f, ciudades_busqueda: [...f.ciudades_busqueda, val] }))
    setCiudadInput('')
  }
  const quitarCiudad = (c) => setS1(f => ({ ...f, ciudades_busqueda: f.ciudades_busqueda.filter(x => x !== c) }))

  const toggleIndustria = (ind) => setS3(f => ({
    ...f,
    industrias_deseadas: f.industrias_deseadas.includes(ind)
      ? f.industrias_deseadas.filter(x => x !== ind)
      : [...f.industrias_deseadas, ind],
  }))

  const togglePrestacion = (p) => setS2(f => ({
    ...f,
    prestaciones: f.prestaciones.includes(p)
      ? f.prestaciones.filter(x => x !== p)
      : [...f.prestaciones, p],
  }))

  // ── Guardar ──
  const guardar = async (omitir = false) => {
    if (!omitir) {
      if (!s1.pais.trim())     { setError('El país es requerido.'); return }
      if (!s1.nombre1.trim())  { setError('El primer nombre es requerido.'); return }
      if (!s1.apellido1.trim()){ setError('El primer apellido es requerido.'); return }
      if (!s1.telefono1.trim()){ setError('El teléfono principal es requerido.'); return }
    }
    setSaving(true)
    setError('')
    const nombreCompleto = [s1.nombre1, s1.nombre2, s1.apellido1, s1.apellido2]
      .map(s => s?.trim()).filter(Boolean).join(' ')
    const salario_esperado = s2.salario_monto ? `${s2.salario_monto} ${s2.moneda}` : ''
    const { error: err } = await supabase.from('profiles').update({
      nombre1: s1.nombre1.trim(), nombre2: s1.nombre2.trim() || null,
      apellido1: s1.apellido1.trim(), apellido2: s1.apellido2.trim() || null,
      indicativo1: s1.indicativo1, telefono1: s1.telefono1.trim() || null,
      indicativo2: s1.indicativo2, telefono2: s1.telefono2.trim() || null,
      email_secundario: s1.email_secundario.trim() || null,
      pais: s1.pais, ciudad: s1.ciudad,
      ciudades_busqueda: s1.ciudades_busqueda,
      edad: s1.edad ? parseInt(s1.edad) : null,
      salario_esperado, prestaciones: s2.prestaciones,
      nivel_cargo: s3.nivel_cargo, industrias_deseadas: s3.industrias_deseadas,
      tipo_trabajo: s3.tipo_trabajo, area: s3.area,
      nombre: nombreCompleto,
    }).eq('id', user.id)
    setSaving(false)
    if (err) { setError('Error al guardar. Intenta de nuevo.'); return }
    await refreshPerfil()
    navigate('/cv-optimizer')
  }

  const validarPaso = () => {
    if (paso === 0) {
      if (!s1.pais.trim())     { setError('El país es requerido.'); return false }
      if (!s1.nombre1.trim())  { setError('El primer nombre es requerido.'); return false }
      if (!s1.apellido1.trim()){ setError('El primer apellido es requerido.'); return false }
      if (!s1.telefono1.trim()){ setError('El teléfono principal es requerido.'); return false }
    }
    setError('')
    return true
  }

  const siguiente = () => { if (validarPaso()) setPaso(p => p + 1) }
  const anterior  = () => { setError(''); setPaso(p => p - 1) }

  if (authLoading) return null

  // Componente de selector de indicativo + input teléfono
  const TelefonoInput = ({ indicativoKey, telefonoKey, label, required }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}{required ? ' *' : ''}</label>
      <div className="flex gap-1.5">
        <select
          value={s1[indicativoKey]}
          onChange={e => setS1(f => ({ ...f, [indicativoKey]: e.target.value }))}
          className="border border-gray-300 rounded-lg px-1.5 py-2.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary shrink-0 w-24"
        >
          {INDICATIVOS.map(i => (
            <option key={i.code} value={i.ind}>{i.code} {i.ind}</option>
          ))}
        </select>
        <input
          type="tel"
          value={s1[telefonoKey]}
          onChange={e => setS1(f => ({ ...f, [telefonoKey]: e.target.value }))}
          placeholder="55 1234 5678"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-2xl">

        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">CV</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido!</h1>
          <p className="mt-2 text-gray-500 text-sm">Completa tu perfil para personalizar tu experiencia.</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {PASOS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
                  ${i < paso ? 'bg-green-500 text-white' : i === paso ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i < paso ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === paso ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < PASOS.length - 1 && <div className={`h-0.5 w-6 shrink-0 ${i < paso ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* ─── PASO 0 — Sección 1 ────────────────────────────────────────── */}
        {paso === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm space-y-6">

            {/* Autocompletar desde CV */}
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
              <p className="text-sm font-medium text-purple-800 mb-1">Autocompletar desde tu CV</p>
              <p className="text-xs text-purple-600 mb-3">Sube tu CV y detectamos tu nombre, teléfono y ciudad automáticamente.</p>
              <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => detectarDesdeCv(e.target.files[0])} />
              <button onClick={() => cvInputRef.current.click()} disabled={detectando}
                className="text-xs font-medium border border-purple-300 text-purple-700 rounded-lg px-4 py-2 hover:bg-purple-100 transition-colors disabled:opacity-50">
                {detectando ? 'Detectando...' : '📄 Subir CV para autocompletar (opcional)'}
              </button>
            </div>

            {/* País y Ciudad — primero */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Ubicación</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">País *</label>
                  <select value={s1.pais} onChange={handlePaisChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Selecciona</option>
                    {PAISES_LATAM.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ciudad de residencia</label>
                  <input type="text" value={s1.ciudad}
                    onChange={e => setS1(f => ({ ...f, ciudad: e.target.value }))}
                    placeholder=""
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Ciudades de búsqueda <span className="text-gray-400">(hasta 5)</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="text" value={ciudadInput}
                      onChange={e => setCiudadInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarCiudad())}
                      placeholder="Seleccionar ciudad"
                      disabled={s1.ciudades_busqueda.length >= 5}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50" />
                    <button onClick={agregarCiudad}
                      disabled={!ciudadInput.trim() || s1.ciudades_busqueda.length >= 5}
                      className="border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm hover:border-primary hover:text-primary disabled:opacity-40 transition-colors">
                      +
                    </button>
                  </div>
                  {s1.ciudades_busqueda.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s1.ciudades_busqueda.map(c => (
                        <span key={c} className="flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1">
                          {c}
                          <button onClick={() => quitarCiudad(c)} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nombres y apellidos */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Nombre completo</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key:'nombre1',   label:'Nombre 1 *',  locked: bloqueado },
                  { key:'nombre2',   label:'Nombre 2' },
                  { key:'apellido1', label:'Apellido 1 *', locked: bloqueado },
                  { key:'apellido2', label:'Apellido 2' },
                ].map(({ key, label, locked }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input type="text" value={s1[key]}
                      onChange={e => setS1(f => ({ ...f, [key]: e.target.value }))}
                      disabled={locked}
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary
                        ${locked ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : 'border-gray-300'}`} />
                    {locked && <p className="text-xs text-gray-400 mt-0.5">🔒 No modificable</p>}
                  </div>
                ))}
              </div>
              {bloqueado && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Nombre y apellido principal no se pueden modificar — son la llave de validación de tu CV.
                </p>
              )}
            </div>

            {/* Teléfonos con indicativo */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Teléfonos</h3>
              <div className="grid grid-cols-2 gap-3">
                <TelefonoInput indicativoKey="indicativo1" telefonoKey="telefono1" label="Teléfono 1" required />
                <TelefonoInput indicativoKey="indicativo2" telefonoKey="telefono2" label="Teléfono 2" />
              </div>
            </div>

            {/* Emails */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Correos electrónicos</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email principal</label>
                  <input type="email" value={user?.email || ''} disabled
                    className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email secundario</label>
                  <input type="email" value={s1.email_secundario}
                    onChange={e => setS1(f => ({ ...f, email_secundario: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>

            {/* Edad */}
            <div className="w-40">
              <label className="block text-xs text-gray-500 mb-1">Edad</label>
              <input type="number" value={s1.edad}
                onChange={e => setS1(f => ({ ...f, edad: e.target.value }))}
                min="16" max="80"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => guardar(true)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Omitir por ahora
              </button>
              <button onClick={siguiente}
                className="flex-1 bg-primary text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO 1 — Sección 2: Compensación ──────────────────────────── */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Compensación</h2>
              <p className="text-sm text-gray-500">Ayuda a filtrar vacantes por rango salarial.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Salario bruto mensual</label>
              <div className="flex gap-2">
                <select value={s2.moneda} onChange={e => setS2(f => ({ ...f, moneda: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-2 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary shrink-0">
                  {MONEDAS.map(m => <option key={m.code} value={m.code}>{m.code}</option>)}
                </select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">
                    {MONEDAS.find(m => m.code === s2.moneda)?.symbol || '$'}
                  </span>
                  <input type="text" value={s2.salario_monto}
                    onChange={e => setS2(f => ({ ...f, salario_monto: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              {s1.pais && <p className="text-xs text-gray-400 mt-1">Moneda detectada para {s1.pais}: {s2.moneda}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Prestaciones{s1.pais ? ` (${s1.pais})` : ''}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {getPrestaciones(s1.pais).map(p => (
                  <label key={p} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs
                    ${s2.prestaciones.includes(p) ? 'bg-primary/5 border-primary/30 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={s2.prestaciones.includes(p)} onChange={() => togglePrestacion(p)}
                      className="accent-primary shrink-0" />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={anterior}
                className="border border-gray-300 text-gray-600 font-medium py-3 px-5 rounded-xl hover:border-gray-400 transition-colors">
                ← Atrás
              </button>
              <button onClick={siguiente}
                className="flex-1 bg-primary text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO 2 — Sección 3: Aspiraciones ──────────────────────────── */}
        {paso === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Aspiraciones y motivaciones</h2>
              <p className="text-sm text-gray-500">Personaliza las vacantes y el análisis de tu CV.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Nivel de cargo buscado</label>
              <div className="flex flex-wrap gap-2">
                {NIVELES_CARGO.map(n => (
                  <button key={n} onClick={() => setS3(f => ({ ...f, nivel_cargo: n }))}
                    className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                      ${s3.nivel_cargo === n ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Área funcional</label>
              <div className="flex flex-wrap gap-2">
                {AREAS.map(a => (
                  <button key={a} onClick={() => setS3(f => ({ ...f, area: a }))}
                    className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                      ${s3.area === a ? 'bg-teal text-white border-teal' : 'border-gray-300 text-gray-600 hover:border-teal hover:text-teal'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Tipo de trabajo</label>
              <div className="flex gap-2">
                {TIPOS_TRABAJO.map(t => (
                  <button key={t} onClick={() => setS3(f => ({ ...f, tipo_trabajo: t }))}
                    className={`flex-1 text-xs font-medium py-2.5 rounded-xl border transition-colors
                      ${s3.tipo_trabajo === t ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Industrias de interés <span className="text-gray-400">(múltiple)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
                {INDUSTRIAS_LATAM.map(ind => (
                  <button key={ind} onClick={() => toggleIndustria(ind)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                      ${s3.industrias_deseadas.includes(ind)
                        ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {['2 análisis de CV gratuitos incluidos','Búsqueda de vacantes con IA','Seguimiento de aplicaciones'].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  {b}
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button onClick={anterior}
                className="border border-gray-300 text-gray-600 font-medium py-3 px-5 rounded-xl hover:border-gray-400 transition-colors">
                ← Atrás
              </button>
              <button onClick={() => guardar(false)} disabled={saving}
                className="flex-1 bg-primary text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : '¡Empezar!'}
              </button>
            </div>
            <button onClick={() => guardar(true)} disabled={saving}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Omitir y completar después →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          Puedes editar toda esta información en <strong>Mi Perfil</strong>.
        </p>
      </div>
    </div>
  )
}
