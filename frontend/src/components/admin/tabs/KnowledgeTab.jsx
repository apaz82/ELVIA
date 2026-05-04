import React, { useState, useEffect } from 'react'
import * as PI from '@phosphor-icons/react'
import SectionHeading from '../shared/SectionHeading'
import { toast } from 'react-hot-toast'

const KnowledgeTab = ({ API_URL, db }) => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API_URL}/api/admin/knowledge/logs`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) setLogs(data)
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Selecciona un archivo primero.')
      return
    }

    setLoading(true)
    setProgress(20) 
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data: { session } } = await db.auth.getSession()
      const token = session?.access_token || ''

      setProgress(50)
      
      const res = await fetch(`${API_URL}/api/admin/knowledge/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      setProgress(90)
      
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir documento')
      }

      toast.success(data.message || 'Documento procesado con éxito.')
      setFile(null)
      if (document.getElementById('file-upload-input')) {
        document.getElementById('file-upload-input').value = ''
      }
      fetchLogs() 
      
    } catch (err) {
      console.error('Error subiendo documento:', err)
      toast.error(err.message)
    } finally {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 500)
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Formulario de Ingesta */}
          <div className="lg:col-span-1 space-y-8">
            <SectionHeading 
              title="Base de Conocimientos" 
              subtitle="Entrenamiento RAG"
              icon={PI.Brain}
            />

            <div className="bg-[#111827] rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative">
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="relative group border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-950/50 rounded-3xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]">
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
                    <PI.FilePdf size={32} className={file ? 'text-indigo-400' : 'text-slate-600'} weight="duotone" />
                  </div>
                  <p className="text-xs font-bold text-white mb-1">
                    {file ? file.name : 'Subir Documento'}
                  </p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                    {file ? formatSize(file.size) : 'PDF, TXT, MD'}
                  </p>
                </div>

                {progress > 0 && (
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3 italic text-[10px]"
                >
                  {loading ? <PI.CircleNotch size={16} className="animate-spin" /> : <PI.UploadSimple size={16} weight="bold" />}
                  {loading ? 'Procesando...' : 'Indexar en ELVIA'}
                </button>
              </form>
            </div>

            <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full" />
              <PI.Warning size={20} weight="duotone" className="text-amber-500 shrink-0" />
              <div className="relative z-10">
                 <h4 className="font-black text-amber-500 mb-1 uppercase italic tracking-widest text-[9px]">Límites de Ingesta</h4>
                 <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                   Límite: 10MB. Se generan "embeddings" en Gemini para cada fragmento de 1000 caracteres. Sube archivos concisos.
                 </p>
              </div>
            </div>
          </div>

          {/* Listado de Historial */}
          <div className="lg:col-span-2 space-y-8">
            <SectionHeading 
              title="Historial de Ingesta" 
              subtitle="Documentos activos en la IA"
              icon={PI.ClockCounterClockwise}
            />

            <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/30">
                      <th className="text-left py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Documento</th>
                      <th className="text-left py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Tamaño</th>
                      <th className="text-left py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Fragmentos</th>
                      <th className="text-left py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingLogs ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="4" className="py-6 px-8"><div className="h-4 bg-slate-800 rounded-lg w-full" /></td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-20 px-8 text-center">
                          <PI.Ghost size={40} className="mx-auto text-slate-700 mb-4" weight="duotone" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No hay documentos indexados</p>
                        </td>
                      </tr>
                    ) : logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/20 transition-colors group">
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
                              <PI.FileText size={18} weight="duotone" />
                            </div>
                            <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate max-w-[180px]">
                              {log.filename}
                            </span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {formatSize(log.file_size_bytes)}
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{log.total_chunks} chunks</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                          {new Date(log.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
       </div>
    </div>
  )
}

export default KnowledgeTab
