import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-router-dom': resolve(rootDir, 'src/routerShim.jsx'),
      axios: resolve(rootDir, 'src/axiosShim.js'),
    },
  },
})
