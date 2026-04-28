<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">BOM 知识库</h1>
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
          <h2>🌐 <span class="gradient-text">BOM 完全指南</span></h2>
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
          <p>🌐 浏览器对象模型 | 与浏览器交互的接口</p>
          <p>✨ 点击节点双向联动 | Web API 核心</p>
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
          <h3>🔗 BOM 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'BOM开发者'
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

// ========== BOM 导航数据 ==========
const navSections = ref([
  { title: '📖 BOM 基础', items: [
      { id: 'bom-intro', label: 'BOM 简介', hot: true },
      { id: 'window-object', label: 'Window 对象', hot: true },
      { id: 'browser-detection', label: '浏览器检测', hot: true }
    ]},
  { title: '🪟 窗口与弹窗', items: [
      { id: 'window-open', label: '窗口打开与关闭', hot: true },
      { id: 'dialogs', label: '对话框', hot: true },
      { id: 'frames', label: '框架与 iframe' }
    ]},
  { title: '📍 位置与导航', items: [
      { id: 'location-object', label: 'Location 对象', hot: true },
      { id: 'history-object', label: 'History 对象', hot: true },
      { id: 'navigation', label: '页面导航', hot: true }
    ]},
  { title: '🖥️ 屏幕与视口', items: [
      { id: 'screen-object', label: 'Screen 对象', hot: true },
      { id: 'viewport', label: '视口尺寸', hot: true },
      { id: 'scroll-control', label: '滚动控制', hot: true }
    ]},
  { title: '⏱️ 定时器与动画', items: [
      { id: 'timers', label: '定时器', hot: true },
      { id: 'request-animation', label: 'requestAnimationFrame', hot: true },
      { id: 'idle-callback', label: 'requestIdleCallback' }
    ]},
  { title: '💾 存储与缓存', items: [
      { id: 'local-storage', label: 'localStorage', hot: true },
      { id: 'session-storage', label: 'sessionStorage', hot: true },
      { id: 'cookies', label: 'Cookies', hot: true },
      { id: 'cache-api', label: 'Cache API' }
    ]},
  { title: '🔌 浏览器能力', items: [
      { id: 'geolocation', label: '地理位置', hot: true },
      { id: 'clipboard', label: '剪贴板', hot: true },
      { id: 'notifications', label: '通知', hot: true },
      { id: 'vibration', label: '振动' }
    ]}
])

