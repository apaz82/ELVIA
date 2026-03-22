export default function Button({ children, onClick, variant = 'primary', disabled = false, loading = false, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center px-5 py-2.5 rounded-pill font-semibold text-sm transition-all duration-150 min-h-[44px] focus:outline-none'
  const variants = {
    primary:   'bg-primary text-white hover:bg-primary-dark shadow-glow-purple disabled:opacity-50',
    secondary: 'bg-white/10 text-white border border-line hover:bg-white/15 disabled:opacity-50',
    outline:   'border border-line text-muted hover:text-white hover:border-white/30 disabled:opacity-50',
    ghost:     'text-muted hover:text-white hover:bg-card2 disabled:opacity-50',
    danger:    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
