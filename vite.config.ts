import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages: https://mrzewnicki.github.io/WoDMatcher/
// Local: http://localhost:5173/WoDMatcher/
export default defineConfig({
  plugins: [react()],
  base: '/WoDMatcher/',
})
