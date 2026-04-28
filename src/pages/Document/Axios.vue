<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Axios 知识库</h1>
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
          <h2>⚡ <span class="gradient-text">Axios 完全指南</span></h2>
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
          <p>⚡ 基于 Promise 的 HTTP 客户端</p>
          <p>✨ 点击节点双向联动 | 浏览器 & Node.js</p>
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
          <h3>🔗 Axios 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Axios用户'
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

// ========== Axios 导航数据 ==========
const navSections = ref([
  { title: '📖 基础入门', items: [
      { id: 'axios-intro', label: 'Axios 简介', hot: true },
      { id: 'axios-install', label: '安装与配置', hot: true },
      { id: 'axios-basic', label: '基本请求', hot: true }
    ]},
  { title: '🔧 请求方法', items: [
      { id: 'axios-get', label: 'GET 请求', hot: true },
      { id: 'axios-post', label: 'POST 请求', hot: true },
      { id: 'axios-put', label: 'PUT 请求', hot: true },
      { id: 'axios-delete', label: 'DELETE 请求', hot: true }
    ]},
  { title: '⚙️ 配置与实例', items: [
      { id: 'axios-config', label: '请求配置', hot: true },
      { id: 'axios-instance', label: '创建实例', hot: true },
      { id: 'axios-defaults', label: '全局默认配置', hot: true }
    ]},
  { title: '🔌 拦截器', items: [
      { id: 'axios-interceptors', label: '拦截器概述', hot: true },
      { id: 'axios-request-interceptor', label: '请求拦截器', hot: true },
      { id: 'axios-response-interceptor', label: '响应拦截器', hot: true }
    ]},
  { title: '🔄 高级特性', items: [
      { id: 'axios-concurrent', label: '并发请求', hot: true },
      { id: 'axios-cancel', label: '取消请求', hot: true },
      { id: 'axios-transform', label: '转换数据', hot: true },
      { id: 'axios-csrf', label: 'CSRF 防护', hot: true }
    ]},
  { title: '⚠️ 错误处理', items: [
      { id: 'axios-error', label: '错误处理', hot: true },
      { id: 'axios-retry', label: '请求重试', hot: true }
    ]}
])

