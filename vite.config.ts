import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin, type Connect } from 'vite';

const configDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Mounts the real Express API (server/api.ts) inside the Vite dev and preview
 * servers. This keeps `npm run dev` a genuine Vite process (real VITE banner,
 * HMR, real URL) while /api/* still reaches the same backend used in
 * production. No proxy, no second process, no simulated server.
 */
function jyntraApiPlugin(): Plugin {
  let appPromise: Promise<any> | null = null;
  const getApp = () => {
    if (!appPromise) appPromise = import('./server/api.ts').then((m) => m.app);
    return appPromise;
  };
  const middleware = (req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
    if (!req.url || !req.url.startsWith('/api')) return next();
    getApp()
      .then((apiApp) => apiApp(req, res, next))
      .catch(() => {
        if (!res.headersSent) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, code: 'API_UNAVAILABLE', error: 'Service temporairement indisponible.' }));
        }
      });
  };

  return {
    name: 'jyntra-api-server',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), jyntraApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(configDir, '.'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    // HMR stays enabled unless explicitly disabled (AI Studio safety flag).
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
}));
