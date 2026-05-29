// Header superior — glassmorphism, hamburger + usuario + badge de plan
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { List, SignOut, Sparkle, Crown } from '@phosphor-icons/react'

// Configuración de badges por plan (solo los 3 planes activos B2C)
const PLAN_CONFIG = {
  free:        { label: 'Plan Gratuito',   icon: Sparkle, bg: 'bg-slate-700/80',     text: 'text-slate-100',  border: 'border-slate-600/50' },
  mensual:     { label: 'Plan Mensual',    icon: Crown,   bg: 'bg-emerald-600/90',   text: 'text-white',      border: 'border-emerald-400/40' },
  trimestral:  { label: 'Plan Trimestral', icon: Crown,   bg: 'bg-blue-600/90',      text: 'text-white',      border: 'border-blue-400/40' },
}

export default function Header({ onMenuToggle }) {
  const { user, perfil, logout } = useAuth()
  const { tenant, isB2B, showTenantLogo, showElviaLogo, elviaProminent, showProgramBadge, programBadgeText, tenantResolved } = useTenant()
  const navigate = useNavigate()


  const planKey = perfil?.plan || 'free'
  const planCfg = PLAN_CONFIG[planKey] || PLAN_CONFIG['free']
  const PlanIcon = planCfg.icon

  // Gradiente tenant-aware: B2B usa branding del tenant
  const headerStyle = isB2B
    ? { background: `linear-gradient(90deg, ${tenant.secondary_color} 0%, ${tenant.primary_color} 100%)` }
    : undefined
  const headerClass = isB2B
    ? 'sticky top-0 z-20 h-24 flex items-center px-5 gap-4 shadow-md'
    : 'sticky top-0 z-20 h-24 flex items-center px-5 gap-4 bg-gradient-to-r from-[#0A3D2A] to-[#0D2B4E] shadow-md'

  const nombre = perfil?.nombre1
    ? `${perfil.nombre1}${perfil.apellido1 ? ' ' + perfil.apellido1 : ''}`
    : user?.email?.split('@')[0]


  // Evita flash B2C→B2B: mostrar header neutro hasta que el tenant esté resuelto
  if (!tenantResolved) {
    return <header className="sticky top-0 z-20 h-24 bg-slate-900 shadow-md" />
  }

  return (
    <header className={headerClass} style={headerStyle}>

      {/* Hamburguesa — móvil */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-1 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
        aria-label="Abrir menú"
      >
        <List size={22} />
      </button>

      {/* Logo — solo en móvil; respeta branding_mode del tenant */}
      <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
        {isB2B && !elviaProminent ? (
          <>
            {showTenantLogo && (
              <img src={tenant.logo_url} alt={tenant.name} className="h-[42px] object-contain transition-all duration-300 hover:scale-105" />
            )}
            {showElviaLogo && (
              <>
                {showTenantLogo && <div className="h-4 w-px bg-white/30" />}
                <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-4 opacity-80 object-contain" />
              </>
            )}
          </>
        ) : (
          <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-10 w-auto object-contain py-1" />
        )}
      </Link>

      <div className="flex-1" />

      {/* Info usuario — desktop */}
      {user ? (
        <div className="hidden md:flex items-center gap-3">
          {/* Badge: B2B muestra "Programa {tenant}" si showProgramBadge=true; B2C muestra plan freemium */}
          {isB2B && showProgramBadge ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border bg-white/15 text-white border-white/20 backdrop-blur-sm">
              <Crown size={13} weight="duotone" />
              {programBadgeText}
            </div>
          ) : isB2B ? null : (
            <Link
              to="/mi-plan"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all hover:opacity-90 hover:scale-105 ${planCfg.bg} ${planCfg.text} ${planCfg.border}`}
            >
              <PlanIcon size={13} weight="duotone" />
              {planCfg.label}
            </Link>
          )}

          {/* Avatar + nombre — sin dropdown */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {(perfil?.nombre1 || user.email)?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-white truncate max-w-[140px]">
              {nombre}
            </span>
          </div>

          <button
            onClick={async () => { await logout(); navigate('/') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-white/90 hover:text-white transition-all text-sm shrink-0"
          >
            <SignOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-2">
          <Link to="/auth"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/10">
            Iniciar sesión
          </Link>
          <Link to="/auth?register=true" className="btn-primary text-sm">
            Registrarse gratis
          </Link>
        </div>
      )}
    </header>
  )
}
