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
        // 1. Aponta o caminho absoluto exato até o arquivo com underline
        additionalData: `@use "${path.resolve(__dirname, 'src/assets/styles/_variables.scss').replace(/\\/g, '/')}" as *;`,
        
        // 2. Garante que o Sass saiba olhar para dentro da sua pasta de estilos em qualquer nível de importação
        includePaths: [path.resolve(__dirname, 'src/assets/styles')],
      },
    },
  },
})