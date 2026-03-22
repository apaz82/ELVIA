import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'

// ─── Catálogos (mismo que Onboarding) ────────────────────────────────────────

const PAISES_LATAM = [
  'México','Colombia','Argentina','Chile','Perú','Venezuela','Ecuador','Bolivia',
  'Uruguay','Paraguay','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua',
  'Panamá','República Dominicana','Cuba','España','Estados Unidos','Canadá','Brasil','Otro',
]

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
const EXPERIENCIAS = [
  { value: 0, label: 'Sin experiencia' },{ value: 1, label: '1-2 años' },
  { value: 3, label: '3-5 años' },{ value: 6, label: '6-10 años' },{ value: 11, label: 'Más de 10 años' },
]

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

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Perfil() {
  const { user, loading: authLoading, perfil, refreshPerfil, creditosRestantes, LIMITE_PLAN, usageCount } = useAuth()
  const navigate = useNavigate()

  const bloqueado = !!(perfil?.nombre1 && perfil?.apellido1)

  const [saving, setSaving]     = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [copiado, setCopiado]   = useState(false)
  const [ciudadInput, setCiudadInput] = useState('')

  const [form, setForm] = useState({
    // Sección 1
    nombre1: '', nombre2: '', apellido1: '', apellido2: '',
    telefono1: '', telefono2: '', email_secundario: '',
    pais: '', ciudad: '', ciudades_busqueda: [], edad: '',
    // Sección 2
    salario_monto: '', moneda: 'MXN', prestaciones: [],
    // Sección 3
    nivel_cargo: '', industrias_deseadas: [], tipo_trabajo: '', area: '',
    // Campos legacy
    cargo_actual: '', cargo_objetivo: '', experiencia_anos: '',
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
      telefono1:          perfil.telefono1 || '',
      telefono2:          perfil.telefono2 || '',
      email_secundario:   perfil.email_secundario || '',
      pais:               perfil.pais || '',
      ciudad:             perfil.ciudad || '',
      ciudades_busqueda:  perfil.ciudades_busqueda || [],
      edad:               perfil.edad || '',
      salario_monto:      monto || '',
      moneda:             monedaSaved || detectarMoneda(perfil.pais),
      prestaciones:       perfil.prestaciones || [],
      nivel_cargo:        perfil.nivel_cargo || '',
      industrias_deseadas: perfil.industrias_deseadas || [],
      tipo_trabajo:       perfil.tipo_trabajo || '',
      area:               perfil.area || '',
      cargo_actual:       perfil.cargo_actual || '',
      cargo_objetivo:     perfil.cargo_objetivo || '',
      experiencia_anos:   perfil.experiencia_anos ?? '',
    })
  }, [perfil])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handlePaisChange = (e) => {
    const pais = e.target.value
    setForm(f => ({ ...f, pais, moneda: detectarMoneda(pais) }))
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

  const togglePrestacion = (p) => setForm(f => ({
    ...f,
    prestaciones: f.prestaciones.includes(p)
      ? f.prestaciones.filter(x => x !== p)
      : [...f.prestaciones, p],
  }))

  const guardar = async () => {
    setSaving(true)
    setGuardado(false)
    const nombreCompleto = [form.nombre1, form.nombre2, form.apellido1, form.apellido2]
      .map(s => s?.trim()).filter(Boolean).join(' ')
    const salario_esperado = form.salario_monto ? `${form.salario_monto} ${form.moneda}` : ''
    const { salario_monto, moneda, ...rest } = form
    const { error } = await supabase.from('profiles').update({
      ...rest, salario_esperado, nombre: nombreCompleto,
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-gray-500 text-sm">{user?.email}</p>
      </div>

      {/* Plan y créditos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Plan actual</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{creditosRestantes}</span>
              <span className="text-gray-400">/ {LIMITE_PLAN} créditos disponibles</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Plan gratuito · {usageCount} utilizados</p>
            <div className="w-48 bg-gray-100 rounded-full h-1.5 mt-2">
              <div className={`h-1.5 rounded-full ${creditosRestantes === 0 ? 'bg-red-400' : creditosRestantes === 1 ? 'bg-amber-400' : 'bg-green-500'}`}
                style={{ width: `${(creditosRestantes / LIMITE_PLAN) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <button className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              Mejorar plan — Próximamente
            </button>
            <p className="text-xs text-gray-400">Planes desde $9 USD/mes</p>
          </div>
        </div>
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

      {/* ── Sección 1: Datos personales ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sección 1 — Datos personales</h2>

        {/* Nombre y apellidos */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Nombre completo</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key:'nombre1', label:'Nombre 1 *', placeholder:'Ana', locked: bloqueado },
              { key:'nombre2', label:'Nombre 2',   placeholder:'María' },
              { key:'apellido1', label:'Apellido 1 *', placeholder:'González', locked: bloqueado },
              { key:'apellido2', label:'Apellido 2',   placeholder:'Martínez' },
            ].map(({ key, label, placeholder, locked }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input type="text" value={form[key]} onChange={set(key)}
                  disabled={locked} placeholder={placeholder}
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
          <h3 className="text-sm font-medium text-gray-700 mb-3">Teléfonos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Teléfono 1</label>
              <input type="tel" value={form.telefono1} onChange={set('telefono1')} placeholder="+52 55 1234 5678"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Teléfono 2</label>
              <input type="tel" value={form.telefono2} onChange={set('telefono2')} placeholder="+52 55 9876 5432"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Emails */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Correos electrónicos</h3>
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
          <h3 className="text-sm font-medium text-gray-700 mb-3">Ubicación</h3>
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
              <label className="block text-xs text-gray-500 mb-1">Ciudad de residencia</label>
              <input type="text" value={form.ciudad} onChange={set('ciudad')} placeholder="Ciudad de México"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Edad</label>
              <input type="number" value={form.edad} onChange={set('edad')} placeholder="35" min="16" max="80"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {/* Ciudades de búsqueda */}
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
                    {c}
                    <button onClick={() => quitarCiudad(c)} className="hover:text-red-500 transition-colors">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sección 2: Compensación ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sección 2 — Compensación</h2>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Salario bruto mensual</label>
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
          {form.pais && <p className="text-xs text-gray-400 mt-1">Moneda detectada para {form.pais}: {form.moneda}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Prestaciones{form.pais ? ` (${form.pais})` : ''}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {getPrestaciones(form.pais).map(p => (
              <label key={p} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs
                ${form.prestaciones.includes(p) ? 'bg-primary/5 border-primary/30 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <input type="checkbox" checked={form.prestaciones.includes(p)} onChange={() => togglePrestacion(p)} className="accent-primary shrink-0" />
                {p}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sección 3: Aspiraciones ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sección 3 — Aspiraciones</h2>

        {/* Nivel de cargo */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Nivel de cargo buscado</label>
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

        {/* Área */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Área funcional</label>
          <div className="flex flex-wrap gap-2">
            {AREAS.map(a => (
              <button key={a} onClick={() => setForm(f=>({...f,area:a}))}
                className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                  ${form.area === a ? 'bg-teal text-white border-teal' : 'border-gray-300 text-gray-600 hover:border-teal hover:text-teal'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de trabajo */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Tipo de trabajo</label>
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
          <label className="block text-xs font-medium text-gray-500 mb-2">Industrias de interés <span className="text-gray-400">(múltiple)</span></label>
          <div className="flex flex-wrap gap-1.5">
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

        {/* Campos profesionales legacy */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Perfil profesional adicional</h3>
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
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex items-center gap-3 pb-8">
        <button onClick={guardar} disabled={saving}
          className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {guardado && <span className="text-sm text-green-600">✓ Guardado correctamente</span>}
      </div>
    </div>
  )
}
