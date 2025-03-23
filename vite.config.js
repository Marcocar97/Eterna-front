import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "./", // ✔️ Muy importante si estás desplegando en el root del dominio
  plugins: [react()],
})

