<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">React Router 知识库</h1>
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
          <h2>⚛️ <span class="gradient-text">React Router 完全指南</span></h2>
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
          <p>⚛️ React 官方路由解决方案</p>
          <p>✨ 点击节点双向联动 | 声明式路由</p>
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
          <h3>🔗 React Router 知识图谱 <span class="graph-badge">ECharts</span></h3>
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

// ========== React Router 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'rr-intro', label: 'React Router 简介', hot: true },
      { id: 'rr-install', label: '安装与配置', hot: true },
      { id: 'rr-basic', label: '基本使用', hot: true }
    ]},
  { title: '📋 路由组件', items: [
      { id: 'rr-browser-router', label: 'BrowserRouter', hot: true },
      { id: 'rr-routes', label: 'Routes / Route', hot: true },
      { id: 'rr-link', label: 'Link / NavLink', hot: true },
      { id: 'rr-navigate', label: 'Navigate 组件', hot: true },
      { id: 'rr-outlet', label: 'Outlet 出口', hot: true }
    ]},
  { title: '🔧 路由配置', items: [
      { id: 'rr-dynamic', label: '动态路由', hot: true },
      { id: 'rr-nested', label: '嵌套路由', hot: true },
      { id: 'rr-index', label: '索引路由', hot: true },
      { id: 'rr-lazy', label: '路由懒加载', hot: true }
    ]},
  { title: '🛠️ Hooks API', items: [
      { id: 'rr-use-params', label: 'useParams', hot: true },
      { id: 'rr-use-location', label: 'useLocation', hot: true },
      { id: 'rr-use-navigate', label: 'useNavigate', hot: true },
      { id: 'rr-use-match', label: 'useMatch', hot: true },
      { id: 'rr-use-routes', label: 'useRoutes', hot: true }
    ]},
  { title: '🛡️ 路由守卫', items: [
      { id: 'rr-navigation-guard', label: '导航守卫', hot: true },
      { id: 'rr-protected', label: '路由保护', hot: true }
    ]},
  { title: '⚡ 高级特性', items: [
      { id: 'rr-query-params', label: '查询参数', hot: true },
      { id: 'rr-state', label: '路由状态', hot: true },
      { id: 'rr-scroll', label: '滚动恢复', hot: true },
      { id: 'rr-splat', label: '通配符路由', hot: true }
    ]}
])

