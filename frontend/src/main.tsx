import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: cachea la app para poder abrirla sin conexión. En desarrollo queda apagado.
// En el APK los archivos ya viajan adentro, así que no hace falta el service worker.
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Si el registro falla la app sigue funcionando online, solo se pierde el modo offline
    })
  })
}
