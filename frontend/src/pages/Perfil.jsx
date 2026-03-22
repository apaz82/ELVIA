import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'

const INDUSTRIAS = [
  'Recursos Humanos', 'Ventas y Comercial', 'Marketing', 'Finanzas y Contabilidad',
  'Tecnología e IT', 'Operaciones y Logística', 'Legal y Jurídico', 'Salud',
  'Educación', 'Manufactura', 'Consultoría', 'Emprendimiento', 'Otro',
]

const MODALIDADES = ['Presencial', 'Híbrido', 'Remoto', 'Indiferente']

const EXPERIENCIAS = [
  { value: 0, label: 'Sin experiencia' },
  { value: 1, label: '1-2 años' },
  { value: 3, label: '3-5 años' },
  { value: 6, label: '6-10 años' },
  { value: 11, label: 'Más de 10 años' },
]

// Monedas disponibles
const MONEDAS = [
  { code: 'MXN', symbol: '$',  label: 'Peso mexicano (MXN)' },
  { code: 'COP', symbol: '$',  label: 'Peso colombiano (COP)' },
  { code: 'ARS', symbol: '$',  label: 'Peso argentino (ARS)' },
  { code: 'CLP', symbol: '$',  label: 'Peso chileno (CLP)' },
  { code: 'PEN', symbol: 'S/', label: 'Sol peruano (PEN)' },
  { code: 'UYU', symbol: '$',  label: 'Peso uruguayo (UYU)' },
  { code: 'USD', symbol: '$',  label: 'Dólar estadounidense (USD)' },
  { code: 'EUR', symbol: '€',  label: 'Euro (EUR)' },
  { code: 'BOB', symbol: 'Bs', label: 'Boliviano (BOB)' },
  { code: 'PYG', symbol: '₲',  label: 'Guaraní paraguayo (PYG)' },
  { code: 'GTQ', symbol: 'Q',  label: 'Quetzal guatemalteco (GTQ)' },
  { code: 'CRC', symbol: '₡',  label: 'Colón costarricense (CRC)' },
  { code: 'HNL', symbol: 'L',  label: 'Lempira hondureño (HNL)' },
  { code: 'DOP', symbol: '$',  label: 'Peso dominicano (DOP)' },
  { code: 'GBP', symbol: '£',  label: 'Libra esterlina (GBP)' },
  { code: 'CAD', symbol: '$',  label: 'Dólar canadiense (CAD)' },
  { code: 'BRL', symbol: 'R$', label: 'Real brasileño (BRL)' },
]

// Detección de moneda por país (normalizado a minúsculas sin tildes)
const MONEDA_POR_PAIS = {
  'mexico': 'MXN', 'méxico': 'MXN',
  'colombia': 'COP',
  'argentina': 'ARS',
  'chile': 'CLP',
  'peru': 'PEN', 'perú': 'PEN',
  'uruguay': 'UYU',
  'venezuela': 'USD',
  'ecuador': 'USD',
  'el salvador': 'USD',
  'panama': 'USD', 'panamá': 'USD',
  'usa': 'USD', 'estados unidos': 'USD', 'united states': 'USD',
  'espana': 'EUR', 'españa': 'EUR', 'spain': 'EUR',
  'bolivia': 'BOB',
  'paraguay': 'PYG',
  'guatemala': 'GTQ',
  'costa rica': 'CRC',
  'honduras': 'HNL',
  'nicaragua': 'NIO',
  'republica dominicana': 'DOP', 'república dominicana': 'DOP',
  'reino unido': 'GBP', 'uk': 'GBP',
  'canada': 'CAD', 'canadá': 'CAD',
  'brasil': 'BRL', 'brazil': 'BRL',
}

const detectarMoneda = (pais) => {
  if (!pais) return 'MXN'
  const key = pais.toLowerCase().trim()
  return MONEDA_POR_PAIS[key] || 'USD'
}

const simboloMoneda = (code) => MONEDAS.find(m => m.code === code)?.symbol || '$'

// Parsea "50000 MXN" → { monto: '50000', moneda: 'MXN' }
const parseSalario = (salario) => {
  if (!salario) return { monto: '', moneda: '' }
  const parts = salario.trim().split(' ')
  if (parts.length >= 2) {
    const posibleMoneda = parts[parts.length - 1]
    if (MONEDAS.find(m => m.code === posibleMoneda)) {
      return { monto: parts.slice(0, -1).join(' '), moneda: posibleMoneda }
    }
  }
  return { monto: salario, moneda: '' }
}

