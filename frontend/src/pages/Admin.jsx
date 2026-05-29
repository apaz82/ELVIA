import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import * as PI from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'

// Layout & Components
import AdminLayout from '../components/admin/layout/AdminLayout'
import AdminSidebar from '../components/admin/layout/AdminSidebar'

// Tabs (B2C)
import OverviewTab from '../components/admin/tabs/OverviewTab'
import UsersTab from '../components/admin/tabs/UsersTab'
import WaitlistTab from '../components/admin/tabs/WaitlistTab'
import SubscriptionsTab from '../components/admin/tabs/SubscriptionsTab'
import CodesTab from '../components/admin/tabs/CodesTab'
import SystemTab from '../components/admin/tabs/SystemTab'
import MarketingTab from '../components/admin/tabs/MarketingTab'
import KnowledgeTab from '../components/admin/tabs/KnowledgeTab'
import B2BTab from '../components/admin/tabs/B2BTab'
import AuditTab from '../components/admin/tabs/AuditTab'
import CohortTab from '../components/admin/tabs/CohortTab'

// Client Supabase propio del admin
const db = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { storageKey: 'admin-auth', persistSession: true } }
)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── LOGIN COMPONENT ─────────────────────────────────────────────────────────

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: authErr } = await db.auth.signInWithPassword({ email, password })
    if (authErr) { setError('Credenciales de acceso no válidas'); setLoading(false); return }

    const { data: adminUser, error: adminErr } = await db.from('administrators').select('role, is_active').eq('id', data.user.id).single()
    if (adminErr) {
      console.error('Supabase RLS/Query Error:', adminErr);
      await db.auth.signOut()
      setError(`Error de base de datos: ${adminErr.message}`)
      setLoading(false)
      return
    }
    if (!adminUser || adminUser.role !== 'super_admin' || !adminUser.is_active) {
      await db.auth.signOut()
      setError('Acceso denegado: No tienes privilegios de Super Admin.')
      setLoading(false)
      return
    }
    onLogin({ ...data.user, ...adminUser })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="mb-8 p-1 group">
            <img 
              src="/LOGOS/ELVIA_logo_fondo_transparente.png" 
              alt="ELVIA Logo" 
              className="h-16 mx-auto drop-shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-105 transition-transform duration-500" 
            />
          </div>
          <h1 className="text-white text-4xl font-black tracking-tighter uppercase italic">ADMIN <span className="text-indigo-500">CENTER</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">B2C Operations</p>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Protocolo de Identidad</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                  <PI.Envelope size={18} weight="bold" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold transition-all"
                  placeholder="admin@elvia.ai"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Clave de Acceso</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                  <PI.Lock size={18} weight="bold" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 animate-shake">
                <PI.Warning size={18} className="text-rose-500 shrink-0" />
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3 italic text-[11px]"
            >
              {loading ? <PI.CircleNotch size={18} className="animate-spin" /> : <PI.ArrowRight size={18} weight="bold" />}
              {loading ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] italic">© 2026 ELVIA SYSTEM | B2C ADMIN</p>
      </div>
    </div>
  )
}

// ─── DASHBOARD WRAPPER ───────────────────────────────────────────────────────

