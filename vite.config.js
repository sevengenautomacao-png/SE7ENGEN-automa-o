import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        shop: resolve(__dirname, 'shop.html'),
        debug: resolve(__dirname, 'debug_connection.html')
      }
    }
  }
})
