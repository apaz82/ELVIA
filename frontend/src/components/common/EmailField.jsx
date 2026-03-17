// Campo de email para reenvío del CV optimizado
import { useState } from 'react'
import Button from './Button'

export default function EmailField({ cvId }) {
  const [email, setEmail] = useState('')
  const [formato, setFormato] = useState('pdf')
  const [estado, setEstado] = useState('idle') // idle | loading | ok | error

  const enviar = async () => {
    if (!email || !cvId) return
    setEstado('loading')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, cvId, format: formato }),
      })
      setEstado(res.ok ? 'ok' : 'error')
    } catch {
      setEstado('error')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <select
        value={formato}
        onChange={(e) => setFormato(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="pdf">PDF</option>
        <option value="word">Word</option>
      </select>
      <Button onClick={enviar} loading={estado === 'loading'} disabled={!email || !cvId}>
        Enviar
      </Button>
      {estado === 'ok' && <span className="text-sm text-green-600">✓ Enviado</span>}
      {estado === 'error' && <span className="text-sm text-red-600">Error al enviar</span>}
    </div>
  )
}
