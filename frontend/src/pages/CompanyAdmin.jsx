// CompanyAdmin — Panel del HR Director / Gestor de programa B2B
// Ruta: /empresa-admin
// Solo accesible si profile.role === 'company_admin'
// Carga datos vía /api/company/{profile,users,invitations,dashboard}
// Estilo: light executive — consistente con LandingEmpresa / BienvenidaOnboarding

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as PI from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTenant, DEFAULT_TENANT } from '../context/TenantContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ── KPI Card ────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15`, color: accent }}
        >
          <Icon size={18} weight="duotone" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 leading-none mb-1">{value}</div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Invite Modal ────────────────────────────────────────────────────────
function InviteModal({ onClose, onSubmit, primary }) {
  const [email, setEmail]   = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await onSubmit(email.trim(), nombre.trim())
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `${primary}15`, color: primary }}
          >
            <PI.PaperPlaneTilt size={20} weight="duotone" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invitar colaborador</h3>
            <p className="text-sm text-gray-500">Enviaremos un email con instrucciones para activar la cuenta.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre (opcional)</label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: María Gómez"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': `${primary}40` }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email corporativo</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="maria@empresa.com"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': `${primary}40` }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !email}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: primary }}>
              {loading ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function CompanyAdmin() {
  const navigate = useNavigate()
  const { user, session, perfil, loading: authLoading, logout } = useAuth()
  const { tenant } = useTenant()

  const [tab, setTab]               = useState('resumen')
  const [company, setCompany]       = useState(null)
  const [users, setUsers]           = useState([])
  const [invitations, setInvitations] = useState([])
  const [dashboard, setDashboard]   = useState({ stats: {} })
  const [loading, setLoading]       = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const primary   = tenant.primary_color   || DEFAULT_TENANT.primary_color
  const secondary = tenant.secondary_color || DEFAULT_TENANT.secondary_color

  // ── Guard: solo company_admin ──
  useEffect(() => {
    if (!authLoading && user) {
      if (perfil && perfil.role !== 'company_admin' && perfil.role !== 'super_admin') {
        navigate('/dashboard', { replace: true })
      }
    } else if (!authLoading && !user) {
      navigate('/auth', { replace: true })
    }
  }, [user, perfil, authLoading, navigate])

  // ── Fetch data ──
  const fetchAll = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    const headers = { Authorization: `Bearer ${session.access_token}` }
    try {
      const [profileRes, usersRes, invRes, dashRes] = await Promise.all([
        fetch(`${API}/api/company/profile`,    { headers }),
        fetch(`${API}/api/company/users`,      { headers }),
        fetch(`${API}/api/company/invitations`,{ headers }),
        fetch(`${API}/api/company/dashboard`,  { headers }),
      ])
      const [pJson, uJson, iJson, dJson] = await Promise.all([
        profileRes.json().catch(() => ({})),
        usersRes.json().catch(() => ({})),
        invRes.json().catch(() => ({})),
        dashRes.json().catch(() => ({})),
      ])
      if (pJson.company)     setCompany(pJson.company)
      if (uJson.users)       setUsers(uJson.users)
      if (iJson.invitations) setInvitations(iJson.invitations)
      if (dJson.stats)       setDashboard(dJson)
    } catch (err) {
      console.error('[CompanyAdmin] fetch error:', err)
      toast.error('No fue posible cargar los datos del programa.')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Invitation handler ──
  const handleInvite = async (email, nombre) => {
    if (!session?.access_token) return
    try {
      const res = await fetch(`${API}/api/company/invitations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, nombre }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(`Invitación enviada a ${email}`)
        setShowInviteModal(false)
        fetchAll()
      } else {
        toast.error(data.error || 'No fue posible enviar la invitación.')
      }
    } catch (err) {
      toast.error('Error de conexión.')
    }
  }

  if (authLoading || (loading && !company)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
      </div>
    )
  }

  const stats = dashboard.stats || {}

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 backdrop-blur-xl bg-white/90">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-8 md:h-9 object-contain" />
            ) : (
              <div className="px-3 py-1.5 rounded-lg text-white text-sm font-bold" style={{ background: primary }}>
                {tenant.name}
              </div>
            )}
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <span>operado por</span>
              <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-4 md:h-5 object-contain opacity-80" />
            </div>
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <PI.ShieldCheck size={14} className="text-emerald-500" weight="duotone" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Panel HR</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: secondary }}>
                {(perfil?.nombre1?.[0] || user?.email?.[0] || '?').toUpperCase()}
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 text-xs leading-tight">{perfil?.nombre1 || user?.email}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest">Company Admin</div>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
              title="Cerrar sesión"
            >
              <PI.SignOut size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center gap-1 border-t border-gray-50">
          {[
            { id: 'resumen',    label: 'Resumen',     icon: PI.ChartBar },
            { id: 'personas',   label: 'Personas',    icon: PI.UsersThree },
            { id: 'invitaciones', label: 'Invitaciones', icon: PI.EnvelopeSimple },
            { id: 'config',     label: 'Configuración', icon: PI.Gear },
          ].map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  active ? 'border-current text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
                style={active ? { borderColor: primary, color: primary } : undefined}
              >
                <t.icon size={15} weight={active ? 'fill' : 'regular'} />
                {t.label}
                {t.id === 'invitaciones' && invitations.length > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: `${primary}15`, color: primary }}
                  >
                    {invitations.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8 md:py-12">

        {/* ════════ RESUMEN ════════ */}
        {tab === 'resumen' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                Programa <span style={{ color: primary }}>{company?.name || tenant.name}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Métricas agregadas anónimas del programa de transición profesional.
                No accedes a CVs, conversaciones, ni postulaciones individuales.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={PI.UsersThree}     label="Colaboradores activos" value={stats.totalUsers || 0}  sub="Cuentas creadas" accent={primary} />
              <KpiCard icon={PI.Pulse}          label="Activos último mes"   value={stats.activeUsers || 0} sub="Con actividad reciente" accent="#10B981" />
              <KpiCard icon={PI.TrendUp}        label="Tasa de adopción"     value={`${stats.adoptionRate || 0}%`} sub="Activos / Total" accent="#F59E0B" />
              <KpiCard icon={PI.FileText}       label="CVs generados"        value={stats.cvOptimizerUse || 0} sub="Total programa" accent="#8B5CF6" />
            </div>

            {/* Confidencialidad recordatorio */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                <PI.ShieldCheck size={20} weight="duotone" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Tu rol como administrador del programa</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Como administrador, puedes invitar colaboradores, ver métricas de uso agregadas y exportar reportes.
                  <strong className="text-gray-700"> No tienes acceso a los CVs, mensajes con el bot, ni postulaciones individuales</strong> — eso es estrictamente confidencial entre cada colaborador y ELVIA®.
                </p>
              </div>
            </div>

            {/* Breakdown de uso */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-5">Uso por herramienta</h3>
              <div className="space-y-4">
                {[
                  { label: 'CV Optimizer',  value: stats.cvOptimizerUse || 0, max: 100, color: primary },
                  { label: 'CV vs Vacante', value: stats.cvMatchUse || 0,     max: 100, color: '#10B981' },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-gray-700">{row.label}</span>
                      <span className="font-bold text-gray-900">{row.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (row.value / row.max) * 100)}%`, background: row.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════ PERSONAS ════════ */}
        {tab === 'personas' && (
          <div className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cohorte del programa</h1>
                <p className="text-sm text-gray-500 mt-1">{users.length} {users.length === 1 ? 'colaborador' : 'colaboradores'} activos en el programa.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: primary }}
              >
                <PI.UserPlus size={16} weight="bold" />
                Invitar colaborador
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {users.length === 0 ? (
                <div className="p-16 text-center">
                  <PI.UsersThree size={48} className="text-gray-300 mx-auto mb-3" weight="duotone" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Aún no hay colaboradores activos</p>
                  <p className="text-xs text-gray-500 mb-5">Invita a tu primer colaborador para empezar el programa.</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: primary }}
                  >
                    <PI.UserPlus size={16} weight="bold" />
                    Invitar al primero
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Colaborador</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Email</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Plan</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: secondary }}>
                                {(u.nombre1?.[0] || u.email_principal?.[0] || '?').toUpperCase()}
                              </div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {[u.nombre1, u.apellido1].filter(Boolean).join(' ') || '—'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{u.email_principal}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md" style={{ background: `${primary}15`, color: primary }}>
                              {u.plan || 'Corporativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.suspended ? (
                              <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md bg-red-50 text-red-600">Suspendido</span>
                            ) : (
                              <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600">Activo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ INVITACIONES ════════ */}
        {tab === 'invitaciones' && (
          <div className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invitaciones pendientes</h1>
                <p className="text-sm text-gray-500 mt-1">Email enviados que aún no han sido activados.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: primary }}
              >
                <PI.PaperPlaneTilt size={16} weight="bold" />
                Nueva invitación
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {invitations.length === 0 ? (
                <div className="p-16 text-center">
                  <PI.EnvelopeSimpleOpen size={48} className="text-gray-300 mx-auto mb-3" weight="duotone" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Sin invitaciones pendientes</p>
                  <p className="text-xs text-gray-500">Todas las invitaciones enviadas han sido aceptadas.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {invitations.map(inv => (
                    <div key={inv.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                          <PI.Clock size={16} className="text-amber-600" weight="duotone" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{inv.email}</div>
                          <div className="text-xs text-gray-400">
                            {inv.nombre && <span>{inv.nombre} · </span>}
                            Expira {new Date(inv.expires_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 shrink-0">Pendiente</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ CONFIG ════════ */}
        {tab === 'config' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración del programa</h1>
              <p className="text-sm text-gray-500 mt-1">Información del tenant y compliance.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Datos de la empresa</h3>
              <dl className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Nombre</dt><dd className="text-gray-900 font-semibold">{company?.name || '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Slug</dt><dd className="text-gray-900 font-mono text-xs">/{company?.slug || '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Sector</dt><dd className="text-gray-900 font-semibold capitalize">{company?.sector || '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">País</dt><dd className="text-gray-900 font-semibold">{company?.country || '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Plan</dt><dd className="text-gray-900 font-semibold capitalize">{company?.plan || '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Estado</dt><dd className={`font-semibold ${company?.is_active ? 'text-emerald-600' : 'text-red-600'}`}>{company?.is_active ? 'Activa' : 'Inactiva'}</dd></div>
              </dl>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PI.ShieldCheck size={16} className="text-emerald-500" weight="duotone" />
                Compliance & Seguridad
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><PI.CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Aislamiento estricto por tenant (RLS Postgres)</li>
                <li className="flex items-start gap-2"><PI.CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Cifrado en tránsito (TLS 1.3) y en reposo</li>
                <li className="flex items-start gap-2"><PI.CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Audit log de todas las acciones administrativas</li>
                <li className="flex items-start gap-2"><PI.CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Sin acceso a datos individuales de colaboradores</li>
              </ul>
              <Link
                to="/privacidad"
                className="inline-flex items-center gap-1 text-xs font-semibold mt-4 hover:underline"
                style={{ color: primary }}
              >
                Ver política completa de privacidad <PI.ArrowRight size={12} weight="bold" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInvite}
          primary={primary}
        />
      )}
    </div>
  )
}
