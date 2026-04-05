import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import * as PI from '@phosphor-icons/react'

// Layout & Components
import AdminLayout from '../components/admin/layout/AdminLayout'
import AdminSidebar from '../components/admin/layout/AdminSidebar'

// Tabs (B2C)
import OverviewTab from '../components/admin/tabs/OverviewTab'
import UsersTab from '../components/admin/tabs/UsersTab'
import WaitlistTab from '../components/admin/tabs/WaitlistTab'
import SubscriptionsTab from '../components/admin/tabs/SubscriptionsTab'
import CodesTab from '../components/admin/tabs/CodesTab'
import B2BTab from '../components/admin/tabs/B2BTab'
import SystemTab from '../components/admin/tabs/SystemTab'
import MarketingTab from '../components/admin/tabs/MarketingTab'

// Tabs (B2B)
import CompanyDashboardTab from '../components/admin/tabs/b2b/CompanyDashboardTab'
import CompanyUsersTab from '../components/admin/tabs/b2b/CompanyUsersTab'
import CompanyCostsTab from '../components/admin/tabs/b2b/CompanyCostsTab'
import CompanySettingsTab from '../components/admin/tabs/b2b/CompanySettingsTab'

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

    const { data: perfil } = await db.from('profiles').select('role').eq('id', data.user.id).single()
    if (!['super_admin', 'company_admin'].includes(perfil?.role)) {
      await db.auth.signOut()
      setError('Acceso restringido: Solamente personal autorizado.')
      setLoading(false)
      return
    }
    onLogin(data.user)
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
          <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-900/40 border border-white/10 ring-8 ring-indigo-600/5 group">
            <PI.Fingerprint size={48} className="text-white group-hover:scale-110 transition-transform" weight="duotone" />
          </div>
          <h1 className="text-white text-4xl font-black tracking-tighter uppercase italic">ELVIA <span className="text-indigo-500">ADMIN</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">Secure Operations Center</p>
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
        
        <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] italic">© 2026 ELVIA SYSTEM | v2.4.0</p>
      </div>
    </div>
  )
}

// ─── DASHBOARD WRAPPER ───────────────────────────────────────────────────────

function Dashboard({ adminUser, onLogout }) {
  const [tab, setTab]         = useState('overview')
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  // B2B States
  const [adminContext, setAdminContext] = useState('B2C') // 'B2C' | 'B2B'
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [adminRole, setAdminRole] = useState(null)
  const [companies, setCompanies] = useState([])
  const [companyData, setCompanyData] = useState({ stats: null, users: [], invitations: [], costs: null })

  // B2C Waitlist & Stats States
  const [waitlistLeads, setWaitlistLeads] = useState([])
  const [landingViews, setLandingViews] = useState(0)
  const [events, setEvents] = useState([])
  const [config, setConfig] = useState([])

  const fetchB2BData = useCallback(async (companyId) => {
    if (!companyId) return
    try {
      const { data: { session } } = await db.auth.getSession()
      
      const { data: cUsers } = await db.from('profiles').select('*').eq('company_id', companyId)
      
      const [invRes, dashRes, costsRes] = await Promise.all([
        fetch(`${API_URL}/api/company/invitations?company_id=${companyId}`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
        fetch(`${API_URL}/api/company/dashboard?company_id=${companyId}`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
        fetch(`${API_URL}/api/company/costs?company_id=${companyId}`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
      ])
      
      const [invJson, dashJson, costsJson] = await Promise.all([invRes.json(), dashRes.json(), costsRes.json()])
      
      setCompanyData({
        stats: dashJson.stats,
        users: cUsers || [],
        invitations: invJson.invitations || [],
        costs: costsJson.costs
      })
    } catch (err) {
      console.error('[Dashboard] B2B Data Fetch Error:', err)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // Get Admin Profile and Role
    const { data: profile } = await db.from('profiles').select('*, companies(*)').eq('id', adminUser?.id).single()
    if (profile) {
      setAdminRole(profile.role)
      // If company_admin, lock to B2B and their company
      if (profile.role === 'company_admin' && profile.companies) {
        setAdminContext('B2B')
        setSelectedCompany(profile.companies)
        setTab('company_overview')
        await fetchB2BData(profile.companies.id)
      }
      
      // If super_admin, fetch companies list
      if (profile.role === 'super_admin') {
        const { data: comps } = await db.from('companies').select('*')
        setCompanies(comps || [])
      }
    }

    if (adminContext === 'B2C') {
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
    } else if (selectedCompany) {
      await fetchB2BData(selectedCompany.id)
    }
    
    setLoading(false)
  }, [adminUser, adminContext, selectedCompany, fetchB2BData])

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

    // B2C Context
    if (adminContext === 'B2C') {
        switch (tab) {
            case 'overview':      return <OverviewTab stats={statsB2C} />
            case 'users':         return <UsersTab users={users} onRefresh={fetchData} />
            case 'waitlist':      return <WaitlistTab leads={waitlistLeads} views={landingViews} events={events} onRefresh={fetchData} />
            case 'marketing':     return <MarketingTab config={config} onRefresh={fetchData} />
            case 'suscripciones': return <SubscriptionsTab users={users} />
            case 'codigos':       return <CodesTab db={db} API_URL={API_URL} />
            case 'empresas':      return <B2BTab db={db} API_URL={API_URL} />
            case 'sistema':       return <SystemTab db={db} API_URL={API_URL} />
            default:              return <OverviewTab stats={statsB2C} />
        }
    }

    // B2B Context
    if (adminContext === 'B2B') {
        switch (tab) {
            case 'company_overview': return <CompanyDashboardTab company={selectedCompany} data={companyData} />
            case 'company_users':    return <CompanyUsersTab company={selectedCompany} users={companyData.users} invitations={companyData.invitations} onRefresh={() => fetchB2BData(selectedCompany.id)} fmtDate={fmtDate} db={db} API_URL={API_URL} />
            case 'company_costs':    return <CompanyCostsTab company={selectedCompany} costs={companyData.costs} onExport={async () => {
                const { data: { session } } = await db.auth.getSession()
                const res = await fetch(`${API_URL}/api/company/costs/export`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sendEmail: true })
                })
                if (res.ok) {
                   const { toast } = await import('react-hot-toast')
                   toast.success('Reporte de costos enviado satisfactoriamente.')
                }
            }} />
            case 'company_settings': return <CompanySettingsTab company={selectedCompany} onRefresh={async () => {
                const { data } = await db.from('companies').select('*').eq('id', selectedCompany.id).single()
                if (data) setSelectedCompany(data)
            }} db={db} API_URL={API_URL} />
            default: return <div className="py-20 text-center text-slate-500 uppercase tracking-widest text-[10px] font-black italic">Módulo B2B No Inicializado</div>
        }
    }

    return null
  }

  return (
    <AdminLayout 
      adminUser={adminUser} 
      adminRole={adminRole} 
      adminContext={adminContext}
      onContextChange={setAdminContext}
      companies={companies}
      selectedCompany={selectedCompany}
      onCompanyChange={(comp) => {
        setSelectedCompany(comp)
        if (comp) fetchB2BData(comp.id)
      }}
      currentTab={tab}
      onRefresh={fetchData}
      loading={loading}
    >
      <AdminSidebar 
        currentTab={tab} 
        onTabChange={setTab} 
        adminRole={adminRole} 
        adminContext={adminContext} 
        onLogout={onLogout}
        adminUser={adminUser}
      />
      <div className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab + adminContext}
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
        const { data } = await db.from('profiles').select('role').eq('id', session.user.id).single()
        if (['super_admin', 'company_admin'].includes(data?.role)) {
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
