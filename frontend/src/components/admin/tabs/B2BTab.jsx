import React, { useState, useEffect, useCallback } from 'react'
import * as PI from '@phosphor-icons/react'
import KpiCard from '../shared/KpiCard'
import SectionHeading from '../shared/SectionHeading'
import Badge from '../shared/Badge'
import AdminSkeleton from '../shared/AdminSkeleton'
import { toast } from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateSlug = (name) =>
  name.toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

const SECTOR_OPTIONS = [
  { value: 'corporate',   label: 'Corporativo' },
  { value: 'university',  label: 'Universidad' },
  { value: 'government',  label: 'Gobierno' },
]

const PLAN_OPTIONS = [
  { value: 'starter',      label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise',   label: 'Enterprise' },
]

const WIZARD_STEPS = [
  { id: 1, label: 'Identidad',  icon: PI.Buildings },
  { id: 2, label: 'Branding',   icon: PI.PaintBucket },
  { id: 3, label: 'Acceso',     icon: PI.ShieldCheck },
  { id: 4, label: 'Admin HR',   icon: PI.UserPlus },
]

const INITIAL_DATA = {
  nombre: '', slug: '', sector: 'corporate', plan: 'professional', country: 'MX',
  logo_url: '', primary_color: '#0066FF', secondary_color: '#0D1B2A', accent_color: '#00D4FF',
  hero_title: '', welcome_message: '',
  branding_mode: 'cobranded', show_program_badge: true, program_badge_text: '',
  allowed_email_domain: '', require_allowlist: false, require_invite: false,
  hr_nombre: '', hr_apellido: '', hr_email: '',
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold placeholder:text-slate-700 transition-all'
const labelCls = 'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5'

// ─── TenantWizard ─────────────────────────────────────────────────────────────

const TenantWizard = ({ onClose, onSuccess, db, API_URL }) => {
  const [step, setStep]         = useState(1)
  const [data, setData]         = useState(INITIAL_DATA)
  const [slugStatus, setSlugStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]     = useState(null)

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setData(prev => ({ ...prev, [field]: val }))
  }

  // Auto-generate slug when nombre changes (Step 1)
  const handleNombreChange = (e) => {
    const nombre = e.target.value
    setData(prev => ({ ...prev, nombre, slug: generateSlug(nombre) }))
    setSlugStatus(null)
  }

  const handleSlugChange = (e) => {
    setData(prev => ({ ...prev, slug: e.target.value }))
    setSlugStatus(null)
  }

  const checkSlug = async () => {
    const slug = data.slug.trim()
    if (!slug) return
    if (!/^[a-z0-9-]{2,60}$/.test(slug)) { setSlugStatus('invalid'); return }
    setSlugStatus('checking')
    try {
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API_URL}/api/admin/tenants/check-slug/${slug}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      setSlugStatus(json.available ? 'available' : 'taken')
    } catch {
      setSlugStatus(null)
    }
  }

  const canNext = () => {
    if (step === 1) return data.nombre.trim() && data.slug.trim() && slugStatus !== 'taken' && slugStatus !== 'invalid'
    if (step === 4) return data.hr_nombre.trim() && data.hr_email.trim()
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: { session } } = await db.auth.getSession()
      const payload = {
        ...data,
        allowed_email_domain: data.allowed_email_domain.trim() || undefined,
        logo_url: data.logo_url.trim() || undefined,
        hero_title: data.hero_title.trim() || undefined,
        welcome_message: data.welcome_message.trim() || undefined,
      }
      const res = await fetch(`${API_URL}/api/admin/tenants`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok) {
        setResult(json)
        setStep(5)
        onSuccess()
        toast.success(`Tenant "${data.nombre}" creado correctamente`)
      } else {
        toast.error(json.error || 'Error creando tenant')
      }
    } catch {
      toast.error('Error de conexión con el servidor')
    } finally {
      setSubmitting(false)
    }
  }

  const SlugStatusIcon = () => {
    if (slugStatus === 'checking')  return <PI.CircleNotch size={16} className="animate-spin text-slate-500" />
    if (slugStatus === 'available') return <PI.CheckCircle size={16} className="text-emerald-400" />
    if (slugStatus === 'taken')     return <PI.XCircle size={16} className="text-rose-400" />
    if (slugStatus === 'invalid')   return <PI.Warning size={16} className="text-amber-400" />
    return null
  }

  const renderStep = () => {
    // ── Step 1: Identidad ───────────────────────────────────────────────────
    if (step === 1) return (
      <div className="space-y-5">
        <div>
          <label className={labelCls}>Nombre de la empresa *</label>
          <input type="text" value={data.nombre} onChange={handleNombreChange}
            className={inputCls} placeholder="Ej: Telefónica LATAM" />
        </div>

        <div>
          <label className={labelCls}>Slug (URL identificador) *</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold select-none">elvia.lat/empresas/</span>
            <input type="text" value={data.slug} onChange={handleSlugChange} onBlur={checkSlug}
              className={`${inputCls} pl-[152px]`} placeholder="telefonica" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2"><SlugStatusIcon /></div>
          </div>
          {slugStatus === 'taken'   && <p className="text-rose-400 text-[10px] font-bold mt-1 ml-1">Slug en uso — elige otro</p>}
          {slugStatus === 'invalid' && <p className="text-amber-400 text-[10px] font-bold mt-1 ml-1">Solo letras minúsculas, números y guiones (2-60 chars)</p>}
          {slugStatus === 'available' && <p className="text-emerald-400 text-[10px] font-bold mt-1 ml-1">Disponible</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Sector</label>
            <select value={data.sector} onChange={set('sector')}
              className={inputCls}>
              {SECTOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Plan</label>
            <select value={data.plan} onChange={set('plan')}
              className={inputCls}>
              {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>País</label>
          <select value={data.country} onChange={set('country')} className={inputCls}>
            <option value="MX">México</option>
            <option value="CO">Colombia</option>
            <option value="ES">España</option>
            <option value="AR">Argentina</option>
            <option value="CL">Chile</option>
            <option value="PE">Perú</option>
            <option value="US">Estados Unidos</option>
          </select>
        </div>
      </div>
    )

    // ── Step 2: Branding ───────────────────────────────────────────────────
    if (step === 2) return (
      <div className="space-y-5">
        <div>
          <label className={labelCls}>URL del logo (HTTPS)</label>
          <input type="url" value={data.logo_url} onChange={set('logo_url')}
            className={inputCls} placeholder="https://cdn.empresa.com/logo.webp" />
          <p className="text-slate-600 text-[10px] mt-1 ml-1">Déjalo vacío para usar el logo por defecto de ELVIA</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { field: 'primary_color',   label: 'Color Principal' },
            { field: 'secondary_color', label: 'Color Secundario' },
            { field: 'accent_color',    label: 'Color Acento' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className={labelCls}>{label}</label>
              <div className="relative">
                <input type="color" value={data[field]} onChange={set(field)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                <input type="text" value={data[field]} onChange={set(field)}
                  className={`${inputCls} pl-12 font-mono text-xs`} />
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-4 flex items-center gap-4 border"
          style={{ background: data.secondary_color, borderColor: data.primary_color + '40' }}
        >
          {data.logo_url
            ? <img src={data.logo_url} alt="preview" className="h-8 object-contain" onError={e => e.target.style.display='none'} />
            : <div className="text-xs font-bold text-white opacity-60">Sin logo</div>
          }
          <div>
            <p className="text-xs font-black uppercase" style={{ color: data.primary_color }}>
              {data.hero_title || data.nombre || 'ELVIA® — Preview'}
            </p>
            <p className="text-[10px] opacity-60 text-white">Preview branding</p>
          </div>
          <div className="ml-auto flex gap-2">
            {[data.primary_color, data.secondary_color, data.accent_color].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} />
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Visibilidad de marca frente al candidato</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'cobranded',   label: 'Co-brandeado',   desc: 'Logo cliente + ELVIA' },
              { value: 'tenant_only', label: 'Solo cliente',   desc: 'ELVIA discreto en footer' },
              { value: 'elvia_only',  label: 'Solo ELVIA',     desc: 'Cliente confidencial' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setData(prev => ({ ...prev, branding_mode: opt.value }))}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  data.branding_mode === opt.value
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-white">{opt.label}</p>
                <p className="text-[9px] text-slate-500 mt-1 leading-tight">{opt.desc}</p>
              </button>
            ))}
          </div>
          <p className="text-slate-600 text-[10px] mt-1.5 ml-1">
            Outplacement confidencial (M&A, layoffs masivos): elige <strong>"Solo ELVIA"</strong> para que el candidato nunca vea la marca del sponsor.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Badge in-app "Programa X"</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Muestra un badge en el dashboard del candidato recordando el programa</p>
            </div>
            <button
              type="button"
              onClick={() => setData(prev => ({ ...prev, show_program_badge: !prev.show_program_badge }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${data.show_program_badge ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${data.show_program_badge ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {data.show_program_badge && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Texto del badge (opcional)</label>
              <input
                type="text" value={data.program_badge_text} onChange={set('program_badge_text')}
                className={`${inputCls} text-xs`}
                placeholder={`Programa ${data.nombre || 'Telefónica'}`}
              />
              <p className="text-[9px] text-slate-600 mt-1 ml-1">
                Déjalo vacío para usar "Programa {data.nombre || '{nombre}'}". Útil si necesitas confidencialidad: "Programa de Transición 2026".
              </p>
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>Título del hero (landing pública)</label>
          <input type="text" value={data.hero_title} onChange={set('hero_title')}
            className={inputCls} placeholder="Programa de Outplacement 2026" />
        </div>

        <div>
          <label className={labelCls}>Mensaje de bienvenida (dashboard candidato)</label>
          <textarea value={data.welcome_message} onChange={set('welcome_message')}
            rows={3} className={`${inputCls} resize-none`}
            placeholder="Bienvenido/a al programa de transición laboral..." />
        </div>
      </div>
    )

    // ── Step 3: Acceso ──────────────────────────────────────────────────────
    if (step === 3) return (
      <div className="space-y-6">
        <div>
          <label className={labelCls}>Dominio de email permitido (opcional)</label>
          <input type="text" value={data.allowed_email_domain} onChange={set('allowed_email_domain')}
            className={inputCls} placeholder="telefonica.com" />
          <p className="text-slate-600 text-[10px] mt-1 ml-1">
            Si se llena, solo emails de este dominio pueden registrarse. Deja vacío para outplacement (emails personales).
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              field: 'require_allowlist',
              label: 'Requerir allowlist',
              desc: 'Solo candidatos en la lista cargada por HR pueden registrarse',
              icon: PI.ListChecks,
            },
            {
              field: 'require_invite',
              label: 'Requerir invitación',
              desc: 'Solo candidatos con link de invitación activo pueden acceder',
              icon: PI.EnvelopeSimple,
            },
          ].map(({ field, label, desc, icon: Icon }) => (
            <label key={field}
              className="flex items-start gap-4 p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/30 cursor-pointer transition-colors">
              <div className="mt-0.5">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  data[field] ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-900 border-slate-700'
                }`}>
                  {data[field] && <PI.Check size={12} weight="bold" className="text-white" />}
                </div>
                <input type="checkbox" checked={data[field]} onChange={set(field)} className="sr-only" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-indigo-400" />
                  <p className="text-[11px] font-black text-white uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Configuración actual</p>
          <p className="text-xs text-slate-300">
            {!data.allowed_email_domain && !data.require_allowlist && !data.require_invite
              ? '⚡ Acceso abierto — cualquier email puede registrarse'
              : [
                  data.allowed_email_domain && `📧 Solo emails @${data.allowed_email_domain}`,
                  data.require_allowlist    && '📋 Gate allowlist activo',
                  data.require_invite       && '✉️ Se requiere invitación',
                ].filter(Boolean).join(' · ')
            }
          </p>
        </div>
      </div>
    )

    // ── Step 4: HR Admin ────────────────────────────────────────────────────
    if (step === 4) return (
      <div className="space-y-5">
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">¿Qué pasa al crear?</p>
          <p className="text-xs text-slate-400">
            Se creará una cuenta con rol <span className="text-indigo-400 font-bold">company_admin</span> y se enviará un email con contraseña temporal al gestor HR. La URL de acceso será:
          </p>
          <p className="text-xs font-mono text-indigo-300 mt-2">
            elvia.lat/empresas/<span className="text-white">{data.slug || 'slug'}</span>/hr
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input type="text" value={data.hr_nombre} onChange={set('hr_nombre')}
              className={inputCls} placeholder="Ana" />
          </div>
          <div>
            <label className={labelCls}>Apellido</label>
            <input type="text" value={data.hr_apellido} onChange={set('hr_apellido')}
              className={inputCls} placeholder="García" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Email del gestor HR *</label>
          <input type="email" value={data.hr_email} onChange={set('hr_email')}
            className={inputCls} placeholder="ana.garcia@empresa.com" />
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Resumen del tenant</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-400">
            <span>Empresa:</span>     <span className="text-white font-bold">{data.nombre}</span>
            <span>Slug:</span>        <span className="text-white font-bold">{data.slug}</span>
            <span>Sector:</span>      <span className="text-white">{SECTOR_OPTIONS.find(o => o.value === data.sector)?.label}</span>
            <span>Plan:</span>        <span className="text-white">{data.plan}</span>
            <span>Acceso:</span>      <span className="text-white">{data.require_allowlist ? 'Allowlist' : data.require_invite ? 'Invitación' : 'Abierto'}</span>
          </div>
        </div>
      </div>
    )

    // ── Step 5: Éxito ───────────────────────────────────────────────────────
    if (step === 5 && result) return (
      <div className="text-center space-y-6 py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <PI.CheckCircle size={32} className="text-emerald-400" weight="duotone" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white uppercase italic">{result.company?.name || data.nombre}</h3>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Tenant creado correctamente</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 text-left space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Portal HR</p>
          <div className="flex items-center gap-3">
            <code className="text-xs text-indigo-300 bg-slate-950 px-3 py-2 rounded-xl flex-1 truncate">{result.hr_url}</code>
            <button onClick={() => { navigator.clipboard.writeText(result.hr_url); toast.success('URL copiada') }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
              <PI.Copy size={14} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Se envió email de bienvenida con contraseña temporal a <span className="text-white">{data.hr_email}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={step === 5 ? onClose : undefined}>
      <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="px-10 pt-10 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <PI.Buildings size={20} weight="duotone" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase italic tracking-tight">
                  {step === 5 ? 'Tenant Creado' : 'Nuevo Tenant B2B'}
                </h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  {step < 5 ? `Paso ${step} de 4` : 'Completado'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-slate-800 transition-colors">
              <PI.X size={16} weight="bold" />
            </button>
          </div>

          {/* Step dots */}
          {step < 5 && (
            <div className="flex items-center gap-2">
              {WIZARD_STEPS.map((s, i) => {
                const done = step > s.id
                const active = step === s.id
                return (
                  <React.Fragment key={s.id}>
                    <div className={`flex items-center gap-1.5 transition-all ${active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-30'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {done ? <PI.Check size={10} weight="bold" /> : s.id}
                      </div>
                      {active && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hidden sm:block">{s.label}</span>}
                    </div>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div className={`flex-1 h-px transition-all ${done ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-10 pb-6 max-h-[60vh] overflow-y-auto">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-10 pb-10 flex gap-3">
          {step === 5 ? (
            <button onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all text-[11px] italic">
              Listo
            </button>
          ) : (
            <>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all">
                  ← Atrás
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => { if (step === 1 && slugStatus === null) checkSlug().then(() => setTimeout(() => setStep(s => s + 1), 300)); else setStep(s => s + 1) }}
                  disabled={!canNext()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all text-[11px] italic">
                  Siguiente →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!canNext() || submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all text-[11px] italic flex items-center justify-center gap-2">
                  {submitting ? <><PI.CircleNotch size={16} className="animate-spin" /> Creando...</> : '✓ Crear Tenant'}
                </button>
              )}
              <button onClick={onClose}
                className="px-6 py-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-widest transition-all">
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── B2BTab ───────────────────────────────────────────────────────────────────

const B2BTab = ({ db, API_URL }) => {
  const [companies, setCompanies]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [showWizard, setShowWizard]   = useState(false)

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API_URL}/api/admin/companies`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      setCompanies(json.companies || [])
    } catch {
      toast.error('Error al sincronizar alianzas')
    } finally {
      setLoading(false)
    }
  }, [db, API_URL])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  const handleToggleActive = async (id, isActive) => {
    try {
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API_URL}/api/admin/companies/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      })
      if (res.ok) {
        toast.success(isActive ? 'Cuenta suspendida' : 'Cuenta reactivada')
        await fetchCompanies()
      }
    } catch {
      toast.error('No se pudo cambiar el estado de la cuenta')
    }
  }

  const activeCount = companies.filter(c => c.is_active).length

  if (loading && companies.length === 0) return <AdminSkeleton type="table" />

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl">
      <SectionHeading
        title="Unidades de Negocio"
        subtitle="Gestión de alianzas estratégicas y cuentas corporativas ELVIA"
        icon={PI.Buildings}
      >
        <button
          onClick={() => setShowWizard(true)}
          className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-900/20"
        >
          <PI.Plus size={16} weight="bold" /> Nuevo Tenant
        </button>
      </SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard label="Alianzas Activas"  value={activeCount}       sub="CUENTAS OPERATIVAS"   icon={PI.CheckSquareOffset} color="blue" />
        <KpiCard label="Pipeline Total"    value={companies.length}  sub="ENTIDADES REGISTRADAS" icon={PI.Briefcase}         color="green" />
      </div>

      <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="bg-indigo-600/10 border border-indigo-500/30 px-6 py-3 rounded-2xl flex items-center gap-3">
              <PI.CircleNotch size={20} className="text-indigo-500 animate-spin" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sincronizando...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500">
                <th className="px-10 py-5">Empresa</th>
                <th className="px-10 py-5">Slug / Sector</th>
                <th className="px-10 py-5">Estado</th>
                <th className="px-10 py-5">Alta</th>
                <th className="px-10 py-5">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {companies.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    No hay alianzas registradas — crea el primer tenant
                  </td>
                </tr>
              ) : companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      {c.logo_url
                        ? <img src={c.logo_url} alt={c.name} className="w-10 h-10 object-contain rounded-xl" />
                        : (
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                            <PI.Buildings size={18} weight="duotone" />
                          </div>
                        )
                      }
                      <p className="text-sm font-black text-white uppercase italic tracking-tight">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <p className="text-[10px] font-mono text-indigo-400">{c.slug || '—'}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{c.sector || 'corporate'}</p>
                  </td>
                  <td className="px-10 py-6">
                    <Badge color={c.is_active ? 'green' : 'red'}>
                      {c.is_active ? 'OPERATIVA' : 'SUSPENDIDA'}
                    </Badge>
                  </td>
                  <td className="px-10 py-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <button
                      onClick={() => handleToggleActive(c.id, c.is_active)}
                      className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
                        c.is_active
                          ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white'
                          : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      {c.is_active ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showWizard && (
        <TenantWizard
          db={db}
          API_URL={API_URL}
          onClose={() => setShowWizard(false)}
          onSuccess={fetchCompanies}
        />
      )}
    </div>
  )
}

export default B2BTab
