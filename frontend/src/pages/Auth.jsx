import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'

export default function Auth() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()

  const [modo, setModo] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Si ya está autenticado, redirigir al inicio
  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMensaje('')

    try {
      if (modo === 'login') {
        const { error } = await login(email, password)
        if (error) setError(error.message)
      } else {
        const { error } = await register(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMensaje('Revisa tu email para confirmar el registro.')
        }
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">CV</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {modo === 'login' ? 'Accede a tus análisis guardados' : '2 análisis gratuitos al registrarte'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {mensaje}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {modo === 'login' ? 'Entrar' : 'Registrarme'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => { setModo(modo === 'login' ? 'register' : 'login'); setError(''); setMensaje('') }}
              className="text-primary font-medium hover:underline"
            >
              {modo === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
