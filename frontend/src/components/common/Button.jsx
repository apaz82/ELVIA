export default function Button({ children, onClick, variant = 'primary', disabled = false, loading = false, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px]'
  const variants = {
    primary:   'bg-primary text-white hover:bg-blue-700 disabled:opacity-50',
    secondary: 'bg-secondary text-white hover:bg-violet-700 disabled:opacity-50',
    outline:   'border-2 border-primary text-primary hover:bg-blue-50 disabled:opacity-50',
    ghost:     'text-gray-600 hover:bg-gray-100 disabled:opacity-50',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]} ${className}`}>
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
