import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/common/Header'
import Sidebar from './components/common/Sidebar'
import CookieConsent from './components/common/CookieConsent'
import AiChatBot from './components/chat/AiChatBot'
import ErrorBoundary from './components/common/ErrorBoundary'
import { useAuth } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

const Landing            = lazy(() => import('./pages/Landing'))
const Landing2           = lazy(() => import('./pages/Landing2'))
const LandingMuyPronto   = lazy(() => import('./pages/LandingMuyPronto'))
const CVOptimizer        = lazy(() => import('./pages/CVOptimizer'))
const CVDesdeCero        = lazy(() => import('./pages/CVDesdeCero'))
const CVvsJob            = lazy(() => import('./pages/CVvsJob'))
const JobMatches         = lazy(() => import('./pages/JobMatches'))
const Auth               = lazy(() => import('./pages/Auth'))
const MisCVs             = lazy(() => import('./pages/MisCVs'))
const MisVacantes        = lazy(() => import('./pages/MisVacantes'))
const Pipeline           = lazy(() => import('./pages/Pipeline'))
const Perfil             = lazy(() => import('./pages/Perfil'))
const MiPlan             = lazy(() => import('./pages/MiPlan'))
const Dashboard          = lazy(() => import('./pages/Dashboard'))
const BienvenidaOnboarding = lazy(() => import('./pages/BienvenidaOnboarding'))
const Admin              = lazy(() => import('./pages/Admin'))
const Entrevista         = lazy(() => import('./pages/Entrevista'))
const Biblioteca         = lazy(() => import('./pages/Biblioteca'))
const LinkedinPro        = lazy(() => import('./pages/LinkedinPro'))
const Privacidad         = lazy(() => import('./pages/Privacidad'))
const ResetPassword      = lazy(() => import('./pages/ResetPassword'))
const Expertos           = lazy(() => import('./pages/Expertos'))
const Infografias        = lazy(() => import('./pages/Infografias'))
const Pricing            = lazy(() => import('./pages/Pricing'))
const ProyectoLaboral    = lazy(() => import('./pages/ProyectoLaboral'))
const ReporteLaboral     = lazy(() => import('./pages/ReporteLaboral'))
const Bienestar          = lazy(() => import('./pages/Bienestar'))
const MisMetricas        = lazy(() => import('./pages/MisMetricas'))
const Cookies            = lazy(() => import('./pages/Cookies'))
const LandingEmpresa     = lazy(() => import('./pages/LandingEmpresa'))
const RegistroEmpresa    = lazy(() => import('./pages/RegistroEmpresa'))
const LoginHR            = lazy(() => import('./pages/LoginHR'))
const CompanyAdmin       = lazy(() => import('./pages/CompanyAdmin'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Rutas que NO muestran sidebar ni header estándar
const RUTAS_FULL = ['/', '/waitlist', '/inicio', '/auth', '/bienvenida', '/admin', '/empresa-admin', '/privacidad', '/cookies', '/reset-password', '/pricing']
// Rutas excluidas del guard de onboarding (no redirigen a /bienvenida aunque haya onboarding pendiente)
const RUTAS_SIN_GUARD = ['/', '/waitlist', '/inicio', '/auth', '/bienvenida', '/admin', '/empresa-admin', '/privacidad', '/cookies', '/reset-password', '/pricing', '/proyecto-laboral', '/cv-desde-cero', '/linkedin-pro']
// Rutas públicas (solo para usuarios NO autenticados).
// /auth se excluye para que Auth.jsx maneje su propio redirect (evita que PublicRoute
// intercepte la página antes de renderizar el banner de "sesión activa").
const RUTAS_PUBLICAS = ['/', '/waitlist', '/privacidad', '/cookies', '/reset-password', '/pricing']

// Rutas internas de la APP (si NO es una de estas, usamos FullLayout para el Catch-All)
const RUTAS_APP = [
  '/dashboard', '/cv-optimizer', '/cv-desde-cero', '/cv-vs-job', '/jobs', 
  '/mis-cvs', '/mis-vacantes', '/pipeline', '/perfil', '/mi-plan', 
  '/entrevista', '/biblioteca', '/linkedin-pro', '/onboarding', 
  '/bienestar', '/proyecto-laboral', '/infografias', '/expertos', '/mis-metricas'
]

function PublicRoute({ children }) {
  const { user, loading, isRecovering, onboardingPendiente, featuresDesbloqueadas, perfilCargado, isCompanyAdmin } = useAuth()
  const location = useLocation()

  if (loading || !perfilCargado) return null

  const isRecoveryMode = sessionStorage.getItem('optima_recovery_mode') === 'true' || isRecovering || location.hash.includes('type=recovery')

  if (isRecoveryMode || location.hash.includes('access_token')) {
    return children
  }

  if (user) {
    // Company admin (HR) → panel de empresa, no flujo de usuario
    if (isCompanyAdmin) {
      return <Navigate to="/empresa-admin" replace />
    }
    // Si tiene onboarding pendiente, dejar que PrivateRoute lo mande a /bienvenida o similar
    // Pero si ya pasó el onboarding inicial y no tiene herramientas desbloqueadas -> /proyecto-laboral
    if (!onboardingPendiente && !featuresDesbloqueadas) {
      return <Navigate to="/proyecto-laboral" replace />
    }
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function OnboardingGuard({ children }) {
  const { onboardingPendiente, featuresDesbloqueadas, loading, isRecovering, isCompanyAdmin, isAdmin, jpLoaded, perfilCargado } = useAuth()
  const location = useLocation()

  if (loading) return null

  const isRecoveryMode = sessionStorage.getItem('optima_recovery_mode') === 'true' || isRecovering || location.hash.includes('type=recovery')
  const path = location.pathname.toLowerCase()

  if (isRecoveryMode || path.startsWith('/reset-password')) {
    return children
  }

  // Company admin / super admin → bypass guards de usuario.
  // Si intenta entrar a rutas de usuario común, redirigir a su panel.
  if (isCompanyAdmin || isAdmin) {
    if (path === '/empresa-admin' || path.startsWith('/admin')) {
      return children
    }
    return <Navigate to="/empresa-admin" replace />
  }

  // RUTAS_SIN_GUARD pasan sin esperar jpLoaded/perfilCargado para evitar
  // que el guard desmonte páginas con formularios en progreso (ej. /proyecto-laboral)
  if (RUTAS_SIN_GUARD.includes(path)) {
    return children
  }

  // Solo las RUTAS_GATED esperan a que jpData y perfil estén listos
  if (!jpLoaded || !perfilCargado) return null

  if (onboardingPendiente) {
    return <Navigate to="/bienvenida" replace />
  }

  // Gating de herramientas: si intenta entrar a dashboard o herramientas y no están desbloqueadas
  const RUTAS_GATED = ['/dashboard', '/cv-optimizer', '/cv-vs-job', '/jobs', '/mis-cvs', '/mis-vacantes', '/pipeline', '/entrevista', '/biblioteca', '/linkedin-pro', '/mis-metricas']
  if (RUTAS_GATED.includes(path) && !featuresDesbloqueadas) {
    return <Navigate to="/proyecto-laboral" replace />
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
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/reset-password"  element={<ResetPassword />} />  {/* Por si acaso falla el bloqueo anterior */}
      <Route path="/"              element={<LandingMuyPronto />} />
      <Route path="/waitlist"       element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/inicio"         element={<PublicRoute><Landing2 /></PublicRoute>} />
      <Route path="/auth"          element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/privacidad"      element={<Privacidad />} />
      <Route path="/cookies"         element={<Cookies />} />
      <Route path="/pricing"              element={<PublicRoute><Pricing /></PublicRoute>} />
      <Route path="/bienvenida"     element={<BienvenidaRoute><BienvenidaOnboarding /></BienvenidaRoute>} />

      {/* Landings co-brandeadas B2B y registro por slug de empresa/universidad */}
      <Route path="/empresas/:slug"             element={<LandingEmpresa />} />
      <Route path="/empresas/:slug/registro"    element={<RegistroEmpresa />} />
      <Route path="/empresas/:slug/hr"          element={<LoginHR />} />
      <Route path="/universidades/:slug"          element={<LandingEmpresa />} />
      <Route path="/universidades/:slug/registro" element={<RegistroEmpresa />} />
      <Route path="/universidades/:slug/hr"       element={<LoginHR />} />

      {/* Panel del HR Director / Gestor de programa B2B */}
      <Route path="/empresa-admin" element={<PrivateRoute><CompanyAdmin /></PrivateRoute>} />

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
      <Route path="/mis-metricas"    element={<PrivateRoute><MisMetricas /></PrivateRoute>} />
      
      {/* /onboarding redirige a /bienvenida — ruta legacy */}
      <Route path="/onboarding"    element={<Navigate to="/bienvenida" replace />} />

      {/* CATCH-ALL: Redirigir cualquier ruta no válida al home/dashboard según auth */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )

  return (
    <ErrorBoundary>
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
        <CookieConsent />
      </>
    </ErrorBoundary>
  )
}
