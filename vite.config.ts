import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 必须设置为相对路径 './'，否则在 GitHub Pages 子路径下会找不到资源
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保构建时清空旧文件
    emptyOutDir: true,
  }
});