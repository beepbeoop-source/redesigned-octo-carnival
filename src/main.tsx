import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initCachedBrandColor } from './lib/colorExtractor'
import App from './App.tsx'

initCachedBrandColor()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
