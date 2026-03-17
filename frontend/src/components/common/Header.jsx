// Barra de navegación principal — mobile-first
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function CreditsBadge() {
  const { creditosRestantes, LIMITE_PLAN } = useAuth()
  const color = creditosRestantes === 0
    ? 'bg-red-50 text-red-600 border-red-200'
    : creditosRestantes === 1
    ? 'bg-amber-50 text-amber-600 border-amber-200'
    : 'bg-green-50 text-green-700 border-green-200'

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {creditosRestantes} crédito{creditosRestantes !== 1 ? 's' : ''}
    </div>
  )
}

const linksPublicos = [
  { to: '/',          label: 'CV Optimizer' },
  { to: '/cv-vs-job', label: 'CV vs Vacante' },
  { to: '/jobs',      label: 'Vacantes' },
]

const linksUsuario = [
  { to: '/mis-cvs',      label: 'Mis CVs' },
  { to: '/mis-vacantes', label: 'Mis Vacantes' },
  { to: '/pipeline',     label: 'Pipeline' },
  { to: '/perfil',       label: 'Mi Perfil' },
]

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'}`

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CV</span>
          </div>
          <span className="font-bold text-gray-900 hidden sm:block">CV Optimizer Pro</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {linksPublicos.map((l) => <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>)}
          {user && (
            <>
              <span className="text-gray-200">|</span>
              {linksUsuario.map((l) => <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>)}
            </>
          )}
        </nav>

        {/* Auth desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <CreditsBadge />
              <span className="text-sm text-gray-400">|</span>
              {/* Dropdown usuario */}
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
                  {user.email}
                  <svg className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <Link to="/perfil" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Mi Perfil
                    </Link>
                    <Link to="/mis-cvs" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      Mis CVs
                    </Link>
                    <Link to="/mis-vacantes" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                      Mis Vacantes
                    </Link>
                    <div className="border-t border-gray-100"/>
                    <button onClick={() => { handleLogout(); setDropdownOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Salir
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/auth" className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* Hamburguesa mobile */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
          {linksPublicos.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass} onClick={() => setMenuOpen(false)}>{l.label}</NavLink>
          ))}
          {user && (
            <>
              <div className="border-t border-gray-100 pt-2 mt-1 space-y-2">
                {linksUsuario.map((l) => (
                  <NavLink key={l.to} to={l.to} className={navClass} onClick={() => setMenuOpen(false)}>{l.label}</NavLink>
                ))}
              </div>
            </>
          )}
          {user ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="text-sm text-red-600 text-left">
              Salir
            </button>
          ) : (
            <Link to="/auth" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-primary">
              Iniciar sesión
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