const selectedId = ref('bom-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== BOM 内容映射表 ==========
const contentMap = {
  'bom-intro': {
    title: 'BOM 简介',
    body: '<p class="lead">BOM（Browser Object Model，浏览器对象模型）是浏览器提供的用于与浏览器窗口进行交互的对象集合，它允许 JavaScript 与浏览器进行对话。</p><h3>核心对象</h3><ul><li><strong>window</strong>：BOM 的核心对象，代表浏览器窗口</li><li><strong>navigator</strong>：包含浏览器信息</li><li><strong>location</strong>：管理当前页面的 URL</li><li><strong>history</strong>：管理浏览器历史记录</li><li><strong>screen</strong>：获取用户屏幕信息</li></ul><div class="note">💡 BOM 没有官方标准，但已被所有浏览器广泛实现，W3C 正在逐步标准化。</div>',
    tags: ['BOM', '浏览器对象', 'window']
  },
  'window-object': {
    title: 'Window 对象',
    body: '<p class="lead">window 对象是 BOM 的核心，代表浏览器窗口，同时也是 JavaScript 的全局对象。</p><pre><code>// window 是全局对象\nconsole.log(window === this);  // true\nconsole.log(window === self);  // true\n\n// 窗口尺寸\nconst innerWidth = window.innerWidth;   // 视口宽度（含滚动条）\nconst innerHeight = window.innerHeight; // 视口高度\nconst outerWidth = window.outerWidth;   // 浏览器窗口宽度\nconst outerHeight = window.outerHeight; // 浏览器窗口高度\n\n// 窗口位置\nconst screenX = window.screenX;  // 窗口左上角 X 坐标\nconst screenY = window.screenY;  // 窗口左上角 Y 坐标\n\n// 窗口操作\nwindow.focus();     // 聚焦窗口\nwindow.blur();      // 让窗口失去焦点\nwindow.resizeTo(800, 600);  // 调整窗口大小\nwindow.resizeBy(100, 50);   // 相对调整\nwindow.moveTo(100, 100);    // 移动窗口位置\nwindow.moveBy(50, 50);      // 相对移动\n\n// 全局属性和方法\nwindow.console.log(\'Hello\');\nwindow.parseInt(\'123\');\nwindow.setTimeout(() =&gt; {}, 1000);</code></pre>',
    tags: ['window', '全局对象', '浏览器窗口']
  },
  'browser-detection': {
    title: '浏览器检测',
    body: '<p class="lead">通过 navigator 对象检测浏览器信息和用户环境。</p><pre><code>// Navigator 对象\nconsole.log(navigator.userAgent);      // 用户代理字符串\nconsole.log(navigator.platform);       // 操作系统平台\nconsole.log(navigator.language);       // 浏览器语言\nconsole.log(navigator.cookieEnabled);  // Cookie 是否启用\nconsole.log(navigator.onLine);         // 是否在线\n\n// 检测浏览器\nconst ua = navigator.userAgent;\nconst isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);\nconst isFirefox = /Firefox/.test(ua);\nconst isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);\nconst isEdge = /Edg/.test(ua);\nconst isMobile = /Mobi|Android|iPhone|iPad/.test(ua);\n\n// 功能检测（推荐）\nif (window.localStorage) {\n  // 支持 localStorage\n}\n\nif (\'serviceWorker\' in navigator) {\n  // 支持 Service Worker\n}</code></pre>',
    tags: ['navigator', 'userAgent', '功能检测']
  },
  'window-open': {
    title: '窗口打开与关闭',
    body: '<p class="lead">使用 window.open 和 window.close 方法控制浏览器窗口。</p><pre><code>// 打开新窗口\nconst newWindow = window.open(\'https://example.com\', \'_blank\');\nconst popup = window.open(\'about:blank\', \'popup\', \'width=400,height=300,left=100,top=100\');\n\n// 参数说明\n// - URL: 要加载的页面地址\n// - name: 窗口名称或目标（_blank, _self, _parent, _top）\n// - features: 窗口特性（大小、位置、工具栏等）\n\n// 新窗口操作\nif (newWindow) {\n  newWindow.focus();                    // 聚焦新窗口\n  newWindow.resizeTo(800, 600);        // 调整大小\n  newWindow.moveTo(200, 200);          // 移动位置\n  newWindow.close();                   // 关闭窗口\n}\n\n// 关闭当前窗口\nwindow.close();  // 仅对通过脚本打开的窗口有效\n\n// 检查窗口是否关闭\nconst isClosed = newWindow.closed;\n\n// 跨窗口通信\n// 父窗口可以访问子窗口的属性和方法\nnewWindow.document.body.style.backgroundColor = \'red\';\n\n// 子窗口可以通过 opener 访问父窗口\nif (window.opener) {\n  window.opener.console.log(\'来自子窗口的消息\');\n}</code></pre>',
    tags: ['window.open', '窗口', '弹窗']
  },
  dialogs: {
    title: '对话框',
    body: '<p class="lead">浏览器提供的三种内置对话框。</p><pre><code>// alert - 警告框（阻塞）\nalert(\'这是一个警告消息\');\n\n// confirm - 确认框（返回布尔值）\nconst result = confirm(\'确定要删除吗？\');\nif (result) {\n  console.log(\'用户点击了确定\');\n} else {\n  console.log(\'用户点击了取消\');\n}\n\n// prompt - 输入框（返回输入的字符串或 null）\nconst name = prompt(\'请输入您的名字\', \'默认值\');\nif (name !== null) {\n  console.log(`你好, ${name}`);\n}\n\n// 注意：这些对话框会阻塞 JavaScript 执行和用户交互\n// 现代开发中更推荐使用自定义模态框</code></pre>',
    tags: ['alert', 'confirm', 'prompt']
  },
  frames: {
    title: '框架与 iframe',
    body: '<p class="lead">通过 window.frames 访问页面中的框架和 iframe。</p><pre><code>&lt;iframe name="myFrame" src="page.html"&gt;&lt;/iframe&gt;\n&lt;iframe id="myIframe" src="other.html"&gt;&lt;/iframe&gt;\n\n&lt;script&gt;\n// 访问框架\nconst frames = window.frames;           // 所有框架的集合\nconst frame = window.frames[0];         // 通过索引访问\nconst namedFrame = window.frames[\'myFrame\'];  // 通过 name 访问\n\n// 通过 DOM 获取 iframe 元素\nconst iframe = document.getElementById(\'myIframe\');\nconst iframeWindow = iframe.contentWindow;  // 获取 iframe 的 window 对象\nconst iframeDocument = iframe.contentDocument;  // 获取 iframe 的 document\n\n// 跨框架通信\niframeWindow.postMessage(\'Hello from parent\', \'https://example.com\');\n\n// 监听来自 iframe 的消息\nwindow.addEventListener(\'message\', (event) =&gt; {\n  if (event.origin !== \'https://trusted-site.com\') return;\n  console.log(\'收到消息:\', event.data);\n});\n\n// 父框架访问\nif (window.parent !== window) {\n  console.log(\'当前页面在 iframe 中\');\n  window.parent.postMessage(\'Hello parent\', \'*\');\n}\n&lt;/script&gt;</code></pre>',
    tags: ['iframe', 'frames', '跨窗口通信']
  },
  'location-object': {
    title: 'Location 对象',
    body: '<p class="lead">location 对象提供当前页面 URL 的信息和操作方法。</p><pre><code>// 获取 URL 各部分\nconsole.log(location.href);      // 完整 URL\nconsole.log(location.protocol);  // 协议 (https:)\nconsole.log(location.host);      // 主机名 + 端口\nconsole.log(location.hostname);  // 主机名\nconsole.log(location.port);      // 端口号\nconsole.log(location.pathname);  // 路径\nconsole.log(location.search);    // 查询字符串 (?id=123)\nconsole.log(location.hash);      // 锚点 (#section)\nconsole.log(location.origin);    // 源 (https://example.com)\n\n// 解析查询参数\nconst params = new URLSearchParams(location.search);\nconst id = params.get(\'id\');\n\n// 页面跳转\nlocation.href = \'https://example.com\';  // 跳转新页面\nlocation.assign(\'https://example.com\'); // 同 href，可返回\nlocation.replace(\'https://example.com\'); // 替换当前历史记录，不可返回\nlocation.reload();                       // 重新加载\nlocation.reload(true);                   // 强制从服务器重新加载\n\n// 修改 hash（不会重新加载页面）\nlocation.hash = \'section2\';\n\n// 监听 hash 变化\nwindow.addEventListener(\'hashchange\', () =&gt; {\n  console.log(\'Hash changed to:\', location.hash);\n});</code></pre>',
    tags: ['location', 'URL', '导航']
  },
  'history-object': {
    title: 'History 对象',
    body: '<p class="lead">history 对象用于管理浏览器会话历史记录。</p><pre><code>// 历史记录导航\nhistory.back();    // 后退一页\nhistory.forward(); // 前进一页\nhistory.go(-2);    // 后退两页\nhistory.go(1);     // 前进一页\nhistory.go(0);     // 刷新当前页\n\n// 历史记录长度\nconst length = history.length;\nconsole.log(`历史记录数量: ${length}`);\n\n// 修改历史记录（不刷新页面）\n// pushState - 添加新历史记录\nhistory.pushState({ page: 1 }, \'标题\', \'/page1\');\n\n// replaceState - 替换当前历史记录\nhistory.replaceState({ page: 2 }, \'标题\', \'/page2\');\n\n// 监听 popstate 事件（用户点击前进/后退时触发）\nwindow.addEventListener(\'popstate\', (event) =&gt; {\n  console.log(\'State:\', event.state);\n  console.log(\'Location:\', location.href);\n});\n\n// SPA 路由示例\nfunction navigate(path, data) {\n  history.pushState(data, \'\', path);\n  updatePage(path);  // 更新页面内容\n}\n\nwindow.addEventListener(\'popstate\', () =&gt; {\n  updatePage(location.pathname);\n});</code></pre>',
    tags: ['history', '前进后退', 'SPA路由']
  },
  navigation: {
    title: '页面导航',
    body: '<p class="lead">多种页面导航方式和页面加载事件。</p><pre><code>// 页面跳转方式\nwindow.location.href = \'https://example.com\';\nwindow.location.assign(\'https://example.com\');\nwindow.location.replace(\'https://example.com\');  // 不可返回\nwindow.open(\'https://example.com\', \'_blank\');     // 新标签页\n\n// 页面加载事件\n// DOMContentLoaded - DOM 解析完成\ndocument.addEventListener(\'DOMContentLoaded\', () =&gt; {\n  console.log(\'DOM 已加载，可以操作 DOM\');\n});\n\n// load - 所有资源加载完成\nwindow.addEventListener(\'load\', () =&gt; {\n  console.log(\'页面完全加载完成\');\n});\n\n// beforeunload - 页面卸载前（可用于提示保存）\nwindow.addEventListener(\'beforeunload\', (event) =&gt; {\n  event.preventDefault();\n  event.returnValue = \'\';  // 显示确认对话框\n});\n\n// unload - 页面卸载时\nwindow.addEventListener(\'unload\', () =&gt; {\n  console.log(\'页面正在卸载\');\n});\n\n// pageshow / pagehide（处理 bfcache）\nwindow.addEventListener(\'pageshow\', (event) =&gt; {\n  if (event.persisted) {\n    console.log(\'页面从 bfcache 恢复\');\n  }\n});</code></pre>',
    tags: ['导航', '页面事件', '加载']
  },
  'screen-object': {
    title: 'Screen 对象',
    body: '<p class="lead">screen 对象提供用户屏幕的信息。</p><pre><code>// 屏幕尺寸\nconst width = screen.width;        // 屏幕宽度（像素）\nconst height = screen.height;      // 屏幕高度（像素）\n\n// 可用屏幕尺寸（排除任务栏等）\nconst availWidth = screen.availWidth;\nconst availHeight = screen.availHeight;\n\n// 颜色深度\nconst colorDepth = screen.colorDepth;  // 颜色位数\nconst pixelDepth = screen.pixelDepth;  // 像素深度\n\n// 屏幕方向\nconst orientation = screen.orientation;\nconsole.log(orientation.type);  // landscape-primary, portrait-primary\n\n// 监听屏幕方向变化\nscreen.orientation.addEventListener(\'change\', () =&gt; {\n  console.log(\'屏幕方向改变:\', screen.orientation.type);\n});\n\n// 检测屏幕尺寸\nconst isSmallScreen = screen.width &lt; 768;\nconst isRetina = window.devicePixelRatio &gt; 1;</code></pre>',
    tags: ['screen', '屏幕', '分辨率']
  },
  viewport: {
    title: '视口尺寸',
    body: '<p class="lead">获取浏览器视口（可视区域）的尺寸信息。</p><pre><code>// 视口尺寸（不包含滚动条）\nconst viewportWidth = window.innerWidth;\nconst viewportHeight = window.innerHeight;\n\n// 文档总尺寸\nconst docWidth = document.documentElement.scrollWidth;\nconst docHeight = document.documentElement.scrollHeight;\n\n// 获取视口尺寸（兼容 IE）\nconst getViewportSize = () =&gt; {\n  return {\n    width: window.innerWidth || document.documentElement.clientWidth,\n    height: window.innerHeight || document.documentElement.clientHeight\n  };\n};\n\n// 响应式检测\nconst isMobile = window.innerWidth &lt; 768;\nconst isTablet = window.innerWidth &gt;= 768 && window.innerWidth &lt; 1024;\nconst isDesktop = window.innerWidth &gt;= 1024;\n\n// 监听视口变化\nlet resizeTimer;\nwindow.addEventListener(\'resize\', () =&gt; {\n  clearTimeout(resizeTimer);\n  resizeTimer = setTimeout(() =&gt; {\n    console.log(`视口大小: ${window.innerWidth} x ${window.innerHeight}`);\n  }, 250);\n});</code></pre>',
    tags: ['视口', 'innerWidth', '响应式']
  },
  'scroll-control': {
    title: '滚动控制',
    body: '<p class="lead">控制页面和元素的滚动行为。</p><pre><code>// 页面滚动\nwindow.scrollTo(0, 100);                    // 滚动到指定位置\nwindow.scrollTo({ top: 100, behavior: \'smooth\' }); // 平滑滚动\nwindow.scrollBy(0, 50);                     // 相对滚动\n\n// 获取滚动位置\nconst scrollY = window.scrollY;              // 垂直滚动距离\nconst scrollX = window.scrollX;              // 水平滚动距离\n\n// 滚动到元素\nelement.scrollIntoView();\nelement.scrollIntoView({ behavior: \'smooth\', block: \'center\' });\n\n// 监听滚动（节流优化）\nlet ticking = false;\nwindow.addEventListener(\'scroll\', () =&gt; {\n  if (!ticking) {\n    requestAnimationFrame(() =&gt; {\n      console.log(\'滚动位置:\', window.scrollY);\n      ticking = false;\n    });\n    ticking = true;\n  }\n});\n\n// 无限滚动检测\nwindow.addEventListener(\'scroll\', () =&gt; {\n  const scrollTop = window.scrollY;\n  const windowHeight = window.innerHeight;\n  const documentHeight = document.documentElement.scrollHeight;\n  \n  if (scrollTop + windowHeight &gt;= documentHeight - 100) {\n    console.log(\'接近底部，加载更多内容\');\n  }\n});</code></pre>',
    tags: ['滚动', 'scroll', '平滑滚动']
  },
  timers: {
    title: '定时器',
    body: '<p class="lead">使用 setTimeout 和 setInterval 执行延时或周期性任务。</p><pre><code>// setTimeout - 延时执行\nconst timeoutId = setTimeout(() =&gt; {\n  console.log(\'1 秒后执行\');\n}, 1000);\n\n// 清除 setTimeout\nclearTimeout(timeoutId);\n\n// setInterval - 周期性执行\nlet count = 0;\nconst intervalId = setInterval(() =&gt; {\n  count++;\n  console.log(`第 ${count} 次执行`);\n  if (count === 5) {\n    clearInterval(intervalId);  // 清除定时器\n  }\n}, 1000);\n\n// 递归 setTimeout（更精确的间隔）\nfunction repeatTask() {\n  console.log(\'执行任务\');\n  setTimeout(repeatTask, 1000);\n}\nsetTimeout(repeatTask, 1000);\n\n// 延时 0 毫秒（放入事件队列末尾）\nsetTimeout(() =&gt; {\n  console.log(\'在所有同步代码执行后执行\');\n}, 0);\n\n// 清除所有定时器\nconst highestId = setTimeout(() =&gt; {});\nfor (let i = 1; i &lt;= highestId; i++) {\n  clearTimeout(i);\n  clearInterval(i);\n}</code></pre>',
    tags: ['setTimeout', 'setInterval', '定时器']
  },
  'request-animation': {
    title: 'requestAnimationFrame',
    body: '<p class="lead">requestAnimationFrame 用于创建高性能动画，与浏览器刷新率同步。</p><pre><code>// 基本用法\nlet startTime = null;\nlet requestId = null;\n\nfunction animate(timestamp) {\n  if (!startTime) startTime = timestamp;\n  const elapsed = timestamp - startTime;\n  \n  // 更新动画\n  const progress = Math.min(elapsed / 2000, 1);\n  element.style.transform = `translateX(${progress * 100}px)`;\n  \n  if (elapsed &lt; 2000) {\n    requestId = requestAnimationFrame(animate);\n  }\n}\n\nrequestId = requestAnimationFrame(animate);\n\n// 取消动画\ncancelAnimationFrame(requestId);\n\n// 节流使用\nlet rafId = null;\nfunction throttleScroll() {\n  if (rafId) return;\n  rafId = requestAnimationFrame(() =&gt; {\n    console.log(\'滚动位置:\', window.scrollY);\n    rafId = null;\n  });\n}\nwindow.addEventListener(\'scroll\', throttleScroll);\n\n// 帧率监测\nlet frameCount = 0;\nlet lastTime = performance.now();\nfunction countFPS() {\n  frameCount++;\n  const now = performance.now();\n  if (now - lastTime >= 1000) {\n    console.log(`FPS: ${frameCount}`);\n    frameCount = 0;\n    lastTime = now;\n  }\n  requestAnimationFrame(countFPS);\n}</code></pre>',
    tags: ['requestAnimationFrame', '动画', '性能']
  },
  'idle-callback': {
    title: 'requestIdleCallback',
    body: '<p class="lead">requestIdleCallback 在浏览器空闲时执行任务，不影响关键渲染。</p><pre><code>// 基本用法\nconst handle = requestIdleCallback((deadline) =&gt; {\n  console.log(`剩余时间: ${deadline.timeRemaining()}`);\n  console.log(`是否超时: ${deadline.didTimeout}`);\n  \n  // 在空闲时间执行任务\n  while (deadline.timeRemaining() > 0 && tasks.length > 0) {\n    const task = tasks.shift();\n    task();\n  }\n}, { timeout: 2000 });  // 超时后强制执行\n\n// 取消回调\ncancelIdleCallback(handle);\n\n// 批量处理任务\nconst tasks = [];\nfunction addTask(fn) {\n  tasks.push(fn);\n  scheduleWork();\n}\n\nfunction scheduleWork() {\n  requestIdleCallback((deadline) =&gt; {\n    while (deadline.timeRemaining() > 0 && tasks.length > 0) {\n      const task = tasks.shift();\n      task();\n    }\n    if (tasks.length > 0) {\n      scheduleWork();\n    }\n  });\n}\n\n// 用于：日志上报、预加载、非关键数据处理等</code></pre>',
    tags: ['requestIdleCallback', '空闲时间', '性能优化']
  },
  'local-storage': {
    title: 'localStorage',
    body: '<p class="lead">localStorage 提供持久化的本地存储，数据不会过期。</p><pre><code>// 存储数据\nlocalStorage.setItem(\'key\', \'value\');\nlocalStorage.setItem(\'user\', JSON.stringify({ name: \'John\', age: 30 }));\n\n// 读取数据\nconst value = localStorage.getItem(\'key\');\nconst user = JSON.parse(localStorage.getItem(\'user\') || \'{}\');\n\n// 删除数据\nlocalStorage.removeItem(\'key\');\n\n// 清空所有数据\nlocalStorage.clear();\n\n// 获取存储数量\nconst length = localStorage.length;\n\n// 遍历所有数据\nfor (let i = 0; i &lt; localStorage.length; i++) {\n  const key = localStorage.key(i);\n  const value = localStorage.getItem(key);\n  console.log(`${key}: ${value}`);\n}\n\n// 监听存储变化（同源其他页面触发）\nwindow.addEventListener(\'storage\', (event) =&gt; {\n  console.log(\'Key:\', event.key);\n  console.log(\'Old value:\', event.oldValue);\n  console.log(\'New value:\', event.newValue);\n  console.log(\'URL:\', event.url);\n});\n\n// 存储空间检测\ntry {\n  localStorage.setItem(\'test\', \'test\');\n  localStorage.removeItem(\'test\');\n} catch (e) {\n  console.log(\'存储空间已满或禁用\');\n}</code></pre>',
    tags: ['localStorage', '持久化', '本地存储']
  },
  'session-storage': {
    title: 'sessionStorage',
    body: '<p class="lead">sessionStorage 提供会话级别的存储，数据在页面关闭后清除。</p><pre><code>// API 与 localStorage 相同\nsessionStorage.setItem(\'key\', \'value\');\nconst value = sessionStorage.getItem(\'key\');\nsessionStorage.removeItem(\'key\');\nsessionStorage.clear();\n\n// 存储对象\nconst session = {\n  token: \'abc123\',\n  loginTime: Date.now()\n};\nsessionStorage.setItem(\'session\', JSON.stringify(session));\n\n// 特点\n// - 同源、同窗口（标签页）共享\n// - 不同标签页之间隔离\n// - 关闭标签页后数据清除\n// - 页面刷新数据保留\n\n// 适用场景\n// - 表单临时数据\n// - 会话状态\n// - 一次性消息提示</code></pre>',
    tags: ['sessionStorage', '会话存储', '临时数据']
  },
  cookies: {
    title: 'Cookies',
    body: '<p class="lead">Cookies 是服务器发送到浏览器并保存在本地的小块数据。</p><pre><code>// 设置 Cookie\ndocument.cookie = \'username=John; path=/; max-age=3600; secure; samesite=lax\';\n\n// 读取 Cookie\nconst cookies = document.cookie;  // \'username=John; theme=dark\'\n\n// 解析 Cookie\nfunction getCookie(name) {\n  const value = `; ${document.cookie}`;\n  const parts = value.split(`; ${name}=`);\n  if (parts.length === 2) return parts.pop().split(\';\').shift();\n  return null;\n}\n\n// 删除 Cookie\nfunction deleteCookie(name) {\n  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;\n}\n\n// Cookie 属性\n// - expires/max-age: 过期时间\n// - path: 生效路径\n// - domain: 生效域名\n// - secure: 仅 HTTPS 传输\n// - samesite: 跨站请求控制（strict/lax/none）\n// - HttpOnly: 无法通过 JS 访问（安全）\n\n// 设置 Cookie 工具函数\nfunction setCookie(name, value, days = 7) {\n  const expires = new Date(Date.now() + days * 864e5).toUTCString();\n  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax`;\n}</code></pre>',
    tags: ['cookies', 'document.cookie', '存储']
  },
  'cache-api': {
    title: 'Cache API',
    body: '<p class="lead">Cache API 用于存储网络请求和响应的缓存，主要用于 Service Worker。</p><pre><code>// 打开缓存\nconst cache = await caches.open(\'my-cache-v1\');\n\n// 存储请求响应\nawait cache.put(\'/api/data\', new Response(\'{\\\"data\\\":123}\'));\n\n// 添加多个资源\nawait cache.addAll([\'/\', \'/styles.css\', \'/script.js\']);\n\n// 读取缓存\nconst response = await cache.match(\'/api/data\');\nconst data = await response.json();\n\n// 删除缓存项\nawait cache.delete(\'/old-resource\');\n\n// 获取所有缓存 key\nconst keys = await cache.keys();\n\n// 删除整个缓存\nawait caches.delete(\'old-cache-v1\');\n\n// 检查缓存是否存在\nconst hasCache = await caches.has(\'my-cache\');\n\n// 网络优先策略\nasync function fetchWithCache(url) {\n  try {\n    const response = await fetch(url);\n    const cache = await caches.open(\'dynamic\');\n    cache.put(url, response.clone());\n    return response;\n  } catch (error) {\n    const cached = await caches.match(url);\n    return cached || new Response(\'离线无缓存\');\n  }\n}</code></pre>',
    tags: ['Cache API', 'Service Worker', '缓存']
  },
  geolocation: {
    title: '地理位置',
    body: '<p class="lead">Geolocation API 获取用户的地理位置信息。</p><pre><code>// 检查支持\nif (\'geolocation\' in navigator) {\n  console.log(\'浏览器支持地理位置\');\n}\n\n// 获取当前位置\nnavigator.geolocation.getCurrentPosition(\n  (position) =&gt; {\n    console.log(\'纬度:\', position.coords.latitude);\n    console.log(\'经度:\', position.coords.longitude);\n    console.log(\'精度:\', position.coords.accuracy);\n    console.log(\'海拔:\', position.coords.altitude);\n    console.log(\'速度:\', position.coords.speed);\n    console.log(\'时间戳:\', position.timestamp);\n  },\n  (error) =&gt; {\n    switch(error.code) {\n      case error.PERMISSION_DENIED:\n        console.log(\'用户拒绝授权\');\n        break;\n      case error.POSITION_UNAVAILABLE:\n        console.log(\'位置信息不可用\');\n        break;\n      case error.TIMEOUT:\n        console.log(\'获取位置超时\');\n        break;\n    }\n  },\n  {\n    enableHighAccuracy: true,  // 高精度\n    timeout: 5000,             // 超时时间\n    maximumAge: 0              // 缓存时间\n  }\n);\n\n// 持续监听位置变化\nconst watchId = navigator.geolocation.watchPosition(\n  (position) =&gt; console.log(\'位置更新:\', position.coords),\n  (error) =&gt; console.error(error)\n);\n\n// 停止监听\nnavigator.geolocation.clearWatch(watchId);</code></pre>',
    tags: ['geolocation', '地理位置', 'GPS']
  },
  clipboard: {
    title: '剪贴板',
    body: '<p class="lead">Clipboard API 提供了读写系统剪贴板的能力。</p><pre><code>// 写入文本\nasync function copyText(text) {\n  try {\n    await navigator.clipboard.writeText(text);\n    console.log(\'复制成功\');\n  } catch (err) {\n    console.error(\'复制失败:\', err);\n  }\n}\n\n// 读取文本\nasync function pasteText() {\n  try {\n    const text = await navigator.clipboard.readText();\n    console.log(\'粘贴内容:\', text);\n    return text;\n  } catch (err) {\n    console.error(\'读取失败:\', err);\n  }\n}\n\n// 写入图片\nasync function copyImage(imageBlob) {\n  try {\n    await navigator.clipboard.write([\n      new ClipboardItem({\n        [imageBlob.type]: imageBlob\n      })\n    ]);\n  } catch (err) {\n    console.error(err);\n  }\n}\n\n// 监听粘贴事件\ndocument.addEventListener(\'paste\', async (e) =&gt; {\n  const items = e.clipboardData.items;\n  for (const item of items) {\n    if (item.type.indexOf(\'image\') !== -1) {\n      const blob = item.getAsFile();\n      console.log(\'图片:\', blob);\n    }\n  }\n});\n\n// 降级方案（使用 execCommand）\nfunction fallbackCopy(text) {\n  const textarea = document.createElement(\'textarea\');\n  textarea.value = text;\n  document.body.appendChild(textarea);\n  textarea.select();\n  document.execCommand(\'copy\');\n  document.body.removeChild(textarea);\n}</code></pre>',
    tags: ['clipboard', '剪贴板', '复制粘贴']
  },
  notifications: {
    title: '通知',
    body: '<p class="lead">Notification API 用于向用户显示桌面通知。</p><pre><code>// 请求权限\nNotification.requestPermission().then(permission =&gt; {\n  if (permission === \'granted\') {\n    console.log(\'通知权限已授权\');\n  }\n});\n\n// 发送通知\nfunction showNotification(title, options = {}) {\n  if (Notification.permission === \'granted\') {\n    const notification = new Notification(title, {\n      body: options.body || \'\',\n      icon: options.icon || \'/icon.png\',\n      tag: options.tag || \'default\',\n      requireInteraction: options.requireInteraction || false,\n      silent: options.silent || false,\n      data: options.data || {}\n    });\n\n    notification.onclick = () =&gt; {\n      console.log(\'通知被点击\');\n      window.focus();\n      notification.close();\n    };\n\n    notification.onclose = () =&gt; console.log(\'通知关闭\');\n  }\n}\n\n// 示例\nshowNotification(\'新消息\', {\n  body: \'您收到一条新消息\',\n  icon: \'/message.png\',\n  tag: \'message-123\'\n});\n\n// 关闭所有通知\nNotification.requestPermission().then(() =&gt; {\n  // 关闭特定通知需要保存引用\n});</code></pre>',
    tags: ['Notification', '桌面通知', '推送']
  },
  vibration: {
    title: '振动',
    body: '<p class="lead">Vibration API 用于控制设备振动（移动端）。</p><pre><code>// 检查支持\nif (\'vibrate\' in navigator) {\n  console.log(\'支持振动\');\n}\n\n// 单次振动（毫秒）\nnavigator.vibrate(200);\n\n// 振动模式（交替振动和暂停）\nnavigator.vibrate([200, 100, 200, 100, 500]);\n\n// 停止振动\nnavigator.vibrate(0);\nnavigator.vibrate([]);\n\n// 示例：按钮振动反馈\ndocument.querySelector(\'button\').addEventListener(\'click\', () =&gt; {\n  navigator.vibrate(50);\n});\n\n// 长按振动\nelement.addEventListener(\'contextmenu\', (e) =&gt; {\n  e.preventDefault();\n  navigator.vibrate(100);\n});</code></pre>',
    tags: ['vibrate', '振动', '移动端']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 MDN BOM 文档获取更多信息。</p>',
        tags: ['BOM', '浏览器API']
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

addLink('bom-intro', 'window-object')
addLink('bom-intro', 'browser-detection')
addLink('window-object', 'window-open')
addLink('window-object', 'dialogs')
addLink('window-object', 'frames')
addLink('location-object', 'navigation')
addLink('history-object', 'navigation')
addLink('screen-object', 'viewport')
addLink('viewport', 'scroll-control')
addLink('timers', 'request-animation')
addLink('timers', 'idle-callback')
addLink('local-storage', 'session-storage')
addLink('local-storage', 'cookies')
addLink('cookies', 'cache-api')
addLink('geolocation', 'notifications')
addLink('clipboard', 'window-object')

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