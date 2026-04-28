<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Fetch API 知识库</h1>
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
          <h2>🌐 <span class="gradient-text">Fetch API 完全指南</span></h2>
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
          <p>🌐 现代 Web 网络请求 API</p>
          <p>✨ 点击节点双向联动 | 替代 XMLHttpRequest</p>
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
          <h3>🔗 Fetch API 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
    return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Fetch用户'
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

  // ========== Fetch API 导航数据 ==========
  const navSections = ref([
    { title: '📖 基础入门', items: [
        { id: 'fetch-intro', label: 'Fetch API 简介', hot: true },
        { id: 'fetch-basic', label: '基本用法', hot: true },
        { id: 'fetch-response', label: '处理响应', hot: true },
        { id: 'fetch-headers', label: 'Headers 对象', hot: true }
      ]},
    { title: '🔧 请求方法', items: [
        { id: 'fetch-get', label: 'GET 请求', hot: true },
        { id: 'fetch-post', label: 'POST 请求', hot: true },
        { id: 'fetch-put', label: 'PUT 请求', hot: true },
        { id: 'fetch-delete', label: 'DELETE 请求', hot: true }
      ]},
    { title: '⚙️ 请求配置', items: [
        { id: 'fetch-options', label: '请求选项', hot: true },
        { id: 'fetch-headers-config', label: '自定义请求头', hot: true },
        { id: 'fetch-body', label: '请求体', hot: true },
        { id: 'fetch-credentials', label: '凭证与 CORS', hot: true }
      ]},
    { title: '🔄 高级特性', items: [
        { id: 'fetch-async', label: 'async/await', hot: true },
        { id: 'fetch-error', label: '错误处理', hot: true },
        { id: 'fetch-abort', label: '取消请求', hot: true },
        { id: 'fetch-timeout', label: '超时处理', hot: true },
        { id: 'fetch-progress', label: '上传/下载进度', hot: true }
      ]},
    { title: '📦 数据处理', items: [
        { id: 'fetch-json', label: '处理 JSON', hot: true },
        { id: 'fetch-text', label: '处理文本', hot: true },
        { id: 'fetch-blob', label: '处理 Blob/文件', hot: true },
        { id: 'fetch-formdata', label: '处理 FormData', hot: true }
      ]}
  ])

  const selectedId = ref('fetch-intro')

  const allFlatItems = computed(() => {
    const flat = []
    navSections.value.forEach(section => {
      section.items.forEach(item => flat.push(item))
    })
    return flat
  })

  // ========== Fetch API 内容映射表 ==========
  const contentMap = {
    'fetch-intro': {
      title: 'Fetch API 简介',
      body: '<p class="lead">Fetch API 是现代浏览器提供的用于发起网络请求的接口，基于 Promise 设计，是 XMLHttpRequest 的现代替代方案。</p><h3>核心特性</h3><ul><li><strong>Promise 基础</strong>：支持 async/await，避免回调地狱</li><li><strong>流式处理</strong>：支持请求和响应的流式读取</li><li><strong>Service Worker 支持</strong>：可在 Service Worker 中使用</li><li><strong>更强大的请求/响应对象</strong>：Request 和 Response 对象</li><li><strong>CORS 支持</strong>：原生支持跨域请求配置</li></ul><div class="note">💡 Fetch API 是现代 Web 开发的标准，所有现代浏览器都支持。</div>',
      tags: ['网络请求', 'Promise', '现代API']
    },
    'fetch-basic': {
      title: '基本用法',
      body: '<p class="lead">Fetch API 最基本的用法，使用 fetch() 函数发起请求。</p><pre><code>// 基本 GET 请求\nfetch("https://api.example.com/data")\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error))\n\n// 指定请求方法\nfetch("https://api.example.com/data", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({ name: "Alice" })\n})\n\n// 完整的请求示例\nconst url = "https://api.example.com/users"\nconst options = {\n  method: "GET",\n  headers: {\n    "Accept": "application/json"\n  }\n}\n\nfetch(url, options)\n  .then(response => {\n    if (!response.ok) {\n      throw new Error(`HTTP ${response.status}`)\n    }\n    return response.json()\n  })\n  .then(data => console.log(data))\n  .catch(error => console.error(error))</code></pre>',
      tags: ['fetch', '基本请求', 'Promise']
    },
    'fetch-response': {
      title: '处理响应',
      body: '<p class="lead">fetch() 返回的 Response 对象包含多种方法和属性。</p><pre><code>fetch("/api/data")\n  .then(response => {\n    // 响应属性\n    console.log(response.status)      // HTTP 状态码\n    console.log(response.statusText)  // 状态文本\n    console.log(response.ok)          // 状态码在 200-299 之间为 true\n    console.log(response.url)         // 响应 URL\n    console.log(response.type)        // 响应类型 (basic, cors, error, opaque)\n    console.log(response.redirected)  // 是否重定向\n    console.log(response.headers)     // Headers 对象\n    \n    // 响应方法（读取 body）\n    return response.json()  // 解析为 JSON\n    // response.text()      // 解析为文本\n    // response.blob()      // 解析为 Blob\n    // response.arrayBuffer() // 解析为 ArrayBuffer\n    // response.formData()  // 解析为 FormData\n  })\n  .then(data => console.log(data))\n\n// 克隆响应（body 只能读取一次）\nconst response = await fetch("/api/data")\nconst clone1 = response.clone()\nconst clone2 = response.clone()\nconst data1 = await clone1.json()\nconst data2 = await clone2.text()</code></pre>',
      tags: ['Response', '状态码', '响应方法']
    },
    'fetch-headers': {
      title: 'Headers 对象',
      body: '<p class="lead">Headers 接口允许对 HTTP 请求和响应头执行各种操作。</p><pre><code>// 创建 Headers 对象\nconst headers = new Headers()\nheaders.append("Content-Type", "application/json")\nheaders.append("Authorization", "Bearer token123")\n\n// 从对象创建\nconst headers2 = new Headers({\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token123"\n})\n\n// 读取头信息\nheaders.get("Content-Type")  // "application/json"\nheaders.has("Authorization") // true\n\n// 遍历头信息\nfor (const [key, value] of headers) {\n  console.log(`${key}: ${value}`)\n}\n\n// 删除和设置\nheaders.set("Content-Type", "text/plain")\nheaders.delete("Authorization")\n\n// 在 fetch 中使用\nfetch("/api/data", { headers })\n\n// 读取响应头\nfetch("/api/data")\n  .then(response => {\n    const contentType = response.headers.get("Content-Type")\n    console.log(contentType)\n  })</code></pre>',
      tags: ['Headers', '请求头', '响应头']
    },
    'fetch-get': {
      title: 'GET 请求',
      body: '<p class="lead">发送 GET 请求获取数据，支持 URL 参数和配置选项。</p><pre><code>// 基本 GET 请求\nfetch("/api/users")\n  .then(res => res.json())\n  .then(users => console.log(users))\n\n// 带查询参数\nconst params = new URLSearchParams({\n  id: 123,\n  name: "John",\n  page: 1,\n  limit: 10\n})\nfetch(`/api/users?${params}`)\n\n// 使用 URL 对象\nconst url = new URL("/api/users", "https://api.example.com")\nurl.searchParams.set("id", 123)\nurl.searchParams.set("name", "John")\nfetch(url)\n\n// 带自定义请求头\nfetch("/api/users", {\n  headers: {\n    "Accept": "application/json",\n    "Authorization": "Bearer token"\n  }\n})\n\n// 完整示例\nasync function fetchUser(id) {\n  try {\n    const response = await fetch(`/api/users/${id}`)\n    if (!response.ok) throw new Error(`HTTP ${response.status}`)\n    return await response.json()\n  } catch (error) {\n    console.error("请求失败:", error)\n  }\n}</code></pre>',
      tags: ['GET', '查询参数', 'URLSearchParams']
    },
    'fetch-post': {
      title: 'POST 请求',
      body: '<p class="lead">发送 POST 请求创建资源，数据放在请求体中。</p><pre><code>// 发送 JSON 数据\nfetch("/api/users", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    name: "Alice",\n    email: "alice@example.com",\n    age: 25\n  })\n})\n\n// 发送表单数据 (application/x-www-form-urlencoded)\nconst formData = new URLSearchParams()\nformData.append("name", "Bob")\nformData.append("email", "bob@example.com")\n\nfetch("/api/users", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/x-www-form-urlencoded"\n  },\n  body: formData\n})\n\n// 发送 FormData（文件上传）\nconst formData2 = new FormData()\nformData2.append("name", "avatar")\nformData2.append("file", fileInput.files[0])\n\nfetch("/api/upload", {\n  method: "POST",\n  body: formData2  // Content-Type 自动设置\n})\n\n// async/await 方式\nasync function createUser(userData) {\n  const response = await fetch("/api/users", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify(userData)\n  })\n  \n  if (!response.ok) throw new Error("创建失败")\n  return response.json()\n}</code></pre>',
      tags: ['POST', 'JSON', 'FormData']
    },
    'fetch-put': {
      title: 'PUT 请求',
      body: '<p class="lead">发送 PUT 请求完整更新资源。</p><pre><code>// 完整更新用户\nfetch("/api/users/123", {\n  method: "PUT",\n  headers: {\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    name: "Updated Name",\n    email: "updated@example.com",\n    age: 30\n  })\n})\n\n// 带认证的 PUT\nfetch("/api/users/123", {\n  method: "PUT",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer token"\n  },\n  body: JSON.stringify(updateData)\n})\n\n// async/await\nasync function updateUser(userId, data) {\n  const response = await fetch(`/api/users/${userId}`, {\n    method: "PUT",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify(data)\n  })\n  \n  if (!response.ok) {\n    if (response.status === 404) throw new Error("用户不存在")\n    throw new Error(`更新失败: ${response.status}`)\n  }\n  return response.json()\n}</code></pre>',
      tags: ['PUT', '更新', '完整替换']
    },
    'fetch-delete': {
      title: 'DELETE 请求',
      body: '<p class="lead">发送 DELETE 请求删除资源。</p><pre><code>// 删除用户\nfetch("/api/users/123", {\n  method: "DELETE"\n})\n\n// 带查询参数的 DELETE\nfetch(`/api/users?id=123`, {\n  method: "DELETE"\n})\n\n// 带请求体的 DELETE\nfetch("/api/users/batch", {\n  method: "DELETE",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ ids: [1, 2, 3] })\n})\n\n// async/await\nasync function deleteUser(userId) {\n  const response = await fetch(`/api/users/${userId}`, {\n    method: "DELETE"\n  })\n  \n  if (!response.ok) {\n    if (response.status === 404) throw new Error("用户不存在")\n    throw new Error(`删除失败: ${response.status}`)\n  }\n  return true\n}\n\n// 批量删除\nasync function batchDelete(ids) {\n  const response = await fetch("/api/users/batch", {\n    method: "DELETE",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ ids })\n  })\n  return response.ok\n}</code></pre>',
      tags: ['DELETE', '删除', '资源移除']
    },
    'fetch-options': {
      title: '请求选项',
      body: '<p class="lead">fetch() 的第二个参数支持多种配置选项。</p><pre><code>const options = {\n  // 请求方法\n  method: "GET",\n  \n  // 请求头\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer token"\n  },\n  \n  // 请求体\n  body: JSON.stringify(data),\n  \n  // 模式 (cors, no-cors, same-origin)\n  mode: "cors",\n  \n  // 凭证 (include, same-origin, omit)\n  credentials: "include",\n  \n  // 缓存策略 (default, no-cache, reload, force-cache, only-if-cached)\n  cache: "default",\n  \n  // 重定向策略 (follow, error, manual)\n  redirect: "follow",\n  \n  // 完整性校验\n  integrity: "",\n  \n  // 保持活动\n  keepalive: false,\n  \n  // 信号（取消请求）\n  signal: abortController.signal\n}\n\nfetch("/api/data", options)</code></pre>',
      tags: ['配置', '选项', 'fetch参数']
    },
    'fetch-headers-config': {
      title: '自定义请求头',
      body: '<p class="lead">配置自定义请求头，包括认证、内容类型等。</p><pre><code>// 设置认证头\nconst token = localStorage.getItem("token")\nfetch("/api/protected", {\n  headers: {\n    "Authorization": `Bearer ${token}`\n  }\n})\n\n// 设置自定义头\nfetch("/api/data", {\n  headers: {\n    "X-Request-ID": crypto.randomUUID(),\n    "X-Client-Version": "1.0.0",\n    "X-Source": "web-app"\n  }\n})\n\n// 内容协商\nfetch("/api/data", {\n  headers: {\n    "Accept": "application/json",\n    "Accept-Language": "zh-CN,zh;q=0.9",\n    "Accept-Encoding": "gzip, deflate"\n  }\n})\n\n// 条件请求\nfetch("/api/data", {\n  headers: {\n    "If-None-Match": `"${etag}"`,\n    "If-Modified-Since": lastModified\n  }\n})\n\n// 批量设置\nconst headers = new Headers()\nheaders.set("Authorization", `Bearer ${token}`)\nheaders.set("Content-Type", "application/json")\nheaders.set("X-Custom", "value")\nfetch("/api/data", { headers })</code></pre>',
      tags: ['请求头', '认证', '自定义头']
    },
    'fetch-body': {
      title: '请求体',
      body: '<p class="lead">fetch() 支持多种格式的请求体数据。</p><pre><code>// JSON 格式\nconst jsonData = { name: "Alice", age: 25 }\nfetch("/api/users", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(jsonData)\n})\n\n// 表单 URL 编码\nconst formData = new URLSearchParams()\nformData.append("username", "alice")\nformData.append("password", "secret")\nfetch("/api/login", {\n  method: "POST",\n  headers: { "Content-Type": "application/x-www-form-urlencoded" },\n  body: formData\n})\n\n// Multipart FormData（文件上传）\nconst multipartData = new FormData()\nmultipartData.append("file", fileInput.files[0])\nmultipartData.append("description", "User avatar")\nfetch("/api/upload", {\n  method: "POST",\n  body: multipartData  // 自动设置 Content-Type\n})\n\n// 文本格式\nfetch("/api/log", {\n  method: "POST",\n  headers: { "Content-Type": "text/plain" },\n  body: "Log message here"\n})\n\n// Blob 格式\nconst blob = new Blob([JSON.stringify(data)], { type: "application/json" })\nfetch("/api/data", {\n  method: "POST",\n  body: blob\n})</code></pre>',
      tags: ['请求体', 'JSON', 'FormData']
    },
    'fetch-credentials': {
      title: '凭证与 CORS',
      body: '<p class="lead">配置 fetch 的凭证策略和跨域请求。</p><pre><code>// 携带凭证（cookies, 认证头）\nfetch("/api/data", {\n  credentials: "include"  // 总是发送凭证\n})\n\n// 同源凭证\nfetch("/api/data", {\n  credentials: "same-origin"  // 仅同源发送\n})\n\n// 不发送凭证\nfetch("/api/data", {\n  credentials: "omit"  // 不发送凭证\n})\n\n// CORS 跨域请求\nfetch("https://api.other-domain.com/data", {\n  mode: "cors",\n  credentials: "include"\n})\n\n// 预检请求处理\n// 当请求带有自定义头或非简单方法时，浏览器会自动发送 OPTIONS 预检\n\n// 服务端需要配置 CORS 响应头\n// Access-Control-Allow-Origin: https://your-domain.com\n// Access-Control-Allow-Credentials: true\n// Access-Control-Allow-Methods: GET, POST, PUT, DELETE\n\n// 简单请求条件\n// - 方法: GET, HEAD, POST\n// - 头: Accept, Accept-Language, Content-Language, Content-Type (application/x-www-form-urlencoded, multipart/form-data, text/plain)</code></pre>',
      tags: ['CORS', '凭证', '跨域']
    },
    'fetch-async': {
      title: 'async/await',
      body: '<p class="lead">使用 async/await 语法让 fetch 代码更简洁。</p><pre><code>// 基本 async/await\nasync function getData() {\n  try {\n    const response = await fetch("/api/data")\n    const data = await response.json()\n    console.log(data)\n  } catch (error) {\n    console.error("请求失败:", error)\n  }\n}\n\n// 带错误处理的完整示例\nasync function fetchUser(id) {\n  try {\n    const response = await fetch(`/api/users/${id}`)\n    \n    if (!response.ok) {\n      throw new Error(`HTTP ${response.status}: ${response.statusText}`)\n    }\n    \n    const user = await response.json()\n    return user\n  } catch (error) {\n    console.error("获取用户失败:", error.message)\n    return null\n  }\n}\n\n// 并发请求\nasync function getMultipleResources() {\n  const [users, posts, comments] = await Promise.all([\n    fetch("/api/users").then(res => res.json()),\n    fetch("/api/posts").then(res => res.json()),\n    fetch("/api/comments").then(res => res.json())\n  ])\n  return { users, posts, comments }\n}\n\n// 串行请求\nasync function processItems(items) {\n  const results = []\n  for (const item of items) {\n    const response = await fetch(`/api/process/${item.id}`)\n    const result = await response.json()\n    results.push(result)\n  }\n  return results\n}</code></pre>',
      tags: ['async', 'await', '异步']
    },
    'fetch-error': {
      title: '错误处理',
      body: '<p class="lead">全面处理 fetch 请求中的各种错误。</p><pre><code>// 基本错误处理\nfetch("/api/data")\n  .then(response => {\n    if (!response.ok) {\n      throw new Error(`HTTP ${response.status}`)\n    }\n    return response.json()\n  })\n  .catch(error => {\n    console.error("网络错误:", error)\n  })\n\n// 详细错误处理\nasync function safeFetch(url, options) {\n  try {\n    const response = await fetch(url, options)\n    \n    if (!response.ok) {\n      const errorData = await response.text()\n      throw new Error(`[${response.status}] ${errorData}`)\n    }\n    \n    return await response.json()\n  } catch (error) {\n    if (error.name === "TypeError") {\n      console.error("网络连接错误，请检查网络")\n    } else if (error.name === "AbortError") {\n      console.error("请求已被取消")\n    } else {\n      console.error("请求错误:", error.message)\n    }\n    throw error\n  }\n}\n\n// 重试机制\nasync function fetchWithRetry(url, options, maxRetries = 3) {\n  for (let i = 0; i &lt; maxRetries; i++) {\n    try {\n      const response = await fetch(url, options)\n      if (!response.ok) throw new Error(`HTTP ${response.status}`)\n      return await response.json()\n    } catch (error) {\n      if (i === maxRetries - 1) throw error\n      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))\n    }\n  }\n}</code></pre>',
      tags: ['错误处理', 'try/catch', '重试']
    },
    'fetch-abort': {
      title: '取消请求',
      body: '<p class="lead">使用 AbortController 取消正在进行的请求。</p><pre><code>// 创建 AbortController\nconst controller = new AbortController()\nconst signal = controller.signal\n\n// 发起可取消的请求\nfetch("/api/slow-endpoint", { signal })\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => {\n    if (error.name === "AbortError") {\n      console.log("请求已被取消")\n    } else {\n      console.error(error)\n    }\n  })\n\n// 取消请求\nsetTimeout(() => {\n  controller.abort()\n}, 1000)\n\n// 防抖搜索示例\nlet currentController = null\n\nasync function search(keyword) {\n  // 取消上一次请求\n  if (currentController) {\n    currentController.abort()\n  }\n  \n  // 创建新控制器\n  currentController = new AbortController()\n  \n  try {\n    const response = await fetch(`/api/search?q=${keyword}`, {\n      signal: currentController.signal\n    })\n    const data = await response.json()\n    console.log(data)\n  } catch (error) {\n    if (error.name !== "AbortError") {\n      console.error(error)\n    }\n  }\n}\n\n// 多个请求共享同一个信号\nconst sharedController = new AbortController()\nPromise.all([\n  fetch("/api/data1", { signal: sharedController.signal }),\n  fetch("/api/data2", { signal: sharedController.signal })\n]).then(responses => Promise.all(responses.map(r => r.json())))\n\n// 取消所有\nsharedController.abort()</code></pre>',
      tags: ['AbortController', '取消请求', 'AbortSignal']
    },
    'fetch-timeout': {
      title: '超时处理',
      body: '<p class="lead">实现 fetch 请求超时功能。</p><pre><code>// 使用 AbortController 实现超时\nfunction fetchWithTimeout(url, options, timeout = 5000) {\n  const controller = new AbortController()\n  const timeoutId = setTimeout(() => controller.abort(), timeout)\n  \n  return fetch(url, {\n    ...options,\n    signal: controller.signal\n  })\n    .finally(() => clearTimeout(timeoutId))\n}\n\n// 使用示例\nfetchWithTimeout("/api/slow-endpoint", {}, 3000)\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => {\n    if (error.name === "AbortError") {\n      console.log("请求超时")\n    }\n  })\n\n// 带超时和重试\nasync function fetchWithTimeoutAndRetry(url, options, timeout = 5000, maxRetries = 3) {\n  for (let i = 0; i &lt; maxRetries; i++) {\n    try {\n      const response = await fetchWithTimeout(url, options, timeout)\n      if (!response.ok) throw new Error(`HTTP ${response.status}`)\n      return await response.json()\n    } catch (error) {\n      if (i === maxRetries - 1) throw error\n      console.log(`重试 ${i + 1}/${maxRetries}`)\n    }\n  }\n}\n\n// 全局超时配置\nconst defaultTimeout = 10000\nconst fetchWithDefaultTimeout = (url, options) => \n  fetchWithTimeout(url, options, defaultTimeout)</code></pre>',
      tags: ['超时', 'AbortController', 'timeout']
    },
    'fetch-progress': {
      title: '上传/下载进度',
      body: '<p class="lead">监控上传和下载进度（需要服务端支持）。</p><pre><code>// 下载进度（使用 Response.body 流）\nasync function fetchWithProgress(url, onProgress) {\n  const response = await fetch(url)\n  const contentLength = response.headers.get("Content-Length")\n  const total = contentLength ? parseInt(contentLength, 10) : 0\n  \n  let loaded = 0\n  const reader = response.body.getReader()\n  const chunks = []\n  \n  while (true) {\n    const { done, value } = await reader.read()\n    if (done) break\n    \n    chunks.push(value)\n    loaded += value.length\n    \n    if (onProgress && total) {\n      onProgress({ loaded, total, percent: (loaded / total) * 100 })\n    }\n  }\n  \n  const blob = new Blob(chunks)\n  const text = await blob.text()\n  return JSON.parse(text)\n}\n\n// 使用示例\nfetchWithProgress("/api/large-file", (progress) => {\n  console.log(`下载进度: ${progress.percent.toFixed(2)}%`)\n})\n\n// 上传进度（XMLHttpRequest 方式，fetch 原生不支持）\n// 使用 XMLHttpRequest 或第三方库实现上传进度\nfunction uploadWithProgress(url, file, onProgress) {\n  return new Promise((resolve, reject) => {\n    const xhr = new XMLHttpRequest()\n    xhr.open("POST", url)\n    \n    xhr.upload.onprogress = (event) => {\n      if (event.lengthComputable && onProgress) {\n        onProgress({\n          loaded: event.loaded,\n          total: event.total,\n          percent: (event.loaded / event.total) * 100\n        })\n      }\n    }\n    \n    xhr.onload = () => {\n      if (xhr.status === 200) {\n        resolve(JSON.parse(xhr.responseText))\n      } else {\n        reject(new Error(`HTTP ${xhr.status}`))\n      }\n    }\n    \n    xhr.onerror = () => reject(new Error("Network error"))\n    \n    const formData = new FormData()\n    formData.append("file", file)\n    xhr.send(formData)\n  })\n}</code></pre>',
      tags: ['进度', '上传', '下载']
    },
    'fetch-json': {
      title: '处理 JSON',
      body: '<p class="lead">使用 fetch 处理 JSON 数据。</p><pre><code>// 发送 JSON 请求\nasync function postJSON(url, data) {\n  const response = await fetch(url, {\n    method: "POST",\n    headers: {\n      "Content-Type": "application/json"\n    },\n    body: JSON.stringify(data)\n  })\n  \n  return response.json()\n}\n\n// 接收 JSON 响应\nasync function getJSON(url) {\n  const response = await fetch(url)\n  \n  if (!response.ok) {\n    throw new Error(`HTTP ${response.status}`)\n  }\n  \n  return response.json()\n}\n\n// 处理嵌套 JSON\nconst user = {\n  name: "Alice",\n  profile: {\n    age: 25,\n    city: "Beijing",\n    hobbies: ["reading", "coding"]\n  }\n}\n\nawait postJSON("/api/users", user)\n\n// 响应验证\nconst response = await fetch("/api/data")\nconst data = await response.json()\n\n// 验证数据结构\nif (data && Array.isArray(data.items)) {\n  console.log(data.items.length)\n}\n\n// 错误时可能返回非 JSON\nasync function safeJSONFetch(url) {\n  const response = await fetch(url)\n  const contentType = response.headers.get("Content-Type")\n  \n  if (contentType &amp;&amp; contentType.includes("application/json")) {\n    return response.json()\n  }\n  \n  const text = await response.text()\n  throw new Error(`Expected JSON but got: ${text.substring(0, 100)}`)\n}</code></pre>',
      tags: ['JSON', '响应解析', '序列化']
    },
    'fetch-text': {
      title: '处理文本',
      body: '<p class="lead">使用 fetch 处理文本数据。</p><pre><code>// 获取文本响应\nasync function getText(url) {\n  const response = await fetch(url)\n  \n  if (!response.ok) {\n    throw new Error(`HTTP ${response.status}`)\n  }\n  \n  return response.text()\n}\n\n// 发送文本数据\nasync function postText(url, text) {\n  const response = await fetch(url, {\n    method: "POST",\n    headers: {\n      "Content-Type": "text/plain"\n    },\n    body: text\n  })\n  \n  if (!response.ok) {\n    throw new Error(`HTTP ${response.status}`)\n  }\n  \n  return response.text()\n}\n\n// 读取 CSV 文件\nconst csvText = await getText("/data/report.csv")\nconst rows = csvText.split("\\n").map(line => line.split(\",\"))\nconsole.log(rows)\n\n// 读取 HTML 片段\nconst html = await getText("/component/header.html")\ndocument.getElementById("header").innerHTML = html\n\n// 检测编码\nconst text = await response.text()\nif (text.includes("error") || text.includes("Error")) {\n  console.warn("响应包含错误信息")\n}</code></pre>',
      tags: ['文本', 'text', 'CSV']
    },
    'fetch-blob': {
      title: '处理 Blob / 文件',
      body: '<p class="lead">使用 fetch 处理 Blob 和文件数据。</p><pre><code>// 下载图片\nasync function downloadImage(url) {\n  const response = await fetch(url)\n  const blob = await response.blob()\n  const imageUrl = URL.createObjectURL(blob)\n  \n  const img = document.createElement("img")\n  img.src = imageUrl\n  document.body.appendChild(img)\n  \n  return imageUrl\n}\n\n// 下载文件\nasync function downloadFile(url, filename) {\n  const response = await fetch(url)\n  const blob = await response.blob()\n  const link = document.createElement("a")\n  const objectUrl = URL.createObjectURL(blob)\n  \n  link.href = objectUrl\n  link.download = filename\n  link.click()\n  \n  URL.revokeObjectURL(objectUrl)\n}\n\n// 上传 Blob\nasync function uploadBlob(url, blob, filename) {\n  const formData = new FormData()\n  formData.append("file", blob, filename)\n  \n  const response = await fetch(url, {\n    method: "POST",\n    body: formData\n  })\n  \n  return response.json()\n}\n\n// 处理 PDF\nasync function loadPDF(url) {\n  const response = await fetch(url)\n  const blob = await response.blob()\n  const pdfUrl = URL.createObjectURL(blob)\n  \n  // 在 iframe 中显示\n  const iframe = document.getElementById("pdf-viewer")\n  iframe.src = pdfUrl\n  \n  return pdfUrl\n}\n\n// 获取文件大小\nconst response = await fetch("/file.zip")\nconst blob = await response.blob()\nconsole.log(`文件大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)</code></pre>',
      tags: ['Blob', '文件', '下载']
    },
    'fetch-formdata': {
      title: '处理 FormData',
      body: '<p class="lead">使用 fetch 处理表单数据和文件上传。</p><pre><code>// 从表单创建 FormData\nconst form = document.getElementById("myForm")\nconst formData = new FormData(form)\n\nfetch("/api/submit", {\n  method: "POST",\n  body: formData\n})\n\n// 手动构建 FormData\nconst data = new FormData()\ndata.append("username", "alice")\ndata.append("email", "alice@example.com")\ndata.append("avatar", fileInput.files[0])\n\nfetch("/api/register", {\n  method: "POST",\n  body: data\n})\n\n// 多文件上传\nconst files = fileInput.files\nfor (let i = 0; i &lt; files.length; i++) {\n  formData.append("files[]", files[i])\n}\n\n// 发送 JSON + 文件（需要手动处理）\nconst jsonData = { name: "Alice", age: 25 }\nconst formData2 = new FormData()\nformData2.append("metadata", JSON.stringify(jsonData))\nformData2.append("file", fileInput.files[0])\n\nfetch("/api/upload-with-metadata", {\n  method: "POST",\n  body: formData2\n})\n\n// 进度跟踪（配合 XMLHttpRequest）\nfunction uploadWithProgress(file, onProgress) {\n  const formData = new FormData()\n  formData.append("file", file)\n  \n  const xhr = new XMLHttpRequest()\n  xhr.upload.onprogress = (event) => {\n    if (event.lengthComputable) {\n      onProgress(event.loaded / event.total)\n    }\n  }\n  \n  return new Promise((resolve, reject) => {\n    xhr.onload = () => resolve(xhr.responseText)\n    xhr.onerror = () => reject(xhr.statusText)\n    xhr.open("POST", "/api/upload")\n    xhr.send(formData)\n  })\n}</code></pre>',
      tags: ['FormData', '表单', '文件上传']
    }
  }

  // 确保所有导航项都有默认内容
  navSections.value.forEach(section => {
    section.items.forEach(item => {
      if (!contentMap[item.id]) {
        contentMap[item.id] = {
          title: item.label,
          body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Fetch API 官方文档获取更多信息。</p>',
          tags: ['Fetch API', '网络请求']
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

  addLink('fetch-intro', 'fetch-basic')
  addLink('fetch-basic', 'fetch-response')
  addLink('fetch-response', 'fetch-headers')
  addLink('fetch-get', 'fetch-post')
  addLink('fetch-post', 'fetch-put')
  addLink('fetch-put', 'fetch-delete')
  addLink('fetch-options', 'fetch-headers-config')
  addLink('fetch-headers-config', 'fetch-body')
  addLink('fetch-body', 'fetch-credentials')
  addLink('fetch-async', 'fetch-error')
  addLink('fetch-error', 'fetch-abort')
  addLink('fetch-abort', 'fetch-timeout')
  addLink('fetch-timeout', 'fetch-progress')
  addLink('fetch-json', 'fetch-text')
  addLink('fetch-text', 'fetch-blob')
  addLink('fetch-blob', 'fetch-formdata')

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