// Página de bienvenida — se muestra una sola vez después del primer registro
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'

const PAISES_LATAM = [
  'México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Venezuela',
  'Ecuador', 'Bolivia', 'Uruguay', 'Paraguay', 'Costa Rica', 'Guatemala',
  'Honduras', 'El Salvador', 'Nicaragua', 'Panamá', 'República Dominicana',
  'Cuba', 'España', 'Estados Unidos', 'Canadá', 'Brasil', 'Otro',
]

const PASOS = ['Nombre', 'Ubicación', 'Objetivo']

export default function Onboarding() {
  const { user, loading: authLoading, refreshPerfil } = useAuth()
  const navigate = useNavigate()

  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    pais: '',
    ciudad: '',
    cargo_objetivo: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) navigate('/auth')
  }, [user, authLoading])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const siguiente = () => setPaso(p => p + 1)
  const anterior  = () => setPaso(p => p - 1)

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    setSaving(true)
    setError('')
    const nombreCompleto = [form.nombre.trim(), form.apellido.trim()].filter(Boolean).join(' ')
    const { error: err } = await supabase
      .from('profiles')
      .update({
        nombre:         nombreCompleto,
        pais:           form.pais,
        ciudad:         form.ciudad,
        cargo_objetivo: form.cargo_objetivo,
      })
      .eq('id', user.id)
    setSaving(false)
    if (err) { setError('Error al guardar. Intenta de nuevo.'); return }
    await refreshPerfil()
    navigate('/cv-optimizer')
  }

  if (authLoading) return null

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-lg">

        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">CV</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">¡Hola, bienvenido!</h1>
          <p className="mt-2 text-gray-500 text-sm">Cuéntanos un poco sobre ti para personalizar tu experiencia.</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {PASOS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                ${i < paso ? 'bg-green-500 text-white' : i === paso ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < paso ? '✓' : i + 1}
              </div>
              {i < PASOS.length - 1 && (
                <div className={`h-0.5 w-8 transition-colors ${i < paso ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Tarjeta del paso */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {/* Paso 0: Nombre */}
          {paso === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">¿Cómo te llamas?</h2>
                <p className="text-sm text-gray-500">Este nombre se usará para validar que el CV que subes es tuyo.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={set('nombre')}
                  placeholder="Ana"
                  autoFocus
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Apellido</label>
                <input
                  type="text"
                  value={form.apellido}
                  onChange={set('apellido')}
                  placeholder="García"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={() => { if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }; setError(''); siguiente() }}
                className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors">
                Continuar →
              </button>
            </div>
          )}

          {/* Paso 1: Ubicación */}
          {paso === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">¿Dónde estás?</h2>
                <p className="text-sm text-gray-500">Esto nos ayuda a mostrarte vacantes y monedas relevantes para tu región.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">País</label>
                <select
                  value={form.pais}
                  onChange={set('pais')}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona tu país</option>
                  {PAISES_LATAM.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Ciudad</label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={set('ciudad')}
                  placeholder="Ciudad de México"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={anterior}
                  className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-xl hover:border-gray-400 transition-colors">
                  ← Atrás
                </button>
                <button onClick={siguiente}
                  className="flex-1 bg-primary text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors">
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Objetivo profesional */}
          {paso === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">¿A qué posición aspiras?</h2>
                <p className="text-sm text-gray-500">Tu cargo objetivo nos ayuda a encontrar las vacantes más relevantes para ti.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Cargo objetivo</label>
                <input
                  type="text"
                  value={form.cargo_objetivo}
                  onChange={set('cargo_objetivo')}
                  placeholder="ej. Gerente de Marketing, Director de RH..."
                  autoFocus
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Beneficios rápidos */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {[
                  '2 análisis de CV gratuitos',
                  'Búsqueda de vacantes con IA',
                  'Seguimiento de aplicaciones',
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    {b}
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3">
                <button onClick={anterior}
                  className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-xl hover:border-gray-400 transition-colors">
                  ← Atrás
                </button>
                <button onClick={guardar} disabled={saving}
                  className="flex-1 bg-primary text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : '¡Empezar!'}
                </button>
              </div>
              <button onClick={guardar} disabled={saving}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1">
                Omitir este paso →
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Puedes completar o editar tu perfil en cualquier momento desde <strong>Mi Perfil</strong>.
        </p>
      </div>
    </div>
  )
}
