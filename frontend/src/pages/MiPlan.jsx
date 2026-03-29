// Mi Plan — plan actual, créditos y programa de referidos
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { Star, Copy, ShareNetwork } from '@phosphor-icons/react'

export default function MiPlan() {
  const { user, loading: authLoading, perfil, creditosRestantes, LIMITE_PLAN, usageCount } = useAuth()
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${creditosRestantes === 0 ? 'text-error' : creditosRestantes === 1 ? 'text-amber-500' : 'text-on-surface'}`}>
                {creditosRestantes}
              </span>
              <span className="text-on-surface-variant/70 text-base">/ {LIMITE_PLAN} créditos disponibles</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-1">Plan gratuito · {usageCount} utilizados</p>
            <div className="w-56 bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-full transition-all ${creditosRestantes === 0 ? 'bg-error' : creditosRestantes === 1 ? 'bg-amber-400' : 'bg-primary'}`}
                style={{ width: `${(creditosRestantes / LIMITE_PLAN) * 100}%` }}
              />
            </div>
            {creditosRestantes === 0 && (
              <p className="text-xs text-error mt-2 font-medium">Sin créditos disponibles — mejora tu plan para continuar.</p>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 shrink-0">
            <button
              onClick={() => navigate('/pricing')}
              className="bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:brightness-110 transition-colors shadow-sm">
              Ver planes y precios →
            </button>
            <p className="text-xs text-on-surface-variant/70">Desde MXN 299/mes · Sin renovación automática</p>
          </div>
        </div>

        {/* Detalle del plan */}
        <div className="mt-5 pt-5 border-t border-outline-variant/20 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Plan',       value: 'Gratuito' },
            { label: 'Créditos',   value: `${LIMITE_PLAN} / mes` },
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
