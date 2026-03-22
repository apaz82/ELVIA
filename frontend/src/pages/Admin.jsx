// Panel de administración — acceso independiente, NO usa AuthContext
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase propio del admin — storageKey separado para no pisar la sesión del usuario normal
const db = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { storageKey: 'admin-auth', persistSession: true } }
)

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Badge({ color = 'gray', children }) {
  const cls = {
    green:  'bg-emerald-100 text-emerald-700',
    red:    'bg-red-100 text-red-700',
    amber:  'bg-amber-100 text-amber-700',
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700',
  }[color] || 'bg-gray-100 text-gray-600'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{children}</span>
}

function KpiCard({ label, value, sub, color = 'blue' }) {
  const accent = {
    blue:   'text-blue-600 bg-blue-50',
    green:  'text-emerald-600 bg-emerald-50',
    amber:  'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  }[color]
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{label}</p>
      <p className={`text-3xl font-black rounded-xl px-2 py-1 inline-block ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
    </div>
  )
}

// ─── Login standalone ────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: authErr } = await db.auth.signInWithPassword({ email, password })
    if (authErr) { setError('Credenciales incorrectas'); setLoading(false); return }

    // Verificar que sea admin
    const { data: perfil } = await db.from('profiles').select('is_admin').eq('id', data.user.id).single()
    if (!perfil?.is_admin) {
      await db.auth.signOut()
      setError('No tienes permisos de administrador.')
      setLoading(false)
      return
    }
    onLogin(data.user)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">CV Optimizer Pro — Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="admin@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-950/50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            {loading ? 'Verificando...' : 'Entrar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Usuarios totales"  value={stats.totalUsers}    sub="Registrados en la plataforma" color="blue"   />
        <KpiCard label="Onboarding OK"     value={stats.conOnboarding} sub="Con perfil completo"          color="green"  />
        <KpiCard label="Admins"            value={stats.admins}        sub="Usuarios con is_admin=true"   color="purple" />
        <KpiCard label="Análisis totales"  value={stats.totalUsage}    sub="Suma de usage_count"          color="amber"  />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Distribución de planes</h3>
        <div className="space-y-3">
          {Object.entries(stats.planes).map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24 shrink-0">{plan || 'Sin plan'}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.totalUsers ? (count / stats.totalUsers) * 100 : 0}%` }} />
              </div>
              <span className="text-sm font-semibold text-gray-700 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3">Países registrados</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.paises).map(([pais, count]) => (
            <span key={pais} className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
              {pais || 'Sin país'} ({count})
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

function UserRow({ u, onEdit }) {
  const nombre = [u.nombre1, u.nombre2, u.apellido1, u.apellido2].filter(Boolean).join(' ') || '—'
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-700 font-bold text-xs">
              {(u.nombre1 || u.email_principal || '?')[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{nombre}</p>
            <p className="text-xs text-gray-400 truncate">{u.email_principal || <span className="italic text-gray-300">sin email</span>}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge color={u.plan === 'pro' ? 'purple' : u.plan === 'starter' ? 'blue' : 'gray'}>
          {u.plan || 'free'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{u.pais || '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="bg-gray-200 rounded-full h-1.5 w-16">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((u.usage_count || 0) / 2) * 100)}%` }} />
          </div>
          <span className="text-xs text-gray-500">{u.usage_count || 0}/2</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {u.is_admin ? <Badge color="purple">Admin</Badge> : <Badge color="gray">User</Badge>}
      </td>
      <td className="px-4 py-3">
        <Badge color={u.suspended ? 'red' : 'green'}>{u.suspended ? 'Suspendido' : 'Activo'}</Badge>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.created_at)}</td>
      <td className="px-4 py-3">
        <button onClick={() => onEdit(u)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors">
          Editar
        </button>
      </td>
    </tr>
  )
}

function UserEditModal({ user: u, onClose, onSave }) {
  const [form, setForm] = useState({
    plan:        u.plan || 'free',
    usage_count: u.usage_count || 0,
    is_admin:    u.is_admin || false,
    suspended:   u.suspended || false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await db.from('profiles').update(form).eq('id', u.id)
    onSave()
    setSaving(false)
    onClose()
  }

  const Toggle = ({ label, field, color = 'blue' }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={() => setForm(f => ({ ...f, [field]: !f[field] }))}
        className={`w-10 h-5 rounded-full transition-colors relative ${form[field] ? `bg-${color}-500` : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[field] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-800 mb-1">Editar usuario</h3>
        <p className="text-xs text-gray-400 mb-5 truncate">{u.email_principal || u.id}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Plan</label>
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Usos consumidos</label>
            <input type="number" min="0" value={form.usage_count}
              onChange={e => setForm(f => ({ ...f, usage_count: parseInt(e.target.value) || 0 }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <Toggle label="Es administrador" field="is_admin"  color="purple" />
          <Toggle label="Suspendido"        field="suspended" color="red"    />
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60 transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UsersTab({ users, onRefresh }) {
  const [search, setSearch]     = useState('')
  const [editUser, setEditUser] = useState(null)
  const [page, setPage]         = useState(0)
  const PER_PAGE = 12

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q
      || (u.email_principal || '').toLowerCase().includes(q)
      || [u.nombre1, u.nombre2, u.apellido1, u.apellido2].filter(Boolean).join(' ').toLowerCase().includes(q)
      || (u.pais || '').toLowerCase().includes(q)
  })

  const paginated  = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text" placeholder="Buscar por nombre, email o país..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
        />
        <button onClick={onRefresh}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          Refrescar
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Usuario', 'Plan', 'País', 'Uso', 'Rol', 'Estado', 'Registro', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No se encontraron usuarios</td></tr>
                : paginated.map(u => <UserRow key={u.id} u={u} onEdit={setEditUser} />)
              }
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">{filtered.length} usuarios</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${i === page ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {editUser && (
        <UserEditModal user={editUser} onClose={() => setEditUser(null)} onSave={onRefresh} />
      )}
    </div>
  )
}

// ─── Analytics Tab ───────────────────────────────────────────────────────────

function AnalyticsTab({ users }) {
  const monthlyData = (() => {
    const map = {}
    users.forEach(u => {
      if (!u.created_at) return
      const key = new Date(u.created_at).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).slice(-6)
  })()

  const maxVal = Math.max(...monthlyData.map(([, v]) => v), 1)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-5">Nuevos registros por mes</h3>
        {monthlyData.length === 0
          ? <p className="text-gray-400 text-sm text-center py-6">Sin datos suficientes</p>
          : (
            <div className="flex items-end gap-3 h-40">
              {monthlyData.map(([label, val]) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-blue-600">{val}</span>
                  <div className="w-full bg-blue-500 rounded-t-md" style={{ height: `${(val / maxVal) * 120}px`, minHeight: 4 }} />
                  <span className="text-[10px] text-gray-400 text-center">{label}</span>
                </div>
              ))}
            </div>
          )
        }
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Distribución por país</h3>
        {(() => {
          const map = {}
          users.forEach(u => { const k = u.pais || 'Sin país'; map[k] = (map[k] || 0) + 1 })
          return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([pais, count]) => (
            <div key={pais} className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-600 w-28 truncate shrink-0">{pais}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${users.length ? (count / users.length) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 w-4 text-right">{count}</span>
            </div>
          ))
        })()}
      </div>
    </div>
  )
}

// ─── Finanzas Tab ────────────────────────────────────────────────────────────

function FinanzasTab({ users }) {
  const agotados   = users.filter(u => (u.usage_count || 0) >= 2).length
  const conPlan    = users.filter(u => u.plan && u.plan !== 'free').length
  const conversion = users.length ? ((conPlan / users.length) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <KpiCard label="Agotaron créditos" value={agotados}        sub="Candidatos para upgrade" color="amber" />
        <KpiCard label="Tasa conversión"   value={`${conversion}%`} sub="Free → plan de pago"     color="green" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Economía de créditos</h3>
        <div className="space-y-2">
          {[
            ['Total créditos usados',           users.reduce((s, u) => s + (u.usage_count || 0), 0),                  'text-gray-800'],
            ['Créditos disponibles restantes',  users.reduce((s, u) => s + Math.max(0, 2 - (u.usage_count || 0)), 0), 'text-gray-800'],
            ['Usuarios sin créditos',            agotados,                                                              'text-red-600'],
            ['Usuarios con créditos disponibles', users.length - agotados,                                             'text-emerald-600'],
          ].map(([label, val, cls]) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className={`font-bold ${cls}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {agotados > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-bold text-amber-800 mb-2">Oportunidad de conversión</h3>
          <p className="text-sm text-amber-700">
            {agotados} usuario{agotados !== 1 ? 's han' : ' ha'} agotado sus créditos gratuitos —
            son los mejores candidatos para una campaña de upgrade a plan de pago.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Sistema Tab ─────────────────────────────────────────────────────────────

function SistemaTab() {
  const [copied, setCopied] = useState('')

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const SQL_COLUMNS = `-- Agregar columnas necesarias si no existen
alter table public.profiles
  add column if not exists email_principal text,
  add column if not exists is_admin boolean default false,
  add column if not exists suspended boolean default false,
  add column if not exists plan text default 'free',
  add column if not exists features_enabled jsonb default '{}';`

  const SQL_RLS = `-- 1. Función para verificar si el usuario actual es admin (bypassa RLS)
create or replace function is_current_user_admin()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 2. Policy: admin puede leer TODOS los perfiles
create policy "admin_read_all_profiles" on public.profiles
  for select using (id = auth.uid() or is_current_user_admin());

-- 3. Policy: admin puede actualizar todos los perfiles
create policy "admin_update_all_profiles" on public.profiles
  for update using (is_current_user_admin());`

  const SQL_MARK_ADMIN = `-- Marcar tu usuario como admin (reemplaza el email)
update public.profiles
  set is_admin = true
  where email_principal = 'tu@email.com';`

  return (
    <div className="space-y-6">
      {[
        { key: 'cols',  title: 'Columnas requeridas',     sub: 'Ejecutar primero si hay errores de columna', sql: SQL_COLUMNS },
        { key: 'rls',   title: 'RLS — ver todos usuarios', sub: 'Necesario para que el admin vea los 5 perfiles', sql: SQL_RLS },
        { key: 'admin', title: 'Marcar usuario como admin', sub: 'Reemplaza el email con el tuyo', sql: SQL_MARK_ADMIN },
      ].map(({ key, title, sub, sql }) => (
        <div key={key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-800">{title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <button onClick={() => copy(sql, key)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0">
              {copied === key ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <pre className="bg-gray-950 text-emerald-400 text-xs rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">{sql}</pre>
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-bold text-blue-800 mb-2">Variables de entorno</h3>
        <div className="space-y-1 font-mono text-xs text-blue-700">
          {['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'ANTHROPIC_API_KEY', 'RESEND_API_KEY', 'JOOBLE_API_KEY'].map(v => (
            <p key={v}>{v}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'users',     label: 'Usuarios'  },
  { id: 'analytics', label: 'Analytics' },
  { id: 'finanzas',  label: 'Finanzas'  },
  { id: 'sistema',   label: 'Sistema'   },
]

function Dashboard({ adminUser, onLogout }) {
  const [tab, setTab]         = useState('overview')
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await db.from('profiles').select('*').order('created_at', { ascending: false })
    if (!error && data) setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const stats = {
    totalUsers:    users.length,
    conOnboarding: users.filter(u => u.nombre1).length,
    admins:        users.filter(u => u.is_admin).length,
    totalUsage:    users.reduce((s, u) => s + (u.usage_count || 0), 0),
    planes: users.reduce((acc, u) => { const k = u.plan || 'free'; acc[k] = (acc[k] || 0) + 1; return acc }, {}),
    paises: users.reduce((acc, u) => { if (u.pais) { acc[u.pais] = (acc[u.pais] || 0) + 1 }; return acc }, {}),
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="bg-gray-900 border-b border-gray-800 h-14 flex items-center px-6 gap-4 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center shrink-0">
          <span className="text-white font-black text-xs">A</span>
        </div>
        <span className="text-white font-bold text-sm tracking-tight">Admin Panel</span>
        <span className="text-gray-600 text-xs hidden sm:block">/ CV Optimizer Pro</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-700 font-bold text-[10px]">{adminUser.email?.[0]?.toUpperCase()}</span>
          </div>
          <span className="text-gray-400 text-xs hidden sm:block truncate max-w-[160px]">{adminUser.email}</span>
          <button onClick={onLogout}
            className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg font-semibold transition-colors">
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-6 flex gap-1 shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {loading
          ? <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Cargando datos...</div>
          : (
            <>
              {tab === 'overview'  && <OverviewTab stats={stats} />}
              {tab === 'users'     && <UsersTab users={users} onRefresh={fetchUsers} />}
              {tab === 'analytics' && <AnalyticsTab users={users} />}
              {tab === 'finanzas'  && <FinanzasTab users={users} />}
              {tab === 'sistema'   && <SistemaTab />}
            </>
          )
        }
      </main>
    </div>
  )
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export default function Admin() {
  const [adminUser, setAdminUser] = useState(null)
  const [checking, setChecking]   = useState(true)

  // Al cargar: verificar si hay sesión admin activa en este cliente
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await db.auth.getSession()
      if (session?.user) {
        const { data } = await db.from('profiles').select('is_admin').eq('id', session.user.id).single()
        if (data?.is_admin) {
          setAdminUser(session.user)
        } else {
          await db.auth.signOut()
        }
      }
      setChecking(false)
    }
    check()
  }, [])

  const handleLogout = async () => {
    await db.auth.signOut()
    setAdminUser(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando sesión...</div>
      </div>
    )
  }

  if (!adminUser) return <AdminLogin onLogin={setAdminUser} />
  return <Dashboard adminUser={adminUser} onLogout={handleLogout} />
}
