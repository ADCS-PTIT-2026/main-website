import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    allowedHosts: ['0805-103-238-68-82.ngrok-free.app'],
    
    host: true, 
    port: 5173,
  }
})
