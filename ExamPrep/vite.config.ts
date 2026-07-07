import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages are served from /<repo>/. Allow override via BASE_PATH for local/preview.
const base = process.env.BASE_PATH ?? '/ExamPrep/'

export default defineConfig({
  base,
  plugins: [react()],
})
