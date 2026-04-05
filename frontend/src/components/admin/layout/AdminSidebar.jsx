import React from 'react'
import * as PI from '@phosphor-icons/react'

const TABS_B2C = [
  { id: 'overview',      label: 'Escritorio',     icon: PI.Kanban },
  { id: 'users',         label: 'Usuarios',       icon: PI.UsersThree },
  { id: 'suscripciones', label: 'Suscripciones',  icon: PI.Coins },
  { id: 'codigos',       label: 'Códigos',        icon: PI.Tag },
  { id: 'empresas',      label: 'Empresas B2B',  icon: PI.Buildings },
  { id: 'waitlist',      label: 'Lista de Espera', icon: PI.ListStar },
  { id: 'marketing',     label: 'Marketing Hub',  icon: PI.TrendUp },
  { id: 'analytics',     label: 'Métricas',       icon: PI.ChartBar },
  { id: 'sistema',       label: 'Configuración',  icon: PI.Gear },
]

const TABS_B2B = [
  { id: 'company_overview', label: 'Dashboard Empresa', icon: PI.ChartLineUp },
  { id: 'company_users',    label: 'Usuarios & Invitaciones', icon: PI.UsersFour },
  { id: 'company_costs',    label: 'Reporte de Costos', icon: PI.Money },
  { id: 'company_settings', label: 'Configuración B2B', icon: PI.Gear },
]

const SidebarItem = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 translate-x-1' 
        : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
    }`}
  >
    <div className={`p-2 rounded-xl scale-90 ${active ? 'bg-white/10' : 'bg-slate-900 border border-slate-800'}`}>
      <Icon size={18} weight={active ? 'fill' : 'duotone'} className={active ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400 transition-colors'} />
    </div>
    <span className="flex-1 text-left">{label}</span>
    {active && <PI.CaretRight size={12} weight="bold" className="text-white/40" />}
  </button>
)

const AdminSidebar = ({ activeTab, onTabChange, context = 'B2C', onLogout }) => {
  const tabs = context === 'B2C' ? TABS_B2C : TABS_B2B

  return (
    <aside className="w-72 bg-[#0B0F1A] border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-50">
      {/* Branding */}
      <div className="p-8 pb-10 flex flex-col items-center">
        <div className="mb-4 group">
          <img 
            src="/elvia-logo-transparent.png" 
            alt="ELVIA Logo" 
            className="h-8 drop-shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:scale-105 transition-transform duration-500" 
          />
        </div>
        <h1 className="text-white text-xl font-black tracking-tighter italic uppercase">ELVIA <span className="text-indigo-500">ADMIN</span></h1>
        <p className="text-indigo-500/60 text-[9px] font-black tracking-[0.4em] mt-1 uppercase">Ops Center</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 space-y-2 overflow-y-auto custom-scrollbar">
        {tabs.map((tab) => (
          <SidebarItem
            key={tab.id}
            {...tab}
            active={activeTab === tab.id}
            onClick={onTabChange}
          />
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-slate-800/50">
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
