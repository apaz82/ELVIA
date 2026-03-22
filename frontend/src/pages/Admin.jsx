// Admin Dashboard — panel de administración completo
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import {
  ChartBar, Users, ShieldCheck, Coins, Gear, ArrowLeft,
  MagnifyingGlass, PencilSimple, Trash, CheckCircle, XCircle,
  Crown, ArrowsCounterClockwise, TrendUp, X,
  FileMagnifyingGlass, Briefcase, Kanban, Folders, BookmarkSimple,
  FloppyDisk, UserPlus, Lock, LockOpen, Warning, CircleNotch,
} from '@phosphor-icons/react'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',  Icon: ChartBar    },
  { id: 'users',     label: 'Usuarios',  Icon: Users       },
  { id: 'permisos',  label: 'Permisos',  Icon: ShieldCheck },
  { id: 'analytics', label: 'Analytics', Icon: TrendUp     },
  { id: 'finanzas',  label: 'Finanzas',  Icon: Coins       },
  { id: 'sistema',   label: 'Sistema',   Icon: Gear        },
]

const PLANES = {
  free:       { label: 'Gratuito',   credits: 2,   colorClass: 'text-on-surface-variant bg-surface-container-high' },
  pro:        { label: 'Pro',        credits: 20,  colorClass: 'text-primary bg-primary/10'                        },
  enterprise: { label: 'Enterprise', credits: 100, colorClass: 'text-amber-700 bg-amber-50'                        },
}

const FEATURES = [
  { key: 'cv_optimizer', label: 'CV Optimizer',  Icon: FileMagnifyingGlass, desc: 'Optimización de CV con IA'     },
  { key: 'cv_vs_job',    label: 'CV vs Vacante', Icon: MagnifyingGlass,     desc: 'Comparación de CV con oferta'  },
  { key: 'jobs',         label: 'Vacantes',       Icon: Briefcase,           desc: 'Búsqueda con Jooble'           },
  { key: 'pipeline',     label: 'Pipeline',        Icon: Kanban,              desc: 'Tablero de postulaciones'      },
  { key: 'mis_cvs',      label: 'Mis CVs',         Icon: Folders,             desc: 'Historial de CVs guardados'    },
  { key: 'mis_vacantes', label: 'Mis Vacantes',    Icon: BookmarkSimple,      desc: 'Vacantes favoritas'            },
]

const DEFAULT_FEATURES = {
  cv_optimizer: true, cv_vs_job: true, jobs: true,
  pipeline: true, mis_cvs: true, mis_vacantes: true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

const getInitials = (u) => {
  if (u.nombre1 && u.apellido1) return `${u.nombre1[0]}${u.apellido1[0]}`.toUpperCase()
  if (u.nombre) return u.nombre.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase()
  return '?'
}

const getPlanCredits = (plan) => PLANES[plan]?.credits ?? 2

const getLast7Days = (items, dateKey = 'created_at') => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const day = d.toISOString().split('T')[0]
    return {
      label: d.toLocaleDateString('es-MX', { weekday: 'short' }),
      count: items.filter(u => u[dateKey]?.startsWith(day)).length,
    }
  })
}

// ─── UI atoms ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, Icon, colorClass = 'bg-primary/10 text-primary' }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
        <Icon size={20} weight="duotone" />
      </div>
      <p className="text-2xl font-headline font-black text-primary tabular-nums">{value}</p>
      <p className="text-xs font-semibold text-on-surface mt-0.5">{label}</p>
      {sub && <p className="text-xs text-outline mt-0.5">{sub}</p>}
    </div>
  )
}

function MiniBarChart({ data, color = '#002650' }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-14">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-0.5">
          <div
            className="w-full rounded-t-sm"
            style={{ height: `${Math.max(2, (d.count / max) * 48)}px`, backgroundColor: color, opacity: 0.4 + (i / data.length) * 0.6 }}
          />
          <span className="text-[9px] text-outline capitalize">{d.label.slice(0, 2)}</span>
        </div>
      ))}
    </div>
  )
}

