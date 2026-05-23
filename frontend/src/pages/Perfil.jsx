import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import HelpBadge from '../components/common/HelpBadge'

// ─── Catálogos (mismo que Onboarding) ────────────────────────────────────────

const PAISES_LATAM = [
  'México','Colombia','Argentina','Chile','Perú','Venezuela','Ecuador','Bolivia',
  'Uruguay','Paraguay','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua',
  'Panamá','República Dominicana','Cuba','España','Estados Unidos','Canadá','Brasil','Otro',
]

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
const IDIOMAS = ['Español','Inglés','Francés','Portugués','Alemán','Italiano','Chino Mandarín','Japonés','Árabe','Coreano','Ruso','Otro']
const NIVELES_CEFR = ['Nativo','C2','C1','B2','B1','A2','A1']
const NIVELES_EDUCACION = ['Preparatoria / Bachillerato','Técnico / Tecnólogo','Universidad / Licenciatura','Especialización','Maestría','Doctorado','Certificación Profesional']
const EXPERIENCIAS = [
  { value: 0, label: 'Sin experiencia' },{ value: 1, label: '1-2 años' },
  { value: 3, label: '3-5 años' },{ value: 6, label: '6-10 años' },{ value: 11, label: 'Más de 10 años' },
]

const PRESTACIONES_POR_PAIS = {
  'México': ['IMSS','INFONAVIT','AFORE','Aguinaldo (30 días)','Prima vacacional','Seguro de gastos médicos','Seguro de vida','Vales de despensa','Fondo de ahorro','Auto de empresa','Caja de ahorro','Car allowance','House allowance','Viáticos'],
  'Colombia': ['EPS (salud)','Pensión','ARL','Prima de servicios','Cesantías','Vacaciones adicionales','Dotación','Caja de compensación','Seguro de vida'],
  'Argentina': ['Obra social','ART','SAC (aguinaldo)','Jubilación','Vacaciones legales','Plan médico privado','Seguro de vida'],
  'Chile': ['AFP','Isapre / Fonasa','Seguro de cesantía','Gratificación legal','Seguro de accidentes'],
  'Perú': ['EsSalud','AFP / ONP','Gratificación','CTS','Seguro de vida ley','Vacaciones'],
  'Venezuela': ['IVSS','Bono de alimentación','Utilidades','Cesta ticket','Seguro médico'],
  'Ecuador': ['IESS','Décimo tercer sueldo','Décimo cuarto sueldo','Fondos de reserva','Vacaciones'],
  'default': ['Seguro médico','Seguro de vida','Bono anual de desempeño','Plan de pensión','Vehículo / viáticos','Vacaciones adicionales','Flexibilidad horaria','Home office','Capacitación y desarrollo'],
}
const getPrestaciones = (pais) => PRESTACIONES_POR_PAIS[pais] || PRESTACIONES_POR_PAIS['default']

