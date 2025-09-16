import { StrictMode } from 'react'
import './utils/fetchProxy'
import { API_URL } from './config'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ToastProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)

// Diagnóstico: loggear API_URL efectiva en runtime
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[SwapWeb] API_URL (runtime):', API_URL)

  // MEDIDA TEMPORAL: forzar desregistro de service workers previos
  // Esto ayuda a usuarios con builds viejos cacheados que apuntaban a localhost.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => {
        regs.forEach(reg => reg.unregister().catch(() => {}))
      })
      .catch(() => {})
  }
}
