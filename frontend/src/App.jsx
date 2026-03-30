import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/common/Header'
import Sidebar from './components/common/Sidebar'
import Landing from './pages/Landing'
import Landing2 from './pages/Landing2'
import CVOptimizer from './pages/CVOptimizer'
import CVvsJob from './pages/CVvsJob'
import JobMatches from './pages/JobMatches'
import Auth from './pages/Auth'
import MisCVs from './pages/MisCVs'
import MisVacantes from './pages/MisVacantes'
import Pipeline from './pages/Pipeline'
import Perfil from './pages/Perfil'
import MiPlan from './pages/MiPlan'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Admin from './pages/Admin'
import Entrevista from './pages/Entrevista'
import Biblioteca from './pages/Biblioteca'
import LinkedinOptima from './pages/LinkedinOptima'
import Privacidad from './pages/Privacidad'
import ResetPassword from './pages/ResetPassword'
import Expertos from './pages/Expertos'
import Infografias from './pages/Infografias'
import Pricing from './pages/Pricing'
import ProyectoLaboral from './pages/ProyectoLaboral'
import Bienestar from './pages/Bienestar'
import AiChatBot from './components/chat/AiChatBot'
import { useAuth } from './context/AuthContext'

// Rutas que NO muestran sidebar ni header estándar
const RUTAS_FULL = ['/', '/landing2', '/auth', '/onboarding', '/admin', '/privacidad', '/reset-password', '/pricing']
// Rutas excluidas del guard de onboarding
const RUTAS_SIN_GUARD = ['/', '/landing2', '/auth', '/onboarding', '/admin', '/privacidad', '/reset-password', '/pricing', '/proyecto-laboral']
// Rutas públicas (solo para usuarios NO autenticados)
const RUTAS_PUBLICAS = ['/', '/auth', '/privacidad', '/reset-password', '/pricing']

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function OnboardingGuard({ children }) {
  const { onboardingPendiente } = useAuth()
  const location = useLocation()
  if (onboardingPendiente && !RUTAS_SIN_GUARD.includes(location.pathname)) {
    return <Navigate to="/onboarding" replace />
  }
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
  const location = useLocation()
  const isFullLayout = RUTAS_FULL.includes(location.pathname)

  const routes = (
    <OnboardingGuard>
      <Routes>
        <Route path="/"              element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/landing2"      element={<PublicRoute><Landing2 /></PublicRoute>} />
        <Route path="/cv-optimizer"  element={<CVOptimizer />} />
        <Route path="/cv-vs-job"     element={<CVvsJob />} />
        <Route path="/jobs"          element={<JobMatches />} />
        <Route path="/auth"          element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/mis-cvs"       element={<MisCVs />} />
        <Route path="/mis-vacantes"  element={<MisVacantes />} />
        <Route path="/pipeline"      element={<Pipeline />} />
        <Route path="/perfil"        element={<Perfil />} />
        <Route path="/mi-plan"       element={<MiPlan />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/onboarding"    element={<Onboarding />} />
        <Route path="/admin"         element={<Admin />} />
        <Route path="/entrevista"      element={<Entrevista />} />
        <Route path="/biblioteca"      element={<Biblioteca />} />
        <Route path="/linkedin-optima" element={<LinkedinOptima />} />
        <Route path="/privacidad"      element={<PublicRoute><Privacidad /></PublicRoute>} />
        <Route path="/reset-password"  element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/expertos"        element={<Expertos />} />
        <Route path="/infografias"     element={<Infografias />} />
        <Route path="/pricing"              element={<PublicRoute><Pricing /></PublicRoute>} />
        <Route path="/proyecto-laboral"     element={<ProyectoLaboral />} />
        <Route path="/bienestar"             element={<Bienestar />} />
      </Routes>
    </OnboardingGuard>
  )

  return isFullLayout
    ? <FullLayout>{routes}</FullLayout>
    : <AppLayout>{routes}</AppLayout>
}
