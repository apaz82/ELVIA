// Sidebar de navegación — desktop fijo, móvil como drawer
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase,
  Folders, BookmarkSimple, Kanban,
  UserCircle, SignOut, Coins, X, Crown, House,
  MicrophoneStage, Books, LinkedinLogo, UsersThree, Shapes
} from '@phosphor-icons/react'

const INICIO = [
  { to: '/dashboard', label: 'Dashboard', Icon: House },
]

const HERRAMIENTAS = [
  { to: '/cv-optimizer', label: 'CV Optimizer',  Icon: FileMagnifyingGlass },
  { to: '/cv-vs-job',    label: 'CV vs Vacante', Icon: MagnifyingGlass     },
  { to: '/jobs',         label: 'Vacantes',      Icon: Briefcase           },
]

const MI_CARRERA = [
  { to: '/mis-cvs',      label: 'Mis CVs',      Icon: Folders        },
  { to: '/mis-vacantes', label: 'Mis Vacantes', Icon: BookmarkSimple },
  { to: '/pipeline',     label: 'Pipeline',     Icon: Kanban         },
]

const RECURSOS = [
  { to: '/biblioteca',      label: 'Biblioteca',      Icon: Books           },
  { to: '/infografias',     label: 'Infografías',     Icon: Shapes          },
  { to: '/linkedin-optima', label: 'LinkedIn Optimo', Icon: LinkedinLogo,   beta: true },
  { to: '/entrevista',      label: 'Entrevista',      Icon: MicrophoneStage, beta: true },
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

export default function Sidebar({ open, onClose }) {
  const { user, logout, creditosRestantes, LIMITE_PLAN, perfil } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    onClose?.()
    navigate('/')
  }

  const creditColor =
    creditosRestantes === 0 ? 'text-error'
    : creditosRestantes === 1 ? 'text-amber-600'
    : 'text-secondary'

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
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

          {/* Inicio */}
          <div>
            <div className="space-y-0.5">
              {INICIO.map(item => (
                <NavItem key={item.to} {...item} onClick={onClose} />
              ))}
            </div>
          </div>

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
            {/* Créditos */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container-low">
              <Coins size={17} weight="duotone" className={creditColor} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-on-surface">
                  {creditosRestantes} / {LIMITE_PLAN} créditos
                </p>
                <div className="w-full bg-surface-container h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      creditosRestantes === 0 ? 'bg-error'
                      : creditosRestantes === 1 ? 'bg-amber-400'
                      : 'bg-secondary'
                    }`}
                    style={{ width: `${(creditosRestantes / LIMITE_PLAN) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mi Perfil */}
            <NavItem to="/perfil" label="Mi Perfil" Icon={UserCircle} onClick={onClose} />

            {/* Admin — solo si es admin */}
            {perfil?.is_admin && (
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
