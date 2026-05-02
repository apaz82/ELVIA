import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/common/Header'
import Sidebar from './components/common/Sidebar'
import Landing from './pages/Landing'
import Landing2 from './pages/Landing2'
import LandingMuyPronto from './pages/LandingMuyPronto'
import CVOptimizer from './pages/CVOptimizer'
import CVDesdeCero from './pages/CVDesdeCero'
import CVvsJob from './pages/CVvsJob'
import JobMatches from './pages/JobMatches'
import Auth from './pages/Auth'
import MisCVs from './pages/MisCVs'
import MisVacantes from './pages/MisVacantes'
import Pipeline from './pages/Pipeline'
import Perfil from './pages/Perfil'
import MiPlan from './pages/MiPlan'
import Dashboard from './pages/Dashboard'
import BienvenidaOnboarding from './pages/BienvenidaOnboarding'
import Admin from './pages/Admin'
import Entrevista from './pages/Entrevista'
import Biblioteca from './pages/Biblioteca'
import LinkedinPro from './pages/LinkedinPro'
import Privacidad from './pages/Privacidad'
import ResetPassword from './pages/ResetPassword'
import Expertos from './pages/Expertos'
import Infografias from './pages/Infografias'
import Pricing from './pages/Pricing'
import ProyectoLaboral from './pages/ProyectoLaboral'
import ReporteLaboral from './pages/ReporteLaboral'
import Bienestar from './pages/Bienestar'
import AiChatBot from './components/chat/AiChatBot'
import { useAuth } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

// Rutas que NO muestran sidebar ni header estándar
const RUTAS_FULL = ['/', '/waitlist', '/inicio', '/auth', '/bienvenida', '/admin', '/privacidad', '/reset-password', '/pricing']
// Rutas excluidas del guard de onboarding (no redirigen a /bienvenida aunque haya onboarding pendiente)
const RUTAS_SIN_GUARD = ['/', '/waitlist', '/inicio', '/auth', '/bienvenida', '/admin', '/privacidad', '/reset-password', '/pricing', '/proyecto-laboral', '/cv-desde-cero', '/linkedin-pro']
// Rutas públicas (solo para usuarios NO autenticados)
const RUTAS_PUBLICAS = ['/', '/waitlist', '/auth', '/privacidad', '/reset-password', '/pricing']

// Rutas internas de la APP (si NO es una de estas, usamos FullLayout para el Catch-All)
const RUTAS_APP = [
  '/dashboard', '/cv-optimizer', '/cv-desde-cero', '/cv-vs-job', '/jobs', 
  '/mis-cvs', '/mis-vacantes', '/pipeline', '/perfil', '/mi-plan', 
  '/entrevista', '/biblioteca', '/linkedin-pro', '/onboarding', 
  '/bienestar', '/proyecto-laboral', '/infografias', '/expertos'
]

function PublicRoute({ children }) {
  const { user, loading, isRecovering } = useAuth()
  const location = useLocation()
  
  if (loading) return null
  
  const isRecoveryMode = sessionStorage.getItem('optima_recovery_mode') === 'true' || isRecovering || location.hash.includes('type=recovery')
  
  // Si estamos en recuperación, NO redirigir (dejar que ResetPassword maneje)
  if (isRecoveryMode || location.hash.includes('access_token')) {
    return children
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function OnboardingGuard({ children }) {
  const { onboardingPendiente, loading, isRecovering } = useAuth()
  const location = useLocation()

  if (loading) return null

  const isRecoveryMode = sessionStorage.getItem('optima_recovery_mode') === 'true' || isRecovering || location.hash.includes('type=recovery')

  // Nunca redirigir si estamos en el flujo de recuperación
  const path = location.pathname.toLowerCase()
  if (isRecoveryMode || path.startsWith('/reset-password')) {
    return children
  }

  // No redirigir si estamos en una ruta excluida del guard
  if (RUTAS_SIN_GUARD.includes(path)) {
    return children
  }

  if (onboardingPendiente) {
    return <Navigate to="/bienvenida" replace />
  }
  return children
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  return <OnboardingGuard>{children}</OnboardingGuard>
}

// Solo accesible si: autenticado + onboarding pendiente
// Si no autenticado → /auth | Si ya completó onboarding → /dashboard
function BienvenidaRoute({ children }) {
  const { user, loading, onboardingPendiente, perfilCargado } = useAuth()
  if (loading || !perfilCargado) return null
  if (!user) return <Navigate to="/auth" replace />
  if (!onboardingPendiente) return <Navigate to="/dashboard" replace />
  return children
}

// Layout con sidebar para páginas de app
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col min-h-screen md:pl-64">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 bg-surface">
          {children}
        </main>
      </div>
      <AiChatBot />
    </div>
  )
}

