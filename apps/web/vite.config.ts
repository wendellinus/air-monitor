import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type ServerOptions } from 'vite';
import { fileURLToPath, URL } from 'node:url';

function resolveHttpsConfig(env: Record<string, string>): ServerOptions['https'] | undefined {
  const certPath = env.VITE_DEV_SSL_CERT_PATH;
  const keyPath = env.VITE_DEV_SSL_KEY_PATH;

  if (!certPath || !keyPath) return undefined;

  return {
    cert: readFileSync(certPath),
    key: readFileSync(keyPath),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';
  const https = resolveHttpsConfig(env);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      https,
      proxy: {
        // API is mounted at /api/v1, swagger at /api/docs, etc.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
