<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">HTTP 知识库</h1>
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
          <h2>🌐 <span class="gradient-text">HTTP 完全指南</span></h2>
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
          <p>🌐 超文本传输协议 | Web 通信基础</p>
          <p>✨ 点击节点双向联动 | 从基础到进阶</p>
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
          <h3>🔗 HTTP 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'HTTP学习者'
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

// ========== HTTP 导航数据 ==========
const navSections = ref([
  { title: '📖 HTTP 基础', items: [
      { id: 'http-intro', label: 'HTTP 简介', hot: true },
      { id: 'http-history', label: 'HTTP 版本演进', hot: true },
      { id: 'url-structure', label: 'URL 结构', hot: true },
      { id: 'http-message', label: 'HTTP 报文', hot: true }
    ]},
  { title: '🔧 HTTP 方法', items: [
      { id: 'http-methods', label: '请求方法', hot: true },
      { id: 'get-vs-post', label: 'GET vs POST', hot: true },
      { id: 'idempotent', label: '幂等性与安全性', hot: true }
    ]},
  { title: '📊 HTTP 状态码', items: [
      { id: 'status-codes', label: '状态码概述', hot: true },
      { id: 'status-2xx', label: '2xx 成功', hot: true },
      { id: 'status-3xx', label: '3xx 重定向', hot: true },
      { id: 'status-4xx', label: '4xx 客户端错误', hot: true },
      { id: 'status-5xx', label: '5xx 服务端错误', hot: true }
    ]},
  { title: '📋 HTTP 头部', items: [
      { id: 'http-headers', label: '头部概述', hot: true },
      { id: 'content-headers', label: '内容协商头部', hot: true },
      { id: 'cache-headers', label: '缓存控制', hot: true },
      { id: 'auth-headers', label: '认证头部', hot: true },
      { id: 'cors-headers', label: 'CORS 头部', hot: true }
    ]},
  { title: '🍪 Cookie 与 Session', items: [
      { id: 'cookies', label: 'Cookie 详解', hot: true },
      { id: 'session', label: 'Session 机制', hot: true },
      { id: 'jwt', label: 'JWT 认证', hot: true }
    ]},
  { title: '🚀 高级特性', items: [
      { id: 'https', label: 'HTTPS', hot: true },
      { id: 'http2', label: 'HTTP/2', hot: true },
      { id: 'http3', label: 'HTTP/3', hot: true },
      { id: 'websocket', label: 'WebSocket', hot: true },
      { id: 'sse', label: 'Server-Sent Events' }
    ]}
])

