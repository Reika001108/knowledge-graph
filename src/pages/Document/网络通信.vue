<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">网络通信知识库</h1>
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
          <h2>🌐 <span class="gradient-text">网络通信完全指南</span></h2>
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
          <p>🌐 Web 网络通信技术 | 从基础到进阶</p>
          <p>✨ 点击节点双向联动 | 掌握数据交换核心</p>
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
          <h3>🔗 网络通信知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || '网络开发者'
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

// ========== 网络通信导航数据 ==========
const navSections = ref([
  { title: '🌐 网络基础', items: [
      { id: 'network-intro', label: '网络通信简介', hot: true },
      { id: 'osi-model', label: 'OSI 七层模型', hot: true },
      { id: 'tcp-ip', label: 'TCP/IP 协议族', hot: true },
      { id: 'ip-address', label: 'IP 地址与端口', hot: true }
    ]},
  { title: '📡 HTTP 协议', items: [
      { id: 'http-intro', label: 'HTTP 协议简介', hot: true },
      { id: 'http-methods', label: 'HTTP 请求方法', hot: true },
      { id: 'http-status', label: 'HTTP 状态码', hot: true },
      { id: 'http-headers', label: 'HTTP 头部', hot: true },
      { id: 'http-versions', label: 'HTTP/1.x vs HTTP/2 vs HTTP/3', hot: true }
    ]},
  { title: '🔒 HTTPS', items: [
      { id: 'https-intro', label: 'HTTPS 简介', hot: true },
      { id: 'ssl-tls', label: 'SSL/TLS 加密', hot: true },
      { id: 'certificate', label: '数字证书', hot: true }
    ]},
  { title: '⚡ 网络请求', items: [
      { id: 'xhr', label: 'XMLHttpRequest', hot: true },
      { id: 'fetch-api', label: 'Fetch API', hot: true },
      { id: 'axios', label: 'Axios 库', hot: true },
      { id: 'cors', label: '跨域资源共享 CORS', hot: true }
    ]},
  { title: '🔌 实时通信', items: [
      { id: 'websocket', label: 'WebSocket', hot: true },
      { id: 'sse', label: 'Server-Sent Events', hot: true },
      { id: 'webtransport', label: 'WebTransport', hot: true }
    ]},
  { title: '🎥 多媒体通信', items: [
      { id: 'webrtc', label: 'WebRTC', hot: true },
      { id: 'mediastream', label: 'MediaStream API', hot: true },
      { id: 'rtp-rtcp', label: 'RTP/RTCP 协议', hot: true }
    ]},
  { title: '📦 数据传输', items: [
      { id: 'tcp-vs-udp', label: 'TCP vs UDP', hot: true },
      { id: 'quic', label: 'QUIC 协议', hot: true },
      { id: 'data-encoding', label: '数据传输编码', hot: true }
    ]}
])