// Layout limpio para Landing, Auth y Onboarding
function FullLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {children}
      <AiChatBot />
    </div>
  )
}

export default function App() {
  const { isRecovering } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // ── BLOQUEO Y REDIRECCIÓN DE SEGURIDAD (NUCLEAR) ──
  // 1. Si aterrizamos en cualquier parte (?forgot=1, /, etc) con un token de recuperación,
  // forzamos la navegación a la ruta dedicada.
  useEffect(() => {
    const isRecoveryMode = sessionStorage.getItem('optima_recovery_mode') === 'true' || isRecovering || location.hash.includes('type=recovery')
    if (isRecoveryMode && !location.pathname.startsWith('/reset-password')) {
      const savedHash = sessionStorage.getItem('optima_recovery_hash') || ''
      navigate('/reset-password' + (location.hash || savedHash), { replace: true })
    }
  }, [location, navigate, isRecovering])

  // 2. Si ya estamos en la ruta correcta, BLOQUEAR para que nada nos saque.
  if (location.pathname.toLowerCase().startsWith('/reset-password')) {
    return (
      <div className="min-h-screen bg-surface">
        <ResetPassword />
      </div>
    )
  }

  const currentPath = location.pathname.toLowerCase()
  const isFullLayout = RUTAS_FULL.includes(currentPath) || !RUTAS_APP.includes(currentPath)

  const routes = (
    <Routes>
      <Route path="/reset-password"  element={<ResetPassword />} />  {/* Por si acaso falla el bloqueo anterior */}
      <Route path="/"              element={<LandingMuyPronto />} />
      <Route path="/waitlist"       element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/inicio"         element={<PublicRoute><Landing2 /></PublicRoute>} />
      <Route path="/auth"          element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/privacidad"      element={<Privacidad />} />
      <Route path="/pricing"              element={<PublicRoute><Pricing /></PublicRoute>} />
      <Route path="/bienvenida"     element={<BienvenidaRoute><BienvenidaOnboarding /></BienvenidaRoute>} />

      {/* Admin / Especiales */}
      <Route path="/admin"         element={<Admin />} />
      <Route path="/expertos"        element={<Expertos />} />
      <Route path="/infografias"     element={<Infografias />} />
      <Route path="/proyecto-laboral" element={<PrivateRoute><ProyectoLaboral /></PrivateRoute>} />
      <Route path="/reporte-visual/:id" element={<PrivateRoute><ReporteLaboral /></PrivateRoute>} />
      <Route path="/bienestar"        element={<PrivateRoute><Bienestar /></PrivateRoute>} />

      {/* Privadas (Protegidas por Auth + Onboarding) */}
      <Route path="/dashboard"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/cv-optimizer"  element={<PrivateRoute><CVOptimizer /></PrivateRoute>} />
      <Route path="/cv-desde-cero" element={<PrivateRoute><CVDesdeCero /></PrivateRoute>} />
      <Route path="/cv-vs-job"     element={<PrivateRoute><CVvsJob /></PrivateRoute>} />
      <Route path="/jobs"          element={<PrivateRoute><JobMatches /></PrivateRoute>} />
      <Route path="/mis-cvs"       element={<PrivateRoute><MisCVs /></PrivateRoute>} />
      <Route path="/mis-vacantes"  element={<PrivateRoute><MisVacantes /></PrivateRoute>} />
      <Route path="/pipeline"      element={<PrivateRoute><Pipeline /></PrivateRoute>} />
      <Route path="/perfil"        element={<PrivateRoute><Perfil /></PrivateRoute>} />
      <Route path="/mi-plan"       element={<PrivateRoute><MiPlan /></PrivateRoute>} />
      <Route path="/entrevista"      element={<PrivateRoute><Entrevista /></PrivateRoute>} />
      <Route path="/biblioteca"      element={<PrivateRoute><Biblioteca /></PrivateRoute>} />
      <Route path="/linkedin-pro"    element={<PrivateRoute><LinkedinPro /></PrivateRoute>} />
      
      {/* /onboarding redirige a /bienvenida — ruta legacy */}
      <Route path="/onboarding"    element={<Navigate to="/bienvenida" replace />} />

      {/* CATCH-ALL: Redirigir cualquier ruta no válida al home/dashboard según auth */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#fff',
            border: '1px solid #1f2937',
            borderRadius: '1rem',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      {isFullLayout ? <FullLayout>{routes}</FullLayout> : <AppLayout>{routes}</AppLayout>}
    </>
  )
}
