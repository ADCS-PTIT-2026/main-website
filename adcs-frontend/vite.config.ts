import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    allowedHosts: ['0066-1-53-37-219.ngrok-free.app'],
    
    host: true, 
    port: 5173,
  }
})
