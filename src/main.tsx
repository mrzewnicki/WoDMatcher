import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const base = import.meta.env.BASE_URL
const rootStyle = document.documentElement.style
rootStyle.setProperty(
  '--texture-plaster',
  `url(${base}textures/plaster-color.jpg)`,
)
rootStyle.setProperty(
  '--texture-scratches',
  `url(${base}textures/scratches-opacity.jpg)`,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
