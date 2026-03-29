// Pantalla de bloqueo estándar para funcionalidades Pro o trial expirado
import { useNavigate } from 'react-router-dom'
import { Lock, RocketLaunch, ArrowLeft } from '@phosphor-icons/react'

/**
 * @param {object} props
 * @param {string}    props.titulo       - Nombre de la funcionalidad bloqueada
 * @param {string}    props.descripcion  - Qué hace la funcionalidad (para motivar el upgrade)
 * @param {ReactNode} props.icono        - Icono representativo (Phosphor component)
 * @param {string[]}  props.beneficios   - Lista opcional de bullets del plan de pago
 * @param {'pro'|'trial'} props.tipo     - 'pro' = solo planes de pago | 'trial' = trial expirado
 */
export default function ProGate({ titulo, descripcion, icono, beneficios = [], tipo = 'pro' }) {
  const navigate = useNavigate()

  const esTrial = tipo === 'trial'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 text-center shadow-sm">

        {/* Icono con candado superpuesto */}
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/40">
            {icono ?? <Lock size={40} />}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow">
            <Lock size={14} weight="fill" className="text-white" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-on-surface mb-1">{titulo}</h2>

        {/* Badge de tipo */}
        {esTrial ? (
          <span className="inline-block text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full mb-4">
            Tu período de prueba ha terminado
          </span>
        ) : (
          <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
            Función exclusiva Pro
          </span>
        )}

        {/* Descripción */}
        <p className="text-sm text-on-surface-variant mb-6">{descripcion}</p>

        {/* Beneficios opcionales */}
        {beneficios.length > 0 && (
          <ul className="text-left space-y-2 mb-6">
            {beneficios.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                <span className="text-primary mt-0.5">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:brightness-110 transition-all shadow-sm"
          >
            <RocketLaunch size={18} weight="fill" />
            Ver planes de inversión
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors py-2"
          >
            <ArrowLeft size={16} />
            Regresar al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
