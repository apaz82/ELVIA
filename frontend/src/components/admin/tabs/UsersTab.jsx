import React, { useState } from 'react'
import * as PI from '@phosphor-icons/react'
import Badge from '../shared/Badge'
import SectionHeading from '../shared/SectionHeading'

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
  const PER_PAGE = 10

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q
      || (u.email_principal || '').toLowerCase().includes(q)
      || [u.nombre1, u.nombre2, u.apellido1, u.apellido2].filter(Boolean).join(' ').toLowerCase().includes(q)
      || (u.pais || '').toLowerCase().includes(q)
  })

  const paginated  = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeading 
        title="Gestión de Talento" 
        subtitle="Administración de perfiles y accesos del sistema"
        icon={PI.UsersThree}
      >
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-[1.5rem] border border-slate-800">
          <div className="relative w-72">
            <PI.MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text" placeholder="BUSCAR CANDIDATO..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-700 transition-all"
            />
          </div>
          <button onClick={onRefresh}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-95">
            <PI.ArrowClockwise size={20} weight="bold" />
          </button>
        </div>
      </SectionHeading>

      <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
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
                ? <tr><td colSpan={8} className="px-6 py-24 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">No se detectaron usuarios</td></tr>
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

      {/* Modals placeholders - to be integrated later or kept if handled by parent */}
    </div>
  )
}

export default UsersTab