function Dashboard({ adminUser, onLogout }) {
  const [tab, setTab]         = useState('overview')
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  // Theme support
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('adminTheme') || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('adminTheme', theme)
    if (theme === 'dark') {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  // B2C Waitlist & Stats States
  const [waitlistLeads, setWaitlistLeads] = useState([])
  const [landingViews, setLandingViews] = useState(0)
  const [events, setEvents] = useState([])
  const [config, setConfig] = useState([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // Obtener todos los usuarios de perfiles para las estadísticas
    const { data, error } = await db.from('profiles').select('*').order('created_at', { ascending: false })
    if (!error && data) setUsers(data)

    try {
      const { data: { session: wSession } } = await db.auth.getSession()
      const [wRes, sRes, eRes, cRes] = await Promise.all([
        fetch(`${API_URL}/api/waitlist?page=0&limit=50`, { headers: { 'Authorization': `Bearer ${wSession?.access_token}` } }),
        db.from('landing_stats').select('views').eq('id', 1).single(),
        db.from('landing_events').select('*').order('created_at', { ascending: false }),
        db.from('landing_config').select('*')
      ])

      const wJson = await wRes.json()
      if (wJson.leads) setWaitlistLeads(wJson.leads)
      if (sRes.data) setLandingViews(sRes.data.views)
      if (eRes.data) setEvents(eRes.data)
      if (cRes.data) setConfig(cRes.data)
    } catch (err) {
      console.error('[Dashboard] B2C Data Fetch Error:', err)
    }
    
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const statsB2C = {
    totalUsers:    users.length,
    conOnboarding: users.filter(u => u.nombre1).length,
    admins:        users.filter(u => u.role === 'super_admin' || u.role === 'company_admin').length,
    totalUsage:    users.reduce((s, u) => s + (u.usage_count || 0), 0),
    planes: users.reduce((acc, u) => { const k = u.plan || 'free'; acc[k] = (acc[k] || 0) + 1; return acc }, {}),
    paises: users.reduce((acc, u) => { if (u.pais) { acc[u.pais] = (acc[u.pais] || 0) + 1 }; return acc }, {}),
  }

  const renderActiveTab = () => {
    if (loading && tab !== 'users') {
        return (
            <div className="h-full flex flex-col items-center justify-center py-32 opacity-50 transition-opacity">
                <PI.Cpu size={48} className="text-indigo-500 animate-pulse mb-6" weight="duotone" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Sincronizando Módulos ELVIA...</p>
            </div>
        )
    }

    switch (tab) {
        case 'overview':      return <OverviewTab stats={statsB2C} theme={theme} users={users} />
        case 'users':         return <UsersTab users={users} onRefresh={fetchData} fmtDate={fmtDate} db={db} API_URL={API_URL} theme={theme} />
        case 'b2b':           return <B2BTab db={db} API_URL={API_URL} theme={theme} />
        case 'waitlist':      return <WaitlistTab leads={waitlistLeads} views={landingViews} events={events} onRefresh={fetchData} fmtDate={fmtDate} theme={theme} />
        case 'marketing':     return <MarketingTab config={config} onRefresh={fetchData} theme={theme} />
        case 'knowledge':     return <KnowledgeTab API_URL={API_URL} db={db} theme={theme} />
        case 'suscripciones': return <SubscriptionsTab users={users} theme={theme} />
        case 'codigos':       return <CodesTab db={db} API_URL={API_URL} theme={theme} />
        case 'cohort':        return <CohortTab db={db} theme={theme} />
        case 'audit':         return <AuditTab db={db} API_URL={API_URL} theme={theme} />
        case 'sistema':       return <SystemTab db={db} API_URL={API_URL} theme={theme} />
        default:              return <OverviewTab stats={statsB2C} theme={theme} users={users} />
    }
  }

  return (
    <AdminLayout 
      adminUser={adminUser} 
      currentTab={tab}
      onRefresh={fetchData}
      loading={loading}
      theme={theme}
      toggleTheme={toggleTheme}
      onTabChange={setTab}
      onLogout={onLogout}
    >
      <div className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}

// ─── MAIN ENTRY POINT ────────────────────────────────────────────────────────

export default function Admin() {
  const [adminUser, setAdminUser] = useState(null)
  const [checking, setChecking]   = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await db.auth.getSession()
      if (session?.user) {
        const { data } = await db.from('administrators').select('role, is_active').eq('id', session.user.id).single()
        if (data?.role === 'super_admin' && data?.is_active) {
          setAdminUser(session.user)
        } else {
          await db.auth.signOut()
        }
      }
      setChecking(false)
    }
    check()
  }, [])

  const handleLogout = async () => {
    await db.auth.signOut()
    setAdminUser(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-t-2 border-indigo-500 border-solid rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Autenticando Acceso Maestro...</p>
      </div>
    )
  }

  if (!adminUser) return <AdminLogin onLogin={setAdminUser} />
  
  return <Dashboard adminUser={adminUser} onLogout={handleLogout} />
}
