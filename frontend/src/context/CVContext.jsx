// Estado global del CV — compartido entre Página 1, 2 y 3
import { createContext, useContext, useState } from 'react'

const CVContext = createContext(null)

export const CVProvider = ({ children }) => {
  const [cvArchivo, setCvArchivo] = useState(null)       // Archivo subido
  const [resultadoOptimize, setResultadoOptimize] = useState(null) // Resultado Página 1
  const [resultadoMatch, setResultadoMatch] = useState(null)       // Resultado Página 2

  const limpiar = () => {
    setCvArchivo(null)
    setResultadoOptimize(null)
    setResultadoMatch(null)
  }

  return (
    <CVContext.Provider value={{
      cvArchivo, setCvArchivo,
      resultadoOptimize, setResultadoOptimize,
      resultadoMatch, setResultadoMatch,
      limpiar,
    }}>
      {children}
    </CVContext.Provider>
  )
}

export const useCV = () => {
  const ctx = useContext(CVContext)
  if (!ctx) throw new Error('useCV debe usarse dentro de CVProvider')
  return ctx
}
