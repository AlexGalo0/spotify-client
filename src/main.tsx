import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import PWAInstallPrompt from './components/PWAInstallPrompt.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <PWAInstallPrompt />
    </BrowserRouter>
  </StrictMode>,
)
