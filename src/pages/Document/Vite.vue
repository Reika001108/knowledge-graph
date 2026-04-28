<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Vite 知识库</h1>
      </div>
      <div class="user-section">
        <div class="current-time">{{ currentTime }}</div>
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'">
          <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
        <div class="avatar-wrapper" ref="avatarWrapper">
          <div class="avatar" @click.stop="toggleDropdown">
            <i class="fas fa-user-circle"></i>
            <span class="username" v-if="userInfo">{{ displayName }}</span>
          </div>
          <div v-if="showDropdown" class="dropdown-menu">
            <a href="#" class="dropdown-item" @click.prevent="goToProfile">个人中心</a>
            <a href="#" class="dropdown-item" @click.prevent="logout">退出</a>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>⚡ <span class="gradient-text">Vite 完全指南</span></h2>
          <div class="header-decoration"></div>
        </div>

        <div class="nav-sections">
          <div v-for="section in navSections" :key="section.title" class="nav-section">
            <h3 class="section-title">
              {{ section.title }}
              <span class="section-count">{{ section.items.length }}</span>
            </h3>
            <a
              v-for="item in section.items"
              :key="item.id"
              :href="'#content-' + item.id"
              class="nav-item"
              :class="{ active: selectedId === item.id }"
              @click="selectedId = item.id"
            >
              <span class="item-dot"></span>
              {{ item.label }}
              <span v-if="item.hot" class="hot-badge">核心</span>
            </a>
          </div>
        </div>

        <div class="sidebar-footer">
          <p>⚡ 下一代前端构建工具</p>
          <p>✨ 点击节点双向联动 | 极速开发体验</p>
        </div>
      </aside>

      <section class="content-area" ref="contentAreaRef">
        <div class="continuous-content">
          <div
            v-for="item in allFlatItems"
            :key="item.id"
            :id="'content-' + item.id"
            class="content-block"
          >
            <div class="content-card" v-if="contentMap[item.id]">
              <div class="content-header">
                <h1 class="content-title">{{ contentMap[item.id].title }}</h1>
              </div>
              <div class="content-body" v-html="contentMap[item.id].body"></div>
              <div class="content-footer">
                <span class="tag-label">🏷️ 相关概念</span>
                <div class="tag-list">
                  <span class="tag" v-for="tag in contentMap[item.id].tags" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </div>
            <div v-else class="content-card placeholder">
              <h2>📖 {{ item.label }} 的详细文档正在同步中...</h2>
            </div>
          </div>
        </div>
      </section>

      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 Vite 知识图谱 <span class="graph-badge">ECharts</span></h3>
          <p class="graph-hint">点击节点跳转 · 拖拽缩放</p>
        </div>
        <div ref="chartRef" class="chart-container"></div>
        <div class="graph-footer">
          <span>⚡ 共 {{ graphNodes.length }} 节点 | {{ graphLinks.length }} 关联</span>
          <div class="graph-controls">
            <button class="control-btn" @click="zoomOut" title="缩小">
              <i class="fas fa-search-minus"></i>
            </button>
            <button class="control-btn" @click="fitToView" title="适应页面">
              <i class="fas fa-arrows-alt"></i>
            </button>
            <button class="control-btn" @click="zoomIn" title="放大">
              <i class="fas fa-search-plus"></i>
            </button>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

// ---------- 用户及主题相关 ----------
const showDropdown = ref(false)
const avatarWrapper = ref(null)
const userInfo = ref(null)
const currentTime = ref(new Date().toLocaleTimeString())
const isDark = ref(false)

const displayName = computed(() => {
  if (!userInfo.value) return ''
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Vite用户'
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
    nextTick(() => initChart())
  }
}

let timer = null
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString()
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false
  }
}

const goToProfile = () => {
  window.location.href = 'http://localhost:5173/person'
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user_info')
  showDropdown.value = false
  window.location.href = 'http://localhost:5173/'
}

// ========== Vite 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'vite-intro', label: 'Vite 简介', hot: true },
      { id: 'vite-install', label: '安装与创建项目', hot: true },
      { id: 'vite-vs-webpack', label: 'Vite vs Webpack', hot: true }
    ]},
  { title: '⚙️ 核心配置', items: [
      { id: 'vite-config', label: '配置文件', hot: true },
      { id: 'vite-plugins', label: '插件系统', hot: true },
      { id: 'vite-aliases', label: '路径别名', hot: true },
      { id: 'vite-env', label: '环境变量', hot: true }
    ]},
  { title: '🔧 开发服务器', items: [
      { id: 'vite-dev-server', label: '开发服务器', hot: true },
      { id: 'vite-hmr', label: '热模块替换', hot: true },
      { id: 'vite-proxy', label: '代理配置', hot: true },
      { id: 'vite-https', label: 'HTTPS 配置', hot: true }
    ]},
  { title: '📦 构建优化', items: [
      { id: 'vite-build', label: '生产构建', hot: true },
      { id: 'vite-optimization', label: '依赖预构建', hot: true },
      { id: 'vite-code-split', label: '代码分割', hot: true },
      { id: 'vite-tree-shaking', label: 'Tree Shaking', hot: true }
    ]},
  { title: '🎯 框架集成', items: [
      { id: 'vite-vue', label: 'Vue 集成', hot: true },
      { id: 'vite-react', label: 'React 集成', hot: true },
      { id: 'vite-svelte', label: 'Svelte 集成', hot: true },
      { id: 'vite-solid', label: 'Solid 集成', hot: true }
    ]},
  { title: '🚀 高级特性', items: [
      { id: 'vite-ssr', label: '服务端渲染', hot: true },
      { id: 'vite-mpa', label: '多页应用', hot: true },
      { id: 'vite-worker', label: 'Web Worker', hot: true },
      { id: 'vite-lib-mode', label: '库模式', hot: true }
    ]}
])

