import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from a subpath (/AI-Concept-Mashup-Generator/),
// whereas Vercel serves from the domain root. A build that emits absolute
// "/assets/..." URLs therefore 404s on Pages and renders a blank page, so the base
// is injected at build time by .github/workflows/deploy.yml and falls back to "/"
// for Vercel and local builds.
//
// Normalised here rather than in the workflow because actions/configure-pages
// reports base_path without a trailing slash ("/repo"), while Vite requires one,
// and a user/org site reports it as "/" where naive appending would yield "//".
const rawBase = process.env.BASE_PATH || '/'
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

// Without this config the declared @vitejs/plugin-react dependency was never
// loaded, so React Fast Refresh silently did not work in `npm run dev`.
export default defineConfig({
  base,
  plugins: [react()],
})
