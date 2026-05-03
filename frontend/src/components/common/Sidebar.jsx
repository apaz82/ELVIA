// Sidebar de navegación — desktop fijo, móvil como drawer
// Modo: normal (desbloqueado) o frosted-lock (onboarding pendiente)
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase,
  Folders, BookmarkSimple, Kanban,
  SignOut, X, Crown, House,
  MicrophoneStage, Books, LinkedinLogo, UsersThree, Target, Heart,
  Lock, SpinnerGap, ChartBar
} from '@phosphor-icons/react'

const INICIO = [
  { to: '/dashboard', label: 'Dashboard', Icon: House },
]

const HERRAMIENTAS = [
  { to: '/cv-optimizer',    label: 'CV Optimizer',          Icon: FileMagnifyingGlass },
  { to: '/linkedin-pro',     label: 'LinkedIn® Pro',          Icon: LinkedinLogo, beta: true },
  { to: '/cv-vs-job',       label: 'CV vs Vacante',         Icon: MagnifyingGlass },
  { to: '/jobs',            label: 'Vacantes',              Icon: Briefcase },
  { to: '/entrevista',      label: 'Prepara tu Entrevista', Icon: MicrophoneStage, beta: true },
]

const MI_CARRERA = [
  { to: '/mis-cvs',       label: 'Mis CVs',       Icon: Folders },
  { to: '/mis-vacantes',  label: 'Mis Vacantes',  Icon: BookmarkSimple },
  { to: '/pipeline',      label: 'Pipeline',      Icon: Kanban },
  { to: '/mis-metricas',  label: 'Mis Métricas',  Icon: ChartBar },
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

// Item bloqueado por progreso insuficiente (post-onboarding, progreso < 100%)
function FeatureLockedNavItem({ label, Icon, beta }) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant/40 cursor-not-allowed select-none">
        <Icon size={19} weight="regular" className="opacity-40" />
        <span className="flex-1 opacity-40">{label}</span>
        {beta && (
          <span className="text-[9px] font-bold uppercase tracking-widest bg-slate-200 text-slate-400 border border-slate-200 rounded-full px-1.5 py-0.5 opacity-40">
            Beta
          </span>
        )}
        <Lock size={12} weight="bold" className="text-slate-400/60 shrink-0" />
      </div>
      {/* Tooltip — desktop solamente */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 hidden md:group-hover:block pointer-events-none">
        <div className="bg-slate-800 text-white text-[11px] leading-snug font-medium rounded-lg px-3 py-2 w-52 shadow-lg">
          Completa el Gerente de Búsqueda al 100% para desbloquear esta función
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </div>
      </div>
    </div>
  )
}

// Botón especial para Gerente de Búsqueda — siempre resaltado, siempre al tope
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
          <Target size={19} weight={isActive ? 'fill' : 'duotone'} className={`shrink-0 ${isActive ? 'text-teal-300' : 'text-teal-600'}`} />
          <span className="flex-1 leading-tight text-[12.5px]">Autoconocimiento - Gerente de proyecto laboral</span>
          {locked
            ? (
              <span className="text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 border bg-amber-50 text-amber-600 border-amber-200 animate-pulse shrink-0">
                Activo
              </span>
            )
            : (
              <span className={`text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 border shrink-0 ${isActive ? 'bg-teal-400/20 text-teal-200 border-teal-400/40' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
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
  const { user, logout, perfil, isAdmin, onboardingPendiente, featuresDesbloqueadas, jpLoaded } = useAuth()
  const navigate = useNavigate()
  const locked = !!onboardingPendiente
  // featureLocked: post-onboarding pero progreso < 100% (usar jpLoaded para evitar flash)
  const featureLocked = jpLoaded && !locked && !featuresDesbloqueadas

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
            <img src="/elvia-logo-transparent.png" alt="ELVIA" className="h-[4.5rem] w-auto object-contain" />
          </Link>
          <button onClick={onClose} className="md:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Banner onboarding */}
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
        {/* Banner progreso insuficiente (post-onboarding) */}
        {featureLocked && (
          <div className="px-3 pt-3 pb-0">
            <div className="bg-green-900 border border-green-700 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Target size={12} weight="bold" className="text-green-300" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Desbloquea las herramientas</span>
              </div>
              <p className="text-[11px] text-green-100 leading-snug font-medium">
                Llena toda la información de autoconocimiento para desbloquear las funcionalidades.
              </p>
            </div>
          </div>
        )}

        {/* Nav scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

          {/* Gerente de Proyecto — PRIMERO, siempre visible */}
          {user && (
            <div>
              <GerenciaItem onClick={onClose} locked={locked} />
            </div>
          )}

          {/* Dashboard — gateado por progreso */}
          <div className="space-y-0.5">
            {locked
              ? <LockedNavItem label="Dashboard" Icon={House} />
              : featureLocked
                ? <FeatureLockedNavItem label="Dashboard" Icon={House} />
                : INICIO.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)
            }
          </div>

          {/* Herramientas */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
              Herramientas
            </p>
            <div className="space-y-0.5">
              {locked
                ? HERRAMIENTAS.map(item => <LockedNavItem key={item.to} {...item} />)
                : featureLocked
                  ? HERRAMIENTAS.map(item => <FeatureLockedNavItem key={item.to} {...item} />)
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
                  : featureLocked
                    ? MI_CARRERA.map(item => <FeatureLockedNavItem key={item.to} {...item} />)
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
                : featureLocked
                  ? <FeatureLockedNavItem label="Biblioteca" Icon={Books} />
                  : RECURSOS.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)
              }
            </div>
            <div className="my-2 mx-3 h-px bg-rose-100" />
            <BienestarItem onClick={onClose} locked={locked || featureLocked} />
          </div>

          {/* Hablemos */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
              Hablemos
            </p>
            <div className="space-y-0.5">
              {locked
                ? <LockedNavItem label="Mentor Experto" Icon={UsersThree} beta />
                : featureLocked
                  ? <FeatureLockedNavItem label="Mentor Experto" Icon={UsersThree} beta />
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
