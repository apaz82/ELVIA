// Selector de idioma de salida del CV
export default function LanguageSelector({ value, onChange }) {
  const idiomas = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
  ]

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Idioma de salida:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Auto-detectar</option>
        {idiomas.map((i) => (
          <option key={i.code} value={i.code}>{i.label}</option>
        ))}
      </select>
    </div>
  )
}
