import { createHash } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const supportedAsset = /\.(pdf|epub|txt|md|markdown|jpe?g|png|webp|gif|svg)$/i;
function localBooksPlugin(root: string): Plugin {
  const ebookRoot = path.resolve(root, 'ebooks');
  return {
    name: 'serve-local-ebooks',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const rawPath = request.url?.split('?')[0] ?? '';
        if (!rawPath.startsWith('/books/')) return next();

        try {
          const relative = decodeURIComponent(rawPath.slice('/books/'.length));
          const segments = relative.split('/').filter(Boolean);
          if (!segments.length || segments.some((segment) => segment === '..')) return next();
          const file = path.resolve(ebookRoot, ...segments);
          if (!file.startsWith(`${ebookRoot}${path.sep}`) || !supportedAsset.test(file) || !existsSync(file) || !statSync(file).isFile()) return next();
          createReadStream(file).pipe(response);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const passwordHash = env.ACCESS_PASSWORD_HASH || (env.ACCESS_PASSWORD ? createHash('sha256').update(env.ACCESS_PASSWORD).digest('hex') : '');
  const sessionHours = Number(env.ACCESS_SESSION_HOURS || 168);

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), localBooksPlugin(process.cwd())],
    define: {
      __ACCESS_PASSWORD_HASH__: JSON.stringify(passwordHash),
      __ACCESS_SESSION_HOURS__: JSON.stringify(Number.isFinite(sessionHours) ? sessionHours : 168),
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
  };
});
