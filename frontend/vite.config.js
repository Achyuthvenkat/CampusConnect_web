import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/CampusConnect_web/',
  server: {
    port: 5173,
    host: true,
    headers: {
      'Content-Security-Policy': "default-src 'self' http://localhost:8080 https://ui-avatars.com; connect-src 'self' http://localhost:8080 https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseio.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://ui-avatars.com https://lh3.googleusercontent.com;",
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'no-referrer-when-downgrade',
      'Permissions-Policy': 'geolocation=()'
    },
    configureServer: (server) => {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Server', 'SecureServer');
        
        const allowedMethods = ['GET', 'POST', 'HEAD', 'OPTIONS'];
        if (!allowedMethods.includes(req.method)) {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        next();
      });
    }
  }
})
