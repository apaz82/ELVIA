// Header superior — glassmorphism, hamburger + usuario + créditos
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { List, Coins, UserCircle, CaretDown, SignOut } from '@phosphor-icons/react'

export default function Header({ onMenuToggle }) {
  const { user, creditosRestantes, LIMITE_PLAN, perfil, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const creditColor =
    creditosRestantes === 0 ? 'text-error bg-error-container'
    : creditosRestantes === 1 ? 'text-amber-700 bg-amber-50'
    : 'text-secondary bg-secondary-fixed'

  const nombre = perfil?.nombre1
    ? `${perfil.nombre1}${perfil.apellido1 ? ' ' + perfil.apellido1 : ''}`
    : user?.email?.split('@')[0]

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="glass-header sticky top-0 z-20 h-16 flex items-center px-5 gap-4">

      {/* Hamburguesa — móvil */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-1 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
        aria-label="Abrir menú"
      >
        <List size={22} />
      </button>

      {/* Logo — solo en móvil */}
      <Link to="/" className="flex items-center gap-2 md:hidden">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0">
          <span className="text-on-primary font-bold text-xs">CV</span>
        </div>
        <span className="font-headline font-extrabold text-primary text-sm tracking-tight">
          CV Optimizer Pro
        </span>
      </Link>

      <div className="flex-1" />

      {/* Info usuario — desktop */}
      {user ? (
        <div className="hidden md:flex items-center gap-3">
          {/* Créditos */}
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${creditColor}`}>
            <Coins size={14} weight="duotone" />
            {creditosRestantes} / {LIMITE_PLAN} créditos
          </div>

          {/* Avatar + nombre — con dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-container transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {(perfil?.nombre1 || user.email)?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-on-surface truncate max-w-[140px]">
                {nombre}
              </span>
              <CaretDown size={13} weight="bold" className={`text-on-surface-variant transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-surface-container-lowest rounded-xl shadow-float border border-outline-variant/20 py-1.5 w-48 z-50">
                <Link
                  to="/perfil"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <UserCircle size={16} weight="duotone" className="text-primary" />
                  Mi Perfil
                </Link>
                <div className="h-px bg-outline-variant/20 mx-2 my-1" />
                <button
                  onClick={async () => { setDropdownOpen(false); await logout(); navigate('/') }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
                >
                  <SignOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-2">
          <Link to="/auth"
            className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-surface-container">
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