const selectedId = ref('vite-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Vite 内容映射表 ==========
const contentMap = {
  'vite-intro': {
    title: 'Vite 简介',
    body: '<p class="lead">Vite 是下一代前端构建工具，利用原生 ES Module 提供极快的开发服务器启动和热更新体验。</p><h3>核心特点</h3><ul><li><strong>极速启动</strong>：无需打包，直接启动开发服务器</li><li><strong>快速 HMR</strong>：热模块替换，保持页面状态</li><li><strong>丰富的插件</strong>：兼容 Rollup 插件生态</li><li><strong>优化构建</strong>：基于 Rollup 的生产构建</li><li><strong>框架无关</strong>：支持 Vue、React、Svelte 等</li></ul><div class="note">💡 Vite 由尤雨溪创建，是 Vue 团队官方推荐的构建工具。</div>',
    tags: ['构建工具', 'ES Module', '快速开发']
  },
  'vite-install': {
    title: '安装与创建项目',
    body: '<p class="lead">Vite 可以通过 npm 快速创建项目。</p><pre><code># 使用 npm\nnpm create vite@latest my-app\n\n# 使用 yarn\nyarn create vite my-app\n\n# 使用 pnpm\npnpm create vite my-app\n\n# 选择模板\n# - vanilla\n# - vanilla-ts\n# - vue\n# - vue-ts\n# - react\n# - react-ts\n# - svelte\n# - svelte-ts\n\n# 进入项目并安装依赖\ncd my-app\nnpm install\n\n# 启动开发服务器\nnpm run dev\n\n# 构建生产版本\nnpm run build\n\n# 预览构建结果\nnpm run preview</code></pre>',
    tags: ['安装', '创建项目', '脚手架']
  },
  'vite-vs-webpack': {
    title: 'Vite vs Webpack',
    body: '<p class="lead">Vite 和 Webpack 的对比。</p><table class="mdn-table"><thead><tr><th>特性</th><th>Vite</th><th>Webpack</th></tr></thead><tbody><tr><td>开发服务器启动</th><td>即时（按需编译）</th><td>慢（全量打包）</th></tr><tr><td>HMR 速度</th><td>极快</th><td>较慢</th></tr><tr><td>配置复杂度</th><td>简单</th><td>复杂</th></td><td>生产构建</th><td>Rollup（高效）</th><td>Webpack</th></td><td>插件生态</th><td>兼容 Rollup 插件</th><td>丰富</th></tr><td>学习曲线</th><td>平缓</th><td>陡峭</th></tr></tbody></table><pre><code>// Webpack 配置\nmodule.exports = {\n  entry: "./src/index.js",\n  output: { path: path.resolve(__dirname, "dist") },\n  module: { rules: [...] },\n  plugins: [...]\n}\n\n// Vite 配置\nexport default defineConfig({\n  plugins: [vue()],\n  server: { port: 3000 }\n})</code></pre>',
    tags: ['Webpack', '对比', '性能']
  },
  'vite-config': {
    title: '配置文件',
    body: '<p class="lead">Vite 配置文件 vite.config.js 支持 ESM 语法。</p><pre><code>// vite.config.js\nimport { defineConfig } from "vite"\nimport vue from "@vitejs/plugin-vue"\nimport path from "path"\n\nexport default defineConfig({\n  // 插件配置\n  plugins: [vue()],\n  \n  // 路径别名\n  resolve: {\n    alias: {\n      "@": path.resolve(__dirname, "./src"),\n      "@components": path.resolve(__dirname, "./src/components")\n    }\n  },\n  \n  // 开发服务器\n  server: {\n    port: 3000,\n    open: true,\n    cors: true\n  },\n  \n  // 构建配置\n  build: {\n    outDir: "dist",\n    assetsDir: "assets",\n    sourcemap: false,\n    minify: "terser",\n    rollupOptions: {\n      output: {\n        manualChunks: {\n          vendor: ["vue", "vue-router"]\n        }\n      }\n    }\n  },\n  \n  // CSS 配置\n  css: {\n    preprocessorOptions: {\n      scss: {\n        additionalData: `@import "@/styles/variables.scss";`\n      }\n    }\n  }\n})</code></pre>',
    tags: ['配置', 'vite.config.js', 'defineConfig']
  },
  'vite-plugins': {
    title: '插件系统',
    body: '<p class="lead">Vite 插件基于 Rollup 插件接口，提供额外的功能扩展。</p><pre><code>// 官方插件\nimport vue from "@vitejs/plugin-vue"\nimport react from "@vitejs/plugin-react"\nimport legacy from "@vitejs/plugin-legacy"\n\n// 社区插件\nimport eslint from "vite-plugin-eslint"\nimport svgr from "vite-plugin-svgr"\nimport { visualizer } from "rollup-plugin-visualizer"\nimport compression from "vite-plugin-compression"\n\n// 使用插件\nexport default defineConfig({\n  plugins: [\n    vue(),\n    eslint(),\n    svgr(),\n    visualizer({ open: true }),\n    compression({ algorithm: "gzip" })\n  ]\n})\n\n// 自定义插件\nfunction myPlugin() {\n  return {\n    name: "my-plugin",\n    transform(code, id) {\n      if (id.endsWith(".custom")) {\n        return { code: `export default ${JSON.stringify(code)}` }\n      }\n    }\n  }\n}</code></pre>',
    tags: ['插件', 'Rollup', '扩展']
  },
  'vite-aliases': {
    title: '路径别名',
    body: '<p class="lead">配置路径别名简化模块导入。</p><pre><code>// vite.config.js\nimport { defineConfig } from "vite"\nimport path from "path"\n\nexport default defineConfig({\n  resolve: {\n    alias: {\n      "@": path.resolve(__dirname, "./src"),\n      "@components": path.resolve(__dirname, "./src/components"),\n      "@views": path.resolve(__dirname, "./src/views"),\n      "@utils": path.resolve(__dirname, "./src/utils"),\n      "@api": path.resolve(__dirname, "./src/api"),\n      "@store": path.resolve(__dirname, "./src/store"),\n      "@assets": path.resolve(__dirname, "./src/assets"),\n      "@styles": path.resolve(__dirname, "./src/styles")\n    }\n  }\n})\n\n// tsconfig.json 同步配置\n{\n  "compilerOptions": {\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"],\n      "@components/*": ["./src/components/*"],\n      "@utils/*": ["./src/utils/*"]\n    }\n  }\n}\n\n// 使用别名\nimport Button from "@/components/Button.vue"\nimport { formatDate } from "@utils/format"</code></pre>',
    tags: ['路径别名', '@', 'alias']
  },
  'vite-env': {
    title: '环境变量',
    body: '<p class="lead">Vite 支持使用 .env 文件管理环境变量。</p><pre><code># .env 通用\nVITE_APP_TITLE=My App\n\n# .env.development 开发环境\nVITE_API_URL=http://localhost:8080/api\nVITE_APP_ENV=development\n\n# .env.production 生产环境\nVITE_API_URL=https://api.example.com/api\nVITE_APP_ENV=production\n\n// 在代码中使用\nconsole.log(import.meta.env.VITE_APP_TITLE)\nconsole.log(import.meta.env.VITE_API_URL)\nconsole.log(import.meta.env.MODE)\n\n// 在 vite.config.js 中使用\nexport default defineConfig(({ mode }) => {\n  const env = loadEnv(mode, process.cwd())\n  return {\n    define: {\n      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV)\n    }\n  }\n})\n\n// 条件编译\nif (import.meta.env.DEV) {\n  console.log("开发模式")\n}\nif (import.meta.env.PROD) {\n  console.log("生产模式")\n}</code></pre>',
    tags: ['环境变量', '.env', 'import.meta']
  },
  'vite-dev-server': {
    title: '开发服务器',
    body: '<p class="lead">Vite 开发服务器提供快速的开发体验。</p><pre><code>// vite.config.js\nexport default defineConfig({\n  server: {\n    port: 3000,              // 端口\n    host: "0.0.0.0",         // 监听所有地址\n    open: true,              // 自动打开浏览器\n    strictPort: false,       // 端口被占用时尝试下一个\n    cors: true,              // 启用 CORS\n    \n    // 热更新配置\n    hmr: {\n      overlay: true,         // 显示错误覆盖层\n      protocol: "ws",\n      timeout: 30000\n    },\n    \n    // 文件监听\n    watch: {\n      usePolling: false,\n      interval: 100\n    },\n    \n    // 中间件\n    middlewareMode: false,\n    \n    // 预加载\n    warmup: {\n      clientFiles: ["./src/main.js"]\n    }\n  }\n})</code></pre>',
    tags: ['开发服务器', 'dev server', 'HMR']
  },
  'vite-hmr': {
    title: '热模块替换',
    body: '<p class="lead">Vite 的 HMR 保持页面状态，快速更新修改的模块。</p><pre><code>// Vue HMR（自动支持）\n// 修改 Vue 组件会自动热更新\n\n// React HMR\nimport { hot } from "react-hot-loader/root"\nconst App = () => &lt;div&gt;Hello&lt;/div&gt;\nexport default hot(App)\n\n// 自定义 HMR\nif (import.meta.hot) {\n  import.meta.hot.accept((newModule) => {\n    console.log("模块已更新", newModule)\n  })\n  \n  import.meta.hot.accept(["./dep.js"], ([newDep]) => {\n    console.log("依赖已更新", newDep)\n  })\n  \n  import.meta.hot.dispose(() => {\n    console.log("模块即将被替换")\n    // 清理副作用\n  })\n  \n  import.meta.hot.invalidate()  // 强制重新加载\n}</code></pre>',
    tags: ['HMR', '热更新', '热模块替换']
  },
  'vite-proxy': {
    title: '代理配置',
    body: '<p class="lead">配置代理解决开发环境跨域问题。</p><pre><code>// vite.config.js\nexport default defineConfig({\n  server: {\n    proxy: {\n      // 字符串简写\n      "/foo": "http://localhost:4567",\n      \n      // 选项配置\n      "/api": {\n        target: "http://localhost:8080",\n        changeOrigin: true,\n        rewrite: (path) => path.replace(/^\\/api/, ""),\n        configure: (proxy, options) => {\n          proxy.on("error", (err, req, res) => {\n            console.log("proxy error", err)\n          })\n        }\n      },\n      \n      // 多个代理\n      "/user-api": {\n        target: "http://localhost:8081",\n        changeOrigin: true\n      },\n      \n      // WebSocket 代理\n      "/ws": {\n        target: "ws://localhost:3000",\n        ws: true\n      },\n      \n      // 正则匹配\n      "^/fallback/.*": {\n        target: "http://localhost:8080",\n        changeOrigin: true\n      }\n    }\n  }\n})</code></pre>',
    tags: ['代理', '跨域', 'proxy']
  },
  'vite-https': {
    title: 'HTTPS 配置',
    body: '<p class="lead">配置 HTTPS 开发服务器。</p><pre><code>// 使用自签名证书\nexport default defineConfig({\n  server: {\n    https: true\n  }\n})\n\n// 使用自定义证书\nimport fs from "fs"\n\nexport default defineConfig({\n  server: {\n    https: {\n      key: fs.readFileSync("./localhost-key.pem"),\n      cert: fs.readFileSync("./localhost.pem")\n    }\n  }\n})\n\n// 使用 @vitejs/plugin-basic-ssl\nimport basicSsl from "@vitejs/plugin-basic-ssl"\n\nexport default defineConfig({\n  plugins: [basicSsl()],\n  server: {\n    https: true\n  }\n})</code></pre>',
    tags: ['HTTPS', 'SSL', '证书']
  },
  'vite-build': {
    title: '生产构建',
    body: '<p class="lead">Vite 使用 Rollup 进行生产构建，优化输出。</p><pre><code>// vite.config.js\nexport default defineConfig({\n  build: {\n    outDir: "dist",              // 输出目录\n    assetsDir: "assets",         // 静态资源目录\n    assetsInlineLimit: 4096,     // 内联资源大小限制\n    sourcemap: false,            // 是否生成 sourcemap\n    minify: "terser",            // 压缩方式: esbuild, terser\n    target: "es2015",            // 目标环境\n    \n    rollupOptions: {\n      input: {\n        main: "index.html",\n        about: "about.html"\n      },\n      output: {\n        manualChunks: {\n          vendor: ["vue", "vue-router"],\n          ui: ["element-plus"]\n        }\n      },\n      external: ["lodash"]\n    },\n    \n    chunkSizeWarningLimit: 500,   // 块大小警告限制\n    commonjsOptions: {},\n    lib: {\n      entry: "src/index.js",\n      name: "MyLib",\n      formats: ["es", "umd"],\n      fileName: (format) => `my-lib.${format}.js`\n    },\n    \n    terserOptions: {\n      compress: {\n        drop_console: true,\n        drop_debugger: true\n      }\n    }\n  }\n})</code></pre>',
    tags: ['构建', '生产', 'Rollup']
  },
  'vite-optimization': {
    title: '依赖预构建',
    body: '<p class="lead">Vite 预构建依赖以优化开发体验。</p><pre><code>export default defineConfig({\n  optimizeDeps: {\n    // 强制预构建的依赖\n    include: ["lodash-es", "axios"],\n    \n    // 排除预构建的依赖\n    exclude: ["my-custom-dep"],\n    \n    // 自定义 esbuild 选项\n    esbuildOptions: {\n      target: "es2020",\n      treeShaking: true\n    },\n    \n    // 禁用预构建\n    disabled: false\n  },\n  \n  // 缓存配置\n  cacheDir: "node_modules/.vite"\n})</code></pre>',
    tags: ['预构建', '依赖优化', 'esbuild']
  },
  'vite-code-split': {
    title: '代码分割',
    body: '<p class="lead">Vite 支持多种代码分割策略。</p><pre><code>// 动态导入（自动代码分割）\nconst AdminModule = () => import("./admin/AdminModule.vue")\nconst UserModule = () => import("./user/UserModule.vue")\n\n// 路由懒加载\nconst routes = [\n  {\n    path: "/admin",\n    component: () => import("./views/Admin.vue")\n  },\n  {\n    path: "/user",\n    component: () => import("./views/User.vue")\n  }\n]\n\n// 手动分割\n// vite.config.js\nexport default defineConfig({\n  build: {\n    rollupOptions: {\n      output: {\n        manualChunks: {\n          "vendor-react": ["react", "react-dom"],\n          "vendor-vue": ["vue", "vue-router"],\n          "utils": ["lodash-es", "dayjs"]\n        }\n      }\n    }\n  }\n})\n\n// 使用 magic comment\nconst module = await import(\n  /* webpackChunkName: "my-chunk" */\n  "./module.js"\n)</code></pre>',
    tags: ['代码分割', '懒加载', 'dynamic import']
  },
  'vite-tree-shaking': {
    title: 'Tree Shaking',
    body: '<p class="lead">Vite 利用 ES Module 进行 Tree Shaking，移除未使用代码。</p><pre><code>// 使用具名导入（支持 Tree Shaking）\nimport { debounce, throttle } from "lodash-es"\n\n// 避免默认导入\nimport _ from "lodash-es"  // 会导入整个库\n\n// package.json 配置 sideEffects\n{\n  "sideEffects": false  // 无副作用，可安全 Tree Shaking\n}\n\n// 或指定有副作用的文件\n{\n  "sideEffects": ["*.css", "*.scss"]\n}\n\n// 确保使用 ES Module 版本\n// 正确\nimport { debounce } from "lodash-es"\n\n// 错误（无法 Tree Shaking）\nimport debounce from "lodash/debounce"</code></pre>',
    tags: ['Tree Shaking', '优化', 'ES Module']
  },
  'vite-vue': {
    title: 'Vue 集成',
    body: '<p class="lead">Vite 对 Vue 提供一流的支持。</p><pre><code>// 安装 Vue 插件\nnpm install @vitejs/plugin-vue\n\n// vite.config.js\nimport { defineConfig } from "vite"\nimport vue from "@vitejs/plugin-vue"\n\nexport default defineConfig({\n  plugins: [vue({\n    template: {\n      compilerOptions: {\n        isCustomElement: (tag) => tag.startsWith("my-")\n      }\n    },\n    script: {\n      defineModel: true\n    }\n  })]\n})\n\n// Vue 3 + TypeScript 模板\nnpm create vite@latest my-vue-app -- --template vue-ts\n\n// Vue JSX 支持\nimport vueJsx from "@vitejs/plugin-vue-jsx"\n\nplugins: [vue(), vueJsx()]</code></pre>',
    tags: ['Vue', '插件', '@vitejs/plugin-vue']
  },
  'vite-react': {
    title: 'React 集成',
    body: '<p class="lead">Vite 对 React 提供出色的支持。</p><pre><code>// 安装 React 插件\nnpm install @vitejs/plugin-react\n\n// vite.config.js\nimport { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\n\nexport default defineConfig({\n  plugins: [react({\n    babel: {\n      plugins: [["babel-plugin-styled-components", { displayName: true }]]\n    },\n    jsxRuntime: "automatic",\n    fastRefresh: true\n  })]\n})\n\n// React + TypeScript 模板\nnpm create vite@latest my-react-app -- --template react-ts\n\n// 使用 SWC 加速\nimport react from "@vitejs/plugin-react-swc"\n\nexport default defineConfig({\n  plugins: [react()]\n})</code></pre>',
    tags: ['React', '插件', '@vitejs/plugin-react']
  },
  'vite-svelte': {
    title: 'Svelte 集成',
    body: '<p class="lead">Vite 支持 Svelte 框架。</p><pre><code>// 安装 Svelte 插件\nnpm install @sveltejs/vite-plugin-svelte\n\n// vite.config.js\nimport { defineConfig } from "vite"\nimport { svelte } from "@sveltejs/vite-plugin-svelte"\n\nexport default defineConfig({\n  plugins: [svelte()]\n})\n\n// Svelte + TypeScript 模板\nnpm create vite@latest my-svelte-app -- --template svelte-ts</code></pre>',
    tags: ['Svelte', '插件', '@sveltejs/vite-plugin-svelte']
  },
  'vite-solid': {
    title: 'Solid 集成',
    body: '<p class="lead">Vite 支持 Solid 框架。</p><pre><code>// 安装 Solid 插件\nnpm install vite-plugin-solid\n\n// vite.config.js\nimport { defineConfig } from "vite"\nimport solid from "vite-plugin-solid"\n\nexport default defineConfig({\n  plugins: [solid()]\n})\n\n// Solid + TypeScript 模板\nnpm create vite@latest my-solid-app -- --template solid-ts</code></pre>',
    tags: ['Solid', '插件', 'vite-plugin-solid']
  },
  'vite-ssr': {
    title: '服务端渲染',
    body: '<p class="lead">Vite 支持服务端渲染（SSR）。</p><pre><code>// 使用 @vitejs/plugin-vue 和 SSR\nimport { createServer } from "vite"\n\nconst vite = await createServer({\n  server: { middlewareMode: true },\n  appType: "custom"\n})\n\n// 渲染函数\nasync function render(url, manifest) {\n  const { render } = await vite.ssrLoadModule("/src/entry-server.js")\n  const appHtml = await render(url)\n  return `&lt;html&gt;&lt;body&gt;${appHtml}&lt;/body&gt;&lt;/html&gt;`\n}\n\n// Nuxt/Vite 集成\n// 使用 Nuxt 3 或 Nuxt Bridge\n\n// 使用 SSR 框架\n// - Nuxt 3 (Vue)\n// - Next.js (React)\n// - SvelteKit (Svelte)</code></pre>',
    tags: ['SSR', '服务端渲染', 'Nuxt']
  },
  'vite-mpa': {
    title: '多页应用',
    body: '<p class="lead">Vite 支持多页应用配置。</p><pre><code>// 项目结构\n// ├── index.html\n// ├── about.html\n// └── src/\n//     ├── main.js\n//     └── about.js\n\n// vite.config.js\nimport { defineConfig } from "vite"\nimport { resolve } from "path"\n\nexport default defineConfig({\n  build: {\n    rollupOptions: {\n      input: {\n        main: resolve(__dirname, "index.html"),\n        about: resolve(__dirname, "about.html")\n      }\n    }\n  }\n})\n\n// 动态多页\nimport fs from "fs"\nconst pages = fs.readdirSync("./src/pages").map(page => \n  resolve(__dirname, `src/pages/${page}/index.html`)\n)\n\nexport default defineConfig({\n  build: {\n    rollupOptions: {\n      input: Object.fromEntries(\n        pages.map(page => [path.basename(path.dirname(page)), page])\n      )\n    }\n  }\n})</code></pre>',
    tags: ['MPA', '多页应用', '配置']
  },
  'vite-worker': {
    title: 'Web Worker',
    body: '<p class="lead">Vite 支持 Web Worker 开箱即用。</p><pre><code>// 导入 Worker\nimport MyWorker from "./worker?worker"\n\nconst worker = new MyWorker()\nworker.postMessage("Hello")\nworker.onmessage = (e) => console.log(e.data)\n\n// 共享 Worker\nimport SharedWorker from "./shared-worker?sharedworker"\nconst sharedWorker = new SharedWorker()\n\n// 内联 Worker\nconst worker = new Worker(\n  new URL("./worker.js", import.meta.url),\n  { type: "module" }\n)\n\n// worker.js\nself.onmessage = (e) => {\n  console.log("收到消息:", e.data)\n  self.postMessage("回复消息")\n}</code></pre>',
    tags: ['Web Worker', '多线程', 'SharedWorker']
  },
  'vite-lib-mode': {
    title: '库模式',
    body: '<p class="lead">Vite 支持构建 JavaScript 库。</p><pre><code>// vite.config.js\nimport { defineConfig } from "vite"\nimport { resolve } from "path"\n\nexport default defineConfig({\n  build: {\n    lib: {\n      entry: resolve(__dirname, "src/index.js"),\n      name: "MyLibrary",\n      fileName: (format) => `my-library.${format}.js`,\n      formats: ["es", "umd", "cjs"]\n    },\n    rollupOptions: {\n      external: ["vue"],\n      output: {\n        globals: {\n          vue: "Vue"\n        }\n      }\n    }\n  }\n})\n\n// package.json\n{\n  "name": "my-library",\n  "main": "./dist/my-library.umd.js",\n  "module": "./dist/my-library.es.js",\n  "exports": {\n    ".": {\n      "import": "./dist/my-library.es.js",\n      "require": "./dist/my-library.umd.js"\n    }\n  }\n}</code></pre>',
    tags: ['库模式', '打包', '发布']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Vite 官方文档获取更多信息。</p>',
        tags: ['Vite', '构建工具']
      }
    }
  })
})