export default function Perfil() {
  const { user, loading: authLoading, perfil, refreshPerfil, creditosRestantes, LIMITE_PLAN, usageCount } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', pais: '', ciudad: '',
    industria: '', cargo_actual: '', cargo_objetivo: '',
    experiencia_anos: '', salario_monto: '', moneda: 'MXN', modalidad: '',
  })
  const [saving, setSaving]       = useState(false)
  const [guardado, setGuardado]   = useState(false)
  const [copiado, setCopiado]     = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
  }, [user, authLoading])

  // Cargar datos del perfil cuando lleguen
  useEffect(() => {
    if (!perfil) return
    const { monto, moneda: monedaParsed } = parseSalario(perfil.salario_esperado)
    const paisCargado = perfil.pais || ''
    setForm({
      nombre:           perfil.nombre || '',
      pais:             paisCargado,
      ciudad:           perfil.ciudad || '',
      industria:        perfil.industria || '',
      cargo_actual:     perfil.cargo_actual || '',
      cargo_objetivo:   perfil.cargo_objetivo || '',
      experiencia_anos: perfil.experiencia_anos ?? '',
      salario_monto:    monto,
      moneda:           monedaParsed || detectarMoneda(paisCargado),
      modalidad:        perfil.modalidad || '',
    })
  }, [perfil])

  // Auto-detectar moneda cuando cambia el país (solo si el usuario no ha elegido manualmente)
  const handlePaisChange = (e) => {
    const nuevoPais = e.target.value
    setForm(f => ({
      ...f,
      pais: nuevoPais,
      moneda: detectarMoneda(nuevoPais),
    }))
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const guardar = async () => {
    setSaving(true)
    setGuardado(false)
    // Combinar monto y moneda en salario_esperado para guardar
    const salario_esperado = form.salario_monto
      ? `${form.salario_monto} ${form.moneda}`.trim()
      : ''
    const { salario_monto, moneda, ...rest } = form
    const { error } = await supabase
      .from('profiles')
      .update({ ...rest, salario_esperado })
      .eq('id', user.id)
    setSaving(false)
    if (!error) {
      setGuardado(true)
      refreshPerfil()
      setTimeout(() => setGuardado(false), 3000)
    }
  }

  const copiarCodigo = () => {
    if (!perfil?.referral_code) return
    navigator.clipboard.writeText(perfil.referral_code)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const compartirLink = () => {
    const link = `${window.location.origin}/auth?ref=${perfil?.referral_code}`
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
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

      {/* Código de referido */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Programa de referidos</h2>
        <p className="text-sm text-gray-500 mb-4">Comparte tu código y gana <strong>2 créditos</strong> por cada persona que se registre.</p>

        {perfil?.referral_code ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
              <span className="text-xs text-gray-400 font-medium">Tu código:</span>
              <span className="font-mono font-bold text-gray-900 tracking-widest text-sm">{perfil.referral_code.toUpperCase()}</span>
            </div>
            <button onClick={copiarCodigo}
              className="text-sm font-medium border border-gray-300 rounded-xl px-4 py-2.5 hover:border-primary hover:text-primary transition-colors">
              {copiado ? '✓ Copiado' : 'Copiar código'}
            </button>
            <button onClick={compartirLink}
              className="text-sm font-medium bg-primary text-white rounded-xl px-4 py-2.5 hover:bg-blue-700 transition-colors">
              Compartir link
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Cargando código...</div>
        )}

        {perfil?.bonus_credits > 0 && (
          <p className="mt-3 text-sm text-green-600 font-medium">
            🎉 Has ganado {perfil.bonus_credits} créditos por referidos
          </p>
        )}
      </div>

      {/* Datos personales */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Datos personales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo</label>
            <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">País</label>
            <input type="text" value={form.pais} onChange={handlePaisChange} placeholder="México"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad</label>
            <input type="text" value={form.ciudad} onChange={set('ciudad')} placeholder="Ciudad de México"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Perfil profesional */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Perfil profesional</h2>
        <p className="text-xs text-gray-400 mb-5">Esta información mejora tus búsquedas de vacantes y el análisis de tu CV.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Industria</label>
            <select value={form.industria} onChange={set('industria')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Selecciona una industria</option>
              {INDUSTRIAS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Años de experiencia</label>
            <select value={form.experiencia_anos} onChange={set('experiencia_anos')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Selecciona</option>
              {EXPERIENCIAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cargo actual</label>
            <input type="text" value={form.cargo_actual} onChange={set('cargo_actual')} placeholder="ej. Gerente de RH"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cargo objetivo</label>
            <input type="text" value={form.cargo_objetivo} onChange={set('cargo_objetivo')} placeholder="ej. Director de RH"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Expectativa salarial</label>
            <div className="flex gap-2">
              {/* Selector de moneda */}
              <select value={form.moneda} onChange={set('moneda')}
                className="border border-gray-300 rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 text-gray-700 shrink-0">
                {MONEDAS.map(m => (
                  <option key={m.code} value={m.code}>{m.code}</option>
                ))}
              </select>
              {/* Campo de monto con símbolo */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">
                  {simboloMoneda(form.moneda)}
                </span>
                <input
                  type="text"
                  value={form.salario_monto}
                  onChange={set('salario_monto')}
                  placeholder="50,000"
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            {form.pais && (
              <p className="text-xs text-gray-400 mt-1">
                Moneda detectada para {form.pais}: {form.moneda}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Modalidad preferida</label>
            <select value={form.modalidad} onChange={set('modalidad')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Selecciona</option>
              {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={guardar} disabled={saving}
            className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {guardado && <span className="text-sm text-green-600">✓ Guardado correctamente</span>}
        </div>
      </div>
    </div>
  )
}
