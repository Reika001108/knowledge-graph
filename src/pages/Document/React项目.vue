<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">React 项目开发知识库</h1>
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
          <h2>⚛️ <span class="gradient-text">React 项目开发完全指南</span></h2>
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
          <p>⚛️ 从零到一掌握 React 项目开发</p>
          <p>✨ 点击节点双向联动 | 实战指南</p>
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
          <h3>🔗 React 项目开发知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'React开发者'
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

// ========== React 项目开发导航数据 ==========
const navSections = ref([
  { title: '🚀 项目初始化', items: [
      { id: 'react-project-init', label: '项目创建', hot: true },
      { id: 'react-project-structure', label: '项目结构', hot: true },
      { id: 'react-config', label: '配置文件', hot: true },
      { id: 'react-env', label: '环境变量', hot: true }
    ]},
  { title: '📁 目录与模块', items: [
      { id: 'react-src-structure', label: 'src 目录组织', hot: true },
      { id: 'react-components', label: '组件开发', hot: true },
      { id: 'react-pages', label: '页面视图', hot: true },
      { id: 'react-router-config', label: '路由配置', hot: true },
      { id: 'react-state', label: '状态管理', hot: true },
      { id: 'react-api-layer', label: 'API 层设计', hot: true }
    ]},
  { title: '🎨 样式与资源', items: [
      { id: 'react-styles', label: '样式方案', hot: true },
      { id: 'react-assets', label: '静态资源', hot: true },
      { id: 'react-icons', label: '图标使用', hot: true },
      { id: 'react-theme', label: '主题定制', hot: true }
    ]},
  { title: '🔧 开发工具与配置', items: [
      { id: 'react-vite', label: 'Vite 配置', hot: true },
      { id: 'react-eslint', label: 'ESLint 配置', hot: true },
      { id: 'react-prettier', label: 'Prettier 配置', hot: true },
      { id: 'react-alias', label: '路径别名', hot: true },
      { id: 'react-proxy', label: '代理配置', hot: true }
    ]},
  { title: '📦 依赖管理', items: [
      { id: 'react-package-json', label: 'package.json', hot: true },
      { id: 'react-dependencies', label: '依赖安装', hot: true },
      { id: 'react-update', label: '版本更新', hot: true }
    ]},
  { title: '🔨 构建与部署', items: [
      { id: 'react-build', label: '项目构建', hot: true },
      { id: 'react-env-build', label: '多环境构建', hot: true },
      { id: 'react-deploy', label: '部署上线', hot: true },
      { id: 'react-performance', label: '性能优化', hot: true }
    ]}
])

