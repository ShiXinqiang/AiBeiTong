import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Ensure API Key is available globally
  const defineEnv = {};
  if (process.env.API_KEY) {
    Object.assign(defineEnv, { 'process.env.API_KEY': JSON.stringify(process.env.API_KEY) });
  }

  return {
    // No framework plugins needed for Vanilla JS
    plugins: [],
    base: './',
    resolve: {
      alias: {
        '@': path.resolve((process as any).cwd(), './'),
      },
    },
    define: {
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    }
  };
});