import React, { useState, useEffect } from 'react'
import * as PI from '@phosphor-icons/react'
import Badge from '../shared/Badge'
import SectionHeading from '../shared/SectionHeading'
import AdminSkeleton from '../shared/AdminSkeleton'
import { toast } from 'react-hot-toast'

const UserRow = ({ u, onEdit, onView, fmtDate }) => {
  const nombre = [u.nombre1, u.nombre2, u.apellido1, u.apellido2].filter(Boolean).join(' ') || '—'
  const inicial = (u.nombre1 || u.email_principal || '?')[0]?.toUpperCase()
  
  const PLAN_THEMES = {
    trimestral: 'purple',
    mensual:    'blue',
    semanal:    'green',
    free:       'gray'
  }

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors group">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500">
            <span className="text-indigo-400 font-black text-sm">{inicial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate uppercase italic tracking-tight">{nombre}</p>
            <p className="text-[10px] text-slate-500 truncate font-black uppercase tracking-widest">{u.email_principal || 'Sin correo'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <Badge color={PLAN_THEMES[u.plan] || 'gray'}>
          {u.plan || 'free'}
        </Badge>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
           <PI.GlobeSimple size={14} className="text-slate-600" />
           <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{u.pais || '—'}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
            <span className="text-slate-600">Consumo IA</span>
            <span className="text-indigo-400">
              {u.cv_optimizer_count || 0}/1 · {u.cv_match_count || 0}/3
            </span>
          </div>
          <div className="bg-slate-800 rounded-full h-1.5 w-24 overflow-hidden border border-slate-700/50">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, ((u.usage_count || 0) / 4) * 100)}%` }} />
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        {u.role === 'super_admin' ? (
          <Badge color="purple">Super Admin</Badge>
        ) : u.role === 'company_admin' ? (
          <Badge color="blue">Empresa</Badge>
        ) : (
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Usuario</span>
        )}
      </td>
      <td className="px-6 py-5">
        <div className={`flex items-center gap-1.5 ${u.suspended ? 'text-rose-400' : 'text-emerald-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${u.suspended ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{u.suspended ? 'Bloqueado' : 'Activo'}</span>
        </div>
      </td>
      <td className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{fmtDate(u.created_at)}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(u)}
            className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
            title="Ajustes rápidos"
          >
            <PI.Gear size={18} weight="duotone" />
          </button>
          <button 
            onClick={() => onView(u)}
            className="px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-900/10"
          >
            Detalle
          </button>
        </div>
      </td>
    </tr>
  )
}

