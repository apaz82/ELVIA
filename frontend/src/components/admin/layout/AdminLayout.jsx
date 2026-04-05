import React from 'react'
import AdminSidebar from './AdminSidebar'

const AdminLayout = ({ children, activeTab, onTabChange, context, onLogout, user }) => {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-300 flex">
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        context={context} 
        onLogout={onLogout} 
      />
      
      <main className="flex-1 ml-72 p-10 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {/* Header context info could go here if needed */}
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
