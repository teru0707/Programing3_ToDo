import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// './App.css' は App.tsx内でimportしているので、index.cssがあればグローバルリセット用に残す
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)