// ========== 图谱数据 ==========
const graphNodes = ref(
  navSections.value.flatMap((section, idx) =>
    section.items.map(item => ({
      id: item.id,
      name: item.label,
      category: idx
    }))
  )
)

const graphLinks = ref([])

const addLink = (source, target) => {
  if (source && target && graphNodes.value.some(n => n.id === source) && graphNodes.value.some(n => n.id === target)) {
    graphLinks.value.push({ source, target })
  }
}

addLink('vite-intro', 'vite-install')
addLink('vite-install', 'vite-vs-webpack')
addLink('vite-config', 'vite-plugins')
addLink('vite-plugins', 'vite-aliases')
addLink('vite-aliases', 'vite-env')
addLink('vite-dev-server', 'vite-hmr')
addLink('vite-hmr', 'vite-proxy')
addLink('vite-proxy', 'vite-https')
addLink('vite-build', 'vite-optimization')
addLink('vite-optimization', 'vite-code-split')
addLink('vite-code-split', 'vite-tree-shaking')
addLink('vite-vue', 'vite-react')
addLink('vite-react', 'vite-svelte')
addLink('vite-svelte', 'vite-solid')
addLink('vite-ssr', 'vite-mpa')
addLink('vite-mpa', 'vite-worker')
addLink('vite-worker', 'vite-lib-mode')