const MEXICO_DETALLE = {
  'Aguinaldo (30 días)':     { tipo: 'dias',     label: 'Días',          default: '30'      },
  'Prima vacacional':        { tipo: 'pct',      label: '% prima',       default: '25'      },
  'Seguro de gastos médicos':{ tipo: 'selector', label: 'Cobertura',     opciones: ['Personal','Familiar'], default: 'Personal' },
  'Vales de despensa':       { tipo: 'monto',    label: 'Monto mensual', default: ''        },
  'Fondo de ahorro':         { tipo: 'pct',      label: '% fondo',       default: ''        },
  'Auto de empresa':         { tipo: 'monto',    label: 'Valor / mes',   default: ''        },
  'Car allowance':           { tipo: 'monto',    label: 'Monto mensual', default: ''        },
  'House allowance':         { tipo: 'monto',    label: 'Monto mensual', default: ''        },
  'Viáticos':                { tipo: 'monto',    label: 'Monto mensual', default: ''        },
}

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

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Perfil() {
  const { user, loading: authLoading, perfil, refreshPerfil, creditosRestantes, LIMITE_PLAN, usageCount, plan, isPaidPlan } = useAuth()
  const navigate = useNavigate()

  const bloqueado = !!(perfil?.nombre1 && perfil?.apellido1)

  const [saving, setSaving]     = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [copiado, setCopiado]   = useState(false)
  const [ciudadInput, setCiudadInput] = useState('')
  const [tab, setTab]           = useState('personal')

  const [form, setForm] = useState({
    // Sección 1
    nombre1: '', nombre2: '', apellido1: '', apellido2: '',
    indicativo1: '+52', telefono1: '', indicativo2: '+52', telefono2: '', email_secundario: '',
    pais: '', ciudad: '', ciudades_busqueda: [], edad: '',
    // Sección 2
    salario_monto: '', moneda: 'MXN', prestaciones: [],
    prestaciones_detalle: {},
    bono_activo: false, bono_tipo: '', bono_frecuencia: '',
    bono_monto: '', bono_pct: '', variable_monto: '',
    prestaciones_otros: '',
    // Sección 3
    nivel_cargo: '', industrias_deseadas: [], tipo_trabajo: '', area: '',
    areas: [],
    idiomas: [], educacion: [],
    // Campos legacy
    cargo_actual: '', cargo_objetivo: '', experiencia_anos: '',
    industria_actual: '',
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
  }, [user, authLoading])

  useEffect(() => {
    if (!perfil) return
    const [monto, monedaSaved] = (perfil.salario_esperado || '').split(' ')
    setForm({
      nombre1:            perfil.nombre1 || '',
      nombre2:            perfil.nombre2 || '',
      apellido1:          perfil.apellido1 || '',
      apellido2:          perfil.apellido2 || '',
      indicativo1:        perfil.indicativo1 || '+52',
      telefono1:          perfil.telefono1 || '',
      indicativo2:        perfil.indicativo2 || '+52',
      telefono2:          perfil.telefono2 || '',
      email_secundario:   perfil.email_secundario || '',
      pais:               perfil.pais || '',
      ciudad:             perfil.ciudad || '',
      ciudades_busqueda:  perfil.ciudades_busqueda || [],
      edad:               perfil.edad || '',
      salario_monto:      monto || '',
      moneda:             monedaSaved || detectarMoneda(perfil.pais),
      prestaciones:       perfil.prestaciones || [],
      prestaciones_detalle: perfil.prestaciones_detalle
        ? { ...perfil.prestaciones_detalle, __bono: undefined, __otros: undefined }
        : {},
      prestaciones_otros:  perfil.prestaciones_detalle?.__otros || '',
      bono_activo:     !!(perfil.prestaciones_detalle?.__bono),
      bono_tipo:       perfil.prestaciones_detalle?.__bono?.tipo || '',
      bono_frecuencia: perfil.prestaciones_detalle?.__bono?.frecuencia || '',
      bono_monto:      perfil.prestaciones_detalle?.__bono?.tipo === 'Bono' ? (perfil.prestaciones_detalle?.__bono?.monto || '') : '',
      bono_pct:        perfil.prestaciones_detalle?.__bono?.pct || '',
      variable_monto:  perfil.prestaciones_detalle?.__bono?.tipo === 'Variable mensual' ? (perfil.prestaciones_detalle?.__bono?.monto || '') : '',
      nivel_cargo:        perfil.nivel_cargo || '',
      industrias_deseadas: perfil.industrias_deseadas || [],
      tipo_trabajo:       perfil.tipo_trabajo || '',
      area:               perfil.area || '',
      areas:              perfil.area ? perfil.area.split(', ').filter(Boolean) : [],
      idiomas:            Array.isArray(perfil.idiomas)   ? perfil.idiomas   : [],
      educacion:          Array.isArray(perfil.educacion) ? perfil.educacion : [],
      cargo_actual:       perfil.cargo_actual || '',
      cargo_objetivo:     perfil.cargo_objetivo || '',
      experiencia_anos:   perfil.experiencia_anos ?? '',
      industria_actual:   perfil.industria_actual || '',
    })
  }, [perfil])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handlePaisChange = (e) => {
    const pais = e.target.value
    const ind  = indicativoPorPais(pais)
    setForm(f => ({ ...f, pais, moneda: detectarMoneda(pais), indicativo1: ind, indicativo2: ind }))
  }

  const agregarCiudad = () => {
    const val = ciudadInput.trim()
    if (!val || form.ciudades_busqueda.length >= 5 || form.ciudades_busqueda.includes(val)) { setCiudadInput(''); return }
    setForm(f => ({ ...f, ciudades_busqueda: [...f.ciudades_busqueda, val] }))
    setCiudadInput('')
  }
  const quitarCiudad = (c) => setForm(f => ({ ...f, ciudades_busqueda: f.ciudades_busqueda.filter(x => x !== c) }))

  const toggleIndustria = (ind) => setForm(f => ({
    ...f,
    industrias_deseadas: f.industrias_deseadas.includes(ind)
      ? f.industrias_deseadas.filter(x => x !== ind)
      : [...f.industrias_deseadas, ind],
  }))

  const toggleArea = (a) => setForm(f => ({
    ...f,
    areas: f.areas.includes(a) ? f.areas.filter(x => x !== a) : [...f.areas, a],
  }))

  const toggleIdioma = (idioma) => setForm(f => {
    const existe = f.idiomas.find(i => i.idioma === idioma)
    if (existe) return { ...f, idiomas: f.idiomas.filter(i => i.idioma !== idioma) }
    return { ...f, idiomas: [...f.idiomas, { idioma, nivel: 'B2' }] }
  })

  const updateNivelIdioma = (idioma, nivel) => setForm(f => ({
    ...f,
    idiomas: f.idiomas.map(i => i.idioma === idioma ? { ...i, nivel } : i),
  }))

  const agregarEducacion = () => setForm(f => ({
    ...f,
    educacion: [...f.educacion, { nivel: '', titulo: '', institucion: '', anio: '' }],
  }))

  const quitarEducacion = (idx) => setForm(f => ({
    ...f,
    educacion: f.educacion.filter((_, i) => i !== idx),
  }))

  const updateEducacion = (idx, field, value) => setForm(f => ({
    ...f,
    educacion: f.educacion.map((e, i) => i === idx ? { ...e, [field]: value } : e),
  }))

  const togglePrestacion = (p) => setForm(f => {
    const isChecked = f.prestaciones.includes(p)
    const nuevas = isChecked ? f.prestaciones.filter(x => x !== p) : [...f.prestaciones, p]
    const detalle = { ...f.prestaciones_detalle }
    if (isChecked) delete detalle[p]
    else if (MEXICO_DETALLE[p]) detalle[p] = MEXICO_DETALLE[p].default
    return { ...f, prestaciones: nuevas, prestaciones_detalle: detalle }
  })

  const updateDetalle = (prestacion, valor) => setForm(f => ({
    ...f,
    prestaciones_detalle: { ...f.prestaciones_detalle, [prestacion]: valor },
  }))

  const guardar = async () => {
    setSaving(true)
    setGuardado(false)
    const nombreCompleto = [form.nombre1, form.nombre2, form.apellido1, form.apellido2]
      .map(s => s?.trim()).filter(Boolean).join(' ')
    const salario_esperado = form.salario_monto ? `${form.salario_monto} ${form.moneda}` : ''
    const prestaciones_detalle = {
      ...form.prestaciones_detalle,
      ...(form.bono_activo && form.bono_tipo ? {
        __bono: {
          tipo: form.bono_tipo,
          frecuencia: form.bono_tipo === 'Bono' ? form.bono_frecuencia : null,
          monto: form.bono_tipo === 'Bono' ? form.bono_monto : form.variable_monto,
          pct: form.bono_tipo === 'Bono' ? form.bono_pct : null,
        },
      } : {}),
      ...(form.prestaciones_otros?.trim() ? { __otros: form.prestaciones_otros.trim() } : {}),
    }
    const { salario_monto, moneda, bono_activo, bono_tipo, bono_frecuencia, bono_monto, bono_pct, variable_monto, areas, prestaciones_otros, ...rest } = form
    const { error } = await supabase.from('profiles').update({
      ...rest,
      area: form.areas.join(', '),
      idiomas: form.idiomas,
      educacion: form.educacion,
      salario_esperado, prestaciones_detalle, nombre: nombreCompleto,
      indicativo1: form.indicativo1, indicativo2: form.indicativo2,
    }).eq('id', user.id)
    setSaving(false)
    if (!error) { setGuardado(true); refreshPerfil(); setTimeout(() => setGuardado(false), 3000) }
  }

  const copiarCodigo = () => {
    if (!perfil?.referral_code) return
    navigator.clipboard.writeText(perfil.referral_code)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }
  const compartirLink = () => {
    const link = `${window.location.origin}/auth?ref=${perfil?.referral_code}`
    navigator.clipboard.writeText(link)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  if (authLoading) return null

  const TABS = [
    { id: 'personal',      label: 'Datos personales' },
    { id: 'compensacion',  label: 'Compensación' },
    { id: 'aspiraciones',  label: 'Aspiraciones' },
    { id: 'plan',          label: 'Plan' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-0.5 text-gray-500 text-sm">{user?.email}</p>
      </div>

      {/* Alerta onboarding */}
      {!perfil?.nombre1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <span className="text-amber-500 text-xl shrink-0 mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Completa tu configuración inicial</p>
            <p className="text-xs text-amber-700 mt-0.5">Para acceder a todas las funciones necesitas completar el onboarding.</p>
            <Link to="/onboarding" className="text-xs font-semibold text-primary underline mt-2 inline-block">Ir al onboarding →</Link>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg whitespace-nowrap transition-colors
              ${tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Datos Personales
              <HelpBadge id="perfil.personal" />
            </h2>
          </div>

          {/* Nombre y apellidos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Nombre completo</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key:'nombre1',   label:'Nombre 1 *',   placeholder:'Ana',       locked: bloqueado },
                { key:'nombre2',   label:'Nombre 2',     placeholder:'María' },
                { key:'apellido1', label:'Apellido 1 *', placeholder:'González',  locked: bloqueado },
                { key:'apellido2', label:'Apellido 2',   placeholder:'Martínez' },
              ].map(({ key, label, placeholder, locked }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type="text" value={form[key]} onChange={set(key)} disabled={locked} placeholder={placeholder}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${locked ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : 'border-gray-300'}`} />
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

          {/* Teléfonos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Teléfonos</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { indKey:'indicativo1', telKey:'telefono1', label:'Teléfono 1' },
                { indKey:'indicativo2', telKey:'telefono2', label:'Teléfono 2' },
              ].map(({ indKey, telKey, label }) => (
                <div key={telKey}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <div className="flex gap-1.5">
                    <select value={form[indKey]} onChange={e => setForm(f => ({ ...f, [indKey]: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-1.5 py-2.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary shrink-0 w-24">
                      {INDICATIVOS.map(i => <option key={i.code} value={i.ind}>{i.code} {i.ind}</option>)}
                    </select>
                    <input type="tel" value={form[telKey]} onChange={set(telKey)} placeholder="55 1234 5678"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              ))}
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
                <input type="email" value={form.email_secundario} onChange={set('email_secundario')} placeholder="otro@email.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ubicación</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">País</label>
                <select value={form.pais} onChange={handlePaisChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona</option>
                  {PAISES_LATAM.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
                <input type="text" value={form.ciudad} onChange={set('ciudad')} placeholder="Ciudad de México"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Edad</label>
                <input type="number" value={form.edad} onChange={set('edad')} placeholder="35" min="16" max="80"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1.5">Ciudades de búsqueda <span className="text-gray-400">(hasta 5)</span></label>
              <div className="flex gap-2">
                <input type="text" value={ciudadInput} onChange={e => setCiudadInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarCiudad())}
                  placeholder="Guadalajara, Monterrey..."
                  disabled={form.ciudades_busqueda.length >= 5}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50" />
                <button onClick={agregarCiudad} disabled={!ciudadInput.trim() || form.ciudades_busqueda.length >= 5}
                  className="border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm hover:border-primary hover:text-primary disabled:opacity-40 transition-colors">+</button>
              </div>
              {form.ciudades_busqueda.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.ciudades_busqueda.map(c => (
                    <span key={c} className="flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1">
                      {c}<button onClick={() => quitarCiudad(c)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'compensacion' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Compensación Deseada
              <HelpBadge id="perfil.compensacion" />
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Salario bruto mensual</label>
            <div className="flex gap-2">
              <select value={form.moneda} onChange={set('moneda')}
                className="border border-gray-300 rounded-lg px-2 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary shrink-0">
                {MONEDAS.map(m => <option key={m.code} value={m.code}>{m.code}</option>)}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">
                  {MONEDAS.find(m => m.code === form.moneda)?.symbol || '$'}
                </span>
                <input type="text" value={form.salario_monto} onChange={set('salario_monto')} placeholder="50,000"
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            {form.pais && <p className="text-xs text-gray-400 mt-1">Moneda para {form.pais}: {form.moneda}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Prestaciones{form.pais ? ` — ${form.pais}` : ''}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {getPrestaciones(form.pais).map(p => {
                const detailCfg = form.pais === 'México' ? MEXICO_DETALLE[p] : null
                const isChecked = form.prestaciones.includes(p)
                return (
                  <div key={p}>
                    <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs
                      ${isChecked ? 'bg-primary/5 border-primary/30 text-primary font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => togglePrestacion(p)} className="accent-primary shrink-0" />
                      {p}
                    </label>
                    {isChecked && detailCfg && (
                      <div className="mt-1 px-1">
                        {detailCfg.tipo === 'selector' ? (
                          <select value={form.prestaciones_detalle[p] ?? detailCfg.default} onChange={e => updateDetalle(p, e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none">
                            {detailCfg.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type={detailCfg.tipo === 'pct' || detailCfg.tipo === 'dias' ? 'number' : 'text'}
                              value={form.prestaciones_detalle[p] ?? detailCfg.default}
                              onChange={e => updateDetalle(p, e.target.value)}
                              placeholder={detailCfg.label}
                              className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none"
                            />
                            {detailCfg.tipo === 'pct'  && <span className="text-xs text-gray-400 shrink-0">%</span>}
                            {detailCfg.tipo === 'dias' && <span className="text-xs text-gray-400 shrink-0">días</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Variable o Bono */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-xs font-semibold text-gray-500">Variable o Bono</label>
              <button
                onClick={() => setForm(f => ({ ...f, bono_activo: !f.bono_activo, bono_tipo: '', bono_frecuencia: '', bono_monto: '', bono_pct: '', variable_monto: '' }))}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                  ${form.bono_activo ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                {form.bono_activo ? '✓ Aplica' : '+ Agregar'}
              </button>
            </div>
            {form.bono_activo && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex gap-2">
                  {['Bono', 'Variable mensual'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, bono_tipo: t }))}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors
                        ${form.bono_tipo === t ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {form.bono_tipo === 'Bono' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Frecuencia</label>
                      <select value={form.bono_frecuencia} onChange={e => setForm(f => ({ ...f, bono_frecuencia: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Selecciona</option>
                        {['Mensual','Trimestral','Semestral','Anual'].map(frq => <option key={frq} value={frq}>{frq}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Monto ({form.moneda})</label>
                      <input type="text" value={form.bono_monto} onChange={e => setForm(f => ({ ...f, bono_monto: e.target.value }))} placeholder="50,000"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">%</label>
                      <input type="number" value={form.bono_pct} onChange={e => setForm(f => ({ ...f, bono_pct: e.target.value }))} placeholder="10" min="0" max="200"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                )}
                {form.bono_tipo === 'Variable mensual' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Monto mensual ({form.moneda})</label>
                    <input type="text" value={form.variable_monto} onChange={e => setForm(f => ({ ...f, variable_monto: e.target.value }))} placeholder="10,000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Otras prestaciones — texto libre */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Otras prestaciones o beneficios
              <span className="ml-1 font-normal text-gray-400">(texto libre)</span>
            </label>
            <textarea
              value={form.prestaciones_otros}
              onChange={set('prestaciones_otros')}
              rows={3}
              placeholder="Ej. seguro dental, días adicionales de vacaciones, acciones de la empresa..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      )}

      {tab === 'aspiraciones' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Aspiraciones Profesionales
              <HelpBadge id="perfil.aspiraciones" />
            </h2>
          </div>

          {/* Cargo actual / objetivo / experiencia */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Perfil profesional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cargo actual</label>
                <input type="text" value={form.cargo_actual} onChange={set('cargo_actual')} placeholder="Gerente de RH"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cargo objetivo</label>
                <input type="text" value={form.cargo_objetivo} onChange={set('cargo_objetivo')} placeholder="Director de RH"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Años de experiencia</label>
                <select value={form.experiencia_anos} onChange={set('experiencia_anos')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona</option>
                  {EXPERIENCIAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Industria actual</label>
                <select value={form.industria_actual} onChange={set('industria_actual')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona tu industria</option>
                  {INDUSTRIAS_LATAM.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Nivel de cargo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Nivel de cargo buscado</label>
            <div className="flex flex-wrap gap-2">
              {NIVELES_CARGO.map(n => (
                <button key={n} onClick={() => setForm(f=>({...f,nivel_cargo:n}))}
                  className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                    ${form.nivel_cargo === n ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Área funcional — multi-select */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Área funcional <span className="text-gray-400 font-normal">(múltiple)</span></label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(a => (
                <button key={a} onClick={() => toggleArea(a)}
                  className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                    ${form.areas.includes(a) ? 'bg-secondary text-on-secondary border-secondary' : 'border-gray-300 text-gray-600 hover:border-secondary hover:text-secondary'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de trabajo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Tipo de trabajo</label>
            <div className="flex gap-2">
              {TIPOS_TRABAJO.map(t => (
                <button key={t} onClick={() => setForm(f=>({...f,tipo_trabajo:t}))}
                  className={`flex-1 text-xs font-medium py-2.5 rounded-xl border transition-colors
                    ${form.tipo_trabajo === t ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Industrias */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Industrias de interés <span className="text-gray-400 font-normal">(múltiple)</span></label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {INDUSTRIAS_LATAM.map(ind => (
                <button key={ind} onClick={() => toggleIndustria(ind)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                    ${form.industrias_deseadas.includes(ind)
                      ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Idiomas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Idiomas <span className="text-gray-400 font-normal">(selecciona y asigna nivel CEFR)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {IDIOMAS.map(idioma => {
                const sel = form.idiomas.find(i => i.idioma === idioma)
                return (
                  <button key={idioma} onClick={() => toggleIdioma(idioma)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                      ${sel
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-500 hover:border-primary hover:text-primary'}`}>
                    {idioma}
                  </button>
                )
              })}
            </div>
            {form.idiomas.length > 0 && (
              <div className="space-y-2">
                {form.idiomas.map(({ idioma, nivel }) => (
                  <div key={idioma} className="flex items-center gap-3 p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="text-xs font-medium text-gray-800 flex-1">{idioma}</span>
                    <select value={nivel} onChange={e => updateNivelIdioma(idioma, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                      {NIVELES_CEFR.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button onClick={() => toggleIdioma(idioma)} className="text-gray-400 hover:text-red-500 text-base leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Educación */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">Educación</label>
              <button onClick={agregarEducacion}
                className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors">
                + Agregar
              </button>
            </div>
            {form.educacion.length === 0 && (
              <p className="text-xs text-gray-400 py-1">Agrega tu formación académica (opcional)</p>
            )}
            <div className="space-y-3">
              {form.educacion.map((edu, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">Educación {idx + 1}</span>
                    <button onClick={() => quitarEducacion(idx)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">✕ Eliminar</button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nivel académico</label>
                    <select value={edu.nivel} onChange={e => updateEducacion(idx, 'nivel', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Selecciona</option>
                      {NIVELES_EDUCACION.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Título / Programa</label>
                    <input type="text" value={edu.titulo} onChange={e => updateEducacion(idx, 'titulo', e.target.value)}
                      placeholder="Ej. Ingeniería Industrial"
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Institución</label>
                      <input type="text" value={edu.institucion} onChange={e => updateEducacion(idx, 'institucion', e.target.value)}
                        placeholder="Ej. UNAM"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Año de graduación</label>
                      <input type="text" value={edu.anio} onChange={e => updateEducacion(idx, 'anio', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="2020" maxLength={4}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Plan ── */}
      {tab === 'plan' && (
        <div className="space-y-5">
          {/* Plan y créditos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                Mi Plan y Créditos
                <HelpBadge id="perfil.plan" />
              </h2>
            </div>
            {(() => {
              const PLAN_LABELS = { free:'Gratuito', mensual:'Pro Mensual', trimestral:'Pro 3 Meses', semanal:'Pro Semanal' }
              const planLabel   = PLAN_LABELS[plan] || (plan ? String(plan) : 'Gratuito')
              const expiresAt   = perfil?.plan_expires_at ? new Date(perfil.plan_expires_at) : null
              const diasRest    = expiresAt ? Math.max(0, Math.ceil((expiresAt - new Date()) / (1000*60*60*24))) : null
              const creditosDisp = isPaidPlan ? '∞' : Math.max(0, creditosRestantes)
              const barPct       = isPaidPlan ? 100 : Math.round((Math.max(0,creditosRestantes) / LIMITE_PLAN) * 100)
              return (
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-2xl font-black ${isPaidPlan ? 'text-primary' : 'text-gray-900'}`}>{planLabel}</span>
                      {isPaidPlan && <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">Activo</span>}
                    </div>
                    {expiresAt && (
                      <p className={`text-sm font-medium mb-3 ${diasRest <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
                        📅 Vigente hasta: <strong>{expiresAt.toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })}</strong>
                        {diasRest !== null && <span className="ml-2 text-xs text-gray-400">({diasRest} días restantes)</span>}
                      </p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">{creditosDisp}</span>
                      <span className="text-gray-400">/ {isPaidPlan ? '∞' : LIMITE_PLAN} créditos disponibles</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{usageCount} utilizados</p>
                    <div className="w-48 bg-gray-100 rounded-full h-1.5 mt-2">
                      <div className={`h-1.5 rounded-full ${!isPaidPlan && creditosRestantes === 0 ? 'bg-red-400' : !isPaidPlan && creditosRestantes === 1 ? 'bg-amber-400' : 'bg-green-500'}`}
                        style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 shrink-0">
                    <button className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                      {isPaidPlan ? 'Ver todos los planes →' : 'Mejorar plan — Próximamente'}
                    </button>
                    {!isPaidPlan && <p className="text-xs text-gray-400">Planes desde $9 USD/mes</p>}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Referidos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Programa de referidos</h2>
            <p className="text-sm text-gray-500 mb-4">Comparte tu código y gana <strong>2 créditos</strong> por cada persona que se registre.</p>
            {perfil?.referral_code ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
                  <span className="text-xs text-gray-400 font-medium">Tu código:</span>
                  <span className="font-mono font-bold text-gray-900 tracking-widest text-sm">{perfil.referral_code.toUpperCase()}</span>
                </div>
                <button onClick={copiarCodigo} className="text-sm font-medium border border-gray-300 rounded-xl px-4 py-2.5 hover:border-primary hover:text-primary transition-colors">
                  {copiado ? '✓ Copiado' : 'Copiar código'}
                </button>
                <button onClick={compartirLink} className="text-sm font-medium bg-primary text-white rounded-xl px-4 py-2.5 hover:bg-blue-700 transition-colors">
                  Compartir link
                </button>
              </div>
            ) : <div className="text-sm text-gray-400">Cargando código...</div>}
            {perfil?.bonus_credits > 0 && (
              <p className="mt-3 text-sm text-green-600 font-medium">🎉 Has ganado {perfil.bonus_credits} créditos por referidos</p>
            )}
          </div>
        </div>
      )}

      {/* Botón guardar (no en tab Plan) */}
      {tab !== 'plan' && (
        <div className="flex items-center gap-3 mt-5 pb-8">
          <button onClick={guardar} disabled={saving}
            className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {guardado && <span className="text-sm text-green-600">✓ Guardado correctamente</span>}
        </div>
      )}
    </div>
  )
}