function PlanBadge({ plan }) {
  const p = PLANES[plan] || PLANES.free
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.colorClass}`}>{p.label}</span>
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-outline-variant'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ─── Modal edición usuario ─────────────────────────────────────────────────────

function UserModal({ u, onClose, onSave }) {
  const [form, setForm] = useState({
    plan:             u.plan || 'free',
    usage_count:      u.usage_count ?? 0,
    is_admin:         u.is_admin ?? false,
    suspended:        u.suspended ?? false,
    features_enabled: u.features_enabled ?? { ...DEFAULT_FEATURES },
  })
  const [saving, setSaving] = useState(false)
  const planCredits = getPlanCredits(form.plan)

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      plan:             form.plan,
      usage_count:      Math.max(0, form.usage_count),
      is_admin:         form.is_admin,
      suspended:        form.suspended,
      features_enabled: form.features_enabled,
    }).eq('id', u.id)
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-float w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{getInitials(u)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {`${u.nombre1 || u.nombre || 'Sin nombre'} ${u.apellido1 || ''}`.trim()}
              </p>
              <p className="text-xs text-outline">{u.id.slice(0, 10)}…</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container text-outline transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[62vh] overflow-y-auto">
          {/* Plan */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Plan</label>
            <div className="flex gap-2">
              {Object.entries(PLANES).map(([key, { label }]) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, plan: key }))}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors
                    ${form.plan === key ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Créditos */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">
              Usos consumidos <span className="font-normal text-outline">(límite: {planCredits})</span>
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => setForm(f => ({ ...f, usage_count: Math.max(0, f.usage_count - 1) }))}
                className="w-8 h-8 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center font-bold text-lg shrink-0">
                −
              </button>
              <div className="flex-1">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-on-surface">{form.usage_count} usados</span>
                  <span className="text-outline">{Math.max(0, planCredits - form.usage_count)} restantes</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${form.usage_count >= planCredits ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (form.usage_count / planCredits) * 100)}%` }} />
                </div>
              </div>
              <button onClick={() => setForm(f => ({ ...f, usage_count: f.usage_count + 1 }))}
                className="w-8 h-8 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center font-bold text-lg shrink-0">
                +
              </button>
            </div>
          </div>

          {/* Admin + Suspendido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200/50">
              <div className="flex items-center gap-2">
                <Crown size={14} weight="duotone" className="text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">Admin</span>
              </div>
              <Toggle checked={form.is_admin} onChange={v => setForm(f => ({ ...f, is_admin: v }))} />
            </div>
            <div className="flex items-center justify-between p-3 bg-error-container/30 rounded-xl border border-error/10">
              <div className="flex items-center gap-2">
                <Lock size={14} weight="duotone" className="text-error" />
                <span className="text-xs font-semibold text-error">Suspendido</span>
              </div>
              <Toggle checked={form.suspended} onChange={v => setForm(f => ({ ...f, suspended: v }))} />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Funcionalidades</label>
            <div className="space-y-1.5">
              {FEATURES.map(({ key, label, Icon }) => (
                <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <Icon size={14} weight="duotone" className="text-on-surface-variant" />
                    <span className="text-xs font-medium text-on-surface">{label}</span>
                  </div>
                  <Toggle
                    checked={form.features_enabled?.[key] !== false}
                    onChange={v => setForm(f => ({ ...f, features_enabled: { ...f.features_enabled, [key]: v } }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/20 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-outline-variant text-on-surface-variant text-sm font-medium py-2.5 rounded-xl hover:border-outline transition-colors">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="bold" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-float w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-error-container' : 'bg-surface-container'}`}>
            <Warning size={20} weight="duotone" className={danger ? 'text-error' : 'text-on-surface-variant'} />
          </div>
          <p className="text-sm text-on-surface mt-2">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-outline-variant text-on-surface-variant text-sm py-2.5 rounded-xl hover:border-outline transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-xl transition-colors ${danger ? 'bg-error text-white hover:bg-error/90' : 'btn-primary'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({ usuarios, cvResults }) {
  const hoy     = new Date().toISOString().split('T')[0]
  const hace7d  = new Date(Date.now() - 7 * 86400000)

  const totalUsuarios  = usuarios.length
  const nuevosHoy      = usuarios.filter(u => u.created_at?.startsWith(hoy)).length
  const nuevos7d       = usuarios.filter(u => new Date(u.created_at) > hace7d).length
  const totalAnalisis  = cvResults.length
  const analisis7d     = cvResults.filter(cv => new Date(cv.created_at) > hace7d).length
  const creditosUsados = usuarios.reduce((s, u) => s + (u.usage_count ?? 0), 0)
  const admins         = usuarios.filter(u => u.is_admin).length
  const suspendidos    = usuarios.filter(u => u.suspended).length

  const registros7d  = getLast7Days(usuarios)
  const analisisChart = getLast7Days(cvResults)

  const tiposAnalisis = {
    optimize: cvResults.filter(cv => cv.tipo === 'optimize').length,
    match:    cvResults.filter(cv => cv.tipo === 'match').length,
  }

  const paisCounts = {}
  usuarios.forEach(u => { if (u.pais) paisCounts[u.pais] = (paisCounts[u.pais] || 0) + 1 })
  const topPaises = Object.entries(paisCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total usuarios" value={totalUsuarios} sub={`+${nuevos7d} esta semana`} Icon={Users} colorClass="bg-primary/10 text-primary" />
        <StatCard label="Total análisis" value={totalAnalisis} sub={`+${analisis7d} esta semana`} Icon={FileMagnifyingGlass} colorClass="bg-secondary/10 text-secondary" />
        <StatCard label="Créditos usados" value={creditosUsados} sub={`${(creditosUsados / Math.max(totalUsuarios, 1)).toFixed(1)} promedio`} Icon={Coins} colorClass="bg-amber-100 text-amber-600" />
        <StatCard label="Nuevos hoy" value={nuevosHoy} sub={`${admins} admins · ${suspendidos} susp.`} Icon={UserPlus} colorClass="bg-green-100 text-green-600" />
      </div>

      {/* Mini charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-on-surface">Nuevos registros</p>
            <span className="text-xs text-outline">Últimos 7 días</span>
          </div>
          <MiniBarChart data={registros7d} color="#002650" />
          <p className="text-xs text-outline mt-3">{nuevos7d} registros en 7 días</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-on-surface">Análisis realizados</p>
            <span className="text-xs text-outline">Últimos 7 días</span>
          </div>
          <MiniBarChart data={analisisChart} color="#1461a2" />
          <p className="text-xs text-outline mt-3">{analisis7d} análisis en 7 días</p>
        </div>
      </div>

      {/* Splits row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipo análisis */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
          <p className="text-sm font-semibold text-on-surface mb-4">Tipo de análisis</p>
          <div className="space-y-3">
            {[
              { label: 'CV Optimizer',  val: tiposAnalisis.optimize, color: 'bg-primary'   },
              { label: 'CV vs Vacante', val: tiposAnalisis.match,    color: 'bg-secondary' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-on-surface">{label}</span>
                  <span className="text-outline">{val}</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${(val / Math.max(totalAnalisis, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planes */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
          <p className="text-sm font-semibold text-on-surface mb-4">Distribución de planes</p>
          <div className="space-y-2.5">
            {Object.entries(PLANES).map(([key, { label, colorClass }]) => {
              const cnt = usuarios.filter(u => (u.plan || 'free') === key).length
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-surface-container h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(cnt / Math.max(totalUsuarios, 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-outline w-5 text-right">{cnt}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top países */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
          <p className="text-sm font-semibold text-on-surface mb-4">Top países</p>
          <div className="space-y-2">
            {topPaises.length > 0 ? topPaises.map(([pais, cnt]) => (
              <div key={pais} className="flex items-center justify-between text-xs">
                <span className="text-on-surface font-medium truncate max-w-[110px]">{pais}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-surface-container h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${(cnt / Math.max(totalUsuarios, 1)) * 100}%` }} />
                  </div>
                  <span className="text-outline w-4 text-right">{cnt}</span>
                </div>
              </div>
            )) : <p className="text-xs text-outline italic">Sin datos de país aún</p>}
          </div>
        </div>
      </div>

      {/* Registros recientes */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <p className="text-sm font-semibold text-on-surface">Registros recientes</p>
          <span className="text-xs text-outline">{totalUsuarios} total</span>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {usuarios.slice(0, 6).map(u => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{getInitials(u)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-on-surface truncate">
                  {`${u.nombre1 || u.nombre || 'Sin nombre'} ${u.apellido1 || ''}`.trim()}
                </p>
                <p className="text-xs text-outline">{u.pais || 'País ?'} · {fmtDate(u.created_at)}</p>
              </div>
              <PlanBadge plan={u.plan} />
              {u.is_admin && <Crown size={14} weight="duotone" className="text-amber-500 shrink-0" />}
            </div>
          ))}
          {usuarios.length === 0 && <p className="text-xs text-outline italic px-5 py-4">Sin usuarios aún</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

function UsersTab({ usuarios, onRefresh }) {
  const [search, setSearch]           = useState('')
  const [filterPlan, setFilterPlan]   = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editUser, setEditUser]       = useState(null)
  const [confirmDel, setConfirmDel]   = useState(null)
  const [page, setPage]               = useState(1)
  const PER_PAGE = 12

  const filtered = useMemo(() => {
    return usuarios.filter(u => {
      const nombre = `${u.nombre || ''} ${u.nombre1 || ''} ${u.apellido1 || ''}`.toLowerCase()
      if (search && !nombre.includes(search.toLowerCase()) && !u.id.includes(search)) return false
      if (filterPlan !== 'all' && (u.plan || 'free') !== filterPlan) return false
      if (filterStatus === 'admin'     && !u.is_admin)  return false
      if (filterStatus === 'suspended' && !u.suspended) return false
      if (filterStatus === 'active'    && (u.suspended || u.is_admin)) return false
      return true
    })
  }, [usuarios, search, filterPlan, filterStatus])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSuspend = async (u) => {
    await supabase.from('profiles').update({ suspended: !u.suspended }).eq('id', u.id)
    onRefresh()
  }
  const handleResetCredits = async (u) => {
    await supabase.from('profiles').update({ usage_count: 0 }).eq('id', u.id)
    onRefresh()
  }
  const handleDelete = async (id) => {
    await supabase.from('profiles').update({ suspended: true, deleted_at: new Date().toISOString() }).eq('id', id)
    setConfirmDel(null)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input type="text" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nombre o ID…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-lowest" />
        </div>
        <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1) }}
          className="border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-lowest">
          <option value="all">Todos los planes</option>
          {Object.entries(PLANES).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-lowest">
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="admin">Administradores</option>
          <option value="suspended">Suspendidos</option>
        </select>
        <span className="text-xs text-outline self-center shrink-0 hidden sm:block">{filtered.length} usuario{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-on-surface-variant hidden md:table-cell">País</th>
                <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-on-surface-variant hidden sm:table-cell">Usos</th>
                <th className="text-left px-4 py-3 font-semibold text-on-surface-variant hidden lg:table-cell">Registro</th>
                <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {paginated.map(u => {
                const nombre = `${u.nombre1 || u.nombre || 'Sin nombre'} ${u.apellido1 || ''}`.trim()
                const planCred = getPlanCredits(u.plan)
                return (
                  <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold
                          ${u.is_admin ? 'bg-amber-100 text-amber-700' : 'bg-primary-fixed text-primary'}`}>
                          {getInitials(u)}
                        </div>
                        <div>
                          <p className="font-medium text-on-surface">{nombre}</p>
                          <p className="text-outline text-[10px]">{u.id.slice(0, 10)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant hidden md:table-cell">{u.pais || '—'}</td>
                    <td className="px-4 py-3"><PlanBadge plan={u.plan} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-surface-container h-1 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${(u.usage_count ?? 0) >= planCred ? 'bg-error' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, ((u.usage_count ?? 0) / planCred) * 100)}%` }} />
                        </div>
                        <span className="text-outline">{u.usage_count ?? 0}/{planCred}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-outline hidden lg:table-cell">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      {u.suspended
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error-container text-error">Suspendido</span>
                        : u.is_admin
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5 w-fit"><Crown size={9} />Admin</span>
                        : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Activo</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditUser(u)} title="Editar"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-outline hover:text-primary transition-colors">
                          <PencilSimple size={14} weight="bold" />
                        </button>
                        <button onClick={() => handleResetCredits(u)} title="Resetear créditos"
                          className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface transition-colors">
                          <ArrowsCounterClockwise size={14} weight="bold" />
                        </button>
                        <button onClick={() => handleSuspend(u)} title={u.suspended ? 'Reactivar' : 'Suspender'}
                          className={`p-1.5 rounded-lg transition-colors ${u.suspended ? 'text-green-600 hover:bg-green-50' : 'text-outline hover:bg-error-container hover:text-error'}`}>
                          {u.suspended ? <LockOpen size={14} weight="bold" /> : <Lock size={14} weight="bold" />}
                        </button>
                        <button onClick={() => setConfirmDel(u)} title="Desactivar"
                          className="p-1.5 rounded-lg hover:bg-error-container text-outline hover:text-error transition-colors">
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-outline text-sm italic">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/20">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant disabled:opacity-40 hover:border-outline transition-colors">
              ← Anterior
            </button>
            <span className="text-xs text-outline">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant disabled:opacity-40 hover:border-outline transition-colors">
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {editUser  && <UserModal u={editUser} onClose={() => setEditUser(null)} onSave={() => { setEditUser(null); onRefresh() }} />}
      {confirmDel && (
        <ConfirmModal
          message={`¿Desactivar a "${`${confirmDel.nombre1 || confirmDel.nombre || 'este usuario'} ${confirmDel.apellido1 || ''}`.trim()}"? Quedará suspendido permanentemente.`}
          confirmLabel="Desactivar" danger
          onConfirm={() => handleDelete(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

// ─── Permisos ─────────────────────────────────────────────────────────────────

function PermisosTab({ usuarios, onRefresh }) {
  const [selectedId, setSelectedId] = useState('')
  const [features, setFeatures]     = useState({ ...DEFAULT_FEATURES })
  const [plan, setPlan]             = useState('free')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  const u = usuarios.find(x => x.id === selectedId)

  useEffect(() => {
    if (u) {
      setFeatures(u.features_enabled ?? { ...DEFAULT_FEATURES })
      setPlan(u.plan || 'free')
    }
  }, [selectedId])

  const guardar = async () => {
    if (!selectedId) return
    setSaving(true)
    await supabase.from('profiles').update({ features_enabled: features, plan }).eq('id', selectedId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onRefresh()
  }

  return (
    <div className="space-y-5">
      {/* Selector */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
        <label className="block text-xs font-semibold text-on-surface-variant mb-2">Seleccionar usuario</label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="w-full border border-outline-variant rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">— Elige un usuario —</option>
          {usuarios.map(x => (
            <option key={x.id} value={x.id}>
              {`${x.nombre1 || x.nombre || 'Sin nombre'} ${x.apellido1 || ''}`.trim()} — {x.pais || '?'} ({x.plan || 'free'})
            </option>
          ))}
        </select>
        {u && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{getInitials(u)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface">{`${u.nombre1 || u.nombre || ''} ${u.apellido1 || ''}`.trim() || 'Sin nombre'}</p>
              <p className="text-xs text-outline">{u.pais || '?'} · Registro: {fmtDate(u.created_at)}</p>
            </div>
            <PlanBadge plan={u.plan} />
            {u.is_admin && <Crown size={16} weight="duotone" className="text-amber-500" />}
            {u.suspended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error-container text-error">Susp.</span>}
          </div>
        )}
      </div>

      {u && (
        <>
          {/* Plan */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
            <p className="text-sm font-semibold text-on-surface mb-3">Plan asignado</p>
            <div className="flex gap-3">
              {Object.entries(PLANES).map(([key, { label, credits }]) => (
                <button key={key} onClick={() => setPlan(key)}
                  className={`flex-1 text-sm py-3 rounded-xl border font-semibold transition-colors
                    ${plan === key ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}>
                  {label}
                  <span className={`block text-xs font-normal mt-0.5 ${plan === key ? 'text-on-primary/70' : 'text-outline'}`}>{credits} créditos</span>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
            <p className="text-sm font-semibold text-on-surface mb-3">Funcionalidades habilitadas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURES.map(({ key, label, Icon, desc }) => (
                <div key={key} className={`flex items-center justify-between p-3 rounded-xl border transition-colors
                  ${features[key] !== false ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-low border-outline-variant/40 opacity-60'}`}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} weight="duotone" className={features[key] !== false ? 'text-primary' : 'text-outline'} />
                    <div>
                      <p className="text-xs font-semibold text-on-surface">{label}</p>
                      <p className="text-[10px] text-outline">{desc}</p>
                    </div>
                  </div>
                  <Toggle checked={features[key] !== false} onChange={v => setFeatures(f => ({ ...f, [key]: v }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setFeatures({ ...DEFAULT_FEATURES })}
              className="border border-outline-variant text-on-surface-variant text-sm font-medium py-2.5 px-5 rounded-xl hover:border-outline transition-colors">
              Restablecer
            </button>
            <button onClick={guardar} disabled={saving}
              className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="bold" />}
              {saved ? '✓ Guardado' : 'Guardar permisos'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function AnalyticsTab({ usuarios, cvResults }) {
  const mk30 = (items, dateKey = 'created_at') =>
    Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i))
      const day = d.toISOString().split('T')[0]
      return { label: d.getDate(), count: items.filter(x => x[dateKey]?.startsWith(day)).length }
    })

  const reg30  = mk30(usuarios)
  const anal30 = mk30(cvResults)
  const maxReg  = Math.max(...reg30.map(d => d.count), 1)
  const maxAnal = Math.max(...anal30.map(d => d.count), 1)

  const topUsuarios = [...usuarios].sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0)).slice(0, 8)

  const paisCounts = {}
  usuarios.forEach(u => { const k = u.pais || 'Sin especificar'; paisCounts[k] = (paisCounts[k] || 0) + 1 })
  const topPaises = Object.entries(paisCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const Chart30 = ({ data, max, color }) => (
    <div className="flex items-end gap-px" style={{ height: 64 }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-t-sm" title={`${d.label}: ${d.count}`}
          style={{ height: `${Math.max(2, (d.count / max) * 60)}px`, backgroundColor: color, opacity: 0.5 + (i / data.length) * 0.5 }} />
      ))}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Registros diarios (30d)',  data: reg30,  max: maxReg,  color: '#002650' },
          { label: 'Análisis diarios (30d)',    data: anal30, max: maxAnal, color: '#1461a2' },
        ].map(({ label, data, max, color }) => (
          <div key={label} className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
            <p className="text-sm font-semibold text-on-surface mb-4">{label}</p>
            <Chart30 data={data} max={max} color={color} />
            <div className="flex justify-between text-[10px] text-outline mt-1">
              <span>30 días atrás</span><span>Hoy</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top usuarios */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <p className="text-sm font-semibold text-on-surface">Top usuarios por uso</p>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {topUsuarios.map((u, i) => {
              const nombre = `${u.nombre1 || u.nombre || 'Sin nombre'} ${u.apellido1 || ''}`.trim()
              const planCred = getPlanCredits(u.plan)
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-black text-outline w-4 shrink-0">#{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{getInitials(u)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-on-surface truncate">{nombre}</p>
                    <div className="w-full bg-surface-container h-1 rounded-full mt-0.5 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((u.usage_count ?? 0) / planCred) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">{u.usage_count ?? 0}</span>
                </div>
              )
            })}
            {topUsuarios.length === 0 && <p className="text-xs text-outline italic px-5 py-4">Sin datos</p>}
          </div>
        </div>

        {/* Usuarios por país */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <p className="text-sm font-semibold text-on-surface">Usuarios por país</p>
          </div>
          <div className="px-5 py-3 space-y-2.5">
            {topPaises.map(([pais, cnt]) => (
              <div key={pais} className="flex items-center gap-3">
                <span className="text-xs font-medium text-on-surface w-32 truncate shrink-0">{pais}</span>
                <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${(cnt / Math.max(usuarios.length, 1)) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-outline w-6 text-right">{cnt}</span>
              </div>
            ))}
            {topPaises.length === 0 && <p className="text-xs text-outline italic py-2">Sin datos de país</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Finanzas ─────────────────────────────────────────────────────────────────

function FinanzasTab({ usuarios }) {
  const totalGranted = usuarios.reduce((s, u) => s + getPlanCredits(u.plan || 'free'), 0)
  const totalUsed    = usuarios.reduce((s, u) => s + (u.usage_count ?? 0), 0)
  const totalLeft    = totalGranted - totalUsed
  const pctUsed      = totalGranted > 0 ? (totalUsed / totalGranted) * 100 : 0

  const proUsers  = usuarios.filter(u => u.plan === 'pro').length
  const entUsers  = usuarios.filter(u => u.plan === 'enterprise').length
  const freeUsers = usuarios.length - proUsers - entUsers
  const revenueEst = proUsers * 9 + entUsers * 29

  const usageDist = [
    { label: 'Sin usar (0)',   count: usuarios.filter(u => (u.usage_count ?? 0) === 0).length,  bar: 'bg-outline'   },
    { label: 'Parcial (1)',    count: usuarios.filter(u => (u.usage_count ?? 0) === 1).length,  bar: 'bg-amber-400' },
    { label: 'Agotado (2+)',   count: usuarios.filter(u => (u.usage_count ?? 0) >= 2).length,   bar: 'bg-primary'   },
  ]

  const conversionPct = Math.round((usuarios.filter(u => (u.usage_count ?? 0) > 0).length / Math.max(usuarios.length, 1)) * 100)
  const agotados      = usuarios.filter(u => (u.usage_count ?? 0) >= getPlanCredits(u.plan || 'free')).length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Créditos otorgados"  value={totalGranted}    Icon={Coins}           colorClass="bg-primary/10 text-primary"      />
        <StatCard label="Créditos consumidos" value={totalUsed}       sub={`${Math.round(pctUsed)}% del total`} Icon={ChartBar} colorClass="bg-amber-100 text-amber-600" />
        <StatCard label="Créditos libres"     value={totalLeft}       Icon={CheckCircle}     colorClass="bg-green-100 text-green-600"     />
        <StatCard label="MRR estimado"        value={`$${revenueEst}`} sub="USD/mes"         Icon={TrendUp}         colorClass="bg-secondary/10 text-secondary"  />
      </div>

      {/* Barra global */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-on-surface">Uso global de créditos</p>
          <span className="text-sm font-black text-primary">{Math.round(pctUsed)}%</span>
        </div>
        <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pctUsed > 90 ? 'bg-error' : pctUsed > 70 ? 'bg-amber-400' : 'bg-primary'}`}
            style={{ width: `${pctUsed}%` }} />
        </div>
        <div className="flex justify-between text-xs text-outline mt-2">
          <span>{totalUsed} usados</span><span>{totalLeft} disponibles</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Planes */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
          <p className="text-sm font-semibold text-on-surface mb-4">Distribución de planes</p>
          <div className="space-y-3">
            {[
              { label: 'Gratuito',    count: freeUsers, colorClass: 'text-on-surface-variant bg-surface-container-high', bar: 'bg-outline' },
              { label: 'Pro ($9/m)',  count: proUsers,  colorClass: 'text-primary bg-primary/10',                         bar: 'bg-primary' },
              { label: 'Enterprise', count: entUsers,  colorClass: 'text-amber-700 bg-amber-50',                          bar: 'bg-amber-400' },
            ].map(({ label, count, colorClass, bar }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{label}</span>
                  <span className="text-xs font-semibold text-outline">{count} usuarios</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${(count / Math.max(usuarios.length, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <p className="text-xs text-outline">Ingreso mensual estimado</p>
            <p className="text-2xl font-black font-headline text-primary mt-0.5">
              ${revenueEst} <span className="text-sm font-normal text-outline">USD/mes</span>
            </p>
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
          <p className="text-sm font-semibold text-on-surface mb-4">Engagement por uso</p>
          <div className="space-y-3">
            {usageDist.map(({ label, count, bar }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-on-surface">{label}</span>
                  <span className="text-xs font-semibold text-outline">{count} ({Math.round(count / Math.max(usuarios.length, 1) * 100)}%)</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${(count / Math.max(usuarios.length, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-1 text-xs text-outline">
            <p>Tasa de conversión: <strong className="text-on-surface">{conversionPct}%</strong></p>
            <p>Créditos agotados: <strong className="text-on-surface">{agotados} usuarios</strong></p>
            <p>Potencial de upgrade: <strong className="text-on-surface">{agotados} leads</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sistema ──────────────────────────────────────────────────────────────────

function SistemaTab() {
  const [settings, setSettings] = useState({
    maintenance_mode:         false,
    allow_new_registrations:  true,
    force_onboarding:         true,
    max_free_credits:         2,
    max_pro_credits:          20,
  })
  const [saved, setSaved] = useState(false)

  const guardar = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const sql = [
    `alter table public.profiles add column if not exists is_admin boolean default false;`,
    `alter table public.profiles add column if not exists plan text default 'free';`,
    `alter table public.profiles add column if not exists suspended boolean default false;`,
    `alter table public.profiles add column if not exists deleted_at timestamptz;`,
    `alter table public.profiles add column if not exists features_enabled jsonb;`,
    `alter table public.profiles add column if not exists prestaciones_detalle jsonb;`,
    `-- RLS: permitir que admins lean todos los perfiles:`,
    `-- create policy "Admin read all" on profiles for select`,
    `--   using (auth.uid() in (select id from profiles where is_admin = true));`,
  ]

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card">
        <p className="text-sm font-semibold text-on-surface mb-4">Estado del sistema</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Supabase DB', 'Claude API', 'Jooble API', 'Netlify'].map(label => (
            <div key={label} className="flex items-center gap-2 p-3 rounded-xl border bg-green-50 border-green-200">
              <CheckCircle size={16} weight="duotone" className="text-green-600 shrink-0" />
              <span className="text-xs font-medium text-green-800">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toggles globales */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-card space-y-3">
        <p className="text-sm font-semibold text-on-surface">Configuración global</p>
        {[
          { key: 'maintenance_mode',        label: 'Modo mantenimiento',    desc: 'Bloquea acceso a usuarios regulares', danger: true },
          { key: 'allow_new_registrations', label: 'Nuevos registros',       desc: 'Permite registros de nuevos usuarios' },
          { key: 'force_onboarding',        label: 'Forzar onboarding',      desc: 'Redirige si onboarding no está completo' },
        ].map(({ key, label, desc, danger }) => (
          <div key={key} className={`flex items-center justify-between p-4 rounded-xl border
            ${danger && settings[key] ? 'bg-error-container/20 border-error/20' : 'bg-surface-container-low border-outline-variant/20'}`}>
            <div>
              <p className={`text-sm font-semibold ${danger && settings[key] ? 'text-error' : 'text-on-surface'}`}>{label}</p>
              <p className="text-xs text-outline mt-0.5">{desc}</p>
            </div>
            <Toggle checked={settings[key]} onChange={v => setSettings(f => ({ ...f, [key]: v }))} />
          </div>
        ))}

        <div className="border-t border-outline-variant/20 pt-3">
          <p className="text-xs font-semibold text-on-surface-variant mb-3">Créditos por plan</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ key: 'max_free_credits', label: 'Plan Gratuito' }, { key: 'max_pro_credits', label: 'Plan Pro' }].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-outline mb-1">{label}</label>
                <input type="number" min="0" max="1000" value={settings[key]}
                  onChange={e => setSettings(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            ))}
          </div>
        </div>

        <button onClick={guardar} className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
          {saved ? '✓ Guardado' : <><FloppyDisk size={16} weight="bold" /> Guardar configuración</>}
        </button>
      </div>

      {/* SQL */}
      <div className="bg-surface-container-low rounded-xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-3">SQL requerido en Supabase</p>
        <div className="space-y-1 font-mono text-xs">
          {sql.map((line, i) => (
            <p key={i} className={line.startsWith('--') ? 'text-outline' : 'text-on-surface'}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Admin() {
  const { user, perfil, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]           = useState('overview')
  const [usuarios, setUsuarios] = useState([])
  const [cvResults, setCvResults] = useState([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (authLoading) return       // auth aún cargando
    if (!user) { navigate('/'); return }
    if (perfil === null) return   // perfil aún cargando — esperar
    if (!perfil.is_admin) navigate('/')
  }, [user, perfil, authLoading])

  const cargarDatos = useCallback(async () => {
    setRefreshing(true)
    const [{ data: profs }, { data: cvs }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('cv_results').select('id, tipo, created_at, user_id').order('created_at', { ascending: false }),
    ])
    setUsuarios(profs || [])
    setCvResults(cvs || [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    if (!authLoading && perfil?.is_admin) cargarDatos()
  }, [authLoading, perfil])

  if (authLoading || perfil === null || loading) return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <CircleNotch size={32} className="animate-spin text-primary" />
        <p className="text-sm text-outline">Cargando panel de administración…</p>
      </div>
    </div>
  )

  if (!perfil?.is_admin) return null

  const currentTab = TABS.find(t => t.id === tab)

  return (
    <div className="min-h-screen bg-surface-container-low flex">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-full w-56 bg-primary flex-col z-30 shadow-float hidden md:flex">
        {/* Logo */}
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-white/10 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">CV</span>
          </div>
          <div>
            <p className="text-white font-headline font-extrabold text-[13px] tracking-tight leading-none">CV Optimizer</p>
            <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                ${tab === id ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={18} weight={tab === id ? 'duotone' : 'regular'} />
              {label}
            </button>
          ))}
        </nav>

        {/* Back */}
        <div className="px-3 py-4 border-t border-white/10 shrink-0">
          <button onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all">
            <ArrowLeft size={18} />
            Volver a la app
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/20 h-14 flex items-center px-5 gap-3 shrink-0">
          {/* Mobile tab strip */}
          <div className="md:hidden flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(({ id, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`p-2 rounded-lg transition-colors shrink-0 ${tab === id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                <Icon size={16} weight={tab === id ? 'duotone' : 'regular'} />
              </button>
            ))}
          </div>

          <h1 className="font-headline font-bold text-lg text-primary hidden md:block">{currentTab?.label}</h1>
          <div className="flex-1" />

          <button onClick={cargarDatos} disabled={refreshing}
            className="p-2 rounded-xl hover:bg-surface-container-low text-on-surface-variant disabled:opacity-40 transition-colors">
            <ArrowsCounterClockwise size={16} weight="bold" className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200/60">
            <Crown size={14} weight="duotone" className="text-amber-600" />
            <span className="text-xs font-bold text-amber-700">Admin</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-6 py-6">
          {tab === 'overview'  && <OverviewTab  usuarios={usuarios} cvResults={cvResults} />}
          {tab === 'users'     && <UsersTab     usuarios={usuarios} onRefresh={cargarDatos} />}
          {tab === 'permisos'  && <PermisosTab  usuarios={usuarios} onRefresh={cargarDatos} />}
          {tab === 'analytics' && <AnalyticsTab usuarios={usuarios} cvResults={cvResults} />}
          {tab === 'finanzas'  && <FinanzasTab  usuarios={usuarios} cvResults={cvResults} />}
          {tab === 'sistema'   && <SistemaTab />}
        </main>
      </div>
    </div>
  )
}