const selectedId = ref('axios-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Axios 内容映射表 ==========
const contentMap = {
  'axios-intro': {
    title: 'Axios 简介',
    body: '<p class="lead">Axios 是一个基于 Promise 的 HTTP 客户端，用于浏览器和 Node.js 环境，是目前最流行的 HTTP 请求库之一。</p><h3>核心特性</h3><ul><li><strong>Promise API</strong>：支持 async/await，避免回调地狱</li><li><strong>请求/响应拦截</strong>：在请求发送前或响应返回后进行处理</li><li><strong>自动转换 JSON</strong>：自动解析 JSON 响应数据</li><li><strong>取消请求</strong>：支持取消正在进行的请求</li><li><strong>客户端支持</strong>：浏览器端支持 XHR，Node.js 端支持 http</li><li><strong>CSRF 防护</strong>：自动携带 cookie 和 CSRF token</li></ul><div class="note">💡 Axios 由 GitHub 用户 "mzabriskie" 创建，现已成为前端开发的标准工具。</div>',
    tags: ['HTTP客户端', 'Promise', '请求库']
  },
  'axios-install': {
    title: '安装与配置',
    body: '<p class="lead">Axios 可以通过多种方式安装，支持浏览器和 Node.js 环境。</p><pre><code># npm 安装\nnpm install axios\n\n# yarn 安装\nyarn add axios\n\n# pnpm 安装\npnpm add axios\n\n# CDN 引入（浏览器）\n&lt;script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"&gt;&lt;/script&gt;\n\n# 在 Node.js 中使用\nconst axios = require("axios")\n\n# ES Module 导入\nimport axios from "axios"\n\n# 检查安装\naxios.defaults.baseURL = "https://api.example.com"</code></pre>',
    tags: ['安装', 'npm', 'CDN']
  },
  'axios-basic': {
    title: '基本请求',
    body: '<p class="lead">Axios 最基本的使用方式，发送 GET 请求。</p><pre><code>// 基本 GET 请求\naxios.get("/api/users")\n  .then(response => {\n    console.log(response.data)\n  })\n  .catch(error => {\n    console.error(error)\n  })\n\n// async/await 方式\nasync function getUsers() {\n  try {\n    const response = await axios.get("/api/users")\n    console.log(response.data)\n  } catch (error) {\n    console.error(error)\n  }\n}\n\n// 响应结构\n// {\n//   data: {},      // 服务器返回的数据\n//   status: 200,   // HTTP 状态码\n//   statusText: "OK", // 状态消息\n//   headers: {},   // 响应头\n//   config: {},    // 请求配置\n//   request: {}    // 请求对象\n// }</code></pre>',
    tags: ['基本请求', 'GET', 'async/await']
  },
  'axios-get': {
    title: 'GET 请求',
    body: '<p class="lead">发送 GET 请求获取数据，支持 URL 参数和配置选项。</p><pre><code>// 基本 GET 请求\naxios.get("/api/users")\n\n// 带 URL 参数\naxios.get("/api/users", {\n  params: {\n    id: 123,\n    name: "John",\n    page: 1,\n    limit: 10\n  }\n})\n// 实际请求: /api/users?id=123&name=John&page=1&limit=10\n\n// 使用模板字符串\nconst userId = 123\naxios.get(`/api/users/${userId}`)\n\n// 带请求头\naxios.get("/api/users", {\n  headers: {\n    "Authorization": "Bearer token123",\n    "Accept": "application/json"\n  }\n})\n\n// 超时设置\naxios.get("/api/slow", {\n  timeout: 5000  // 5秒超时\n})\n\n// 完整示例\nasync function fetchUser(id) {\n  try {\n    const response = await axios.get(`/api/users/${id}`, {\n      params: { include: "posts" },\n      headers: { "X-Custom-Header": "value" }\n    })\n    return response.data\n  } catch (error) {\n    if (error.response) {\n      console.log(error.response.status)\n      console.log(error.response.data)\n    }\n    throw error\n  }\n}</code></pre>',
    tags: ['GET', 'params', '查询参数']
  },
  'axios-post': {
    title: 'POST 请求',
    body: '<p class="lead">发送 POST 请求创建资源，数据放在请求体中。</p><pre><code>// 基本 POST 请求\naxios.post("/api/users", {\n  name: "Alice",\n  email: "alice@example.com",\n  age: 25\n})\n\n// 发送表单数据（application/x-www-form-urlencoded）\nconst params = new URLSearchParams()\nparams.append("name", "Bob")\nparams.append("email", "bob@example.com")\naxios.post("/api/users", params)\n\n// 发送 FormData（文件上传）\nconst formData = new FormData()\nformData.append("file", fileInput.files[0])\nformData.append("name", "avatar")\naxios.post("/api/upload", formData, {\n  headers: {\n    "Content-Type": "multipart/form-data"\n  }\n})\n\n// 设置请求头\naxios.post("/api/users", data, {\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer token"\n  }\n})\n\n// async/await 方式\nasync function createUser(userData) {\n  try {\n    const response = await axios.post("/api/users", userData)\n    console.log("创建成功:", response.data)\n    return response.data\n  } catch (error) {\n    console.error("创建失败:", error.response?.data)\n  }\n}\n\n// 上传进度监听\naxios.post("/api/upload", formData, {\n  onUploadProgress: (progressEvent) => {\n    const percent = (progressEvent.loaded / progressEvent.total) * 100\n    console.log(`上传进度: ${percent}%`)\n  }\n})</code></pre>',
    tags: ['POST', '表单', '文件上传']
  },
  'axios-put': {
    title: 'PUT 请求',
    body: '<p class="lead">发送 PUT 请求完整更新资源。</p><pre><code>// 完整更新用户\naxios.put("/api/users/123", {\n  name: "Updated Name",\n  email: "updated@example.com",\n  age: 30\n})\n\n// 带配置的 PUT\naxios.put("/api/users/123", updateData, {\n  headers: { "Authorization": "Bearer token" },\n  timeout: 5000\n})\n\n// async/await\nasync function updateUser(userId, data) {\n  try {\n    const response = await axios.put(`/api/users/${userId}`, data)\n    console.log("更新成功:", response.data)\n    return response.data\n  } catch (error) {\n    if (error.response?.status === 404) {\n      console.log("用户不存在")\n    }\n    throw error\n  }\n}</code></pre>',
    tags: ['PUT', '更新', '完整更新']
  },
  'axios-delete': {
    title: 'DELETE 请求',
    body: '<p class="lead">发送 DELETE 请求删除资源。</p><pre><code>// 删除用户\naxios.delete("/api/users/123")\n\n// 带 URL 参数的 DELETE\naxios.delete("/api/users", {\n  params: { id: 123 }\n})\n\n// 带请求体的 DELETE（不常见但支持）\naxios.delete("/api/users", {\n  data: { ids: [1, 2, 3] }\n})\n\n// async/await\nasync function deleteUser(userId) {\n  try {\n    await axios.delete(`/api/users/${userId}`)\n    console.log("删除成功")\n    return true\n  } catch (error) {\n    if (error.response?.status === 404) {\n      console.log("用户不存在")\n    }\n    return false\n  }\n}\n\n// 批量删除\nasync function batchDelete(ids) {\n  try {\n    const response = await axios.delete("/api/users/batch", {\n      data: { ids }\n    })\n    return response.data\n  } catch (error) {\n    console.error(error)\n  }\n}</code></pre>',
    tags: ['DELETE', '删除', '资源移除']
  },
  'axios-config': {
    title: '请求配置',
    body: '<p class="lead">Axios 请求配置选项详解。</p><pre><code>const config = {\n  // 请求 URL\n  url: "/user",\n  \n  // 请求方法\n  method: "get",\n  \n  // 基础 URL\n  baseURL: "https://api.example.com",\n  \n  // 请求头\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer token"\n  },\n  \n  // URL 参数\n  params: { id: 123 },\n  \n  // 请求体数据\n  data: { name: "Alice" },\n  \n  // 超时时间（毫秒）\n  timeout: 10000,\n  \n  // 是否携带凭证（cookies）\n  withCredentials: true,\n  \n  // 响应数据类型\n  responseType: "json", // json, text, blob, arraybuffer, stream\n  \n  // 响应编码\n  responseEncoding: "utf8",\n  \n  // 最大重定向次数\n  maxRedirects: 5,\n  \n  // 验证 SSL 证书\n  validateStatus: function(status) {\n    return status >= 200 && status &lt; 300\n  },\n  \n  // 代理服务器（Node.js）\n  proxy: {\n    host: "127.0.0.1",\n    port: 8080\n  },\n  \n  // 请求进度（浏览器）\n  onUploadProgress: (progressEvent) => {},\n  onDownloadProgress: (progressEvent) => {}\n}\n\naxios(config)</code></pre>',
    tags: ['配置', 'options', '请求设置']
  },
  'axios-instance': {
    title: '创建实例',
    body: '<p class="lead">创建自定义的 Axios 实例，避免全局配置污染。</p><pre><code>// 创建实例\nconst apiClient = axios.create({\n  baseURL: "https://api.example.com",\n  timeout: 5000,\n  headers: {\n    "Content-Type": "application/json"\n  }\n})\n\n// 使用实例\napiClient.get("/users")\napiClient.post("/users", { name: "Alice" })\n\n// 不同 API 使用不同实例\nconst userApi = axios.create({\n  baseURL: "https://user-api.example.com",\n  timeout: 10000\n})\n\nconst productApi = axios.create({\n  baseURL: "https://product-api.example.com",\n  timeout: 3000\n})\n\n// 为实例添加拦截器\nuserApi.interceptors.request.use(config => {\n  config.headers["X-User-Token"] = getUserToken()\n  return config\n})\n\n// 实际应用\nconst githubApi = axios.create({\n  baseURL: "https://api.github.com",\n  headers: { "Accept": "application/vnd.github.v3+json" }\n})\n\nconst myApi = axios.create({\n  baseURL: process.env.VUE_APP_API_URL,\n  withCredentials: true\n})</code></pre>',
    tags: ['实例', 'create', '多实例']
  },
  'axios-defaults': {
    title: '全局默认配置',
    body: '<p class="lead">设置 Axios 全局默认配置，影响所有请求。</p><pre><code>// 设置基础 URL\naxios.defaults.baseURL = "https://api.example.com"\n\n// 设置通用请求头\naxios.defaults.headers.common["Authorization"] = "Bearer token"\naxios.defaults.headers.post["Content-Type"] = "application/json"\n\n// 设置超时\naxios.defaults.timeout = 10000\n\n// 设置凭证\naxios.defaults.withCredentials = true\n\n// 设置响应类型\naxios.defaults.responseType = "json"\n\n// 自定义验证状态\naxios.defaults.validateStatus = status => {\n  return status >= 200 && status &lt; 500\n}\n\n// 动态修改（如登录后设置 token）\nfunction setAuthToken(token) {\n  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`\n}\n\n// 移除 token\nfunction removeAuthToken() {\n  delete axios.defaults.headers.common["Authorization"]\n}\n\n// 注意：实例的默认配置优先级高于全局配置</code></pre>',
    tags: ['默认配置', 'defaults', '全局设置']
  },
  'axios-interceptors': {
    title: '拦截器概述',
    body: '<p class="lead">拦截器在请求发送前或响应返回后执行，用于统一处理逻辑。</p><pre><code>// 请求拦截器\naxios.interceptors.request.use(\n  config => {\n    // 发送请求前做什么\n    console.log("请求发送前:", config.url)\n    return config\n  },\n  error => {\n    // 请求错误时做什么\n    return Promise.reject(error)\n  }\n)\n\n// 响应拦截器\naxios.interceptors.response.use(\n  response => {\n    // 2xx 状态码触发\n    console.log("响应成功:", response.status)\n    return response\n  },\n  error => {\n    // 非 2xx 状态码触发\n    console.log("响应错误:", error.response?.status)\n    return Promise.reject(error)\n  }\n)\n\n// 移除拦截器\nconst interceptorId = axios.interceptors.request.use(config => config)\naxios.interceptors.request.eject(interceptorId)\n\n// 实例的拦截器\nconst instance = axios.create()\ninstance.interceptors.request.use(config => config)</code></pre>',
    tags: ['拦截器', 'interceptors', '中间件']
  },
  'axios-request-interceptor': {
    title: '请求拦截器',
    body: '<p class="lead">请求拦截器在请求发送前执行，常用于添加 token、日志等。</p><pre><code>// 添加认证 token\naxios.interceptors.request.use(config => {\n  const token = localStorage.getItem("token")\n  if (token) {\n    config.headers.Authorization = `Bearer ${token}`\n  }\n  return config\n})\n\n// 请求日志\naxios.interceptors.request.use(config => {\n  console.log(`[${config.method?.toUpperCase()}] ${config.url}`, config.data)\n  return config\n})\n\n// 请求 loading 状态\nlet requestCount = 0\nfunction showLoading() { /* 显示 loading */ }\nfunction hideLoading() { /* 隐藏 loading */ }\n\naxios.interceptors.request.use(config => {\n  if (requestCount === 0) showLoading()\n  requestCount++\n  return config\n})\n\n// 添加时间戳防缓存\naxios.interceptors.request.use(config => {\n  if (config.method === "get") {\n    config.params = {\n      ...config.params,\n      _t: Date.now()\n    }\n  }\n  return config\n})\n\n// 修改请求数据格式\naxios.interceptors.request.use(config => {\n  if (config.data && config.headers["Content-Type"] === "application/x-www-form-urlencoded") {\n    config.data = qs.stringify(config.data)\n  }\n  return config\n})</code></pre>',
    tags: ['请求拦截器', 'token', '日志']
  },
  'axios-response-interceptor': {
    title: '响应拦截器',
    body: '<p class="lead">响应拦截器在响应返回后执行，用于统一处理数据、错误等。</p><pre><code>// 统一处理响应数据\naxios.interceptors.response.use(\n  response => {\n    // 只返回 data 部分\n    return response.data\n  },\n  error => {\n    return Promise.reject(error)\n  }\n)\n\n// 统一错误处理\naxios.interceptors.response.use(\n  response => response,\n  error => {\n    if (error.response) {\n      switch (error.response.status) {\n        case 401:\n          // 未授权，跳转登录\n          router.push("/login")\n          break\n        case 403:\n          console.log("无权限访问")\n          break\n        case 404:\n          console.log("资源不存在")\n          break\n        case 500:\n          console.log("服务器错误")\n          break\n      }\n    } else if (error.request) {\n      console.log("网络错误，请检查网络连接")\n    } else {\n      console.log("请求配置错误:", error.message)\n    }\n    return Promise.reject(error)\n  }\n)\n\n// 隐藏 loading\naxios.interceptors.response.use(\n  response => {\n    requestCount--\n    if (requestCount === 0) hideLoading()\n    return response\n  },\n  error => {\n    requestCount--\n    if (requestCount === 0) hideLoading()\n    return Promise.reject(error)\n  }\n)\n\n// 刷新 token\naxios.interceptors.response.use(\n  response => response,\n  async error => {\n    if (error.response?.status === 401 && !error.config._retry) {\n      error.config._retry = true\n      try {\n        const newToken = await refreshToken()\n        setAuthToken(newToken)\n        error.config.headers.Authorization = `Bearer ${newToken}`\n        return axios(error.config)\n      } catch (refreshError) {\n        return Promise.reject(refreshError)\n      }\n    }\n    return Promise.reject(error)\n  }\n)</code></pre>',
    tags: ['响应拦截器', '错误处理', 'token刷新']
  },
  'axios-concurrent': {
    title: '并发请求',
    body: '<p class="lead">同时发送多个请求，等待所有请求完成。</p><pre><code>// 使用 Promise.all\nasync function getMultipleData() {\n  try {\n    const [users, posts, comments] = await Promise.all([\n      axios.get("/api/users"),\n      axios.get("/api/posts"),\n      axios.get("/api/comments")\n    ])\n    \n    console.log("用户:", users.data)\n    console.log("文章:", posts.data)\n    console.log("评论:", comments.data)\n  } catch (error) {\n    console.error("某个请求失败:", error)\n  }\n}\n\n// 使用 axios.all（等同于 Promise.all）\nfunction getAllData() {\n  axios.all([\n    axios.get("/api/users"),\n    axios.get("/api/posts"),\n    axios.get("/api/comments")\n  ])\n  .then(axios.spread((users, posts, comments) => {\n    console.log(users.data)\n    console.log(posts.data)\n    console.log(comments.data)\n  }))\n  .catch(error => {\n    console.error(error)\n  })\n}\n\n// 部分请求失败处理\nasync function getDataWithFallback() {\n  const results = await Promise.allSettled([\n    axios.get("/api/users"),\n    axios.get("/api/posts"),\n    axios.get("/api/comments")\n  ])\n  \n  results.forEach((result, index) => {\n    if (result.status === "fulfilled") {\n      console.log(`请求 ${index} 成功:`, result.value.data)\n    } else {\n      console.log(`请求 ${index} 失败:`, result.reason)\n    }\n  })\n}</code></pre>',
    tags: ['并发', 'Promise.all', 'axios.all']
  },
  'axios-cancel': {
    title: '取消请求',
    body: '<p class="lead">取消正在进行的请求，节省带宽和资源。</p><pre><code>// 使用 AbortController（推荐）\nconst controller = new AbortController()\n\naxios.get("/api/slow-endpoint", {\n  signal: controller.signal\n})\n\n// 取消请求\ncontroller.abort()\n\n// 使用 CancelToken（旧版）\nconst CancelToken = axios.CancelToken\nlet cancel\n\naxios.get("/api/slow-endpoint", {\n  cancelToken: new CancelToken(function executor(c) {\n    cancel = c\n  })\n})\n\n// 取消\ncancel("取消请求")\n\n// 防抖取消\nlet cancelToken\nfunction search(keyword) {\n  if (cancelToken) {\n    cancelToken.cancel("取消上次请求")\n  }\n  \n  cancelToken = axios.CancelToken.source()\n  \n  axios.get("/api/search", {\n    params: { q: keyword },\n    cancelToken: cancelToken.token\n  })\n}\n\n// 错误处理\ntry {\n  await axios.get("/api/data", { signal: controller.signal })\n} catch (error) {\n  if (axios.isCancel(error)) {\n    console.log("请求已取消:", error.message)\n  } else {\n    console.log("其他错误:", error)\n  }\n}</code></pre>',
    tags: ['取消请求', 'AbortController', 'CancelToken']
  },
  'axios-transform': {
    title: '转换数据',
    body: '<p class="lead">在请求发送前或响应返回前转换数据。</p><pre><code>// 请求数据转换\naxios.defaults.transformRequest = [(data, headers) => {\n  // 发送前转换数据\n  if (data && typeof data === "object") {\n    return JSON.stringify(data)\n  }\n  return data\n}]\n\n// 响应数据转换\naxios.defaults.transformResponse = [(data) => {\n  // 对响应数据做处理\n  if (typeof data === "string") {\n    try {\n      return JSON.parse(data)\n    } catch (e) {\n      return data\n    }\n  }\n  return data\n}]\n\n// 自定义转换\nconst instance = axios.create({\n  transformRequest: [\n    (data, headers) => {\n      // 自定义转换逻辑\n      return data\n    }\n  ],\n  transformResponse: [\n    (data) => {\n      // 自定义响应转换\n      return data\n    }\n  ]\n})\n\n// 添加多个转换函数（按顺序执行）\ninstance.defaults.transformRequest.push((data) => {\n  console.log("额外处理")\n  return data\n})</code></pre>',
    tags: ['转换', 'transform', '数据格式']
  },
  'axios-csrf': {
    title: 'CSRF 防护',
    body: '<p class="lead">Axios 自动支持 CSRF 防护。</p><pre><code>// 设置 CSRF token（默认从 cookie 中读取 XSRF-TOKEN）\naxios.defaults.xsrfCookieName = "XSRF-TOKEN"\naxios.defaults.xsrfHeaderName = "X-XSRF-TOKEN"\n\n// 携带凭证\naxios.defaults.withCredentials = true\n\n// 手动设置 CSRF token\nconst csrfToken = document.querySelector("meta[name=csrf-token]").content\naxios.defaults.headers.common["X-CSRF-Token"] = csrfToken\n\n// 实例级别配置\nconst api = axios.create({\n  withCredentials: true,\n  xsrfCookieName: "csrftoken",\n  xsrfHeaderName: "X-CSRFToken"\n})\n\n// 全局请求拦截器添加 token\naxios.interceptors.request.use(config => {\n  const token = getCsrfToken()\n  if (token) {\n    config.headers["X-CSRF-Token"] = token\n  }\n  return config\n})</code></pre>',
    tags: ['CSRF', '防护', '安全']
  },
  'axios-error': {
    title: '错误处理',
    body: '<p class="lead">全面处理 Axios 请求中的各种错误。</p><pre><code>axios.get("/api/data")\n  .then(response => {\n    console.log(response.data)\n  })\n  .catch(error => {\n    if (error.response) {\n      // 服务器响应了，但状态码超出 2xx\n      console.log("服务器错误:", error.response.status)\n      console.log("错误数据:", error.response.data)\n      console.log("错误头:", error.response.headers)\n    } else if (error.request) {\n      // 请求已发出，但没有收到响应\n      console.log("网络错误，未收到响应:", error.request)\n    } else {\n      // 请求配置出错\n      console.log("请求配置错误:", error.message)\n    }\n    console.log("错误配置:", error.config)\n  })\n\n// 自定义错误类型\nclass ApiError extends Error {\n  constructor(message, status, data) {\n    super(message)\n    this.status = status\n    this.data = data\n  }\n}\n\n// 全局错误处理\naxios.interceptors.response.use(\n  response => response,\n  error => {\n    const customError = new ApiError(\n      error.message,\n      error.response?.status,\n      error.response?.data\n    )\n    return Promise.reject(customError)\n  }\n)</code></pre>',
    tags: ['错误处理', 'catch', 'error']
  },
  'axios-retry': {
    title: '请求重试',
    body: '<p class="lead">请求失败时自动重试，提高稳定性。</p><pre><code>// 使用 axios-retry 插件\nnpm install axios-retry\n\nimport axiosRetry from "axios-retry"\n\naxiosRetry(axios, {\n  retries: 3,           // 重试次数\n  retryDelay: (retryCount) => {\n    return retryCount * 1000  // 指数退避\n  },\n  retryCondition: (error) => {\n    // 只在网络错误或 5xx 错误时重试\n    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||\n           error.response?.status >= 500\n  }\n})\n\n// 手动实现重试\nasync function requestWithRetry(url, options, maxRetries = 3) {\n  for (let i = 0; i &lt; maxRetries; i++) {\n    try {\n      return await axios.get(url, options)\n    } catch (error) {\n      if (i === maxRetries - 1) throw error\n      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))\n    }\n  }\n}\n\n// 特定请求重试\nconst config = {\n  retry: 3,\n  retryDelay: 1000\n}</code></pre>',
    tags: ['重试', 'retry', '稳定性']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Axios 官方文档获取更多信息。</p>',
        tags: ['Axios', 'HTTP请求']
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

addLink('axios-intro', 'axios-install')
addLink('axios-install', 'axios-basic')
addLink('axios-basic', 'axios-get')
addLink('axios-get', 'axios-post')
addLink('axios-post', 'axios-put')
addLink('axios-put', 'axios-delete')
addLink('axios-config', 'axios-instance')
addLink('axios-instance', 'axios-defaults')
addLink('axios-interceptors', 'axios-request-interceptor')
addLink('axios-request-interceptor', 'axios-response-interceptor')
addLink('axios-concurrent', 'axios-cancel')
addLink('axios-cancel', 'axios-transform')
addLink('axios-transform', 'axios-csrf')
addLink('axios-error', 'axios-retry')

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