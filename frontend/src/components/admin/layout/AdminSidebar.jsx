import React from 'react'
import * as PI from '@phosphor-icons/react'

const TABS_B2C = [
  { id: 'overview',      label: 'Escritorio',     icon: PI.Kanban },
  { id: 'users',         label: 'Usuarios',       icon: PI.UsersThree },
  { id: 'b2b',           label: 'Empresas (B2B)', icon: PI.Storefront },
  { id: 'suscripciones', label: 'Suscripciones',  icon: PI.Coins },
  { id: 'codigos',       label: 'Códigos',        icon: PI.Tag },
  { id: 'waitlist',      label: 'Lista de Espera', icon: PI.ListStar },
  { id: 'marketing',     label: 'Marketing Hub',  icon: PI.TrendUp },
  { id: 'knowledge',     label: 'Conocimiento',   icon: PI.Brain },
  { id: 'cohort',        label: 'Cohort Telefónica', icon: PI.Binoculars },
  { id: 'audit',         label: 'Audit Log',      icon: PI.ClockCounterClockwise },
  { id: 'sistema',       label: 'Configuración',  icon: PI.Gear },
]

const SidebarItem = ({ id, label, icon: Icon, active, onClick, isLight }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 translate-x-1' 
        : isLight
            ? 'text-slate-500 hover:bg-slate-200 hover:text-indigo-600'
            : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
    }`}
  >
    <div className={`p-2 rounded-xl scale-90 ${active ? 'bg-white/10' : (isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-900 border border-slate-800')}`}>
      <Icon size={18} weight={active ? 'fill' : 'duotone'} className={active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-500 transition-colors'} />
    </div>
    <span className="flex-1 text-left">{label}</span>
    {active && <PI.CaretRight size={12} weight="bold" className="text-white/40" />}
  </button>
)

const AdminSidebar = ({ currentTab, onTabChange, onLogout, theme }) => {
  const isLight = theme === 'light';

  return (
    <aside className={`w-72 h-screen flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300 ${isLight ? 'bg-white border-r border-slate-200' : 'bg-[#0B0F1A] border-r border-slate-800'}`}>
      {/* Branding */}
      <div className="p-8 pb-10 flex flex-col items-center">
        <div className="mb-4 group flex items-center justify-center p-2 rounded-xl bg-indigo-500/10">
          <PI.ShieldCheck size={32} weight="duotone" className="text-indigo-500" />
        </div>
        <h1 className={`text-xl font-black tracking-tighter italic uppercase ${isLight ? 'text-slate-800' : 'text-white'}`}>
            ELVIA <span className="text-indigo-500">ADMIN</span>
        </h1>
        <p className="text-indigo-500/60 text-[9px] font-black tracking-[0.4em] mt-1 uppercase">Ops Center B2C</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 space-y-2 overflow-y-auto custom-scrollbar">
        {TABS_B2C.map((tab) => (
          <SidebarItem
            key={tab.id}
            {...tab}
            active={currentTab === tab.id}
            onClick={onTabChange}
            isLight={isLight}
          />
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className={`p-6 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/50'}`}>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border border-rose-500/10 transition-all group"
        >
          <PI.SignOut size={20} weight="duotone" className="group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest italic font-bold">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
