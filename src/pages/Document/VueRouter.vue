<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Vue Router 知识库</h1>
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
          <h2>🛣️ <span class="gradient-text">Vue Router 完全指南</span></h2>
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
          <p>🛣️ Vue.js 官方路由管理器</p>
          <p>✨ 点击节点双向联动 | SPA 路由解决方案</p>
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
          <h3>🔗 Vue Router 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Vue开发者'
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

// ========== Vue Router 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'router-intro', label: 'Vue Router 简介', hot: true },
      { id: 'router-install', label: '安装与配置', hot: true },
      { id: 'router-basic', label: '基本使用', hot: true }
    ]},
  { title: '📋 路由配置', items: [
      { id: 'router-routes', label: '路由定义', hot: true },
      { id: 'router-dynamic', label: '动态路由匹配', hot: true },
      { id: 'router-nested', label: '嵌套路由', hot: true },
      { id: 'router-named', label: '命名路由', hot: true },
      { id: 'router-alias', label: '重定向与别名', hot: true }
    ]},
  { title: '🔧 导航', items: [
      { id: 'router-link', label: 'router-link', hot: true },
      { id: 'router-push', label: '编程式导航', hot: true },
      { id: 'router-history', label: '历史记录模式', hot: true }
    ]},
  { title: '🛡️ 路由守卫', items: [
      { id: 'router-guards', label: '全局守卫', hot: true },
      { id: 'router-per-route', label: '路由独享守卫', hot: true },
      { id: 'router-component', label: '组件内守卫', hot: true },
      { id: 'router-meta', label: '路由元信息', hot: true }
    ]},
  { title: '⚡ 高级特性', items: [
      { id: 'router-lazy', label: '路由懒加载', hot: true },
      { id: 'router-transition', label: '路由过渡动画', hot: true },
      { id: 'router-scroll', label: '滚动行为', hot: true },
      { id: 'router-active', label: '路由高亮', hot: true }
    ]},
  { title: '🔌 组合式 API', items: [
      { id: 'router-uselinker', label: 'useRouter / useRoute', hot: true },
      { id: 'router-on-before', label: 'onBeforeRouteLeave', hot: true },
      { id: 'router-params', label: '路由参数传递', hot: true }
    ]}
])

