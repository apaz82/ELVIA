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
import { useSectorLabels } from '../hooks/useSectorLabels'

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
  const [email,        setEmail]       = useState('')
  const [nombre,       setNombre]      = useState('')
  const [apellido,     setApellido]    = useState('')
  const [licenseDays,  setLicenseDays] = useState('90')
  const [loading, setLoading]          = useState(false)
  const L = useSectorLabels()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await onSubmit(email.trim(), nombre.trim(), apellido.trim(), parseInt(licenseDays, 10) || 90)
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
            <h3 className="text-lg font-bold text-gray-900">{L.inviteMember}</h3>
            <p className="text-sm text-gray-500">Enviaremos un email con instrucciones para activar la cuenta.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Primer nombre</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: María"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primary}40` }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Primer apellido</label>
              <input
                type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                placeholder="Ej: Gómez"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primary}40` }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email institucional</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder={L.csvSampleEmail}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': `${primary}40` }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Días de licencia</label>
            <div className="flex items-center gap-2">
              <input
                type="number" value={licenseDays} onChange={e => setLicenseDays(e.target.value)}
                min="1" max="730"
                className="w-24 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primary}40` }}
              />
              <span className="text-xs text-gray-400">días calendario desde la activación</span>
            </div>
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

// ── CSV Upload Modal ────────────────────────────────────────────────────
// Parsea CSV en frontend, muestra preview, envia rows[] al backend
function CsvUploadModal({ onClose, onSubmit, primary, defaultCohort }) {
  const [file, setFile]   = useState(null)
  const [rows, setRows]   = useState([])
  const [errors, setErrors] = useState([])
  const [cohort, setCohort] = useState(defaultCohort || '')
  const [loading, setLoading] = useState(false)
  const L = useSectorLabels()

  const handleFile = async (f) => {
    setFile(f)
    setErrors([])
    setRows([])
    try {
      const text = await f.text()
      // Detect separator
      const firstLine = text.split(/\r?\n/)[0] || ''
      const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ','

      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
      if (lines.length === 0) { setErrors([{ row: 0, error: 'Archivo vacio' }]); return }

      // Parse header
      const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))
      const idx = {
        email:        headers.indexOf('email'),
        nombre:       headers.indexOf('nombre'),
        apellido:     headers.indexOf('apellido'),
        cohort:       headers.indexOf('cohort'),
        area:         headers.indexOf('area'),
        cargo_actual: headers.findIndex(h => h === 'cargoactual' || h === 'cargo'),
        license_days: headers.findIndex(h => h === 'licensedays' || h === 'diaslicencia' || h === 'dias' || h === 'licencia' || h === 'license_days' || h === 'dias_licencia'),
      }

      if (idx.email === -1) {
        setErrors([{ row: 0, error: 'Falta columna "email" en el header' }])
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const parsed = []
      const errs = []
      const seen = new Set()

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
        const email = (cols[idx.email] || '').toLowerCase()
        if (!email) { errs.push({ row: i + 1, error: 'email vacio' }); continue }
        if (!emailRegex.test(email)) { errs.push({ row: i + 1, error: 'email invalido: ' + email }); continue }
        if (seen.has(email)) { errs.push({ row: i + 1, error: 'duplicado en archivo: ' + email }); continue }
        seen.add(email)

        const rawDays = idx.license_days !== -1 ? parseInt(cols[idx.license_days], 10) : NaN
        parsed.push({
          email,
          nombre:       idx.nombre   !== -1 ? cols[idx.nombre]   : '',
          apellido:     idx.apellido !== -1 ? cols[idx.apellido] : '',
          cohort:       idx.cohort   !== -1 ? cols[idx.cohort]   : '',
          area:         idx.area     !== -1 ? cols[idx.area]     : '',
          cargo_actual: idx.cargo_actual !== -1 ? cols[idx.cargo_actual] : '',
          license_days: !isNaN(rawDays) && rawDays > 0 ? rawDays : 90,
        })
      }

      setRows(parsed)
      setErrors(errs)
    } catch (err) {
      setErrors([{ row: 0, error: 'Error leyendo archivo: ' + err.message }])
    }
  }

  const downloadTemplate = () => {
    const csv = `email,nombre,apellido,cohort,area,cargo_actual,dias_licencia\n${L.csvSampleEmail},Juan,Perez,cohort-2026,Programa,${L.member},90\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_allowlist.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async () => {
    if (rows.length === 0) return
    setLoading(true)
    await onSubmit(rows, cohort)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${primary}15`, color: primary }}>
            <PI.UploadSimple size={20} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{L.uploadListTitle}</h3>
            <p className="text-sm text-gray-500">Sube un CSV con los emails que tendrán acceso al programa.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><PI.X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Step 1: Plantilla */}
          {!file && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start gap-3">
              <PI.Info size={18} className="text-gray-400 mt-0.5 shrink-0" weight="duotone" />
              <div className="flex-1 text-sm text-gray-600 leading-relaxed">
                Columnas requeridas: <code className="px-1 bg-white rounded">email</code>. Opcionales: <code className="px-1 bg-white rounded">nombre, apellido, cohort, area, cargo_actual, dias_licencia</code> (días de acceso; default 90).
                <button onClick={downloadTemplate} className="font-semibold ml-2 hover:underline" style={{ color: primary }}>
                  Descargar plantilla
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Archivo CSV</label>
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-300 transition-colors">
              <input type="file" accept=".csv,.txt" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
              {file ? (
                <div className="text-sm text-gray-700">
                  <PI.FileCsv size={32} weight="duotone" className="mx-auto mb-2" style={{ color: primary }} />
                  <strong>{file.name}</strong> · {(file.size / 1024).toFixed(1)} KB
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <PI.UploadSimple size={32} weight="duotone" className="mx-auto mb-2 text-gray-400" />
                  Click para seleccionar un CSV
                </div>
              )}
            </label>
          </div>

          {/* Cohort override */}
          {file && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cohorte (opcional — aplica a filas sin cohort en el CSV)</label>
              <input type="text" value={cohort} onChange={e => setCohort(e.target.value)}
                placeholder="ej: telefonica-2026-05"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primary}40` }}
              />
            </div>
          )}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                <PI.WarningCircle size={16} weight="fill" />
                {errors.length} errores detectados
              </div>
              <div className="text-xs text-red-600 max-h-32 overflow-y-auto space-y-1">
                {errors.slice(0, 20).map((e, i) => <div key={i}>Fila {e.row}: {e.error}</div>)}
                {errors.length > 20 && <div className="text-red-400">... y {errors.length - 20} mas</div>}
              </div>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-700 mb-2">Vista previa ({rows.length} filas validas)</div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest">Email</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest">Nombre</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest">Cohort</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest">Area</th>
                        <th className="px-3 py-2 text-right font-bold text-gray-500 uppercase tracking-widest">Días</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono">{r.email}</td>
                          <td className="px-3 py-2">{r.nombre} {r.apellido}</td>
                          <td className="px-3 py-2 text-gray-500">{r.cohort || cohort || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{r.area || '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-700 font-medium">{r.license_days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50">... y {rows.length - 50} mas</div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading || rows.length === 0}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: primary }}>
            {loading ? 'Cargando...' : `Cargar ${rows.length} entradas`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function CompanyAdmin() {
  const navigate = useNavigate()
  const { user, session, perfil, loading: authLoading, logout } = useAuth()
  const { tenant, cohort } = useTenant()
  const L = useSectorLabels()

  const [tab, setTab]               = useState('resumen')
  const [company, setCompany]       = useState(null)
  const [users, setUsers]           = useState([])
  const [invitations, setInvitations] = useState([])
  const [allowlist, setAllowlist]   = useState([])
  const [dashboard, setDashboard]   = useState({ stats: {} })
  const [loading, setLoading]       = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)

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
      const [profileRes, usersRes, invRes, dashRes, alRes] = await Promise.all([
        fetch(`${API}/api/company/profile`,    { headers }),
        fetch(`${API}/api/company/users`,      { headers }),
        fetch(`${API}/api/company/invitations`,{ headers }),
        fetch(`${API}/api/company/dashboard`,  { headers }),
        fetch(`${API}/api/company/allowlist`,  { headers }),
      ])
      const [pJson, uJson, iJson, dJson, alJson] = await Promise.all([
        profileRes.json().catch(() => ({})),
        usersRes.json().catch(() => ({})),
        invRes.json().catch(() => ({})),
        dashRes.json().catch(() => ({})),
        alRes.json().catch(() => ({})),
      ])
      if (pJson.company)     setCompany(pJson.company)
      if (uJson.users)       setUsers(uJson.users)
      if (iJson.invitations) setInvitations(iJson.invitations)
      if (dJson.stats)       setDashboard(dJson)
      if (alJson.allowlist)  setAllowlist(alJson.allowlist)
    } catch (err) {
      console.error('[CompanyAdmin] fetch error:', err)
      toast.error('No fue posible cargar los datos del programa.')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── CSV bulk upload handler ──
  const handleCsvBulk = async (rows, cohortDefault) => {
    if (!session?.access_token) return
    try {
      const res = await fetch(`${API}/api/company/allowlist/bulk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows, cohort_default: cohortDefault || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(data.summary || `${data.upserted} filas cargadas.`)
        setShowCsvModal(false)
        fetchAll()
      } else {
        toast.error(data.error || 'No fue posible cargar el archivo.')
      }
    } catch (err) {
      toast.error('Error de conexion.')
    }
  }

  // ── Revoke entry handler ──
  const handleRevoke = async (id, currentStatus) => {
    if (!session?.access_token) return
    const action = currentStatus === 'revoked' ? 'unrevoke' : 'revoke'
    try {
      const res = await fetch(`${API}/api/company/allowlist/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        toast.success(action === 'revoke' ? 'Acceso revocado' : 'Acceso restablecido')
        fetchAll()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'No fue posible actualizar.')
      }
    } catch (err) {
      toast.error('Error de conexion.')
    }
  }

  // ── Invitation handler ──
  const handleInvite = async (email, nombre, apellido, license_days) => {
    if (!session?.access_token) return
    try {
      const res = await fetch(`${API}/api/company/invitations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, nombre, apellido, license_days }),
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
              <img src={tenant.logo_url} alt={tenant.name} className="h-[48px] md:h-[54px] object-contain transition-all duration-300 hover:scale-105" />
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
            { id: 'invitaciones', label: 'Seguimiento', icon: PI.ListChecks },
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
        {tab === 'resumen' && (() => {
          // ── KPIs derivados de los datos en memoria ──
          const invitados    = allowlist.length
          const activados    = allowlist.filter(a => a.status === 'activated').length
          const adopcion     = invitados > 0 ? Math.round((activados / invitados) * 100) : 0
          const conCV        = users.filter(u => (u.cv_optimizer_count || 0) > 0).length
          const conMatch     = users.filter(u => (u.cv_match_count || 0) > 0).length
          const enBusqueda   = users.filter(u => (u.usage_count || 0) >= 10).length
          const empleados    = users.filter(u => u.hired_at).length
          const empleadosList = users.filter(u => u.hired_at).slice(0, 10)

          // Top engagement (top 5 por usage_count, NO mostramos PII detallada solo iniciales+area)
          const topUsers = [...users].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 5)

          // Breakdown por area: join entre allowlist activated + users
          const areaCounts = {}
          allowlist.filter(a => a.status === 'activated' && a.area).forEach(a => {
            areaCounts[a.area] = (areaCounts[a.area] || 0) + 1
          })
          const areaArr = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])
          const maxArea = Math.max(1, ...Object.values(areaCounts))

          // Funnel
          const funnelSteps = [
            { label: 'Invitados',          value: invitados,                                              color: '#94A3B8' },
            { label: 'Activados',          value: activados,                                              color: primary },
            { label: 'CV listo',           value: conCV,                                                  color: '#3B82F6' },
            { label: 'Analizan vacantes',  value: conMatch,                                               color: '#8B5CF6' },
            { label: 'En busqueda activa', value: enBusqueda,                                             color: '#F59E0B' },
            { label: L.successMetric,      value: empleados,                                              color: '#10B981' },
          ]
          const funnelMax = Math.max(1, ...funnelSteps.map(s => s.value))

          return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                Programa <span style={{ color: primary }}>{company?.name || tenant.name}</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Métricas agregadas anónimas del programa de {L.programPurpose}.
                No accedes a CVs, conversaciones, ni postulaciones individuales.
              </p>
            </div>

            {/* KPIs principales */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={PI.UsersThree} label={L.membersActiveLabel} value={activados}            sub={`de ${invitados} invitados`}        accent={primary} />
              <KpiCard icon={PI.TrendUp}    label="Tasa de adopción"      value={`${adopcion}%`}      sub="Activos / Invitados"               accent="#F59E0B" />
              <KpiCard icon={PI.FileText}   label="CVs generados"         value={stats.cvOptimizerUse || 0} sub={`${conCV} ${L.members} con CV`} accent="#8B5CF6" />
              <KpiCard icon={PI.Confetti}   label={L.successMetric}        value={empleados}           sub={empleados > 0 ? 'Felicidades 🎉' : L.successProcess}      accent="#10B981" />
            </div>

            {/* Funnel del programa */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Funnel del programa</h3>
                  <p className="text-xs text-gray-500">Progreso de la cohorte por etapa de la transición.</p>
                </div>
                <div className="text-xs text-gray-400 font-mono">{cohort || tenant.slug}</div>
              </div>
              <div className="space-y-3">
                {funnelSteps.map((s, i) => {
                  const pct = funnelMax > 0 ? Math.round((s.value / funnelMax) * 100) : 0
                  const pctOfTop = invitados > 0 ? Math.round((s.value / invitados) * 100) : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-700">{s.label}</span>
                        <span className="text-gray-400">
                          <span className="font-bold text-gray-900 mr-1">{s.value}</span>
                          ({pctOfTop}% de invitados)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: s.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Grid: Engagement + Sector */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Top engagement */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-1">Mayor engagement</h3>
                <p className="text-xs text-gray-500 mb-5">Top 5 por sesiones acumuladas en la plataforma.</p>
                {topUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">Sin datos de uso aún.</div>
                ) : (
                  <div className="space-y-3">
                    {topUsers.map((u, i) => {
                      const initials = ((u.nombre1 || '?')[0] + (u.apellido1 || '')[0]).toUpperCase()
                      const max = topUsers[0]?.usage_count || 1
                      const pct = Math.round(((u.usage_count || 0) / max) * 100)
                      return (
                        <div key={u.id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: secondary }}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-700 truncate">
                              {u.nombre1} {u.apellido1?.[0]}.
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: primary }} />
                            </div>
                          </div>
                          <div className="text-xs font-bold text-gray-900 shrink-0">{u.usage_count || 0} <span className="text-gray-400 font-normal">sesiones</span></div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sector breakdown */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-1">Adopción por área</h3>
                <p className="text-xs text-gray-500 mb-5">Activados por área dentro de la cohorte.</p>
                {areaArr.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">Carga el CSV con área para ver el breakdown.</div>
                ) : (
                  <div className="space-y-3">
                    {areaArr.map(([area, count]) => {
                      const pct = Math.round((count / maxArea) * 100)
                      return (
                        <div key={area}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-700">{area}</span>
                            <span className="font-bold text-gray-900">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: primary }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Empleados — outcomes destacados */}
            {empleadosList.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-700 shrink-0">
                    <PI.Confetti size={20} weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900">Outcomes del programa</h3>
                    <p className="text-xs text-gray-500">
                      <strong className="text-emerald-700">{empleados} {L.members}</strong> {L.successAchieved}.
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {empleadosList.map(u => (
                    <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#10B981' }}>
                          {(u.nombre1?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {u.nombre1} {u.apellido1?.[0]}.
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 truncate">→ {u.hired_company || 'Empresa no reportada'}</div>
                      {u.hired_at && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(u.hired_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidencialidad recordatorio */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                <PI.ShieldCheck size={20} weight="duotone" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Tu rol como administrador del programa</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Como administrador, puedes invitar {L.members}, ver métricas de uso agregadas y exportar reportes.
                  <strong className="text-gray-700"> No tienes acceso a los CVs, mensajes con el bot, ni postulaciones individuales</strong> — eso es estrictamente confidencial entre cada {L.member} y ELVIA®.
                </p>
              </div>
            </div>

            {/* Breakdown de uso */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-5">Uso por herramienta (agregado)</h3>
              <div className="space-y-4">
                {[
                  { label: 'CV Optimizer',  value: stats.cvOptimizerUse || 0, max: Math.max(20, (stats.cvOptimizerUse || 0) * 1.2), color: primary },
                  { label: 'CV vs Vacante', value: stats.cvMatchUse || 0,     max: Math.max(20, (stats.cvMatchUse || 0) * 1.2),     color: '#10B981' },
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
          )
        })()}

        {/* ════════ PERSONAS ════════ */}
        {tab === 'personas' && (
          <div className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Personas del programa</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Lista aprobada de {L.members} que pueden acceder al programa.
                  Solo personas en esta lista pueden activar cuenta.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCsvModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: primary }}
                >
                  <PI.UploadSimple size={16} weight="bold" />
                  Cargar CSV
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  <PI.UserPlus size={16} weight="bold" />
                  Invitar uno
                </button>
              </div>
            </div>

            {/* KPIs allowlist */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                const total      = allowlist.length
                const activados  = allowlist.filter(a => a.status === 'activated').length
                const pendientes = allowlist.filter(a => a.status === 'pending' || a.status === 'invited').length
                const revocados  = allowlist.filter(a => a.status === 'revoked').length
                const adopcion   = total > 0 ? Math.round((activados / total) * 100) : 0
                return (
                  <>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Aprobados</div>
                      <div className="text-2xl font-bold text-gray-900">{total}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Activados</div>
                      <div className="text-2xl font-bold text-emerald-600">{activados}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pendientes</div>
                      <div className="text-2xl font-bold text-amber-600">{pendientes}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Tasa de adopción</div>
                      <div className="text-2xl font-bold" style={{ color: primary }}>{adopcion}%</div>
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {allowlist.length === 0 ? (
                <div className="p-16 text-center">
                  <PI.UsersThree size={48} className="text-gray-300 mx-auto mb-3" weight="duotone" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Aún no hay personas en la lista aprobada</p>
                  <p className="text-xs text-gray-500 mb-5">Carga un CSV con los emails de tu cohorte o invita a uno manualmente.</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setShowCsvModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                      style={{ background: primary }}
                    >
                      <PI.UploadSimple size={16} weight="bold" />
                      Cargar CSV
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Persona</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Email</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Área</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Cohort</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Estado</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allowlist.map(a => {
                        const statusStyle = a.status === 'activated'
                          ? 'bg-emerald-50 text-emerald-600'
                          : a.status === 'revoked'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-700'
                        const statusLabel = a.status === 'activated' ? 'Activado' : a.status === 'revoked' ? 'Revocado' : 'Pendiente'
                        return (
                          <tr key={a.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: secondary }}>
                                  {(a.nombre?.[0] || a.email?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {[a.nombre, a.apellido].filter(Boolean).join(' ') || <span className="text-gray-400">Sin nombre</span>}
                                  </div>
                                  {a.cargo_actual && <div className="text-xs text-gray-400">{a.cargo_actual}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-mono">{a.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{a.area || '—'}</td>
                            <td className="px-6 py-4 text-xs text-gray-500 font-mono">{a.cohort || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${statusStyle}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRevoke(a.id, a.status)}
                                className="text-xs font-semibold text-gray-500 hover:text-gray-900 underline"
                              >
                                {a.status === 'revoked' ? 'Restablecer' : 'Revocar'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ SEGUIMIENTO ════════ */}
        {tab === 'invitaciones' && (() => {
          const total      = allowlist.length
          const activados  = allowlist.filter(a => a.status === 'activated').length
          const pendientes = allowlist.filter(a => a.status === 'pending' || a.status === 'invited').length
          const inactivos  = allowlist.filter(a => a.status === 'revoked').length

          // Enriquecer allowlist con datos de la invitación (expires_at, created_at) por email
          const invMap = Object.fromEntries(invitations.map(i => [i.email, i]))

          const statusCfg = {
            activated: { label: 'Activado',  bg: 'bg-emerald-50', text: 'text-emerald-700', icon: PI.CheckCircle,  iconColor: 'text-emerald-500' },
            pending:   { label: 'Invitado',  bg: 'bg-amber-50',   text: 'text-amber-700',   icon: PI.Clock,        iconColor: 'text-amber-500'   },
            invited:   { label: 'Invitado',  bg: 'bg-amber-50',   text: 'text-amber-700',   icon: PI.Clock,        iconColor: 'text-amber-500'   },
            revoked:   { label: 'Inactivo',  bg: 'bg-gray-100',   text: 'text-gray-500',    icon: PI.ProhibitInset, iconColor: 'text-gray-400'   },
          }

          return (
          <div className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Seguimiento de participantes</h1>
                <p className="text-sm text-gray-500 mt-1">Estado de todos los invitados al programa.</p>
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

            {/* Mini KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total invitados</div>
                <div className="text-2xl font-bold text-gray-900">{total}</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Activados</div>
                <div className="text-2xl font-bold text-emerald-600">{activados}</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pendientes</div>
                <div className="text-2xl font-bold text-amber-600">{pendientes}</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Inactivos</div>
                <div className="text-2xl font-bold text-gray-400">{inactivos}</div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {allowlist.length === 0 ? (
                <div className="p-16 text-center">
                  <PI.UserPlus size={48} className="text-gray-300 mx-auto mb-3" weight="duotone" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Sin participantes aún</p>
                  <p className="text-xs text-gray-500 mb-5">Invita personas manualmente o carga un CSV desde la pestaña Personas.</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: primary }}
                  >
                    <PI.PaperPlaneTilt size={16} weight="bold" />
                    Nueva invitación
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Participante</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Estado</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Invitado</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Activado</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Vence</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...allowlist].sort((a, b) => new Date(b.added_at) - new Date(a.added_at)).map(a => {
                        const cfg = statusCfg[a.status] || statusCfg.pending
                        const StatusIcon = cfg.icon
                        const inv = invMap[a.email]
                        const invDate = a.added_at ? new Date(a.added_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
                        const actDate = a.activated_at ? new Date(a.activated_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
                        return (
                          <tr key={a.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: secondary }}>
                                  {(a.nombre?.[0] || a.email?.[0] || '?').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {[a.nombre, a.apellido].filter(Boolean).join(' ') || <span className="text-gray-400 italic">Sin nombre</span>}
                                  </div>
                                  <div className="text-xs text-gray-400 font-mono truncate">{a.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${cfg.bg} ${cfg.text}`}>
                                <StatusIcon size={12} weight="bold" />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500">{invDate}</td>
                            <td className="px-6 py-4 text-xs text-gray-500">
                              {a.status === 'activated' ? <span className="text-emerald-600 font-semibold">{actDate}</span> : '—'}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {a.license_expires_at
                                ? (() => {
                                    const exp = new Date(a.license_expires_at)
                                    const soon = exp - new Date() < 14 * 24 * 3600 * 1000
                                    const expired = exp < new Date()
                                    return (
                                      <span className={expired ? 'text-red-500 font-bold' : soon ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                                        {exp.toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' })}
                                        {expired && ' ⚠️'}
                                      </span>
                                    )
                                  })()
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRevoke(a.id, a.status)}
                                className="text-xs font-semibold text-gray-400 hover:text-gray-700 underline"
                              >
                                {a.status === 'revoked' ? 'Restablecer' : 'Revocar'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          )
        })()}

        {/* ════════ CONFIG ════════ */}
        {tab === 'config' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración del programa</h1>
              <p className="text-sm text-gray-500 mt-1">Información del tenant y compliance.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">{L.orgData}</h3>
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
                <li className="flex items-start gap-2"><PI.CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Sin acceso a datos individuales de {L.members}</li>
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

      {showCsvModal && (
        <CsvUploadModal
          onClose={() => setShowCsvModal(false)}
          onSubmit={handleCsvBulk}
          primary={primary}
          defaultCohort={cohort || ''}
        />
      )}
    </div>
  )
}
