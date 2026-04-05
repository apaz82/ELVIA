// Header superior — glassmorphism, hamburger + usuario + créditos
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { List, Coins, UserCircle, CaretDown, SignOut, UsersThree } from '@phosphor-icons/react'

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
    <header className="sticky top-0 z-20 h-24 flex items-center px-5 gap-4 bg-gradient-to-r from-[#0A3D2A] to-[#0D2B4E] shadow-md">

      {/* Hamburguesa — móvil */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-1 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
        aria-label="Abrir menú"
      >
        <List size={22} />
      </button>

      {/* Logo — solo en móvil */}
      <Link to="/" className="flex items-center gap-2 md:hidden">
        <img src="/elvia-logo-transparent.png" alt="ELVIA" className="h-8 w-auto object-contain py-1" />
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

          {/* ── Mentor shortcut ── */}
          <Link
            to="/expertos"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30 transition-colors"
          >
            <UsersThree size={14} weight="duotone" />
            Mentor
          </Link>

          {/* Avatar + nombre — con dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {(perfil?.nombre1 || user.email)?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-white truncate max-w-[140px]">
                {nombre}
              </span>
              <CaretDown size={13} weight="bold" className={`text-white/80 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                <Link
                  to="/mi-plan"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Coins size={16} weight="duotone" className="text-primary" />
                  Mi Plan
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