const selectedId = ref('http-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== HTTP 内容映射表 ==========
const contentMap = {
  'http-intro': {
    title: 'HTTP 简介',
    body: '<p class="lead">HTTP（HyperText Transfer Protocol，超文本传输协议）是用于从 Web 服务器传输超文本到本地浏览器的应用层协议，是万维网数据通信的基础。</p><h3>核心特点</h3><ul><li><strong>无状态</strong>：每个请求独立，服务器不保留之前请求信息</li><li><strong>基于请求-响应模型</strong>：客户端发起请求，服务器返回响应</li><li><strong>可扩展</strong>：通过头部和状态码可扩展功能</li><li><strong>明文传输</strong>（HTTP）/加密传输（HTTPS）</li></ul><div class="note">💡 HTTP 由 Tim Berners-Lee 于 1989 年发明，现由 IETF 和 W3C 维护。</div>',
    tags: ['HTTP', '应用层协议', 'Web基础']
  },
  'http-history': {
    title: 'HTTP 版本演进',
    body: '<p class="lead">HTTP 协议经历了多个版本的演进，每个版本都带来了重要的改进。</p><table class="mdn-table"><thead><tr><th>版本</th><th>发布时间</th><th>主要特性</th></tr></thead><tbody><tr><td>HTTP/0.9</td><td>1991</td><td>只有 GET 方法，无头部，只能传输 HTML</td></tr><tr><td>HTTP/1.0</td><td>1996</td><td>新增 POST、HEAD 方法，引入头部、状态码</td></tr><tr><td>HTTP/1.1</td><td>1997</td><td>持久连接、管道化、分块传输、缓存控制</td></tr><tr><td>HTTP/2</td><td>2015</td><td>二进制协议、多路复用、服务器推送、头部压缩</td></tr><tr><td>HTTP/3</td><td>2022</td><td>基于 QUIC，解决队头阻塞，连接迁移</td></tr></tbody></table><pre><code>// HTTP/1.1 请求示例\nGET /index.html HTTP/1.1\nHost: www.example.com\n\n// HTTP/2 使用二进制帧\n// HTTP/3 使用 QUIC (基于 UDP)</code></pre>',
    tags: ['版本演进', 'HTTP/1.1', 'HTTP/2', 'HTTP/3']
  },
  'url-structure': {
    title: 'URL 结构',
    body: '<p class="lead">URL（Uniform Resource Locator）是 Web 上资源的唯一标识符。</p><pre><code>https://www.example.com:8080/path/to/file?name=value#section\n│      │           │     │              │            │\n协议    主机        端口   路径            查询参数      锚点\n\n// 完整 URL 组成\nURL = scheme://[userinfo@]host[:port]/path[?query][#fragment]\n\n// 示例\nconst url = new URL("https://user:pass@example.com:8080/api/data?page=2&size=10#results")\nconsole.log(url.protocol)   // "https:"\nconsole.log(url.hostname)   // "example.com"\nconsole.log(url.port)       // "8080"\nconsole.log(url.pathname)   // "/api/data"\nconsole.log(url.search)     // "?page=2&size=10"\nconsole.log(url.hash)       // "#results"\nconsole.log(url.username)   // "user"\nconsole.log(url.password)   // "pass"\n\n// 编码/解码\nencodeURIComponent("中文")  // "%E4%B8%AD%E6%96%87"\ndecodeURIComponent("%E4%B8%AD%E6%96%87")  // "中文"</code></pre>',
    tags: ['URL', 'URI', '资源定位']
  },
  'http-message': {
    title: 'HTTP 报文',
    body: '<p class="lead">HTTP 报文由起始行、头部字段和可选的消息体组成。</p><pre><code>// 请求报文\nGET /api/users HTTP/1.1          // 请求行\nHost: example.com                // 请求头\nUser-Agent: Mozilla/5.0\nAccept: application/json\nAuthorization: Bearer token123\n\n{ "name": "John" }               // 消息体\n\n// 响应报文\nHTTP/1.1 200 OK                  // 状态行\nContent-Type: application/json   // 响应头\nContent-Length: 42\nCache-Control: max-age=3600\n\n{ "id": 1, "name": "John" }      // 消息体\n\n// 报文结构\n// 1. 起始行（请求行/状态行）\n// 2. 头部字段（key: value）\n// 3. 空行（CRLF）\n// 4. 消息体（可选）</code></pre>',
    tags: ['报文', '请求', '响应']
  },
  'http-methods': {
    title: '请求方法',
    body: '<p class="lead">HTTP 方法指示请求想要执行的操作类型。</p><table class="mdn-table"><thead><tr><th>方法</th><th>描述</th><th>是否携带 Body</th></tr></thead><tbody><tr><td>GET</td><td>获取资源</td><td>否</td></tr><tr><td>POST</td><td>创建资源或提交数据</td><td>是</td></tr><tr><td>PUT</td><td>完整更新资源</td><td>是</td></tr><tr><td>PATCH</td><td>部分更新资源</td><td>是</td></tr><tr><td>DELETE</td><td>删除资源</td><td>否</td></tr><tr><td>HEAD</td><td>获取响应头（无 Body）</td><td>否</td></tr><tr><td>OPTIONS</td><td>获取支持的请求方法</td><td>否</td></tr><tr><td>TRACE</td><td>回显请求（调试用）</td><td>否</td></tr><tr><td>CONNECT</td><td>建立隧道连接（代理用）</td><td>否</td></tr></tbody></table>',
    tags: ['请求方法', 'GET', 'POST', 'PUT', 'DELETE']
  },
  'get-vs-post': {
    title: 'GET vs POST',
    body: '<p class="lead">GET 和 POST 是最常用的 HTTP 方法，它们有重要区别。</p><table class="mdn-table"><thead><tr><th>特性</th><th>GET</th><th>POST</th></tr></thead><tbody><tr><td>数据位置</td><td>URL 查询字符串</td><td>消息体</td></tr><tr><td>数据长度限制</td><td>有限（URL 长度限制）</td><td>无限制</td></tr><tr><td>可见性</td><td>参数可见于 URL</td><td>参数不在 URL 中</td></tr><tr><td>缓存</td><td>可缓存</td><td>不可缓存</td></tr><tr><td>书签</td><td>可保存为书签</td><td>不可保存</td></tr><tr><td>历史记录</td><td>保留在历史中</td><td>不保留</td></tr><tr><td>数据类型</td><td>仅 ASCII</td><td>任意类型（二进制等）</td></tr><tr><td>安全性</td><td>较低（参数可见）</td><td>较高</td></tr></tbody></table><pre><code>// GET 请求（参数在 URL）\nGET /api/users?id=123&name=John HTTP/1.1\n\n// POST 请求（参数在 Body）\nPOST /api/users HTTP/1.1\nContent-Type: application/json\n\n{ "id": 123, "name": "John" }</code></pre>',
    tags: ['GET', 'POST', '对比']
  },
  'idempotent': {
    title: '幂等性与安全性',
    body: '<p class="lead">幂等性和安全性是理解 HTTP 方法行为的关键概念。</p><h3>安全性</h3><p>安全的 HTTP 方法不会改变服务器状态（只读操作）。<strong>安全方法</strong>：GET, HEAD, OPTIONS, TRACE</p><h3>幂等性</h3><p>幂等的 HTTP 方法无论执行多少次，结果都相同。<strong>幂等方法</strong>：GET, HEAD, PUT, DELETE, OPTIONS, TRACE<br><strong>非幂等方法</strong>：POST, PATCH</p><pre><code>// 幂等示例\nGET /users/123    // 多次请求返回相同结果\nPUT /users/123    // 多次更新后状态一致\nDELETE /users/123 // 多次删除后状态一致\n\n// 非幂等示例\nPOST /users      // 每次创建新资源，结果不同\nPATCH /users/123 // 多次 PATCH 可能产生不同结果</code></pre>',
    tags: ['幂等性', '安全性', 'HTTP方法']
  },
  'status-codes': {
    title: '状态码概述',
    body: '<p class="lead">HTTP 状态码表示服务器对请求的处理结果。</p><h3>状态码分类</h3><ul><li><strong>1xx (信息)</strong>：请求已接收，继续处理</li><li><strong>2xx (成功)</strong>：请求成功处理</li><li><strong>3xx (重定向)</strong>：需要进一步操作</li><li><strong>4xx (客户端错误)</strong>：请求包含错误</li><li><strong>5xx (服务端错误)</strong>：服务器处理失败</li></ul>',
    tags: ['状态码', '分类', 'HTTP响应']
  },
  'status-2xx': {
    title: '2xx 成功',
    body: '<p class="lead">2xx 状态码表示请求已成功处理。</p><pre><code>200 OK           // 请求成功\n201 Created      // 资源创建成功（POST）\n202 Accepted     // 请求已接受，但未处理完成\n204 No Content   // 请求成功，无返回内容（DELETE）\n206 Partial Content // 部分内容（断点续传）\n\n// 使用示例\n// 200: 返回请求的资源\nHTTP/1.1 200 OK\nContent-Type: application/json\n\n{ "id": 1, "name": "Alice" }\n\n// 201: 创建成功，返回 Location 头\nHTTP/1.1 201 Created\nLocation: /users/1\n\n// 204: 删除成功，无 Body\nHTTP/1.1 204 No Content</code></pre>',
    tags: ['200', '201', '204', '成功']
  },
  'status-3xx': {
    title: '3xx 重定向',
    body: '<p class="lead">3xx 状态码表示需要客户端采取进一步操作。</p><pre><code>301 Moved Permanently   // 永久重定向\n302 Found               // 临时重定向\n303 See Other           // 查看其他位置（POST 转 GET）\n304 Not Modified        // 资源未修改（使用缓存）\n307 Temporary Redirect  // 临时重定向（保持方法）\n308 Permanent Redirect  // 永久重定向（保持方法）\n\n// 使用示例\nHTTP/1.1 301 Moved Permanently\nLocation: https://new.example.com/page\n\n// 重定向流程\n// 1. 客户端请求 /old-page\n// 2. 服务器返回 301 + Location: /new-page\n// 3. 客户端自动请求 /new-page</code></pre>',
    tags: ['301', '302', '304', '重定向']
  },
  'status-4xx': {
    title: '4xx 客户端错误',
    body: '<p class="lead">4xx 状态码表示客户端请求存在错误。</p><pre><code>400 Bad Request      // 请求语法错误\n401 Unauthorized     // 未认证\n403 Forbidden        // 无权限访问\n404 Not Found        // 资源不存在\n405 Method Not Allowed // 方法不允许\n408 Request Timeout  // 请求超时\n409 Conflict         // 资源冲突\n410 Gone             // 资源已永久删除\n413 Payload Too Large // 请求体过大\n429 Too Many Requests // 请求过多（限流）\n\n// 使用示例\nHTTP/1.1 404 Not Found\nContent-Type: text/html\n\n&lt;h1&gt;404 - Page Not Found&lt;/h1&gt;\n\nHTTP/1.1 401 Unauthorized\nWWW-Authenticate: Bearer realm="api"</code></pre>',
    tags: ['400', '401', '403', '404', '429']
  },
  'status-5xx': {
    title: '5xx 服务端错误',
    body: '<p class="lead">5xx 状态码表示服务器处理请求失败。</p><pre><code>500 Internal Server Error   // 服务器内部错误\n501 Not Implemented         // 功能未实现\n502 Bad Gateway            // 网关错误\n503 Service Unavailable    // 服务不可用（过载/维护）\n504 Gateway Timeout        // 网关超时\n\n// 使用示例\nHTTP/1.1 500 Internal Server Error\nContent-Type: text/html\n\n&lt;h1&gt;500 - Internal Server Error&lt;/h1&gt;\n&lt;p&gt;Something went wrong on our end.&lt;/p&gt;\n\nHTTP/1.1 503 Service Unavailable\nRetry-After: 3600\n\n// 建议：使用 503 配合 Retry-After 头指示重试时间</code></pre>',
    tags: ['500', '502', '503', '服务端错误']
  },
  'http-headers': {
    title: 'HTTP 头部',
    body: '<p class="lead">HTTP 头部提供了请求和响应的元信息。</p><pre><code>// 通用头（请求和响应都有）\nCache-Control: max-age=3600\nConnection: keep-alive\nDate: Wed, 15 Jan 2025 12:00:00 GMT\n\n// 请求头\nHost: example.com\nUser-Agent: Mozilla/5.0\nAccept: application/json\nAccept-Language: zh-CN\nAuthorization: Bearer token123\nReferer: https://google.com\n\n// 响应头\nContent-Type: application/json\nContent-Length: 1024\nServer: nginx/1.18.0\nSet-Cookie: sessionId=abc123\nLast-Modified: Wed, 15 Jan 2025 10:00:00 GMT\n\n// 实体头\nContent-Encoding: gzip\nContent-Language: zh-CN</code></pre>',
    tags: ['头部', 'Header', '元数据']
  },
  'content-headers': {
    title: '内容协商头部',
    body: '<p class="lead">内容协商允许客户端和服务器就资源的最佳表示达成一致。</p><pre><code>// 客户端请求头\nAccept: application/json, text/html;q=0.9\nAccept-Encoding: gzip, deflate, br\nAccept-Language: zh-CN,zh;q=0.9,en;q=0.8\n\n// 服务器响应头\nContent-Type: application/json\nContent-Encoding: gzip\nContent-Language: zh-CN\nVary: Accept-Encoding, Accept-Language\n\n// q 值（优先级）\n// q=1.0 最高优先级，q=0.1 最低\nAccept: text/html;q=0.9, application/json;q=0.8\n\n// 服务器选择最佳响应\n// 根据 Accept 头选择合适的内容类型</code></pre>',
    tags: ['内容协商', 'Accept', 'Content-Type']
  },
  'cache-headers': {
    title: '缓存控制',
    body: '<p class="lead">HTTP 缓存控制头部优化网络性能和减少带宽消耗。</p><pre><code>// 强缓存\nCache-Control: max-age=3600      // 缓存 1 小时\nCache-Control: max-age=31536000  // 缓存 1 年\nCache-Control: no-cache          // 每次都验证\nCache-Control: no-store          // 完全不缓存\n\n// 协商缓存（客户端验证）\n// 方式一：Last-Modified / If-Modified-Since\nLast-Modified: Wed, 15 Jan 2025 10:00:00 GMT\nIf-Modified-Since: Wed, 15 Jan 2025 10:00:00 GMT\n\n// 方式二：ETag / If-None-Match\nETag: "abc123"\nIf-None-Match: "abc123"\n\n// 缓存响应示例\nHTTP/1.1 304 Not Modified\n\n// 缓存策略\nCache-Control: public, max-age=3600    // 公共缓存\nCache-Control: private, max-age=3600   // 私有缓存（浏览器）\nCache-Control: must-revalidate         // 过期后必须验证</code></pre>',
    tags: ['缓存', 'Cache-Control', 'ETag']
  },
  'auth-headers': {
    title: '认证头部',
    body: '<p class="lead">HTTP 认证头部用于身份验证。</p><pre><code>// Basic 认证（明文）\nAuthorization: Basic base64(username:password)\n// 示例：username:password 的 Base64 编码\nAuthorization: Basic YWxhZGRpbjpvcGVuc2VzYW1l\n\n// Bearer Token（JWT）\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIs...\n\n// Digest 认证（摘要）\nAuthorization: Digest username="admin", realm="api", nonce="...", response="..."\n\n// API Key\nX-API-Key: your-api-key-here\n\n// 服务器要求认证\nHTTP/1.1 401 Unauthorized\nWWW-Authenticate: Basic realm="Access to the API"\n\n// JWT 格式\n// Header.Payload.Signature\neyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVm</code></pre>',
    tags: ['认证', 'Authorization', 'JWT', 'Basic']
  },
  'cors-headers': {
    title: 'CORS 头部',
    body: '<p class="lead">CORS（跨域资源共享）头部控制跨域请求的安全策略。</p><pre><code>// 简单请求\nOrigin: https://example.com\n\n// 响应头（服务器返回）\nAccess-Control-Allow-Origin: https://example.com\nAccess-Control-Allow-Credentials: true\nAccess-Control-Expose-Headers: X-Custom-Header\n\n// 预检请求（OPTIONS）\nOPTIONS /api/data HTTP/1.1\nOrigin: https://example.com\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: Content-Type\n\n// 预检响应\nHTTP/1.1 204 No Content\nAccess-Control-Allow-Origin: https://example.com\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE\nAccess-Control-Allow-Headers: Content-Type, Authorization\nAccess-Control-Max-Age: 86400\n\n// 携带凭证\nfetch(url, { credentials: "include" })\n// 服务器必须返回 Access-Control-Allow-Credentials: true</code></pre>',
    tags: ['CORS', '跨域', 'Access-Control']
  },
  cookies: {
    title: 'Cookie 详解',
    body: '<p class="lead">Cookie 是服务器发送到浏览器并保存在本地的小块数据。</p><pre><code>// 服务器设置 Cookie\nSet-Cookie: sessionId=abc123; Path=/; Domain=.example.com; Max-Age=3600; Secure; HttpOnly; SameSite=Lax\n\n// 客户端发送 Cookie\nCookie: sessionId=abc123; theme=dark\n\n// Cookie 属性\n// - Expires/Max-Age: 过期时间\n// - Path: 生效路径\n// - Domain: 生效域名\n// - Secure: 仅 HTTPS 传输\n// - HttpOnly: 禁止 JS 访问（防 XSS）\n// - SameSite: 跨站请求控制\n//   - Strict: 完全禁止跨站发送\n//   - Lax: 允许导航到目标 URL 时发送\n//   - None: 允许跨站发送（需配合 Secure）\n\n// JavaScript 读写 Cookie\ndocument.cookie = "theme=dark; path=/; max-age=3600"\nconst cookies = document.cookie  // "theme=dark; sessionId=abc123"</code></pre>',
    tags: ['Cookie', 'Set-Cookie', 'SameSite']
  },
  session: {
    title: 'Session 机制',
    body: '<p class="lead">Session 是服务器端保存用户状态的机制。</p><pre><code>// 工作流程\n// 1. 用户登录成功\n// 2. 服务器创建 Session，生成 Session ID\n// 3. 服务器返回 Set-Cookie: sessionId=xxx\n// 4. 后续请求浏览器自动携带 Cookie\n// 5. 服务器根据 Session ID 获取用户状态\n\n// Node.js (express-session) 示例\nconst session = require("express-session")\napp.use(session({\n  secret: "secret-key",\n  resave: false,\n  saveUninitialized: true,\n  cookie: { secure: true, maxAge: 3600000 }\n}))\n\n// 存储 Session 数据\nreq.session.user = { id: 1, name: "Alice" }\n\n// 读取 Session 数据\nconst user = req.session.user\n\n// 销毁 Session\nreq.session.destroy()\n\n// Session 存储方式\n// - 内存（默认，不适合生产）\n// - Redis（推荐）\n// - 数据库（MySQL, MongoDB）\n// - 文件系统</code></pre>',
    tags: ['Session', '会话管理', '用户状态']
  },
  jwt: {
    title: 'JWT 认证',
    body: '<p class="lead">JWT（JSON Web Token）是一种紧凑的、自包含的令牌格式。</p><pre><code>// JWT 结构\nheader.payload.signature\n\neyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.\neyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.\nSflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c\n\n// Header（算法和类型）\n{\n  "alg": "HS256",\n  "typ": "JWT"\n}\n\n// Payload（声明数据）\n{\n  "sub": "1234567890",\n  "name": "John",\n  "iat": 1516239022,\n  "exp": 1516242622\n}\n\n// Signature（签名）\nHMACSHA256(\n  base64UrlEncode(header) + "." + base64UrlEncode(payload),\n  secret\n)\n\n// 使用 JWT\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n\n// Node.js 生成验证\nconst jwt = require("jsonwebtoken")\nconst token = jwt.sign({ userId: 1 }, "secret", { expiresIn: "1h" })\nconst decoded = jwt.verify(token, "secret")</code></pre>',
    tags: ['JWT', '令牌', '认证']
  },
  https: {
    title: 'HTTPS',
    body: '<p class="lead">HTTPS 是在 HTTP 上添加 SSL/TLS 加密层的安全协议。</p><pre><code>// HTTPS 工作流程\n// 1. 客户端请求 HTTPS 连接\n// 2. 服务器返回 SSL 证书\n// 3. 客户端验证证书\n// 4. 客户端生成对称密钥，用公钥加密发送\n// 5. 服务器用私钥解密获得对称密钥\n// 6. 后续通信使用对称加密\n\n// TLS 版本\n// - TLS 1.2（广泛支持）\n// - TLS 1.3（最新，更快更安全）\n\n// HTTPS 优势\n// - 加密传输，防窃听\n// - 身份验证，防伪造\n// - 数据完整性，防篡改\n\n// 获取 Let\'s Encrypt 免费证书\n// certbot certonly --standalone -d example.com\n\n// Node.js HTTPS 服务器\nconst https = require("https")\nconst fs = require("fs")\n\nconst options = {\n  key: fs.readFileSync("private-key.pem"),\n  cert: fs.readFileSync("certificate.pem")\n}\n\nhttps.createServer(options, (req, res) => {\n  res.end("HTTPS Server")\n}).listen(443)</code></pre>',
    tags: ['HTTPS', 'SSL', 'TLS', '加密']
  },
  http2: {
    title: 'HTTP/2',
    body: '<p class="lead">HTTP/2 是 HTTP/1.1 的重大升级，基于二进制协议。</p><pre><code>// HTTP/2 核心特性\n// 1. 二进制协议（替代文本协议）\n// 2. 多路复用（一个连接并发处理多个请求）\n// 3. 服务器推送（主动推送资源）\n// 4. 头部压缩（HPACK 算法）\n// 5. 流量控制\n\n// 多路复用对比\n// HTTP/1.1: 每个请求需要单独连接或队头阻塞\n// HTTP/2: 一个连接上并发处理多个请求/响应\n\n// 服务器推送\n// 客户端请求 index.html\n// 服务器主动推送 style.css 和 script.js\n\n// Nginx 启用 HTTP/2\nserver {\n  listen 443 ssl http2;\n  ssl_certificate cert.pem;\n  ssl_certificate_key key.pem;\n}\n\n// Node.js HTTP/2\nconst http2 = require("http2")\nconst server = http2.createSecureServer(options)\nserver.on("stream", (stream, headers) => {\n  stream.respond({ ":status": 200 })\n  stream.end("Hello World")\n})</code></pre>',
    tags: ['HTTP/2', '多路复用', '服务器推送']
  },
  http3: {
    title: 'HTTP/3',
    body: '<p class="lead">HTTP/3 使用 QUIC 协议，基于 UDP 传输。</p><pre><code>// HTTP/3 核心特性\n// 1. 基于 QUIC（基于 UDP）\n// 2. 解决队头阻塞（HOL blocking）\n// 3. 连接迁移（网络切换保持连接）\n// 4. 0-RTT 连接建立\n// 5. 内置 TLS 1.3\n\n// QUIC 优势\n// - 减少连接延迟\n// - 更好的弱网表现\n// - 连接迁移（WiFi 切换 4G）\n\n// 检查 HTTP/3 支持\nif (window.chrome && window.chrome.loadTimes) {\n  // 检查协议\n}\n\n// Nginx QUIC+HTTP/3 配置（需要编译模块）\nlisten 443 quic reuseport;\nlisten 443 ssl http2;\n\nadd_header Alt-Svc \'h3=":443"; ma=86400\';\n\n// 浏览器支持\n// Chrome, Edge, Firefox 已支持 HTTP/3\n// Safari 部分支持</code></pre>',
    tags: ['HTTP/3', 'QUIC', 'UDP']
  },
  websocket: {
    title: 'WebSocket',
    body: '<p class="lead">WebSocket 提供全双工通信，适用于实时应用。</p><pre><code>// WebSocket 握手（HTTP 升级）\nGET /chat HTTP/1.1\nHost: example.com\nUpgrade: websocket\nConnection: Upgrade\nSec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==\nSec-WebSocket-Version: 13\n\n// 服务器响应\nHTTP/1.1 101 Switching Protocols\nUpgrade: websocket\nConnection: Upgrade\nSec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk=\n\n// 客户端\nconst ws = new WebSocket("wss://example.com/chat")\nws.onopen = () => ws.send("Hello")\nws.onmessage = (e) => console.log(e.data)\n\n// 服务器（Node.js + ws）\nimport WebSocket from "ws"\nconst wss = new WebSocket.Server({ port: 8080 })\nwss.on("connection", (ws) => {\n  ws.on("message", (data) => console.log(data))\n  ws.send("Welcome")\n})</code></pre>',
    tags: ['WebSocket', '全双工', '实时通信']
  },
  sse: {
    title: 'Server-Sent Events',
    body: '<p class="lead">SSE 允许服务器向客户端单向推送事件。</p><pre><code>// 客户端\nconst eventSource = new EventSource("/events")\neventSource.onmessage = (event) => {\n  console.log(event.data)\n}\neventSource.addEventListener("user-update", (e) => {\n  console.log(JSON.parse(e.data))\n})\n\n// 服务器（Node.js）\napp.get("/events", (req, res) => {\n  res.writeHead(200, {\n    "Content-Type": "text/event-stream",\n    "Cache-Control": "no-cache",\n    "Connection": "keep-alive"\n  })\n  \n  setInterval(() => {\n    res.write(`data: ${JSON.stringify({ time: Date.now() })}\\n\\n`)\n  }, 1000)\n})\n\n// 事件格式\ndata: 消息内容\\n\\n\nevent: user-update\\ndata: {"id": 1, "name": "Alice"}\\n\\n\n\n// 重连时间\nretry: 3000\\n\\n</code></pre>',
    tags: ['SSE', '服务器推送', 'EventSource']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 HTTP 官方文档获取更多信息。</p>',
        tags: ['HTTP', '网络协议']
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

addLink('http-intro', 'http-history')
addLink('http-intro', 'url-structure')
addLink('http-intro', 'http-message')
addLink('http-message', 'http-methods')
addLink('http-methods', 'get-vs-post')
addLink('http-methods', 'idempotent')
addLink('status-codes', 'status-2xx')
addLink('status-codes', 'status-3xx')
addLink('status-codes', 'status-4xx')
addLink('status-codes', 'status-5xx')
addLink('http-headers', 'content-headers')
addLink('http-headers', 'cache-headers')
addLink('http-headers', 'auth-headers')
addLink('http-headers', 'cors-headers')
addLink('cookies', 'session')
addLink('session', 'jwt')
addLink('https', 'http2')
addLink('http2', 'http3')
addLink('websocket', 'sse')

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