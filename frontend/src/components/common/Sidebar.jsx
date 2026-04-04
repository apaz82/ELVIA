// Sidebar de navegación — desktop fijo, móvil como drawer
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase,
  Folders, BookmarkSimple, Kanban,
  SignOut, X, Crown, House,
  MicrophoneStage, Books, LinkedinLogo, UsersThree, Target, Heart
} from '@phosphor-icons/react'

const INICIO = [
  { to: '/dashboard', label: 'Dashboard', Icon: House },
]

// Sección especial resaltada — encima de Herramientas
const PLANIFICACION = [
  { to: '/proyecto-laboral', label: 'Gerente de Búsqueda', Icon: Target, premium: true },
]

const HERRAMIENTAS = [
  { to: '/cv-optimizer',    label: 'CV Optimizer',             Icon: FileMagnifyingGlass },
  { to: '/linkedin-optima', label: 'LinkedIn Optimo',          Icon: LinkedinLogo, beta: true },
  { to: '/cv-vs-job',       label: 'CV vs Vacante',            Icon: MagnifyingGlass     },
  { to: '/jobs',            label: 'Vacantes',                 Icon: Briefcase           },
  { to: '/entrevista',      label: 'Prepara tu Entrevista',    Icon: MicrophoneStage, beta: true },
]

const MI_CARRERA = [
  { to: '/mis-cvs',      label: 'Mis CVs',      Icon: Folders        },
  { to: '/mis-vacantes', label: 'Mis Vacantes', Icon: BookmarkSimple },
  { to: '/pipeline',     label: 'Pipeline',     Icon: Kanban         },
]

const RECURSOS = [
  { to: '/biblioteca', label: 'Biblioteca', Icon: Books },
]

const HABLEMOS = [
  { to: '/expertos', label: 'Mentor Experto', Icon: UsersThree, beta: true },
]

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

// Botón especial para Gerente de Búsqueda — siempre resaltado
function GerenciaItem({ onClick }) {
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
          <span className={`text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 border ${isActive ? 'bg-teal-400/20 text-teal-200 border-teal-400/40' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
            Pro
          </span>
        </>
      )}
    </NavLink>
  )
}

// Botón especial para Bienestar — rose gradient, diferenciado de todos los demás
function BienestarItem({ onClick }) {
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
          <Heart
            size={19}
            weight={isActive ? 'fill' : 'duotone'}
            className={`transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-rose-500'}`}
          />
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
  const { user, logout, perfil, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    onClose?.()
    navigate('/')
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
          <Link to="/" onClick={onClose} className="flex items-center">
            <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA-CV" className="h-[4.5rem] w-auto object-contain" />
          </Link>
          {/* Cerrar en móvil */}
          <button onClick={onClose} className="md:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

          {/* Inicio */}
          <div className="space-y-0.5">
            {INICIO.map(item => (
              <NavItem key={item.to} {...item} onClick={onClose} />
            ))}
          </div>

          {/* Gerente de Búsqueda — resaltado siempre */}
          {user && (
            <div>
              <GerenciaItem onClick={onClose} />
            </div>
          )}

          {/* Herramientas */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
              Herramientas
            </p>
            <div className="space-y-0.5">
              {HERRAMIENTAS.map(item => (
                <NavItem key={item.to} {...item} onClick={onClose} />
              ))}
            </div>
          </div>

          {/* Mi Carrera — solo si está logueado */}
          {user && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
                Mi Carrera
              </p>
              <div className="space-y-0.5">
                {MI_CARRERA.map(item => (
                  <NavItem key={item.to} {...item} onClick={onClose} />
                ))}
              </div>
            </div>
          )}

          {/* Recursos */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
              Recursos
            </p>
            <div className="space-y-0.5">
              {RECURSOS.map(item => (
                <NavItem key={item.to} {...item} onClick={onClose} />
              ))}
            </div>
            {/* Separador visual */}
            <div className="my-2 mx-3 h-px bg-rose-100" />
            <BienestarItem onClick={onClose} />
          </div>

          {/* Hablemos */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-3 mb-2">
              Hablemos
            </p>
            <div className="space-y-0.5">
              {HABLEMOS.map(item => (
                <NavItem key={item.to} {...item} onClick={onClose} />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer del sidebar */}
        {user && (
          <div className="px-3 py-4 border-t border-outline-variant/20 space-y-1 shrink-0">
            {/* Admin — solo si es super_admin o company_admin */}
            {isAdmin && (
              <NavItem to="/admin" label="Admin Panel" Icon={Crown} onClick={onClose} />
            )}

            {/* Cerrar sesión */}
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
