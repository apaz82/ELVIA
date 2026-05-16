// Banner reutilizable de upgrade / límite / trial para páginas de la app
import { useNavigate } from 'react-router-dom'
import { RocketLaunch, WarningCircle, Clock } from '@phosphor-icons/react'
import { useTenant } from '../../context/TenantContext'

/**
 * @param {'limit_reached'|'upgrade_teaser'|'trial_warning'|'trial_expired'} tipo
 * @param {string} mensaje   - Texto opcional que sobreescribe el mensaje por defecto
 * @param {string} ctaText   - Texto del botón (por defecto "Ver planes")
 */
export default function PlanBanner({ tipo = 'upgrade_teaser', mensaje, ctaText, className = '' }) {
  const navigate = useNavigate()
  const { isB2B } = useTenant()

  // En B2B la empresa paga el programa: nunca mostramos CTAs de upgrade ni de pricing
  if (isB2B) return null

  const config = {
    limit_reached: {
      bg:    'bg-error/10 border-error/20',
      text:  'text-error',
      icono: <WarningCircle size={18} weight="fill" className="text-error shrink-0" />,
      msg:   'Llegaste al límite de tus créditos.',
    },
    upgrade_teaser: {
      bg:    'bg-primary/8 border-primary/20',
      text:  'text-primary',
      icono: <RocketLaunch size={18} weight="fill" className="text-primary shrink-0" />,
      msg:   'Desbloquea todo ELVIA con un plan de pago.',
    },
    trial_warning: {
      bg:    'bg-amber-50 border-amber-200',
      text:  'text-amber-700',
      icono: <Clock size={18} weight="fill" className="text-amber-500 shrink-0" />,
      msg:   'Tu período de prueba está por terminar.',
    },
    trial_expired: {
      bg:    'bg-amber-50 border-amber-300',
      text:  'text-amber-800',
      icono: <Clock size={18} weight="fill" className="text-amber-600 shrink-0" />,
      msg:   'Llegaste al límite de tu período de prueba.',
    },
  }

  const c = config[tipo] ?? config.upgrade_teaser

  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${c.bg} ${className}`}>
      <div className="flex items-center gap-2">
        {c.icono}
        <p className={`text-sm font-medium ${c.text}`}>{mensaje ?? c.msg}</p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        className="shrink-0 text-xs font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all whitespace-nowrap"
      >
        {ctaText ?? 'Ver planes →'}
      </button>
    </div>
  )
}