const selectedId = ref('router-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Vue Router 内容映射表 ==========
const contentMap = {
  'router-intro': {
    title: 'Vue Router 简介',
    body: '<p class="lead">Vue Router 是 Vue.js 的官方路由管理器，用于构建单页面应用（SPA），实现页面间的导航和视图切换。</p><h3>核心特点</h3><ul><li><strong>声明式路由</strong>：通过配置路由表定义页面映射</li><li><strong>嵌套路由</strong>：支持页面嵌套</li><li><strong>路由守卫</strong>：控制页面访问权限</li><li><strong>懒加载</strong>：按需加载组件</li><li><strong>过渡动画</strong>：页面切换动画</li></ul><div class="note">💡 Vue Router 是 Vue 生态的核心库之一，与 Vue 深度集成。</div>',
    tags: ['路由', 'SPA', '导航']
  },
  'router-install': {
    title: '安装与配置',
    body: '<p class="lead">Vue Router 可以通过 npm 安装。</p><pre><code>// 安装 Vue Router 4（Vue 3）\nnpm install vue-router@4\n\n// 安装 Vue Router 3（Vue 2）\nnpm install vue-router@3\n\n// 创建路由器实例\nimport { createRouter, createWebHistory } from "vue-router"\nimport Home from "./views/Home.vue"\n\nconst routes = [\n  { path: "/", component: Home },\n  { path: "/about", component: () => import("./views/About.vue") }\n]\n\nconst router = createRouter({\n  history: createWebHistory(),\n  routes\n})\n\n// 在 Vue 应用中使用\nimport { createApp } from "vue"\nimport App from "./App.vue"\n\nconst app = createApp(App)\napp.use(router)\napp.mount("#app")</code></pre>',
    tags: ['安装', '配置', 'createRouter']
  },
  'router-basic': {
    title: '基本使用',
    body: '<p class="lead">在模板中使用路由组件。</p><pre><code>&lt;!-- 路由链接 --&gt;\n&lt;router-link to="/"&gt;首页&lt;/router-link&gt;\n&lt;router-link to="/about"&gt;关于&lt;/router-link&gt;\n\n&lt;!-- 路由视图 --&gt;\n&lt;router-view&gt;&lt;/router-view&gt;\n\n// 在组合式 API 中使用\n&lt;script setup&gt;\nimport { useRouter, useRoute } from "vue-router"\n\nconst router = useRouter()\nconst route = useRoute()\n\n// 导航\nrouter.push("/about")\n\n// 获取当前路由信息\nconsole.log(route.path)\nconsole.log(route.params)\nconsole.log(route.query)\n&lt;/script&gt;</code></pre>',
    tags: ['router-link', 'router-view', 'useRouter']
  },
  'router-routes': {
    title: '路由定义',
    body: '<p class="lead">定义路由规则，将 URL 映射到组件。</p><pre><code>const routes = [\n  {\n    path: "/",\n    name: "home",\n    component: Home\n  },\n  {\n    path: "/about",\n    name: "about",\n    component: () => import("./views/About.vue")\n  },\n  {\n    path: "/user",\n    component: () => import("./views/User.vue"),\n    children: [\n      { path: "profile", component: UserProfile },\n      { path: "settings", component: UserSettings }\n    ]\n  },\n  {\n    path: "/:pathMatch(.*)*",\n    name: "NotFound",\n    component: NotFound\n  }\n]</code></pre>',
    tags: ['routes', '路由定义', '组件映射']
  },
  'router-dynamic': {
    title: '动态路由匹配',
    body: '<p class="lead">使用动态路径参数匹配路由。</p><pre><code>// 定义动态路由\nconst routes = [\n  { path: "/user/:id", component: User },\n  { path: "/post/:postId/comment/:commentId", component: PostComment }\n]\n\n// 访问 /user/123 -> 参数 { id: "123" }\n// 访问 /post/1/comment/2 -> 参数 { postId: "1", commentId: "2" }\n\n// 获取参数\n&lt;script setup&gt;\nimport { useRoute } from "vue-router"\n\nconst route = useRoute()\nconsole.log(route.params.id)\n\n// 监听参数变化\nwatch(() => route.params.id, (newId) => {\n  // 响应参数变化\n})\n&lt;/script&gt;\n\n// 可选参数\n{ path: "/user/:id?" }\n\n// 正则匹配\n{ path: "/user/:id(\\\\d+)" }  // 只匹配数字\n{ path: "/:path(.*)" }       // 匹配所有路径</code></pre>',
    tags: ['动态路由', 'params', '路径参数']
  },
  'router-nested': {
    title: '嵌套路由',
    body: '<p class="lead">在路由组件中包含子路由视图。</p><pre><code>// 父组件 User.vue\n&lt;template&gt;\n  &lt;div&gt;\n    &lt;h1&gt;用户中心&lt;/h1&gt;\n    &lt;router-link to="/user/profile"&gt;个人资料&lt;/router-link&gt;\n    &lt;router-link to="/user/settings"&gt;设置&lt;/router-link&gt;\n    &lt;router-view /&gt;\n  &lt;/div&gt;\n&lt;/template&gt;\n\n// 路由配置\nconst routes = [\n  {\n    path: "/user",\n    component: User,\n    children: [\n      { path: "", redirect: "profile" },\n      { path: "profile", component: UserProfile },\n      { path: "settings", component: UserSettings }\n    ]\n  }\n]\n\n// 命名路由出口\n&lt;router-view name="sidebar" /&gt;\n\n// 配置\n{\n  path: "/dashboard",\n  components: {\n    default: Dashboard,\n    sidebar: Sidebar\n  }\n}</code></pre>',
    tags: ['嵌套路由', 'children', '命名视图']
  },
  'router-named': {
    title: '命名路由',
    body: '<p class="lead">为路由命名，方便导航。</p><pre><code>// 定义命名路由\nconst routes = [\n  {\n    path: "/user/:id",\n    name: "user",\n    component: User\n  },\n  {\n    path: "/about",\n    name: "about",\n    component: About\n  }\n]\n\n// 使用命名路由\n&lt;router-link :to="{ name: "user", params: { id: 123 } }"&gt;用户&lt;/router-link&gt;\n\n// 编程式导航\nrouter.push({ name: "user", params: { id: 123 } })\n\n// 命名视图\n&lt;router-view name="header" /&gt;\n&lt;router-view /&gt;\n\n{\n  path: "/",\n  components: {\n    default: Home,\n    header: Header\n  }\n}</code></pre>',
    tags: ['命名路由', 'name', '命名视图']
  },
  'router-alias': {
    title: '重定向与别名',
    body: '<p class="lead">重定向和别名用于 URL 映射。</p><pre><code>// 重定向\nconst routes = [\n  { path: "/home", redirect: "/" },\n  { path: "/old", redirect: { name: "new" } },\n  { path: "/search", redirect: to => {\n    return { path: "/search-results", query: { q: to.query.q } }\n  }}\n]\n\n// 别名\nconst routes = [\n  { path: "/", component: Home, alias: "/home" },\n  { path: "/user", component: User, alias: ["/member", "/profile"] }\n]\n\n// 使用\n// 访问 /home 和 / 都会显示 Home 组件\n// 访问 /member 和 /user 都会显示 User 组件</code></pre>',
    tags: ['重定向', '别名', 'redirect']
  },
  'router-link': {
    title: 'router-link',
    body: '<p class="lead">router-link 组件用于导航链接。</p><pre><code>&lt;!-- 基本用法 --&gt;\n&lt;router-link to="/"&gt;首页&lt;/router-link&gt;\n\n&lt;!-- 命名路由 --&gt;\n&lt;router-link :to="{ name: "user", params: { id: 123 } }"&gt;用户&lt;/router-link&gt;\n\n&lt;!-- 查询参数 --&gt;\n&lt;router-link :to="{ path: "/search", query: { q: "vue" } }"&gt;搜索&lt;/router-link&gt;\n\n&lt;!-- 替换历史记录 --&gt;\n&lt;router-link to="/about" replace&gt;关于&lt;/router-link&gt;\n\n&lt;!-- 自定义激活类 --&gt;\n&lt;router-link to="/" active-class="active"&gt;首页&lt;/router-link&gt;\n\n&lt;!-- 自定义样式 --&gt;\n&lt;router-link to="/" custom v-slot="{ navigate, isActive }"&gt;\n  &lt;button @click="navigate" :class="{ active: isActive }"&gt;首页&lt;/button&gt;\n&lt;/router-link&gt;</code></pre>',
    tags: ['router-link', '导航链接', 'to']
  },
  'router-push': {
    title: '编程式导航',
    body: '<p class="lead">使用 JavaScript 代码进行导航。</p><pre><code>import { useRouter } from "vue-router"\n\nconst router = useRouter()\n\n// 字符串路径\nrouter.push("/about")\n\n// 路径对象\nrouter.push({ path: "/about" })\n\n// 命名路由\nrouter.push({ name: "user", params: { id: 123 } })\n\n// 带查询参数\nrouter.push({ path: "/search", query: { q: "vue" } })\n\n// 替换当前历史记录\nrouter.replace("/about")\n\n// 前进/后退\nrouter.go(1)   // 前进\nrouter.go(-1)  // 后退\nrouter.back()  // 后退\nrouter.forward() // 前进</code></pre>',
    tags: ['编程式导航', 'push', 'replace']
  },
  'router-history': {
    title: '历史记录模式',
    body: '<p class="lead">Vue Router 支持两种历史记录模式。</p><pre><code>// HTML5 历史模式（推荐）\nimport { createRouter, createWebHistory } from "vue-router"\n\nconst router = createRouter({\n  history: createWebHistory(),\n  routes\n})\n\n// 需要服务器配置支持\n// Nginx 配置\nlocation / {\n  try_files $uri $uri/ /index.html;\n}\n\n// Hash 模式（兼容性好）\nimport { createRouter, createWebHashHistory } from "vue-router"\n\nconst router = createRouter({\n  history: createWebHashHistory(),\n  routes\n})\n\n// 地址示例\n// HTML5: https://example.com/user/1\n// Hash: https://example.com/#/user/1</code></pre>',
    tags: ['历史模式', 'createWebHistory', 'Hash模式']
  },
  'router-guards': {
    title: '全局守卫',
    body: '<p class="lead">全局守卫控制路由导航流程。</p><pre><code>// 全局前置守卫\nrouter.beforeEach((to, from, next) => {\n  console.log("beforeEach", to, from)\n  \n  if (to.meta.requiresAuth && !isLoggedIn()) {\n    next({ name: "login" })\n  } else {\n    next()\n  }\n})\n\n// 全局解析守卫\nrouter.beforeResolve((to, from, next) => {\n  console.log("beforeResolve")\n  next()\n})\n\n// 全局后置钩子\nrouter.afterEach((to, from) => {\n  console.log("afterEach", to.path)\n  // 更新页面标题\n  document.title = to.meta.title || "My App"\n})\n\n// 使用 next 的多种方式\nnext()           // 继续导航\nnext(false)      // 中止导航\nnext("/login")   // 重定向\nnext({ name: "login" }) // 重定向到命名路由</code></pre>',
    tags: ['全局守卫', 'beforeEach', 'afterEach']
  },
  'router-per-route': {
    title: '路由独享守卫',
    body: '<p class="lead">在单个路由配置中定义守卫。</p><pre><code>const routes = [\n  {\n    path: "/admin",\n    component: Admin,\n    beforeEnter: (to, from, next) => {\n      if (isAdmin()) {\n        next()\n      } else {\n        next("/")\n      }\n    }\n  },\n  {\n    path: "/settings",\n    component: Settings,\n    beforeEnter: [checkAuth, checkPermission]  // 数组形式\n  }\n]\n\nfunction checkAuth(to, from, next) {\n  if (isLoggedIn()) next()\n  else next("/login")\n}\n\nfunction checkPermission(to, from, next) {\n  if (hasPermission()) next()\n  else next("/forbidden")\n}</code></pre>',
    tags: ['路由守卫', 'beforeEnter', '独享守卫']
  },
  'router-component': {
    title: '组件内守卫',
    body: '<p class="lead">在路由组件内部定义守卫。</p><pre><code>&lt;script setup&gt;\nimport { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router"\n\n// 组件内守卫\nonBeforeRouteLeave((to, from, next) => {\n  const answer = confirm("确定要离开吗？")\n  if (answer) next()\n  else next(false)\n})\n\nonBeforeRouteUpdate((to, from, next) => {\n  // 在同一路由下参数变化时触发\n  fetchData(to.params.id)\n  next()\n})\n&lt;/script&gt;\n\n// 选项式 API\nexport default {\n  beforeRouteEnter(to, from, next) {\n    // 无法访问 this\n    next(vm => {\n      // 可以访问组件实例\n    })\n  },\n  beforeRouteUpdate(to, from, next) {\n    // 可以访问 this\n    next()\n  },\n  beforeRouteLeave(to, from, next) {\n    next()\n  }\n}</code></pre>',
    tags: ['组件内守卫', 'onBeforeRouteLeave', 'beforeRouteEnter']
  },
  'router-meta': {
    title: '路由元信息',
    body: '<p class="lead">在路由配置中添加自定义元数据。</p><pre><code>const routes = [\n  {\n    path: "/admin",\n    component: Admin,\n    meta: { requiresAuth: true, role: "admin" }\n  },\n  {\n    path: "/dashboard",\n    component: Dashboard,\n    meta: { title: "仪表盘", requiresAuth: true }\n  }\n]\n\n// 在守卫中使用\nrouter.beforeEach((to, from, next) => {\n  // 检查是否需要认证\n  if (to.meta.requiresAuth && !isLoggedIn()) {\n    next("/login\")\n  }\n  \n  // 检查角色权限\n  if (to.meta.role && user.role !== to.meta.role) {\n    next(\"/forbidden\")\n  }\n  \n  // 设置页面标题\n  if (to.meta.title) {\n    document.title = to.meta.title\n  }\n  \n  next()\n})\n\n// 在组件中获取元信息\nconst route = useRoute()\nconsole.log(route.meta.requiresAuth)</code></pre>',
    tags: ['元信息', 'meta', '权限控制']
  },
  'router-lazy': {
    title: '路由懒加载',
    body: '<p class="lead">按需加载路由组件，优化首屏加载速度。</p><pre><code>// 基本懒加载\nconst routes = [\n  {\n    path: "/about",\n    component: () => import("./views/About.vue")\n  },\n  {\n    path: "/user",\n    component: () => import("./views/User.vue")\n  }\n]\n\n// 命名 chunk\nconst routes = [\n  {\n    path: "/admin\",\n    component: () => import(/* webpackChunkName: "admin" */ "./views/Admin.vue")\n  }\n]\n\n// 分组打包\nconst routes = [\n  {\n    path: "/dashboard",\n    component: () => import(/* webpackChunkName: "group-dashboard" */ "./views/Dashboard.vue")\n  },\n  {\n    path: "/analytics",\n    component: () => import(/* webpackChunkName: "group-dashboard" */ "./views/Analytics.vue")\n  }\n]\n\n// 加载状态\nconst User = defineAsyncComponent(() => import("./views/User.vue"))</code></pre>',
    tags: ['懒加载', '代码分割', 'import']
  },
  'router-transition': {
    title: '路由过渡动画',
    body: '<p class="lead">为路由切换添加过渡动画。</p><pre><code>&lt;!-- 基本过渡 --&gt;\n&lt;router-view v-slot="{ Component }"&gt;\n  &lt;transition name="fade" mode="out-in"&gt;\n    &lt;component :is="Component" /&gt;\n  &lt;/transition&gt;\n&lt;/router-view&gt;\n\n&lt;style&gt;\n.fade-enter-active, .fade-leave-active {\n  transition: opacity 0.3s ease;\n}\n.fade-enter-from, .fade-leave-to {\n  opacity: 0;\n}\n&lt;/style&gt;\n\n&lt;!-- 基于路由的过渡 --&gt;\n&lt;router-view v-slot="{ Component, route }"&gt;\n  &lt;transition :name="route.meta.transition" mode="out-in"&gt;\n    &lt;component :is="Component" /&gt;\n  &lt;/transition&gt;\n&lt;/router-view&gt;\n\n// 路由配置\n{\n  path: "/",\n  component: Home,\n  meta: { transition: "slide" }\n}</code></pre>',
    tags: ['过渡动画', 'transition', '页面切换']
  },
  'router-scroll': {
    title: '滚动行为',
    body: '<p class="lead">控制路由切换时的滚动位置。</p><pre><code>const router = createRouter({\n  history: createWebHistory(),\n  routes,\n  scrollBehavior(to, from, savedPosition) {\n    // 返回滚动位置\n    if (savedPosition) {\n      return savedPosition\n    } else if (to.hash) {\n      return { el: to.hash, behavior: "smooth" }\n    } else {\n      return { top: 0, behavior: "smooth" }\n    }\n  }\n})\n\n// 延迟滚动\nscrollBehavior(to, from, savedPosition) {\n  return new Promise((resolve) => {\n    setTimeout(() => {\n      resolve({ top: 0 })\n    }, 300)\n  })\n}\n\n// 相对于特定元素\nscrollBehavior(to, from, savedPosition) {\n  return { el: "#app", top: 0 }\n}</code></pre>',
    tags: ['滚动行为', 'scrollBehavior', '滚动位置']
  },
  'router-active': {
    title: '路由高亮',
    body: '<p class="lead">自定义路由链接的激活样式。</p><pre><code>&lt;!-- 激活类名 --&gt;\n&lt;router-link to="/" active-class="active"&gt;首页&lt;/router-link&gt;\n&lt;router-link to="/about" exact-active-class="exact-active"&gt;关于&lt;/router-link&gt;\n\n// 全局配置\nconst router = createRouter({\n  history: createWebHistory(),\n  routes,\n  linkActiveClass: "active-link",\n  linkExactActiveClass: "exact-active-link"\n})\n\n&lt;style&gt;\n.active-link {\n  color: #8B5CF6;\n  font-weight: bold;\n}\n.exact-active-link {\n  border-bottom: 2px solid #8B5CF6;\n}\n&lt;/style&gt;</code></pre>',
    tags: ['路由高亮', 'active-class', '激活样式']
  },
  'router-uselinker': {
    title: 'useRouter / useRoute',
    body: '<p class="lead">在组合式 API 中获取路由实例和当前路由信息。</p><pre><code>&lt;script setup&gt;\nimport { useRouter, useRoute } from "vue-router"\nimport { watch } from "vue"\n\nconst router = useRouter()\nconst route = useRoute()\n\n// 导航\nconst goToAbout = () => {\n  router.push("/about\")\n}\n\n// 获取参数\nconsole.log(route.params.id)\nconsole.log(route.query.page)\nconsole.log(route.path)\nconsole.log(route.name)\n\n// 监听路由变化\nwatch(() => route.params.id, (newId) => {\n  fetchData(newId)\n})\n\n// 监听整个路由\nwatch(route, (newRoute) => {\n  console.log(\"路由变化\", newRoute.path)\n})\n&lt;/script&gt;</code></pre>',
    tags: ['useRouter', 'useRoute', '组合式API']
  },
  'router-on-before': {
    title: 'onBeforeRouteLeave',
    body: '<p class="lead">组件内路由守卫的组合式 API 版本。</p><pre><code>&lt;script setup&gt;\nimport { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router"\nimport { ref } from "vue"\n\nconst hasUnsavedChanges = ref(false)\n\n// 离开守卫\nonBeforeRouteLeave((to, from, next) => {\n  if (hasUnsavedChanges.value) {\n    const answer = confirm("有未保存的更改，确定要离开吗？")\n    if (answer) next()\n    else next(false)\n  } else {\n    next()\n  }\n})\n\n// 更新守卫（同一路由参数变化）\nonBeforeRouteUpdate(async (to, from, next) => {\n  // 获取新数据\n  await fetchData(to.params.id)\n  next()\n})\n&lt;/script&gt;</code></pre>',
    tags: ['onBeforeRouteLeave', 'onBeforeRouteUpdate', '组件守卫']
  },
  'router-params': {
    title: '路由参数传递',
    body: '<p class="lead">多种方式传递路由参数。</p><pre><code>// 1. 路径参数\n&lt;router-link :to="{ name: "user", params: { id: 123 } }"&gt;用户&lt;/router-link&gt;\n\n// 2. 查询参数\n&lt;router-link :to="{ path: "/search", query: { q: "vue", page: 1 } }"&gt;搜索&lt;/router-link&gt;\n\n// 3. 哈希值\n&lt;router-link :to="{ path: "/about", hash: "#section1" }"&gt;关于&lt;/router-link&gt;\n\n// 4. 状态传递（不显示在 URL）\nrouter.push({\n  name: "user",\n  params: { id: 123 },\n  state: { fromPage: "home" }\n})\n\n// 获取状态\nconst route = useRoute()\nconsole.log(history.state.fromPage)\n\n// 5. Props 解耦\n{\n  path: "/user/:id",\n  component: User,\n  props: true  // 将 params 作为 props 传递\n}\n\n// 组件中直接接收 props\ndefineProps([\"id\"])</code></pre>',
    tags: ['参数传递', 'query', 'props']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Vue Router 官方文档获取更多信息。</p>',
        tags: ['Vue Router', '路由']
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

addLink('router-intro', 'router-install')
addLink('router-install', 'router-basic')
addLink('router-routes', 'router-dynamic')
addLink('router-dynamic', 'router-nested')
addLink('router-nested', 'router-named')
addLink('router-named', 'router-alias')
addLink('router-link', 'router-push')
addLink('router-push', 'router-history')
addLink('router-guards', 'router-per-route')
addLink('router-per-route', 'router-component')
addLink('router-component', 'router-meta')
addLink('router-lazy', 'router-transition')
addLink('router-transition', 'router-scroll')
addLink('router-scroll', 'router-active')
addLink('router-uselinker', 'router-on-before')
addLink('router-on-before', 'router-params')

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