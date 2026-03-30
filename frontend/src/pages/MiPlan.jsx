// Mi Plan — plan actual, créditos y programa de referidos
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Star, Copy, ShareNetwork, CalendarBlank, Crown, Lightning, Sparkle } from '@phosphor-icons/react'

// Mapeo de IDs de plan a etiquetas legibles
const PLAN_LABELS = {
  free:       'Gratuito',
  semanal:    'Pro Semanal',
  mensual:    'Pro Mensual',
  trimestral: 'Pro Trimestral',
}

const PLAN_ICONS = {
  free:       <Sparkle size={18} weight="duotone" className="text-gray-400" />,
  semanal:    <CalendarBlank size={18} weight="duotone" className="text-emerald-500" />,
  mensual:    <Lightning size={18} weight="duotone" className="text-primary" />,
  trimestral: <Crown size={18} weight="duotone" className="text-amber-500" />,
}

export default function MiPlan() {
  const { user, loading: authLoading, perfil, plan, isPaidPlan, creditosRestantes, LIMITE_PLAN, usageCount, trialDaysLeft, trialExpired } = useAuth()
  const navigate = useNavigate()
  const [copiado, setCopiado] = useState(false)

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

  const planLabel   = PLAN_LABELS[plan] || plan || 'Gratuito'
  const planIcon    = PLAN_ICONS[plan]  || PLAN_ICONS.free
  const expiresAt   = perfil?.plan_expires_at ? new Date(perfil.plan_expires_at) : null
  const diasRestantes = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  // Créditos: para plan pago son "ilimitados"; para free usar el contador
  const creditosDisplay    = isPaidPlan ? '∞' : creditosRestantes
  const limitDisplay       = isPaidPlan ? '∞' : LIMITE_PLAN
  const barPct             = isPaidPlan ? 100 : Math.round((creditosRestantes / LIMITE_PLAN) * 100)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-on-surface">Mi Plan</h1>
        <p className="mt-0.5 text-on-surface-variant text-sm">{user?.email}</p>
      </div>

      {/* Plan actual */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
        <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Plan actual</h2>

        {/* Badge plan */}
        <div className="flex items-center gap-2 mb-4">
          {planIcon}
          <span className={`text-lg font-black ${isPaidPlan ? 'text-primary' : 'text-on-surface'}`}>
            {planLabel}
          </span>
          {isPaidPlan && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">Activo</span>
          )}
        </div>

        {/* Fecha de expiración (planes de pago) */}
        {expiresAt && (
          <div className="mb-4 flex items-center gap-2 text-sm text-on-surface-variant">
            <CalendarBlank size={14} weight="duotone" className="text-primary shrink-0" />
            {diasRestantes > 0 ? (
              <span>
                Vence el <strong className="text-on-surface">{expiresAt.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                {' '}— <span className={`font-semibold ${diasRestantes <= 3 ? 'text-amber-600' : 'text-primary'}`}>{diasRestantes} día{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''}</span>
              </span>
            ) : (
              <span className="text-error font-semibold">Plan vencido el {expiresAt.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            )}
          </div>
        )}

        {/* Trial para free */}
        {!isPaidPlan && !trialExpired && trialDaysLeft > 0 && trialDaysLeft <= 14 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <Star size={14} weight="fill" className="shrink-0" />
            <span>Prueba gratuita: <strong>{trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''}</strong> restante{trialDaysLeft !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${!isPaidPlan && creditosRestantes === 0 ? 'text-error' : !isPaidPlan && creditosRestantes === 1 ? 'text-amber-500' : 'text-on-surface'}`}>
                {creditosDisplay}
              </span>
              <span className="text-on-surface-variant/70 text-base">/ {limitDisplay} créditos disponibles</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-1">{usageCount} utilizados</p>
            <div className="w-56 bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-full transition-all ${!isPaidPlan && creditosRestantes === 0 ? 'bg-error' : !isPaidPlan && creditosRestantes === 1 ? 'bg-amber-400' : 'bg-primary'}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            {!isPaidPlan && creditosRestantes === 0 && (
              <p className="text-xs text-error mt-2 font-medium">Sin créditos disponibles — mejora tu plan para continuar.</p>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 shrink-0">
            <button
              onClick={() => navigate('/pricing')}
              className="bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:brightness-110 transition-colors shadow-sm">
              {isPaidPlan ? 'Ver todos los planes →' : 'Ver planes y precios →'}
            </button>
            <p className="text-xs text-on-surface-variant/70">Desde MXN 299/mes · Sin renovación automática</p>
          </div>
        </div>

        {/* Detalle del plan */}
        <div className="mt-5 pt-5 border-t border-outline-variant/20 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Plan',       value: planLabel },
            { label: 'Créditos',   value: isPaidPlan ? 'Ilimitado' : `${LIMITE_PLAN} / mes` },
            { label: 'Historial',  value: '30 días' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-on-surface-variant/70">{label}</p>
              <p className="text-sm font-semibold text-on-surface mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Programa de referidos */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
        <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Programa de referidos</h2>
        <p className="text-sm text-on-surface-variant mb-5">
          Comparte tu código y gana <strong className="text-on-surface">2 créditos</strong> por cada persona que se registre con él.
        </p>

        {perfil?.referral_code ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-3 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 flex-1">
                <span className="text-xs text-on-surface-variant/70 font-medium shrink-0">Tu código:</span>
                <span className="font-mono font-bold text-on-surface tracking-[0.2em] text-sm">
                  {perfil.referral_code.toUpperCase()}
                </span>
              </div>
              <button onClick={copiarCodigo}
                className="text-sm font-medium border border-outline-variant/50 rounded-xl px-5 py-3 flex items-center gap-2 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shrink-0">
                <Copy size={16} />
                {copiado ? '¡Copiado!' : 'Copiar código'}
              </button>
              <button onClick={compartirLink}
                className="text-sm font-semibold bg-primary text-white rounded-xl px-5 py-3 flex items-center gap-2 hover:brightness-110 transition-colors shrink-0 shadow-sm">
                <ShareNetwork size={16} weight="bold" />
                Compartir link
              </button>
            </div>
            {copiado && (
              <p className="text-xs text-[#E8541A] font-semibold flex items-center gap-1"><Star size={12} weight="fill" /> ¡Enlace copiado al portapapeles!</p>
            )}
          </div>
        ) : (
          <div className="text-sm text-on-surface-variant/50">Cargando código de referido...</div>
        )}

        {perfil?.bonus_credits > 0 && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
            <Star size={18} weight="duotone" className="text-primary" />
            <p className="text-sm text-primary font-semibold">
              Has ganado <strong>{perfil.bonus_credits} crédito{perfil.bonus_credits !== 1 ? 's' : ''}</strong> por referidos
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
