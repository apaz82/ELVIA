import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { AuthProvider } from './context/AuthContext'
import { CVProvider } from './context/CVContext'
import App from './App'
import './index.css'

// Sentry solo se activa si hay DSN configurado (no en desarrollo sin variable)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Muestreo conservador para no agotar cuota gratuita
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Ignora errores de extensiones del browser (no son del producto)
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CVProvider>
          <App />
        </CVProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