graphLinks.value = graphLinks.value.filter((link, index, self) =>
  index === self.findIndex(l => l.source === link.source && l.target === link.target)
)

const categories = ref(navSections.value.map(s => ({ name: s.title })))

// ========== ECharts 实例化 ==========
const chartRef = ref(null)
let chartInstance = ref(null)

const initChart = () => {
  if (!chartRef.value) return
  if (chartInstance.value) chartInstance.value.dispose()
  chartInstance.value = echarts.init(chartRef.value, isDark.value ? 'dark' : null)
  const option = {
    title: { show: false },
    tooltip: { show: true, formatter: (params) => params.name },
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      data: graphNodes.value.map(node => ({
        id: node.id,
        name: node.name,
        category: node.category,
        symbolSize: 28,
        itemStyle: { color: isDark.value ? '#8B5CF6' : '#007acc' }
      })),
      links: graphLinks.value,
      categories: categories.value,
      lineStyle: { color: 'source', curveness: 0.3, width: 1.8 },
      force: { repulsion: 400, edgeLength: 130, gravity: 0.1 },
      label: { show: true, position: 'bottom', fontSize: 10, color: isDark.value ? '#e0e0e0' : '#333' },
      emphasis: { focus: 'adjacency' }
    }]
  }
  chartInstance.value.setOption(option)
  chartInstance.value.on('click', { seriesIndex: 0 }, (params) => {
    if (params.dataType === 'node') {
      const nodeId = params.data.id
      if (nodeId && contentMap[nodeId]) {
        selectedId.value = nodeId
        const targetEl = document.getElementById('content-' + nodeId)
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' })
      }
    }
  })
}

