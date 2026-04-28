<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Browser API 知识库</h1>
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
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🔌 <span class="gradient-text">Browser API 完全指南</span></h2>
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
          <p>🔌 现代浏览器 Web API 集合</p>
          <p>✨ 点击节点双向联动 | 构建强大 Web 应用</p>
        </div>
      </aside>

      <!-- 中间内容区 -->
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

      <!-- 右侧图谱 -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 Browser API 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'API开发者'
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

// ========== Browser API 导航数据 ==========
const navSections = ref([
  { title: '📖 核心基础', items: [
      { id: 'browser-api-intro', label: 'Web API 简介', hot: true },
      { id: 'window-api', label: 'Window API', hot: true },
      { id: 'navigator-api', label: 'Navigator API', hot: true },
      { id: 'feature-detection', label: '特性检测', hot: true }
    ]},
  { title: '📡 网络与通信', items: [
      { id: 'fetch-api', label: 'Fetch API', hot: true },
      { id: 'websocket-api', label: 'WebSocket API', hot: true },
      { id: 'sse-api', label: 'Server-Sent Events', hot: true },
      { id: 'beacon-api', label: 'Beacon API', hot: true }
    ]},
  { title: '💾 存储与数据', items: [
      { id: 'localstorage-api', label: 'Web Storage', hot: true },
      { id: 'indexeddb-api', label: 'IndexedDB', hot: true },
      { id: 'cache-api', label: 'Cache API', hot: true },
      { id: 'cookies-api', label: 'Cookies API', hot: true }
    ]},
  { title: '🎨 多媒体与图形', items: [
      { id: 'canvas-api', label: 'Canvas API', hot: true },
      { id: 'webgl-api', label: 'WebGL API', hot: true },
      { id: 'webaudio-api', label: 'Web Audio API', hot: true },
      { id: 'mediastream-api', label: 'MediaStream API', hot: true }
    ]},
  { title: '🔧 设备与硬件', items: [
      { id: 'geolocation-api', label: 'Geolocation API', hot: true },
      { id: 'device-orientation', label: 'Device Orientation', hot: true },
      { id: 'vibration-api', label: 'Vibration API', hot: true },
      { id: 'battery-api', label: 'Battery Status API' }
    ]},
  { title: '⚡ 性能与观察者', items: [
      { id: 'intersection-observer', label: 'Intersection Observer', hot: true },
      { id: 'mutation-observer', label: 'Mutation Observer', hot: true },
      { id: 'resize-observer', label: 'Resize Observer', hot: true },
      { id: 'performance-api', label: 'Performance API', hot: true }
    ]},
  { title: '🔐 安全与权限', items: [
      { id: 'permissions-api', label: 'Permissions API', hot: true },
      { id: 'credentials-api', label: 'Credentials API', hot: true },
      { id: 'crypto-api', label: 'Web Crypto API', hot: true },
      { id: 'trusted-types', label: 'Trusted Types' }
    ]},
  { title: '🚀 高级特性', items: [
      { id: 'service-workers', label: 'Service Workers', hot: true },
      { id: 'web-workers', label: 'Web Workers', hot: true },
      { id: 'web-components', label: 'Web Components', hot: true },
      { id: 'webassembly', label: 'WebAssembly' }
    ]}
])

