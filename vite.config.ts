import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载 .env 文件中的变量
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // 关键修复：GitHub Actions 的 Secrets 是系统环境变量，loadEnv 可能不会自动读取。
  // 我们手动检查并合并 API_KEY，确保发布后 API 可用。
  if (process.env.API_KEY) {
    env.API_KEY = process.env.API_KEY;
  }

  return {
    plugins: [react()],
    // 必须设置为相对路径 './'，否则在 GitHub Pages 子路径下会找不到资源
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './'),
      },
    },
    define: {
      // 将合并后的 env 对象注入到客户端代码中
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    }
  };
});