import { defineConfig } from 'vite'
// @ts-ignore: plugin types resolution can be environment-specific; use tsconfig.node.json for editor
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@engine': '/src/engine',
      '@game': '/src/game',
      '@components': '/src/engine/components',
      '@components$': '/src/engine/components/index.ts'
    }
  }
})
