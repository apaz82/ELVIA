import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import Landing from './pages/Landing'
import CVOptimizer from './pages/CVOptimizer'
import CVvsJob from './pages/CVvsJob'
import JobMatches from './pages/JobMatches'
import Auth from './pages/Auth'
import MisCVs from './pages/MisCVs'
import MisVacantes from './pages/MisVacantes'
import Pipeline from './pages/Pipeline'
import Perfil from './pages/Perfil'
import Onboarding from './pages/Onboarding'
import { useAuth } from './context/AuthContext'

// Redirige al onboarding si el usuario aún no ha completado su perfil inicial
function OnboardingGuard({ children }) {
  const { onboardingPendiente } = useAuth()
  const location = useLocation()
  if (onboardingPendiente && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <OnboardingGuard>
          <Routes>
            <Route path="/"           element={<Landing />} />
            <Route path="/cv-optimizer" element={<CVOptimizer />} />
            <Route path="/cv-vs-job"  element={<CVvsJob />} />
            <Route path="/jobs"       element={<JobMatches />} />
            <Route path="/auth"       element={<Auth />} />
            <Route path="/mis-cvs"       element={<MisCVs />} />
            <Route path="/mis-vacantes"  element={<MisVacantes />} />
            <Route path="/pipeline"      element={<Pipeline />} />
            <Route path="/perfil"        element={<Perfil />} />
            <Route path="/onboarding"    element={<Onboarding />} />
          </Routes>
        </OnboardingGuard>
      </main>
      <Footer />
    </div>
  )
}
