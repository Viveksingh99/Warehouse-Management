import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const resolvedApiBaseUrl = (
  process.env.VITE_API_BASE_URL ||
  process.env.API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/+$/, '');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(resolvedApiBaseUrl),
  },
  server: {
    host,
    port,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host,
    port,
    strictPort: true,
  },
});
