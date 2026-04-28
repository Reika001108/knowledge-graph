import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 关键配置：代理
    port: 5173, // 前端端口
    open: true,
    proxy: {
      '/api': { // 拦截所有以 /api 开头的请求
        target: 'http://localhost:3001', // 转发到你的 Node.js 服务
        changeOrigin: true, // 改变请求源头，避免跨域问题
        //rewrite: (path) => path.replace(/^\/api/, '') // 可选：重写路径，如果后端不需要 /api 前缀可取消注释
      }
    }
  }
})
