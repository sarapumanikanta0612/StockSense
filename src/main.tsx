import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FrontendApp from './FrontendApp'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrontendApp />
  </StrictMode>,
)
