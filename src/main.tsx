import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initCachedBrandColor } from './lib/colorExtractor'
import App from './App.tsx'

initCachedBrandColor()

// Globally prevent mouse/trackpad wheel scroll from incrementing or decrementing number inputs
if (typeof window !== 'undefined') {
  document.addEventListener(
    'wheel',
    () => {
      if (
        document.activeElement instanceof HTMLInputElement &&
        document.activeElement.type === 'number'
      ) {
        document.activeElement.blur()
      }
    },
    { passive: true }
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
