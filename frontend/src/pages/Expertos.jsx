// Expertos.jsx — Mentor Experto: asesoría 1-a-1 humana y confidencial
import { useState } from 'react'
import {
  UsersThree, ShieldCheck, Lock, Info, X,
  CheckCircle, Clock, ListChecks, Warning, Seal
} from '@phosphor-icons/react'

// ─── Modal de Política de Privacidad ─────────────────────────────────────────
function ModalPrivacidad({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShieldCheck size={18} weight="duotone" className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-base">Política de Privacidad y Tratamiento de Datos</h2>
              <p className="text-xs text-slate-400">Sesión de Mentoría — ELVIA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-600 leading-relaxed">
          <p className="text-xs text-slate-400 italic">Última actualización: Marzo 2026</p>

          <div>
            <h3 className="font-bold text-slate-800 mb-1">1. Datos recopilados</h3>
            <p>Para la prestación del servicio de mentoría, ELVIA recopila únicamente los datos que usted proporciona voluntariamente en el formulario de solicitud: nombre de usuario, tipo de asesoría solicitada y la descripción detallada de su requerimiento. <strong>Solo comparta información que usted considere que puede compartir libremente con un profesional de confianza.</strong></p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-1">2. Finalidad del tratamiento</h3>
            <p>La información proporcionada se utiliza exclusivamente para:</p>
            <ul className="mt-2 space-y-1 ml-4">
              {['Asignar al mentor más adecuado según el tipo de asesoría solicitada', 'Preparar la sesión con contexto previo y maximizar su valor', 'Dar seguimiento posterior si el usuario así lo solicita'].map(item => (
                <li key={item} className="flex gap-2"><span className="text-emerald-500 shrink-0 mt-0.5">•</span>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-1">3. Confidencialidad absoluta</h3>
            <p>Toda la información compartida durante la sesión y en el formulario de solicitud es <strong>estrictamente confidencial</strong>. El mentor asignado está sujeto a un acuerdo de no divulgación (NDA). Su información jamás será compartida con terceros, empleadores, ni ninguna entidad externa.</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-1">4. Bases legales</h3>
            <p>El tratamiento de sus datos se realiza con base en el consentimiento explícito del usuario, conforme a las regulaciones aplicables de protección de datos, incluyendo el <strong>Reglamento General de Protección de Datos (GDPR) de la Unión Europea</strong>, la <strong>Ley Federal de Protección de Datos Personales (México)</strong> y demás leyes internacionales aplicables.</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-1">5. Derechos del usuario (ARCO)</h3>
            <p>Usted tiene derecho en todo momento a: <strong>Acceder</strong> a sus datos, <strong>Rectificarlos</strong>, <strong>Cancelar</strong> su tratamiento y <strong>Oponerse</strong> al mismo. Para ejercer estos derechos, contacte a: <a href="mailto:privacidad@elvia.lat" className="text-emerald-600 font-semibold hover:underline">privacidad@elvia.lat</a></p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-1">6. Alcance y limitaciones del servicio</h3>
            <p>La sesión de mentoría está limitada a temas relacionados con: orientación de entrevistas, análisis de carta oferta, evaluación de vacantes y transición laboral. <strong>No aplica para asesoría legal, normativa laboral, situaciones personales-emocionales ni temas controversiales de naturaleza laboral o legal.</strong></p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
            <ShieldCheck size={16} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed">
              Al agendar su sesión, usted confirma haber leído y aceptado esta política. Sus datos están protegidos y su sesión es 100% privada y encriptada.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors cursor-pointer">
            Entendido, continuar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Expertos() {
  const [servicio, setServicio] = useState('')
  const [detalle, setDetalle]  = useState('')
  const [modalPriv, setModalPriv] = useState(false)
  const [enviado, setEnviado]  = useState(false)

  const puedeEnviar = servicio && detalle.trim().length >= 20

  const handleEnviar = () => {
    if (!puedeEnviar) return
    // En producción aquí se llamaría a la API del backend
    const mailto = `mailto:expertos@elvia.lat?subject=${encodeURIComponent('Solicitud de Mentoría — ' + servicio)}&body=${encodeURIComponent('Tipo de asesoría: ' + servicio + '\n\nDetalle del requerimiento:\n' + detalle)}`
    window.open(mailto, '_blank')
    setEnviado(true)
    setTimeout(() => setEnviado(false), 4000)
  }

  const SERVICIOS = [
    { value: 'asesoria_entrevista',    label: 'Asesoría de Entrevista' },
    { value: 'asesoria_carta_oferta',  label: 'Asesoría de Carta Oferta' },
    { value: 'revision_cv',            label: 'Revisión de CV y Posicionamiento' },
    { value: 'analisis_vacante',       label: 'Análisis de Vacante Objetivo' },
    { value: 'transicion_laboral',     label: 'Estrategia de Transición Laboral' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-16" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {modalPriv && <ModalPrivacidad onClose={() => setModalPriv(false)} />}

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest border border-emerald-200">
                <UsersThree weight="duotone" size={15} />
                Sesión 1-a-1 con Mentor Experto
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                Tu carrera necesita <br/>
                <span className="text-emerald-600">un experto de tu lado</span>
              </h1>

              <p className="text-slate-500 text-base leading-relaxed">
                Una sesión de <strong className="text-slate-700">50 minutos</strong> con un mentor senior de la industria, enfocada 100% en tu momento actual. Sin plantillas, sin respuestas genéricas — solo orientación real y accionable.
              </p>

              {/* Scope — qué incluye / no incluye */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CheckCircle size={13} weight="fill" /> Esto cubrimos
                  </p>
                  <ul className="space-y-1.5">
                    {['Preparación de entrevistas', 'Análisis de tu carta oferta', 'Revisión de vacante objetivo', 'Tu CV y propuesta de valor', 'Estrategia de transición laboral'].map(i => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-800">
                        <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>{i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Warning size={13} weight="fill" /> Fuera de alcance
                  </p>
                  <ul className="space-y-1.5">
                    {['Asesoría legal o normativa', 'Situaciones personales / emocionales', 'Conflictos laborales controversiales', 'Temas fuera del ámbito de la app'].map(i => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                        <span className="text-slate-400 shrink-0 mt-0.5">✗</span>{i}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                {[
                  { icon: Clock, label: '50 min', sub: 'de sesión enfocada' },
                  { icon: ShieldCheck, label: 'Top 1%', sub: 'de la industria' },
                  { icon: Lock, label: '100% privado', sub: 'sesión encriptada' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <s.icon size={20} weight="duotone" className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{s.label}</p>
                      <p className="text-[10px] text-slate-400">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200/40 to-teal-100/40 blur-3xl rounded-3xl -z-10 scale-105" />
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100 relative">
                <img
                  src="/Avatar-Elvia-HD.webp"
                  alt="Mentor ELVIA"
                  className="w-full h-auto object-cover"
                />
                
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <UsersThree size={18} weight="duotone" className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Sesión 1-a-1 exclusiva</p>
                  <p className="text-[10px] text-slate-400">Feedback directo y accionable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de solicitud */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 mt-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <ListChecks size={20} weight="duotone" className="text-emerald-600" />
            <div>
              <h2 className="font-black text-slate-800 text-base">Solicitar mi sesión de mentoría</h2>
              <p className="text-xs text-slate-400">Completa el formulario y te contactamos en menos de 24 horas</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Aviso de confidencialidad */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2.5">
              <Info size={15} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Comparte solo lo que puedes compartir libremente.</strong> No incluyas contraseñas, información salarial de terceros, datos personales de colegas ni nada que consideres confidencial para tu empresa actual.
              </p>
            </div>

            {/* Selector de servicio */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Tipo de asesoría *
              </label>
              <select
                value={servicio}
                onChange={e => setServicio(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 bg-white cursor-pointer"
              >
                <option value="">Selecciona el tipo de asesoría...</option>
                {SERVICIOS.map(s => (
                  <option key={s.value} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Detalle del requerimiento */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Describe tu requerimiento en detalle *
              </label>
              <textarea
                value={detalle}
                onChange={e => setDetalle(e.target.value)}
                rows={5}
                placeholder="Ej: Tengo una entrevista final con [empresa] en 3 días para un puesto de [cargo]. Es una entrevista conductual y técnica. Me gustaría practicar respuestas STAR, en particular para preguntas de liderazgo y manejo de conflicto. Mi experiencia más relevante es..."
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 resize-none leading-relaxed"
              />
              <p className={`text-[10px] mt-1 text-right ${detalle.length < 20 ? 'text-slate-300' : 'text-emerald-500 font-semibold'}`}>
                {detalle.length} caracteres {detalle.length < 20 ? `(mínimo 20)` : '✓'}
              </p>
            </div>

            {/* Sello de confidencialidad + botón */}
            <div className="space-y-3 pt-2">
              {/* Sello */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Lock size={18} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-800">Sello de Confidencialidad ELVIA</p>
                  <p className="text-xs text-emerald-600 leading-relaxed mt-0.5">
                    Tus datos están protegidos bajo las Leyes internacionales de privacidad (GDPR · LFPDPPP). Esta sesión es <strong>100% privada y encriptada</strong>. La información que compartas es estrictamente confidencial y nunca será divulgada a terceros.
                  </p>
                </div>
              </div>

              {/* Disclaimer link */}
              <button
                onClick={() => setModalPriv(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer w-full justify-center"
              >
                <Info size={12} />
                Leer política completa de privacidad y protección de datos
              </button>

              {/* Botón de envío */}
              <button
                onClick={handleEnviar}
                disabled={!puedeEnviar}
                className="w-full py-4 rounded-xl font-black text-base transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {enviado
                  ? <><CheckCircle size={18} weight="fill" /> ¡Solicitud enviada! Te contactamos pronto</>
                  : <>Agendar mi sesión de mentoría →</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