const selectedId = ref('react-project-init')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== React 项目开发内容映射表 ==========
const contentMap = {
  'react-project-init': {
    title: '项目创建',
    body: '<p class="lead">使用 Vite 快速创建 React 项目，这是目前官方推荐的方式。</p><pre><code>// 使用 npm 创建 React + TypeScript 项目\nnpm create vite@latest my-react-app -- --template react-ts\n\n// 或使用 yarn\nyarn create vite my-react-app --template react-ts\n\n// 或使用 pnpm\npnpm create vite my-react-app --template react-ts\n\n// 进入项目并安装依赖\ncd my-react-app\nnpm install\n\n// 启动开发服务器\nnpm run dev\n\n// 使用 Create React App（传统方式）\nnpx create-react-app my-app --template typescript\n\n// 使用 Next.js（框架）\nnpx create-next-app@latest my-next-app --typescript</code></pre>',
    tags: ['项目创建', 'Vite', '脚手架']
  },
  'react-project-structure': {
    title: '项目结构',
    body: '<p class="lead">了解 React 项目的标准目录结构。</p><pre><code>my-react-app/\n├── .vscode/              # VS Code 配置\n├── public/               # 静态资源（不经过构建）\n│   ├── favicon.ico\n│   └── index.html\n├── src/                  # 源代码\n│   ├── api/              # API 请求模块\n│   ├── assets/           # 资源文件（图片、字体等）\n│   ├── components/       # 公共组件\n│   │   ├── common/       # 通用组件\n│   │   └── business/     # 业务组件\n│   ├── constants/        # 常量定义\n│   ├── hooks/            # 自定义 Hooks\n│   ├── layouts/          # 布局组件\n│   ├── pages/            # 页面视图\n│   ├── router/           # 路由配置\n│   ├── store/            # Redux/Zustand 状态\n│   ├── styles/           # 全局样式\n│   ├── types/            # TypeScript 类型\n│   ├── utils/            # 工具函数\n│   ├── App.tsx           # 根组件\n│   ├── main.tsx          # 入口文件\n│   └── vite-env.d.ts     # Vite 类型声明\n├── .env                  # 环境变量\n├── .env.development      # 开发环境变量\n├── .env.production       # 生产环境变量\n├── .eslintrc.cjs         # ESLint 配置\n├── .gitignore            # Git 忽略文件\n├── .prettierrc.json      # Prettier 配置\n├── index.html            # HTML 模板\n├── package.json          # 项目依赖\n├── tsconfig.json         # TypeScript 配置\n└── vite.config.ts        # Vite 配置</code></pre>',
    tags: ['目录结构', '文件组织', '最佳实践']
  },
  'react-config': {
    title: '配置文件',
    body: '<p class="lead">React 项目中的核心配置文件说明。</p><pre><code>// vite.config.ts - Vite 配置\nimport { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\nimport path from "path"\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: {\n    alias: {\n      "@": path.resolve(__dirname, "src"),\n      "@components": path.resolve(__dirname, "src/components"),\n      "@pages": path.resolve(__dirname, "src/pages"),\n      "@utils": path.resolve(__dirname, "src/utils"),\n      "@hooks": path.resolve(__dirname, "src/hooks"),\n      "@api": path.resolve(__dirname, "src/api"),\n      "@store": path.resolve(__dirname, "src/store"),\n      "@assets": path.resolve(__dirname, "src/assets")\n    }\n  },\n  server: {\n    port: 3000,\n    open: true,\n    proxy: {\n      "/api": {\n        target: "http://localhost:8080",\n        changeOrigin: true\n      }\n    }\n  },\n  build: {\n    outDir: "dist",\n    sourcemap: false,\n    minify: "terser"\n  }\n})\n\n// tsconfig.json - TypeScript 配置\n{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true,\n    "paths": {\n      "@/*": ["./src/*"],\n      "@components/*": ["./src/components/*"],\n      "@pages/*": ["./src/pages/*"]\n    }\n  },\n  "include": ["src"],\n  "references": [{ "path": "./tsconfig.node.json" }]\n}</code></pre>',
    tags: ['配置文件', 'vite.config', 'tsconfig']
  },
  'react-env': {
    title: '环境变量',
    body: '<p class="lead">使用 .env 文件管理不同环境的配置。</p><pre><code># .env 通用环境变量\nVITE_APP_TITLE=My React App\n\n# .env.development 开发环境\nVITE_API_BASE_URL=http://localhost:8080/api\nVITE_APP_ENV=development\n\n# .env.production 生产环境\nVITE_API_BASE_URL=https://api.example.com/api\nVITE_APP_ENV=production\n\n// 在代码中使用\nconsole.log(import.meta.env.VITE_APP_TITLE)\nconsole.log(import.meta.env.VITE_API_BASE_URL)\nconsole.log(import.meta.env.MODE)\n\n// Create React App 方式（REACT_APP_ 前缀）\nREACT_APP_API_URL=https://api.example.com\nprocess.env.REACT_APP_API_URL\n\n// 在 vite.config.ts 中使用\nexport default defineConfig(({ mode }) => {\n  const env = loadEnv(mode, process.cwd())\n  return {\n    define: {\n      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV)\n    }\n  }\n})</code></pre>',
    tags: ['环境变量', '.env', '配置']
  },
  'react-src-structure': {
    title: 'src 目录组织',
    body: '<p class="lead">合理的 src 目录组织是项目可维护性的关键。</p><pre><code>src/\n├── api/                  # API 请求模块\n│   ├── modules/\n│   │   ├── user.ts\n│   │   └── product.ts\n│   ├── request.ts        # axios 实例配置\n│   └── index.ts          # 统一导出\n├── assets/               # 静态资源\n│   ├── images/\n│   ├── fonts/\n│   └── icons/\n├── components/           # 公共组件\n│   ├── common/           # 通用组件（Button, Input, Modal）\n│   ├── business/         # 业务组件\n│   └── layout/           # 布局组件\n├── constants/            # 常量定义\n│   ├── routes.ts\n│   └── config.ts\n├── hooks/                # 自定义 Hooks\n│   ├── useAuth.ts\n│   ├── useRequest.ts\n│   └── useLocalStorage.ts\n├── pages/                # 页面视图\n│   ├── home/\n│   │   ├── Home.tsx\n│   │   ├── Home.module.css\n│   │   └── components/\n│   └── user/\n│       ├── UserList.tsx\n│       └── UserDetail.tsx\n├── router/               # 路由配置\n│   ├── index.tsx\n│   └── routes.ts\n├── store/                # 状态管理\n│   ├── slices/           # Redux Toolkit slices\n│   │   ├── userSlice.ts\n│   │   └── appSlice.ts\n│   └── index.ts\n├── styles/               # 全局样式\n│   ├── variables.css\n│   └── global.css\n├── types/                # TypeScript 类型\n│   ├── api.ts\n│   └── global.d.ts\n├── utils/                # 工具函数\n│   ├── storage.ts\n│   ├── format.ts\n│   └── validate.ts\n├── App.tsx\n├── main.tsx\n└── vite-env.d.ts</code></pre>',
    tags: ['目录组织', '代码结构', '模块化']
  },
  'react-components': {
    title: '组件开发',
    body: '<p class="lead">React 函数组件开发的最佳实践。</p><pre><code>// components/common/Button.tsx\nimport { ButtonHTMLAttributes, ReactNode } from "react"\nimport "./Button.css"\n\ninterface ButtonProps extends ButtonHTMLAttributes&lt;HTMLButtonElement&gt; {\n  variant?: "primary" | "secondary" | "danger"\n  size?: "small" | "medium" | "large"\n  loading?: boolean\n  children: ReactNode\n}\n\nexport const Button = ({\n  variant = "primary",\n  size = "medium",\n  loading = false,\n  children,\n  disabled,\n  ...props\n}: ButtonProps) => {\n  const className = `btn btn-${variant} btn-${size} ${loading ? "btn-loading" : ""}`\n  \n  return (\n    &lt;button className={className} disabled={disabled || loading} {...props}&gt;\n      {loading && &lt;span className="spinner" /&gt;}\n      {children}\n    &lt;/button&gt;\n  )\n}\n\n// 使用 React.memo 优化\nimport { memo } from "react"\nexport const MemoizedButton = memo(Button)\n\n// 自定义 Hooks 示例\n// hooks/useCounter.ts\nimport { useState, useCallback } from "react"\n\ninterface UseCounterOptions {\n  initial?: number\n  min?: number\n  max?: number\n}\n\nexport const useCounter = ({ initial = 0, min = -Infinity, max = Infinity }: UseCounterOptions = {}) => {\n  const [count, setCount] = useState(initial)\n  \n  const increment = useCallback(() => {\n    setCount(prev => Math.min(prev + 1, max))\n  }, [max])\n  \n  const decrement = useCallback(() => {\n    setCount(prev => Math.max(prev - 1, min))\n  }, [min])\n  \n  const reset = useCallback(() => {\n    setCount(initial)\n  }, [initial])\n  \n  return { count, increment, decrement, reset }\n}</code></pre>',
    tags: ['组件', '函数组件', 'Hooks']
  },
  'react-pages': {
    title: '页面视图',
    body: '<p class="lead">页面级组件的开发规范。</p><pre><code>// pages/user/UserList.tsx\nimport { useState, useEffect, useCallback } from "react"\nimport { useNavigate } from "react-router-dom"\nimport { Button, Table, message } from "@/components"\nimport { getUserList, deleteUser } from "@/api/user"\nimport { useRequest } from "@/hooks/useRequest"\n\ninterface User {\n  id: number\n  name: string\n  email: string\n}\n\nexport const UserList = () => {\n  const navigate = useNavigate()\n  const [users, setUsers] = useState&lt;User[]&gt;([])\n  \n  const { loading, execute: fetchUsers } = useRequest(getUserList, {\n    onSuccess: (data) => setUsers(data),\n    onError: () => message.error("加载失败")\n  })\n  \n  const { execute: handleDelete } = useRequest(deleteUser, {\n    onSuccess: () => {\n      message.success("删除成功")\n      fetchUsers()\n    }\n  })\n  \n  useEffect(() => {\n    fetchUsers()\n  }, [])\n  \n  const columns = [\n    { title: "姓名", dataIndex: "name", key: "name" },\n    { title: "邮箱", dataIndex: "email", key: "email" },\n    {\n      title: "操作",\n      key: "action",\n      render: (_: unknown, record: User) => (\n        &lt;&gt;\n          &lt;Button onClick={() => navigate(`/user/${record.id}`)}&gt;详情&lt;/Button&gt;\n          &lt;Button danger onClick={() => handleDelete(record.id)}&gt;删除&lt;/Button&gt;\n        &lt;/&gt;\n      )\n    }\n  ]\n  \n  return (\n    &lt;div className="user-list"&gt;\n      &lt;div className="page-header"&gt;\n        &lt;h1&gt;用户列表&lt;/h1&gt;\n        &lt;Button onClick={() => navigate("/user/create")}&gt;新建用户&lt;/Button&gt;\n      &lt;/div&gt;\n      &lt;Table loading={loading} dataSource={users} columns={columns} /&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['页面', '视图', '路由']
  },
  'react-router-config': {
    title: '路由配置',
    body: '<p class="lead">React Router v6 的配置和使用方法。</p><pre><code>// router/index.tsx\nimport { createBrowserRouter, RouterProvider } from "react-router-dom"\nimport { lazy, Suspense } from "react"\nimport { Spin } from "@/components"\n\n// 路由懒加载\nconst Home = lazy(() => import("@/pages/Home"))\nconst UserList = lazy(() => import("@/pages/user/UserList"))\nconst UserDetail = lazy(() => import("@/pages/user/UserDetail"))\nconst Login = lazy(() => import("@/pages/Login"))\nconst NotFound = lazy(() => import("@/pages/NotFound"))\n\n// 路由守卫组件\nconst PrivateRoute = ({ children }: { children: React.ReactNode }) => {\n  const token = localStorage.getItem("token")\n  if (!token) {\n    return &lt;Navigate to="/login" replace /&gt;\n  }\n  return &lt;&gt;{children}&lt;/&gt;\n}\n\nconst router = createBrowserRouter([\n  {\n    path: "/",\n    element: (\n      &lt;Suspense fallback={&lt;Spin /&gt;}&gt;\n        &lt;Layout /&gt;\n      &lt;/Suspense&gt;\n    ),\n    children: [\n      { index: true, element: &lt;Home /&gt; },\n      {\n        path: "user",\n        element: &lt;PrivateRoute&gt;&lt;UserList /&gt;&lt;/PrivateRoute&gt;,\n        children: [\n          { path: ":id", element: &lt;UserDetail /&gt; }\n        ]\n      }\n    ]\n  },\n  { path: "/login", element: &lt;Login /&gt; },\n  { path: "*", element: &lt;NotFound /&gt; }\n])\n\nexport const AppRouter = () => &lt;RouterProvider router={router} /&gt;\n\n// 编程式导航\nimport { useNavigate } from "react-router-dom"\nconst navigate = useNavigate()\nnavigate("/user/1")\nnavigate(-1)  // 返回上一页</code></pre>',
    tags: ['路由', 'React Router', '导航守卫']
  },
  'react-state': {
    title: '状态管理',
    body: '<p class="lead">使用 Redux Toolkit 或 Zustand 进行状态管理。</p><pre><code>// store/slices/userSlice.ts (Redux Toolkit)\nimport { createSlice, createAsyncThunk } from "@reduxjs/toolkit"\nimport { getUserInfoApi } from "@/api/user"\n\ninterface UserState {\n  userInfo: User | null\n  token: string\n  loading: boolean\n}\n\nconst initialState: UserState = {\n  userInfo: null,\n  token: localStorage.getItem("token") || "",\n  loading: false\n}\n\nexport const fetchUserInfo = createAsyncThunk(\n  "user/fetchUserInfo",\n  async () => {\n    const res = await getUserInfoApi()\n    return res.data\n  }\n)\n\nconst userSlice = createSlice({\n  name: "user",\n  initialState,\n  reducers: {\n    setToken: (state, action) => {\n      state.token = action.payload\n      localStorage.setItem("token", action.payload)\n    },\n    logout: (state) => {\n      state.userInfo = null\n      state.token = ""\n      localStorage.removeItem("token")\n    }\n  },\n  extraReducers: (builder) => {\n    builder\n      .addCase(fetchUserInfo.pending, (state) => {\n        state.loading = true\n      })\n      .addCase(fetchUserInfo.fulfilled, (state, action) => {\n        state.userInfo = action.payload\n        state.loading = false\n      })\n  }\n})\n\nexport const { setToken, logout } = userSlice.actions\nexport default userSlice.reducer\n\n// 使用 Zustand（轻量级）\n// store/useUserStore.ts\nimport { create } from "zustand"\nimport { persist } from "zustand/middleware"\n\ninterface UserStore {\n  user: User | null\n  token: string\n  setUser: (user: User) => void\n  setToken: (token: string) => void\n  logout: () => void\n}\n\nexport const useUserStore = create&lt;UserStore&gt;()(\n  persist(\n    (set) => ({\n      user: null,\n      token: "",\n      setUser: (user) => set({ user }),\n      setToken: (token) => set({ token }),\n      logout: () => set({ user: null, token: "" })\n    }),\n    { name: "user-storage" }\n  )\n)</code></pre>',
    tags: ['状态管理', 'Redux', 'Zustand']
  },
  'react-api-layer': {
    title: 'API 层设计',
    body: '<p class="lead">统一的 API 请求层设计。</p><pre><code>// utils/request.ts\nimport axios, { AxiosRequestConfig, AxiosResponse } from "axios"\nimport { message } from "@/components"\n\ninterface ResponseData&lt;T = any&gt; {\n  code: number\n  data: T\n  message: string\n}\n\nconst request = axios.create({\n  baseURL: import.meta.env.VITE_API_BASE_URL,\n  timeout: 15000\n})\n\n// 请求拦截器\nrequest.interceptors.request.use(\n  (config) => {\n    const token = localStorage.getItem("token")\n    if (token) {\n      config.headers.Authorization = `Bearer ${token}`\n    }\n    return config\n  },\n  (error) => Promise.reject(error)\n)\n\n// 响应拦截器\nrequest.interceptors.response.use(\n  (response: AxiosResponse&lt;ResponseData&gt;) => {\n    const { code, data, message: msg } = response.data\n    if (code === 200) {\n      return data\n    } else if (code === 401) {\n      localStorage.removeItem("token")\n      window.location.href = "/login"\n      return Promise.reject(new Error("未授权"))\n    } else {\n      message.error(msg || "请求失败")\n      return Promise.reject(new Error(msg))\n    }\n  },\n  (error) => {\n    message.error(error.message || "网络错误")\n    return Promise.reject(error)\n  }\n)\n\nexport default request\n\n// api/modules/user.ts\nimport request from "@/utils/request"\n\nexport const loginApi = (data: { username: string; password: string }) =>\n  request.post&lt;{ token: string }&gt;("/auth/login", data)\n\nexport const getUserListApi = (params: { page: number; pageSize: number }) =>\n  request.get&lt;User[]&gt;("/users", { params })\n\nexport const getUserInfoApi = () =>\n  request.get&lt;User&gt;("/user/info")</code></pre>',
    tags: ['API', 'axios', '请求拦截']
  },
  'react-styles': {
    title: '样式方案',
    body: '<p class="lead">React 项目中的样式管理方案。</p><pre><code>// 1. CSS Modules\n// Button.module.css\n.btn {\n  padding: 8px 16px;\n  border-radius: 4px;\n  cursor: pointer;\n}\n.btn-primary {\n  background: #8B5CF6;\n  color: white;\n}\n\n// Button.tsx\nimport styles from "./Button.module.css"\nexport const Button = () => (\n  &lt;button className={`${styles.btn} ${styles["btn-primary"]}`}&gt;按钮&lt;/button&gt;\n)\n\n// 2. Styled Components\nnpm install styled-components\n\nimport styled from "styled-components"\n\nconst Button = styled.button&lt;{ variant?: "primary" | "secondary" }&gt;`\n  padding: 8px 16px;\n  border-radius: 4px;\n  background: ${props => props.variant === "primary" ? "#8B5CF6" : "#ccc"};\n  color: white;\n  cursor: pointer;\n`\n\n// 3. Tailwind CSS\n&lt;button className="px-4 py-2 rounded bg-purple-600 text-white"&gt;按钮&lt;/button&gt;\n\n// 4. CSS-in-JS (Emotion)\n/** @jsxImportSource @emotion/react */\nimport { css } from "@emotion/react"\n\nconst buttonStyle = css`\n  padding: 8px 16px;\n  border-radius: 4px;\n  background: #8B5CF6;\n`\n\n&lt;button css={buttonStyle}&gt;按钮&lt;/button&gt;</code></pre>',
    tags: ['样式', 'CSS Modules', 'Styled Components']
  },
  'react-assets': {
    title: '静态资源',
    body: '<p class="lead">静态资源的管理和使用。</p><pre><code>// 在组件中导入图片\nimport logo from "@/assets/images/logo.png"\nimport avatarUrl from "@/assets/images/avatar.jpg"\n\nexport const Logo = () => &lt;img src={logo} alt="Logo" /&gt;\n\n// SVG 作为 React 组件\nimport { ReactComponent as LogoIcon } from "@/assets/icons/logo.svg"\n\nexport const Icon = () => &lt;LogoIcon width={32} height={32} /&gt;\n\n// 动态图片加载\nconst getImageUrl = (name: string) => {\n  return new URL(`./assets/images/${name}.png`, import.meta.url).href\n}\n\n// public 目录（不经过构建）\n// public/favicon.ico 可以直接访问 /favicon.ico\n\n// 字体文件\n// styles/fonts.css\n@font-face {\n  font-family: "CustomFont";\n  src: url("@/assets/fonts/custom.woff2") format("woff2");\n}\n\n// 在组件中使用 CSS 变量\n&lt;div style={{ backgroundImage: `url(${imageUrl})` }} /&gt;</code></pre>',
    tags: ['静态资源', '图片', '字体']
  },
  'react-icons': {
    title: '图标使用',
    body: '<p class="lead">React 项目中图标的多种使用方式。</p><pre><code>// 1. React Icons（最常用）\nnpm install react-icons\n\nimport { FaHome, FaUser, FaSettings } from "react-icons/fa"\nimport { MdSearch, MdDelete } from "react-icons/md"\nimport { AiOutlineLoading } from "react-icons/ai"\n\nexport const IconDemo = () => (\n  &lt;&gt;\n    &lt;FaHome size={24} color="#8B5CF6" /&gt;\n    &lt;FaUser className="icon" /&gt;\n    &lt;MdDelete onClick={() => console.log("delete")} /&gt;\n    &lt;AiOutlineLoading className="animate-spin" /&gt;\n  &lt;/&gt;\n)\n\n// 2. Lucide React\nnpm install lucide-react\n\nimport { Home, User, Settings, Heart } from "lucide-react"\n\n// 3. Ant Design Icons\nnpm install @ant-design/icons\n\nimport { HomeOutlined, UserOutlined } from "@ant-design/icons"\n\n// 4. 自定义 SVG 图标组件\n// components/Icon.tsx\ninterface IconProps {\n  name: string\n  size?: number\n  color?: string\n}\n\nexport const Icon = ({ name, size = 24, color = "currentColor" }: IconProps) => {\n  const icons: Record&lt;string, React.ReactNode&gt; = {\n    home: &lt;path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /&gt;,\n    user: &lt;path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /&gt;\n  }\n  \n  return (\n    &lt;svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}&gt;\n      {icons[name]}\n    &lt;/svg&gt;\n  )\n}</code></pre>',
    tags: ['图标', 'react-icons', 'SVG']
  },
  'react-theme': {
    title: '主题定制',
    body: '<p class="lead">React 项目主题定制方案。</p><pre><code>// 使用 CSS 变量\n// styles/variables.css\n:root {\n  --primary-color: #8B5CF6;\n  --primary-hover: #7c3aed;\n  --text-color: #333;\n  --bg-color: #fff;\n}\n\n.dark {\n  --primary-color: #a78bfa;\n  --text-color: #e0e0e0;\n  --bg-color: #1e1e2f;\n}\n\n// 主题切换组件\n// context/ThemeContext.tsx\nimport { createContext, useContext, useState, useEffect } from "react"\n\ntype Theme = "light" | "dark"\n\ninterface ThemeContextType {\n  theme: Theme\n  toggleTheme: () => void\n}\n\nconst ThemeContext = createContext&lt;ThemeContextType | undefined&gt;(undefined)\n\nexport const ThemeProvider = ({ children }: { children: React.ReactNode }) => {\n  const [theme, setTheme] = useState&lt;Theme&gt;(() => {\n    const saved = localStorage.getItem("theme") as Theme\n    return saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")\n  })\n  \n  useEffect(() => {\n    document.documentElement.className = theme\n    localStorage.setItem("theme", theme)\n  }, [theme])\n  \n  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light")\n  \n  return (\n    &lt;ThemeContext.Provider value={{ theme, toggleTheme }}&gt;\n      {children}\n    &lt;/ThemeContext.Provider&gt;\n  )\n}\n\nexport const useTheme = () => {\n  const context = useContext(ThemeContext)\n  if (!context) throw new Error("useTheme must be used within ThemeProvider")\n  return context\n}</code></pre>',
    tags: ['主题', 'CSS变量', '暗色模式']
  },
  'react-vite': {
    title: 'Vite 配置',
    body: '<p class="lead">Vite 构建工具的详细配置。</p><pre><code>// vite.config.ts\nimport { defineConfig, loadEnv } from "vite"\nimport react from "@vitejs/plugin-react"\nimport path from "path"\n\nexport default defineConfig(({ mode }) => {\n  const env = loadEnv(mode, process.cwd())\n  \n  return {\n    plugins: [\n      react({\n        babel: {\n          plugins: [["@babel/plugin-transform-runtime"]]\n        }\n      })\n    ],\n    resolve: {\n      alias: {\n        "@": path.resolve(__dirname, "src"),\n        "@components": path.resolve(__dirname, "src/components"),\n        "@pages": path.resolve(__dirname, "src/pages"),\n        "@hooks": path.resolve(__dirname, "src/hooks"),\n        "@utils": path.resolve(__dirname, "src/utils"),\n        "@api": path.resolve(__dirname, "src/api"),\n        "@store": path.resolve(__dirname, "src/store"),\n        "@assets": path.resolve(__dirname, "src/assets"),\n        "@types": path.resolve(__dirname, "src/types")\n      }\n    },\n    server: {\n      port: 3000,\n      host: "0.0.0.0",\n      open: true,\n      cors: true,\n      proxy: {\n        "/api": {\n          target: env.VITE_API_PROXY || "http://localhost:8080",\n          changeOrigin: true,\n          rewrite: (path) => path.replace(/^\\/api/, "")\n        }\n      }\n    },\n    build: {\n      outDir: "dist",\n      assetsDir: "assets",\n      sourcemap: mode === "development",\n      minify: "terser",\n      chunkSizeWarningLimit: 1000,\n      rollupOptions: {\n        output: {\n          manualChunks: {\n            "react-vendor": ["react", "react-dom", "react-router-dom"],\n            "ui-vendor": ["antd", "@ant-design/icons"]\n          }\n        }\n      }\n    },\n    css: {\n      preprocessorOptions: {\n        scss: {\n          additionalData: `@import "@/styles/variables.scss";`\n        }\n      }\n    },\n    esbuild: {\n      drop: mode === "production" ? ["console", "debugger"] : []\n    }\n  }\n})</code></pre>',
    tags: ['Vite', '构建工具', '配置']
  },
  'react-eslint': {
    title: 'ESLint 配置',
    body: '<p class="lead">ESLint 代码规范配置。</p><pre><code>// .eslintrc.cjs\nmodule.exports = {\n  root: true,\n  env: {\n    browser: true,\n    es2021: true,\n    node: true\n  },\n  extends: [\n    "eslint:recommended",\n    "plugin:react/recommended",\n    "plugin:react-hooks/recommended",\n    "plugin:@typescript-eslint/recommended",\n    "plugin:prettier/recommended"\n  ],\n  parser: "@typescript-eslint/parser",\n  parserOptions: {\n    ecmaVersion: "latest",\n    sourceType: "module",\n    ecmaFeatures: {\n      jsx: true\n    }\n  },\n  settings: {\n    react: {\n      version: "detect"\n    }\n  },\n  rules: {\n    "react/react-in-jsx-scope": "off",\n    "react/prop-types": "off",\n    "@typescript-eslint/no-explicit-any": "warn",\n    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],\n    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",\n    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off"\n  }\n}\n\n// package.json scripts\n{\n  "scripts": {\n    "lint": "eslint src --ext .ts,.tsx --fix",\n    "lint:check": "eslint src --ext .ts,.tsx"\n  }\n}</code></pre>',
    tags: ['ESLint', '代码规范', 'Lint']
  },
  'react-prettier': {
    title: 'Prettier 配置',
    body: '<p class="lead">Prettier 代码格式化配置。</p><pre><code>// .prettierrc.json\n{\n  "semi": false,\n  "singleQuote": false,\n  "tabWidth": 2,\n  "trailingComma": "es5",\n  "printWidth": 100,\n  "bracketSpacing": true,\n  "bracketSameLine": false,\n  "arrowParens": "always",\n  "endOfLine": "lf",\n  "jsxSingleQuote": false,\n  "jsxBracketSameLine": false\n}\n\n// .prettierignore\nnode_modules/\ndist/\n.git/\n*.log\ncoverage/\nbuild/\n\n// package.json scripts\n{\n  "scripts": {\n    "format": "prettier --write .",\n    "format:check": "prettier --check ."\n  }\n}</code></pre>',
    tags: ['Prettier', '格式化', '代码风格']
  },
  'react-alias': {
    title: '路径别名',
    body: '<p class="lead">配置路径别名简化模块导入。</p><pre><code>// vite.config.ts\nexport default defineConfig({\n  resolve: {\n    alias: {\n      "@": path.resolve(__dirname, "src"),\n      "@components": path.resolve(__dirname, "src/components"),\n      "@pages": path.resolve(__dirname, "src/pages"),\n      "@hooks": path.resolve(__dirname, "src/hooks"),\n      "@utils": path.resolve(__dirname, "src/utils"),\n      "@api": path.resolve(__dirname, "src/api"),\n      "@store": path.resolve(__dirname, "src/store"),\n      "@assets": path.resolve(__dirname, "src/assets"),\n      "@types": path.resolve(__dirname, "src/types")\n    }\n  }\n})\n\n// tsconfig.json\n{\n  "compilerOptions": {\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["src/*"],\n      "@components/*": ["src/components/*"],\n      "@pages/*": ["src/pages/*"],\n      "@hooks/*": ["src/hooks/*"],\n      "@utils/*": ["src/utils/*"],\n      "@api/*": ["src/api/*"],\n      "@store/*": ["src/store/*"],\n      "@assets/*": ["src/assets/*"]\n    }\n  }\n}\n\n// 使用示例\nimport Button from "@/components/Button"\nimport { formatDate } from "@utils/format"</code></pre>',
    tags: ['路径别名', '@别名', '模块导入']
  },
  'react-proxy': {
    title: '代理配置',
    body: '<p class="lead">开发环境代理配置解决跨域问题。</p><pre><code>// vite.config.ts\nexport default defineConfig({\n  server: {\n    proxy: {\n      // 单个代理\n      "/api": {\n        target: "http://localhost:8080",\n        changeOrigin: true,\n        rewrite: (path) => path.replace(/^\\/api/, "")\n      },\n      // 多个代理\n      "/user-api": {\n        target: "http://localhost:8081",\n        changeOrigin: true\n      },\n      "/order-api": {\n        target: "http://localhost:8082",\n        changeOrigin: true\n      },\n      // WebSocket 代理\n      "/ws": {\n        target: "ws://localhost:3000",\n        ws: true\n      }\n    }\n  }\n})\n\n// 请求示例\nfetch("/api/users")  // 实际请求 http://localhost:8080/users\n\n// 在代码中使用环境变量\nconst apiUrl = import.meta.env.VITE_API_BASE_URL\nfetch(`${apiUrl}/users`)</code></pre>',
    tags: ['代理', '跨域', 'proxy']
  },
  'react-package-json': {
    title: 'package.json',
    body: '<p class="lead">package.json 核心字段说明。</p><pre><code>{\n  "name": "my-react-app",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build",\n    "preview": "vite preview",\n    "lint": "eslint src --ext .ts,.tsx --fix",\n    "format": "prettier --write .",\n    "type-check": "tsc --noEmit"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "react-router-dom": "^6.20.0",\n    "axios": "^1.6.0",\n    "zustand": "^4.4.0"\n  },\n  "devDependencies": {\n    "@types/react": "^18.2.0",\n    "@types/react-dom": "^18.2.0",\n    "@vitejs/plugin-react": "^4.2.0",\n    "typescript": "^5.3.0",\n    "vite": "^5.0.0",\n    "eslint": "^8.56.0",\n    "prettier": "^3.1.0",\n    "@typescript-eslint/eslint-plugin": "^6.0.0",\n    "@typescript-eslint/parser": "^6.0.0"\n  },\n  "engines": {\n    "node": ">=18.0.0"\n  }\n}</code></pre>',
    tags: ['package.json', '依赖管理', 'scripts']
  },
  'react-dependencies': {
    title: '依赖安装',
    body: '<p class="lead">项目依赖的管理和安装。</p><pre><code>// 安装生产依赖\nnpm install react-router-dom\nnpm install axios --save\n\n// 安装开发依赖\nnpm install -D @types/react\nnpm install -D @vitejs/plugin-react\n\n// 查看已安装的包\nnpm list\nnpm list --depth=0\n\n// 查看可更新的包\nnpm outdated\n\n// 更新依赖\nnpm update\nnpm install react@latest\n\n// 删除依赖\nnpm uninstall axios\n\n// 清理缓存\nnpm cache clean --force\n\n// 使用 pnpm（推荐，节省空间）\npnpm install\npnpm add axios\npnpm add -D typescript\n\n// 常用 React 生态依赖\n// 路由: react-router-dom\n// 状态: zustand, redux-toolkit\n// 请求: axios, tanstack/react-query\n// UI: antd, element-react, material-ui\n// 样式: styled-components, tailwindcss</code></pre>',
    tags: ['依赖', 'npm', 'pnpm']
  },
  'react-update': {
    title: '版本更新',
    body: '<p class="lead">React 项目依赖版本更新策略。</p><pre><code>// 查看当前版本\nnpm list react\n\n// 更新到最新版本\nnpm install react@latest\nnpm install react-dom@latest\n\n// 更新到指定版本\nnpm install react@18.2.0\n\n// 使用 npm-check-updates 批量更新\nnpx npm-check-updates -u\nnpm install\n\n// React 生态常用版本\n// React 18.2+\n// React Router 6.20+\n// Zustand 4.4+\n// Vite 5.0+\n// TypeScript 5.3+\n\n// 升级注意事项\n// 1. 查看更新日志\n// 2. 在开发分支测试\n// 3. 运行完整测试\n// 4. 检查 Breaking Changes\n// 5. 逐步升级主要版本\n\n// 使用 create-react-app 升级\nnpm install react-scripts@latest</code></pre>',
    tags: ['版本更新', '升级', '依赖管理']
  },
  'react-build': {
    title: '项目构建',
    body: '<p class="lead">React 项目的构建配置和执行。</p><pre><code>// 开发构建\nnpm run dev\n\n// 生产构建\nnpm run build\n\n// 构建分析\nnpm run build -- --report\n\n// 使用 vite 插件分析\nimport { visualizer } from "rollup-plugin-visualizer"\n\nexport default defineConfig({\n  plugins: [\n    react(),\n    visualizer({\n      filename: "dist/stats.html",\n      open: true,\n      gzipSize: true,\n      brotliSize: true\n    })\n  ]\n})\n\n// 构建优化配置\nbuild: {\n  rollupOptions: {\n    output: {\n      manualChunks: {\n        "react-vendor": ["react", "react-dom", "react-router-dom"],\n        "ui-vendor": ["antd", "@ant-design/icons"],\n        "utils-vendor": ["axios", "dayjs", "lodash-es"]\n      }\n    }\n  },\n  chunkSizeWarningLimit: 1000,\n  terserOptions: {\n    compress: {\n      drop_console: true,\n      drop_debugger: true\n    }\n  },\n  target: "es2015",\n  minify: "terser"\n}\n\n// 预览构建结果\nnpm run preview</code></pre>',
    tags: ['构建', '打包', '优化']
  },
  'react-env-build': {
    title: '多环境构建',
    body: '<p class="lead">针对不同环境的构建配置。</p><pre><code>// .env.development\nVITE_API_URL=http://localhost:8080/api\nVITE_APP_ENV=development\nVITE_APP_TITLE=开发环境\n\n// .env.staging\nVITE_API_URL=https://staging-api.example.com/api\nVITE_APP_ENV=staging\nVITE_APP_TITLE=预发布环境\n\n// .env.production\nVITE_API_URL=https://api.example.com/api\nVITE_APP_ENV=production\nVITE_APP_TITLE=生产环境\n\n// package.json\n{\n  "scripts": {\n    "build:dev": "vite build --mode development",\n    "build:staging": "vite build --mode staging",\n    "build:prod": "vite build --mode production"\n  }\n}\n\n// 在代码中使用\nconst apiUrl = import.meta.env.VITE_API_URL\nconst env = import.meta.env.VITE_APP_ENV\nconst isDev = import.meta.env.DEV\nconst isProd = import.meta.env.PROD\n\n// 条件编译\nif (import.meta.env.DEV) {\n  console.log("开发模式，启用调试工具")\n}\n\nif (import.meta.env.PROD) {\n  console.log("生产模式")\n  // 启用生产监控\n}</code></pre>',
    tags: ['多环境', '构建', '环境变量']
  },
  'react-deploy': {
    title: '部署上线',
    body: '<p class="lead">React 项目的部署方案。</p><pre><code>// 构建生产包\nnpm run build\n\n// 输出目录\n// dist/\n\n// Nginx 配置示例\nserver {\n  listen 80;\n  server_name example.com;\n  root /var/www/react-app/dist;\n  \n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  \n  location /api {\n    proxy_pass http://localhost:8080;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n  }\n  \n  # 静态资源缓存\n  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {\n    expires 1y;\n    add_header Cache-Control "public, immutable";\n  }\n}\n\n// 使用 Serve 快速部署\nnpm install -g serve\nserve -s dist -p 3000\n\n// Docker 部署\nFROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nCOPY nginx.conf /etc/nginx/nginx.conf\nEXPOSE 80\n\n// GitHub Pages 部署\nnpm run build\nnpm install -g gh-pages\ngh-pages -d dist\n\n// Vercel 部署\n// 连接 GitHub 仓库，自动部署</code></pre>',
    tags: ['部署', 'Nginx', '上线']
  },
  'react-performance': {
    title: '性能优化',
    body: '<p class="lead">React 项目的性能优化策略。</p><pre><code>// 1. React.memo 避免不必要的重渲染\nimport { memo } from "react"\n\nconst ExpensiveComponent = memo(({ data }) => {\n  // 组件逻辑\n})\n\n// 2. useCallback 缓存函数\nconst handleClick = useCallback(() => {\n  doSomething(id)\n}, [id])\n\n// 3. useMemo 缓存计算结果\nconst expensiveValue = useMemo(() => {\n  return computeExpensiveValue(data)\n}, [data])\n\n// 4. 路由懒加载\nconst UserPage = lazy(() => import("@/pages/UserPage"))\n\n// 5. 组件懒加载\nconst HeavyModal = lazy(() => import("@/components/HeavyModal"))\n\n// 6. 虚拟列表（大列表优化）\nnpm install react-window\n\nimport { FixedSizeList as List } from "react-window"\n\nconst Row = ({ index, style }) => (\n  &lt;div style={style}&gt;Row {index}&lt;/div&gt;\n)\n\n&lt;List height={400} itemCount={1000} itemSize={35} width={300}&gt;\n  {Row}\n&lt;/List&gt;\n\n// 7. 图片懒加载\n&lt;img loading="lazy" src={imageUrl} alt="lazy" /&gt;\n\n// 8. 代码分割\nconst module = await import("./heavy-module")\n\n// 9. Tree Shaking\nimport { debounce } from "lodash-es"  // 使用 ES 模块版本\n\n// 10. 使用 React Profiler 分析\n&lt;Profiler id="App" onRender={onRenderCallback}&gt;\n  &lt;App /&gt;\n&lt;/Profiler&gt;</code></pre>',
    tags: ['性能优化', 'React.memo', '懒加载']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 React 官方文档获取更多信息。</p>',
        tags: ['React', '项目开发']
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

addLink('react-project-init', 'react-project-structure')
addLink('react-project-structure', 'react-config')
addLink('react-config', 'react-env')
addLink('react-src-structure', 'react-components')
addLink('react-components', 'react-pages')
addLink('react-pages', 'react-router-config')
addLink('react-router-config', 'react-state')
addLink('react-state', 'react-api-layer')
addLink('react-styles', 'react-assets')
addLink('react-assets', 'react-icons')
addLink('react-icons', 'react-theme')
addLink('react-vite', 'react-eslint')
addLink('react-eslint', 'react-prettier')
addLink('react-prettier', 'react-alias')
addLink('react-alias', 'react-proxy')
addLink('react-package-json', 'react-dependencies')
addLink('react-dependencies', 'react-update')
addLink('react-build', 'react-env-build')
addLink('react-env-build', 'react-deploy')
addLink('react-deploy', 'react-performance')

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