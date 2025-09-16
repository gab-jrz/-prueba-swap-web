import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          react: ['react', 'react-dom', 'react-router-dom'],
          // UI Libraries
          ui: ['react-icons'],
          // Utils
          utils: ['axios'],
          // Pages - agrupar por funcionalidad
          auth: [
            './src/Pages/Login',
            './src/Pages/Register', 
            './src/Pages/ForgotPassword',
            './src/Pages/ResetPassword'
          ],
          profile: [
            './src/Pages/PerfilUsuario',
            './src/Pages/PerfilPublico',
            './src/Pages/Editar',
            './src/Pages/Configuracion'
          ],
          products: [
            './src/Pages/PublicarProducto',
            './src/Pages/EditarProducto',
            './src/Pages/DetalleProducto',
            './src/Pages/Intercambiar'
          ],
          donations: [
            './src/Pages/DonationsList',
            './src/Pages/DonationCreateNew',
            './src/Pages/DonationDetail',
            './src/Pages/ContactarDonador',
            './src/Pages/EditarDonacion'
          ],
          requests: [
            './src/Pages/RequestsList',
            './src/Pages/RequestCreateNew',
            './src/Pages/RequestDetail',
            './src/Pages/EditarSolicitud'
          ]
        }
      }
    },
    // Optimizaciones adicionales
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  // Optimizaciones de desarrollo
  server: {
    hmr: true
  },
  // Pre-bundling optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios']
  }
})