const UsersTab = ({ users, onRefresh, fmtDate, db, API_URL }) => {
  const [search, setSearch]     = useState('')
  const [editUser, setEditUser] = useState(null)
  const [viewUser, setViewUser] = useState(null)
  const [page, setPage]         = useState(0)
  const [localLoading, setLocalLoading] = useState(false)
  const PER_PAGE = 10

  const handleRefresh = async () => {
    setLocalLoading(true)
    await onRefresh()
    setLocalLoading(false)
    toast.success('Directorio sincronizado', { id: 'sync-users' })
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q
      || (u.email_principal || '').toLowerCase().includes(q)
      || [u.nombre1, u.nombre2, u.apellido1, u.apellido2].filter(Boolean).join(' ').toLowerCase().includes(q)
      || (u.pais || '').toLowerCase().includes(q)
  })

  const paginated  = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  // ─── DERIVED STATS ─────────────────────────────────────────────────────────
  const totalUsers = users.length
  const activeToday = users.filter(u => {
    const created = new Date(u.created_at)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return created > yesterday
  }).length
  const totalIA = users.reduce((acc, u) => acc + (u.cv_optimizer_count || 0) + (u.cv_match_count || 0), 0)

  if (localLoading && users.length === 0) return <AdminSkeleton type="table" />

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto px-4 lg:px-10 py-4">
      {/* ─── QUICK STATS DASHBOARD ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickStatCard 
          label="Candidatos Totales" 
          value={totalUsers} 
          icon={PI.UsersThree} 
          sub="Base de datos global" 
          color="indigo" 
        />
        <QuickStatCard 
          label="Nuevos Hoy" 
          value={activeToday} 
          icon={PI.UserPlus} 
          sub="Últimas 24 horas" 
          color="emerald" 
        />
        <QuickStatCard 
          label="Intervenciones IA" 
          value={totalIA} 
          icon={PI.Cpu} 
          sub="Total optimizaciones" 
          color="violet" 
        />
      </div>

      {/* ─── SEARCH & HEADING ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-sm">
        <div>
           <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
             <PI.UserFocus size={32} className="text-indigo-400" weight="duotone" />
             Gestión de Talento
           </h2>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1 ml-12">Administración de perfiles y accesos ELVIA</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group min-w-[320px]">
            <PI.MagnifyingGlass size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="BUSCAR POR NOMBRE O EMAIL..." 
              value={search}
              onChange={e => {setSearch(e.target.value); setPage(0)}}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-[1.5rem] pl-14 pr-6 py-4 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all italic placeholder:text-slate-700"
            />
          </div>
          
          <button 
            onClick={handleRefresh}
            className="p-4 bg-slate-950 border border-slate-800 rounded-[1.5rem] text-slate-400 hover:text-white hover:bg-slate-800 transition-all group flex items-center gap-3 active:scale-95 shadow-xl"
            title="Sincronización Maestra"
          >
            <PI.ArrowClockwise size={20} weight="bold" className={`${localLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-700`} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline italic">Refrescar</span>
          </button>
        </div>
      </div>

      <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative">
        {localLoading && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
             <div className="bg-indigo-600/10 border border-indigo-500/30 px-6 py-3 rounded-2xl flex items-center gap-3">
               <PI.CircleNotch size={20} className="text-indigo-500 animate-spin" />
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Refrescando Red...</span>
             </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                {['Candidato', 'Suscripción', 'País', 'Inteligencia', 'Rol', 'Estado', 'Registro', 'Gestión'].map(h => (
                  <th key={h} className="px-6 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginated.length === 0
                ? <tr><td colSpan={8} className="px-6 py-24 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">No se detectaron usuarios registrados</td></tr>
                : paginated.map(u => <UserRow key={u.id} u={u} onEdit={setEditUser} onView={setViewUser} fmtDate={fmtDate} />)
              }
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-10 py-6 bg-slate-900/30 border-t border-slate-800">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Mostrando {paginated.length} de {filtered.length} perfiles</span>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`min-w-[36px] h-9 rounded-xl text-[10px] font-black transition-all border ${
                    i === page 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-900/30' 
                      : 'text-slate-500 border-slate-800 hover:text-white hover:border-slate-600'
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {viewUser && (
        <ViewUserDetailModal 
          user={viewUser} 
          onClose={() => setViewUser(null)} 
          fmtDate={fmtDate} 
          db={db}
        />
      )}
      {editUser && (
        <EditUserModal 
          user={editUser} 
          onClose={() => setEditUser(null)} 
          onSave={async (id, updates) => {
            const { error } = await db.from('profiles').update(updates).eq('id', id)
            if (error) {
              toast.error('Error al actualizar: ' + error.message)
            } else {
              toast.success('Perfil actualizado')
              onRefresh()
              setEditUser(null)
            }
          }} 
        />
      )}
    </div>
  )
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const ViewUserDetailModal = ({ user, onClose, fmtDate, db }) => {
  const [stats, setStats] = useState({ cvs: 0, matches: 0, loading: true })
  const nombre = [user.nombre1, user.nombre2, user.apellido1, user.apellido2].filter(Boolean).join(' ') || 'Sin nombre'
  
  // Subscription Intelligence
  const expiresAt = user.plan_expires_at ? new Date(user.plan_expires_at) : null
  const daysRemaining = expiresAt ? Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cvRes, matchRes] = await Promise.all([
          db.from('cv_results').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          db.from('job_checks').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        ])
        setStats({ 
          cvs: cvRes.count || 0, 
          matches: matchRes.count || 0, 
          loading: false 
        })
      } catch (err) {
        console.error('Error fetching user stats:', err)
        setStats(s => ({ ...s, loading: false }))
      }
    }
    fetchStats()
  }, [user.id, db])

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
      <div className="bg-[#0B0F1A] border border-slate-800 rounded-[3rem] p-12 w-full max-w-3xl shadow-[0_0_100px_rgba(79,70,229,0.15)] relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        
        <div className="flex items-center justify-between mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-xl">
              <PI.IdentificationCard size={32} weight="duotone" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Análisis Avanzado de Perfil</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">ID MAESTRO: {user.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-800/30 hover:bg-slate-800 rounded-2xl transition-all border border-slate-800/50">
            <PI.X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          {/* Col 1: Identidad & App Use */}
          <div className="space-y-8">
            <div>
              <SectionTag label="Información de Identidad" />
              <div className="space-y-6 mt-6">
                <DetailItem label="Nombre Completo" value={nombre} />
                <DetailItem label="Correo Principal" value={user.email_principal} />
                <DetailItem label="País / Región" value={user.pais || 'No especificado'} />
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800/50">
              <SectionTag label="Uso de la Plataforma" />
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <UsageCard label="CVs Generadas" value={stats.loading ? '...' : stats.cvs} icon={PI.FileText} color="indigo" />
                 <UsageCard label="Llamados al Bot" value={stats.loading ? '...' : stats.matches} icon={PI.Robot} color="violet" />
                 <UsageCard label="Total Acciones" value={user.usage_count || 0} icon={PI.Fingerprint} color="blue" />
                 <UsageCard label="Acceso" value={fmtDate(user.updated_at)} icon={PI.ClockCounterClockwise} color="emerald" smaller />
              </div>
            </div>
          </div>

          {/* Col 2: Suscripción & Status */}
          <div className="space-y-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <PI.Crown size={64} weight="duotone" />
              </div>
              <SectionTag label="Plan & Facturación" />
              <div className="mt-8 space-y-6">
                <div className="flex justify-between items-end">
                   <DetailItem label="Plan Actual" value={user.plan?.toUpperCase() || 'FREE'} isBadge color={user.plan === 'trimestral' ? 'purple' : user.plan === 'mensual' ? 'indigo' : 'slate'} />
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Estado</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${user.suspended ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {user.suspended ? 'SUSPENDIDO' : 'ACTIVO'}
                      </span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
                   <DetailItem label="Registro" value={fmtDate(user.created_at)} />
                   <DetailItem label="Caducidad" value={user.plan_expires_at ? fmtDate(user.plan_expires_at) : 'Sin límite'} />
                </div>

                {daysRemaining !== null && (
                  <div className={`mt-6 p-4 rounded-2xl border flex items-center justify-between shadow-xl ${isExpiringSoon ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400'}`}>
                    <div className="flex items-center gap-3">
                      <PI.CalendarCheck size={20} weight="duotone" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Días Restantes</span>
                    </div>
                    <span className="text-lg font-black italic">{daysRemaining}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] border border-slate-800/50 bg-slate-900/20">
               <SectionTag label="Análisis del Candidato" />
               <p className="text-[11px] text-slate-500 mt-6 leading-relaxed italic">
                 {user.cv_optimizer_count > 0 
                  ? "Este candidato tiene un perfil optimizado y activo. Ha consumido sus cuotas de IA para refinamiento de currículum." 
                  : "Candidato en fase inicial. Aún no ha realizado optimizaciones de perfil con inteligencia artificial."
                 }
               </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/50 flex justify-end gap-4 relative z-10">
           <button onClick={onClose} className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40 italic flex items-center gap-3">
             <PI.CheckCircle size={18} weight="bold" /> Finalizar Revisión
           </button>
        </div>
      </div>
    </div>
  )
}

