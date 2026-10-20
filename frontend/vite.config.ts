import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // prueba.html es una página aparte para verificar la app en un emulador o
      // en un celular: hace un recorrido real contra la API y muestra el resultado.
      input: {
        main: 'index.html',
        prueba: 'prueba.html',
      },
    },
  },
})
