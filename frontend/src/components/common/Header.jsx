// Header superior — glassmorphism, logo (móvil) + hamburguesa + usuario
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { List } from '@phosphor-icons/react'

export default function Header({ onMenuToggle }) {
  const { user } = useAuth()

  return (
    <header className="glass-header sticky top-0 z-20 h-16 flex items-center px-5 gap-4">

      {/* Hamburguesa — visible siempre en móvil, oculta en desktop */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-1 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
        aria-label="Abrir menú"
      >
        <List size={22} />
      </button>

      {/* Logo — solo en móvil (desktop lo muestra el sidebar) */}
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
        <p className="hidden md:block text-xs text-on-surface-variant truncate max-w-[200px]">
          {user.email}
        </p>
      ) : (
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/auth"
            className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-surface-container"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/auth"
            className="btn-primary text-sm"
          >
            Registrarse gratis
          </Link>
        </div>
      )}
    </header>
  )
}
