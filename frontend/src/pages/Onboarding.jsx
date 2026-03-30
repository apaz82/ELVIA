// Onboarding — se muestra una sola vez después del primer registro
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { api } from '../services/api'
import { Warning, Lightbulb, Clock, CheckCircle } from '@phosphor-icons/react'

// ─── Catálogos ───────────────────────────────────────────────────────────────

const PAISES_LATAM = [
  'México','Colombia','Argentina','Chile','Perú','Venezuela','Ecuador','Bolivia',
  'Uruguay','Paraguay','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua',
  'Panamá','República Dominicana','Cuba','España','Estados Unidos','Canadá','Brasil','Otro',
]

const CIUDADES_SUGERIDAS = [
  ...PAISES_LATAM,
  'Remoto', 'Híbrido',
  'Ciudad de México', 'Monterrey', 'Guadalajara', 'Bogotá', 'Medellín', 'Cali', 
  'Buenos Aires', 'Córdoba', 'Rosario', 'Santiago', 'Lima', 'Caracas', 'Quito', 
  'Guayaquil', 'La Paz', 'Santa Cruz', 'Montevideo', 'Asunción', 'San José', 
  'Ciudad de Panamá', 'Madrid', 'Barcelona', 'Miami', 'Nueva York', 'Los Ángeles', 'Houston'
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

const IDIOMAS = ['Español','Inglés','Francés','Portugués','Alemán','Italiano','Chino Mandarín','Japonés','Árabe','Coreano','Ruso','Otro']
const NIVELES_CEFR = ['Nativo','C2','C1','B2','B1','A2','A1']
const NIVELES_EDUCACION = ['Preparatoria / Bachillerato','Técnico / Tecnólogo','Universidad / Licenciatura','Especialización','Maestría','Doctorado','Certificación Profesional']

const PRESTACIONES_POR_PAIS = {
  'México': ['IMSS','INFONAVIT','AFORE','Aguinaldo','Prima vacacional','Seguro de gastos médicos','Seguro de vida','Vales de despensa','Fondo de ahorro','Auto de empresa','Caja de ahorro','Car allowance','House allowance','Viáticos'],
  'Colombia': ['EPS (salud)','Pensión','ARL','Prima de servicios','Cesantías','Vacaciones adicionales','Dotación','Caja de compensación','Seguro de vida'],
  'Argentina': ['Obra social','ART','SAC (aguinaldo)','Jubilación','Vacaciones legales','Plan médico privado','Seguro de vida'],
  'Chile': ['AFP','Isapre / Fonasa','Seguro de cesantía','Gratificación legal','Seguro de accidentes'],
  'Perú': ['EsSalud','AFP / ONP','Gratificación','CTS','Seguro de vida ley','Vacaciones'],
  'Venezuela': ['IVSS','Bono de alimentación','Utilidades','Cesta ticket','Seguro médico'],
  'Ecuador': ['IESS','Décimo tercer sueldo','Décimo cuarto sueldo','Fondos de reserva','Vacaciones'],
  'default': ['Seguro médico','Seguro de vida','Bono anual de desempeño','Plan de pensión','Vehículo / viáticos','Vacaciones adicionales','Flexibilidad horaria','Home office','Capacitación y desarrollo'],
}
const getPrestaciones = (pais) => PRESTACIONES_POR_PAIS[pais] || PRESTACIONES_POR_PAIS['default']

// Campos de detalle para prestaciones de México
const MEXICO_DETALLE = {
  'Aguinaldo':     { tipo: 'dias',     label: 'Días',            default: '30'      },
  'Prima vacacional':        { tipo: 'pct',      label: '% prima',         default: '25'      },
  'Seguro de gastos médicos':{ tipo: 'selector', label: 'Cobertura',       opciones: ['Personal','Familiar'], default: 'Personal' },
  'Vales de despensa':       { tipo: 'monto',    label: 'Monto mensual',   default: ''        },
  'Fondo de ahorro':         { tipo: 'pct',      label: '% fondo',         default: ''        },
  'Auto de empresa':         { tipo: 'monto',    label: 'Valor / mes',     default: ''        },
  'Car allowance':           { tipo: 'monto',    label: 'Monto mensual',   default: ''        },
  'House allowance':         { tipo: 'monto',    label: 'Monto mensual',   default: ''        },
  'Viáticos':                { tipo: 'monto',    label: 'Monto mensual',   default: ''        },
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

// Normaliza texto para búsqueda sin acentos ni mayúsculas
const normalizar = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Monedas con formato US: miles con coma, decimales con punto (MXN, USD, CAD)
const MONEDAS_US = ['MXN', 'USD', 'CAD']

// Filtra input: solo dígitos + separador decimal según moneda
const soloNumericos = (val, moneda) => {
  const decSep = MONEDAS_US.includes(moneda) ? '.' : ','
  return val.replace(new RegExp(`[^0-9${decSep === '.' ? '\\.' : ','}]`, 'g'), '')
}

// Formatea con separador de miles al hacer blur
const formatearMonto = (val, moneda) => {
  if (!val) return ''
  const isUS = MONEDAS_US.includes(moneda)
  const decSep = isUS ? '.' : ','
  const milSep = isUS ? ',' : '.'
  const parts = val.replace(new RegExp(`[^0-9${decSep === '.' ? '\\.' : ','}]`, 'g'), '').split(decSep)
  const entero = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, milSep)
  return parts.length > 1 ? `${entero}${decSep}${parts[1]}` : entero
}

// Parsea monto formateado a número para cálculos
const parseMonto = (val, moneda) => {
  if (!val) return 0
  const isUS = MONEDAS_US.includes(moneda)
  const clean = isUS
    ? val.replace(/,/g, '')
    : val.replace(/\./g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

// Separa indicativo y número local a partir de un teléfono raw
const parsearTelefono = (raw) => {
  if (!raw) return { indicativo: '', numero: '' }
  const soloDigitos = raw.replace(/\D/g, '')
  // Buscar indicativo conocido que coincida con el inicio
  const sorted = [...INDICATIVOS].filter(i => i.ind).sort((a, b) => b.ind.length - a.ind.length)
  for (const { ind } of sorted) {
    const digInd = ind.replace(/\D/g, '')
    if (soloDigitos.startsWith(digInd)) {
      return { indicativo: ind, numero: soloDigitos.slice(digInd.length) }
    }
  }
  // Si no reconoce el indicativo, devolver vacío
  return { indicativo: '', numero: '' }
}

const PASOS = ['Información personal','Compensación','Aspiraciones']

// ─── Sub-componente teléfono — DEBE estar fuera del componente principal para evitar remount ───
function TelefonoInput({ indicativoKey, telefonoKey, label, required, s1, setS1 }) {
  return (
    <div className="min-w-0">
      <label className="block text-xs text-on-surface-variant mb-1">{label}{required ? ' *' : ''}</label>
      <div className="flex gap-1.5">
        <select
          value={s1[indicativoKey]}
          onChange={e => setS1(f => ({ ...f, [indicativoKey]: e.target.value }))}
          className="border border-outline-variant rounded-lg px-1 py-2.5 text-xs bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary shrink-0 w-[88px]"
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
          className="min-w-0 flex-1 border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  )
}

// ─── Componente ──────────────────────────────────────────────────────────────

const S1_INICIAL = {
  pais: '', ciudad: '',
  nombre1: '', nombre2: '', apellido1: '', apellido2: '',
  indicativo1: '+52', telefono1: '',
  indicativo2: '+52', telefono2: '',
  email_secundario: '', ciudades_busqueda: [], edad: '',
  industria_actual: '',
}
const S2_INICIAL = {
  salario_monto: '', moneda: 'MXN', pais: '', prestaciones: [],
  prestaciones_detalle: {},
  prestaciones_otros: '',
  bono_activo: false, bono_tipo: '', bono_frecuencia: '',
  bono_esquema: '', bono_pct: '', bono_num_salarios: '', bono_monto: '', variable_monto: '',
}
const S3_INICIAL = { niveles_cargo: [], industrias_deseadas: [], tipo_trabajo: '', areas: [], idiomas: [], educacion: [] }

export default function Onboarding() {
  const { user, loading: authLoading, refreshPerfil, perfil } = useAuth()
  const navigate   = useNavigate()
  const cvInputRef = useRef(null)

  const [paso, setPaso]         = useState(0)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [cvError, setCvError]   = useState('')
  const [detectando, setDetectando] = useState(false)
  const [initialized, setInitialized] = useState(false)
  
  const [cvNombre, setCvNombre] = useState('')
  const [cvExito, setCvExito] = useState(false)

const [s1, setS1] = useState(S1_INICIAL)
  const [s2, setS2] = useState(S2_INICIAL)
  const [s3, setS3] = useState(S3_INICIAL)
  const [ciudadInput, setCiudadInput] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeCityIdx, setActiveCityIdx] = useState(-1)

  const draftKey = user?.id ? `onboarding_draft_${user.id}` : null

  // ── Restaurar borrador de localStorage ──
  useEffect(() => {
    if (!user?.id) return
    const key = `onboarding_draft_${user.id}`
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const d = JSON.parse(raw)
        if (d.s1) setS1(d.s1)
        if (d.s2) setS2(d.s2)
        if (d.s3) setS3({ ...S3_INICIAL, ...d.s3,
          areas:    Array.isArray(d.s3.areas)    ? d.s3.areas    : d.s3.area ? d.s3.area.split(', ').filter(Boolean) : [],
          idiomas:  Array.isArray(d.s3.idiomas)  ? d.s3.idiomas  : [],
          educacion:Array.isArray(d.s3.educacion)? d.s3.educacion: [],
        })
        if (typeof d.paso === 'number') setPaso(d.paso)
        setInitialized(true)
        return // No correr IP ni prefill de perfil
      } catch {}
    }
    // Sin borrador — detectar IP
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        const paisDetectado = PAIS_POR_IPCODE[d.country_code] || ''
        const indDetectado  = INDICATIVOS.find(i => i.code === d.country_code)?.ind || '+52'
        if (paisDetectado) {
          setS1(f => ({
            ...f,
            pais:        f.pais || paisDetectado,
            indicativo1: indDetectado,
            indicativo2: indDetectado,
          }))
          setS2(f => ({ ...f, pais: f.pais || paisDetectado, moneda: detectarMoneda(paisDetectado) }))
        }
      })
      .catch(() => {})
      .finally(() => setInitialized(true))
  }, [user?.id])

  // ── Pre-llenar con datos del perfil (solo si no hay borrador) ──
  useEffect(() => {
    if (!perfil || !user?.id) return
    const raw = localStorage.getItem(`onboarding_draft_${user.id}`)
    if (raw) return // el borrador tiene prioridad
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
      industria_actual:  perfil.industria_actual || '',
    }))
    setS2(prev => ({
      ...prev,
      pais:                  perfil.pais || prev.pais,
      prestaciones:          perfil.prestaciones || [],
      prestaciones_detalle:  perfil.prestaciones_detalle || {},
      salario_monto: monto || '',
      moneda:        monedaSaved || detectarMoneda(perfil.pais),
    }))
    setS3(prev => ({
      ...prev,
      niveles_cargo:       perfil.nivel_cargo ? perfil.nivel_cargo.split(', ').filter(Boolean) : [],
      industrias_deseadas: perfil.industrias_deseadas || [],
      tipo_trabajo:        perfil.tipo_trabajo || '',
      areas:               perfil.area ? perfil.area.split(', ').filter(Boolean) : [],
      idiomas:             Array.isArray(perfil.idiomas)   ? perfil.idiomas   : [],
      educacion:           Array.isArray(perfil.educacion) ? perfil.educacion : [],
    }))
  }, [perfil])

  // ── Auto-guardar borrador en localStorage ──
  useEffect(() => {
    if (!initialized || !draftKey) return
    localStorage.setItem(draftKey, JSON.stringify({ s1, s2, s3, paso }))
  }, [s1, s2, s3, paso, initialized, draftKey])

  // ── Redirigir si no hay usuario ──
  useEffect(() => {
    if (authLoading) return
    if (!user) navigate('/auth')
  }, [user, authLoading])

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Cambia país en sección 1 → actualiza indicativos + moneda + pais de prestaciones
  const handlePaisChange = (e) => {
    const pais = e.target.value
    const ind  = indicativoPorPais(pais)
    setS1(f => ({ ...f, pais, indicativo1: ind, indicativo2: ind }))
    setS2(f => ({ ...f, pais, moneda: detectarMoneda(pais), prestaciones: [] }))
  }

  // Cambia país en sección 2 (solo para prestaciones y moneda)
  const handlePaisCompensacionChange = (e) => {
    const pais = e.target.value
    setS2(f => ({ ...f, pais, moneda: detectarMoneda(pais), prestaciones: [] }))
  }

  // ── Auto-detección desde CV ──
  const detectarDesdeCv = async (file) => {
    if (!file) return
    setDetectando(true)
    setCvExito(false)
    try {
      const formData = new FormData()
      formData.append('cv', file)
      const data = await api.postForm('/api/cv/extract-profile', formData)
      console.log('Perfil extraído del CV:', data)
      const paisDetectado = data.pais || ''
      const indDetectado  = paisDetectado ? indicativoPorPais(paisDetectado) : ''
      const telParsed     = parsearTelefono(data.telefono1)
      setS1(prev => ({
        ...prev,
        nombre1:    data.nombre1   || prev.nombre1,
        nombre2:    data.nombre2   || prev.nombre2,
        apellido1:  data.apellido1 || prev.apellido1,
        apellido2:  data.apellido2 || prev.apellido2,
        ciudad:     data.ciudad    || prev.ciudad,
        edad:       data.edad      || prev.edad,
        pais:       paisDetectado  || prev.pais,
        // Solo aplicar teléfono si se reconoció el indicativo
        ...(telParsed.numero ? {
          indicativo1: telParsed.indicativo,
          telefono1:   telParsed.numero,
        } : indDetectado ? {
          indicativo1: indDetectado,
        } : {}),
        indicativo2: indDetectado || prev.indicativo2,
      }))
      if (paisDetectado) {
        setS2(prev => ({ ...prev, pais: paisDetectado, moneda: detectarMoneda(paisDetectado) }))
      }
      if (data.idiomas?.length || data.educacion?.length) {
        setS3(prev => ({
          ...prev,
          idiomas:  data.idiomas?.length  ? data.idiomas  : prev.idiomas,
          educacion:data.educacion?.length ? data.educacion: prev.educacion,
        }))
      }
      setCvNombre(file.name)
      setCvExito(true)

      // Guardar CV en Supabase Storage para uso posterior
      if (user?.id) {
        const ext  = file.name.split('.').pop()
        const path = `${user.id}/cv_original.${ext}`
        const { error: upErr } = await supabase.storage
          .from('cvs')
          .upload(path, file, { upsert: true })
        if (upErr) {
          console.error('Error al subir CV al storage:', upErr.message)
        } else {
          const { error: updErr } = await supabase.from('profiles')
            .update({ cv_path: path, cv_filename: file.name })
            .eq('id', user.id)
          if (updErr) {
            console.error('Error al guardar cv_path en perfil:', updErr.message)
          } else {
            refreshPerfil(user.id)
          }
        }
      }
    } catch (err) {
      console.error('Error al extraer perfil del CV:', err)
      setCvError(err?.message || 'No se pudo leer el CV automáticamente.')
    }
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

  const toggleNivelCargo = (n) => setS3(f => ({
    ...f,
    niveles_cargo: f.niveles_cargo.includes(n)
      ? f.niveles_cargo.filter(x => x !== n)
      : [...f.niveles_cargo, n],
  }))

  const toggleIdioma = (idioma) => setS3(f => {
    const existe = f.idiomas.find(i => i.idioma === idioma)
    if (existe) return { ...f, idiomas: f.idiomas.filter(i => i.idioma !== idioma) }
    return { ...f, idiomas: [...f.idiomas, { idioma, nivel: 'B2' }] }
  })

  const updateNivelIdioma = (idioma, nivel) => setS3(f => ({
    ...f,
    idiomas: f.idiomas.map(i => i.idioma === idioma ? { ...i, nivel } : i),
  }))

  const agregarEducacion = () => setS3(f => ({
    ...f,
    educacion: [...f.educacion, { nivel: '', titulo: '', institucion: '', anio: '' }],
  }))

  const quitarEducacion = (idx) => setS3(f => ({
    ...f,
    educacion: f.educacion.filter((_, i) => i !== idx),
  }))

  const updateEducacion = (idx, field, value) => setS3(f => ({
    ...f,
    educacion: f.educacion.map((e, i) => i === idx ? { ...e, [field]: value } : e),
  }))

  const togglePrestacion = (p) => setS2(f => {
    const isChecked = f.prestaciones.includes(p)
    const nuevas = isChecked ? f.prestaciones.filter(x => x !== p) : [...f.prestaciones, p]
    const detalle = { ...f.prestaciones_detalle }
    if (isChecked) {
      delete detalle[p]
    } else if (MEXICO_DETALLE[p]) {
      detalle[p] = MEXICO_DETALLE[p].default
    }
    return { ...f, prestaciones: nuevas, prestaciones_detalle: detalle }
  })

  const updateDetalle = (prestacion, valor) => setS2(f => ({
    ...f,
    prestaciones_detalle: { ...f.prestaciones_detalle, [prestacion]: valor },
  }))

  // ── Guardar ──
  const guardar = async () => {
    setError('')
    if (!s1.pais.trim())     { setError('El país es requerido.'); return }
    if (!s1.nombre1.trim())  { setError('El primer nombre es requerido.'); return }
    if (!s1.apellido1.trim()){ setError('El primer apellido es requerido.'); return }
    if (!s1.telefono1.trim()){ setError('El teléfono principal es requerido.'); return }

    setSaving(true)
    const nombreCompleto = [s1.nombre1, s1.nombre2, s1.apellido1, s1.apellido2]
      .map(s => s?.trim()).filter(Boolean).join(' ')
    const salario_esperado = s2.salario_monto ? `${s2.salario_monto} ${s2.moneda}` : ''
    const prestaciones_detalle = {
      ...s2.prestaciones_detalle,
      ...(s2.prestaciones_otros?.trim() ? { __otros: s2.prestaciones_otros.trim() } : {}),
      ...(s2.bono_activo && s2.bono_tipo ? {
        __bono: {
          tipo: s2.bono_tipo,
          frecuencia: s2.bono_tipo === 'Bono' ? s2.bono_frecuencia : null,
          monto: s2.bono_tipo === 'Bono' ? s2.bono_monto : s2.variable_monto,
          pct: s2.bono_tipo === 'Bono' ? s2.bono_pct : null,
        },
      } : {}),
    }
    const { error: err } = await supabase.from('profiles').upsert({
      id: user.id,
      nombre1: s1.nombre1.trim(), nombre2: s1.nombre2.trim() || null,
      apellido1: s1.apellido1.trim(), apellido2: s1.apellido2.trim() || null,
      indicativo1: s1.indicativo1, telefono1: s1.telefono1.trim() || null,
      indicativo2: s1.indicativo2, telefono2: s1.telefono2.trim() || null,
      email_secundario: s1.email_secundario.trim() || null,
      pais: s1.pais, ciudad: s1.ciudad,
      ciudades_busqueda: s1.ciudades_busqueda,
      edad: s1.edad ? parseInt(s1.edad) : null,
      industria_actual: s1.industria_actual || null,
      salario_esperado, prestaciones: s2.prestaciones, prestaciones_detalle,
      nivel_cargo: s3.niveles_cargo.join(', '),
      industrias_deseadas: s3.industrias_deseadas,
      tipo_trabajo: s3.tipo_trabajo, area: s3.areas.join(', '),
      idiomas: s3.idiomas,
      educacion: s3.educacion,
      nombre: nombreCompleto,
    })
    setSaving(false)
    if (err) { setError('Error al guardar. Intenta de nuevo.'); return }
    // Limpiar borrador y continuar
    if (draftKey) localStorage.removeItem(draftKey)
    await refreshPerfil()
    navigate('/dashboard')
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

  const paisPrestaciones = s2.pais || s1.pais

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-surface-container-low to-surface">

      {/* ── Popup error de CV ──────────────────────────────────────────────── */}
      {cvError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-float max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Warning size={24} weight="duotone" className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-primary">No se pudo leer el CV</h3>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  {cvError}
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-3 leading-relaxed">
              <Lightbulb size={18} weight="duotone" className="inline text-amber-500 mr-1.5 -mt-0.5" /> Puedes completar los campos manualmente ahora y subir tu CV más tarde desde tu perfil.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setCvError(''); cvInputRef.current.click() }}
                className="flex-1 border border-outline-variant text-on-surface-variant text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-surface-container transition-colors">
                Intentar de nuevo
              </button>
              <button
                onClick={() => setCvError('')}
                className="flex-1 btn-primary text-sm py-2.5 px-4">
                Continuar sin CV
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">

        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-float">
            <span className="text-on-primary font-bold text-xl">CV</span>
          </div>
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full uppercase tracking-widest mb-3">
            <Clock size={14} weight="duotone" className="inline mr-1 -mt-0.5" /> Solo 5 minutos
          </span>
          <h1 className="font-headline font-black text-3xl text-primary leading-tight">
            Configura tu perfil profesional
          </h1>
          <p className="mt-3 text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
            Este es el punto de partida para que la plataforma trabaje a tu favor. Con esta información personalizamos tus resultados, filtramos las mejores vacantes y desbloqueamos todas las funcionalidades.
          </p>
          <div className="flex justify-center gap-6 mt-5 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5"><CheckCircle size={16} weight="duotone" className="text-green-500" /> Análisis sin bias</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={16} weight="duotone" className="text-green-500" /> Vacantes personalizadas</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={16} weight="duotone" className="text-green-500" /> 3 pasos rápidos</span>
          </div>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {PASOS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                  ${i < paso ? 'bg-green-500 text-white' : i === paso ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'}`}>
                  {i < paso ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === paso ? 'text-on-surface font-semibold' : 'text-outline'}`}>{label}</span>
              </div>
              {i < PASOS.length - 1 && (
                <div className={`h-px w-8 shrink-0 ${i < paso ? 'bg-green-400' : 'bg-outline-variant'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ─── PASO 0 — Información personal ─────────────────────────────── */}
        {paso === 0 && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-7 space-y-6">

            {/* Autocompletar desde CV */}
            <div className="p-4 bg-primary-fixed/30 border border-primary-fixed rounded-xl">
              <p className="text-sm font-semibold text-primary mb-1">Autocompletar desde tu CV</p>
              <p className="text-xs text-on-surface-variant mb-3">Sube tu CV y detectamos tu nombre, teléfono y ciudad automáticamente.</p>
              <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => detectarDesdeCv(e.target.files[0])} />
              <button onClick={() => cvInputRef.current.click()} disabled={detectando}
                className="text-xs font-semibold border border-primary/30 text-primary rounded-lg px-4 py-2 hover:bg-primary/5 transition-colors disabled:opacity-50">
                {detectando ? 'Detectando...' : '📄 Subir CV para autocompletar (opcional)'}
              </button>
              {cvExito && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
                  <span className="font-bold">✓ CV cargado:</span> {cvNombre}
                </div>
              )}
            </div>

            {/* País y Ciudad */}
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3">Ubicación</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">País *</label>
                  <select value={s1.pais} onChange={handlePaisChange}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Selecciona</option>
                    {PAISES_LATAM.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Ciudad de residencia</label>
                  <input type="text" value={s1.ciudad}
                    onChange={e => setS1(f => ({ ...f, ciudad: e.target.value }))}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-on-surface-variant mb-1.5">
                    Ciudades/Países de búsqueda <span className="text-outline">(hasta 5)</span>
                  </label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={ciudadInput}
                        onChange={e => { setCiudadInput(e.target.value); setDropdownOpen(true); setActiveCityIdx(-1) }}
                        onFocus={() => setDropdownOpen(true)}
                        onBlur={() => setTimeout(() => { setDropdownOpen(false); setActiveCityIdx(-1) }, 150)}
                        onKeyDown={e => {
                          const sugerencias = CIUDADES_SUGERIDAS.filter(c =>
                            !s1.ciudades_busqueda.includes(c) &&
                            normalizar(c).includes(normalizar(ciudadInput))
                          ).slice(0, 6)
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setActiveCityIdx(prev => prev < sugerencias.length - 1 ? prev + 1 : prev)
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setActiveCityIdx(prev => prev > 0 ? prev - 1 : 0)
                          } else if (e.key === 'Enter') {
                            e.preventDefault()
                            if (activeCityIdx >= 0 && sugerencias[activeCityIdx]) {
                              setCiudadInput(sugerencias[activeCityIdx])
                              setDropdownOpen(false)
                              setActiveCityIdx(-1)
                            } else {
                              agregarCiudad()
                            }
                          }
                        }}
                        placeholder="Escribe una ciudad o país..."
                        disabled={s1.ciudades_busqueda.length >= 5}
                        className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-container-low"
                      />
                      {dropdownOpen && ciudadInput.length > 0 && (() => {
                        const sugerencias = CIUDADES_SUGERIDAS.filter(c =>
                          !s1.ciudades_busqueda.includes(c) &&
                          normalizar(c).includes(normalizar(ciudadInput))
                        ).slice(0, 6)
                        return sugerencias.length > 0 ? (
                          <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-outline-variant rounded-xl shadow-float overflow-hidden">
                            {sugerencias.map((c, idx) => (
                              <li key={c}
                                onMouseDown={() => { setCiudadInput(c); setDropdownOpen(false); setActiveCityIdx(-1) }}
                                onMouseEnter={() => setActiveCityIdx(idx)}
                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${activeCityIdx === idx ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface hover:bg-primary/5 hover:text-primary'}`}>
                                {c}
                              </li>
                            ))}
                          </ul>
                        ) : null
                      })()}
                    </div>
                    <button onClick={agregarCiudad}
                      disabled={!ciudadInput.trim() || s1.ciudades_busqueda.length >= 5}
                      className="border border-outline-variant text-on-surface-variant rounded-lg px-3 py-2 text-sm hover:border-primary hover:text-primary disabled:opacity-40 transition-colors">
                      +
                    </button>
                  </div>
                  {s1.ciudades_busqueda.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s1.ciudades_busqueda.map(c => (
                        <span key={c} className="flex items-center gap-1 bg-secondary-fixed text-on-secondary-container text-xs rounded-full px-2.5 py-1">
                          {c}
                          <button onClick={() => quitarCiudad(c)} className="hover:text-error">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nombres y apellidos */}
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3">Nombre completo</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key:'nombre1',   label:'Nombre 1 *' },
                  { key:'nombre2',   label:'Nombre 2' },
                  { key:'apellido1', label:'Apellido 1 *' },
                  { key:'apellido2', label:'Apellido 2' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-on-surface-variant mb-1">{label}</label>
                    <input type="text" value={s1[key]}
                      onChange={e => setS1(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                ))}
              </div>
            </div>

            {/* Teléfonos */}
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3">Teléfonos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TelefonoInput indicativoKey="indicativo1" telefonoKey="telefono1" label="Teléfono 1" required s1={s1} setS1={setS1} />
                <TelefonoInput indicativoKey="indicativo2" telefonoKey="telefono2" label="Teléfono 2" s1={s1} setS1={setS1} />
              </div>
            </div>

            {/* Emails */}
            <div>
              <h3 className="text-sm font-semibold text-on-surface mb-3">Correos electrónicos</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Email principal</label>
                  <input type="email" value={user?.email || ''} disabled
                    className="w-full border border-outline-variant/40 bg-surface-container-low text-outline rounded-lg px-3 py-2.5 text-sm cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Email secundario</label>
                  <input type="email" value={s1.email_secundario}
                    onChange={e => setS1(f => ({ ...f, email_secundario: e.target.value }))}
                    placeholder="otro@email.com"
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>

            {/* Edad e industria actual */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Edad</label>
                <input type="number" value={s1.edad}
                  onChange={e => setS1(f => ({ ...f, edad: e.target.value }))}
                  min="16" max="80" placeholder="35"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Industria actual</label>
                <select value={s1.industria_actual}
                  onChange={e => setS1(f => ({ ...f, industria_actual: e.target.value }))}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona tu industria</option>
                  {INDUSTRIAS_LATAM.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-error font-medium">{error}</p>}

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if(window.confirm('Este paso es para conocerte y es requerido para utilizar otras funcionalidades.\n\nNo te tardarás más de 5 minutos y puedes regresar después.\n\n¿Estás seguro de que quieres salir a inicio?')) {
                    navigate('/');
                  }
                }}
                className="border border-outline-variant text-on-surface-variant font-medium py-3 px-5 rounded-xl hover:border-outline transition-colors"
              >
                Salir del onboarding
              </button>
              <button onClick={siguiente}
                className="flex-1 btn-primary py-3 font-semibold">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO 1 — Compensación ──────────────────────────────────────── */}
        {paso === 1 && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-7 space-y-6">
            <div>
              <h2 className="font-headline font-bold text-xl text-primary mb-1">Compensación</h2>
              <p className="text-sm text-on-surface-variant">Ayuda a filtrar vacantes por rango salarial.</p>
            </div>

            {/* País para prestaciones */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                País (para prestaciones)
              </label>
              <select value={paisPrestaciones} onChange={handlePaisCompensacionChange}
                className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Selecciona</option>
                {PAISES_LATAM.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Salario */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Salario bruto mensual</label>
              <div className="flex gap-2">
                <select value={s2.moneda} onChange={e => setS2(f => ({ ...f, moneda: e.target.value }))}
                  className="border border-outline-variant rounded-lg px-2 py-2.5 text-sm bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary shrink-0">
                  {MONEDAS.map(m => <option key={m.code} value={m.code}>{m.code}</option>)}
                </select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline select-none">
                    {MONEDAS.find(m => m.code === s2.moneda)?.symbol || '$'}
                  </span>
                  <input type="text" value={s2.salario_monto}
                    onChange={e => setS2(f => ({ ...f, salario_monto: soloNumericos(e.target.value, f.moneda) }))}
                    onBlur={() => setS2(f => ({ ...f, salario_monto: formatearMonto(f.salario_monto, f.moneda) }))}
                    placeholder={MONEDAS_US.includes(s2.moneda) ? '50,000' : '50.000'}
                    className="w-full border border-outline-variant rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>

            {/* Prestaciones */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Prestaciones{paisPrestaciones ? ` — ${paisPrestaciones}` : ''}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {getPrestaciones(paisPrestaciones).map(p => {
                  const detailCfg = paisPrestaciones === 'México' ? MEXICO_DETALLE[p] : null
                  const isChecked = s2.prestaciones.includes(p)
                  return (
                    <div key={p}>
                      <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs
                        ${isChecked
                          ? 'bg-secondary-fixed border-secondary/30 text-on-secondary-container font-medium'
                          : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}>
                        <input type="checkbox" checked={isChecked} onChange={() => togglePrestacion(p)}
                          className="accent-primary shrink-0" />
                        {p}
                      </label>
                      {isChecked && detailCfg && (
                        <div className="mt-1 px-1">
                          {detailCfg.tipo === 'selector' ? (
                            <select
                              value={s2.prestaciones_detalle[p] ?? detailCfg.default}
                              onChange={e => updateDetalle(p, e.target.value)}
                              className="w-full border border-outline-variant rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {detailCfg.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={s2.prestaciones_detalle[p] ?? detailCfg.default}
                                onChange={e => {
                                  const val = detailCfg.tipo === 'monto'
                                    ? soloNumericos(e.target.value, s2.moneda)
                                    : e.target.value.replace(/[^0-9.]/g, '')
                                  updateDetalle(p, val)
                                }}
                                onBlur={() => {
                                  if (detailCfg.tipo === 'monto') {
                                    const val = s2.prestaciones_detalle[p] ?? ''
                                    updateDetalle(p, formatearMonto(val, s2.moneda))
                                  }
                                }}
                                placeholder={detailCfg.tipo === 'monto'
                                  ? (MONEDAS_US.includes(s2.moneda) ? '10,000' : '10.000')
                                  : detailCfg.label}
                                className="flex-1 border border-outline-variant rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              {detailCfg.tipo === 'pct'  && <span className="text-xs text-outline shrink-0">%</span>}
                              {detailCfg.tipo === 'dias' && <span className="text-xs text-outline shrink-0">días</span>}
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
                <label className="text-xs font-semibold text-on-surface-variant">Variable o Bono</label>
                <button
                  onClick={() => setS2(f => ({ ...f, bono_activo: !f.bono_activo, bono_tipo: '', bono_frecuencia: '', bono_monto: '', bono_pct: '', variable_monto: '' }))}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                    ${s2.bono_activo ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}
                >
                  {s2.bono_activo ? '✓ Aplica' : '+ Agregar'}
                </button>
              </div>

              {s2.bono_activo && (() => {
                const salarioNum = parseMonto(s2.salario_monto, s2.moneda)
                const multiplicador = { 'Mensual': 1, 'Trimestral': 3, 'Semestral': 6, 'Anual': 12 }[s2.bono_frecuencia] || 1
                const bonoCalculado = s2.bono_esquema === '%' && s2.bono_pct && s2.bono_frecuencia
                  ? salarioNum * multiplicador * (parseFloat(s2.bono_pct) / 100)
                  : s2.bono_esquema === 'Número de salarios' && s2.bono_num_salarios
                  ? parseFloat(s2.bono_num_salarios) * salarioNum
                  : null
                const bonoFmt = bonoCalculado !== null ? formatearMonto(String(Math.round(bonoCalculado)), s2.moneda) : null

                return (
                  <div className="space-y-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/40">
                    {/* Tipo */}
                    <div className="flex gap-2">
                      {['Bono', 'Variable mensual'].map(t => (
                        <button key={t} onClick={() => setS2(f => ({ ...f, bono_tipo: t, bono_esquema: '', bono_pct: '', bono_num_salarios: '', bono_monto: '' }))}
                          className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors
                            ${s2.bono_tipo === t ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>
                          {t}
                        </button>
                      ))}
                    </div>

                    {s2.bono_tipo === 'Bono' && (
                      <div className="space-y-3">
                        {/* Fila 1: Frecuencia / Esquema */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-on-surface-variant mb-1">Frecuencia</label>
                            <select value={s2.bono_frecuencia} onChange={e => setS2(f => ({ ...f, bono_frecuencia: e.target.value }))}
                              className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                              <option value="">Selecciona</option>
                              {['Mensual','Trimestral','Semestral','Anual'].map(frq => <option key={frq} value={frq}>{frq}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-on-surface-variant mb-1">Esquema</label>
                            <select value={s2.bono_esquema} onChange={e => setS2(f => ({ ...f, bono_esquema: e.target.value, bono_pct: '', bono_num_salarios: '', bono_monto: '' }))}
                              className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                              <option value="">Selecciona</option>
                              <option value="%">% del salario anual</option>
                              <option value="Número de salarios">Número de salarios</option>
                              <option value="Valor">Valor fijo</option>
                            </select>
                          </div>
                        </div>

                        {/* Fila 2: campos según esquema */}
                        {s2.bono_esquema === '%' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-on-surface-variant mb-1">Porcentaje %</label>
                              <input type="text" value={s2.bono_pct}
                                onChange={e => setS2(f => ({ ...f, bono_pct: e.target.value.replace(/[^0-9.]/g, '') }))}
                                placeholder="10"
                                className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                              <label className="block text-xs text-on-surface-variant mb-1">Bono estimado ({s2.moneda})</label>
                              <input type="text" readOnly value={bonoFmt || ''}
                                placeholder="Se calcula automáticamente"
                                className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs bg-surface-container focus:outline-none text-on-surface-variant" />
                            </div>
                          </div>
                        )}

                        {s2.bono_esquema === 'Número de salarios' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-on-surface-variant mb-1">Número de salarios</label>
                              <input type="text" value={s2.bono_num_salarios}
                                onChange={e => setS2(f => ({ ...f, bono_num_salarios: e.target.value.replace(/[^0-9.]/g, '') }))}
                                placeholder="3"
                                className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                              <label className="block text-xs text-on-surface-variant mb-1">Bono estimado ({s2.moneda})</label>
                              <input type="text" readOnly value={bonoFmt || ''}
                                placeholder="Se calcula automáticamente"
                                className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs bg-surface-container focus:outline-none text-on-surface-variant" />
                            </div>
                          </div>
                        )}

                        {s2.bono_esquema === 'Valor' && (
                          <div>
                            <label className="block text-xs text-on-surface-variant mb-1">Monto del bono ({s2.moneda})</label>
                            <input type="text" value={s2.bono_monto}
                              onChange={e => setS2(f => ({ ...f, bono_monto: soloNumericos(e.target.value, f.moneda) }))}
                              onBlur={() => setS2(f => ({ ...f, bono_monto: formatearMonto(f.bono_monto, f.moneda) }))}
                              placeholder={MONEDAS_US.includes(s2.moneda) ? '50,000' : '50.000'}
                              className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                        )}
                      </div>
                    )}

                    {s2.bono_tipo === 'Variable mensual' && (
                      <div>
                        <label className="block text-xs text-on-surface-variant mb-1">Monto mensual ({s2.moneda})</label>
                        <input type="text" value={s2.variable_monto}
                          onChange={e => setS2(f => ({ ...f, variable_monto: soloNumericos(e.target.value, f.moneda) }))}
                          onBlur={() => setS2(f => ({ ...f, variable_monto: formatearMonto(f.variable_monto, f.moneda) }))}
                          placeholder={MONEDAS_US.includes(s2.moneda) ? '10,000' : '10.000'}
                          className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Otros beneficios */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Otros beneficios <span className="text-outline font-normal">(campo libre)</span>
              </label>
              <textarea
                value={s2.prestaciones_otros}
                onChange={e => setS2(f => ({ ...f, prestaciones_otros: e.target.value }))}
                placeholder="Ej. Seguro dental, días adicionales de vacaciones, plan de carrera, acciones de la empresa..."
                rows={2}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={anterior}
                className="border border-outline-variant text-on-surface-variant font-medium py-3 px-5 rounded-xl hover:border-outline transition-colors">
                ← Atrás
              </button>
              <button onClick={siguiente}
                className="flex-1 btn-primary font-semibold py-3">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO 2 — Aspiraciones ──────────────────────────────────────── */}
        {paso === 2 && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-7 space-y-6">
            <div>
              <h2 className="font-headline font-bold text-xl text-primary mb-1">Aspiraciones y motivaciones</h2>
              <p className="text-sm text-on-surface-variant">Personaliza las vacantes y el análisis de tu CV.</p>
            </div>

            {/* Nivel de cargo — multi-select */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Nivel de cargo buscado <span className="text-outline font-normal">(puedes elegir varios)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {NIVELES_CARGO.map(n => (
                  <button key={n} onClick={() => toggleNivelCargo(n)}
                    className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                      ${s3.niveles_cargo.includes(n)
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Área funcional */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">Área funcional</label>
              <div className="flex flex-wrap gap-2">
                {AREAS.map(a => (
                  <button key={a} onClick={() => setS3(f => ({
                      ...f,
                      areas: f.areas.includes(a) ? f.areas.filter(x => x !== a) : [...f.areas, a]
                    }))}
                    className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                      ${s3.areas.includes(a)
                        ? 'bg-secondary text-on-secondary border-secondary'
                        : 'border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de trabajo */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">Tipo de trabajo</label>
              <div className="flex gap-2">
                {TIPOS_TRABAJO.map(t => (
                  <button key={t} onClick={() => setS3(f => ({ ...f, tipo_trabajo: t }))}
                    className={`flex-1 text-xs font-semibold py-2.5 rounded-xl border transition-colors
                      ${s3.tipo_trabajo === t
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Industrias */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Industrias de interés <span className="text-outline font-normal">(múltiple)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
                {INDUSTRIAS_LATAM.map(ind => (
                  <button key={ind} onClick={() => toggleIndustria(ind)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                      ${s3.industrias_deseadas.includes(ind)
                        ? 'bg-secondary-fixed border-secondary/40 text-on-secondary-container font-semibold'
                        : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}>
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            {/* Idiomas */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                Idiomas <span className="text-outline font-normal">(selecciona y asigna nivel CEFR)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {IDIOMAS.map(idioma => {
                  const sel = s3.idiomas.find(i => i.idioma === idioma)
                  return (
                    <button key={idioma} onClick={() => toggleIdioma(idioma)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                        ${sel
                          ? 'bg-primary text-on-primary border-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>
                      {idioma}
                    </button>
                  )
                })}
              </div>
              {s3.idiomas.length > 0 && (
                <div className="space-y-2">
                  {s3.idiomas.map(({ idioma, nivel }) => (
                    <div key={idioma} className="flex items-center gap-3 p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                      <span className="text-xs font-medium text-on-surface flex-1">{idioma}</span>
                      <select value={nivel} onChange={e => updateNivelIdioma(idioma, e.target.value)}
                        className="border border-outline-variant rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                        {NIVELES_CEFR.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <button onClick={() => toggleIdioma(idioma)} className="text-outline hover:text-error text-base leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Educación */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-on-surface-variant">Educación</label>
                <button onClick={agregarEducacion}
                  className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors">
                  + Agregar
                </button>
              </div>
              {s3.educacion.length === 0 && (
                <p className="text-xs text-outline py-1">Agrega tu formación académica (opcional)</p>
              )}
              <div className="space-y-3">
                {s3.educacion.map((edu, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-on-surface-variant">Educación {idx + 1}</span>
                      <button onClick={() => quitarEducacion(idx)} className="text-xs text-outline hover:text-error transition-colors">✕ Eliminar</button>
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Nivel académico</label>
                      <select value={edu.nivel} onChange={e => updateEducacion(idx, 'nivel', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Selecciona</option>
                        {NIVELES_EDUCACION.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Título / Programa</label>
                      <input type="text" value={edu.titulo} onChange={e => updateEducacion(idx, 'titulo', e.target.value)}
                        placeholder="Ej. Ingeniería Industrial"
                        className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-on-surface-variant mb-1">Institución</label>
                        <input type="text" value={edu.institucion} onChange={e => updateEducacion(idx, 'institucion', e.target.value)}
                          placeholder="Ej. UNAM"
                          className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-xs text-on-surface-variant mb-1">Año de graduación</label>
                        <input type="text" value={edu.anio} onChange={e => updateEducacion(idx, 'anio', e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="2020" maxLength={4}
                          className="w-full border border-outline-variant rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Beneficios del plan */}
            <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
              {['2 análisis de CV gratuitos incluidos','Búsqueda de vacantes con IA','Seguimiento de aplicaciones'].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="w-4 h-4 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                  {b}
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-error font-medium">{error}</p>}

            <div className="flex gap-3">
              <button onClick={anterior}
                className="border border-outline-variant text-on-surface-variant font-medium py-3 px-5 rounded-xl hover:border-outline transition-colors">
                ← Atrás
              </button>
              <button onClick={guardar} disabled={saving}
                className="flex-1 btn-primary font-semibold py-3 disabled:opacity-50">
                {saving ? 'Guardando...' : '¡Empezar!'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-outline mt-4">
          Puedes editar toda esta información en <strong className="text-on-surface-variant">Mi Perfil</strong>.
        </p>
      </div>
    </div>
  )
}
