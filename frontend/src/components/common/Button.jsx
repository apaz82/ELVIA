export default function Button({ children, onClick, variant = 'primary', disabled = false, loading = false, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center px-5 py-2.5 rounded-pill font-semibold text-sm transition-all duration-150 min-h-[44px] focus:outline-none'
  const variants = {
    primary:   'bg-primary text-white hover:bg-primary-dark shadow-md disabled:opacity-50',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50',
    outline:   'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 disabled:opacity-50',
    ghost:     'text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50',
    danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50',
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
