// Build Stamp: 2026-04-02_0930
console.log('City AI build: 2026-04-02_0930');
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { AppProvider } from './providers/AppProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