const selectedId = ref('network-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== 网络通信内容映射表 ==========
const contentMap = {
  'network-intro': {
    title: '网络通信简介',
    body: '<p class="lead">网络通信是指在不同设备之间通过传输介质进行数据交换的过程，是互联网应用的基础。</p><h3>核心概念</h3><ul><li><strong>协议</strong>：通信双方约定的数据格式和规则</li><li><strong>客户端</strong>：发起请求的一方</li><li><strong>服务器</strong>：提供服务响应的一方</li><li><strong>请求-响应模型</strong>：客户端请求，服务器响应</li></ul><div class="note">💡 Web 开发的核心就是理解和管理网络通信。</div>',
    tags: ['网络', '通信', '协议']
  },
  'osi-model': {
    title: 'OSI 七层模型',
    body: '<p class="lead">OSI 模型将网络通信划分为七个层次，每层负责特定功能。</p><pre><code>7. 应用层 - HTTP, FTP, SMTP\n6. 表示层 - 数据加密、压缩\n5. 会话层 - 建立、管理会话\n4. 传输层 - TCP, UDP\n3. 网络层 - IP 路由\n2. 数据链路层 - MAC 地址\n1. 物理层 - 比特流传输</code></pre><div class="note">💡 实际互联网采用 TCP/IP 四层模型，更简洁实用。</div>',
    tags: ['OSI', '七层模型', '网络分层']
  },
  'tcp-ip': {
    title: 'TCP/IP 协议族',
    body: '<p class="lead">TCP/IP 是互联网的核心协议族，定义了数据如何在网络中传输。</p><pre><code>应用层: HTTP, HTTPS, FTP, SMTP, DNS\n传输层: TCP, UDP\n网络层: IP, ICMP, ARP\n链路层: 以太网, WiFi</code></pre><h3>核心协议</h3><ul><li><strong>IP</strong>：负责数据包路由和寻址</li><li><strong>TCP</strong>：可靠传输，保证数据顺序和完整性</li><li><strong>UDP</strong>：快速传输，不保证可靠性</li></ul>',
    tags: ['TCP/IP', '协议族', '网络']
  },
  'ip-address': {
    title: 'IP 地址与端口',
    body: '<p class="lead">IP 地址标识网络设备，端口标识具体服务。</p><pre><code>// IPv4 地址格式\n192.168.1.1\n\n// IPv6 地址格式\n2001:0db8:85a3:0000:0000:8a2e:0370:7334\n\n// 常见端口\n80: HTTP\n443: HTTPS\n22: SSH\n3306: MySQL\n5432: PostgreSQL\n\n// 本地回环地址\n127.0.0.1 / localhost</code></pre>',
    tags: ['IP地址', '端口', '网络标识']
  },
  'http-intro': {
    title: 'HTTP 协议简介',
    body: '<p class="lead">HTTP（超文本传输协议）是 Web 数据通信的基础，采用请求-响应模型。</p><pre><code>// 请求报文示例\nGET /index.html HTTP/1.1\nHost: www.example.com\nUser-Agent: Mozilla/5.0\nAccept: text/html\n\n// 响应报文示例\nHTTP/1.1 200 OK\nContent-Type: text/html\nContent-Length: 1024\n\n&lt;html&gt;&lt;body&gt;Hello World&lt;/body&gt;&lt;/html&gt;</code></pre>',
    tags: ['HTTP', '请求-响应', 'Web']
  },
  'http-methods': {
    title: 'HTTP 请求方法',
    body: '<p class="lead">HTTP 方法定义了对资源的操作类型。</p><table class="mdn-table"><thead><tr><th>方法</th><th>描述</th><th>幂等性</th></thead><tbody><tr><td>GET</td><td>获取资源</td><td>是</td></tr><tr><td>POST</td><td>创建资源</td><td>否</td></tr><tr><td>PUT</td><td>完整更新</td><td>是</td></tr><tr><td>PATCH</td><td>部分更新</td><td>否</td></tr><tr><td>DELETE</td><td>删除资源</td><td>是</td></tr><tr><td>HEAD</td><td>获取响应头</td><td>是</td></tr><tr><td>OPTIONS</td><td>获取支持方法</td><td>是</td></tr></tbody></table>',
    tags: ['HTTP方法', 'GET', 'POST']
  },
  'http-status': {
    title: 'HTTP 状态码',
    body: '<p class="lead">状态码表示服务器对请求的处理结果。</p><pre><code>1xx: 信息响应\n2xx: 成功\n  200 OK\n  201 Created\n  204 No Content\n3xx: 重定向\n  301 Moved Permanently\n  302 Found\n  304 Not Modified\n4xx: 客户端错误\n  400 Bad Request\n  401 Unauthorized\n  403 Forbidden\n  404 Not Found\n5xx: 服务端错误\n  500 Internal Server Error\n  502 Bad Gateway\n  503 Service Unavailable</code></pre>',
    tags: ['状态码', 'HTTP响应', '错误']
  },
  'http-headers': {
    title: 'HTTP 头部',
    body: '<p class="lead">HTTP 头部提供了请求和响应的元信息。</p><pre><code>// 通用头\nCache-Control: max-age=3600\nConnection: keep-alive\n\n// 请求头\nUser-Agent: Mozilla/5.0\nAccept: application/json\nAuthorization: Bearer token\n\n// 响应头\nContent-Type: application/json\nSet-Cookie: sessionId=abc\nAccess-Control-Allow-Origin: *</code></pre>',
    tags: ['HTTP头', 'Header', '元数据']
  },
  'http-versions': {
    title: 'HTTP/1.x vs HTTP/2 vs HTTP/3',
    body: '<p class="lead">HTTP 协议的版本演进带来了性能提升。</p><table class="mdn-table"><thead><tr><th>版本</th><th>特点</th><th>优势</th></thead><tbody><tr><td>HTTP/1.1</td><td>文本协议、持久连接</td><td>兼容性好</td></tr><tr><td>HTTP/2</td><td>二进制协议、多路复用、服务器推送</td><td>性能大幅提升</td></tr><tr><td>HTTP/3</td><td>基于 QUIC、UDP 传输</td><td>更快的连接建立、抗丢包</td></tr></tbody></table>',
    tags: ['HTTP版本', 'HTTP/2', 'HTTP/3']
  },
  'https-intro': {
    title: 'HTTPS 简介',
    body: '<p class="lead">HTTPS 是 HTTP 的安全版本，通过 SSL/TLS 加密数据传输。</p><pre><code>// HTTPS 工作流程\n1. 客户端发起 HTTPS 请求\n2. 服务器返回 SSL 证书\n3. 客户端验证证书\n4. 生成对称密钥\n5. 加密通信开始</code></pre><div class="note">🔒 HTTPS 已成为 Web 标准，所有现代网站都应该使用。</div>',
    tags: ['HTTPS', '安全', '加密']
  },
  'ssl-tls': {
    title: 'SSL/TLS 加密',
    body: '<p class="lead">SSL/TLS 是传输层安全协议，为网络通信提供加密和认证。</p><pre><code>TLS 1.2 特点:\n- 支持 AES-GCM 加密\n- 支持 SHA-256 签名\n\nTLS 1.3 改进:\n- 更快的握手\n- 移除弱加密算法\n- 0-RTT 连接恢复</code></pre>',
    tags: ['SSL', 'TLS', '加密']
  },
  certificate: {
    title: '数字证书',
    body: '<p class="lead">数字证书用于验证服务器身份，由 CA 机构签发。</p><pre><code>证书内容:\n- 域名信息\n- 公钥\n- 有效期\n- 签发机构\n- 数字签名\n\n获取免费证书:\n- Let\'s Encrypt\n- ZeroSSL</code></pre>',
    tags: ['证书', 'CA', 'HTTPS']
  },
  xhr: {
    title: 'XMLHttpRequest',
    body: '<p class="lead">XMLHttpRequest 是传统的浏览器网络请求 API，支持异步通信。</p><pre><code>const xhr = new XMLHttpRequest()\nxhr.open("GET", "/api/data")\nxhr.onload = () => {\n  if (xhr.status === 200) {\n    console.log(xhr.responseText)\n  }\n}\nxhr.onerror = () => console.error("请求失败")\nxhr.send()\n\n// POST 请求\nconst xhr2 = new XMLHttpRequest()\nxhr2.open("POST", "/api/submit")\nxhr2.setRequestHeader("Content-Type", "application/json")\nxhr2.send(JSON.stringify({ name: "Alice" }))</code></pre>',
    tags: ['XHR', 'Ajax', 'XMLHttpRequest']
  },
  'fetch-api': {
    title: 'Fetch API',
    body: '<p class="lead">Fetch API 是现代浏览器提供的 Promise 风格的网络请求接口。</p><pre><code>// GET 请求\nfetch("/api/data")\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err))\n\n// POST 请求\nfetch("/api/submit", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ name: "Alice" })\n})\n\n// async/await\nasync function getData() {\n  try {\n    const res = await fetch("/api/data")\n    const data = await res.json()\n    return data\n  } catch (err) {\n    console.error(err)\n  }\n}</code></pre>',
    tags: ['Fetch', 'Promise', '现代API']
  },
  axios: {
    title: 'Axios 库',
    body: '<p class="lead">Axios 是基于 Promise 的 HTTP 客户端，支持浏览器和 Node.js。</p><pre><code>// 安装\nnpm install axios\n\n// 基本使用\nimport axios from "axios"\n\naxios.get("/api/users")\n  .then(res => console.log(res.data))\n  .catch(err => console.error(err))\n\n// POST 请求\naxios.post("/api/users", { name: "Alice" })\n\n// 拦截器\naxios.interceptors.request.use(config => {\n  config.headers.Authorization = `Bearer ${token}`\n  return config\n})\n\n// 并发请求\nPromise.all([\n  axios.get("/api/users"),\n  axios.get("/api/posts")\n])</code></pre>',
    tags: ['Axios', 'HTTP客户端', '拦截器']
  },
  cors: {
    title: '跨域资源共享 CORS',
    body: '<p class="lead">CORS 是一种安全机制，允许服务器声明哪些源可以访问资源。</p><pre><code>// 服务端响应头\nAccess-Control-Allow-Origin: https://example.com\nAccess-Control-Allow-Methods: GET, POST, PUT\nAccess-Control-Allow-Headers: Content-Type\nAccess-Control-Allow-Credentials: true\n\n// 预检请求（OPTIONS）\nOPTIONS /api/data\nOrigin: https://example.com\nAccess-Control-Request-Method: POST\n\n// 携带凭证\nfetch("/api/data", {\n  credentials: "include"\n})</code></pre>',
    tags: ['CORS', '跨域', '安全']
  },
  websocket: {
    title: 'WebSocket',
    body: '<p class="lead">WebSocket 提供全双工通信通道，适用于实时应用。</p><pre><code>// 客户端\nconst ws = new WebSocket("wss://example.com/ws")\n\nws.onopen = () => {\n  ws.send("Hello Server")\n}\n\nws.onmessage = (event) => {\n  console.log("收到:", event.data)\n}\n\nws.onclose = () => console.log("连接关闭")\n\n// 发送数据\nws.send(JSON.stringify({ type: "message", data: {} }))</code></pre>',
    tags: ['WebSocket', '实时通信', '全双工']
  },
  sse: {
    title: 'Server-Sent Events',
    body: '<p class="lead">SSE 允许服务器向客户端单向推送事件。</p><pre><code>// 客户端\nconst eventSource = new EventSource("/events")\n\neventSource.onmessage = (event) => {\n  console.log("收到:", event.data)\n}\n\neventSource.addEventListener("user-update", (e) => {\n  console.log(JSON.parse(e.data))\n})\n\n// 服务端（Node.js）\nres.writeHead(200, {\n  "Content-Type": "text/event-stream",\n  "Cache-Control": "no-cache"\n})\nsetInterval(() => {\n  res.write(`data: ${JSON.stringify({ time: Date.now() })}\\n\\n`)\n}, 1000)</code></pre>',
    tags: ['SSE', '服务器推送', 'EventSource']
  },
  webtransport: {
    title: 'WebTransport',
    body: '<p class="lead">WebTransport 是新兴的传输 API，结合了 WebSocket 和 QUIC 的优点。</p><pre><code>// 创建连接\nconst transport = new WebTransport("https://example.com/wt")\nawait transport.ready\n\n// 发送数据流\nconst writer = transport.createSendStream().getWriter()\nawait writer.write(new Uint8Array([1, 2, 3]))\n\n// 接收数据流\nconst reader = transport.receiveStreams()\nfor await (const stream of reader) {\n  // 处理流数据\n}</code></pre>',
    tags: ['WebTransport', 'QUIC', '现代API']
  },
  webrtc: {
    title: 'WebRTC',
    body: '<p class="lead">WebRTC 支持浏览器之间的实时音视频通信和数据共享。</p><pre><code>// 获取媒体流\nconst stream = await navigator.mediaDevices.getUserMedia({\n  video: true,\n  audio: true\n})\n\n// 创建 RTCPeerConnection\nconst pc = new RTCPeerConnection()\nstream.getTracks().forEach(track => {\n  pc.addTrack(track, stream)\n})\n\n// 创建 offer\nconst offer = await pc.createOffer()\nawait pc.setLocalDescription(offer)\n\n// 信令交换\n// 通过 WebSocket 发送 offer 和 answer</code></pre>',
    tags: ['WebRTC', '音视频', 'P2P']
  },
  mediastream: {
    title: 'MediaStream API',
    body: '<p class="lead">MediaStream API 用于获取和处理媒体流数据。</p><pre><code>// 获取摄像头\nconst stream = await navigator.mediaDevices.getUserMedia({ video: true })\nconst video = document.querySelector("video")\nvideo.srcObject = stream\n\n// 屏幕共享\nconst screenStream = await navigator.mediaDevices.getDisplayMedia()\n\n// 录制\nconst recorder = new MediaRecorder(stream)\nrecorder.ondataavailable = (e) => {\n  const blob = e.data\n  const url = URL.createObjectURL(blob)\n}\nrecorder.start()</code></pre>',
    tags: ['MediaStream', '摄像头', '屏幕共享']
  },
  'rtp-rtcp': {
    title: 'RTP/RTCP 协议',
    body: '<p class="lead">RTP 用于实时传输音视频数据，RTCP 用于传输控制信息。</p><pre><code>// RTP 特点\n- 实时传输协议\n- 支持序列号和时间戳\n- 常用于 WebRTC\n\n// RTCP 功能\n- 传输质量反馈\n- 同步多个流\n- 参与者信息</code></pre>',
    tags: ['RTP', 'RTCP', '实时传输']
  },
  'tcp-vs-udp': {
    title: 'TCP vs UDP',
    body: '<p class="lead">TCP 和 UDP 是传输层的两种核心协议，各有特点。</p><table class="mdn-table"><thead><tr><th>特性</th><th>TCP</th><th>UDP</th></thead><tbody><tr><td>连接方式</td><td>面向连接</td><td>无连接</td></tr><tr><td>可靠性</td><td>可靠</td><td>不可靠</td></tr><tr><td>速度</td><td>较慢</td><td>快</td></tr><tr><td>应用场景</td><td>HTTP, FTP, SSH</td><td>DNS, VoIP, 游戏</td></tr></tbody></table>',
    tags: ['TCP', 'UDP', '传输协议']
  },
  quic: {
    title: 'QUIC 协议',
    body: '<p class="lead">QUIC 是基于 UDP 的传输协议，是 HTTP/3 的基础。</p><pre><code>// QUIC 优势\n- 0-RTT 连接建立\n- 无队头阻塞\n- 连接迁移\n- 内置 TLS 1.3\n\n// 使用场景\n- HTTP/3\n- WebTransport\n- 实时应用</code></pre>',
    tags: ['QUIC', 'HTTP/3', 'UDP']
  },
  'data-encoding': {
    title: '数据传输编码',
    body: '<p class="lead">网络传输中常用的数据编码格式。</p><pre><code>// JSON\n{"name":"Alice","age":25}\n\n// URL 编码\nname=Alice&age=25\n\n// Base64\ndGVzdA==\n\n// Protobuf（二进制）\n// 更小、更快\n\n// MessagePack（二进制）\n// JSON 兼容的二进制格式</code></pre>',
    tags: ['编码', 'JSON', 'Base64']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考网络通信相关文档获取更多信息。</p>',
        tags: ['网络通信', '协议']
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

addLink('network-intro', 'osi-model')
addLink('osi-model', 'tcp-ip')
addLink('tcp-ip', 'ip-address')
addLink('http-intro', 'http-methods')
addLink('http-methods', 'http-status')
addLink('http-status', 'http-headers')
addLink('http-headers', 'http-versions')
addLink('https-intro', 'ssl-tls')
addLink('ssl-tls', 'certificate')
addLink('xhr', 'fetch-api')
addLink('fetch-api', 'axios')
addLink('axios', 'cors')
addLink('websocket', 'sse')
addLink('sse', 'webtransport')
addLink('webrtc', 'mediastream')
addLink('mediastream', 'rtp-rtcp')
addLink('tcp-vs-udp', 'quic')
addLink('quic', 'data-encoding')

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