const selectedId = ref('rr-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== React Router 内容映射表 ==========
const contentMap = {
  'rr-intro': {
    title: 'React Router 简介',
    body: '<p class="lead">React Router 是 React 的官方路由库，用于构建单页面应用（SPA），实现声明式的路由导航和视图渲染。</p><h3>核心特点</h3><ul><li><strong>声明式路由</strong>：使用 JSX 语法定义路由</li><li><strong>嵌套路由</strong>：支持路由嵌套</li><li><strong>Hooks API</strong>：现代化的路由操作方式</li><li><strong>懒加载</strong>：按需加载组件</li><li><strong>类型安全</strong>：完整的 TypeScript 支持</li></ul><div class="note">💡 React Router v6 是最新版本，重构了核心 API。</div>',
    tags: ['React', '路由', 'SPA']
  },
  'rr-install': {
    title: '安装与配置',
    body: '<p class="lead">React Router 可以通过 npm 安装。</p><pre><code>// 安装 React Router v6\nnpm install react-router-dom\n\n// 或使用 yarn\nyarn add react-router-dom\n\n// 基本配置\nimport { BrowserRouter, Routes, Route } from "react-router-dom"\nimport Home from "./pages/Home"\nimport About from "./pages/About"\n\nfunction App() {\n  return (\n    &lt;BrowserRouter&gt;\n      &lt;Routes&gt;\n        &lt;Route path="/" element={&lt;Home /&gt;} /&gt;\n        &lt;Route path="/about" element={&lt;About /&gt;} /&gt;\n      &lt;/Routes&gt;\n    &lt;/BrowserRouter&gt;\n  )\n}\n\nexport default App</code></pre>',
    tags: ['安装', 'BrowserRouter', 'Routes']
  },
  'rr-basic': {
    title: '基本使用',
    body: '<p class="lead">React Router 的基本使用方式。</p><pre><code>import { BrowserRouter, Routes, Route, Link } from "react-router-dom"\n\nfunction App() {\n  return (\n    &lt;BrowserRouter&gt;\n      &lt;nav&gt;\n        &lt;Link to="/"&gt;首页&lt;/Link&gt;\n        &lt;Link to="/about"&gt;关于&lt;/Link&gt;\n        &lt;Link to="/contact"&gt;联系&lt;/Link&gt;\n      &lt;/nav&gt;\n      \n      &lt;Routes&gt;\n        &lt;Route path="/" element={&lt;Home /&gt;} /&gt;\n        &lt;Route path="/about" element={&lt;About /&gt;} /&gt;\n        &lt;Route path="/contact" element={&lt;Contact /&gt;} /&gt;\n        &lt;Route path="*" element={&lt;NotFound /&gt;} /&gt;\n      &lt;/Routes&gt;\n    &lt;/BrowserRouter&gt;\n  )\n}</code></pre>',
    tags: ['Routes', 'Route', 'Link']
  },
  'rr-browser-router': {
    title: 'BrowserRouter',
    body: '<p class="lead">BrowserRouter 使用 HTML5 历史 API 管理路由。</p><pre><code>import { BrowserRouter } from "react-router-dom"\n\n// 基本用法\n&lt;BrowserRouter&gt;\n  &lt;App /&gt;\n&lt;/BrowserRouter&gt;\n\n// 配置 basename\n&lt;BrowserRouter basename="/app"&gt;\n  &lt;App /&gt;\n&lt;/BrowserRouter&gt;\n\n// 配置 window 对象（用于非浏览器环境）\n&lt;BrowserRouter window={window}&gt;\n  &lt;App /&gt;\n&lt;/BrowserRouter&gt;\n\n// HashRouter（兼容旧浏览器）\nimport { HashRouter } from "react-router-dom"\n\n&lt;HashRouter&gt;\n  &lt;App /&gt;\n&lt;/HashRouter&gt;\n\n// MemoryRouter（测试环境）\nimport { MemoryRouter } from "react-router-dom"\n\n&lt;MemoryRouter initialEntries={["/", "/about"]}&gt;\n  &lt;App /&gt;\n&lt;/MemoryRouter&gt;</code></pre>',
    tags: ['BrowserRouter', 'HashRouter', 'MemoryRouter']
  },
  'rr-routes': {
    title: 'Routes / Route',
    body: '<p class="lead">Routes 和 Route 组件定义路由规则。</p><pre><code>&lt;Routes&gt;\n  &lt;!-- 精确匹配 --&gt;\n  &lt;Route path="/" element={&lt;Home /&gt;} /&gt;\n  \n  &lt;!-- 动态路由 --&gt;\n  &lt;Route path="/user/:id" element={&lt;User /&gt;} /&gt;\n  \n  &lt;!-- 可选参数 --&gt;\n  &lt;Route path="/post/:id?" element={&lt;Post /&gt;} /&gt;\n  \n  &lt;!-- 嵌套路由 --&gt;\n  &lt;Route path="/dashboard" element={&lt;Dashboard /&gt;}&gt;\n    &lt;Route path="stats" element={&lt;Stats /&gt;} /&gt;\n    &lt;Route path="settings" element={&lt;Settings /&gt;} /&gt;\n  &lt;/Route&gt;\n  \n  &lt;!-- 索引路由 --&gt;\n  &lt;Route path="/dashboard" element={&lt;Dashboard /&gt;}&gt;\n    &lt;Route index element={&lt;Overview /&gt;} /&gt;\n    &lt;Route path="stats" element={&lt;Stats /&gt;} /&gt;\n  &lt;/Route&gt;\n  \n  &lt;!-- 通配符路由 --&gt;\n  &lt;Route path="*" element={&lt;NotFound /&gt;} /&gt;\n&lt;/Routes&gt;</code></pre>',
    tags: ['Routes', 'Route', '路由匹配']
  },
  'rr-link': {
    title: 'Link / NavLink',
    body: '<p class="lead">Link 和 NavLink 用于页面导航。</p><pre><code>import { Link, NavLink } from "react-router-dom"\n\n// Link 组件\n&lt;Link to="/"&gt;首页&lt;/Link&gt;\n&lt;Link to="/about" replace&gt;关于（替换历史）&lt;/Link&gt;\n&lt;Link to="/user/123" state={{ fromHome: true }}&gt;用户&lt;/Link&gt;\n\n// NavLink（带激活状态）\n&lt;NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}&gt;\n  首页\n&lt;/NavLink&gt;\n\n&lt;NavLink to="/about" style={({ isActive }) => ({\n  color: isActive ? "#8B5CF6" : "#333"\n})}&gt;\n  关于\n&lt;/NavLink&gt;\n\n&lt;NavLink to="/dashboard" end&gt;仪表盘（精确匹配）&lt;/NavLink&gt;</code></pre>',
    tags: ['Link', 'NavLink', '导航']
  },
  'rr-navigate': {
    title: 'Navigate 组件',
    body: '<p class="lead">Navigate 组件用于编程式重定向。</p><pre><code>import { Navigate } from "react-router-dom"\n\n// 声明式重定向\nfunction PrivateRoute({ children }) {\n  const isLoggedIn = useAuth()\n  return isLoggedIn ? children : &lt;Navigate to="/login" replace /&gt;\n}\n\n// 带状态的重定向\n&lt;Navigate to="/dashboard" state={{ from: "/profile" }} /&gt;\n\n// 条件重定向\nfunction HomePage() {\n  const user = useUser()\n  if (user.isLoggedIn) {\n    return &lt;Navigate to="/dashboard" /&gt;\n  }\n  return &lt;Home /&gt;\n}</code></pre>',
    tags: ['Navigate', '重定向', '导航']
  },
  'rr-outlet': {
    title: 'Outlet 出口',
    body: '<p class="lead">Outlet 组件用于渲染嵌套路由的子组件。</p><pre><code>import { Outlet } from "react-router-dom"\n\n// 父组件 Dashboard.jsx\nfunction Dashboard() {\n  return (\n    &lt;div&gt;\n      &lt;h1&gt;仪表盘&lt;/h1&gt;\n      &lt;nav&gt;\n        &lt;Link to="stats"&gt;统计&lt;/Link&gt;\n        &lt;Link to="settings"&gt;设置&lt;/Link&gt;\n      &lt;/nav&gt;\n      &lt;Outlet /&gt;  {/* 子路由组件会渲染在这里 */}\n    &lt;/div&gt;\n  )\n}\n\n// 路由配置\n&lt;Route path="/dashboard" element={&lt;Dashboard /&gt;}&gt;\n  &lt;Route path="stats" element={&lt;Stats /&gt;} /&gt;\n  &lt;Route path="settings" element={&lt;Settings /&gt;} /&gt;\n&lt;/Route&gt;</code></pre>',
    tags: ['Outlet', '嵌套路由', '子路由']
  },
  'rr-dynamic': {
    title: '动态路由',
    body: '<p class="lead">使用动态路径参数匹配路由。</p><pre><code>// 定义动态路由\n&lt;Route path="/user/:userId" element={&lt;User /&gt;} /&gt;\n&lt;Route path="/post/:postId/comment/:commentId" element={&lt;Comment /&gt;} /&gt;\n\n// 获取参数\nimport { useParams } from "react-router-dom"\n\nfunction User() {\n  const { userId } = useParams()\n  return &lt;div&gt;用户 ID: {userId}&lt;/div&gt;\n}\n\n// 可选参数\n&lt;Route path="/search/:query?" element={&lt;Search /&gt;} /&gt;\n\n// 正则匹配\n&lt;Route path="/user/:id(\\\\d+)" element={&lt;User /&gt;} /&gt;  // 只匹配数字</code></pre>',
    tags: ['动态路由', 'useParams', '参数']
  },
  'rr-nested': {
    title: '嵌套路由',
    body: '<p class="lead">在路由中嵌套子路由。</p><pre><code>// 路由配置\n&lt;Route path="/admin" element={&lt;Admin /&gt;}&gt;\n  &lt;Route index element={&lt;AdminDashboard /&gt;} /&gt;\n  &lt;Route path="users" element={&lt;AdminUsers /&gt;} /&gt;\n  &lt;Route path="posts" element={&lt;AdminPosts /&gt;} /&gt;\n  &lt;Route path="settings" element={&lt;AdminSettings /&gt;} /&gt;\n&lt;/Route&gt;\n\n// Admin 组件\nimport { Outlet, Link } from "react-router-dom"\n\nfunction Admin() {\n  return (\n    &lt;div&gt;\n      &lt;nav&gt;\n        &lt;Link to="/admin"&gt;仪表盘&lt;/Link&gt;\n        &lt;Link to="/admin/users"&gt;用户管理&lt;/Link&gt;\n        &lt;Link to="/admin/posts"&gt;文章管理&lt;/Link&gt;\n      &lt;/nav&gt;\n      &lt;Outlet /&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['嵌套路由', '子路由', 'Outlet']
  },
  'rr-index': {
    title: '索引路由',
    body: '<p class="lead">索引路由在父路径下渲染默认组件。</p><pre><code>&lt;Route path="/dashboard" element={&lt;Dashboard /&gt;}&gt;\n  {/* 访问 /dashboard 时渲染 Overview */}\n  &lt;Route index element={&lt;Overview /&gt;} /&gt;\n  &lt;Route path="stats" element={&lt;Stats /&gt;} /&gt;\n  &lt;Route path="settings" element={&lt;Settings /&gt;} /&gt;\n&lt;/Route&gt;\n\n// 在导航中使用\n&lt;NavLink to="/dashboard" end&gt;概览&lt;/NavLink&gt;\n&lt;NavLink to="/dashboard/stats"&gt;统计&lt;/NavLink&gt;</code></pre>',
    tags: ['索引路由', 'index', '默认路由']
  },
  'rr-lazy': {
    title: '路由懒加载',
    body: '<p class="lead">使用 React.lazy 实现路由懒加载。</p><pre><code>import { lazy, Suspense } from "react"\nimport { Routes, Route } from "react-router-dom"\n\nconst Home = lazy(() => import("./pages/Home"))\nconst About = lazy(() => import("./pages/About"))\nconst User = lazy(() => import("./pages/User"))\n\nfunction App() {\n  return (\n    &lt;Suspense fallback={&lt;div&gt;加载中...&lt;/div&gt;}&gt;\n      &lt;Routes&gt;\n        &lt;Route path="/" element={&lt;Home /&gt;} /&gt;\n        &lt;Route path="/about" element={&lt;About /&gt;} /&gt;\n        &lt;Route path="/user/:id" element={&lt;User /&gt;} /&gt;\n      &lt;/Routes&gt;\n    &lt;/Suspense&gt;\n  )\n}\n\n// 使用 Loader 函数（React Router v6.4+）\n&lt;Route\n  path="/user/:id"\n  element={&lt;User /&gt;}\n  loader={({ params }) =&gt; fetchUser(params.id)}\n/&gt;</code></pre>',
    tags: ['懒加载', 'React.lazy', 'Suspense']
  },
  'rr-use-params': {
    title: 'useParams',
    body: '<p class="lead">useParams 获取 URL 路径参数。</p><pre><code>import { useParams } from "react-router-dom"\n\n// 路由定义\n// &lt;Route path="/user/:userId/post/:postId" element={&lt;Post /&gt;} /&gt;\n\nfunction Post() {\n  const { userId, postId } = useParams()\n  \n  useEffect(() => {\n    fetchPost(userId, postId)\n  }, [userId, postId])\n  \n  return (\n    &lt;div&gt;\n      &lt;p&gt;用户 ID: {userId}&lt;/p&gt;\n      &lt;p&gt;文章 ID: {postId}&lt;/p&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['useParams', '路径参数', '动态参数']
  },
  'rr-use-location': {
    title: 'useLocation',
    body: '<p class="lead">useLocation 获取当前 URL 信息。</p><pre><code>import { useLocation } from "react-router-dom"\n\nfunction CurrentLocation() {\n  const location = useLocation()\n  \n  console.log(location.pathname)   // /user/123\n  console.log(location.search)     // ?page=1&size=10\n  console.log(location.hash)       // #section\n  console.log(location.state)      // { from: "/home" }\n  console.log(location.key)        // 唯一标识\n  \n  // 监听路由变化\n  useEffect(() => {\n    console.log("路由变化:", location.pathname)\n  }, [location])\n  \n  return &lt;div&gt;当前路径: {location.pathname}&lt;/div&gt;\n}\n\n// 获取查询参数\nconst searchParams = new URLSearchParams(location.search)\nconst page = searchParams.get("page")</code></pre>',
    tags: ['useLocation', 'URL信息', '路径']
  },
  'rr-use-navigate': {
    title: 'useNavigate',
    body: '<p class="lead">useNavigate 实现编程式导航。</p><pre><code>import { useNavigate } from "react-router-dom"\n\nfunction NavigationButtons() {\n  const navigate = useNavigate()\n  \n  // 基本导航\n  const goHome = () => navigate("/")\n  const goBack = () => navigate(-1)\n  const goForward = () => navigate(1)\n  \n  // 带参数导航\n  const goToUser = (id) => navigate(`/user/${id}`)\n  const goToUserWithState = (id) => navigate(`/user/${id}`, {\n    state: { from: "home" }\n  })\n  \n  // 替换当前历史\n  const replacePage = () => navigate("/dashboard", { replace: true })\n  \n  // 带查询参数\n  const search = () => navigate("/search?q=react&page=1")\n  \n  return (\n    &lt;div&gt;\n      &lt;button onClick={goHome}&gt;首页&lt;/button&gt;\n      &lt;button onClick={goBack}&gt;后退&lt;/button&gt;\n      &lt;button onClick={goForward}&gt;前进&lt;/button&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['useNavigate', '编程式导航', 'navigate']
  },
  'rr-use-match': {
    title: 'useMatch',
    body: '<p class="lead">useMatch 检查当前 URL 是否匹配特定路径。</p><pre><code>import { useMatch } from "react-router-dom"\n\nfunction MenuItem() {\n  // 检查是否匹配\n  const isActive = useMatch("/dashboard")\n  const isUserPage = useMatch("/user/:id")\n  \n  // 获取匹配信息\n  const match = useMatch("/post/:postId")\n  if (match) {\n    console.log("匹配的路径:", match.pathname)\n    console.log("参数:", match.params.postId)\n  }\n  \n  return (\n    &lt;nav&gt;\n      &lt;Link to="/dashboard" className={isActive ? "active" : ""}&gt;\n        仪表盘\n      &lt;/Link&gt;\n    &lt;/nav&gt;\n  )\n}</code></pre>',
    tags: ['useMatch', '路径匹配', '激活状态']
  },
  'rr-use-routes': {
    title: 'useRoutes',
    body: '<p class="lead">useRoutes 以对象形式定义路由。</p><pre><code>import { useRoutes } from "react-router-dom"\n\n// 路由配置对象\nconst routes = [\n  {\n    path: "/",\n    element: &lt;Layout /&gt;,\n    children: [\n      { index: true, element: &lt;Home /&gt; },\n      { path: "about", element: &lt;About /&gt; },\n      {\n        path: "user/:id",\n        element: &lt;User /&gt;,\n        children: [\n          { path: "profile", element: &lt;Profile /&gt; },\n          { path: "settings", element: &lt;Settings /&gt; }\n        ]\n      },\n      { path: "*", element: &lt;NotFound /&gt; }\n    ]\n  }\n]\n\nfunction App() {\n  const element = useRoutes(routes)\n  return element\n}</code></pre>',
    tags: ['useRoutes', '配置式路由', '对象路由']
  },
  'rr-navigation-guard': {
    title: '导航守卫',
    body: '<p class="lead">实现路由导航守卫功能。</p><pre><code>import { useNavigate, useLocation } from "react-router-dom"\nimport { useEffect } from "react"\n\n// 全局前置守卫\nfunction App() {\n  const navigate = useNavigate()\n  const location = useLocation()\n  \n  useEffect(() => {\n    const checkAuth = async () => {\n      const isLoggedIn = localStorage.getItem("token")\n      const publicPaths = ["/login", "/register", "/"]\n      \n      if (!isLoggedIn && !publicPaths.includes(location.pathname)) {\n        navigate("/login\", { state: { from: location.pathname } })\n      }\n    }\n    \n    checkAuth()\n  }, [location, navigate])\n  \n  return &lt;Routes&gt;...&lt;/Routes&gt;\n}\n\n// 路由守卫组件\nfunction RequireAuth({ children }) {\n  const isLoggedIn = useAuth()\n  const location = useLocation()\n  \n  if (!isLoggedIn) {\n    return &lt;Navigate to="/login" state={{ from: location }} replace /&gt;\n  }\n  \n  return children\n}\n\n// 使用\n&lt;Route path="/dashboard" element={\n  &lt;RequireAuth&gt;\n    &lt;Dashboard /&gt;\n  &lt;/RequireAuth&gt;\n} /&gt;</code></pre>',
    tags: ['导航守卫', '权限控制', '路由保护']
  },
  'rr-protected': {
    title: '路由保护',
    body: '<p class="lead">创建受保护的路由组件。</p><pre><code>// 角色权限守卫\nfunction RequireRole({ children, role }) {\n  const user = useUser()\n  const location = useLocation()\n  \n  if (!user) {\n    return &lt;Navigate to="/login" state={{ from: location }} /&gt;\n  }\n  \n  if (user.role !== role) {\n    return &lt;Navigate to="/unauthorized" /&gt;\n  }\n  \n  return children\n}\n\n// 使用\n&lt;Route path="/admin" element={\n  &lt;RequireRole role="admin"&gt;\n    &lt;Admin /&gt;\n  &lt;/RequireRole&gt;\n} /&gt;\n\n// 组合守卫\nfunction RequirePermission({ children, permission }) {\n  const hasPermission = usePermission(permission)\n  \n  if (!hasPermission) {\n    return &lt;Navigate to="/forbidden" /&gt;\n  }\n  \n  return children\n}\n\n// 路由配置对象中使用\nconst routes = [\n  {\n    path: "/admin\",\n    element: &lt;RequireRole role="admin"&gt;&lt;Admin /&gt;&lt;/RequireRole&gt;\n  }\n]</code></pre>',
    tags: ['路由保护', '权限', '认证']
  },
  'rr-query-params': {
    title: '查询参数',
    body: '<p class="lead">处理 URL 查询参数。</p><pre><code>import { useLocation, useNavigate } from "react-router-dom"\n\nfunction SearchPage() {\n  const location = useLocation()\n  const navigate = useNavigate()\n  \n  // 获取查询参数\n  const searchParams = new URLSearchParams(location.search)\n  const q = searchParams.get("q") || ""\n  const page = parseInt(searchParams.get("page")) || 1\n  \n  // 更新查询参数\n  const updateQuery = (key, value) => {\n    const newParams = new URLSearchParams(location.search)\n    if (value) {\n      newParams.set(key, value)\n    } else {\n      newParams.delete(key)\n    }\n    navigate({ search: newParams.toString() })\n  }\n  \n  // 批量更新\n  const updateFilters = (filters) => {\n    const newParams = new URLSearchParams(location.search)\n    Object.entries(filters).forEach(([key, value]) => {\n      if (value) newParams.set(key, value)\n      else newParams.delete(key)\n    })\n    navigate({ search: newParams.toString() })\n  }\n  \n  return (\n    &lt;div&gt;\n      &lt;input value={q} onChange={(e) => updateQuery("q", e.target.value)} /&gt;\n      &lt;button onClick={() => updateQuery("page", page + 1)}&gt;下一页&lt;/button&gt;\n    &lt;/div&gt;\n  )\n}</code></pre>',
    tags: ['查询参数', 'URLSearchParams', '搜索']
  },
  'rr-state': {
    title: '路由状态',
    body: '<p class="lead">在路由之间传递状态。</p><pre><code>// 发送状态\nimport { Link, useNavigate } from "react-router-dom"\n\n// 通过 Link 传递\n&lt;Link to="/user/123" state={{ from: "/home", timestamp: Date.now() }}&gt;\n  用户详情\n&lt;/Link&gt;\n\n// 通过 navigate 传递\nconst navigate = useNavigate()\nnavigate("/user/123", {\n  state: { from: "/home", data: { id: 123 } }\n})\n\n// 接收状态\nimport { useLocation } from "react-router-dom"\n\nfunction UserDetail() {\n  const location = useLocation()\n  const state = location.state\n  \n  // 使用状态\n  useEffect(() => {\n    if (state?.from) {\n      console.log("来自:", state.from)\n    }\n  }, [state])\n  \n  return &lt;div&gt;用户详情&lt;/div&gt;\n}\n\n// 重定向时传递状态\n&lt;Navigate to="/login" state={{ from: location.pathname }} /&gt;</code></pre>',
    tags: ['路由状态', 'state', '数据传递']
  },
  'rr-scroll': {
    title: '滚动恢复',
    body: '<p class="lead">控制路由切换时的滚动行为。</p><pre><code>import { useEffect } from "react"\nimport { useLocation } from "react-router-dom"\n\n// 滚动到顶部\nfunction ScrollToTop() {\n  const { pathname } = useLocation()\n  \n  useEffect(() => {\n    window.scrollTo(0, 0)\n  }, [pathname])\n  \n  return null\n}\n\n// 在 App 中使用\nfunction App() {\n  return (\n    &lt;BrowserRouter&gt;\n      &lt;ScrollToTop /&gt;\n      &lt;Routes&gt;...&lt;/Routes&gt;\n    &lt;/BrowserRouter&gt;\n  )\n}\n\n// 自定义滚动行为\nfunction useScrollRestoration() {\n  const location = useLocation()\n  \n  useEffect(() => {\n    const scrollPositions = sessionStorage.getItem("scrollPositions")\n    const positions = scrollPositions ? JSON.parse(scrollPositions) : {}\n    \n    // 保存滚动位置\n    const savePosition = () => {\n      positions[location.pathname] = window.scrollY\n      sessionStorage.setItem("scrollPositions", JSON.stringify(positions))\n    }\n    \n    // 恢复滚动位置\n    if (positions[location.pathname]) {\n      setTimeout(() => {\n        window.scrollTo(0, positions[location.pathname])\n      }, 0)\n    } else {\n      window.scrollTo(0, 0)\n    }\n    \n    window.addEventListener("beforeunload", savePosition)\n    return () => window.removeEventListener("beforeunload", savePosition)\n  }, [location])\n}</code></pre>',
    tags: ['滚动恢复', 'scroll', '用户体验']
  },
  'rr-splat': {
    title: '通配符路由',
    body: '<p class="lead">使用通配符匹配所有路径。</p><pre><code>// 404 路由\n&lt;Route path="*" element={&lt;NotFound /&gt;} /&gt;\n\n// 嵌套通配符\n&lt;Route path="/docs/*" element={&lt;DocsLayout /&gt;}&gt;\n  &lt;Route path="*" element={&lt;DocPage /&gt;} /&gt;\n&lt;/Route&gt;\n\n// 获取通配符匹配的路径\nfunction DocsLayout() {\n  const location = useLocation()\n  // 提取 /docs/ 后面的部分\n  const splat = location.pathname.replace("/docs/", "")\n  \n  return (\n    &lt;div&gt;\n      &lt;Sidebar /&gt;\n      &lt;Outlet context={{ splat }} /&gt;\n    &lt;/div&gt;\n  )\n}\n\n// 使用 useOutletContext 获取\nfunction DocPage() {\n  const { splat } = useOutletContext()\n  return &lt;div&gt;文档路径: {splat}&lt;/div&gt;\n}\n\n// 多级通配符\n&lt;Route path="/files/*" element={&lt;FileBrowser /&gt;} /&gt;</code></pre>',
    tags: ['通配符', '404', 'catch-all']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 React Router 官方文档获取更多信息。</p>',
        tags: ['React Router', '路由']
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

addLink('rr-intro', 'rr-install')
addLink('rr-install', 'rr-basic')
addLink('rr-browser-router', 'rr-routes')
addLink('rr-routes', 'rr-link')
addLink('rr-link', 'rr-navigate')
addLink('rr-navigate', 'rr-outlet')
addLink('rr-dynamic', 'rr-nested')
addLink('rr-nested', 'rr-index')
addLink('rr-index', 'rr-lazy')
addLink('rr-use-params', 'rr-use-location')
addLink('rr-use-location', 'rr-use-navigate')
addLink('rr-use-navigate', 'rr-use-match')
addLink('rr-use-match', 'rr-use-routes')
addLink('rr-navigation-guard', 'rr-protected')
addLink('rr-query-params', 'rr-state')
addLink('rr-state', 'rr-scroll')
addLink('rr-scroll', 'rr-splat')

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