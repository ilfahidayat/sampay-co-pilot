import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5177,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true, // Mengizinkan akses dari alamat IP LAN, domain/hostname, ngrok, cloudflare tunnel, dll
    cors: true
  },
  preview: {
    port: 5177,
    host: '0.0.0.0',
    allowedHosts: true,
    cors: true
  }
})
