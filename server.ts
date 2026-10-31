import { createServer as createHttpServer } from 'http';
import type { AddressInfo } from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './server/api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
// `--production` keeps `npm start` working on Windows CMD, where the
// `NODE_ENV=production cmd` syntax does not exist.
const isProduction =
  process.env.NODE_ENV === 'production' || process.argv.includes('--production');

/**
 * Listen on `port`, falling forward to the next free port when the requested
 * one is already taken (EADDRINUSE). The other process is never killed.
 */
function listenWithPortFallback(
  server: ReturnType<typeof createHttpServer>,
  preferredPort: number,
  maxAttempts = 20,
): Promise<number> {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    const tryListen = () => {
      const candidate = preferredPort + attempt;
      const onError = (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && attempt < maxAttempts) {
          attempt += 1;
          server.removeListener('error', onError);
          tryListen();
        } else {
          reject(err);
        }
      };
      server.once('error', onError);
      server.listen(candidate, '0.0.0.0', () => {
        server.removeListener('error', onError);
        server.on('error', (error) => console.error('[JYNTRA AI] Server error:', error.name));
        const address = server.address() as AddressInfo | null;
        resolve(address?.port ?? candidate);
      });
    };
    tryListen();
  });
}

async function startServer() {
  const httpServer = createHttpServer(app);

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    // Optional API-only dev server (`npm run dev:api`). The normal
    // `npm run dev` launches Vite directly and mounts this same API app.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : true,
        ws: process.env.DISABLE_HMR === 'true' ? undefined : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const actualPort = await listenWithPortFallback(httpServer, PORT);
  console.log('');
  console.log('  ═══════════════════════════════════════════════════════');
  console.log(`  JYNTRA AI prêt — http://localhost:${actualPort}`);
  console.log(`  Mode : ${isProduction ? 'production (dist/)' : 'développement (API + Vite middleware)'}`);
  console.log('  ═══════════════════════════════════════════════════════');
  console.log('');

  const shutdown = () => {
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

process.on('unhandledRejection', (reason) => {
  console.error('[JYNTRA AI] Unhandled promise rejection:', reason instanceof Error ? reason.name : 'unknown');
});

startServer().catch((error) => {
  console.error('[JYNTRA AI] Échec du démarrage du serveur :', error instanceof Error ? error.name : 'unknown');
  process.exit(1);
});
