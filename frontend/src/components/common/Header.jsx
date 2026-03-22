// Header estilo Yeldra — dark navy, pill buttons, blur backdrop
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function CreditsBadge() {
  const { creditosRestantes } = useAuth()
  const color = creditosRestantes === 0
    ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : creditosRestantes === 1
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-teal/10 text-teal border-teal/20'

  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-pill border ${color}`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {creditosRestantes} crédito{creditosRestantes !== 1 ? 's' : ''}
    </div>
  )
}

const linksPublicos = [
  { to: '/cv-optimizer', label: 'CV Optimizer' },
  { to: '/cv-vs-job',    label: 'CV vs Vacante' },
  { to: '/jobs',         label: 'Vacantes' },
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
  const [menuOpen, setMenuOpen]         = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navClass = ({ isActive }) =>
    `text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ${
      isActive ? 'text-white font-semibold' : 'text-muted hover:text-white'
    }`

  return (
    <header className="bg-surface/80 backdrop-blur-md border-b border-line sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 min-w-[128px]">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-glow-purple">
            <span className="text-white font-bold text-sm">CV</span>
          </div>
          <span className="font-bold text-white text-[15px] hidden sm:block">CV Optimizer Pro</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-5">
          {linksPublicos.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>
          ))}
          {user && (
            <>
              <span className="w-px h-4 bg-line"/>
              {linksUsuario.map((l) => (
                <NavLink key={l.to} to={l.to} className={navClass}>{l.label}</NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Auth desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <CreditsBadge />
              <span className="w-px h-4 bg-line"/>
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
                  {user.email}
                  <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-line rounded-2xl shadow-card-hover z-50 overflow-hidden animate-fade-in">
                    <div className="py-1">
                      {[
                        { to: '/perfil',       label: 'Mi Perfil' },
                        { to: '/mis-cvs',      label: 'Mis CVs' },
                        { to: '/mis-vacantes', label: 'Mis Vacantes' },
                      ].map((item) => (
                        <Link key={item.to} to={item.to} onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-card2 transition-colors">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-line py-1">
                      <button onClick={() => { handleLogout(); setDropdownOpen(false) }}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        Salir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth"
                className="text-sm font-medium text-white border border-line px-5 py-2 rounded-pill hover:bg-white/5 transition-colors">
                Iniciar sesión
              </Link>
              <Link to="/auth"
                className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-pill hover:bg-primary-dark transition-colors shadow-glow-purple">
                Registrarse gratis
              </Link>
            </div>
          )}
        </div>

        {/* Hamburguesa mobile */}
        <button className="md:hidden p-2 rounded-xl hover:bg-card transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="md:hidden bg-card border-t border-line px-5 py-4 flex flex-col gap-1 animate-fade-in">
          {linksPublicos.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-white' : 'text-muted hover:bg-card2 hover:text-white'
                }`}>
              {l.label}
            </NavLink>
          ))}
          {user && (
            <div className="border-t border-line mt-2 pt-2 flex flex-col gap-1">
              {linksUsuario.map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/10 text-white' : 'text-muted hover:bg-card2 hover:text-white'
                    }`}>
                  {l.label}
                </NavLink>
              ))}
            </div>
          )}
          <div className="border-t border-line mt-2 pt-2">
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                Salir
              </button>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary/10 hover:bg-primary/20 transition-colors">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
