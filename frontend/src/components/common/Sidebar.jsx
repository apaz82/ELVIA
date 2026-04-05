// Sidebar de navegación — desktop fijo, móvil como drawer
// Modo: normal (desbloqueado) o frosted-lock (onboarding pendiente)
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase,
  Folders, BookmarkSimple, Kanban,
  SignOut, X, Crown, House,
  MicrophoneStage, Books, LinkedinLogo, UsersThree, Target, Heart,
  Lock, SpinnerGap
} from '@phosphor-icons/react'

const INICIO = [
  { to: '/dashboard', label: 'Dashboard', Icon: House },
]

const HERRAMIENTAS = [
  { to: '/cv-optimizer',    label: 'CV Optimizer',          Icon: FileMagnifyingGlass },
  { to: '/linkedin-optima', label: 'LinkedIn Optimo',       Icon: LinkedinLogo, beta: true },
  { to: '/cv-vs-job',       label: 'CV vs Vacante',         Icon: MagnifyingGlass },
  { to: '/jobs',            label: 'Vacantes',              Icon: Briefcase },
  { to: '/entrevista',      label: 'Prepara tu Entrevista', Icon: MicrophoneStage, beta: true },
]

const MI_CARRERA = [
  { to: '/mis-cvs',      label: 'Mis CVs',      Icon: Folders },
  { to: '/mis-vacantes', label: 'Mis Vacantes', Icon: BookmarkSimple },
  { to: '/pipeline',     label: 'Pipeline',     Icon: Kanban },
]

const RECURSOS = [
  { to: '/biblioteca', label: 'Biblioteca', Icon: Books },
]

const HABLEMOS = [
  { to: '/expertos', label: 'Mentor Experto', Icon: UsersThree, beta: true },
]