const zoomIn = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomIn' }) }
const zoomOut = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomOut' }) }
const fitToView = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphRoam', roam: 'reset' }) }

const contentAreaRef = ref(null)
let scrollHandler = null

const updateActiveOnScroll = () => {
  if (!contentAreaRef.value) return
  const blocks = contentAreaRef.value.querySelectorAll('.content-block')
  let bestBlock = null, maxVisible = 0
  const areaRect = contentAreaRef.value.getBoundingClientRect()
  blocks.forEach(block => {
    const rect = block.getBoundingClientRect()
    const visibleTop = Math.max(rect.top, areaRect.top)
    const visibleBottom = Math.min(rect.bottom, areaRect.bottom)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)
    if (visibleHeight > maxVisible) {
      maxVisible = visibleHeight
      bestBlock = block
    }
  })
  if (bestBlock) {
    const id = bestBlock.id.replace('content-', '')
    if (id !== selectedId.value) selectedId.value = id
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  // 模拟用户登录
  const token = localStorage.getItem('authToken');
  if (!token) {
    userInfo.value = { username: '测试用户', email: 'test@example.com' };
  } else {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('user_info'));
    } catch (e) {}
  }

  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
  nextTick(() => {
    initChart();
    // 初始化滚动监听
    if (contentAreaRef.value) {
      scrollHandler = updateActiveOnScroll;
      contentAreaRef.value.addEventListener('scroll', scrollHandler);
      // 初始触发一次
      updateActiveOnScroll();
    }
    // 如果URL有hash，滚动到对应位置（例如从外部链接进入）
    if (window.location.hash) {
      const id = window.location.hash.substring(1); // 去掉 '#'
      const target = document.getElementById(id);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      // 默认滚动到 doctype
      const defaultTarget = document.getElementById('content-doctype');
      if (defaultTarget) {
        defaultTarget.scrollIntoView();
      }
    }
  });

  window.addEventListener('resize', () => chartInstance.value?.resize());
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('click', handleClickOutside)
  if (contentAreaRef.value && scrollHandler) contentAreaRef.value.removeEventListener('scroll', scrollHandler)
  if (chartInstance.value) chartInstance.value.dispose()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #FAF5FF;
  transition: background-color 0.3s, color 0.3s;
}