const SectionTag = ({ label }) => (
  <div className="flex items-center gap-3 uppercase font-black text-[9px] tracking-[0.4em] text-slate-700 italic">
    <div className="h-[2px] w-8 bg-slate-800" />
    {label}
  </div>
)

const UsageCard = ({ label, value, icon: Icon, color, smaller }) => (
  <div className="bg-[#0f172a]/60 p-5 rounded-3xl border border-slate-800/60 shadow-lg group hover:border-slate-700 transition-all">
    <div className={`p-2.5 w-fit rounded-xl mb-4 bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 group-hover:scale-110 transition-transform`}>
      <Icon size={18} weight="duotone" />
    </div>
    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">{label}</p>
    <p className={`${smaller ? 'text-[11px]' : 'text-xl'} font-black text-white italic truncate`}>{value}</p>
  </div>
)

const DetailItem = ({ label, value, isBadge, color }) => (
  <div>
    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5 italic">{label}</p>
    {isBadge ? (
      <Badge color={color}>{value}</Badge>
    ) : (
      <p className="text-sm font-bold text-white uppercase italic tracking-tight">{value}</p>
    )}
  </div>
)

const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    plan: user.plan || 'free',
    role: user.role || 'usuario',
    suspended: !!user.suspended
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave(user.id, formData)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
      <div className="bg-[#0B0F1A] border border-slate-800 rounded-[3rem] p-10 w-full max-w-sm shadow-[0_0_100px_rgba(79,70,229,0.15)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[80px] rounded-full" />
        
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <PI.Gear size={24} weight="duotone" />
            </div>
            <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Acciones Administrador</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[150px]">{user.email_principal}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Plan de Suscripción</label>
            <select 
              value={formData.plan} 
              onChange={e => setFormData({ ...formData, plan: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-black uppercase italic"
            >
              <option value="free">FREE ACCESS</option>
              <option value="semanal">PLAN SEMANAL</option>
              <option value="mensual">PLAN MENSUAL</option>
              <option value="trimestral">PLAN TRIMESTRAL</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Credenciales / Rol</label>
            <select 
              value={formData.role} 
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-black uppercase italic"
            >
              <option value="usuario">USUARIO ESTÁNDAR</option>
              <option value="super_admin">ADMIN MAESTRO</option>
              <option value="company_admin">ADMIN EMPRESA</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-slate-800">
             <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Suspensión</span>
                <span className="text-[8px] text-slate-600 font-bold uppercase">Congelar acceso</span>
             </div>
             <button 
              type="button"
              onClick={() => setFormData({ ...formData, suspended: !formData.suspended })}
              className={`w-12 h-6 rounded-full transition-all relative ${formData.suspended ? 'bg-rose-600 shadow-lg shadow-rose-900/40' : 'bg-slate-700'}`}
             >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${formData.suspended ? 'left-7' : 'left-1'}`} />
             </button>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-slate-800 transition-all italic">
              Descartar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-900/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2 italic"
            >
              {loading ? <PI.CircleNotch size={16} className="animate-spin" /> : <PI.ShieldCheck size={16} weight="bold" />}
              {loading ? 'Sincronizando' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const QuickStatCard = ({ label, value, icon: Icon, sub, color }) => (
  <div className="bg-[#0B0F1A] border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-2xl">
    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-${color}-400`}>
      <Icon size={80} weight="duotone" />
    </div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 flex items-center justify-center mb-6`}>
        <Icon size={24} weight="duotone" />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-3xl font-black text-white italic tracking-tighter">{value}</h4>
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{sub}</span>
      </div>
    </div>
  </div>
)

export default UsersTab
