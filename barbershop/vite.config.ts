import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        // Injeta _variables.scss em TODOS os .module.scss
        // sem precisar importar manualmente em cada arquivo
        additionalData: `@use "@/assets/styles/variables" as *;`,
      },
    },
  },
})