// Item normal activo
function NavItem({ to, label, Icon, onClick, premium, beta }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
         ${isActive
           ? 'bg-primary text-on-primary shadow-card'
           : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={19} weight={isActive ? 'duotone' : 'regular'} />
          <span className="flex-1">{label}</span>
          {premium && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-600 border border-amber-300 rounded-full px-1.5 py-0.5">
              Pro
            </span>
          )}
          {beta && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-400/15 text-blue-500 border border-blue-300/60 rounded-full px-1.5 py-0.5">
              Beta
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// Item bloqueado (durante onboarding)
function LockedNavItem({ label, Icon, beta }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant/40 cursor-not-allowed select-none relative">
      <Icon size={19} weight="regular" className="opacity-40" />
      <span className="flex-1 opacity-40">{label}</span>
      {beta && (
        <span className="text-[9px] font-bold uppercase tracking-widest bg-slate-200 text-slate-400 border border-slate-200 rounded-full px-1.5 py-0.5 opacity-40">
          Beta
        </span>
      )}
      <Lock size={12} weight="bold" className="text-slate-400/60 shrink-0" />
    </div>
  )
}

// Botón especial para Gerente de Búsqueda — siempre resaltado
function GerenciaItem({ onClick, locked }) {
  return (
    <NavLink
      to="/proyecto-laboral"
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150
         ${isActive
           ? 'bg-slate-800 text-white shadow-md'
           : 'bg-slate-800/6 text-slate-700 border border-slate-200 hover:bg-slate-800/10 hover:text-slate-900'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Target size={19} weight={isActive ? 'fill' : 'duotone'} className={isActive ? 'text-teal-300' : 'text-teal-600'} />
          <span className="flex-1">Gerente de Búsqueda</span>
          {locked
            ? (
              <span className="text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 border bg-amber-50 text-amber-600 border-amber-200 animate-pulse">
                Activo
              </span>
            )
            : (
              <span className={`text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 border ${isActive ? 'bg-teal-400/20 text-teal-200 border-teal-400/40' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
                Pro
              </span>
            )
          }
        </>
      )}
    </NavLink>
  )
}

// Botón especial para Bienestar
function BienestarItem({ onClick, locked }) {
  if (locked) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed opacity-40 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 select-none">
        <Heart size={19} weight="duotone" className="text-rose-300" />
        <span className="flex-1 text-rose-400">Bienestar</span>
        <Lock size={12} weight="bold" className="text-slate-400" />
      </div>
    )
  }
  return (
    <NavLink
      to="/bienestar"
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 group
         ${isActive
           ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
           : 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 border border-rose-200 hover:from-rose-100 hover:to-pink-100'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Heart size={19} weight={isActive ? 'fill' : 'duotone'} className={`transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-rose-500'}`} />
          <span className="flex-1">Bienestar</span>
          <span className={`text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 border ${isActive ? 'bg-white/20 text-white border-white/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            Nuevo
          </span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user, logout, perfil, isAdmin, onboardingPendiente } = useAuth()
  const navigate = useNavigate()
  const locked = !!onboardingPendiente

  const handleLogout = async () => {
    await logout()
    onClose?.()
    navigate('/')
  }

  // Cuando está bloqueado, interceptar clicks en el overlay móvil
  const handleLockedNavClick = (e) => {
    e.preventDefault()
  }

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-on-surface/30 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-surface-container-lowest border-r border-outline-variant/20
        shadow-float transition-transform duration-250
        md:translate-x-0 md:shadow-none
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 h-24 border-b border-outline-variant/20 shrink-0">
          <Link to={locked ? '/proyecto-laboral' : '/'} onClick={onClose} className="flex items-center">
            <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA-CV" className="h-[4.5rem] w-auto object-contain" />
          </Link>
          <button onClick={onClose} className="md:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Banner de progreso — solo cuando está bloqueado */}
        {locked && (
          <div className="px-3 pt-3 pb-0">
            <div className="bg-gradient-to-r from-violet-50 to-teal-50 border border-violet-200 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <SpinnerGap size={12} weight="bold" className="text-violet-500 animate-spin" />
                <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Configurando tu perfil</span>
              </div>
              <p className="text-[10px] text-violet-600/80 leading-snug">
                Completa el Gerente de Búsqueda para desbloquear todas las funciones
              </p>
            </div>
          </div>
        )}

        {/* Nav scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

          {/* Inicio */}
          <div className="space-y-0.5">
            {locked
              ? <LockedNavItem label="Dashboard" Icon={House} />
              : INICIO.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)
            }
          </div>

          {/* Gerente de Búsqueda — siempre activo */}
          {user && (
            <div>
              <GerenciaItem onClick={onClose} locked={locked} />
            </div>
          )}

          {/* Herramientas */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
              Herramientas
            </p>
            <div className="space-y-0.5">
              {locked
                ? HERRAMIENTAS.map(item => <LockedNavItem key={item.to} {...item} />)
                : HERRAMIENTAS.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)
              }
            </div>
          </div>

          {/* Mi Carrera */}
          {user && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
                Mi Carrera
              </p>
              <div className="space-y-0.5">
                {locked
                  ? MI_CARRERA.map(item => <LockedNavItem key={item.to} {...item} />)
                  : MI_CARRERA.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)
                }
              </div>
            </div>
          )}

          {/* Recursos */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
              Recursos
            </p>
            <div className="space-y-0.5">
              {locked
                ? <LockedNavItem label="Biblioteca" Icon={Books} />
                : RECURSOS.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)
              }
            </div>
            <div className="my-2 mx-3 h-px bg-rose-100" />
            <BienestarItem onClick={onClose} locked={locked} />
          </div>

          {/* Hablemos */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
              Hablemos
            </p>
            <div className="space-y-0.5">
              {locked
                ? <LockedNavItem label="Mentor Experto" Icon={UsersThree} beta />
                : HABLEMOS.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)
              }
            </div>
          </div>
        </nav>

        {/* Footer del sidebar */}
        {user && (
          <div className="px-3 py-4 border-t border-outline-variant/20 space-y-1 shrink-0">
            {isAdmin && !locked && (
              <NavItem to="/admin" label="Admin Panel" Icon={Crown} onClick={onClose} />
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-container/40 transition-colors"
            >
              <SignOut size={19} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* CTA para no logueados */}
        {!user && (
          <div className="px-4 py-4 border-t border-outline-variant/20 shrink-0">
            <Link
              to="/auth"
              onClick={onClose}
              className="btn-primary block text-center text-sm w-full"
            >
              Iniciar sesión
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