const selectedId = ref('browser-api-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Browser API 内容映射表 ==========
const contentMap = {
  'browser-api-intro': {
    title: 'Web API 简介',
    body: '<p class="lead">Web API 是浏览器提供的一系列接口，让 JavaScript 能够与浏览器和操作系统进行交互，实现丰富的 Web 应用功能。</p><h3>API 分类</h3><ul><li><strong>核心 API</strong>：DOM、BOM、Canvas 等</li><li><strong>网络 API</strong>：Fetch、WebSocket、Beacon</li><li><strong>存储 API</strong>：localStorage、IndexedDB、Cache</li><li><strong>设备 API</strong>：Geolocation、设备方向、振动</li><li><strong>图形 API</strong>：Canvas、WebGL、WebGPU</li><li><strong>多媒体 API</strong>：Web Audio、MediaStream、WebRTC</li></ul><div class="note">💡 使用 API 前应进行特性检测，确保兼容性。</div>',
    tags: ['Web API', '浏览器接口', 'JavaScript']
  },
  'window-api': {
    title: 'Window API',
    body: '<p class="lead">Window 接口代表浏览器窗口，是 Web API 的全局对象。</p><pre><code>// 窗口属性\nwindow.innerWidth, window.innerHeight   // 视口尺寸\nwindow.scrollX, window.scrollY         // 滚动位置\nwindow.location                         // URL 信息\nwindow.history                          // 历史记录\nwindow.navigator                        // 浏览器信息\nwindow.screen                           // 屏幕信息\n\n// 窗口方法\nwindow.open()      // 打开新窗口\nwindow.close()     // 关闭窗口\nwindow.scrollTo()  // 滚动到位置\nwindow.requestAnimationFrame()  // 动画帧\nwindow.requestIdleCallback()    // 空闲回调\n\n// 全局事件\nwindow.onload = () =&gt; {}\nwindow.onresize = () =&gt; {}\nwindow.onscroll = () =&gt; {}\nwindow.onbeforeunload = () =&gt; {}</code></pre>',
    tags: ['Window', '全局对象', '浏览器窗口']
  },
  'navigator-api': {
    title: 'Navigator API',
    body: '<p class="lead">Navigator 接口提供浏览器和系统信息。</p><pre><code>// 浏览器信息\nnavigator.userAgent          // 用户代理字符串\nnavigator.platform           // 操作系统平台\nnavigator.language           // 浏览器语言\nnavigator.cookieEnabled      // Cookie 是否启用\nnavigator.onLine             // 是否在线\n\n// 功能检测\nnavigator.geolocation        // 地理位置\nnavigator.mediaDevices       // 媒体设备\nnavigator.clipboard          // 剪贴板\nnavigator.serviceWorker      // Service Worker\nnavigator.permissions        // 权限管理\nnavigator.connection         // 网络信息\n\n// 连接信息\nconst connection = navigator.connection\nconsole.log(connection.effectiveType)  // 4g, 3g, 2g\nconsole.log(connection.downlink)       // 下行速度</code></pre>',
    tags: ['Navigator', '浏览器信息', '功能检测']
  },
  'feature-detection': {
    title: '特性检测',
    body: '<p class="lead">特性检测是确保代码在不同浏览器中正常运行的最佳实践。</p><pre><code>// 基本特性检测\nif (\'fetch\' in window) {\n  // 支持 Fetch API\n  fetch(url)\n}\n\nif (\'localStorage\' in window) {\n  // 支持 localStorage\n  localStorage.setItem(\'test\', \'value\')\n}\n\n// 检测特定功能\nconst supportsWebP = () =&gt; {\n  const canvas = document.createElement(\'canvas\')\n  return canvas.toDataURL(\'image/webp\').indexOf(\'image/webp\') > -1\n}\n\n// 检测 CSS 特性\nconst supportsGrid = CSS.supports(\'display\', \'grid\')\n\n// 检测 API 方法\nconst hasWebSocket = typeof WebSocket !== \'undefined\'\n\n// 降级方案\nif (\'IntersectionObserver\' in window) {\n  // 使用 Intersection Observer\n} else {\n  // 使用滚动监听降级方案\n}</code></pre>',
    tags: ['特性检测', '兼容性', '渐进增强']
  },
  'fetch-api': {
    title: 'Fetch API',
    body: '<p class="lead">Fetch API 提供了更强大、更灵活的 HTTP 请求方式，是现代 Ajax 的替代方案。</p><pre><code>// GET 请求\nfetch(\'https://api.example.com/data\')\n  .then(response =&gt; response.json())\n  .then(data =&gt; console.log(data))\n  .catch(error =&gt; console.error(error))\n\n// POST 请求\nfetch(\'https://api.example.com/submit\', {\n  method: \'POST\',\n  headers: {\n    \'Content-Type\': \'application/json\',\n    \'Authorization\': \'Bearer token\'\n  },\n  body: JSON.stringify({ name: \'John\', age: 30 })\n})\n\n// async/await 方式\nasync function fetchData() {\n  try {\n    const response = await fetch(url)\n    if (!response.ok) throw new Error(`HTTP ${response.status}`)\n    const data = await response.json()\n    return data\n  } catch (error) {\n    console.error(error)\n  }\n}\n\n// 处理响应\nresponse.ok       // 状态码 200-299\nresponse.status   // HTTP 状态码\nresponse.headers  // 响应头\nresponse.text()   // 文本格式\nresponse.json()   // JSON 格式\nresponse.blob()   // Blob 格式\nresponse.formData() // FormData 格式\n\n// 上传文件\nconst formData = new FormData()\nformData.append(\'file\', fileInput.files[0])\nfetch(\'/upload\', { method: \'POST\', body: formData })</code></pre>',
    tags: ['Fetch', 'HTTP请求', 'Ajax']
  },
  'websocket-api': {
    title: 'WebSocket API',
    body: '<p class="lead">WebSocket 提供全双工通信通道，适用于实时应用。</p><pre><code>// 创建 WebSocket 连接\nconst ws = new WebSocket(\'wss://echo.websocket.org\')\n\n// 连接事件\nws.onopen = () =&gt; {\n  console.log(\'连接已建立\')\n  ws.send(\'Hello Server\')\n}\n\n// 接收消息\nws.onmessage = (event) =&gt; {\n  console.log(\'收到消息:\', event.data)\n}\n\n// 错误处理\nws.onerror = (error) =&gt; {\n  console.error(\'WebSocket 错误:\', error)\n}\n\n// 关闭连接\nws.onclose = () =&gt; {\n  console.log(\'连接已关闭\')\n}\n\n// 发送不同类型数据\nws.send(\'文本消息\')\nws.send(JSON.stringify({ type: \'data\', payload: {} }))\n\n// 检查连接状态\nif (ws.readyState === WebSocket.OPEN) {\n  ws.send(\'消息\')\n}\n\n// 心跳检测保持连接\nsetInterval(() =&gt; {\n  if (ws.readyState === WebSocket.OPEN) {\n    ws.send(\'ping\')\n  }\n}, 30000)</code></pre>',
    tags: ['WebSocket', '实时通信', '全双工']
  },
  'sse-api': {
    title: 'Server-Sent Events',
    body: '<p class="lead">SSE 允许服务器向客户端推送事件，适用于单向实时更新。</p><pre><code>// 创建 EventSource\nconst eventSource = new EventSource(\'/events\')\n\n// 监听消息\neventSource.onmessage = (event) =&gt; {\n  console.log(\'收到消息:\', event.data)\n}\n\n// 监听自定义事件\neventSource.addEventListener(\'user-update\', (event) =&gt; {\n  console.log(\'用户更新:\', JSON.parse(event.data))\n})\n\n// 错误处理\neventSource.onerror = (error) =&gt; {\n  console.error(\'SSE 错误:\', error)\n  eventSource.close()\n}\n\n// 关闭连接\neventSource.close()\n\n// 服务器端示例（Node.js）\nres.writeHead(200, {\n  \'Content-Type\': \'text/event-stream\',\n  \'Cache-Control\': \'no-cache\',\n  \'Connection\': \'keep-alive\'\n})\nres.write(`data: ${JSON.stringify(data)}\\n\\n`)</code></pre>',
    tags: ['SSE', '服务器推送', 'EventSource']
  },
  'beacon-api': {
    title: 'Beacon API',
    body: '<p class="lead">Beacon API 用于在页面卸载时异步发送数据，不影响页面性能。</p><pre><code>// 发送数据\nnavigator.sendBeacon(\'/log\', JSON.stringify({\n  event: \'pageview\',\n  timestamp: Date.now(),\n  url: location.href\n}))\n\n// 发送 FormData\nconst formData = new FormData()\nformData.append(\'action\', \'leave\')\nformData.append(\'time\', Date.now())\nnavigator.sendBeacon(\'/track\', formData)\n\n// 发送 Blob\nconst blob = new Blob([JSON.stringify(data)], { type: \'application/json\' })\nnavigator.sendBeacon(\'/api/log\', blob)\n\n// 页面卸载时发送\nwindow.addEventListener(\'beforeunload\', () =&gt; {\n  navigator.sendBeacon(\'/analytics\', analyticsData)\n})\n\n// 适用场景\n// - 页面离开时发送分析数据\n// - 用户行为追踪\n// - 性能指标上报</code></pre>',
    tags: ['Beacon', '数据上报', '页面卸载']
  },
  'localstorage-api': {
    title: 'Web Storage',
    body: '<p class="lead">Web Storage 提供键值对存储，包括 localStorage 和 sessionStorage。</p><pre><code>// localStorage - 持久存储\nlocalStorage.setItem(\'key\', \'value\')\nconst value = localStorage.getItem(\'key\')\nlocalStorage.removeItem(\'key\')\nlocalStorage.clear()\n\n// 存储对象\nconst user = { name: \'John\', age: 30 }\nlocalStorage.setItem(\'user\', JSON.stringify(user))\nconst storedUser = JSON.parse(localStorage.getItem(\'user\'))\n\n// sessionStorage - 会话存储（标签页关闭后清除）\nsessionStorage.setItem(\'sessionToken\', token)\n\n// 遍历所有存储\nfor (let i = 0; i &lt; localStorage.length; i++) {\n  const key = localStorage.key(i)\n  console.log(`${key}: ${localStorage.getItem(key)}`)\n}\n\n// 监听存储变化（同源其他页面）\nwindow.addEventListener(\'storage\', (event) =&gt; {\n  console.log(\'Storage changed:\', event.key, event.newValue)\n})\n\n// 存储空间检测\ntry {\n  localStorage.setItem(\'test\', \'test\')\n  localStorage.removeItem(\'test\')\n} catch (e) {\n  console.log(\'存储空间已满或禁用\')\n}</code></pre>',
    tags: ['localStorage', 'sessionStorage', 'Web Storage']
  },
  'indexeddb-api': {
    title: 'IndexedDB',
    body: '<p class="lead">IndexedDB 是浏览器内置的 NoSQL 数据库，用于存储大量结构化数据。</p><pre><code>// 打开数据库\nconst request = indexedDB.open(\'MyDatabase\', 1)\n\nrequest.onerror = (event) =&gt; {\n  console.error(\'数据库错误:\', event.target.error)\n}\n\nrequest.onupgradeneeded = (event) =&gt; {\n  const db = event.target.result\n  // 创建对象存储\n  if (!db.objectStoreNames.contains(\'users\')) {\n    const store = db.createObjectStore(\'users\', { keyPath: \'id\', autoIncrement: true })\n    store.createIndex(\'name\', \'name\', { unique: false })\n  }\n}\n\nrequest.onsuccess = (event) =&gt; {\n  const db = event.target.result\n  \n  // 添加数据\n  const transaction = db.transaction([\'users\'], \'readwrite\')\n  const store = transaction.objectStore(\'users\')\n  store.add({ name: \'Alice\', age: 25 })\n  \n  // 查询数据\n  const getRequest = store.get(1)\n  getRequest.onsuccess = () =&gt; console.log(getRequest.result)\n}\n\n// 使用 Promise 封装\nfunction getFromIndexedDB(storeName, id) {\n  return new Promise((resolve, reject) =&gt; {\n    const request = indexedDB.open(\'MyDatabase\', 1)\n    request.onsuccess = () =&gt; {\n      const db = request.result\n      const transaction = db.transaction([storeName], \'readonly\')\n      const store = transaction.objectStore(storeName)\n      const getRequest = store.get(id)\n      getRequest.onsuccess = () =&gt; resolve(getRequest.result)\n      getRequest.onerror = () =&gt; reject(getRequest.error)\n    }\n    request.onerror = () =&gt; reject(request.error)\n  })\n}</code></pre>',
    tags: ['IndexedDB', '数据库', 'NoSQL']
  },
  'cache-api': {
    title: 'Cache API',
    body: '<p class="lead">Cache API 用于存储请求-响应对象，常用于 Service Worker 离线缓存。</p><pre><code>// 打开缓存\nconst cache = await caches.open(\'my-cache-v1\')\n\n// 存储响应\nawait cache.put(\'/api/data\', new Response(JSON.stringify({ data: 123 })))\n\n// 批量添加\nawait cache.addAll([\'/\', \'/styles.css\', \'/script.js\'])\n\n// 读取缓存\nconst response = await cache.match(\'/api/data\')\nconst data = await response.json()\n\n// 删除缓存项\nawait cache.delete(\'/old-resource\')\n\n// 获取所有缓存 key\nconst keys = await cache.keys()\n\n// 缓存策略示例\nasync function fetchWithCache(url) {\n  const cache = await caches.open(\'dynamic\')\n  let response = await cache.match(url)\n  \n  if (!response) {\n    response = await fetch(url)\n    cache.put(url, response.clone())\n  }\n  return response\n}\n\n// 删除旧版本缓存\nconst cacheNames = await caches.keys()\nawait Promise.all(\n  cacheNames.filter(name =&gt; name !== \'my-cache-v1\').map(name =&gt; caches.delete(name))\n)</code></pre>',
    tags: ['Cache API', '离线缓存', 'Service Worker']
  },
  'cookies-api': {
    title: 'Cookies API',
    body: '<p class="lead">Document.cookie API 用于读写浏览器 Cookies。</p><pre><code>// 设置 Cookie\ndocument.cookie = \'username=John; path=/; max-age=3600; secure; samesite=lax\'\n\n// 读取所有 Cookie\nconst allCookies = document.cookie\n\n// 解析特定 Cookie\nfunction getCookie(name) {\n  const value = `; ${document.cookie}`\n  const parts = value.split(`; ${name}=`)\n  if (parts.length === 2) return parts.pop().split(\';\').shift()\n  return null\n}\n\n// 删除 Cookie\nfunction deleteCookie(name) {\n  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`\n}\n\n// 设置带属性的 Cookie\nfunction setCookie(name, value, days = 7, path = \'/\') {\n  const expires = new Date(Date.now() + days * 864e5).toUTCString()\n  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; samesite=lax`\n}\n\n// Cookie 属性说明\n// - expires/max-age: 过期时间\n// - path: 生效路径\n// - domain: 生效域名\n// - secure: 仅 HTTPS\n// - samesite: 跨站请求控制</code></pre>',
    tags: ['Cookies', 'document.cookie', '存储']
  },
  'canvas-api': {
    title: 'Canvas API',
    body: '<p class="lead">Canvas API 用于动态绘制图形和图像。</p><pre><code>const canvas = document.getElementById(\'myCanvas\')\nconst ctx = canvas.getContext(\'2d\')\n\n// 绘制矩形\nctx.fillStyle = \'blue\'\nctx.fillRect(10, 10, 100, 50)\nctx.strokeStyle = \'red\'\nctx.strokeRect(10, 10, 100, 50)\n\n// 绘制路径\nctx.beginPath()\nctx.moveTo(50, 50)\nctx.lineTo(100, 100)\nctx.lineTo(150, 50)\nctx.closePath()\nctx.fill()\nctx.stroke()\n\n// 绘制圆形\nctx.beginPath()\nctx.arc(100, 100, 40, 0, Math.PI * 2)\nctx.fillStyle = \'green\'\nctx.fill()\n\n// 绘制文本\nctx.font = \'20px Arial\'\nctx.fillStyle = \'black\'\nctx.fillText(\'Hello Canvas\', 50, 50)\n\n// 绘制图像\nconst img = new Image()\nimg.onload = () =&gt; ctx.drawImage(img, 0, 0, 200, 150)\nimg.src = \'image.png\'\n\n// 像素操作\nconst imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)\nfor (let i = 0; i &lt; imageData.data.length; i += 4) {\n  const gray = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3\n  imageData.data[i] = gray     // R\n  imageData.data[i+1] = gray   // G\n  imageData.data[i+2] = gray   // B\n}\nctx.putImageData(imageData, 0, 0)</code></pre>',
    tags: ['Canvas', '2D绘图', '图形']
  },
  'webgl-api': {
    title: 'WebGL API',
    body: '<p class="lead">WebGL 是基于 OpenGL ES 的 3D 图形 API。</p><pre><code>const canvas = document.getElementById(\'glCanvas\')\nconst gl = canvas.getContext(\'webgl\')\n\nif (!gl) {\n  console.log(\'WebGL 不支持\')\n}\n\n// 设置视口\ngl.viewport(0, 0, canvas.width, canvas.height)\ngl.clearColor(0.0, 0.0, 0.0, 1.0)\ngl.clear(gl.COLOR_BUFFER_BIT)\n\n// 着色器程序\nconst vertexShaderSource = `\n  attribute vec2 a_position;\n  void main() {\n    gl_Position = vec4(a_position, 0.0, 1.0);\n  }\n`\n\nconst fragmentShaderSource = `\n  void main() {\n    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n  }\n`\n\n// 编译着色器、链接着色器程序...\n// 推荐使用 Three.js 等库简化 WebGL 开发</code></pre>',
    tags: ['WebGL', '3D图形', 'OpenGL']
  },
  'webaudio-api': {
    title: 'Web Audio API',
    body: '<p class="lead">Web Audio API 用于处理和合成音频。</p><pre><code>// 创建音频上下文\nconst audioContext = new (window.AudioContext || window.webkitAudioContext)()\n\n// 创建振荡器（声音源）\nconst oscillator = audioContext.createOscillator()\noscillator.type = \'sine\'  // sine, square, sawtooth, triangle\noscillator.frequency.value = 440  // A4 音符\n\n// 创建增益节点（音量控制）\nconst gainNode = audioContext.createGain()\ngainNode.gain.value = 0.5\n\n// 连接节点\noscillator.connect(gainNode)\ngainNode.connect(audioContext.destination)\n\n// 播放\noscillator.start()\n\n// 停止（2秒后）\nsetTimeout(() =&gt; {\n  oscillator.stop()\n  audioContext.close()\n}, 2000)\n\n// 加载并播放音频文件\nasync function playAudio(url) {\n  const response = await fetch(url)\n  const arrayBuffer = await response.arrayBuffer()\n  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)\n  \n  const source = audioContext.createBufferSource()\n  source.buffer = audioBuffer\n  source.connect(audioContext.destination)\n  source.start()\n}</code></pre>',
    tags: ['Web Audio', '音频处理', '合成器']
  },
  'mediastream-api': {
    title: 'MediaStream API',
    body: '<p class="lead">MediaStream API 用于获取用户媒体设备（摄像头、麦克风）。</p><pre><code>// 获取用户媒体\nasync function getMedia() {\n  try {\n    const stream = await navigator.mediaDevices.getUserMedia({\n      video: true,\n      audio: true\n    })\n    \n    // 显示视频\n    const video = document.getElementById(\'video\')\n    video.srcObject = stream\n    video.play()\n    \n    return stream\n  } catch (error) {\n    console.error(\'获取媒体失败:\', error)\n  }\n}\n\n// 截取照片\nfunction takePhoto(video, canvas) {\n  const context = canvas.getContext(\'2d\')\n  canvas.width = video.videoWidth\n  canvas.height = video.videoHeight\n  context.drawImage(video, 0, 0, canvas.width, canvas.height)\n  return canvas.toDataURL(\'image/png\')\n}\n\n// 枚举设备\nconst devices = await navigator.mediaDevices.enumerateDevices()\ndevices.forEach(device =&gt; {\n  console.log(`${device.kind}: ${device.label}`)\n})\n\n// 屏幕共享\nconst screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })</code></pre>',
    tags: ['MediaStream', '摄像头', '麦克风']
  },
  'geolocation-api': {
    title: 'Geolocation API',
    body: '<p class="lead">Geolocation API 获取用户地理位置。</p><pre><code>// 获取当前位置\nnavigator.geolocation.getCurrentPosition(\n  (position) =&gt; {\n    console.log(\'纬度:\', position.coords.latitude)\n    console.log(\'经度:\', position.coords.longitude)\n    console.log(\'精度:\', position.coords.accuracy)\n  },\n  (error) =&gt; {\n    switch(error.code) {\n      case error.PERMISSION_DENIED:\n        console.log(\'用户拒绝授权\')\n        break\n      case error.POSITION_UNAVAILABLE:\n        console.log(\'位置不可用\')\n        break\n      case error.TIMEOUT:\n        console.log(\'超时\')\n        break\n    }\n  },\n  { enableHighAccuracy: true, timeout: 5000 }\n)\n\n// 持续监听\nconst watchId = navigator.geolocation.watchPosition(\n  (position) =&gt; console.log(\'位置更新:\', position.coords),\n  (error) =&gt; console.error(error)\n)\n\n// 停止监听\nnavigator.geolocation.clearWatch(watchId)</code></pre>',
    tags: ['Geolocation', '地理位置', 'GPS']
  },
  'device-orientation': {
    title: 'Device Orientation',
    body: '<p class="lead">设备方向 API 获取设备的物理方向。</p><pre><code>// 监听设备方向\nwindow.addEventListener(\'deviceorientation\', (event) =&gt; {\n  console.log(\'alpha:\', event.alpha)   // 指南针方向 0-360\n  console.log(\'beta:\', event.beta)     // 前后倾斜 -180-180\n  console.log(\'gamma:\', event.gamma)   // 左右倾斜 -90-90\n})\n\n// 监听设备移动\nwindow.addEventListener(\'devicemotion\', (event) =&gt; {\n  console.log(\'加速度:\', event.acceleration)\n  console.log(\'加速度（含重力）:\', event.accelerationIncludingGravity)\n  console.log(\'旋转速率:\', event.rotationRate)\n})\n\n// 请求权限（iOS 13+）\nif (typeof DeviceOrientationEvent.requestPermission === \'function\') {\n  DeviceOrientationEvent.requestPermission()\n    .then(permissionState =&gt; {\n      if (permissionState === \'granted\') {\n        window.addEventListener(\'deviceorientation\', handler)\n      }\n    })\n}</code></pre>',
    tags: ['设备方向', '陀螺仪', '传感器']
  },
  'vibration-api': {
    title: 'Vibration API',
    body: '<p class="lead">Vibration API 控制设备振动（移动端）。</p><pre><code>// 检查支持\nif (\'vibrate\' in navigator) {\n  console.log(\'支持振动\')\n}\n\n// 单次振动（毫秒）\nnavigator.vibrate(200)\n\n// 振动模式\nnavigator.vibrate([200, 100, 200, 100, 500])\n\n// 停止振动\nnavigator.vibrate(0)\nnavigator.vibrate([])\n\n// 按钮振动反馈\ndocument.querySelector(\'button\').addEventListener(\'click\', () =&gt; {\n  navigator.vibrate(50)\n})</code></pre>',
    tags: ['Vibration', '振动', '触觉反馈']
  },
  'battery-api': {
    title: 'Battery Status API',
    body: '<p class="lead">Battery API 获取设备电池状态信息。</p><pre><code>// 获取电池信息\nnavigator.getBattery().then(battery =&gt; {\n  console.log(\'电量:\', battery.level * 100, \'%\')  // 0-1\n  console.log(\'是否充电:\', battery.charging)\n  console.log(\'充电时间:\', battery.chargingTime)\n  console.log(\'放电时间:\', battery.dischargingTime)\n  \n  // 监听变化\n  battery.onlevelchange = () =&gt; {\n    console.log(\'电量变化:\', battery.level)\n  }\n  \n  battery.onchargingchange = () =&gt; {\n    console.log(\'充电状态变化:\', battery.charging)\n  }\n})\n\n// 低电量检测\nnavigator.getBattery().then(battery =&gt; {\n  if (battery.level &lt; 0.2 && !battery.charging) {\n    console.log(\'电量不足，请连接充电器\')\n  }\n})</code></pre>',
    tags: ['Battery', '电量', '节能']
  },
  'intersection-observer': {
    title: 'Intersection Observer',
    body: '<p class="lead">Intersection Observer 监听元素与视口的交叉状态。</p><pre><code>// 创建观察器\nconst observer = new IntersectionObserver((entries) =&gt; {\n  entries.forEach(entry =&gt; {\n    if (entry.isIntersecting) {\n      console.log(\'元素进入视口\', entry.target)\n      entry.target.classList.add(\'visible\')\n      observer.unobserve(entry.target)  // 只触发一次\n    }\n  })\n}, {\n  threshold: 0.5,      // 可见比例阈值\n  rootMargin: \'0px\'     // 扩展边界\n})\n\n// 观察元素\nconst elements = document.querySelectorAll(\'.lazy-load\')\nelements.forEach(el =&gt; observer.observe(el))\n\n// 无限滚动\nconst loadMoreObserver = new IntersectionObserver((entries) =&gt; {\n  if (entries[0].isIntersecting) {\n    loadMoreItems()\n  }\n})\nloadMoreObserver.observe(document.querySelector(\'#sentinel\'))\n\n// 广告曝光追踪\nconst adObserver = new IntersectionObserver((entries) =&gt; {\n  entries.forEach(entry =&gt; {\n    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {\n      console.log(\'广告曝光:\', entry.target)\n    }\n  })\n}, { threshold: 0.5 })</code></pre>',
    tags: ['Intersection Observer', '懒加载', '无限滚动']
  },
  'mutation-observer': {
    title: 'Mutation Observer',
    body: '<p class="lead">Mutation Observer 监听 DOM 树的变化。</p><pre><code>// 创建观察器\nconst observer = new MutationObserver((mutations) =&gt; {\n  mutations.forEach(mutation =&gt; {\n    console.log(\'类型:\', mutation.type)\n    console.log(\'目标:\', mutation.target)\n    \n    if (mutation.type === \'childList\') {\n      console.log(\'添加的节点:\', mutation.addedNodes)\n      console.log(\'移除的节点:\', mutation.removedNodes)\n    }\n    \n    if (mutation.type === \'attributes\') {\n      console.log(\'属性名:\', mutation.attributeName)\n      console.log(\'旧值:\', mutation.oldValue)\n    }\n  })\n})\n\n// 配置观察选项\nobserver.observe(document.body, {\n  attributes: true,     // 监听属性变化\n  attributeOldValue: true,  // 记录旧值\n  childList: true,      // 监听子节点变化\n  subtree: true,        // 监听所有后代节点\n  characterData: true   // 监听文本内容\n})\n\n// 停止观察\nobserver.disconnect()</code></pre>',
    tags: ['Mutation Observer', 'DOM监听', '变化检测']
  },
  'resize-observer': {
    title: 'Resize Observer',
    body: '<p class="lead">Resize Observer 监听元素尺寸变化。</p><pre><code>// 创建观察器\nconst observer = new ResizeObserver((entries) =&gt; {\n  entries.forEach(entry =&gt; {\n    console.log(\'元素:\', entry.target)\n    console.log(\'内容矩形:\', entry.contentRect)\n    console.log(\'边框尺寸:\', entry.borderBoxSize)\n    console.log(\'内容尺寸:\', entry.contentBoxSize)\n  })\n})\n\n// 观察元素\nconst element = document.querySelector(\'.resizable\')\nobserver.observe(element)\n\n// 观察多个元素\ndocument.querySelectorAll(\'.component\').forEach(el =&gt; {\n  observer.observe(el)\n})\n\n// 停止观察\nobserver.unobserve(element)\nobserver.disconnect()\n\n// 响应式组件示例\nconst componentObserver = new ResizeObserver((entries) =&gt; {\n  entries.forEach(entry =&gt; {\n    const width = entry.contentRect.width\n    if (width &lt; 400) {\n      entry.target.classList.add(\'compact-mode\')\n    } else {\n      entry.target.classList.remove(\'compact-mode\')\n    }\n  })\n})</code></pre>',
    tags: ['Resize Observer', '尺寸监听', '响应式']
  },
  'performance-api': {
    title: 'Performance API',
    body: '<p class="lead">Performance API 用于测量页面性能。</p><pre><code>// 导航计时\nconst timing = performance.timing\nconsole.log(\'页面加载时间:\', timing.loadEventEnd - timing.navigationStart)\nconsole.log(\'DNS 解析时间:\', timing.domainLookupEnd - timing.domainLookupStart)\nconsole.log(\'TCP 连接时间:\', timing.connectEnd - timing.connectStart)\nconsole.log(\'请求响应时间:\', timing.responseEnd - timing.requestStart)\n\n// 资源计时\nconst resources = performance.getEntriesByType(\'resource\')\nresources.forEach(resource =&gt; {\n  console.log(`${resource.name}: ${resource.duration}ms`)\n})\n\n// 自定义计时\nperformance.mark(\'startTask\')\n// ... 执行任务\nperformance.mark(\'endTask\')\nperformance.measure(\'taskDuration\', \'startTask\', \'endTask\')\nconst measure = performance.getEntriesByName(\'taskDuration\')[0]\nconsole.log(\'任务耗时:\', measure.duration, \'ms\')\n\n// 页面可见性 API\ndocument.addEventListener(\'visibilitychange\', () =&gt; {\n  if (document.hidden) {\n    console.log(\'页面隐藏\')\n  } else {\n    console.log(\'页面可见\')\n  }\n})\n\n// 网络信息 API\nconst connection = navigator.connection || navigator.mozConnection\nif (connection) {\n  console.log(\'网络类型:\', connection.effectiveType)\n  connection.addEventListener(\'change\', () =&gt; {\n    console.log(\'网络变化:\', connection.effectiveType)\n  })\n}</code></pre>',
    tags: ['Performance', '性能监控', '计时']
  },
  'permissions-api': {
    title: 'Permissions API',
    body: '<p class="lead">Permissions API 查询和请求权限状态。</p><pre><code>// 查询权限状态\nasync function checkPermission(permissionName) {\n  try {\n    const status = await navigator.permissions.query({ name: permissionName })\n    console.log(`权限 ${permissionName}:`, status.state)  // granted, denied, prompt\n    \n    status.addEventListener(\'change\', () =&gt; {\n      console.log(`权限变化: ${status.state}`)\n    })\n    \n    return status.state\n  } catch (error) {\n    console.log(`不支持查询 ${permissionName} 权限`)\n  }\n}\n\n// 查询不同权限\ncheckPermission(\'geolocation\')\ncheckPermission(\'notifications\')\ncheckPermission(\'camera\')\ncheckPermission(\'microphone\')\n\n// 请求权限示例\nasync function requestGeolocation() {\n  const status = await navigator.permissions.query({ name: \'geolocation\' })\n  \n  if (status.state === \'granted\') {\n    getLocation()\n  } else if (status.state === \'prompt\') {\n    // 调用 API 会触发权限弹窗\n    navigator.geolocation.getCurrentPosition(() =&gt; {})\n  } else {\n    alert(\'请手动开启位置权限\')\n  }\n}</code></pre>',
    tags: ['Permissions', '权限管理', '安全']
  },
  'credentials-api': {
    title: 'Credentials API',
    body: '<p class="lead">Credentials API 管理用户凭证。</p><pre><code>// 存储密码凭证\nasync function storeCredential(username, password) {\n  const credential = new PasswordCredential({\n    id: username,\n    password: password,\n    name: username\n  })\n  await navigator.credentials.store(credential)\n}\n\n// 获取凭证\nasync function getCredential() {\n  const credential = await navigator.credentials.get({\n    password: true,\n    mediation: \'optional\'\n  })\n  \n  if (credential) {\n    console.log(\'用户名:\', credential.id)\n    console.log(\'密码:\', credential.password)\n    return credential\n  }\n}\n\n// 联邦凭证（如 Google 登录）\nasync function federatedSignIn() {\n  const credential = await navigator.credentials.get({\n    federated: { providers: [\'https://accounts.google.com\'] }\n  })\n}\n\n// 防止自动填充\n&lt;input type="username" autocomplete="off"&gt;</code></pre>',
    tags: ['Credentials', '密码管理', '自动填充']
  },
  'crypto-api': {
    title: 'Web Crypto API',
    body: '<p class="lead">Web Crypto API 提供加密功能。</p><pre><code>// 生成随机数\nconst randomBytes = crypto.getRandomValues(new Uint8Array(16))\nconsole.log(\'随机数:\', randomBytes)\n\n// 计算哈希\nasync function hashMessage(message) {\n  const encoder = new TextEncoder()\n  const data = encoder.encode(message)\n  const hash = await crypto.subtle.digest(\'SHA-256\', data)\n  return Array.from(new Uint8Array(hash)).map(b =&gt; b.toString(16).padStart(2, \'0\')).join(\'\')\n}\n\n// 生成密钥\nasync function generateKey() {\n  const key = await crypto.subtle.generateKey(\n    { name: \'AES-GCM\', length: 256 },\n    true,\n    [\'encrypt\', \'decrypt\']\n  )\n  return key\n}\n\n// 加密数据\nasync function encryptData(key, data) {\n  const iv = crypto.getRandomValues(new Uint8Array(12))\n  const encodedData = new TextEncoder().encode(data)\n  const encrypted = await crypto.subtle.encrypt(\n    { name: \'AES-GCM\', iv },\n    key,\n    encodedData\n  )\n  return { encrypted, iv }\n}</code></pre>',
    tags: ['Crypto', '加密', '安全']
  },
  'trusted-types': {
    title: 'Trusted Types',
    body: '<p class="lead">Trusted Types 防止 DOM XSS 攻击。</p><pre><code>// 创建策略\nconst policy = trustedTypes.createPolicy(\'myPolicy\', {\n  createHTML: (input) =&gt; {\n    // 清理 HTML\n    return input.replace(/&lt;script&gt;/gi, \'&amp;lt;script&amp;gt;\')\n  }\n})\n\n// 使用安全 HTML\nconst safeHtml = policy.createHTML(\'&lt;div&gt;Safe&lt;/div&gt;\')\nelement.innerHTML = safeHtml\n\n// 检测是否启用\nif (window.trustedTypes) {\n  console.log(\'Trusted Types 已启用\')\n}\n\n// 设置 Content-Security-Policy\n// Content-Security-Policy: require-trusted-types-for \'script\'</code></pre>',
    tags: ['Trusted Types', 'XSS防护', '安全']
  },
  'service-workers': {
    title: 'Service Workers',
    body: '<p class="lead">Service Worker 是浏览器后台脚本，用于离线缓存、推送通知等。</p><pre><code>// 注册 Service Worker\nif (\'serviceWorker\' in navigator) {\n  navigator.serviceWorker.register(\'/sw.js\')\n    .then(reg =&gt; console.log(\'注册成功:\', reg.scope))\n    .catch(err =&gt; console.error(\'注册失败:\', err))\n}\n\n// sw.js - 安装事件\nself.addEventListener(\'install\', (event) =&gt; {\n  event.waitUntil(\n    caches.open(\'v1\').then(cache =&gt; {\n      return cache.addAll([\'/\', \'/styles.css\', \'/script.js\'])\n    })\n  )\n})\n\n// 拦截请求\nself.addEventListener(\'fetch\', (event) =&gt; {\n  event.respondWith(\n    caches.match(event.request).then(response =&gt; {\n      return response || fetch(event.request)\n    })\n  )\n})\n\n// 推送通知\nself.addEventListener(\'push\', (event) =&gt; {\n  const data = event.data.json()\n  event.waitUntil(\n    self.registration.showNotification(data.title, {\n      body: data.body,\n      icon: \'/icon.png\'\n    })\n  )\n})</code></pre>',
    tags: ['Service Worker', 'PWA', '离线缓存']
  },
  'web-workers': {
    title: 'Web Workers',
    body: '<p class="lead">Web Worker 在后台线程运行 JavaScript，不阻塞 UI。</p><pre><code>// 主线程\nconst worker = new Worker(\'worker.js\')\n\nworker.postMessage({ task: \'calculate\', data: [1, 2, 3, 4] })\n\nworker.onmessage = (event) =&gt; {\n  console.log(\'Worker 返回:\', event.data)\n}\n\nworker.onerror = (error) =&gt; {\n  console.error(\'Worker 错误:\', error)\n}\n\n// worker.js - Worker 线程\nself.onmessage = (event) =&gt; {\n  const { task, data } = event.data\n  \n  if (task === \'calculate\') {\n    const result = data.reduce((a, b) =&gt; a + b, 0)\n    self.postMessage({ result })\n  }\n}\n\n// 终止 Worker\nworker.terminate()\n\n// Shared Worker（多页面共享）\nconst sharedWorker = new SharedWorker(\'shared-worker.js\')\nsharedWorker.port.start()\nsharedWorker.port.postMessage(\'hello\')</code></pre>',
    tags: ['Web Worker', '多线程', '后台任务']
  },
  'web-components': {
    title: 'Web Components',
    body: '<p class="lead">Web Components 用于创建可复用的自定义元素。</p><pre><code>// 定义自定义元素\nclass MyElement extends HTMLElement {\n  constructor() {\n    super()\n    this.attachShadow({ mode: \'open\' })\n  }\n  \n  connectedCallback() {\n    this.shadowRoot.innerHTML = `\n      &lt;style&gt;\n        .container { color: blue; }\n      &lt;/style&gt;\n      &lt;div class="container"&gt;\n        &lt;slot&gt;&lt;/slot&gt;\n      &lt;/div&gt;\n    `\n  }\n  \n  static get observedAttributes() {\n    return [\'color\']\n  }\n  \n  attributeChangedCallback(name, oldValue, newValue) {\n    if (name === \'color\') {\n      this.style.color = newValue\n    }\n  }\n}\n\ncustomElements.define(\'my-element\', MyElement)\n\n// 使用自定义元素\n// &lt;my-element color="red"&gt;Hello World&lt;/my-element&gt;</code></pre>',
    tags: ['Web Components', '自定义元素', 'Shadow DOM']
  },
  'webassembly': {
    title: 'WebAssembly',
    body: '<p class="lead">WebAssembly 是二进制指令格式，可在浏览器中运行高性能代码。</p><pre><code>// 加载 WebAssembly 模块\nasync function loadWasm() {\n  const response = await fetch(\'module.wasm\')\n  const bytes = await response.arrayBuffer()\n  const { instance } = await WebAssembly.instantiate(bytes, {\n    env: {\n      console_log: (msg) =&gt; console.log(msg)\n    }\n  })\n  \n  // 调用导出函数\n  const result = instance.exports.add(5, 3)\n  console.log(\'5 + 3 =\', result)\n}\n\n// 从 C/C++ 编译：emcc -o module.wasm module.c\n\n// WebAssembly 特性检测\nif (typeof WebAssembly === \'object\') {\n  console.log(\'支持 WebAssembly\')\n}\n\n// 编译并实例化\nWebAssembly.compile(bytes).then(module =&gt; {\n  const instance = new WebAssembly.Instance(module, imports)\n})</code></pre>',
    tags: ['WebAssembly', '高性能', '二进制']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 MDN Web API 文档获取更多信息。</p>',
        tags: ['Web API', '浏览器']
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

addLink('browser-api-intro', 'window-api')
addLink('browser-api-intro', 'navigator-api')
addLink('browser-api-intro', 'feature-detection')
addLink('fetch-api', 'beacon-api')
addLink('websocket-api', 'sse-api')
addLink('localstorage-api', 'indexeddb-api')
addLink('localstorage-api', 'cache-api')
addLink('canvas-api', 'webgl-api')
addLink('canvas-api', 'webaudio-api')
addLink('geolocation-api', 'device-orientation')
addLink('intersection-observer', 'mutation-observer')
addLink('intersection-observer', 'resize-observer')
addLink('service-workers', 'cache-api')
addLink('service-workers', 'web-workers')
addLink('web-components', 'shadow-dom')
addLink('permissions-api', 'credentials-api')
addLink('crypto-api', 'trusted-types')

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