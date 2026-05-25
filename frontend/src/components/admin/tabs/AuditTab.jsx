import React, { useState, useEffect, useCallback } from 'react'
import * as PI from '@phosphor-icons/react'
import SectionHeading from '../shared/SectionHeading'
import AdminSkeleton from '../shared/AdminSkeleton'

const ACTION_META = {
  tenant_created:    { label: 'Tenant creado',       color: 'emerald', icon: PI.Buildings },
  hr_admin_created:  { label: 'Admin HR creado',     color: 'blue',    icon: PI.UserPlus },
  user_invited:      { label: 'Usuario invitado',    color: 'indigo',  icon: PI.EnvelopeSimple },
  user_removed:      { label: 'Usuario eliminado',   color: 'rose',    icon: PI.UserMinus },
  allowlist_updated: { label: 'Allowlist actualizada', color: 'amber', icon: PI.ListChecks },
  config_changed:    { label: 'Config cambiada',     color: 'violet',  icon: PI.Gear },
}

const COLOR = {
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  blue:    'text-blue-400    bg-blue-500/10    border-blue-500/20',
  indigo:  'text-indigo-400  bg-indigo-500/10  border-indigo-500/20',
  rose:    'text-rose-400    bg-rose-500/10    border-rose-500/20',
  amber:   'text-amber-400   bg-amber-500/10   border-amber-500/20',
  violet:  'text-violet-400  bg-violet-500/10  border-violet-500/20',
  slate:   'text-slate-400   bg-slate-800      border-slate-700',
}

const LIMIT = 50

const ActionBadge = ({ action }) => {
  const meta = ACTION_META[action] || { label: action, color: 'slate', icon: PI.Circle }
  const Icon = meta.icon
  const cls  = COLOR[meta.color]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest ${cls}`}>
      <Icon size={12} weight="duotone" />
      {meta.label}
    </span>
  )
}

const fmtDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const MetaCell = ({ metadata }) => {
  if (!metadata || !Object.keys(metadata).length) return <span className="text-slate-700">—</span>
  const entries = Object.entries(metadata).slice(0, 3)
  return (
    <div className="space-y-0.5">
      {entries.map(([k, v]) => (
        <p key={k} className="text-[9px] text-slate-500">
          <span className="text-slate-600 font-bold">{k}:</span>{' '}
          <span className="font-mono text-slate-400">{String(v).slice(0, 30)}</span>
        </p>
      ))}
    </div>
  )
}

const AuditTab = ({ db, API_URL }) => {
  const [logs, setLogs]           = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading]     = useState(true)
  const [offset, setOffset]       = useState(0)
  const [hasMore, setHasMore]     = useState(true)
  const [filterCompany, setFilterCompany] = useState('')
  const [filterAction, setFilterAction]   = useState('')

  const fetchCompanies = useCallback(async () => {
    try {
      const { data: { session } } = await db.auth.getSession()
      const res  = await fetch(`${API_URL}/api/admin/companies`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      setCompanies(json.companies || [])
    } catch { /* silent */ }
  }, [db, API_URL])

  const fetchLogs = useCallback(async (off = 0, reset = false) => {
    setLoading(true)
    try {
      const { data: { session } } = await db.auth.getSession()
      const params = new URLSearchParams({ limit: LIMIT, offset: off })
      if (filterCompany) params.set('company_id', filterCompany)
      const res  = await fetch(`${API_URL}/api/admin/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      const newLogs = json.logs || []
      setLogs(prev => reset ? newLogs : [...prev, ...newLogs])
      setHasMore(newLogs.length === LIMIT)
      setOffset(off + newLogs.length)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [db, API_URL, filterCompany])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])
  useEffect(() => { setOffset(0); fetchLogs(0, true) }, [fetchLogs])

  const displayed = filterAction
    ? logs.filter(l => l.action === filterAction)
    : logs

  if (loading && logs.length === 0) return <AdminSkeleton type="table" />

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl">
      <SectionHeading
        title="Audit Log B2B"
        subtitle="Registro inmutable de acciones sobre tenants y usuarios del panel super_admin"
        icon={PI.ClockCounterClockwise}
      >
        <button
          onClick={() => { setOffset(0); fetchLogs(0, true) }}
          className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
        >
          <PI.ArrowClockwise size={14} weight="bold" />
          Actualizar
        </button>
      </SectionHeading>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterCompany}
          onChange={e => { setFilterCompany(e.target.value); setOffset(0) }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        >
          <option value="">Todos los tenants</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_META).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {(filterCompany || filterAction) && (
          <button
            onClick={() => { setFilterCompany(''); setFilterAction('') }}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
          >
            <PI.X size={12} weight="bold" /> Limpiar
          </button>
        )}

        <p className="ml-auto text-[10px] font-black text-slate-600 uppercase tracking-widest self-center">
          {displayed.length} entradas
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative">
        {loading && logs.length > 0 && (
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="bg-indigo-600/10 border border-indigo-500/30 px-6 py-3 rounded-2xl flex items-center gap-3">
              <PI.CircleNotch size={18} className="text-indigo-500 animate-spin" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Cargando...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500">
                <th className="px-8 py-5">Fecha</th>
                <th className="px-8 py-5">Tenant</th>
                <th className="px-8 py-5">Acción</th>
                <th className="px-8 py-5">Entidad</th>
                <th className="px-8 py-5">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {displayed.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <PI.ClipboardText size={32} className="text-slate-700 mx-auto mb-3" weight="duotone" />
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                      Sin entradas en el audit log
                    </p>
                    <p className="text-slate-700 text-[10px] mt-1">
                      Las acciones del wizard de tenants aparecerán aquí
                    </p>
                  </td>
                </tr>
              ) : displayed.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {fmtDateTime(log.created_at)}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-[11px] font-black text-white uppercase italic">
                      {log.companies?.name || '—'}
                    </p>
                    <p className="text-[9px] font-mono text-slate-600">
                      {log.companies?.slug || ''}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {log.entity || '—'}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <MetaCell metadata={log.metadata} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {hasMore && !filterAction && (
          <div className="px-8 py-5 border-t border-slate-800 flex justify-center">
            <button
              onClick={() => fetchLogs(offset)}
              disabled={loading}
              className="px-8 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? <PI.CircleNotch size={14} className="animate-spin" /> : <PI.ArrowDown size={14} weight="bold" />}
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditTab
