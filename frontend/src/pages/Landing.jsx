import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatsSection from '../components/cv-optimizer/StatsSection'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div className="relative overflow-hidden bg-white">
        {/* Glow sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(123,92,240,0.07) 0%, transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="badge-pill mx-auto w-fit mb-8">
            ✦ Formato Harvard · IA sin bias · LATAM
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.06] tracking-tight mb-6">
            Tu CV, optimizado con{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal">
              inteligencia artificial
            </span>
          </h1>

          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Sin inventar información — solo mejoramos lo que ya tienes para que destaque ante los reclutadores.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            {user ? (
              // Usuario ya logueado — ir directo a la herramienta
              <button
                onClick={() => navigate('/cv-optimizer')}
                className="bg-primary text-white font-semibold px-8 py-3.5 rounded-pill hover:bg-primary-dark transition-colors shadow-glow-purple text-sm">
                Ir al optimizador →
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth')}
                  className="bg-primary text-white font-semibold px-8 py-3.5 rounded-pill hover:bg-primary-dark transition-colors shadow-glow-purple text-sm">
                  Regístrate gratis →
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="border border-gray-200 text-gray-700 font-medium px-8 py-3.5 rounded-pill hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm">
                  Ya tengo cuenta
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="text-teal font-bold">✓</span> 2 análisis gratis
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-teal font-bold">✓</span> Sin tarjeta de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-teal font-bold">✓</span> Resultado inmediato
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <StatsSection />

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">¿Qué hacemos?</p>
          <h2 className="text-3xl font-bold text-gray-900">Todo lo que necesitas para conseguir el trabajo</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: '📄',
              title: 'CV Optimizer',
              desc: 'Sube tu CV y obtén una versión optimizada en formato Harvard con lenguaje de impacto.',
              cta: 'Optimizar CV →',
              href: '/cv-optimizer',
              color: 'bg-purple-50 border-purple-100',
            },
            {
              icon: '🎯',
              title: 'CV vs Vacante',
              desc: 'Analiza qué tan compatible es tu CV con una vacante específica y obtén un % de match.',
              cta: 'Analizar compatibilidad →',
              href: '/cv-vs-job',
              color: 'bg-teal-50 border-teal-100',
            },
            {
              icon: '🔍',
              title: 'Vacantes Similares',
              desc: 'Descubre vacantes relevantes basadas en tu perfil y postula con un CV optimizado.',
              cta: 'Buscar vacantes →',
              href: '/jobs',
              color: 'bg-blue-50 border-blue-100',
            },
          ].map((f, i) => (
            <div key={i} className={`rounded-2xl border p-6 ${f.color} hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => navigate(f.href)}>
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{f.desc}</p>
              <span className="text-sm font-semibold text-primary">{f.cta}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
