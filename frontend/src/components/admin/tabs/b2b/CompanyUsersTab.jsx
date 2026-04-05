import React, { useState } from 'react'
import * as PI from '@phosphor-icons/react'
import Badge from '../../shared/Badge'
import SectionHeading from '../../shared/SectionHeading'

const InviteUserModal = ({ company, onClose, onRefresh, db, API_URL }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { alert('Ingresa un email corporativo'); return }
    
    setLoading(true)
    try {
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API_URL}/api/company/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, company_id: company.id })
      })
      if (res.ok) {
        onRefresh()
        onClose()
      } else {
        const json = await res.json()
        alert('Error: ' + (json.error || 'No se pudo enviar la invitación'))
      }
    } catch (err) {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[80px] rounded-full" />
        
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <PI.PaperPlaneTilt size={24} weight="duotone" />
            </div>
            <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Expandir Equipo</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{company.name}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Correo del Candidato</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="TALENTO@EMPRESA.COM"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold uppercase italic"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all italic">
              Abortar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-900/40 disabled:opacity-50 transition-all flex items-center justify-center gap-3 italic"
            >
              {loading ? <PI.ArrowClockwise size={16} className="animate-spin" /> : <PI.PaperPlaneTilt size={16} weight="bold" />}
              {loading ? 'Transmitiendo...' : 'Enviar Pase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const CompanyUsersTab = ({ company, users, invitations, onRefresh, fmtDate, db, API_URL }) => {
  const [showInviteModal, setShowInviteModal] = useState(false)

  if (!company) return null

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl">
       <SectionHeading 
          title="Fuerza Laboral" 
          subtitle="Gestión de colaboradores registrados e invitaciones en tránsito"
          icon={PI.UsersFour}
       >
          <div className="flex gap-4">
            <button
              onClick={() => {
                const headers = ["Nombre", "Email", "Plan", "CVs Optimizadas", "Llamados Bot", "Uso Total", "Expiración", "Estado"]
                const rows = users.map(u => [
                  `${u.nombre1 || ''} ${u.apellido1 || ''}`.trim() || 'Sin Nombre',
                  u.email_principal,
                  u.plan || 'Corporativo',
                  u.cv_optimizer_count || 0,
                  u.cv_match_count || 0,
                  u.usage_count || 0,
                  u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString() : 'N/A',
                  u.suspended ? 'Suspendido' : 'Activo'
                ])
                
                const csvContent = "data:text/csv;charset=utf-8," 
                  + headers.join(",") + "\n"
                  + rows.map(e => e.join(",")).join("\n")

                const encodedUri = encodeURI(csvContent)
                const link = document.createElement("a")
                link.setAttribute("href", encodedUri)
                link.setAttribute("download", `Reporte_Talento_${company.name.replace(/\s+/g, '_')}.csv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl border border-slate-700 transition-all flex items-center gap-3 italic active:scale-95"
            >
              <PI.FileCsv size={18} weight="duotone" /> Exportar Reporte
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-3 italic active:scale-95"
            >
              <PI.Plus size={18} weight="bold" /> Invitar Colaborador
            </button>
          </div>
       </SectionHeading>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Usuarios Registrados */}
          <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative group">
             <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Efectivos Registrados</h3>
                <span className="bg-indigo-600 font-bold text-white px-3 py-1 rounded-full text-[10px] tracking-widest shadow-lg shadow-indigo-900/20 shrink-0">{users.length}</span>
             </div>
             <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                {users.map(u => (
                   <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all group/row">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-black text-indigo-400 group-hover/row:border-indigo-500/30 transition-all italic">
                            {(u.nombre1?.[0] || u.email_principal?.[0]).toUpperCase()}
                         </div>
                         <div className="min-w-0">
                            <p className="text-sm font-black text-white uppercase italic tracking-tight truncate max-w-[140px]">{u.nombre1} {u.apellido1}</p>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate max-w-[140px]">{u.email_principal}</p>
                         </div>
                      </div>
                      <Badge color="blue">{u.plan || 'CORPORATIVO'}</Badge>
                   </div>
                ))}
                {users.length === 0 && (
                  <div className="py-24 text-center">
                    <PI.UserCircleDashed size={48} className="mx-auto text-slate-800 mb-4" weight="duotone" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Aún no hay usuarios activos</p>
                  </div>
                )}
             </div>
          </div>

          {/* Invitaciones Pendientes */}
          <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative group">
             <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Tickets de Acceso Pendientes</h3>
                <span className="bg-emerald-600 font-bold text-white px-3 py-1 rounded-full text-[10px] tracking-widest shadow-lg shadow-emerald-900/20 shrink-0">{invitations.length}</span>
             </div>
             <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                {invitations.map(inv => (
                   <div key={inv.id} className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all group/row">
                      <div className="min-w-0">
                         <p className="text-xs font-black text-white uppercase italic tracking-wide truncate max-w-[180px]">{inv.email}</p>
                         <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Expira: {fmtDate(inv.expires_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 italic tracking-widest">PENDIENTE</span>
                      </div>
                   </div>
                ))}
                {invitations.length === 0 && (
                  <div className="py-24 text-center">
                    <PI.EnvelopeSimpleOpen size={48} className="mx-auto text-slate-800 mb-4" weight="duotone" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No hay pases en espera</p>
                  </div>
                )}
             </div>
          </div>
       </div>

       {showInviteModal && (
         <InviteUserModal 
            company={company} 
            onClose={() => setShowInviteModal(false)} 
            onRefresh={onRefresh}
            db={db}
            API_URL={API_URL}
         />
       )}
    </div>
  )
}

export default CompanyUsersTab
