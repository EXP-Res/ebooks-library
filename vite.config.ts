import { createHash } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const supportedAsset = /\.(pdf|epub|txt|md|markdown|jpe?g|png|webp|gif|svg)$/i;
const appDirectories = new Set(['src', 'public', 'scripts', 'node_modules', 'dist', '.git', '.github']);

function localBooksPlugin(root: string): Plugin {
  return {
    name: 'serve-root-books',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const rawPath = request.url?.split('?')[0] ?? '';
        if (!rawPath.startsWith('/books/')) return next();

        try {
          const relative = decodeURIComponent(rawPath.slice('/books/'.length));
          const segments = relative.split('/').filter(Boolean);
          if (!segments.length || segments.some((segment) => segment === '..') || appDirectories.has(segments[0])) return next();
          const file = path.resolve(root, ...segments);
          if (!file.startsWith(`${root}${path.sep}`) || !supportedAsset.test(file) || !existsSync(file) || !statSync(file).isFile()) return next();
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
