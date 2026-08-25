import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Without this config the declared @vitejs/plugin-react dependency was never
// loaded, so React Fast Refresh silently did not work in `npm run dev`.
export default defineConfig({
  plugins: [react()],
})
