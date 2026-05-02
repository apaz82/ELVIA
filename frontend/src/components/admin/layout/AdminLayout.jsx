import React from 'react'
import AdminSidebar from './AdminSidebar'
import * as PI from '@phosphor-icons/react'

const AdminLayout = ({ children, currentTab, onTabChange, onLogout, adminUser, theme, toggleTheme }) => {
  const isLight = theme === 'light';
  
  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0B0F1A] text-slate-300'}`}>
      <AdminSidebar 
        currentTab={currentTab} 
        onTabChange={onTabChange} 
        onLogout={onLogout} 
        theme={theme}
      />
      
      <main className="flex-1 ml-72 min-h-screen flex flex-col overflow-y-auto relative">
        {/* Top bar for theme toggle */}
        <header className={`px-10 py-6 border-b flex justify-between items-center z-10 sticky top-0 backdrop-blur-md ${isLight ? 'bg-white/80 border-slate-200' : 'bg-[#0B0F1A]/80 border-slate-800'}`}>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black uppercase tracking-widest italic">
               Panel B2C
            </h2>
          </div>
          <button 
            onClick={toggleTheme}
            className={`p-3 rounded-xl transition-all ${isLight ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            {isLight ? <PI.Moon size={20} weight="fill" /> : <PI.Sun size={20} weight="fill" />}
          </button>
        </header>
        
        <div className="flex-1 p-10">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
