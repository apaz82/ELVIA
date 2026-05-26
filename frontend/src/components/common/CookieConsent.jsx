import { useState, useEffect } from 'react'
import { Cookie, X } from '@phosphor-icons/react'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('elvia_cookie_consent')
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('elvia_cookie_consent', 'accepted')
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('elvia_cookie_consent', 'declined')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl bg-opacity-95">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-xl hidden sm:block" style={{ backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 15%, transparent)' }}>
              <Cookie size={24} style={{ color: 'var(--tenant-primary)' }} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Cookie size={20} className="sm:hidden" style={{ color: 'var(--tenant-primary)' }} weight="duotone" />
                Usamos cookies
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
                Utilizamos cookies propias y de terceros (como Google Analytics y Meta Pixel) para entender cómo usas nuestro sitio y mejorar tu experiencia profesional.
                Al hacer clic en "Aceptar", consientes su uso. Puedes leer más en nuestra{' '}
                <a
                  href="/cookies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--tenant-primary)' }}
                >
                  Política de Cookies
                </a>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={handleDecline}
              className="flex-1 md:flex-none px-6 py-2.5 text-sm font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-all"
            >
              Rechazar
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 md:flex-none px-8 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] hover:opacity-90"
              style={{ backgroundColor: 'var(--tenant-primary)' }}
            >
              Aceptar
            </button>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
