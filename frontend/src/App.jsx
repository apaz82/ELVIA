import { Routes, Route } from 'react-router-dom'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import CVOptimizer from './pages/CVOptimizer'
import CVvsJob from './pages/CVvsJob'
import JobMatches from './pages/JobMatches'
import Auth from './pages/Auth'
import MisCVs from './pages/MisCVs'
import MisVacantes from './pages/MisVacantes'
import Pipeline from './pages/Pipeline'
import Perfil from './pages/Perfil'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/"           element={<CVOptimizer />} />
          <Route path="/cv-vs-job"  element={<CVvsJob />} />
          <Route path="/jobs"       element={<JobMatches />} />
          <Route path="/auth"       element={<Auth />} />
          <Route path="/mis-cvs"       element={<MisCVs />} />
          <Route path="/mis-vacantes"  element={<MisVacantes />} />
          <Route path="/pipeline"      element={<Pipeline />} />
          <Route path="/perfil"        element={<Perfil />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