.app-container.dark {
  background-color: #1e1e2f;
  color: #e0e0e0;
}

.header {
  width: 100%;
  height: 10vh;
  background-color: #8B5CF6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
  z-index: 1000;
  transition: background-color 0.3s;
}

.app-container.dark .header {
  background-color: #2c2c3a;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 50px;
  margin-right: 15px;
  border-radius: 8px;
}

.app-title {
  color: white;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.current-time {
  color: white;
  font-size: 16px;
  background-color: rgba(255,255,255,0.2);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.theme-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  background-color: rgba(255,255,255,0.2);
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  font-size: 40px;
  color: white;
  transition: color 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar .username {
  font-size: 14px;
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.avatar:hover {
  color: #f0f0f0;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 50px;
  width: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  overflow: hidden;
  z-index: 1001;
  animation: fadeIn 0.2s ease;
}

.app-container.dark .dropdown-menu {
  background-color: #2c2c3a;
  color: #e0e0e0;
}

.dropdown-item {
  display: block;
  padding: 12px 20px;
  color: #333;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
  color: #8B5CF6;
}

.app-container.dark .dropdown-item {
  color: #e0e0e0;
}

.app-container.dark .dropdown-item:hover {
  background-color: #3a3a4a;
  color: #8B5CF6;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 40, 80, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 4px 0 20px rgba(0,20,40,0.05);
  transition: background-color 0.3s;
}

.app-container.dark .sidebar {
  background: rgba(44,44,58,0.7);
  border-right-color: rgba(255,255,255,0.1);
}

.sidebar-header {
  padding: 24px 20px 16px;
  position: relative;
}

.sidebar-header h2 {
  margin: 0 0 4px;
  font-size: 1.8rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.gradient-text {
  background: linear-gradient(135deg, #1a3650, #2b6c9e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-container.dark .gradient-text {
  background: linear-gradient(135deg, #a0c4e5, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-decoration {
  height: 4px;
  width: 60px;
  background: linear-gradient(90deg, #007acc, #a0c4e5);
  border-radius: 4px;
  margin-top: 12px;
}

.nav-sections {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 16px;
  scrollbar-width: thin;
}

.nav-section {
  margin-bottom: 16px;
}

.section-title {
  padding: 0 20px;
  margin: 0 0 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #2c5779;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-container.dark .section-title {
  color: #b0b0c0;
}

.section-count {
  background: rgba(0,122,204,0.1);
  color: #007acc;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.app-container.dark .section-count {
  background: rgba(139,92,246,0.2);
  color: #8B5CF6;
}

.nav-item {
  display: block;
  padding: 8px 20px 8px 36px;
  font-size: 0.94rem;
  cursor: pointer;
  color: #1e2a3a;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
  text-decoration: none;
  position: relative;
}

.app-container.dark .nav-item {
  color: #e0e0e0;
}

.nav-item:hover {
  background: rgba(0,122,204,0.06);
  border-left-color: #80b5dc;
}

.app-container.dark .nav-item:hover {
  background: rgba(139,92,246,0.15);
  border-left-color: #8B5CF6;
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(0,122,204,0.12) 0%, rgba(255,255,255,0) 90%);
  border-left-color: #007acc;
  font-weight: 550;
  color: #00548b;
}

.app-container.dark .nav-item.active {
  background: linear-gradient(90deg, rgba(139,92,246,0.2) 0%, transparent 90%);
  border-left-color: #8B5CF6;
  color: #c0a0ff;
}

.item-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #8faec9;
  border-radius: 50%;
  margin-right: 8px;
  transition: all 0.2s;
}

.app-container.dark .item-dot {
  background: #a0a0c0;
}

.nav-item.active .item-dot {
  background: #007acc;
  transform: scale(1.4);
  box-shadow: 0 0 0 2px rgba(0,122,204,0.2);
}

.app-container.dark .nav-item.active .item-dot {
  background: #8B5CF6;
  box-shadow: 0 0 0 2px rgba(139,92,246,0.4);
}

.hot-badge {
  background: #ff984f;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 30px;
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  float: right;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(0,40,80,0.1);
  font-size: 0.75rem;
  color: #556c80;
  display: flex;
  justify-content: space-between;
  background: rgba(255,255,255,0.4);
}

.app-container.dark .sidebar-footer {
  border-top-color: rgba(255,255,255,0.1);
  color: #aaa;
  background: rgba(58,58,74,0.4);
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 28px 36px;
  background: #ffffff;
  scroll-behavior: smooth;
}

.continuous-content {
  max-width: 1000px;
  margin: 0 auto;
}

.content-block {
  margin-bottom: 40px;
  scroll-margin-top: 20px;
  padding: 0 20px;
}

.content-block:not(:last-child) {
  border-bottom: 1px solid rgba(0, 40, 80, 0.1);
  padding-bottom: 40px;
}

.app-container.dark .content-block:not(:last-child) {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.app-container.dark .content-area {
  background: #1e1e2f;
}

.content-card {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  border: none;
  padding: 0;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(0, 122, 204, 0.2);
  padding-bottom: 12px;
}

.content-title {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 600;
  background: linear-gradient(145deg, #162b3a, #1f4970);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.app-container.dark .content-title {
  background: linear-gradient(145deg, #e0e0e0, #b0b0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.content-body {
  line-height: 1.7;
  font-size: 1.02rem;
  color: #1e2f3c;
}

.app-container.dark .content-body {
  color: #d0d0e0;
}

.content-body h3 {
  margin: 32px 0 16px;
  font-size: 1.5rem;
  font-weight: 550;
  color: #1e3a5f;
}

.app-container.dark .content-body h3 {
  color: #b0b0ff;
}

.content-body code {
  background: #e7edf4;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: monospace;
  font-size: 0.9em;
  color: #c4125e;
  border: 1px solid #d5dee7;
}

.app-container.dark .content-body code {
  background: #3a3a4a;
  color: #ffa0a0;
  border-color: #5a5a6a;
}

.content-body pre {
  background: #1e2a3a;
  color: #e3eaf0;
  border-radius: 18px;
  padding: 20px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 28px 0;
  box-shadow: inset 0 0 0 1px #33475b, 0 8px 16px -8px #00000030;
}

.content-body pre code {
  background: transparent;
  padding: 0;
  color: #c9dff2;
  border: none;
}

.lead {
  font-size: 1.25rem;
  font-weight: 380;
  color: #2a4359;
  border-left: 5px solid #007acc;
  padding-left: 24px;
  margin: 0 0 28px;
  background: linear-gradient(90deg, #e3f0fc, transparent);
}

.app-container.dark .lead {
  color: #c0d0e0;
  border-left-color: #8B5CF6;
  background: linear-gradient(90deg, rgba(139,92,246,0.2), transparent);
}

.note {
  background: #eef6ff;
  border-left: 5px solid #007acc;
  padding: 18px 24px;
  margin: 30px 0;
  border-radius: 0 24px 24px 0;
  box-shadow: 0 4px 10px -6px #a0b8d0;
}

.app-container.dark .note {
  background: #3a3a4a;
  border-left-color: #8B5CF6;
}

.content-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px dashed #cbd6e3;
}

.app-container.dark .content-footer {
  border-top-color: #5a5a6a;
}

.tag-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2b4f6e;
  margin-right: 12px;
}

.app-container.dark .tag-label {
  color: #b0b0ff;
}

.tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag {
  background: #eef3f9;
  padding: 4px 14px;
  border-radius: 30px;
  font-size: 0.8rem;
  color: #1c4970;
  border: 1px solid #d0e0f0;
}

.app-container.dark .tag {
  background: #3a3a4a;
  color: #d0d0e0;
  border-color: #5a5a6a;
}

.content-card.placeholder {
  text-align: center;
  color: #7f8fa4;
  padding: 60px;
}

.graph-panel {
  width: 340px;
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(8px);
  border-left: 1px solid rgba(0,40,80,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 20px rgba(0,20,40,0.03);
  transition: background-color 0.3s;
}

.app-container.dark .graph-panel {
  background: rgba(44,44,58,0.5);
  border-left-color: rgba(255,255,255,0.1);
}

.graph-header {
  padding: 24px 18px 12px;
  border-bottom: 1px solid rgba(0,40,80,0.1);
}

.app-container.dark .graph-header {
  border-bottom-color: rgba(255,255,255,0.1);
}

.graph-header h3 {
  margin: 0 0 4px;
  font-size: 1.2rem;
  font-weight: 650;
  color: #1a3b55;
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-container.dark .graph-header h3 {
  color: #e0e0e0;
}

.graph-badge {
  background: #1f4a74;
  color: white;
  font-size: 0.6rem;
  padding: 2px 8px;
  border-radius: 40px;
  font-weight: 500;
}

.app-container.dark .graph-badge {
  background: #8B5CF6;
}

.graph-hint {
  margin: 0;
  font-size: 0.75rem;
  color: #4b6a88;
}

.app-container.dark .graph-hint {
  color: #aaa;
}

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 240px;
  background: #fafdff;
  border-radius: 0;
}

.app-container.dark .chart-container {
  background: #2c2c3a;
}

.graph-footer {
  padding: 14px 16px;
  border-top: 1px solid rgba(0,40,80,0.1);
  font-size: 0.75rem;
  color: #3b5a78;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.5);
}

.app-container.dark .graph-footer {
  border-top-color: rgba(255,255,255,0.1);
  color: #aaa;
  background: rgba(58,58,74,0.5);
}

.graph-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #8B5CF6;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(139, 92, 246, 0.3);
}

.control-btn:hover {
  background: #A78BFA;
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}
</style>

<style>
@import '../fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
.mdn-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  border: 1px solid rgba(0,40,80,0.1);
}
.mdn-table th {
  background: rgba(139, 92, 246, 0.1);
  font-weight: 600;
  text-align: left;
  padding: 10px 12px;
}
.mdn-table td {
  padding: 10px 12px;
  border-top: 1px solid rgba(0,40,80,0.05);
}
</style>