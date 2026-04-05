import React, { useState, useEffect } from 'react'
import * as PI from '@phosphor-icons/react'
import KpiCard from '../shared/KpiCard'
import SectionHeading from '../shared/SectionHeading'
import Badge from '../shared/Badge'

const CreateCompanyModal = ({ onClose, onSubmit, loading }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email) { alert('Completa todos los campos'); return }
    onSubmit(name, email)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] rounded-full" />
        
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <PI.Buildings size={24} weight="duotone" />
            </div>
            <div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Nueva Entidad B2B</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Apertura de cuenta corporativa</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Razón Social / Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase italic font-bold"
              placeholder="EJ: ACME GLOBAL"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Email de Contacto</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
              placeholder="corporativo@empresa.com"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all text-[11px] shadow-xl shadow-blue-900/20 italic"
            >
              {loading ? 'Inicializando...' : 'Crear Empresa →'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest italic"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AssignAdminModal = ({ company, onClose, onSubmit, loading }) => {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre || !email) { alert('Completa nombre y email'); return }
    onSubmit(nombre, apellido, email)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[80px] rounded-full" />
        
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PI.UserPlus size={24} weight="duotone" />
            </div>
            <div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Asignar Gestor</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enlace para: <span className="text-emerald-400">{company.name}</span></p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Nombre</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold uppercase italic"
                placeholder="JUAN"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Apellido</label>
              <input
                type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold uppercase italic"
                placeholder="PÉREZ"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Email Profesional</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
              placeholder="juan@empresa.com"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all text-[11px] shadow-xl shadow-emerald-900/20 italic"
            >
              {loading ? 'Asignando...' : 'Confirmar Gestor →'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest italic"
            >
              Omitir por ahora
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const B2BTab = ({ db, API_URL }) => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [newCompany, setNewCompany] = useState(null)
  const [creating, setCreating] = useState(false)
  const [assigningAdmin, setAssigningAdmin] = useState(false)

  useEffect(() => { fetchCompanies() }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await db.auth.getSession()
      const response = await fetch(`${API_URL}/api/admin/companies`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await response.json()
      setCompanies(json.companies || [])
    } catch (err) {
      console.error('[B2BTab] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (name, email) => {
    try {
      setCreating(true)
      const { data: { session } } = await db.auth.getSession()
      const response = await fetch(`${API_URL}/api/admin/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
      })
      const json = await response.json()
      if (response.ok) {
        setNewCompany(json.company)
        setShowCreateModal(false)
        setShowAdminModal(true)
      } else {
        alert('Error: ' + (json.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  const handleAssignAdmin = async (nombre, apellido, email) => {
    try {
      setAssigningAdmin(true)
      const { data: { session } } = await db.auth.getSession()
      const response = await fetch(`${API_URL}/api/admin/companies/${newCompany.id}/admins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, apellido, email })
      })
      if (response.ok) {
        setShowAdminModal(false)
        setNewCompany(null)
        await fetchCompanies()
      } else {
        const json = await response.json()
        alert('Error: ' + (json.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Error de conexión')
    } finally {
      setAssigningAdmin(false)
    }
  }

  const handleToggleActive = async (id, isActive) => {
    try {
      const { data: { session } } = await db.auth.getSession()
      const response = await fetch(`${API_URL}/api/admin/companies/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      })
      if (response.ok) await fetchCompanies()
    } catch (err) {
      console.error('[B2BTab] Toggle error:', err)
    }
  }

  const activeCount = companies.filter(c => c.is_active).length

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl">
      <SectionHeading 
        title="Unidades de Negocio" 
        subtitle="Gestión de alianzas estratégicas y cuentas corporativas"
        icon={PI.Buildings}
      >
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-900/20"
        >
          <PI.Plus size={16} weight="bold" /> Registrar Alianza
        </button>
      </SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard label="Alianzas Activas" value={activeCount} sub="CUENTAS OPERATIVAS" icon={PI.CheckSquareOffset} color="blue" />
        <KpiCard label="Pipeline Total" value={companies.length} sub="ENTIDADES REGISTRADAS" icon={PI.Briefcase} color="green" />
      </div>

      <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500">
                <th className="px-10 py-5">Identidad Corporativa</th>
                <th className="px-10 py-5">Contacto Principal</th>
                <th className="px-10 py-5">Estado</th>
                <th className="px-10 py-5">Alta</th>
                <th className="px-10 py-5">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={5} className="px-10 py-24 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">Sincronizando entidades...</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-24 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">No hay alianzas registradas</td></tr>
              ) : companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                          <PI.Buildings size={22} weight="duotone" />
                       </div>
                       <p className="text-sm font-black text-white uppercase italic tracking-tight">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.email}</p>
                  </td>
                  <td className="px-10 py-7">
                    <Badge color={c.is_active ? 'green' : 'red'}>
                      {c.is_active ? 'OPERATIVA' : 'SUSPENDIDA'}
                    </Badge>
                  </td>
                  <td className="px-10 py-7">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </p>
                  </td>
                  <td className="px-10 py-7">
                    <button
                      onClick={() => handleToggleActive(c.id, c.is_active)}
                      className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
                        c.is_active 
                          ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' 
                          : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      {c.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && <CreateCompanyModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateCompany} loading={creating} />}
      {showAdminModal && newCompany && <AssignAdminModal company={newCompany} onClose={() => { setShowAdminModal(false); setNewCompany(null) }} onSubmit={handleAssignAdmin} loading={assigningAdmin} />}
    </div>
  )
}

export default B2BTab
