// Componente de subida de archivos con drag & drop
import { useRef, useState } from 'react'

const TIPOS_PERMITIDOS = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE_MB = 5

export default function FileUpload({ onFileSelect, archivoActual }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const validar = (file) => {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setError('Solo se aceptan archivos PDF, DOC o DOCX')
      return false
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo no debe superar ${MAX_SIZE_MB}MB`)
      return false
    }
    setError('')
    return true
  }

  const handleFile = (file) => {
    if (file && validar(file)) onFileSelect(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const formatSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

  return (
    <div>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200
          ${dragOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {archivoActual ? (
            <div className="text-sm">
              <p className="font-medium text-primary">{archivoActual.name}</p>
              <p className="text-gray-500">{formatSize(archivoActual.size)}</p>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700">Arrastra tu CV aquí</p>
              <p>o haz clic para seleccionar</p>
              <p className="text-xs mt-1">PDF, DOC o DOCX — máx. 5MB</p>
            </div>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  )
}
