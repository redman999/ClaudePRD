import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// Self-hosted webfonts (no runtime Google Fonts request — Maersk-network friendly).
// Inter (UI) weights 400/500/600/700; Fira Code (mono) weight 400.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/fira-code/400.css'

import './index.css'

const container = document.getElementById('root')!
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
