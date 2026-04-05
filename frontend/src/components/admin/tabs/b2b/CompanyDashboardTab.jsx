import React from 'react'
import * as PI from '@phosphor-icons/react'
import KpiCard from '../../shared/KpiCard'

const CompanyDashboardTab = ({ company, data }) => {
  if (!company) return (
    <div className="py-32 flex flex-col items-center justify-center text-center animate-fade-in">
       <PI.Buildings size={64} className="text-slate-800 mb-6" weight="duotone" />
       <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm mb-2">Selección Requerida</p>
       <p className="text-[10px] text-slate-700 max-w-xs mx-auto font-black uppercase">Elija una entidad corporativa para desplegar su panel de control estratégico.</p>
    </div>
  )

  const stats = data.stats || { 
    activeUsers: 0, 
    totalCredits: 0, 
    usedCredits: 0, 
    pendingInvitations: 0, 
    adoptionRate: 0, 
    cvOptimizerUse: 0, 
    cvMatchUse: 0 
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Adopción" value={`${stats.adoptionRate}%`} icon={PI.TrendUp} color="blue" />
        <KpiCard label="Créditos Usados" value={stats.usedCredits} icon={PI.ChartBar} color="amber" />
        <KpiCard label="CV Optimizer" value={stats.cvOptimizerUse} icon={PI.FileText} color="green" />
        <KpiCard label="CV vs Vacante" value={stats.cvMatchUse} icon={PI.Target} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Utilización del Plan */}
        <div className="lg:col-span-2 bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[80px] rounded-full group-hover:bg-indigo-600/10 transition-all duration-1000" />
          
          <div className="flex items-center gap-4 mb-10">
             <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <PI.Gauge size={24} weight="duotone" />
             </div>
             <div>
                <h3 className="font-black text-white text-lg italic uppercase">Consumo de Recursos</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Utilización del plan corporativo actual</p>
             </div>
          </div>

          <div className="space-y-10">
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cuota General de Créditos</span>
                   <span className="text-sm font-black text-white italic">{stats.usedCredits} <span className="text-[10px] text-slate-600">/ {stats.totalCredits || 100}</span></span>
                </div>
                <div className="h-5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 p-1">
                   <div
                     className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-900/40"
                     style={{ width: `${(stats.usedCredits / (stats.totalCredits || 100)) * 100}%` }}
                   />
                </div>
             </div>

             <div className="pt-10 border-t border-slate-800/50">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 italic">Distribución por herramienta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <span className="flex items-center gap-2"><PI.Sparkle size={14} className="text-emerald-500" /> CV OPTIMIZER</span>
                         <span className="text-white">{stats.cvOptimizerUse}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <span className="flex items-center gap-2"><PI.Crosshair size={14} className="text-violet-500" /> CV MATCH</span>
                         <span className="text-white">{stats.cvMatchUse}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-violet-500 rounded-full" style={{ width: '45%' }} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Círculo de Adopción */}
        <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl flex flex-col justify-center items-center text-center relative group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] rounded-full" />
           
           <div className="relative w-48 h-48 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                 <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-800" />
                 <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-indigo-500"
                    strokeDasharray={502.65}
                    strokeDashoffset={502.65 - (502.65 * stats.adoptionRate) / 100}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                 />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-5xl font-black text-white italic">{stats.adoptionRate}%</span>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">ADOPCIÓN</span>
              </div>
           </div>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
              Índice de empleados activos vs base total invitada.
           </p>
        </div>
      </div>
    </div>
  )
}

export default CompanyDashboardTab
