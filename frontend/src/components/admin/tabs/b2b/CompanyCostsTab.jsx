import React from 'react'
import * as PI from '@phosphor-icons/react'
import Badge from '../../shared/Badge'
import SectionHeading from '../../shared/SectionHeading'

const CompanyCostsTab = ({ company, costs, onExport }) => {
  if (!company) return null

  const summary = costs?.summary || { totalCost: 0, totalUserPlans: 0, totalMentorPackages: 0 }
  const plans = costs?.userPlans || []

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl">
       <SectionHeading 
          title="Inversión Corporativa" 
          subtitle="Reporte financiero y desglose de facturación por perfil"
          icon={PI.Receipt}
       >
          <button
            onClick={() => onExport()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-3 italic active:scale-95"
          >
            <PI.DownloadSimple size={18} weight="bold" /> Exportar Auditoría
          </button>
       </SectionHeading>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#111827] p-8 rounded-[2.5rem] border border-slate-800 shadow-xl group hover:border-slate-700 transition-all">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Total Planes B2B</p>
             <p className="text-3xl font-black text-white italic">$ {summary.totalUserPlans.toLocaleString()} <span className="text-xs text-slate-700">USD</span></p>
          </div>
          <div className="bg-[#111827] p-8 rounded-[2.5rem] border border-slate-800 shadow-xl group hover:border-slate-700 transition-all">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Mentoria / Coaching</p>
             <p className="text-3xl font-black text-white italic">$ {summary.totalMentorPackages.toLocaleString()} <span className="text-xs text-slate-700">USD</span></p>
          </div>
          <div className="bg-indigo-600/10 p-8 rounded-[2.5rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-[60px] rounded-full" />
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3 italic">Inversión Final</p>
             <p className="text-4xl font-black text-white italic tracking-tighter">$ {summary.totalCost.toLocaleString()} <span className="text-sm text-indigo-600">USD</span></p>
          </div>
       </div>

       <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden mt-8">
          <div className="px-10 py-6 border-b border-slate-800 flex items-center justify-between">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Desglose de Beneficiarios</h3>
             <PI.UsersFour size={20} className="text-slate-800" />
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-900/50 border-b border-slate-800">
                   <tr className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500">
                      <th className="px-10 py-5">Colaborador / Perfil</th>
                      <th className="px-10 py-5">Suscripción Asignada</th>
                      <th className="px-10 py-5">Valor Unidad</th>
                      <th className="px-10 py-5 text-right">Estatus Legal</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                   {plans.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                         <td className="px-10 py-7">
                            <div className="flex items-center gap-4">
                               <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                  <PI.User size={18} weight="duotone" />
                               </div>
                               <p className="text-sm font-black text-white uppercase italic tracking-tight">{p.assigned_to || 'Sin asignar'}</p>
                            </div>
                         </td>
                         <td className="px-10 py-7">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{p.plan_type}</span>
                         </td>
                         <td className="px-10 py-7">
                            <p className="text-sm font-black text-white italic tracking-tighter">$ {p.price_mxn.toLocaleString()}</p>
                         </td>
                         <td className="px-10 py-7 text-right">
                            <Badge color="green">VIGENTE</Badge>
                         </td>
                      </tr>
                   ))}
                   {plans.length === 0 && (
                      <tr>
                         <td colSpan="4" className="px-10 py-24 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] italic">No se han registrado transacciones de facturación corporativa</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  )
}

export default CompanyCostsTab
